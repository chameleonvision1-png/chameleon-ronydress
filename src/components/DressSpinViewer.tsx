"use client";

import * as React from "react";
import { ViewTransition } from "react";
import { Maximize2, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";
import type { Dress } from "@/lib/types";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import { CoutureSpiritBackdrop } from "./CoutureSpiritBackdrop";

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function lambert(deg: number) {
  const rad = (deg * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  return 0.68 + 0.32 * Math.pow(c, 0.75);
}

function subscribeReducedMotion(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const m = window.matchMedia("(prefers-reduced-motion: reduce)");
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

function getReducedSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedServer() {
  return false;
}

export function DressSpinViewer({
  dress,
  enableMorph = true,
}: {
  dress: Dress;
  enableMorph?: boolean;
}) {
  const reduced = React.useSyncExternalStore(
    subscribeReducedMotion,
    getReducedSnapshot,
    getReducedServer,
  );

  const frontShot = React.useMemo(
    () => dress.shots.find((s) => s.angle === "front") ?? dress.shots[0],
    [dress.shots],
  );
  const backShot = React.useMemo(
    () => dress.shots.find((s) => s.angle === "back") ?? frontShot,
    [dress.shots, frontShot],
  );
  const sideShot = React.useMemo(
    () =>
      dress.shots.find((s) => s.angle === "three-quarter") ??
      dress.shots.find((s) => s.angle === "side") ??
      null,
    [dress.shots],
  );
  const detailShot = React.useMemo(
    () => dress.shots.find((s) => s.angle === "detail") ?? null,
    [dress.shots],
  );

  const [viewMode, setViewMode] = React.useState<"3d" | "side" | "detail">("3d");
  const [side, setSide] = React.useState<"front" | "back">("front");
  const [zoomed, setZoomed] = React.useState(false);
  const [zoomPos, setZoomPos] = React.useState({ x: 50, y: 36 });
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  useLockBodyScroll(lightboxOpen);

  const spinRef = React.useRef<HTMLDivElement | null>(null);
  const frontShadeRef = React.useRef<HTMLSpanElement | null>(null);
  const backShadeRef = React.useRef<HTMLSpanElement | null>(null);
  const shadowRef = React.useRef<HTMLSpanElement | null>(null);

  const animRef = React.useRef({
    value: 0,
    target: 0,
    velocity: 0,
    raf: 0,
    last: 0,
    pointerId: -1,
    dragging: false,
    scrolling: false,
    moved: false,
    startX: 0,
    startY: 0,
    startAngle: 0,
  });

  const applyAngle = React.useCallback((deg: number) => {
    if (spinRef.current) {
      spinRef.current.style.transform = `rotateY(${deg.toFixed(2)}deg)`;
    }
    const shade = (1 - lambert(deg)) * 0.55;
    if (frontShadeRef.current) frontShadeRef.current.style.opacity = shade.toFixed(3);
    if (backShadeRef.current) backShadeRef.current.style.opacity = shade.toFixed(3);
    if (shadowRef.current) {
      const sx = Math.max(0.22, Math.abs(Math.cos((deg * Math.PI) / 180)));
      shadowRef.current.style.transform = `translateX(-50%) scaleX(${sx.toFixed(3)})`;
    }
  }, []);

  const loopRef = React.useRef<(now: number) => void>(() => {});

  const stepSpring = React.useCallback(
    (now: number) => {
      const a = animRef.current;
      const dt = a.last ? Math.min(0.034, (now - a.last) / 1000) : 1 / 60;
      a.last = now;

      // Critically-damped harmonic spring (exact MO WORLD Detail physics)
      const stiff = 92;
      const damp = 2 * Math.sqrt(stiff) * 0.85;
      const accel = -stiff * (a.value - a.target) - damp * a.velocity;
      a.velocity += accel * dt;
      a.value += a.velocity * dt;

      applyAngle(a.value);

      if (Math.abs(a.value - a.target) < 0.05 && Math.abs(a.velocity) < 0.05) {
        a.value = a.target;
        a.velocity = 0;
        applyAngle(a.value);
        a.raf = 0;
        a.last = 0;
        return;
      }
      a.raf = requestAnimationFrame(loopRef.current);
    },
    [applyAngle],
  );

  React.useEffect(() => {
    loopRef.current = stepSpring;
  }, [stepSpring]);

  const startSpring = React.useCallback(() => {
    const a = animRef.current;
    if (reduced) {
      a.value = a.target;
      a.velocity = 0;
      applyAngle(a.value);
      return;
    }
    if (!a.raf) {
      a.last = 0;
      a.raf = requestAnimationFrame(loopRef.current);
    }
  }, [applyAngle, reduced]);

  const turnTo = React.useCallback(
    (next: "front" | "back") => {
      setViewMode("3d");
      setZoomed(false);
      const a = animRef.current;
      const base = Math.round(a.value / 360) * 360;
      let target = base + (next === "back" ? 180 : 0);
      if (Math.abs(target - a.value) > 180) {
        target -= 360 * Math.sign(target - a.value);
      }
      a.target = target;
      setSide(next);
      startSpring();
    },
    [startSpring],
  );

  React.useEffect(() => {
    const a = animRef.current;
    applyAngle(a.value);
    return () => {
      if (a.raf) cancelAnimationFrame(a.raf);
      a.raf = 0;
    };
  }, [applyAngle]);

  const activeZoomSrc =
    viewMode === "detail" && detailShot
      ? detailShot.src
      : viewMode === "side" && sideShot
        ? sideShot.src
        : side === "back"
          ? backShot?.src
          : frontShot?.src;

  const frontFaceContent = frontShot ? (
    <div className="relative size-full">
      <img
        src={frontShot.src}
        alt={`${dress.nameAr} — الوجه الأمامي`}
        draggable={false}
        className="pointer-events-none size-full select-none object-contain"
      />
      <span
        ref={frontShadeRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-black opacity-0"
        style={{
          WebkitMask: `url("${frontShot.src}") center / contain no-repeat`,
          mask: `url("${frontShot.src}") center / contain no-repeat`,
        }}
      />
    </div>
  ) : null;

  return (
    <div className="space-y-3.5">
      {/* Clean Architectural Studio Stage */}
      <div
        data-spin-stage
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            turnTo(side === "front" ? "back" : "front");
          }
        }}
        onPointerDown={(e) => {
          if (e.button !== 0 && e.pointerType === "mouse") return;
          if ((e.target as HTMLElement).closest("button")) return;
          if (zoomed || viewMode !== "3d") return;
          const a = animRef.current;
          a.pointerId = e.pointerId;
          a.dragging = false;
          a.scrolling = false;
          a.moved = false;
          a.startX = e.clientX;
          a.startY = e.clientY;
          a.startAngle = a.value;
        }}
        onPointerMove={(e) => {
          if (zoomed) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 8, 92);
            const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 8, 92);
            setZoomPos({ x, y });
            return;
          }
          const a = animRef.current;
          if (a.pointerId !== e.pointerId || a.scrolling || viewMode !== "3d") return;
          const dx = e.clientX - a.startX;
          const dy = e.clientY - a.startY;
          if (!a.dragging) {
            if (Math.abs(dy) > 7 && Math.abs(dy) >= Math.abs(dx)) {
              a.scrolling = true;
              return;
            }
            if (Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(dy) * 1.15) {
              a.dragging = true;
              a.moved = true;
              if (a.raf) cancelAnimationFrame(a.raf);
              a.raf = 0;
              a.last = 0;
              a.velocity = 0;
              e.currentTarget.setPointerCapture(e.pointerId);
            } else {
              return;
            }
          }
          a.value = clamp(a.startAngle + dx * 0.52, a.startAngle - 210, a.startAngle + 210);
          applyAngle(a.value);
        }}
        onPointerUp={(e) => {
          const a = animRef.current;
          if (a.pointerId !== e.pointerId) return;
          a.pointerId = -1;
          if (!a.dragging) return;
          a.dragging = false;
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
          if (!a.moved) return;
          const facing = ((a.value % 360) + 360) % 360;
          turnTo(facing > 90 && facing < 270 ? "back" : "front");
        }}
        onPointerCancel={() => {
          const a = animRef.current;
          a.pointerId = -1;
          if (!a.dragging) return;
          a.dragging = false;
          turnTo(side);
        }}
        style={{ touchAction: zoomed ? "none" : "pan-y" }}
        className={`relative mx-auto aspect-[3/4] max-h-[410px] w-full overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] outline-none select-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)] sm:max-h-[530px] ${
          zoomed
            ? "cursor-zoom-out"
            : viewMode === "3d"
              ? "cursor-grab active:cursor-grabbing"
              : ""
        }`}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          if (zoomed) setZoomed(false);
        }}
      >
        {/* Enchanted Couture Spirit Creatures & Soft Aura Behind Model */}
        {!zoomed && viewMode !== "detail" && (
          <CoutureSpiritBackdrop
            dressCode={dress.code}
            occasion={dress.occasions[0]}
            variant="stage"
          />
        )}
        {/* Soft Overhead Studio Wash */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 65% at 50% 18%, color-mix(in oklab, var(--foreground) 4%, transparent), transparent 70%)",
          }}
        />

        {/* Natural Grounded Contact Floor Shadow (No Wireframe Lines) */}
        {!zoomed && viewMode !== "detail" && (
          <span
            ref={shadowRef}
            aria-hidden="true"
            style={{
              transform: "translateX(-50%) scaleX(1)",
              background:
                "radial-gradient(ellipse at center, rgba(11,9,12,0.28) 0%, rgba(11,9,12,0.09) 48%, transparent 74%)",
            }}
            className="pointer-events-none absolute bottom-[3.2%] left-1/2 h-5 w-[54%] rounded-full"
          />
        )}

        {/* Mode 1: True 3D Two-Sided Front/Back Couture Flip (Zero Double-Exposure Ghosting) */}
        {viewMode === "3d" && !zoomed && (
          <div className="absolute inset-x-3 top-3 bottom-4" style={{ perspective: "1400px" }}>
            <div ref={spinRef} className="relative size-full [transform-style:preserve-3d]">
              {/* Front Face (0deg) */}
              <div className="absolute inset-0 [backface-visibility:hidden]">
                {enableMorph ? (
                  <ViewTransition name={`dress-${dress.code}`} share="morph" default="none">
                    <div className="size-full">{frontFaceContent}</div>
                  </ViewTransition>
                ) : (
                  frontFaceContent
                )}
              </div>

              {/* Back Face (180deg) */}
              <div
                className="absolute inset-0 [backface-visibility:hidden]"
                style={{ transform: "rotateY(180deg)" }}
              >
                {backShot && (
                  <div className="relative size-full">
                    <img
                      src={backShot.src}
                      alt={`${dress.nameAr} — الظهر`}
                      draggable={false}
                      className="pointer-events-none size-full select-none object-contain"
                    />
                    <span
                      ref={backShadeRef}
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-black opacity-0"
                      style={{
                        WebkitMask: `url("${backShot.src}") center / contain no-repeat`,
                        mask: `url("${backShot.src}") center / contain no-repeat`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mode 2: Dedicated Crisp Side / Three-Quarter Portrait */}
        {viewMode === "side" && sideShot && !zoomed && (
          <div className="absolute inset-x-3 top-3 bottom-4">
            <img
              src={sideShot.src}
              alt={`${dress.nameAr} — زاوية جانبية`}
              draggable={false}
              className="pointer-events-none size-full select-none object-contain"
            />
          </div>
        )}

        {/* Mode 3: Macro Embroidery Detail or 2.2x Loupe */}
        {(viewMode === "detail" || zoomed) && activeZoomSrc && (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={activeZoomSrc}
              alt={`${dress.nameAr} — تفاصيل الخامة والتطريز`}
              draggable={false}
              style={
                zoomed
                  ? {
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      transform: "scale(2.2)",
                    }
                  : undefined
              }
              className={`pointer-events-none size-full select-none transition-transform duration-150 ${
                viewMode === "detail" ? "object-cover" : "object-contain p-3"
              }`}
            />
          </div>
        )}

        {/* Top-Right Minimal Dress Code Tag */}
        <span
          dir="ltr"
          className="pointer-events-none absolute right-3 top-3 z-10 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 px-2.5 py-0.5 font-en text-[10px] font-semibold tracking-[0.14em] text-[var(--text-primary)] backdrop-blur-xs"
        >
          {dress.code}
        </span>

        {/* Bottom Minimal Studio Controls */}
        <div className="absolute inset-x-3 bottom-3 z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label="تكبير بملء الشاشة"
              className="inline-flex size-8.5 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 text-[var(--text-primary)] backdrop-blur-xs transition-colors hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]"
            >
              <Maximize2 className="size-3.5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              aria-label={zoomed ? "إلغاء التكبير" : "تكبير تفاصيل التطريز"}
              className={`inline-flex size-8.5 items-center justify-center rounded-full border backdrop-blur-xs transition-colors ${
                zoomed
                  ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#F7F6F3]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 text-[var(--text-primary)] hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]"
              }`}
            >
              {zoomed ? (
                <ZoomOut className="size-3.5" strokeWidth={1.5} />
              ) : (
                <ZoomIn className="size-3.5" strokeWidth={1.5} />
              )}
            </button>
          </div>

          {viewMode === "3d" && !zoomed && (
            <button
              type="button"
              onClick={() => turnTo(side === "front" ? "back" : "front")}
              className="inline-flex h-8.5 items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 px-3.5 text-[11px] font-semibold text-[var(--text-primary)] backdrop-blur-xs transition-colors hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]"
            >
              <RotateCw className="size-3 text-[var(--brand-gold)]" strokeWidth={1.75} />
              <span>{side === "front" ? "لفّي لمشاهدة الظهر" : "العودة للوجه الأمامي"}</span>
            </button>
          )}
        </div>
      </div>

      {/* MO WORLD Sliding-Underline Angle Selector */}
      <div
        role="group"
        aria-label="زوايا استعراض الفستان"
        className="flex flex-wrap items-center justify-center gap-5 border-b border-[var(--border-subtle)] pb-1"
      >
        <button
          type="button"
          onClick={() => turnTo("front")}
          className={`relative pb-2 text-xs font-semibold outline-none transition-colors ${
            viewMode === "3d" && side === "front"
              ? "text-[var(--text-strong)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          الوجه الأمامي
          <span
            aria-hidden="true"
            className={`absolute inset-x-0 bottom-0 h-[1.5px] bg-[var(--brand-gold)] transition-transform duration-300 ${
              viewMode === "3d" && side === "front" ? "scale-x-100" : "scale-x-0"
            }`}
          />
        </button>

        <button
          type="button"
          onClick={() => turnTo("back")}
          className={`relative pb-2 text-xs font-semibold outline-none transition-colors ${
            viewMode === "3d" && side === "back"
              ? "text-[var(--text-strong)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          الظهر
          <span
            aria-hidden="true"
            className={`absolute inset-x-0 bottom-0 h-[1.5px] bg-[var(--brand-gold)] transition-transform duration-300 ${
              viewMode === "3d" && side === "back" ? "scale-x-100" : "scale-x-0"
            }`}
          />
        </button>

        {sideShot && (
          <button
            type="button"
            onClick={() => {
              setZoomed(false);
              setViewMode("side");
            }}
            className={`relative pb-2 text-xs font-semibold outline-none transition-colors ${
              viewMode === "side"
                ? "text-[var(--text-strong)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            زاوية جانبية
            <span
              aria-hidden="true"
              className={`absolute inset-x-0 bottom-0 h-[1.5px] bg-[var(--brand-gold)] transition-transform duration-300 ${
                viewMode === "side" ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </button>
        )}

        {detailShot && (
          <button
            type="button"
            onClick={() => {
              setZoomed(false);
              setViewMode("detail");
            }}
            className={`relative pb-2 text-xs font-semibold outline-none transition-colors ${
              viewMode === "detail"
                ? "text-[var(--text-strong)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            تفاصيل التطريز
            <span
              aria-hidden="true"
              className={`absolute inset-x-0 bottom-0 h-[1.5px] bg-[var(--brand-gold)] transition-transform duration-300 ${
                viewMode === "detail" ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </button>
        )}
      </div>

      {/* Clean Fullscreen Lightbox */}
      {lightboxOpen && activeZoomSrc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`معاينة مكبرة — ${dress.nameAr}`}
          className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-primary)]/96 p-4 backdrop-blur-xl sm:p-6"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                dir="ltr"
                className="font-en text-xs font-bold tracking-[0.18em] text-[var(--brand-gold)]"
              >
                {dress.code}
              </span>
              <span className="text-sm font-bold text-[var(--text-strong)]">{dress.nameAr}</span>
            </div>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="inline-flex h-9 items-center gap-1.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--text-primary)]"
            >
              <span>إغلاق</span>
              <X className="size-3.5" strokeWidth={1.5} />
            </button>
          </div>
          <div
            className="flex flex-1 items-center justify-center overflow-hidden py-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeZoomSrc}
              alt={dress.nameAr}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
