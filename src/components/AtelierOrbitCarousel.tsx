"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft, CalendarCheck, Heart } from "lucide-react";
import type { Dress, Occasion } from "@/lib/types";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import { OCCASION_LABELS_AR, STATUS_LABELS_AR } from "@/lib/whatsapp";
import { CoutureSpiritBackdrop } from "./CoutureSpiritBackdrop";
import { useShortlist } from "./ShortlistProvider";

interface AtelierOrbitCarouselProps {
  dresses: Dress[];
}

const SLASH_HOUSE: Record<Occasion, string> = {
  engagement: "RONY / ENGAGEMENT",
  soiree: "RONY / SOIREE",
  "katb-ketab": "RONY / KATB KETAB",
  bridal: "RONY / BRIDAL",
  handmade: "RONY / HANDMADE",
};

const ELLIPSE_RATIO = 0.145;
const AUTOPLAY_INTERVAL_MS = 3600;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function normAngle(deg: number) {
  let a = ((deg % 360) + 360) % 360;
  if (a > 180) a -= 360;
  return a;
}

function lambert(deg: number) {
  const rad = (deg * Math.PI) / 180;
  return 0.68 + 0.32 * Math.pow(Math.abs(Math.cos(rad)), 0.75);
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

export function AtelierOrbitCarousel({ dresses }: AtelierOrbitCarouselProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const count = dresses.length;
  const reduced = React.useSyncExternalStore(
    subscribeReducedMotion,
    getReducedSnapshot,
    getReducedServer,
  );

  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const slotRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const gownRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const shadowRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const codeBadgeRefs = React.useRef<(HTMLSpanElement | null)[]>([]);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const [liftedIndex, setLiftedIndex] = React.useState<number | null>(null);
  const [userStopped, setUserStopped] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);

  const [dims, setDims] = React.useState({
    w: 1180,
    stageH: 486,
    gownW: 312,
    gownH: 468,
    radiusX: 455,
    floorY: 406,
  });

  const simRef = React.useRef({
    theta: 0,
    vtheta: 0,
    targetTheta: 0,
    sway: 0,
    vsway: 0,
    raf: 0,
    last: 0,
    radiusX: 430,
  });

  const pointerRef = React.useRef({
    id: -1,
    hitIndex: -1,
    startX: 0,
    startY: 0,
    startTheta: 0,
    lastX: 0,
    lastT: 0,
    vx: 0,
    moved: false,
  });

  const stopAutoplay = React.useCallback(() => {
    setUserStopped(true);
  }, []);

  const lockedMobileVhRef = React.useRef(0);
  const lastMeasuredWRef = React.useRef(0);

  // Measure single-viewport stage cleanly (lock mobile vh against URL-bar scroll resize jumps!)
  React.useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.max(320, Math.round(el.clientWidth));
      const rawVh = typeof window !== "undefined" ? window.innerHeight : 880;
      const isMobile = w < 640;

      // Ignore mobile Chrome/Safari URL-bar show/hide resize events where width hasn't changed
      if (isMobile && lastMeasuredWRef.current > 0 && Math.abs(w - lastMeasuredWRef.current) < 2) {
        return;
      }
      lastMeasuredWRef.current = w;
      if (isMobile) {
        lockedMobileVhRef.current = rawVh;
      }
      const vh = isMobile ? lockedMobileVhRef.current || rawVh : rawVh;

      const gownH = isMobile
        ? clamp(Math.round(vh * 0.48), 348, 435)
        : clamp(Math.round(vh * 0.52), 400, 490);
      const gownW = Math.round(gownH * (2 / 3));
      const radiusX = isMobile
        ? Math.min(Math.round(w * 0.385), 172)
        : Math.min(Math.round(w * 0.385), 465);
      const radiusY = Math.round(radiusX * ELLIPSE_RATIO);
      const stageH = gownH + (isMobile ? 18 : 22);
      const floorY = stageH - radiusY - (isMobile ? 9 : 11);

      simRef.current.radiusX = radiusX;
      setDims((old) =>
        Math.abs(old.w - w) < 1 && Math.abs(old.gownH - gownH) < 1
          ? old
          : { w, stageH, gownW, gownH, radiusX, floorY },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // GPU-only frame painter (zero React state updates during motion)
  const paint = React.useCallback(() => {
    const s = simRef.current;
    if (count === 0) return;
    const step = 360 / count;
    const rx = s.radiusX;
    const ry = rx * ELLIPSE_RATIO;

    for (let i = 0; i < count; i++) {
      const slot = slotRefs.current[i];
      if (!slot) continue;

      const deg = normAngle(s.theta + i * step);
      const rad = (deg * Math.PI) / 180;
      const sin = Math.sin(rad);
      const cos = Math.cos(rad);
      const depth = (cos + 1) / 2; // 0 (back) .. 1 (front spotlight)

      const x = sin * rx;
      const y = cos * ry;
      const scale = 0.54 + Math.pow(depth, 1.22) * 0.46;
      const swayDeg = s.sway * (0.3 + depth * 0.7);

      // Smooth occlusion fade behind the spotlight gown so wide tulle skirts never peek behind narrow waists
      const occlusionFade = clamp((cos + 0.94) / 0.28, 0, 1);
      const opacity = (cos > 0.88 ? 1 : 0.32 + depth * 0.64) * occlusionFade;

      slot.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(3)}) rotate(${swayDeg.toFixed(2)}deg)`;
      slot.style.opacity = opacity.toFixed(3);
      slot.style.zIndex = String(10 + Math.round(depth * 40));

      const sh = shadowRefs.current[i];
      if (sh) {
        sh.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${(scale * 0.92).toFixed(3)})`;
        sh.style.opacity = ((0.08 + depth * 0.24) * occlusionFade).toFixed(3);
      }

      const badge = codeBadgeRefs.current[i];
      if (badge) {
        badge.style.opacity = cos > 0.92 ? "1" : "0";
      }
    }
  }, [count]);

  const stepLoopRef = React.useRef<(now: number) => void>(() => {});

  const stepLoop = React.useCallback(
    (now: number) => {
      const s = simRef.current;
      const dt = s.last ? Math.min(0.034, (now - s.last) / 1000) : 1 / 60;
      s.last = now;

      const dragging = pointerRef.current.id >= 0 && pointerRef.current.moved;
      const sub = 2;
      const sdt = dt / sub;

      for (let k = 0; k < sub; k++) {
        const prevV = s.vtheta;
        if (!dragging) {
          // Calm, weighty, critically-damped harmonic spring (MO WORLD boutique cadence)
          const stiff = 28;
          const damp = 2 * Math.sqrt(stiff) * 0.92;
          const aTheta = -stiff * (s.theta - s.targetTheta) - damp * s.vtheta;
          s.vtheta += aTheta * sdt;
          s.theta += s.vtheta * sdt;
        }
        const accel = (s.vtheta - prevV) / sdt;
        const aSway = -26 * s.sway - 5.2 * s.vsway - clamp(accel, -400, 400) * 0.012;
        s.vsway += aSway * sdt;
        s.sway = clamp(s.sway + s.vsway * sdt, -1.8, 1.8);
      }

      paint();

      const stillMoving =
        dragging ||
        Math.abs(s.theta - s.targetTheta) > 0.04 ||
        Math.abs(s.vtheta) > 0.04 ||
        Math.abs(s.sway) > 0.015 ||
        Math.abs(s.vsway) > 0.03;

      if (stillMoving) {
        s.raf = requestAnimationFrame(stepLoopRef.current);
      } else {
        s.theta = s.targetTheta;
        s.vtheta = 0;
        s.sway = 0;
        s.vsway = 0;
        s.raf = 0;
        s.last = 0;
        paint();
      }
    },
    [paint],
  );

  React.useEffect(() => {
    stepLoopRef.current = stepLoop;
  }, [stepLoop]);

  const kick = React.useCallback(() => {
    const s = simRef.current;
    if (reduced) {
      s.theta = s.targetTheta;
      s.vtheta = 0;
      s.sway = 0;
      s.vsway = 0;
      paint();
      return;
    }
    if (!s.raf) {
      s.last = 0;
      s.raf = requestAnimationFrame(stepLoopRef.current);
    }
  }, [paint, reduced]);

  React.useLayoutEffect(() => {
    paint();
  }, [dims, paint]);

  React.useEffect(() => {
    const s = simRef.current;
    return () => {
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, []);

  const choose = React.useCallback(
    (idx: number) => {
      if (count === 0) return;
      const wrapped = ((idx % count) + count) % count;
      const step = 360 / count;
      const s = simRef.current;
      const desired = -wrapped * step;
      const diff = normAngle(desired - s.theta);
      s.targetTheta = s.theta + diff;
      setActiveIndex(wrapped);
      kick();
    },
    [count, kick],
  );

  // Calm MO WORLD step-wise autoplay: pauses 3.6s on each gown, glides 1 step, stops immediately when user interacts
  React.useEffect(() => {
    if (userStopped || hovered || reduced || openIndex !== null || count <= 1) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "visible" && pointerRef.current.id < 0) {
        choose((activeIndex + 1) % count);
      }
    }, AUTOPLAY_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [activeIndex, choose, count, hovered, openIndex, reduced, userStopped]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const btn = (e.target as HTMLElement).closest("[data-gown-idx]") as HTMLElement | null;
    const hitIdx = btn ? Number(btn.getAttribute("data-gown-idx")) : -1;
    const now = performance.now();
    pointerRef.current = {
      id: e.pointerId,
      hitIndex: hitIdx,
      startX: e.clientX,
      startY: e.clientY,
      startTheta: simRef.current.theta,
      lastX: e.clientX,
      lastT: now,
      vx: 0,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pointerRef.current;
    if (p.id !== e.pointerId) return;
    const dx = e.clientX - p.startX;
    const dy = e.clientY - p.startY;
    const now = performance.now();

    if (!p.moved && Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(dy)) {
      p.moved = true;
      stopAutoplay();
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    if (p.moved) {
      const dt = Math.max(1, now - p.lastT);
      const instVx = (e.clientX - p.lastX) / dt; // px/ms
      p.vx = p.vx * 0.65 + instVx * 0.35;
      p.lastX = e.clientX;
      p.lastT = now;

      // Calm, weighty 1:1 drag sensitivity (0.14 deg/px — never flies out of control)
      const s = simRef.current;
      const prevTheta = s.theta;
      s.theta = p.startTheta + dx * 0.14;
      s.targetTheta = s.theta;
      s.vtheta = clamp(((s.theta - prevTheta) / dt) * 1000, -90, 90);
      kick();
    }
  };

  const finishPointer = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const p = pointerRef.current;
    if (p.id !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    pointerRef.current = { ...p, id: -1 };

    if (p.moved && count > 0) {
      const s = simRef.current;
      const step = 360 / count;
      // Gentle controlled flick boost (max ±0.65 of one step) so it snaps cleanly without spinning wildly
      const flickDeg = clamp(p.vx * 26, -step * 0.65, step * 0.65);
      const projected = s.theta + flickDeg;
      const snappedSlot = Math.round(-projected / step);
      const wrapped = ((snappedSlot % count) + count) % count;
      s.targetTheta = -snappedSlot * step;
      s.vtheta = clamp(p.vx * 55, -75, 75);
      setActiveIndex(wrapped);
      kick();
      return;
    }

    if (cancelled || p.hitIndex < 0) return;
    stopAutoplay();
    if (p.hitIndex === activeIndex) {
      setOpenIndex(p.hitIndex);
    } else {
      choose(p.hitIndex);
    }
  };

  const activeDress = dresses[activeIndex] ?? dresses[0];
  if (!activeDress) return null;

  const hemAnchorPx = Math.round(dims.gownH * 0.966);
  const cx = dims.w / 2;
  const primaryHouse = SLASH_HOUSE[activeDress.occasions[0]] ?? "RONY / COUTURE";

  return (
    <section
      aria-label="معرض فساتين Rony Dress الدائري"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative isolate flex min-h-[calc(100svh-5.4rem)] w-full flex-col justify-between overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-stage)] text-[var(--text-primary)] lg:min-h-[calc(100svh-4.1rem)]"
    >
      {/* Clean Architectural Studio Light Wash (Zero SVG Wireframes) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(110% 68% at 50% 0%, color-mix(in oklab, var(--foreground) 5%, transparent), transparent 64%), linear-gradient(to bottom, transparent 58%, color-mix(in oklab, var(--foreground) 3.5%, transparent))",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Symmetric Single-Line Eyebrow & Couture Headline */}
        <header className="mx-auto flex max-w-3xl flex-col items-center gap-1 text-center">
          <p
            dir="ltr"
            className="font-en text-[10px] font-semibold tracking-[0.22em] whitespace-nowrap text-[var(--text-muted)] uppercase sm:text-[11px]"
          >
            RONY DRESS • COUTURE ATELIER
          </p>
          <h1 className="text-balance text-2xl font-bold tracking-tight text-[var(--text-strong)] sm:text-3xl lg:text-[34px]">
            إطلالات ملكية تنبض بالتفاصيل
          </h1>
        </header>

        {/* Frameless 3D Circular Studio Stage (Zero Wireframe Lines, Zero Side Arrows) */}
        <div
          ref={stageRef}
          dir="ltr"
          role="group"
          tabIndex={0}
          aria-label="فساتين العرض الدائري"
          style={{ height: `${dims.stageH}px`, touchAction: "pan-y" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => finishPointer(e, false)}
          onPointerCancel={(e) => finishPointer(e, true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              stopAutoplay();
              choose((activeIndex + 1) % count);
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              stopAutoplay();
              choose((activeIndex - 1 + count) % count);
            } else if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              stopAutoplay();
              setOpenIndex(activeIndex);
            }
          }}
          className="relative mt-2 w-full cursor-grab select-none outline-none active:cursor-grabbing"
        >
          {/* Enchanted Roaming & Morphing Couture Spirit Creatures Strictly Behind Stage Gowns */}
          <CoutureSpiritBackdrop
            dressCode={activeDress.code}
            occasion={activeDress.occasions[0]}
            variant="hero"
          />
          {/* Soft Grounded Contact Shadows Under Each Gown */}
          {dresses.map((dress, i) => (
            <span
              key={`sh-${dress.code}`}
              ref={(el) => {
                shadowRefs.current[i] = el;
              }}
              aria-hidden="true"
              style={{
                left: `${cx}px`,
                top: `${dims.floorY}px`,
                width: `${Math.round(dims.gownW * 0.68)}px`,
                height: `${Math.max(14, Math.round(dims.gownW * 0.13))}px`,
                marginLeft: `${-Math.round(dims.gownW * 0.34)}px`,
                marginTop: `${-Math.max(7, Math.round(dims.gownW * 0.065))}px`,
                visibility: liftedIndex === i ? "hidden" : undefined,
                background:
                  "radial-gradient(ellipse at center, rgba(11,9,12,0.30) 0%, rgba(11,9,12,0.09) 48%, transparent 74%)",
                willChange: "transform, opacity",
              }}
              className="pointer-events-none absolute z-[1] rounded-full"
            />
          ))}

          {/* 8 Pure Floating RGBA Cutout Gowns */}
          {dresses.map((dress, i) => {
            const frontShot = dress.shots.find((s) => s.angle === "front") ?? dress.shots[0];
            return (
              <button
                key={dress.code}
                ref={(el) => {
                  slotRefs.current[i] = el;
                }}
                type="button"
                data-gown-idx={i}
                tabIndex={-1}
                aria-label={`${dress.nameAr} (${dress.code})`}
                style={{
                  left: `${cx}px`,
                  top: `${dims.floorY - hemAnchorPx}px`,
                  width: `${dims.gownW}px`,
                  height: `${dims.gownH}px`,
                  marginLeft: `${-dims.gownW / 2}px`,
                  transformOrigin: `50% ${hemAnchorPx}px`,
                  visibility: liftedIndex === i ? "hidden" : undefined,
                  willChange: "transform, opacity",
                }}
                className="group absolute cursor-pointer outline-none"
              >
                <span
                  ref={(el) => {
                    gownRefs.current[i] = el;
                  }}
                  className="relative block size-full transition-transform duration-300 group-hover:-translate-y-0.5"
                >
                  {frontShot && (
                    <img
                      src={frontShot.src}
                      alt={dress.nameAr}
                      decoding="async"
                      fetchPriority={i < 2 ? "high" : "auto"}
                      draggable={false}
                      className="pointer-events-none size-full select-none object-contain"
                    />
                  )}
                  <span
                    ref={(el) => {
                      codeBadgeRefs.current[i] = el;
                    }}
                    dir="ltr"
                    style={{ opacity: i === 0 ? 1 : 0 }}
                    className="pointer-events-none absolute right-0 top-[8%] rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/92 px-2.5 py-0.5 font-en text-[9px] font-semibold tracking-[0.14em] text-[var(--text-primary)] shadow-2xs transition-opacity duration-200"
                  >
                    {dress.code}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Soft Capsule Indicator Dots + Symmetric Caption & Capsule CTAs */}
        <div className="relative z-10 flex flex-col items-center gap-2.5 text-center">
          {count > 1 && (
            <div
              dir="ltr"
              role="group"
              aria-label="اختيار الفستان"
              className="flex justify-center gap-1.5"
            >
              {dresses.map((d, i) => (
                <button
                  key={d.code}
                  type="button"
                  aria-label={`عرض ${d.nameAr}`}
                  aria-current={activeIndex === i}
                  onClick={() => {
                    stopAutoplay();
                    choose(i);
                  }}
                  className={`h-1.5 rounded-full outline-none transition-[width,background-color] duration-300 ${
                    activeIndex === i
                      ? "w-6 bg-[var(--brand-gold)]"
                      : "w-1.5 bg-foreground/22 hover:bg-foreground/45"
                  }`}
                />
              ))}
            </div>
          )}

          <div
            id={`${uid}-caption`}
            aria-live="polite"
            className="flex max-w-md flex-col items-center justify-center"
          >
            <span
              dir="ltr"
              className="font-en text-[10px] font-semibold tracking-[0.2em] text-[var(--brand-gold)]"
            >
              {primaryHouse} {"//"} {activeDress.code}
            </span>
            <p className="mt-0.5 line-clamp-1 text-base font-bold text-[var(--text-strong)] sm:text-lg">
              {activeDress.nameAr}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              اسحبي للتنقل بين الموديلات أو اضغطي على الفستان لمعاينة الأمام والظهر
            </p>
          </div>

          <div className="mt-1 grid w-full max-w-[344px] grid-cols-2 gap-2.5 sm:max-w-sm">
            <button
              type="button"
              onClick={() => {
                stopAutoplay();
                setOpenIndex(activeIndex);
              }}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-[var(--brand-gold)] px-4 text-xs font-semibold text-[#F7F6F3] whitespace-nowrap transition-colors hover:bg-[var(--brand-gold-hover)]"
            >
              <span>معاينة الأمام والظهر</span>
              <ArrowLeft className="size-3.5 shrink-0" strokeWidth={1.5} />
            </button>
            <Link
              href="/collection"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 text-xs font-semibold text-[var(--text-primary)] whitespace-nowrap transition-colors hover:border-[var(--text-primary)]"
            >
              تصفحي الكولكشن
            </Link>
          </div>
        </div>
      </div>

      {/* MO WORLD Lifted 3D Couture Inspection Modal */}
      {openIndex !== null && dresses[openIndex] && (
        <CoutureLiftModal
          uid={uid}
          dress={dresses[openIndex]}
          reduced={reduced}
          sourceRect={() => gownRefs.current[openIndex]?.getBoundingClientRect() ?? null}
          onLift={(lifted) => setLiftedIndex(lifted ? openIndex : null)}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </section>
  );
}

function CoutureLiftModal({
  uid,
  dress,
  reduced,
  sourceRect,
  onLift,
  onClose,
}: {
  uid: string;
  dress: Dress;
  reduced: boolean;
  sourceRect: () => DOMRect | null;
  onLift: (lifted: boolean) => void;
  onClose: () => void;
}) {
  useLockBodyScroll(true);
  const { hasItem, toggleItem } = useShortlist();
  const saved = hasItem(dress.code);

  const figureRef = React.useRef<HTMLDivElement | null>(null);
  const spinRef = React.useRef<HTMLDivElement | null>(null);
  const frontShadeRef = React.useRef<HTMLSpanElement | null>(null);
  const backShadeRef = React.useRef<HTMLSpanElement | null>(null);
  const shadowRef = React.useRef<HTMLSpanElement | null>(null);
  const closingRef = React.useRef(false);
  const sourceRectRef = React.useRef(sourceRect);
  const onLiftRef = React.useRef(onLift);
  React.useEffect(() => {
    sourceRectRef.current = sourceRect;
    onLiftRef.current = onLift;
  });

  const [shown, setShown] = React.useState(false);
  const [side, setSide] = React.useState<"front" | "back">("front");
  const [selectedSize, setSelectedSize] = React.useState(dress.sizes[0] ?? "38");

  const angleRef = React.useRef({
    value: 0,
    target: 0,
    velocity: 0,
    raf: 0,
    last: 0,
    pointerId: -1,
    dragging: false,
    scrolling: false,
    startX: 0,
    startY: 0,
    startAngle: 0,
  });

  const frontShot = dress.shots.find((s) => s.angle === "front") ?? dress.shots[0];
  const backShot = dress.shots.find((s) => s.angle === "back") ?? frontShot;

  const applyAngle = React.useCallback((deg: number) => {
    if (spinRef.current) {
      spinRef.current.style.transform = `rotateY(${deg.toFixed(2)}deg)`;
    }
    const shade = (1 - lambert(deg)) * 0.52;
    if (frontShadeRef.current) frontShadeRef.current.style.opacity = shade.toFixed(3);
    if (backShadeRef.current) backShadeRef.current.style.opacity = shade.toFixed(3);
    if (shadowRef.current) {
      const sx = Math.max(0.22, Math.abs(Math.cos((deg * Math.PI) / 180)));
      shadowRef.current.style.transform = `translateX(-50%) scaleX(${sx.toFixed(3)})`;
    }
  }, []);

  const spinLoopRef = React.useRef<(now: number) => void>(() => {});

  const spinLoop = React.useCallback(
    (now: number) => {
      const a = angleRef.current;
      const dt = a.last ? Math.min(0.034, (now - a.last) / 1000) : 1 / 60;
      a.last = now;
      const accel = -90 * (a.value - a.target) - 2 * Math.sqrt(90) * 0.84 * a.velocity;
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
      a.raf = requestAnimationFrame(spinLoopRef.current);
    },
    [applyAngle],
  );

  React.useEffect(() => {
    spinLoopRef.current = spinLoop;
  }, [spinLoop]);

  const turnTo = React.useCallback(
    (next: "front" | "back") => {
      const a = angleRef.current;
      const base = Math.round(a.value / 360) * 360;
      let target = base + (next === "back" ? 180 : 0);
      if (Math.abs(target - a.value) > 180) {
        target -= 360 * Math.sign(target - a.value);
      }
      a.target = target;
      setSide(next);
      if (reduced) {
        a.value = a.target;
        applyAngle(a.value);
        return;
      }
      if (!a.raf) {
        a.last = 0;
        a.raf = requestAnimationFrame(spinLoopRef.current);
      }
    },
    [applyAngle, reduced],
  );

  // Lift garment smoothly off the Hero stage ONCE on open (never re-trigger on mobile resize/scroll!)
  React.useLayoutEffect(() => {
    const figure = figureRef.current;
    const from = sourceRectRef.current();
    const cur = angleRef.current;
    let animation: Animation | null = null;
    if (figure && from && !reduced && from.width > 0) {
      const to = figure.getBoundingClientRect();
      const scale = from.height / to.height;
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top - to.top;
      const lift = Math.min(72, Math.abs(dy) * 0.22 + 24);
      onLiftRef.current(true);
      animation = figure.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
          {
            transform: `translate(${dx * 0.38}px, ${dy * 0.38 - lift}px) scale(${((scale + 1) / 2) * 1.02})`,
            offset: 0.5,
          },
          { transform: "none" },
        ],
        { duration: 640, easing: "cubic-bezier(.22,.85,.3,1)" },
      );
    }
    const raf = requestAnimationFrame(() => setShown(true));
    return () => {
      cancelAnimationFrame(raf);
      animation?.cancel();
      cancelAnimationFrame(cur.raf);
      onLiftRef.current(false);
    };
  }, [reduced]);

  const dismiss = React.useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setShown(false);
    const figure = figureRef.current;
    const to = sourceRectRef.current();
    if (!figure || !to || reduced || to.width === 0) {
      onClose();
      return;
    }
    const from = figure.getBoundingClientRect();
    const scale = to.height / from.height;
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top - from.top;
    const animation = figure.animate(
      [
        { transform: "none" },
        { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 24}px) scale(${(scale + 1) / 2})`, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
      ],
      { duration: 480, easing: "cubic-bezier(.45,0,.55,1)", fill: "forwards" },
    );
    animation.onfinish = () => onClose();
  }, [onClose, reduced]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismiss();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        turnTo(side === "front" ? "back" : "front");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss, side, turnTo]);

  if (typeof document === "undefined") return null;

  const titleId = `${uid}-lift-title`;
  const houseLabel = SLASH_HOUSE[dress.occasions[0]] ?? "RONY / COUTURE";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-modal-scroll
      className="no-scrollbar fixed inset-0 z-50 overflow-y-auto overscroll-contain px-4 sm:px-6"
    >
      <div
        aria-hidden="true"
        onClick={dismiss}
        className={`fixed inset-0 bg-[var(--bg-primary)]/94 backdrop-blur-xl transition-opacity duration-300 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />

      <button
        type="button"
        onClick={dismiss}
        className={`fixed left-5 top-5 z-20 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] outline-none transition-[opacity,border-color] duration-300 hover:border-[var(--text-primary)] ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      >
        <span>إغلاق</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M3 3l10 10M13 3L3 13" />
        </svg>
      </button>

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-5xl items-start justify-center pt-16 pb-8 md:items-center md:py-8">
        <div className="grid w-full items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] md:gap-10">
          {/* Bounded Studio Stage: Roaming Creatures Strictly Behind Gown (Never Under × إغلاق or Over Text!) */}
          <div className="relative mx-auto flex h-[340px] w-full max-w-[460px] items-center justify-center sm:h-[490px]">
            <div
              className={`pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 ${
                shown ? "opacity-100" : "opacity-0"
              }`}
            >
              <CoutureSpiritBackdrop
                dressCode={dress.code}
                occasion={dress.occasions[0]}
                variant="modal"
              />
            </div>

            {/* 3D Two-Sided Drag-Flip Stage (Rock-Solid Pixel Height — Zero Mobile Scroll Jump!) */}
            <div
              dir="ltr"
              ref={figureRef}
              className="relative z-10 mx-auto aspect-[2/3] h-[340px] origin-top sm:h-[490px]"
            >
            <span
              ref={shadowRef}
              aria-hidden="true"
              style={{
                transform: "translateX(-50%) scaleX(1)",
                background:
                  "radial-gradient(ellipse at center, rgba(11,9,12,0.28) 0%, rgba(11,9,12,0.08) 48%, transparent 74%)",
              }}
              className="pointer-events-none absolute bottom-1 left-1/2 h-5 w-[62%] rounded-full"
            />

            <div
              data-spin-stage
              style={{ perspective: "1400px" }}
              onPointerDown={(e) => {
                if (e.button !== 0 && e.pointerType === "mouse") return;
                const a = angleRef.current;
                a.pointerId = e.pointerId;
                a.dragging = false;
                a.scrolling = false;
                a.startX = e.clientX;
                a.startY = e.clientY;
                a.startAngle = a.value;
              }}
              onPointerMove={(e) => {
                const a = angleRef.current;
                if (a.pointerId !== e.pointerId || a.scrolling) return;
                const dx = e.clientX - a.startX;
                const dy = e.clientY - a.startY;
                if (!a.dragging) {
                  if (Math.abs(dy) > 7 && Math.abs(dy) >= Math.abs(dx)) {
                    a.scrolling = true;
                    return;
                  }
                  if (Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(dy) * 1.15) {
                    a.dragging = true;
                    cancelAnimationFrame(a.raf);
                    a.raf = 0;
                    a.last = 0;
                    e.currentTarget.setPointerCapture(e.pointerId);
                  } else {
                    return;
                  }
                }
                a.value = clamp(
                  a.startAngle + dx * 0.48,
                  a.startAngle - 220,
                  a.startAngle + 220,
                );
                applyAngle(a.value);
              }}
              onPointerUp={(e) => {
                const a = angleRef.current;
                if (a.pointerId !== e.pointerId) return;
                a.pointerId = -1;
                if (!a.dragging) return;
                a.dragging = false;
                if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }
                const facing = ((a.value % 360) + 360) % 360;
                turnTo(facing > 90 && facing < 270 ? "back" : "front");
              }}
              onPointerCancel={() => {
                const a = angleRef.current;
                a.pointerId = -1;
                if (!a.dragging) return;
                a.dragging = false;
                turnTo(side);
              }}
              className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
            >
            <div ref={spinRef} className="absolute inset-0 [transform-style:preserve-3d]">
              <div className="absolute inset-0 [backface-visibility:hidden]">
                {frontShot && (
                  <div className="relative size-full">
                    <img
                      src={frontShot.src}
                      alt={dress.nameAr}
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
                )}
              </div>

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
            </div>
          </div>

          {/* Couture Details & Quick Actions Column */}
        <div
          dir="rtl"
          className={`flex flex-col gap-3.5 text-center transition-[opacity,transform] delay-75 duration-400 md:text-right ${
            shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <span
              dir="ltr"
              className="font-en text-[11px] font-semibold tracking-[0.22em] text-[var(--brand-gold)]"
            >
              {houseLabel}
            </span>
            <span
              dir="ltr"
              className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-0.5 font-en text-[10px] font-medium tracking-wider text-[var(--text-muted)]"
            >
              {dress.code}
            </span>
            <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-0.5 text-[10.5px] font-semibold text-[var(--text-primary)]">
              {STATUS_LABELS_AR[dress.status] ?? "متاح للإيجار"}
            </span>
          </div>

          <h3 id={titleId} className="text-xl font-bold text-[var(--text-strong)] sm:text-2xl">
            {dress.nameAr}
          </h3>
          <p dir="ltr" className="font-editorial text-lg italic text-[var(--text-muted)] md:text-right">
            {dress.nameEn}
          </p>

          <p className="text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">
            {dress.storyAr}
          </p>

          {/* Front / Back Sliding Underline Toggle */}
          <div
            role="group"
            aria-label="الوجه الأمامي / الظهر"
            className="mt-0.5 inline-flex justify-center gap-6 md:justify-start"
          >
            {(["front", "back"] as const).map((face) => (
              <button
                key={face}
                type="button"
                aria-pressed={side === face}
                onClick={() => turnTo(face)}
                className={`relative pb-1.5 text-xs font-semibold outline-none transition-colors ${
                  side === face
                    ? "text-[var(--text-strong)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {face === "front" ? "الوجه الأمامي" : "الظهر (لف ١٨٠°)"}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 bottom-0 h-[1.5px] bg-[var(--brand-gold)] transition-transform duration-300 ${
                    side === face ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Available Sizes + Actions */}
          <div className="mt-2 space-y-3 border-t border-[var(--border-subtle)] pt-3.5 text-right">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-primary)]">المقاسات المتاحة</span>
              <span className="text-[11px] text-[var(--text-muted)]">تضييق وضبط مجاني بالبروفة</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {dress.sizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`rounded-full border py-2 font-en text-xs font-semibold transition-colors ${
                    selectedSize === sz
                      ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#F7F6F3]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--text-primary)]"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2 pt-1">
              <Link
                href={`/dress/${dress.code}`}
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--brand-gold)] px-5 text-xs font-semibold text-[#F7F6F3] transition-colors hover:bg-[var(--brand-gold-hover)]"
              >
                <CalendarCheck className="size-4" strokeWidth={1.5} />
                <span>افتحي صفحة الحجز وفحص التاريخ — مقاس {selectedSize}</span>
              </Link>
              <button
                type="button"
                onClick={() =>
                  toggleItem({
                    code: dress.code,
                    nameAr: dress.nameAr,
                    nameEn: dress.nameEn,
                    image: frontShot?.src ?? "",
                    status: dress.status,
                    occasionLabel: OCCASION_LABELS_AR[dress.occasions[0]] ?? "مناسبات",
                  })
                }
                aria-label={saved ? "إزالة من اختياراتي" : "حفظ للبروفة"}
                className={`inline-flex size-11 items-center justify-center rounded-full border transition-colors ${
                  saved
                    ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#F7F6F3]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--text-primary)]"
                }`}
              >
                <Heart className={`size-4 ${saved ? "fill-current" : ""}`} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
