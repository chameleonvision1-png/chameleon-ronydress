"use client";

import * as React from "react";
import Link from "next/link";
import { ViewTransition } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, Pause, Play } from "lucide-react";
import type { Dress } from "@/lib/types";
import { OCCASION_LABELS_AR, STATUS_LABELS_AR } from "@/lib/whatsapp";
import { useShortlist } from "./ShortlistProvider";

interface AtelierOrbitCarouselProps {
  dresses: Dress[];
}

function normAngle(deg: number): number {
  let a = ((deg % 360) + 360) % 360;
  if (a > 180) a -= 360;
  return a;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

const AUTO_SPEED_DEG_PER_MS = 0.0105;
const ELLIPSE_FLATTEN = 0.175;

const TICKS_72 = Array.from({ length: 72 }, (_, i) => i * 5);

export function AtelierOrbitCarousel({ dresses }: AtelierOrbitCarouselProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const count = dresses.length;
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const floorDialRef = React.useRef<SVGGElement | null>(null);
  const slotRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const shadowRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const frontImgRefs = React.useRef<(HTMLImageElement | null)[]>([]);
  const tqImgRefs = React.useRef<(HTMLImageElement | null)[]>([]);
  const backImgRefs = React.useRef<(HTMLImageElement | null)[]>([]);

  const [frontIndex, setFrontIndex] = React.useState(0);
  const [extraAnglesReady, setExtraAnglesReady] = React.useState(false);
  const [isAutoPaused, setIsAutoPaused] = React.useState(false);
  const [dims, setDims] = React.useState({
    w: 1180,
    stageH: 438,
    gownW: 273,
    gownH: 410,
    radiusX: 450,
    floorY: 345,
  });

  const { hasItem, toggleItem } = useShortlist();

  const stateRef = React.useRef({
    theta: 0,
    velocity: 0,
    sway: 0,
    targetTheta: null as number | null,
    dragging: false,
    dragMoved: false,
    startX: 0,
    lastX: 0,
    lastTime: 0,
    hovered: false,
    inView: true,
    reducedMotion: false,
    userStopped: false,
    raf: 0,
    lastFrame: 0,
    frontIdx: 0,
    radiusX: 390,
  });

  React.useEffect(() => {
    const id =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? window.requestIdleCallback(() => setExtraAnglesReady(true), { timeout: 550 })
        : setTimeout(() => setExtraAnglesReady(true), 360);
    return () => {
      if (typeof window !== "undefined" && "cancelIdleCallback" in window && typeof id === "number") {
        window.cancelIdleCallback(id);
      } else {
        clearTimeout(id as ReturnType<typeof setTimeout>);
      }
    };
  }, []);

  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const updateDims = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(320, Math.round(rect.width));
      const vh = typeof window !== "undefined" ? window.innerHeight : 880;
      const isMobile = w < 640;

      // Fit entire hero cleanly inside 100svh (900px desktop / 844px mobile) with zero dead air
      const maxGownH = isMobile
        ? clamp(Math.round(vh * 0.40), 268, 340)
        : clamp(Math.round(vh * 0.455), 320, 420);
      const gownH = maxGownH;
      const gownW = Math.round(gownH * (2 / 3));
      const radiusX = isMobile
        ? Math.min(Math.round(w * 0.375), 166)
        : Math.min(Math.round(w * 0.385), 460);
      const radiusY = Math.round(radiusX * ELLIPSE_FLATTEN);
      const stageH = gownH + (isMobile ? 24 : 28);
      const floorY = stageH - radiusY - (isMobile ? 12 : 14);

      stateRef.current.radiusX = radiusX;
      setDims({ w, stageH, gownW, gownH, radiusX, floorY });
    };
    updateDims();
    const ro = new ResizeObserver(updateDims);
    ro.observe(el);
    window.addEventListener("resize", updateDims);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateDims);
    };
  }, []);

  const paintAll = React.useCallback(() => {
    const s = stateRef.current;
    if (count === 0) return;
    const step = 360 / count;
    const rx = s.radiusX;
    const ry = rx * ELLIPSE_FLATTEN;

    // Rotate 3D foreshortened salon brass dial in lockstep with theta
    if (floorDialRef.current) {
      floorDialRef.current.style.transform = `rotate(${(-s.theta).toFixed(2)}deg)`;
    }

    let bestIdx = 0;
    let bestCos = -2;

    for (let i = 0; i < count; i++) {
      const slot = slotRefs.current[i];
      if (!slot) continue;

      const deg = normAngle(s.theta + i * step);
      const rad = (deg * Math.PI) / 180;
      const sin = Math.sin(rad);
      const cos = Math.cos(rad);
      const depth = (cos + 1) / 2; // 0 (back rim) .. 1 (front spotlight rim)

      if (cos > bestCos) {
        bestCos = cos;
        bestIdx = i;
      }

      const footX = sin * rx;
      const footY = cos * ry;
      const scale = 0.50 + Math.pow(depth, 1.18) * 0.50;
      const swayDeg = s.sway * (0.35 + depth * 0.65);
      // Smoothly fade the 180° gown directly behind the 0° hero so wide tulle skirts never poke behind narrow waists
      const occlusionFade = clamp((cos + 0.95) / 0.22, 0, 1);
      const opacity = (cos > 0.86 ? 1 : 0.36 + depth * 0.60) * occlusionFade;

      slot.style.transform = `translate3d(${footX.toFixed(1)}px, ${footY.toFixed(1)}px, 0) scale(${scale.toFixed(3)}) rotate(${swayDeg.toFixed(2)}deg)`;
      slot.style.opacity = opacity.toFixed(3);
      slot.style.zIndex = String(Math.round(depth * 100));

      const sh = shadowRefs.current[i];
      if (sh) {
        const shScale = scale * 0.92;
        sh.style.transform = `translate3d(${footX.toFixed(1)}px, ${footY.toFixed(1)}px, 0) scale(${shScale.toFixed(3)})`;
        sh.style.opacity = ((0.14 + depth * 0.34) * occlusionFade).toFixed(3);
      }

      const frontImg = frontImgRefs.current[i];
      const tqImg = tqImgRefs.current[i];
      const backImg = backImgRefs.current[i];

      let activeFace: "front" | "tq" | "back" = "front";
      if (cos < -0.30 && backImg) activeFace = "back";
      else if (cos < 0.44 && tqImg) activeFace = "tq";

      if (frontImg) frontImg.style.opacity = activeFace === "front" ? "1" : "0";
      if (tqImg) {
        tqImg.style.opacity = activeFace === "tq" ? "1" : "0";
        const flip = dresses[i]?.symmetric && sin < 0 ? -1 : 1;
        tqImg.style.transform = flip === -1 ? "scaleX(-1)" : "none";
      }
      if (backImg) backImg.style.opacity = activeFace === "back" ? "1" : "0";
    }

    if (bestIdx !== s.frontIdx) {
      s.frontIdx = bestIdx;
      setFrontIndex(bestIdx);
    }
  }, [count, dresses]);

  const stepLoopRef = React.useRef<(now: number) => void>(() => {});

  const stepLoop = React.useCallback(
    (now: number) => {
      const s = stateRef.current;
      const dt = s.lastFrame ? Math.min(48, now - s.lastFrame) : 16;
      s.lastFrame = now;

      let busy = false;
      const canAuto =
        !s.dragging &&
        !s.hovered &&
        !s.userStopped &&
        !s.reducedMotion &&
        s.inView &&
        s.targetTheta === null &&
        document.visibilityState === "visible";

      let instVel = 0;

      if (s.dragging) {
        instVel = s.velocity;
        busy = true;
      } else if (s.targetTheta !== null) {
        const diff = normAngle(s.targetTheta - s.theta);
        const delta = diff * Math.min(1, dt * 0.0115);
        s.theta += delta;
        instVel = delta / dt;
        if (Math.abs(diff) < 0.07) {
          s.theta = s.targetTheta;
          s.targetTheta = null;
        } else {
          busy = true;
        }
      } else if (Math.abs(s.velocity) > 0.006) {
        s.theta += s.velocity * dt;
        instVel = s.velocity;
        s.velocity *= Math.pow(0.925, dt / 16);
        busy = true;
        if (Math.abs(s.velocity) <= 0.006) {
          s.velocity = 0;
          if (count > 0) {
            const step = 360 / count;
            s.targetTheta = Math.round(s.theta / step) * step;
            busy = true;
          }
        }
      } else if (canAuto) {
        s.theta -= AUTO_SPEED_DEG_PER_MS * dt;
        instVel = -AUTO_SPEED_DEG_PER_MS;
        busy = true;
      }

      // Smooth damped silk skirt sway
      const targetSway = clamp(instVel * 18, -2.6, 2.6);
      s.sway += (targetSway - s.sway) * Math.min(1, dt * 0.014);
      if (Math.abs(s.sway) > 0.03) busy = true;
      else s.sway = 0;

      paintAll();

      if (busy) {
        s.raf = requestAnimationFrame(stepLoopRef.current);
      } else {
        s.raf = 0;
        s.lastFrame = 0;
      }
    },
    [count, paintAll],
  );

  React.useEffect(() => {
    stepLoopRef.current = stepLoop;
  }, [stepLoop]);

  const kick = React.useCallback(() => {
    const s = stateRef.current;
    if (!s.raf) {
      s.lastFrame = 0;
      s.raf = requestAnimationFrame(stepLoopRef.current);
    }
  }, []);

  React.useEffect(() => {
    const s = stateRef.current;
    s.reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    paintAll();
    kick();

    const el = stageRef.current;
    const io = el
      ? new IntersectionObserver(
          (entries) => {
            s.inView = entries[0]?.isIntersecting ?? true;
            if (s.inView) kick();
          },
          { threshold: 0.08 },
        )
      : null;
    if (el && io) io.observe(el);

    const onVis = () => {
      if (document.visibilityState === "visible") kick();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = 0;
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [kick, paintAll, dims]);

  const snapToIndex = React.useCallback(
    (idx: number) => {
      if (count === 0) return;
      const step = 360 / count;
      const s = stateRef.current;
      const desired = -idx * step;
      const diff = normAngle(desired - s.theta);
      s.targetTheta = s.theta + diff;
      s.velocity = 0;
      kick();
    },
    [count, kick],
  );

  const stepBy = React.useCallback(
    (deltaSlots: number) => {
      if (count === 0) return;
      const nextIdx = (stateRef.current.frontIdx + deltaSlots + count) % count;
      snapToIndex(nextIdx);
    },
    [count, snapToIndex],
  );

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const s = stateRef.current;
      if (!s.dragging) return;
      const dx = e.clientX - s.lastX;
      if (Math.abs(e.clientX - s.startX) > 7) s.dragMoved = true;
      const now = performance.now();
      const dt = Math.max(4, now - s.lastTime);
      const degPerPx = s.radiusX > 0 ? 54 / s.radiusX : 0.2;
      s.theta += dx * degPerPx;
      s.velocity = (dx * degPerPx) / dt;
      s.lastX = e.clientX;
      s.lastTime = now;
      paintAll();
    };
    const onUp = () => {
      const s = stateRef.current;
      if (!s.dragging) return;
      s.dragging = false;
      if (Math.abs(s.velocity) < 0.018 && count > 0) {
        const step = 360 / count;
        s.targetTheta = Math.round(s.theta / step) * step;
      }
      kick();
      setTimeout(() => {
        s.dragMoved = false;
      }, 65);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [count, kick, paintAll]);

  const activeDress = dresses[frontIndex] || dresses[0];
  if (!activeDress) return null;

  const frontShot = activeDress.shots.find((x) => x.angle === "front") || activeDress.shots[0];
  const saved = hasItem(activeDress.code);
  const ringR = dims.radiusX * 1.05;
  const cx = dims.w / 2;

  return (
    <section
      aria-label="صالون عرض فساتين Rony Dress الدائري"
      className="relative overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-stage)] py-4 sm:py-5"
      onMouseEnter={() => {
        stateRef.current.hovered = true;
      }}
      onMouseLeave={() => {
        stateRef.current.hovered = false;
        kick();
      }}
    >
      {/* Subtle Salon Spotlight Atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_56%_65%_at_50%_42%,rgba(184,144,64,0.11)_0%,transparent_72%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Compact Symmetric Couture Eyebrow & Headline (Matches MO WORLD Single-Viewport Discipline) */}
        <div className="mx-auto max-w-2xl text-center">
          <p dir="ltr" className="micro-label text-[var(--brand-gold)]">
            RONY DRESS • COUTURE &amp; BRIDAL ATELIER
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-strong)] sm:text-3xl lg:text-[34px]">
            إطلالات ملكية تنبض بالتفاصيل
          </h1>
        </div>

        {/* 3D Frameless Circular Couture Runway Stage */}
        <div
          ref={stageRef}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              stepBy(1);
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              stepBy(-1);
            }
          }}
          onPointerDown={(e) => {
            if (e.button !== 0 && e.pointerType === "mouse") return;
            const s = stateRef.current;
            s.dragging = true;
            s.dragMoved = false;
            s.targetTheta = null;
            s.velocity = 0;
            s.startX = e.clientX;
            s.lastX = e.clientX;
            s.lastTime = performance.now();
            kick();
          }}
          style={{ height: `${dims.stageH}px`, touchAction: "pan-y" }}
          className="relative mt-1 w-full cursor-grab select-none outline-none active:cursor-grabbing"
        >
          {/* Architectural Brushed-Brass Canopy & Rotating 3D Perspective Runway Ring */}
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${dims.w} ${dims.stageH}`}
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          >
            <defs>
              <linearGradient id={`${uid}-brass`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#B89040" stopOpacity="0.18" />
                <stop offset="28%" stopColor="#D7B98E" stopOpacity="0.72" />
                <stop offset="50%" stopColor="#B89040" stopOpacity="0.95" />
                <stop offset="72%" stopColor="#D7B98E" stopOpacity="0.72" />
                <stop offset="100%" stopColor="#B89040" stopOpacity="0.18" />
              </linearGradient>
              <radialGradient id={`${uid}-floor`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#B89040" stopOpacity="0.12" />
                <stop offset="68%" stopColor="#B89040" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#B89040" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Overhead Couture Chandelier Halo */}
            <ellipse
              cx={cx}
              cy={16}
              rx={dims.radiusX * 0.72}
              ry={Math.max(10, dims.radiusX * 0.055)}
              fill="none"
              stroke={`url(#${uid}-brass)`}
              strokeWidth="1"
            />

            {/* Foreshortened 3D Brass Turntable Ring on the Salon Floor */}
            <g transform={`translate(${cx}, ${dims.floorY}) scale(1, ${ELLIPSE_FLATTEN})`}>
              <circle r={ringR * 1.04} fill={`url(#${uid}-floor)`} />
              <circle
                r={ringR * 1.03}
                fill="none"
                stroke={`url(#${uid}-brass)`}
                strokeWidth="1.8"
              />
              <circle
                r={ringR * 0.94}
                fill="none"
                stroke="#B89040"
                strokeOpacity="0.28"
                strokeWidth="1"
              />

              {/* Rotating Degree Dial + Gown Station Markers */}
              <g ref={floorDialRef} style={{ transformOrigin: "0px 0px" }}>
                {TICKS_72.map((deg) => {
                  const major = deg % 45 === 0;
                  const r0 = ringR * (major ? 0.94 : 0.975);
                  const r1 = ringR * 1.025;
                  const rad = (deg * Math.PI) / 180;
                  return (
                    <line
                      key={deg}
                      x1={Math.sin(rad) * r0}
                      y1={Math.cos(rad) * r0}
                      x2={Math.sin(rad) * r1}
                      y2={Math.cos(rad) * r1}
                      stroke="#B89040"
                      strokeOpacity={major ? 0.75 : 0.32}
                      strokeWidth={major ? 1.8 : 1}
                    />
                  );
                })}
              </g>
            </g>
          </svg>

          {/* Grounded Contact Floor Shadows Beneath Each Floating Gown */}
          {dresses.map((dress, idx) => (
            <span
              key={`shadow-${dress.code}`}
              ref={(el) => {
                shadowRefs.current[idx] = el;
              }}
              aria-hidden="true"
              style={{
                left: `${cx}px`,
                top: `${dims.floorY}px`,
                width: `${Math.round(dims.gownW * 0.72)}px`,
                height: `${Math.max(18, Math.round(dims.gownW * 0.16))}px`,
                marginLeft: `${-Math.round(dims.gownW * 0.36)}px`,
                marginTop: `${-Math.max(9, Math.round(dims.gownW * 0.08))}px`,
                background:
                  "radial-gradient(ellipse at center, rgba(18,14,16,0.42) 0%, rgba(18,14,16,0.14) 48%, transparent 74%)",
                willChange: "transform, opacity",
              }}
              className="pointer-events-none absolute z-[1] rounded-full"
            />
          ))}

          {/* 8 Floating RGBA Transparent Cutout Couture Gowns */}
          {dresses.map((dress, idx) => {
            const isFront = idx === frontIndex;
            const fShot = dress.shots.find((s) => s.angle === "front") || dress.shots[0];
            const tqShot = dress.shots.find((s) => s.angle === "three-quarter");
            const bShot = dress.shots.find((s) => s.angle === "back");
            const hemAnchorPx = Math.round(dims.gownH * 0.966);

            const gownLayers = (
              <div className="relative h-full w-full">
                {fShot && (
                  <img
                    ref={(el) => {
                      frontImgRefs.current[idx] = el;
                    }}
                    src={fShot.src}
                    alt={`${dress.nameAr} — أمامي`}
                    fetchPriority={idx < 2 ? "high" : "auto"}
                    draggable={false}
                    className="pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-200"
                  />
                )}
                {extraAnglesReady && tqShot && (
                  <img
                    ref={(el) => {
                      tqImgRefs.current[idx] = el;
                    }}
                    src={tqShot.src}
                    alt=""
                    draggable={false}
                    style={{ opacity: 0 }}
                    className="pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-200"
                  />
                )}
                {extraAnglesReady && bShot && (
                  <img
                    ref={(el) => {
                      backImgRefs.current[idx] = el;
                    }}
                    src={bShot.src}
                    alt=""
                    draggable={false}
                    style={{ opacity: 0 }}
                    className="pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-200"
                  />
                )}
              </div>
            );

            return (
              <div
                key={dress.code}
                ref={(el) => {
                  slotRefs.current[idx] = el;
                }}
                style={{
                  left: `${cx}px`,
                  top: `${dims.floorY - hemAnchorPx}px`,
                  width: `${dims.gownW}px`,
                  height: `${dims.gownH}px`,
                  marginLeft: `${-dims.gownW / 2}px`,
                  transformOrigin: `50% ${hemAnchorPx}px`,
                  willChange: "transform, opacity",
                }}
                className="absolute"
              >
                {isFront ? (
                  <Link
                    href={`/dress/${dress.code}`}
                    onClick={(e) => {
                      if (stateRef.current.dragMoved) e.preventDefault();
                    }}
                    aria-label={`استعراض ${dress.nameAr} (${dress.code}) بصفحة ٣٦٠° مستقلة`}
                    className="group relative block h-full w-full outline-none"
                  >
                    <ViewTransition name={`dress-${dress.code}`} share="morph" default="none">
                      <div className="h-full w-full transition-transform duration-300 group-hover:-translate-y-1">
                        {gownLayers}
                      </div>
                    </ViewTransition>

                    {/* Minimal Couture Brass Atelier Tag */}
                    <span
                      dir="ltr"
                      className="pointer-events-none absolute top-[10%] -right-1 rounded-[3px] border border-[var(--brand-gold)]/65 bg-[var(--bg-primary)]/92 px-2 py-0.5 font-en text-[9.5px] font-bold tracking-[0.18em] text-[var(--text-strong)] shadow-sm backdrop-blur-xs transition-colors group-hover:border-[var(--brand-gold)] group-hover:bg-[var(--brand-gold)] group-hover:text-[#FAF7F2]"
                    >
                      {dress.code}
                    </span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!stateRef.current.dragMoved) snapToIndex(idx);
                    }}
                    aria-label={`تدوير المنصة إلى ${dress.nameAr}`}
                    className="block h-full w-full cursor-pointer outline-none"
                  >
                    {gownLayers}
                  </button>
                )}
              </div>
            );
          })}

          {/* Subtle Left/Right Runway Step Controls */}
          <button
            type="button"
            onClick={() => stepBy(-1)}
            aria-label="الفستان السابق"
            className="absolute right-0 top-1/2 z-[120] flex size-9 -translate-y-1/2 items-center justify-center rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)]/88 text-[var(--text-strong)] backdrop-blur-xs transition-colors hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)] sm:size-10"
          >
            <ChevronRight className="size-4.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => stepBy(1)}
            aria-label="الفستان التالي"
            className="absolute left-0 top-1/2 z-[120] flex size-9 -translate-y-1/2 items-center justify-center rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)]/88 text-[var(--text-strong)] backdrop-blur-xs transition-colors hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)] sm:size-10"
          >
            <ChevronLeft className="size-4.5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Symmetric Above-the-Fold Couture Pedestal Caption & Dual CTAs */}
        <div className="mx-auto mt-2 max-w-xl text-center">
          {/* Orbital Station Indicators + Play/Pause & Shortlist */}
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !isAutoPaused;
                setIsAutoPaused(next);
                stateRef.current.userStopped = next;
                if (!next) kick();
              }}
              aria-label={isAutoPaused ? "تشغيل دوران المنصة" : "إيقاف دوران المنصة"}
              className="inline-flex size-6 items-center justify-center rounded-[3px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-muted)] transition-colors hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]"
            >
              {isAutoPaused ? <Play className="size-3" /> : <Pause className="size-3" />}
            </button>

            <div className="flex items-center gap-1.5 px-1">
              {dresses.map((d, i) => (
                <button
                  key={d.code}
                  type="button"
                  onClick={() => snapToIndex(i)}
                  aria-label={`اختيار ${d.nameAr}`}
                  className={`h-[3px] rounded-full transition-all ${
                    i === frontIndex
                      ? "w-6 bg-[var(--brand-gold)]"
                      : "w-2 bg-[var(--border-subtle)] hover:bg-[var(--brand-gold)]/55"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                toggleItem({
                  code: activeDress.code,
                  nameAr: activeDress.nameAr,
                  nameEn: activeDress.nameEn,
                  image: frontShot?.src || "",
                  status: activeDress.status,
                  occasionLabel: OCCASION_LABELS_AR[activeDress.occasions[0]] || "مناسبات",
                })
              }
              aria-label={saved ? "إزالة من اختياراتي" : "حفظ للبروفة"}
              className={`inline-flex size-6 items-center justify-center rounded-[3px] border transition-colors ${
                saved
                  ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#FAF7F2]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]"
              }`}
            >
              <Heart className={`size-3 ${saved ? "fill-current" : ""}`} />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-center gap-2 text-[11px] font-medium text-[var(--text-muted)]">
            <span dir="ltr" className="font-en font-bold tracking-[0.16em] text-[var(--brand-gold)]">
              {activeDress.code}
            </span>
            <span>·</span>
            <span className="font-semibold text-[var(--text-primary)]">
              {STATUS_LABELS_AR[activeDress.status] || "متاح للإيجار"}
            </span>
            <span>·</span>
            <span>{activeDress.occasions.map((o) => OCCASION_LABELS_AR[o]).slice(0, 2).join(" و")}</span>
          </div>

          <h2 className="mt-0.5 text-base font-bold text-[var(--text-strong)] sm:text-lg">
            {activeDress.nameAr}
          </h2>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)] sm:text-xs">
            اسحبي المنصة للدوران أو اضغطي على الفستان لفتحه بحجم كامل وتدويره ٣٦٠°
          </p>

          {/* Symmetric Equal Side-by-Side CTAs (MO WORLD Signature Symmetry) */}
          <div className="mx-auto mt-3.5 grid max-w-sm grid-cols-2 gap-2.5">
            <Link
              href={`/dress/${activeDress.code}`}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[4px] bg-[var(--brand-gold)] px-3 text-xs font-semibold text-[#FAF7F2] whitespace-nowrap transition-colors hover:bg-[var(--brand-gold-hover)]"
            >
              <span>استعرضي الفستان ٣٦٠°</span>
              <ArrowLeft className="size-3.5 shrink-0" strokeWidth={1.5} />
            </Link>
            <Link
              href="/collection"
              className="inline-flex h-10 items-center justify-center rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 text-xs font-semibold text-[var(--text-primary)] whitespace-nowrap transition-colors hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]"
            >
              تصفحي الكولكشن الكامل
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
