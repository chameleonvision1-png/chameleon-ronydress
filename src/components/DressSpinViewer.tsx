"use client";

import * as React from "react";
import { ViewTransition } from "react";
import { Maximize2, MoveHorizontal, Pause, Play, X, ZoomIn } from "lucide-react";
import type { Dress, DressShot } from "@/lib/types";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

interface KeyAngle {
  deg: number;
  shot: DressShot;
  mirror: boolean;
  labelAr: string;
}

function buildKeyAngles(dress: Dress): KeyAngle[] {
  const byAngle = (a: DressShot["angle"]) => dress.shots.find((s) => s.angle === a);
  const front = byAngle("front") || dress.shots[0];
  const tq = byAngle("three-quarter");
  const side = byAngle("side");
  const back = byAngle("back");
  const tqL = byAngle("three-quarter-l");
  const sideL = byAngle("side-l");

  if (!front) return [];

  const keys: KeyAngle[] = [{ deg: 0, shot: front, mirror: false, labelAr: "٠° أمامي" }];
  if (tq) keys.push({ deg: 55, shot: tq, mirror: false, labelAr: "٤٥° يمين" });
  if (side) keys.push({ deg: 95, shot: side, mirror: false, labelAr: "٩٠° جانبي" });
  if (back) keys.push({ deg: 180, shot: back, mirror: false, labelAr: "١٨٠° خلفي" });
  if (sideL) keys.push({ deg: 265, shot: sideL, mirror: false, labelAr: "٢٧٠° جانبي" });
  else if (side) keys.push({ deg: 265, shot: side, mirror: true, labelAr: "٢٧٠° جانبي" });
  if (tqL) keys.push({ deg: 305, shot: tqL, mirror: false, labelAr: "٣١٥° يسار" });
  else if (tq) keys.push({ deg: 305, shot: tq, mirror: true, labelAr: "٣١٥° يسار" });

  return keys.sort((a, b) => a.deg - b.deg);
}

const COMPASS_TICKS = Array.from({ length: 72 }, (_, i) => i * 5);

