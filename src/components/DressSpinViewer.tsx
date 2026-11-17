"use client";

import * as React from "react";
import { ViewTransition } from "react";
import { Maximize2, MoveHorizontal, RotateCw, X, ZoomIn } from "lucide-react";
import type { Dress, DressShot } from "@/lib/types";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

interface SpinFrame {
  shot: DressShot;
  mirror: boolean;
  degLabel: string;
}

function buildSpinFrames(dress: Dress): SpinFrame[] {
  const byAngle = (a: DressShot["angle"]) => dress.shots.find((s) => s.angle === a);
  const front = byAngle("front") || dress.shots[0];
  const tq = byAngle("three-quarter");
  const side = byAngle("side");
  const back = byAngle("back");
  const tqL = byAngle("three-quarter-l");
  const sideL = byAngle("side-l");

  const frames: SpinFrame[] = [];
  if (front) frames.push({ shot: front, mirror: false, degLabel: "٠° — أمامي" });
  if (tq) frames.push({ shot: tq, mirror: false, degLabel: "٤٥° — يمين" });
  if (side) frames.push({ shot: side, mirror: false, degLabel: "٩٠° — جانبي" });
  if (back) frames.push({ shot: back, mirror: false, degLabel: "١٨٠° — خلفي" });
  if (sideL) frames.push({ shot: sideL, mirror: false, degLabel: "٢٧٠° — جانبي" });
  else if (side && dress.symmetric) frames.push({ shot: side, mirror: true, degLabel: "٢٧٠° — جانبي" });
  if (tqL) frames.push({ shot: tqL, mirror: false, degLabel: "٣١٥° — يسار" });
  else if (tq && dress.symmetric) frames.push({ shot: tq, mirror: true, degLabel: "٣١٥° — يسار" });

  return frames.length > 0 && front ? frames : [{ shot: dress.shots[0], mirror: false, degLabel: "٠°" }];
}

