"use client";

import * as React from "react";
import Link from "next/link";
import { ViewTransition } from "react";
import { ChevronLeft, ChevronRight, Eye, Heart, RotateCw } from "lucide-react";
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

const AUTO_SPEED_DEG_PER_MS = 0.011;

export function AtelierOrbitCarousel({ dresses }: AtelierOrbitCarouselProps) {
  const count = dresses.length;
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const slotRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const frontImgRefs = React.useRef<(HTMLImageElement | null)[]>([]);
  const tqImgRefs = React.useRef<(HTMLImageElement | null)[]>([]);
  const backImgRefs = React.useRef<(HTMLImageElement | null)[]>([]);

  const [frontIndex, setFrontIndex] = React.useState(0);
  const [extraAnglesReady, setExtraAnglesReady] = React.useState(false);
  const [dims, setDims] = React.useState({ w: 960, h: 460, cardW: 236, cardH: 354 });
  const [isAutoPaused, setIsAutoPaused] = React.useState(false);

  const { hasItem, toggleItem } = useShortlist();

  const stateRef = React.useRef({
    theta: 0,
    velocity: 0,
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
    radiusX: 340,
  });

  React.useEffect(() => {
    const id =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? window.requestIdleCallback(() => setExtraAnglesReady(true), { timeout: 600 })
        : setTimeout(() => setExtraAnglesReady(true), 400);
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
      const isMobile = w < 640;
      const cardW = isMobile ? Math.min(182, Math.round(w * 0.46)) : Math.min(244, Math.round(w * 0.23));
      const cardH = Math.round(cardW * 1.5);
      const radiusX = isMobile ? Math.round(w * 0.34) : Math.min(430, Math.round(w * 0.36));
      stateRef.current.radiusX = radiusX;
      setDims({ w, h: cardH + (isMobile ? 76 : 92), cardW, cardH });
    };
    updateDims();
    const ro = new ResizeObserver(updateDims);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const paintAll = React.useCallback(() => {
    const s = stateRef.current;
    if (count === 0) return;
    const step = 360 / count;
    let bestIdx = 0;
    let bestCos = -2;

    for (let i = 0; i < count; i++) {
      const slot = slotRefs.current[i];
      if (!slot) continue;
      const deg = normAngle(s.theta + i * step);
      const rad = (deg * Math.PI) / 180;
      const sin = Math.sin(rad);
      const cos = Math.cos(rad);
      const depth = (cos + 1) / 2; // 0 (back) .. 1 (front)

      if (cos > bestCos) {
        bestCos = cos;
        bestIdx = i;
      }

      const x = sin * s.radiusX;
      const yLift = (1 - depth) * -32;
      const scale = 0.56 + depth * 0.44;
      const rotY = -sin * 15;
      const opacity = 0.36 + depth * 0.64;

      slot.style.transform = `translate3d(${x.toFixed(1)}px, ${yLift.toFixed(1)}px, 0) perspective(1400px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      slot.style.opacity = opacity.toFixed(3);
      slot.style.zIndex = String(Math.round(depth * 100));

      const frontImg = frontImgRefs.current[i];
      const tqImg = tqImgRefs.current[i];
      const backImg = backImgRefs.current[i];

      let activeFace: "front" | "tq" | "back" = "front";
      if (cos < -0.28 && backImg) activeFace = "back";
      else if (cos < 0.42 && tqImg) activeFace = "tq";

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

      if (s.dragging) {
        busy = true;
      } else if (s.targetTheta !== null) {
        const diff = normAngle(s.targetTheta - s.theta);
        s.theta += diff * Math.min(1, dt * 0.011);
        if (Math.abs(diff) < 0.08) {
          s.theta = s.targetTheta;
          s.targetTheta = null;
        } else {
          busy = true;
        }
      } else if (Math.abs(s.velocity) > 0.008) {
        s.theta += s.velocity * dt;
        s.velocity *= Math.pow(0.92, dt / 16);
        busy = true;
        if (Math.abs(s.velocity) <= 0.008) {
          s.velocity = 0;
          if (count > 0) {
            const step = 360 / count;
            s.targetTheta = Math.round(s.theta / step) * step;
            busy = true;
          }
        }
      } else if (canAuto) {
        s.theta -= AUTO_SPEED_DEG_PER_MS * dt;
        busy = true;
      }

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
      s.raf = requestAnimationFrame(stepLoop);
    }
  }, [stepLoop]);

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
          { threshold: 0.1 },
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
      const degPerPx = s.radiusX > 0 ? 52 / s.radiusX : 0.2;
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
      if (Math.abs(s.velocity) < 0.02 && count > 0) {
        const step = 360 / count;
        s.targetTheta = Math.round(s.theta / step) * step;
      }
      kick();
      setTimeout(() => {
        s.dragMoved = false;
      }, 60);
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

  return (
    <div
      className="relative w-full select-none"
      onMouseEnter={() => {
        stateRef.current.hovered = true;
      }}
      onMouseLeave={() => {
        stateRef.current.hovered = false;
        kick();
      }}
    >
      {/* Orbital Stage */}
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
        style={{ height: `${dims.h}px`, touchAction: "pan-y" }}
        className="relative flex w-full cursor-grab items-center justify-center overflow-hidden outline-none active:cursor-grabbing"
        aria-label="كاروسيل فساتين الأتيليه الدائري"
      >
        {/* Subtle circular runway floor glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-4 left-1/2 h-16 w-[84%] max-w-3xl -translate-x-1/2 rounded-[100%] border border-[var(--brand-gold)]/30 bg-[radial-gradient(ellipse_at_center,rgba(184,144,64,0.14)_0%,transparent_72%)]"
        />

        {dresses.map((dress, idx) => {
          const isFront = idx === frontIndex;
          const fShot = dress.shots.find((s) => s.angle === "front") || dress.shots[0];
          const tqShot = dress.shots.find((s) => s.angle === "three-quarter");
          const bShot = dress.shots.find((s) => s.angle === "back");

          return (
            <div
              key={dress.code}
              ref={(el) => {
                slotRefs.current[idx] = el;
              }}
              style={{
                width: `${dims.cardW}px`,
                height: `${dims.cardH}px`,
                marginLeft: `${-dims.cardW / 2}px`,
                marginTop: `${-dims.cardH / 2}px`,
                willChange: "transform, opacity",
              }}
              className="absolute top-1/2 left-1/2"
            >
              <div className="relative h-full w-full">
                {isFront ? (
                  <Link
                    href={`/dress/${dress.code}`}
                    onClick={(e) => {
                      if (stateRef.current.dragMoved) {
                        e.preventDefault();
                      }
                    }}
                    aria-label={`استعراض ${dress.nameAr} ${dress.code}`}
                    className="group relative block h-full w-full overflow-hidden rounded-lg border border-[var(--brand-gold)]/55 bg-[#F7F1E8] shadow-[0_24px_50px_-14px_rgba(58,41,48,0.28)] ring-1 ring-[var(--brand-gold)]/20"
                  >
                    <ViewTransition name={`dress-${dress.code}`} share="morph" default="none">
                      <div className="relative h-full w-full overflow-hidden bg-[#F7F1E8]">
                        {fShot && (
                          <img
                            ref={(el) => {
                              frontImgRefs.current[idx] = el;
                            }}
                            src={fShot.src}
                            alt={`${dress.nameAr} — أمامي`}
                            fetchPriority={idx < 2 ? "high" : "auto"}
                            draggable={false}
                            className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-200"
                          />
                        )}
                        {extraAnglesReady && tqShot && (
                          <img
                            ref={(el) => {
                              tqImgRefs.current[idx] = el;
                            }}
                            src={tqShot.src}
                            alt={`${dress.nameAr} — زاوية جانبية`}
                            draggable={false}
                            style={{ opacity: 0 }}
                            className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-200"
                          />
                        )}
                        {extraAnglesReady && bShot && (
                          <img
                            ref={(el) => {
                              backImgRefs.current[idx] = el;
                            }}
                            src={bShot.src}
                            alt={`${dress.nameAr} — خلفي`}
                            draggable={false}
                            style={{ opacity: 0 }}
                            className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-200"
                          />
                        )}
                      </div>
                    </ViewTransition>

                    <span className="pointer-events-none absolute top-2.5 right-2.5 rounded bg-[#171317]/80 px-2 py-0.5 font-en text-[10px] font-semibold tracking-wider text-[#FFF9F2] backdrop-blur-xs">
                      {dress.code}
                    </span>

                    <span className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#3A2930]/88 px-3 py-1 text-[10px] font-semibold text-[#FFF9F2] opacity-95 backdrop-blur-xs transition group-hover:bg-[var(--brand-gold)]">
                      اضغطي للتفاصيل واللف ٣٦٠°
                    </span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!stateRef.current.dragMoved) snapToIndex(idx);
                    }}
                    aria-label={`عرض ${dress.nameAr}`}
                    className="relative block h-full w-full overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[#F7F1E8] text-right shadow-md transition-shadow hover:border-[var(--brand-gold)]"
                  >
                    <div className="relative h-full w-full overflow-hidden bg-[#F7F1E8]">
                      {fShot && (
                        <img
                          ref={(el) => {
                            frontImgRefs.current[idx] = el;
                          }}
                          src={fShot.src}
                          alt={dress.nameAr}
                          fetchPriority={idx < 2 ? "high" : "auto"}
                          draggable={false}
                          className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-200"
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
                          className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-200"
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
                          className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-200"
                        />
                      )}
                    </div>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Left / Right Orbit Controls */}
        <button
          type="button"
          onClick={() => stepBy(-1)}
          aria-label="الفستان السابق"
          className="absolute right-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 text-[var(--text-strong)] shadow-md backdrop-blur-xs transition hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)] md:right-4"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => stepBy(1)}
          aria-label="الفستان التالي"
          className="absolute left-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 text-[var(--text-strong)] shadow-md backdrop-blur-xs transition hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)] md:left-4"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Center-Stage Active Dress Spotlight Bar */}
      <div className="mx-auto mt-2 max-w-2xl px-4">
        <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 px-4 py-3.5 shadow-sm backdrop-blur-xs sm:flex-row sm:px-5">
          <div className="min-w-0 text-center sm:text-right">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="font-en text-xs font-bold tracking-wider text-[var(--brand-gold)]">
                {activeDress.code}
              </span>
              <span className="rounded-full bg-[var(--brand-gold)]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--brand-gold)]">
                {STATUS_LABELS_AR[activeDress.status] || "متاح للإيجار"}
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                {activeDress.occasions.map((o) => OCCASION_LABELS_AR[o]).slice(0, 2).join(" · ")}
              </span>
            </div>
            <h2 className="mt-1 truncate text-base font-bold text-[var(--text-strong)]">
              {activeDress.nameAr}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !isAutoPaused;
                setIsAutoPaused(next);
                stateRef.current.userStopped = next;
                if (!next) kick();
              }}
              aria-label={isAutoPaused ? "تشغيل الدوران" : "إيقاف الدوران"}
              className="flex h-9 w-9 items-center justify-center rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-strong)] transition hover:border-[var(--brand-gold)]"
              title={isAutoPaused ? "تشغيل الدوران التلقائي" : "تثبيت العرض"}
            >
              <RotateCw className={`h-4 w-4 ${!isAutoPaused ? "text-[var(--brand-gold)]" : ""}`} />
            </button>

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
              aria-label="حفظ في اختياراتي"
              className={`flex h-9 w-9 items-center justify-center rounded border transition ${
                saved
                  ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#FFF9F2]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-strong)] hover:border-[var(--brand-gold)]"
              }`}
            >
              <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
            </button>

            <Link
              href={`/dress/${activeDress.code}`}
              className="inline-flex h-9 items-center gap-1.5 rounded bg-[var(--brand-gold)] px-4 text-xs font-semibold text-[#FFF9F2] transition hover:bg-[var(--brand-gold-hover)]"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>التفاصيل واللف ٣٦٠°</span>
            </Link>
          </div>
        </div>

        {/* Orbital Slot Dots */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {dresses.map((d, i) => (
            <button
              key={d.code}
              type="button"
              onClick={() => snapToIndex(i)}
              aria-label={`اختيار ${d.nameAr}`}
              className={`h-1.5 rounded-full transition-all ${
                i === frontIndex
                  ? "w-6 bg-[var(--brand-gold)]"
                  : "w-1.5 bg-[var(--border-subtle)] hover:bg-[var(--brand-gold)]/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