export function DressSpinViewer({ dress }: { dress: Dress }) {
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const keyAngles = React.useMemo(() => buildKeyAngles(dress), [dress]);
  const detailShots = React.useMemo(
    () => dress.shots.filter((s) => s.angle === "detail"),
    [dress.shots],
  );

  const [mode, setMode] = React.useState<"spin" | "detail">("spin");
  const [detailIdx, setDetailIdx] = React.useState(0);
  const [autoSpin, setAutoSpin] = React.useState(false);
  const [zoomActive, setZoomActive] = React.useState(false);
  const [zoomPos, setZoomPos] = React.useState({ x: 50, y: 38 });
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [activeKeyIdx, setActiveKeyIdx] = React.useState(0);
  const [degReadout, setDegReadout] = React.useState(0);

  useLockBodyScroll(lightboxOpen);

  const dialRef = React.useRef<SVGGElement | null>(null);
  const bodyWrapRef = React.useRef<HTMLDivElement | null>(null);
  const layerRefs = React.useRef<(HTMLImageElement | null)[]>([]);

  const spinRef = React.useRef({
    deg: 0,
    vel: 0,
    targetDeg: null as number | null,
    dragging: false,
    lastX: 0,
    lastT: 0,
    auto: false,
    raf: 0,
    lastFrame: 0,
    keyIdx: 0,
    shownDeg: 0,
  });

  const paintTurntable = React.useCallback(() => {
    const s = spinRef.current;
    const n = keyAngles.length;
    if (n === 0) return;

    const norm = ((s.deg % 360) + 360) % 360;

    if (dialRef.current) {
      dialRef.current.style.transform = `rotate(${(-norm).toFixed(2)}deg)`;
    }

    // Find surrounding keyframes k0 <= norm <= k1 (wrapping 360)
    let i0 = n - 1;
    let i1 = 0;
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      const d0 = keyAngles[i].deg;
      const d1 = next === 0 ? 360 : keyAngles[next].deg;
      if (norm >= d0 && norm < d1) {
        i0 = i;
        i1 = next;
        break;
      }
    }

    const d0 = keyAngles[i0].deg;
    const d1 = i1 === 0 ? 360 : keyAngles[i1].deg;
    const span = Math.max(1, d1 - d0);
    const t = (norm - d0) / span; // 0 .. 1 smooth blend between adjacent angles
    const smoothT = t * t * (3 - 2 * t);

    // Subtle continuous 3D rotateY foreshortening between keyframes (-13° .. +13°)
    const tiltDeg = (0.5 - Math.abs(t - 0.5) * 2) * 0 + (t < 0.5 ? -t * 22 : (1 - t) * 22);
    if (bodyWrapRef.current) {
      bodyWrapRef.current.style.transform = zoomActive
        ? `scale(2.15)`
        : `perspective(1400px) rotateY(${tiltDeg.toFixed(2)}deg)`;
    }

    for (let i = 0; i < n; i++) {
      const img = layerRefs.current[i];
      if (!img) continue;
      let op = 0;
      if (i0 === i1 && i === i0) op = 1;
      else if (i === i0) op = 1 - smoothT;
      else if (i === i1) op = smoothT;
      img.style.opacity = op.toFixed(3);
    }

    const nearest = t < 0.5 ? i0 : i1;
    if (nearest !== s.keyIdx) {
      s.keyIdx = nearest;
      setActiveKeyIdx(nearest);
    }
    const roundedDeg = Math.round(norm / 5) * 5 % 360;
    if (roundedDeg !== s.shownDeg) {
      s.shownDeg = roundedDeg;
      setDegReadout(roundedDeg);
    }
  }, [keyAngles, zoomActive]);

  const loopRef = React.useRef<(now: number) => void>(() => {});

  const tick = React.useCallback(
    (now: number) => {
      const s = spinRef.current;
      const dt = s.lastFrame ? Math.min(48, now - s.lastFrame) : 16;
      s.lastFrame = now;
      let busy = false;

      if (s.dragging) {
        busy = true;
      } else if (s.targetDeg !== null) {
        const diff = ((s.targetDeg - s.deg + 540) % 360) - 180;
        if (Math.abs(diff) < 0.25) {
          s.deg = s.targetDeg;
          s.targetDeg = null;
        } else {
          s.deg += diff * Math.min(1, dt * 0.013);
          busy = true;
        }
      } else if (Math.abs(s.vel) > 0.008) {
        s.deg += s.vel * dt;
        s.vel *= Math.pow(0.93, dt / 16);
        busy = true;
        if (Math.abs(s.vel) <= 0.008) s.vel = 0;
      } else if (s.auto) {
        s.deg = (s.deg + 0.036 * dt) % 360;
        busy = true;
      }

      paintTurntable();

      if (busy) {
        s.raf = requestAnimationFrame(loopRef.current);
      } else {
        s.raf = 0;
        s.lastFrame = 0;
      }
    },
    [paintTurntable],
  );

  React.useEffect(() => {
    loopRef.current = tick;
  }, [tick]);

  const kick = React.useCallback(() => {
    const s = spinRef.current;
    if (!s.raf) {
      s.lastFrame = 0;
      s.raf = requestAnimationFrame(loopRef.current);
    }
  }, []);

  React.useEffect(() => {
    const s = spinRef.current;
    paintTurntable();
    // Subtle introductory 42° turn-and-return cue on mount so visitor immediately feels the 3D pedestal
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced || keyAngles.length <= 1) return;
    const t1 = setTimeout(() => {
      if (!s.dragging && !s.auto) {
        s.targetDeg = 42;
        kick();
      }
    }, 380);
    const t2 = setTimeout(() => {
      if (!s.dragging && !s.auto) {
        s.targetDeg = 0;
        kick();
      }
    }, 1150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, [keyAngles.length, kick, paintTurntable]);

  const jumpToDeg = (target: number) => {
    setMode("spin");
    setZoomActive(false);
    spinRef.current.auto = false;
    setAutoSpin(false);
    spinRef.current.vel = 0;
    spinRef.current.targetDeg = target;
    kick();
  };

  const toggleAuto = () => {
    setMode("spin");
    setZoomActive(false);
    const next = !autoSpin;
    setAutoSpin(next);
    spinRef.current.auto = next;
    spinRef.current.targetDeg = null;
    if (next) kick();
  };

  const currentKey = keyAngles[activeKeyIdx] || keyAngles[0];
  const lightboxSrc =
    mode === "detail" && detailShots[detailIdx]
      ? detailShots[detailIdx].src
      : currentKey?.shot.src || dress.shots[0]?.src || "";

  return (
    <div className="space-y-3">
      {/* Frameless Couture Salon Pedestal Stage */}
      <ViewTransition name={`dress-${dress.code}`} share="morph" default="none">
        <div
          data-spin-stage
          onPointerDown={(e) => {
            if (mode !== "spin" || zoomActive) return;
            const s = spinRef.current;
            s.dragging = true;
            s.auto = false;
            setAutoSpin(false);
            s.targetDeg = null;
            s.vel = 0;
            s.lastX = e.clientX;
            s.lastT = performance.now();
            e.currentTarget.setPointerCapture(e.pointerId);
            kick();
          }}
          onPointerMove={(e) => {
            if (zoomActive) {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
              const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
              setZoomPos({ x, y });
              return;
            }
            const s = spinRef.current;
            if (!s.dragging || mode !== "spin") return;
            const dx = e.clientX - s.lastX;
            const now = performance.now();
            const dt = Math.max(4, now - s.lastT);
            const deltaDeg = dx * 0.65;
            s.deg = (s.deg + deltaDeg + 360) % 360;
            s.vel = deltaDeg / dt;
            s.lastX = e.clientX;
            s.lastT = now;
            paintTurntable();
          }}
          onPointerUp={() => {
            spinRef.current.dragging = false;
            kick();
          }}
          onPointerCancel={() => {
            spinRef.current.dragging = false;
            kick();
          }}
          style={{ touchAction: "pan-y" }}
          className={`relative mx-auto aspect-[3/4] max-h-[min(56svh,440px)] w-full overflow-hidden rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-stage)] select-none sm:max-h-[min(63svh,540px)] ${
            zoomActive ? "cursor-zoom-out" : mode === "spin" ? "cursor-grab active:cursor-grabbing" : ""
          }`}
        >
          {/* Ambient Salon Spotlight + 3D Rotating Brass Pedestal Ring */}
          {mode === "spin" && (
            <>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_62%_70%_at_50%_42%,rgba(184,144,64,0.12)_0%,transparent_74%)]"
              />
              <svg
                aria-hidden="true"
                viewBox="0 0 600 800"
                preserveAspectRatio="xMidYMax meet"
                className="pointer-events-none absolute inset-0 h-full w-full"
              >
                <defs>
                  <linearGradient id={`${uid}-ped-brass`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#B89040" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#B89040" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#B89040" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <g transform="translate(300, 728) scale(1, 0.19)">
                  <circle r="218" fill="none" stroke={`url(#${uid}-ped-brass)`} strokeWidth="2.2" />
                  <circle r="196" fill="none" stroke="#B89040" strokeOpacity="0.28" strokeWidth="1" />
                  <g ref={dialRef} style={{ transformOrigin: "0px 0px" }}>
                    {COMPASS_TICKS.map((deg) => {
                      const major = deg % 45 === 0;
                      const rad = (deg * Math.PI) / 180;
                      const r0 = major ? 196 : 206;
                      return (
                        <line
                          key={deg}
                          x1={Math.sin(rad) * r0}
                          y1={Math.cos(rad) * r0}
                          x2={Math.sin(rad) * 216}
                          y2={Math.cos(rad) * 216}
                          stroke="#B89040"
                          strokeOpacity={major ? 0.85 : 0.35}
                          strokeWidth={major ? 2.2 : 1}
                        />
                      );
                    })}
                  </g>
                </g>
              </svg>
              {/* Grounded Hem Contact Shadow */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-[6%] left-1/2 h-7 w-[58%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(18,14,16,0.38)_0%,transparent_72%)]"
              />
            </>
          )}

          {/* Gown Cutout Stack (Continuous Crossfade + 3D Foreshortening) OR Detail Macro View */}
          {mode === "spin" ? (
            <div
              ref={bodyWrapRef}
              onClick={() => {
                if (zoomActive) setZoomActive(false);
              }}
              style={{
                transformOrigin: zoomActive ? `${zoomPos.x}% ${zoomPos.y}%` : "50% 92%",
              }}
              className="absolute inset-x-4 top-3 bottom-5 transition-transform duration-150"
            >
              {keyAngles.map((ka, idx) => (
                <img
                  key={`${ka.deg}-${idx}`}
                  ref={(el) => {
                    layerRefs.current[idx] = el;
                  }}
                  src={ka.shot.src}
                  alt={idx === 0 ? dress.nameAr : ""}
                  draggable={false}
                  style={{
                    opacity: idx === 0 ? 1 : 0,
                    transform: ka.mirror ? "scaleX(-1)" : undefined,
                  }}
                  className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                />
              ))}
            </div>
          ) : (
            <div
              onClick={() => setZoomActive((z) => !z)}
              style={{
                transform: zoomActive ? "scale(1.9)" : "scale(1)",
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
              }}
              className="h-full w-full transition-transform duration-200"
            >
              {detailShots[detailIdx] && (
                <img
                  src={detailShots[detailIdx].src}
                  alt={detailShots[detailIdx].labelAr}
                  draggable={false}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          )}

          {/* Top Hairline HUD */}
          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between gap-2">
            <span
              dir="ltr"
              className="rounded-[3px] border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 px-2.5 py-1 font-en text-[10px] font-bold tracking-[0.18em] text-[var(--text-strong)] backdrop-blur-xs"
            >
              {dress.code}
            </span>
            <span
              dir="ltr"
              className="rounded-[3px] border border-[var(--brand-gold)]/45 bg-[var(--bg-primary)]/90 px-2.5 py-1 font-en text-[10px] font-semibold tracking-[0.14em] text-[var(--brand-gold)] tabular-nums backdrop-blur-xs"
            >
              {mode === "detail" ? "MACRO DETAIL" : `${degReadout}° // 360°`}
            </span>
          </div>

          {/* Bottom Stage Controls */}
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleAuto}
                className={`inline-flex h-8.5 items-center gap-1.5 rounded-[4px] border px-3 text-[11px] font-semibold backdrop-blur-xs transition-colors ${
                  autoSpin
                    ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#FAF7F2]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 text-[var(--text-strong)] hover:border-[var(--brand-gold)]"
                }`}
              >
                {autoSpin ? <Pause className="size-3.5" /> : <Play className="size-3.5 text-[var(--brand-gold)]" />}
                <span>{autoSpin ? "إيقاف الدوران" : "لف تلقائي ٣٦٠°"}</span>
              </button>
              <span className="hidden items-center gap-1 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)]/82 px-2.5 py-1.5 text-[10px] text-[var(--text-muted)] backdrop-blur-xs sm:inline-flex">
                <MoveHorizontal className="size-3 text-[var(--brand-gold)]" />
                <span>اسحبي يميناً ويساراً</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoomActive((z) => !z)}
                aria-label="عدسة تكبير التطريز"
                className={`flex size-8.5 items-center justify-center rounded-[4px] border backdrop-blur-xs transition-colors ${
                  zoomActive
                    ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#FAF7F2]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 text-[var(--text-strong)] hover:border-[var(--brand-gold)]"
                }`}
              >
                <ZoomIn className="size-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label="تكبير بملء الشاشة"
                className="flex size-8.5 items-center justify-center rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 text-[var(--text-strong)] backdrop-blur-xs transition-colors hover:border-[var(--brand-gold)]"
              >
                <Maximize2 className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </ViewTransition>

      {/* Architectural Angle Selector Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {keyAngles.map((ka, idx) => {
          const active = mode === "spin" && idx === activeKeyIdx;
          return (
            <button
              key={`${ka.deg}-${idx}`}
              type="button"
              onClick={() => jumpToDeg(ka.deg)}
              className={`group flex w-16 shrink-0 flex-col items-center overflow-hidden rounded-[4px] border bg-[var(--bg-stage)] p-1 transition-colors ${
                active
                  ? "border-[var(--brand-gold)]"
                  : "border-[var(--border-subtle)] opacity-75 hover:opacity-100"
              }`}
            >
              <div className="aspect-[2/3] w-full">
                <img
                  src={ka.shot.src}
                  alt={ka.labelAr}
                  style={ka.mirror ? { transform: "scaleX(-1)" } : undefined}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="mt-1 text-[9.5px] font-semibold text-[var(--text-primary)] whitespace-nowrap">
                {ka.labelAr}
              </span>
            </button>
          );
        })}

        {detailShots.map((ds, idx) => {
          const active = mode === "detail" && detailIdx === idx;
          return (
            <button
              key={`detail-${idx}`}
              type="button"
              onClick={() => {
                spinRef.current.auto = false;
                setAutoSpin(false);
                setMode("detail");
                setDetailIdx(idx);
              }}
              className={`flex w-16 shrink-0 flex-col items-center overflow-hidden rounded-[4px] border bg-[var(--bg-stage)] p-1 transition-colors ${
                active
                  ? "border-[var(--brand-gold)]"
                  : "border-[var(--border-subtle)] opacity-80 hover:opacity-100"
              }`}
            >
              <div className="aspect-[2/3] w-full overflow-hidden rounded-[2px]">
                <img src={ds.src} alt={ds.labelAr} className="h-full w-full object-cover" />
              </div>
              <span className="mt-1 text-[9.5px] font-semibold text-[var(--brand-gold)]">
                التطريز
              </span>
            </button>
          );
        })}
      </div>

      {/* Fullscreen Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-4 backdrop-blur-md"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="عرض الفستان بحجم كامل"
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="إغلاق"
            className="absolute top-4 left-4 z-10 flex size-10 items-center justify-center rounded-[4px] border border-white/20 bg-white/10 text-white hover:border-[var(--brand-gold)]"
          >
            <X className="size-5" />
          </button>
          <div
            className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-[4px] bg-[var(--bg-stage)] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxSrc}
              alt={dress.nameAr}
              style={mode === "spin" && currentKey?.mirror ? { transform: "scaleX(-1)" } : undefined}
              className="max-h-[84vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