export function DressSpinViewer({ dress }: { dress: Dress }) {
  const spinFrames = React.useMemo(() => buildSpinFrames(dress), [dress]);
  const detailShots = React.useMemo(
    () => dress.shots.filter((s) => s.angle === "detail"),
    [dress.shots],
  );

  const [mode, setMode] = React.useState<"spin" | "detail">("spin");
  const [frameIdx, setFrameIdx] = React.useState(0);
  const [detailIdx, setDetailIdx] = React.useState(0);
  const [zoomActive, setZoomActive] = React.useState(false);
  const [zoomOrigin, setZoomOrigin] = React.useState({ x: 50, y: 40 });
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [turntableY, setTurntableY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  useLockBodyScroll(lightboxOpen);

  const dragRef = React.useRef({
    active: false,
    startX: 0,
    accumX: 0,
    autoCancelled: false,
  });

  // Gentle introductory spin cue on enter so user sees it rotates smoothly
  React.useEffect(() => {
    if (spinFrames.length <= 1) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) return;

    const t1 = setTimeout(() => {
      if (!dragRef.current.autoCancelled) setFrameIdx(1);
    }, 550);
    const t2 = setTimeout(() => {
      if (!dragRef.current.autoCancelled) setFrameIdx(0);
    }, 1250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [spinFrames.length]);

  const currentFrame = spinFrames[frameIdx % spinFrames.length] || spinFrames[0];
  const activeSrc =
    mode === "detail" && detailShots[detailIdx]
      ? detailShots[detailIdx].src
      : currentFrame.shot.src;
  const activeMirror = mode === "spin" && currentFrame.mirror;

  const stepSpin = React.useCallback(
    (delta: number) => {
      setMode("spin");
      setFrameIdx((prev) => (prev + delta + spinFrames.length) % spinFrames.length);
    },
    [spinFrames.length],
  );

  return (
    <div className="space-y-3">
      {/* Main Stage Wrapped in Shared ViewTransition for Hero -> Page Morph */}
      <ViewTransition name={`dress-${dress.code}`} share="morph" default="none">
        <div
          data-spin-stage
          onPointerDown={(e) => {
            if (mode !== "spin") return;
            dragRef.current.active = true;
            dragRef.current.autoCancelled = true;
            dragRef.current.startX = e.clientX;
            dragRef.current.accumX = 0;
            setIsDragging(true);
          }}
          onPointerMove={(e) => {
            if (zoomActive) {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
              const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
              setZoomOrigin({ x, y });
            }
            if (!dragRef.current.active || mode !== "spin") return;
            const dx = e.clientX - dragRef.current.startX;
            dragRef.current.startX = e.clientX;
            dragRef.current.accumX += dx;
            const stepPx = 56;
            if (Math.abs(dragRef.current.accumX) >= stepPx) {
              const steps = Math.trunc(dragRef.current.accumX / stepPx);
              dragRef.current.accumX -= steps * stepPx;
              stepSpin(steps > 0 ? 1 : -1);
            }
            setTurntableY(Math.max(-14, Math.min(14, dragRef.current.accumX * 0.25)));
          }}
          onPointerUp={() => {
            dragRef.current.active = false;
            setIsDragging(false);
            setTurntableY(0);
          }}
          onPointerCancel={() => {
            dragRef.current.active = false;
            setIsDragging(false);
            setTurntableY(0);
          }}
          onMouseLeave={() => {
            setZoomActive(false);
            dragRef.current.active = false;
            setIsDragging(false);
            setTurntableY(0);
          }}
          style={{ touchAction: "pan-y" }}
          className={`relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[#F7F1E8] shadow-sm select-none ${
            mode === "spin" ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
          }`}
        >
          <div
            style={{
              transform: `perspective(1400px) rotateY(${turntableY.toFixed(2)}deg)`,
              transition: isDragging ? "none" : "transform 280ms cubic-bezier(0.22,1,0.36,1)",
            }}
            className="h-full w-full"
          >
            <img
              src={activeSrc}
              alt={`${dress.nameAr} — ${mode === "detail" ? "تفاصيل التطريز" : currentFrame.degLabel}`}
              draggable={false}
              style={{
                transform: `${activeMirror ? "scaleX(-1) " : ""}${zoomActive ? "scale(1.85)" : "scale(1)"}`,
                transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
              }}
              className="h-full w-full object-cover object-top transition-transform duration-200"
            />
          </div>

          {/* Top Bar Inside Stage */}
          <div className="pointer-events-none absolute top-3 right-3 left-3 flex items-center justify-between gap-2">
            <span className="rounded bg-[#171317]/82 px-2.5 py-1 font-en text-[11px] font-semibold tracking-wider text-[#FFF9F2] backdrop-blur-xs">
              {dress.code}
            </span>
            <span className="rounded-full bg-[#FFF9F2]/92 px-3 py-1 text-[11px] font-semibold text-[#3A2930] shadow-xs backdrop-blur-xs">
              {mode === "detail" ? "لقطة تفاصيل قريبة" : currentFrame.degLabel}
            </span>
          </div>

          {/* Bottom Controls Overlay */}
          <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => stepSpin(1)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#3A2930]/88 px-3.5 py-1.5 text-xs font-semibold text-[#FFF9F2] backdrop-blur-xs transition hover:bg-[var(--brand-gold)]"
            >
              <MoveHorizontal className="h-3.5 w-3.5" />
              <span>اسحبي أو اضغطي للف الفستان</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoomActive((z) => !z)}
                aria-label="عدسة تكبير التفاصيل"
                className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-xs transition ${
                  zoomActive
                    ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#FFF9F2]"
                    : "border-[#3A2930]/20 bg-[#FFF9F2]/92 text-[#3A2930] hover:border-[var(--brand-gold)]"
                }`}
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label="عرض بملء الشاشة"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3A2930]/20 bg-[#FFF9F2]/92 text-[#3A2930] backdrop-blur-xs transition hover:border-[var(--brand-gold)]"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </ViewTransition>

      {/* Angle Thumbnails & Detail Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {spinFrames.map((f, i) => {
          const isCurrent = mode === "spin" && i === frameIdx;
          return (
            <button
              key={`${f.shot.angle}-${i}`}
              type="button"
              onClick={() => {
                dragRef.current.autoCancelled = true;
                setMode("spin");
                setFrameIdx(i);
              }}
              className={`group relative w-16 shrink-0 overflow-hidden rounded-md border bg-[#F7F1E8] transition ${
                isCurrent
                  ? "border-[var(--brand-gold)] ring-2 ring-[var(--brand-gold)]/30"
                  : "border-[var(--border-subtle)] opacity-80 hover:opacity-100"
              }`}
            >
              <div className="aspect-[2/3] w-full">
                <img
                  src={f.shot.src}
                  alt={f.degLabel}
                  style={f.mirror ? { transform: "scaleX(-1)" } : undefined}
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <span className="block bg-[var(--bg-primary)] py-0.5 text-center text-[10px] font-semibold text-[var(--text-strong)]">
                {f.degLabel.split("—")[1]?.trim() || f.shot.labelAr}
              </span>
            </button>
          );
        })}

        {detailShots.map((dShot, idx) => {
          const isCurrent = mode === "detail" && detailIdx === idx;
          return (
            <button
              key={`detail-${idx}`}
              type="button"
              onClick={() => {
                dragRef.current.autoCancelled = true;
                setMode("detail");
                setDetailIdx(idx);
              }}
              className={`relative w-16 shrink-0 overflow-hidden rounded-md border bg-[#F7F1E8] transition ${
                isCurrent
                  ? "border-[var(--brand-gold)] ring-2 ring-[var(--brand-gold)]/30"
                  : "border-[var(--border-subtle)] opacity-85 hover:opacity-100"
              }`}
            >
              <div className="aspect-[2/3] w-full">
                <img src={dShot.src} alt={dShot.labelAr} className="h-full w-full object-cover" />
              </div>
              <span className="block bg-[var(--brand-gold)] py-0.5 text-center text-[10px] font-semibold text-[#FFF9F2]">
                تفاصيل
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => stepSpin(1)}
          className="flex h-24 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[var(--brand-gold)]/60 bg-[var(--bg-surface)] text-[10px] font-semibold text-[var(--brand-gold)] hover:bg-[var(--brand-gold)]/10"
        >
          <RotateCw className="h-4 w-4" />
          <span>لفّة</span>
        </button>
      </div>

      {/* Fullscreen Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="عرض الفستان بحجم كبير"
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="إغلاق"
            className="absolute top-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-[var(--brand-gold)]"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative max-h-[88vh] max-w-2xl overflow-hidden rounded-lg bg-[#F7F1E8]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeSrc}
              alt={dress.nameAr}
              style={activeMirror ? { transform: "scaleX(-1)" } : undefined}
              className="max-h-[88vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
