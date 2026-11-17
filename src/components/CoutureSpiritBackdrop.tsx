"use client";

import * as React from "react";
import type { Occasion } from "@/lib/types";
import { useTheme } from "./ThemeProvider";

export type SpiritCreatureKey = "gazelle" | "butterfly" | "fennec" | "swan" | "dove";

interface SpiritTheme {
  creature: SpiritCreatureKey;
  lightHex: string;
  darkHex: string;
}

const DRESS_SPIRIT_MAP: Record<string, SpiritTheme> = {
  "RD-01": { creature: "gazelle", lightHex: "#9E3B52", darkHex: "#E28A9F" },
  "RD-02": { creature: "butterfly", lightHex: "#AA5E7C", darkHex: "#DF96B2" },
  "RD-03": { creature: "fennec", lightHex: "#A67D2E", darkHex: "#DFC07C" },
  "RD-04": { creature: "swan", lightHex: "#B28A3C", darkHex: "#E5C785" },
  "RD-05": { creature: "butterfly", lightHex: "#BE7086", darkHex: "#E8A2B6" },
  "RD-06": { creature: "dove", lightHex: "#9E8355", darkHex: "#DCC49A" },
  "RD-07": { creature: "gazelle", lightHex: "#AD8652", darkHex: "#E4C394" },
  "RD-08": { creature: "fennec", lightHex: "#8D5B75", darkHex: "#D5A1BC" },
};

const OCCASION_SPIRIT_FALLBACK: Record<Occasion, SpiritTheme> = {
  engagement: { creature: "butterfly", lightHex: "#BE7086", darkHex: "#E8A2B6" },
  soiree: { creature: "gazelle", lightHex: "#9E3B52", darkHex: "#E28A9F" },
  "katb-ketab": { creature: "dove", lightHex: "#9E8355", darkHex: "#DCC49A" },
  bridal: { creature: "swan", lightHex: "#B28A3C", darkHex: "#E5C785" },
  handmade: { creature: "fennec", lightHex: "#A67D2E", darkHex: "#DFC07C" },
};

export function resolveDressSpirit(dressCode?: string, occasion?: Occasion): SpiritTheme {
  if (dressCode && DRESS_SPIRIT_MAP[dressCode]) {
    return DRESS_SPIRIT_MAP[dressCode];
  }
  if (occasion && OCCASION_SPIRIT_FALLBACK[occasion]) {
    return OCCASION_SPIRIT_FALLBACK[occasion];
  }
  return DRESS_SPIRIT_MAP["RD-01"];
}

type Pt = [number, number];

interface SampledCreature {
  outer: Pt[];
  inner1: Pt[];
  inner2: Pt[];
  inner3: Pt[];
}

function cubicAt(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

function quadAt(p0: Pt, p1: Pt, p2: Pt, t: number): Pt {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ];
}

function sampleSvgPath(d: string, targetCount: number, closed: boolean): Pt[] {
  const tokens = d.match(/[MLCQZmlcqz]|-?\d*\.?\d+/g) ?? [];
  let i = 0;
  let cur: Pt = [100, 100];
  let start: Pt = [100, 100];
  const raw: Pt[] = [];

  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === "M") {
      cur = [parseFloat(tokens[i++]), parseFloat(tokens[i++])];
      start = [cur[0], cur[1]];
      raw.push([cur[0], cur[1]]);
    } else if (cmd === "L") {
      const next: Pt = [parseFloat(tokens[i++]), parseFloat(tokens[i++])];
      for (let s = 1; s <= 14; s++) {
        const t = s / 14;
        raw.push([cur[0] + (next[0] - cur[0]) * t, cur[1] + (next[1] - cur[1]) * t]);
      }
      cur = next;
    } else if (cmd === "Q") {
      const c1: Pt = [parseFloat(tokens[i++]), parseFloat(tokens[i++])];
      const next: Pt = [parseFloat(tokens[i++]), parseFloat(tokens[i++])];
      for (let s = 1; s <= 22; s++) raw.push(quadAt(cur, c1, next, s / 22));
      cur = next;
    } else if (cmd === "C") {
      const c1: Pt = [parseFloat(tokens[i++]), parseFloat(tokens[i++])];
      const c2: Pt = [parseFloat(tokens[i++]), parseFloat(tokens[i++])];
      const next: Pt = [parseFloat(tokens[i++]), parseFloat(tokens[i++])];
      for (let s = 1; s <= 26; s++) raw.push(cubicAt(cur, c1, c2, next, s / 26));
      cur = next;
    } else if (cmd === "Z" || cmd === "z") {
      for (let s = 1; s <= 14; s++) {
        const t = s / 14;
        raw.push([cur[0] + (start[0] - cur[0]) * t, cur[1] + (start[1] - cur[1]) * t]);
      }
      cur = [start[0], start[1]];
    }
  }

  const cum: number[] = [0];
  for (let k = 1; k < raw.length; k++) {
    cum.push(cum[k - 1] + Math.hypot(raw[k][0] - raw[k - 1][0], raw[k][1] - raw[k - 1][1]));
  }
  const total = cum[cum.length - 1] || 1;
  const out: Pt[] = [];
  for (let m = 0; m < targetCount; m++) {
    const dist = (m / (closed ? targetCount : targetCount - 1)) * total;
    let idx = 0;
    while (idx < cum.length - 2 && cum[idx + 1] < dist) idx++;
    const segLen = cum[idx + 1] - cum[idx] || 1;
    const t = (dist - cum[idx]) / segLen;
    out.push([
      raw[idx][0] + (raw[idx + 1][0] - raw[idx][0]) * t,
      raw[idx][1] + (raw[idx + 1][1] - raw[idx][1]) * t,
    ]);
  }
  return out;
}

function pointsToSmoothSvg(pts: Pt[], closed: boolean, tension = 0.16): string {
  const n = pts.length;
  if (n < 2) return "";
  const get = (idx: number): Pt =>
    closed ? pts[((idx % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, idx))];
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  const count = closed ? n : n - 1;
  for (let i = 0; i < count; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) * tension;
    const c1y = p1[1] + (p2[1] - p0[1]) * tension;
    const c2x = p2[0] - (p3[0] - p1[0]) * tension;
    const c2y = p2[1] - (p3[1] - p1[1]) * tension;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  if (closed) d += " Z";
  return d;
}

function lerpPts(a: Pt[], b: Pt[], t: number): Pt[] {
  return a.map((p, idx) => [p[0] + (b[idx][0] - p[0]) * t, p[1] + (b[idx][1] - p[1]) * t]);
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// 5 Hand-Crafted Cute Couture Spirit Creatures (Clockwise from Top-Head for Twist-Free Morphing)
const RAW_DESIGNS: Record<
  SpiritCreatureKey,
  { outer: string; inner1: string; inner2: string; inner3: string }
> = {
  gazelle: {
    outer: `
      M 114 32
      C 110 16, 102 14, 106 30
      C 118 28, 128 34, 132 42
      C 142 46, 150 51, 148 56
      C 146 61, 134 62, 124 60
      C 118 74, 120 92, 128 106
      C 134 116, 134 130, 128 144
      L 134 174
      C 135 178, 129 179, 127 174
      L 118 144
      L 112 174
      C 111 178, 105 178, 106 173
      L 110 138
      C 98 140, 82 138, 72 134
      L 66 174
      C 65 178, 59 178, 60 173
      L 64 134
      L 52 168
      C 50 173, 45 171, 47 166
      L 58 126
      C 52 116, 52 104, 60 96
      C 50 92, 46 82, 54 80
      C 60 79, 65 86, 70 92
      C 82 92, 96 90, 104 74
      C 108 62, 108 50, 104 44
      C 90 42, 78 34, 82 27
      C 86 21, 100 28, 108 34
      Z
    `,
    inner1: `M 122 46 Q 127 43, 131 47`,
    inner2: `M 86 31 Q 94 34, 102 39`,
    inner3: `M 74 106 C 82 103, 90 103, 98 106`,
  },

  fennec: {
    outer: `
      M 100 54
      C 116 32, 146 16, 162 24
      C 170 30, 156 62, 130 76
      C 136 84, 134 96, 120 104
      C 112 108, 106 110, 100 111
      C 112 116, 122 130, 122 148
      C 138 134, 164 134, 170 150
      C 176 166, 154 180, 122 176
      C 104 178, 84 178, 74 174
      C 68 170, 70 162, 76 160
      C 74 140, 78 120, 88 108
      C 72 100, 66 86, 72 76
      C 46 62, 30 30, 38 24
      C 54 16, 84 32, 100 54
      Z
    `,
    inner1: `M 114 60 C 128 40, 148 30, 152 36 C 154 42, 140 60, 124 70`,
    inner2: `M 86 60 C 72 40, 52 30, 48 36 C 46 42, 60 60, 76 70`,
    inner3: `M 86 84 C 92 79, 96 86, 100 88 C 104 86, 108 79, 114 84`,
  },

  butterfly: {
    outer: `
      M 100 58
      C 106 38, 122 26, 126 32
      C 128 36, 114 44, 105 62
      C 128 36, 170 30, 178 54
      C 184 72, 164 96, 138 104
      C 158 112, 166 138, 148 156
      C 134 170, 114 156, 104 132
      C 103 146, 102 158, 100 162
      C 98 158, 97 146, 96 132
      C 86 156, 66 170, 52 156
      C 34 138, 42 112, 62 104
      C 36 96, 16 72, 22 54
      C 30 30, 72 36, 95 62
      C 86 44, 72 36, 74 32
      C 78 26, 94 38, 100 58
      Z
    `,
    inner1: `M 114 74 C 136 54, 158 54, 158 72 C 158 86, 136 94, 114 94`,
    inner2: `M 86 74 C 64 54, 42 54, 42 72 C 42 86, 64 94, 86 94`,
    inner3: `M 72 118 C 60 132, 66 146, 80 140`,
  },

  swan: {
    outer: `
      M 126 28
      C 130 18, 138 20, 136 30
      C 146 32, 150 40, 146 47
      C 154 51, 158 55, 150 58
      C 142 60, 136 55, 130 53
      C 118 68, 114 96, 128 112
      C 146 116, 156 132, 150 150
      C 142 168, 116 174, 84 174
      C 52 174, 34 158, 32 138
      C 30 124, 42 116, 52 114
      C 42 104, 48 92, 64 94
      C 56 82, 66 72, 86 80
      C 100 86, 108 98, 112 106
      C 102 86, 106 54, 120 36
      C 122 32, 124 30, 126 28
      Z
    `,
    inner1: `M 132 41 Q 136 39, 139 42`,
    inner2: `M 58 126 C 78 114, 108 118, 126 132`,
    inner3: `M 54 144 C 78 136, 108 138, 128 148`,
  },

  dove: {
    outer: `
      M 118 54
      C 130 48, 142 54, 142 64
      C 150 66, 156 69, 148 73
      C 142 75, 138 74, 134 76
      C 140 94, 134 118, 114 130
      C 96 142, 74 144, 54 158
      C 42 166, 32 162, 38 150
      C 46 136, 58 128, 68 122
      C 46 112, 28 92, 34 74
      C 38 62, 58 68, 78 82
      C 64 60, 62 34, 76 28
      C 92 22, 108 42, 112 60
      C 114 56, 116 55, 118 54
      Z
    `,
    inner1: `M 128 63 Q 132 61, 135 64`,
    inner2: `M 76 46 C 84 56, 92 70, 96 84`,
    inner3: `M 48 84 C 62 92, 76 100, 88 104`,
  },
};

const SAMPLED_CREATURES: Record<SpiritCreatureKey, SampledCreature> = {
  gazelle: {
    outer: sampleSvgPath(RAW_DESIGNS.gazelle.outer, 96, true),
    inner1: sampleSvgPath(RAW_DESIGNS.gazelle.inner1, 24, false),
    inner2: sampleSvgPath(RAW_DESIGNS.gazelle.inner2, 24, false),
    inner3: sampleSvgPath(RAW_DESIGNS.gazelle.inner3, 24, false),
  },
  fennec: {
    outer: sampleSvgPath(RAW_DESIGNS.fennec.outer, 96, true),
    inner1: sampleSvgPath(RAW_DESIGNS.fennec.inner1, 24, false),
    inner2: sampleSvgPath(RAW_DESIGNS.fennec.inner2, 24, false),
    inner3: sampleSvgPath(RAW_DESIGNS.fennec.inner3, 24, false),
  },
  butterfly: {
    outer: sampleSvgPath(RAW_DESIGNS.butterfly.outer, 96, true),
    inner1: sampleSvgPath(RAW_DESIGNS.butterfly.inner1, 24, false),
    inner2: sampleSvgPath(RAW_DESIGNS.butterfly.inner2, 24, false),
    inner3: sampleSvgPath(RAW_DESIGNS.butterfly.inner3, 24, false),
  },
  swan: {
    outer: sampleSvgPath(RAW_DESIGNS.swan.outer, 96, true),
    inner1: sampleSvgPath(RAW_DESIGNS.swan.inner1, 24, false),
    inner2: sampleSvgPath(RAW_DESIGNS.swan.inner2, 24, false),
    inner3: sampleSvgPath(RAW_DESIGNS.swan.inner3, 24, false),
  },
  dove: {
    outer: sampleSvgPath(RAW_DESIGNS.dove.outer, 96, true),
    inner1: sampleSvgPath(RAW_DESIGNS.dove.inner1, 24, false),
    inner2: sampleSvgPath(RAW_DESIGNS.dove.inner2, 24, false),
    inner3: sampleSvgPath(RAW_DESIGNS.dove.inner3, 24, false),
  },
};

const STATIC_SVG_PATHS: Record<
  SpiritCreatureKey,
  { outer: string; inner1: string; inner2: string; inner3: string }
> = {
  gazelle: {
    outer: pointsToSmoothSvg(SAMPLED_CREATURES.gazelle.outer, true),
    inner1: pointsToSmoothSvg(SAMPLED_CREATURES.gazelle.inner1, false),
    inner2: pointsToSmoothSvg(SAMPLED_CREATURES.gazelle.inner2, false),
    inner3: pointsToSmoothSvg(SAMPLED_CREATURES.gazelle.inner3, false),
  },
  fennec: {
    outer: pointsToSmoothSvg(SAMPLED_CREATURES.fennec.outer, true),
    inner1: pointsToSmoothSvg(SAMPLED_CREATURES.fennec.inner1, false),
    inner2: pointsToSmoothSvg(SAMPLED_CREATURES.fennec.inner2, false),
    inner3: pointsToSmoothSvg(SAMPLED_CREATURES.fennec.inner3, false),
  },
  butterfly: {
    outer: pointsToSmoothSvg(SAMPLED_CREATURES.butterfly.outer, true),
    inner1: pointsToSmoothSvg(SAMPLED_CREATURES.butterfly.inner1, false),
    inner2: pointsToSmoothSvg(SAMPLED_CREATURES.butterfly.inner2, false),
    inner3: pointsToSmoothSvg(SAMPLED_CREATURES.butterfly.inner3, false),
  },
  swan: {
    outer: pointsToSmoothSvg(SAMPLED_CREATURES.swan.outer, true),
    inner1: pointsToSmoothSvg(SAMPLED_CREATURES.swan.inner1, false),
    inner2: pointsToSmoothSvg(SAMPLED_CREATURES.swan.inner2, false),
    inner3: pointsToSmoothSvg(SAMPLED_CREATURES.swan.inner3, false),
  },
  dove: {
    outer: pointsToSmoothSvg(SAMPLED_CREATURES.dove.outer, true),
    inner1: pointsToSmoothSvg(SAMPLED_CREATURES.dove.inner1, false),
    inner2: pointsToSmoothSvg(SAMPLED_CREATURES.dove.inner2, false),
    inner3: pointsToSmoothSvg(SAMPLED_CREATURES.dove.inner3, false),
  },
};

export function CoutureSpiritBackdrop({
  dressCode,
  occasion,
  variant = "stage",
}: {
  dressCode?: string;
  occasion?: Occasion;
  variant?: "hero" | "stage" | "card";
}) {
  const { theme } = useTheme();
  const spirit = resolveDressSpirit(dressCode, occasion);
  const targetHex = theme === "dark" ? spirit.darkHex : spirit.lightHex;

  // Refs for direct zero-re-render SVG path & color morphing at 60/120fps
  const auraRef = React.useRef<HTMLDivElement | null>(null);
  const leftOuterRef = React.useRef<SVGPathElement | null>(null);
  const leftI1Ref = React.useRef<SVGPathElement | null>(null);
  const leftI2Ref = React.useRef<SVGPathElement | null>(null);
  const leftI3Ref = React.useRef<SVGPathElement | null>(null);

  const rightOuterRef = React.useRef<SVGPathElement | null>(null);
  const rightI1Ref = React.useRef<SVGPathElement | null>(null);
  const rightI2Ref = React.useRef<SVGPathElement | null>(null);
  const rightI3Ref = React.useRef<SVGPathElement | null>(null);

  const morphStateRef = React.useRef<{
    curPts: SampledCreature;
    curRgb: [number, number, number];
    raf: number;
  }>({
    curPts: SAMPLED_CREATURES[spirit.creature],
    curRgb: hexToRgb(targetHex),
    raf: 0,
  });

  // Card variant uses lightweight static pre-computed paths + CSS transition
  React.useEffect(() => {
    if (variant === "card") return;

    const m = morphStateRef.current;
    const fromPts = m.curPts;
    const toPts = SAMPLED_CREATURES[spirit.creature];
    const fromRgb = m.curRgb;
    const toRgb = hexToRgb(targetHex);

    if (m.raf) cancelAnimationFrame(m.raf);

    const applyFrame = (pts: SampledCreature, rgb: [number, number, number]) => {
      const dOuter = pointsToSmoothSvg(pts.outer, true);
      const d1 = pointsToSmoothSvg(pts.inner1, false);
      const d2 = pointsToSmoothSvg(pts.inner2, false);
      const d3 = pointsToSmoothSvg(pts.inner3, false);
      const rgbStr = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

      const setGroup = (
        o: SVGPathElement | null,
        i1: SVGPathElement | null,
        i2: SVGPathElement | null,
        i3: SVGPathElement | null,
      ) => {
        if (o) {
          o.setAttribute("d", dOuter);
          o.setAttribute("stroke", rgbStr);
          o.setAttribute("fill", rgbStr);
        }
        if (i1) {
          i1.setAttribute("d", d1);
          i1.setAttribute("stroke", rgbStr);
        }
        if (i2) {
          i2.setAttribute("d", d2);
          i2.setAttribute("stroke", rgbStr);
        }
        if (i3) {
          i3.setAttribute("d", d3);
          i3.setAttribute("stroke", rgbStr);
        }
      };

      setGroup(leftOuterRef.current, leftI1Ref.current, leftI2Ref.current, leftI3Ref.current);
      setGroup(rightOuterRef.current, rightI1Ref.current, rightI2Ref.current, rightI3Ref.current);

      if (auraRef.current) {
        const auraAlpha = theme === "dark" ? 0.14 : 0.10;
        const flankAlpha = theme === "dark" ? 0.08 : 0.055;
        auraRef.current.style.background =
          variant === "hero"
            ? `radial-gradient(46% 52% at 50% 46%, rgba(${rgb[0]},${rgb[1]},${rgb[2]},${auraAlpha}) 0%, transparent 72%), radial-gradient(32% 38% at 16% 36%, rgba(${rgb[0]},${rgb[1]},${rgb[2]},${flankAlpha}) 0%, transparent 70%), radial-gradient(32% 38% at 84% 44%, rgba(${rgb[0]},${rgb[1]},${rgb[2]},${flankAlpha}) 0%, transparent 70%)`
            : `radial-gradient(62% 58% at 50% 44%, rgba(${rgb[0]},${rgb[1]},${rgb[2]},${auraAlpha}) 0%, transparent 74%)`;
      }
    };

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || (fromPts === toPts && fromRgb[0] === toRgb[0] && fromRgb[1] === toRgb[1])) {
      m.curPts = toPts;
      m.curRgb = toRgb;
      applyFrame(toPts, toRgb);
      return;
    }

    const duration = 760;
    const start = performance.now();

    const step = (now: number) => {
      const rawT = Math.min(1, (now - start) / duration);
      const t = easeInOutCubic(rawT);

      const pts: SampledCreature = {
        outer: lerpPts(fromPts.outer, toPts.outer, t),
        inner1: lerpPts(fromPts.inner1, toPts.inner1, t),
        inner2: lerpPts(fromPts.inner2, toPts.inner2, t),
        inner3: lerpPts(fromPts.inner3, toPts.inner3, t),
      };
      const rgb = lerpRgb(fromRgb, toRgb, t);
      m.curPts = pts;
      m.curRgb = rgb;
      applyFrame(pts, rgb);

      if (rawT < 1) {
        m.raf = requestAnimationFrame(step);
      } else {
        m.curPts = toPts;
        m.curRgb = toRgb;
        m.raf = 0;
      }
    };

    m.raf = requestAnimationFrame(step);
    return () => {
      if (m.raf) cancelAnimationFrame(m.raf);
      m.raf = 0;
    };
  }, [spirit.creature, targetHex, theme, variant]);

  const initialPaths = STATIC_SVG_PATHS[spirit.creature];
  const initialRgb = hexToRgb(targetHex);

  if (variant === "card") {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      >
        <div
          style={{
            background: `radial-gradient(65% 58% at 50% 42%, rgba(${initialRgb[0]},${initialRgb[1]},${initialRgb[2]},${theme === "dark" ? 0.12 : 0.08}) 0%, transparent 74%)`,
          }}
          className="absolute inset-0"
        />
        <svg
          viewBox="0 0 200 200"
          className="animate-couture-float absolute left-2 top-9 size-16 opacity-[0.14] transition-opacity duration-300 group-hover:opacity-[0.24] sm:size-20"
        >
          <path
            d={initialPaths.outer}
            fill={targetHex}
            fillOpacity="0.06"
            stroke={targetHex}
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d={initialPaths.inner1} fill="none" stroke={targetHex} strokeWidth="1.6" strokeLinecap="round" />
          <path d={initialPaths.inner2} fill="none" stroke={targetHex} strokeWidth="1.6" strokeLinecap="round" />
          <path d={initialPaths.inner3} fill="none" stroke={targetHex} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
      >
        {/* Smoothly Morphing Ambient Spotlight Aura */}
        <div ref={auraRef} className="absolute inset-0" />

        {/* Left Open-Corridor Morphing Couture Creature (Sits cleanly in the open air beside the spotlight gown!) */}
        <svg
          viewBox="0 0 200 200"
          className="animate-couture-float absolute left-2 top-[13%] size-20 opacity-[0.19] sm:left-[33%] sm:top-[20%] sm:size-32 lg:left-[35%] lg:top-[21%] lg:size-40"
        >
          <path
            ref={leftOuterRef}
            d={initialPaths.outer}
            fill={targetHex}
            fillOpacity="0.055"
            stroke={targetHex}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path ref={leftI1Ref} d={initialPaths.inner1} fill="none" stroke={targetHex} strokeWidth="1.4" strokeLinecap="round" />
          <path ref={leftI2Ref} d={initialPaths.inner2} fill="none" stroke={targetHex} strokeWidth="1.4" strokeLinecap="round" />
          <path ref={leftI3Ref} d={initialPaths.inner3} fill="none" stroke={targetHex} strokeWidth="1.4" strokeLinecap="round" />
        </svg>

        {/* Right Open-Corridor Mirrored Companion Morphing Creature */}
        <svg
          viewBox="0 0 200 200"
          className="animate-couture-float-mirror absolute right-2 top-[14%] size-18 opacity-[0.16] sm:right-[33%] sm:top-[44%] sm:size-28 lg:right-[35%] lg:top-[43%] lg:size-34"
        >
          <path
            ref={rightOuterRef}
            d={initialPaths.outer}
            fill={targetHex}
            fillOpacity="0.05"
            stroke={targetHex}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path ref={rightI1Ref} d={initialPaths.inner1} fill="none" stroke={targetHex} strokeWidth="1.4" strokeLinecap="round" />
          <path ref={rightI2Ref} d={initialPaths.inner2} fill="none" stroke={targetHex} strokeWidth="1.4" strokeLinecap="round" />
          <path ref={rightI3Ref} d={initialPaths.inner3} fill="none" stroke={targetHex} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // "stage" variant (inside DressSpinViewer & CoutureLiftModal behind the model)
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
    >
      <div ref={auraRef} className="absolute inset-0" />

      <svg
        viewBox="0 0 200 200"
        className="animate-couture-float absolute left-3 top-6 size-24 opacity-[0.18] sm:left-5 sm:top-8 sm:size-32"
      >
        <path
          ref={leftOuterRef}
          d={initialPaths.outer}
          fill={targetHex}
          fillOpacity="0.05"
          stroke={targetHex}
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path ref={leftI1Ref} d={initialPaths.inner1} fill="none" stroke={targetHex} strokeWidth="1.4" strokeLinecap="round" />
        <path ref={leftI2Ref} d={initialPaths.inner2} fill="none" stroke={targetHex} strokeWidth="1.4" strokeLinecap="round" />
        <path ref={leftI3Ref} d={initialPaths.inner3} fill="none" stroke={targetHex} strokeWidth="1.4" strokeLinecap="round" />
      </svg>

      <svg
        viewBox="0 0 200 200"
        className="animate-couture-float-mirror absolute bottom-14 right-3 size-20 opacity-[0.15] sm:bottom-16 sm:right-5 sm:size-28"
      >
        <path
          ref={rightOuterRef}
          d={initialPaths.outer}
          fill={targetHex}
          fillOpacity="0.045"
          stroke={targetHex}
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path ref={rightI1Ref} d={initialPaths.inner1} fill="none" stroke={targetHex} strokeWidth="1.4" strokeLinecap="round" />
        <path ref={rightI2Ref} d={initialPaths.inner2} fill="none" stroke={targetHex} strokeWidth="1.4" strokeLinecap="round" />
        <path ref={rightI3Ref} d={initialPaths.inner3} fill="none" stroke={targetHex} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}
