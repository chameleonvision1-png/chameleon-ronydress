"use client";

import * as React from "react";
import type { Occasion } from "@/lib/types";
import { useTheme } from "./ThemeProvider";

export type SpiritCreatureKey = "gazelle" | "butterfly" | "fennec" | "swan" | "dove";

const CREATURE_KEYS: SpiritCreatureKey[] = ["gazelle", "butterfly", "fennec", "swan", "dove"];

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

interface SampledPose {
  outer: Pt[];
  inner1: Pt[];
  inner2: Pt[];
  inner3: Pt[];
}

interface CompiledCreature {
  a: SampledPose;
  b: SampledPose;
}

interface RawPose {
  outer: string;
  inner1: string;
  inner2: string;
  inner3: string;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
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

function parseSegments(d: string): Array<(t: number) => Pt> {
  const tokens = d.match(/[MLCQZmlcqz]|-?\d*\.?\d+/g) ?? [];
  let i = 0;
  let cur: Pt = [100, 100];
  let start: Pt = [100, 100];
  const segs: Array<(t: number) => Pt> = [];

  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === "M") {
      cur = [parseFloat(tokens[i++]), parseFloat(tokens[i++])];
      start = [cur[0], cur[1]];
    } else if (cmd === "L") {
      const next: Pt = [parseFloat(tokens[i++]), parseFloat(tokens[i++])];
      const p0: Pt = [cur[0], cur[1]];
      segs.push((t) => [p0[0] + (next[0] - p0[0]) * t, p0[1] + (next[1] - p0[1]) * t]);
      cur = next;
    } else if (cmd === "Q") {
      const c1: Pt = [parseFloat(tokens[i++]), parseFloat(tokens[i++])];
      const next: Pt = [parseFloat(tokens[i++]), parseFloat(tokens[i++])];
      const p0: Pt = [cur[0], cur[1]];
      segs.push((t) => quadAt(p0, c1, next, t));
      cur = next;
    } else if (cmd === "C") {
      const c1: Pt = [parseFloat(tokens[i++]), parseFloat(tokens[i++])];
      const c2: Pt = [parseFloat(tokens[i++]), parseFloat(tokens[i++])];
      const next: Pt = [parseFloat(tokens[i++]), parseFloat(tokens[i++])];
      const p0: Pt = [cur[0], cur[1]];
      segs.push((t) => cubicAt(p0, c1, c2, next, t));
      cur = next;
    } else if (cmd === "Z" || cmd === "z") {
      const p0: Pt = [cur[0], cur[1]];
      const p1: Pt = [start[0], start[1]];
      if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > 0.5) {
        segs.push((t) => [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t]);
      }
      cur = [start[0], start[1]];
    }
  }
  return segs;
}

/**
 * Evaluates Pose A and Pose B at identical segment-local stations spaced uniformly by Pose A's
 * clockwise arc length starting at Top-Head. Guarantees:
 * 1) 1:1 anatomical limb/wing correspondence between Pose A and Pose B (zero vertex sliding while running/flapping)
 * 2) Uniform clockwise vertex distribution starting at Top-Head for silky cross-creature Bézier morphing!
 */
function compileMatchedPair(dA: string, dB: string, targetCount: number, closed: boolean): [Pt[], Pt[]] {
  const segsA = parseSegments(dA);
  const segsB = parseSegments(dB);
  const count = Math.min(segsA.length, segsB.length);

  const STEPS = 18;
  const segLens: number[] = [];
  for (let idx = 0; idx < count; idx++) {
    const fn = segsA[idx];
    let len = 0;
    let prev = fn(0);
    for (let s = 1; s <= STEPS; s++) {
      const pt = fn(s / STEPS);
      len += Math.hypot(pt[0] - prev[0], pt[1] - prev[1]);
      prev = pt;
    }
    segLens.push(Math.max(len, 0.001));
  }

  const cumSeg: number[] = [0];
  for (const l of segLens) cumSeg.push(cumSeg[cumSeg.length - 1] + l);
  const totalLen = cumSeg[cumSeg.length - 1] || 1;

  const ptsA: Pt[] = [];
  const ptsB: Pt[] = [];

  for (let m = 0; m < targetCount; m++) {
    const dist = (m / (closed ? targetCount : targetCount - 1)) * totalLen;
    let sIdx = 0;
    while (sIdx < count - 1 && cumSeg[sIdx + 1] < dist) sIdx++;
    const localT = clamp((dist - cumSeg[sIdx]) / segLens[sIdx], 0, 1);
    ptsA.push(segsA[sIdx](localT));
    ptsB.push(segsB[sIdx](localT));
  }

  return [ptsA, ptsB];
}

function compileCreaturePoses(poseA: RawPose, poseB: RawPose): CompiledCreature {
  const [outerA, outerB] = compileMatchedPair(poseA.outer, poseB.outer, 96, true);
  const [i1A, i1B] = compileMatchedPair(poseA.inner1, poseB.inner1, 24, false);
  const [i2A, i2B] = compileMatchedPair(poseA.inner2, poseB.inner2, 24, false);
  const [i3A, i3B] = compileMatchedPair(poseA.inner3, poseB.inner3, 24, false);
  return {
    a: { outer: outerA, inner1: i1A, inner2: i2A, inner3: i3A },
    b: { outer: outerB, inner1: i1B, inner2: i2B, inner3: i3B },
  };
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

// 5 Couture Spirit Creatures — Each with 2 Articulated Locomotion Poses (Clockwise from Top-Head)
const CREATURE_POSES: Record<SpiritCreatureKey, { poseA: RawPose; poseB: RawPose }> = {
  // 1. GAZELLE — Graceful Bounding / Prancing Fawn
  gazelle: {
    poseA: {
      outer: `
        M 126 36
        C 122 20, 114 18, 118 34
        C 130 32, 140 38, 144 45
        C 154 48, 162 53, 160 58
        C 158 63, 146 64, 136 62
        C 130 76, 132 92, 140 104
        L 168 130
        C 172 134, 168 140, 163 136
        L 136 114
        L 152 146
        C 154 152, 148 154, 145 148
        L 124 120
        C 108 124, 90 122, 78 118
        L 46 154
        C 42 158, 37 154, 41 149
        L 68 118
        L 34 138
        C 29 141, 26 136, 31 132
        L 64 108
        C 58 100, 58 90, 66 84
        C 56 80, 52 70, 60 68
        C 66 67, 72 74, 76 80
        C 90 82, 106 80, 114 66
        C 118 56, 118 46, 114 40
        C 100 38, 88 30, 92 23
        C 96 17, 110 24, 126 36
        Z
      `,
      inner1: `M 134 48 Q 139 45, 143 49`,
      inner2: `M 96 27 Q 104 30, 112 35`,
      inner3: `M 82 96 C 90 93, 98 93, 106 96`,
    },
    poseB: {
      outer: `
        M 122 40
        C 118 24, 110 22, 114 38
        C 126 36, 136 42, 140 49
        C 150 52, 158 57, 156 62
        C 154 67, 142 68, 132 66
        C 126 80, 128 96, 134 108
        L 124 156
        C 123 162, 117 162, 118 156
        L 124 118
        L 104 152
        C 101 157, 96 155, 98 149
        L 114 120
        C 100 124, 86 122, 76 118
        L 92 154
        C 94 160, 88 162, 85 156
        L 70 120
        L 64 158
        C 63 163, 57 162, 58 156
        L 64 112
        C 58 104, 58 94, 66 88
        C 58 86, 56 76, 64 74
        C 70 73, 74 79, 78 84
        C 90 86, 104 84, 110 70
        C 114 60, 114 50, 110 44
        C 96 44, 84 38, 88 31
        C 92 25, 106 30, 122 40
        Z
      `,
      inner1: `M 130 52 Q 135 49, 139 53`,
      inner2: `M 92 34 Q 100 36, 108 40`,
      inner3: `M 80 100 C 88 97, 96 97, 104 100`,
    },
  },

  // 2. FENNEC FOX — Cute Playful Trotting Desert Fox (Giant fox ears, dainty paws, big fluffy wagging tail)
  fennec: {
    poseA: {
      outer: `
        M 122 54
        C 132 26, 154 16, 160 24
        C 164 32, 150 54, 136 66
        C 146 70, 160 76, 162 82
        C 163 88, 150 92, 138 90
        C 134 100, 136 112, 142 120
        L 164 138
        C 168 142, 164 148, 158 144
        L 134 128
        L 144 154
        C 146 160, 139 162, 136 156
        L 122 132
        C 108 136, 94 136, 82 132
        L 62 156
        C 58 161, 52 157, 56 151
        L 74 128
        L 48 144
        C 42 147, 39 141, 44 137
        L 70 116
        C 44 114, 20 96, 24 76
        C 28 58, 56 64, 76 86
        C 88 94, 102 92, 108 80
        C 108 72, 106 66, 104 62
        C 86 52, 74 28, 82 22
        C 90 16, 112 30, 122 54
        Z
      `,
      inner1: `M 128 58 C 136 38, 150 28, 153 33 C 155 38, 144 54, 133 63`,
      inner2: `M 108 58 C 96 42, 86 30, 89 27 C 93 24, 108 38, 116 54`,
      inner3: `M 140 76 Q 145 73, 149 77`,
    },
    poseB: {
      outer: `
        M 120 58
        C 126 30, 146 20, 153 28
        C 158 36, 146 58, 134 69
        C 144 73, 158 79, 160 85
        C 161 91, 148 95, 136 93
        C 132 103, 134 114, 138 122
        L 132 156
        C 131 162, 124 162, 125 155
        L 128 130
        L 112 156
        C 109 161, 103 159, 106 153
        L 118 132
        C 106 136, 92 136, 82 132
        L 94 156
        C 96 161, 89 163, 86 157
        L 74 130
        L 68 156
        C 66 162, 60 160, 62 154
        L 70 120
        C 42 126, 18 114, 20 94
        C 22 76, 52 76, 74 92
        C 86 98, 100 96, 106 84
        C 106 76, 104 70, 102 66
        C 82 58, 68 36, 76 29
        C 84 22, 108 34, 120 58
        Z
      `,
      inner1: `M 126 62 C 132 42, 144 32, 147 37 C 149 42, 140 57, 131 66`,
      inner2: `M 106 62 C 92 48, 80 37, 83 34 C 87 31, 104 43, 114 58`,
      inner3: `M 138 79 Q 143 76, 147 80`,
    },
  },

  // 3. BUTTERFLY — Real Wing-Flapping Flight
  butterfly: {
    poseA: {
      outer: `
        M 100 58
        C 106 38, 122 26, 126 32
        C 128 36, 114 44, 105 62
        C 128 34, 174 28, 182 54
        C 188 72, 166 96, 138 104
        C 160 112, 168 140, 150 158
        C 134 172, 114 156, 104 132
        C 103 146, 102 158, 100 162
        C 98 158, 97 146, 96 132
        C 86 156, 66 172, 50 158
        C 32 140, 40 112, 62 104
        C 34 96, 12 72, 18 54
        C 26 28, 72 34, 95 62
        C 86 44, 72 36, 74 32
        C 78 26, 94 38, 100 58
        Z
      `,
      inner1: `M 114 74 C 138 52, 162 52, 162 72 C 162 86, 138 94, 114 94`,
      inner2: `M 86 74 C 62 52, 38 52, 38 72 C 38 86, 62 94, 86 94`,
      inner3: `M 72 118 C 58 134, 66 148, 82 140`,
    },
    poseB: {
      outer: `
        M 100 62
        C 104 42, 116 30, 120 36
        C 122 40, 110 48, 104 66
        C 116 30, 140 16, 144 44
        C 146 64, 132 88, 116 98
        C 130 106, 134 132, 122 148
        C 112 160, 105 148, 103 128
        C 102 142, 101 154, 100 158
        C 99 154, 98 142, 97 128
        C 95 148, 88 160, 78 148
        C 66 132, 70 106, 84 98
        C 68 88, 54 64, 56 44
        C 60 16, 84 30, 96 66
        C 90 48, 78 40, 80 36
        C 84 30, 96 42, 100 62
        Z
      `,
      inner1: `M 108 74 C 120 48, 132 46, 132 66 C 132 80, 120 88, 108 90`,
      inner2: `M 92 74 C 80 48, 68 46, 68 66 C 68 80, 80 88, 92 90`,
      inner3: `M 84 114 C 76 128, 80 140, 90 134`,
    },
  },

  // 4. SWAN — Graceful Gliding S-Neck Poise & Undulating Wing Plumes
  swan: {
    poseA: {
      outer: `
        M 126 26
        C 130 16, 138 18, 136 28
        C 146 30, 150 38, 146 45
        C 154 49, 158 53, 150 56
        C 142 58, 136 53, 130 51
        C 116 66, 112 94, 128 112
        C 148 116, 158 132, 152 150
        C 144 168, 118 174, 86 174
        C 54 174, 34 158, 32 138
        C 30 122, 42 112, 56 110
        C 40 96, 46 80, 68 86
        C 56 70, 70 56, 92 68
        C 106 76, 112 92, 114 104
        C 102 84, 106 52, 120 34
        C 122 30, 124 28, 126 26
        Z
      `,
      inner1: `M 132 39 Q 136 37, 139 40`,
      inner2: `M 56 122 C 78 108, 108 114, 128 130`,
      inner3: `M 48 150 C 74 142, 106 144, 134 152`,
    },
    poseB: {
      outer: `
        M 136 34
        C 140 24, 148 26, 146 36
        C 156 38, 160 46, 156 53
        C 164 57, 168 61, 160 64
        C 152 66, 146 61, 140 59
        C 126 74, 120 98, 134 114
        C 152 118, 160 134, 152 152
        C 144 168, 118 174, 86 174
        C 54 174, 36 160, 34 142
        C 32 128, 44 120, 58 118
        C 48 110, 54 98, 72 100
        C 66 88, 78 78, 96 86
        C 108 92, 114 102, 118 108
        C 110 88, 116 58, 130 42
        C 132 38, 134 36, 136 34
        Z
      `,
      inner1: `M 142 47 Q 146 45, 149 48`,
      inner2: `M 60 130 C 82 120, 110 124, 130 136`,
      inner3: `M 56 152 C 82 148, 110 148, 130 154`,
    },
  },

  // 5. DOVE — Clean Wing-Flapping Soaring Flight
  dove: {
    poseA: {
      outer: `
        M 126 62
        C 138 56, 150 62, 150 72
        C 158 74, 164 77, 156 81
        C 150 83, 146 82, 142 84
        C 148 102, 140 124, 120 136
        C 102 146, 80 148, 58 160
        C 46 168, 36 162, 42 150
        C 50 136, 62 128, 72 122
        C 46 106, 26 76, 36 56
        C 44 42, 68 56, 86 76
        C 72 50, 74 22, 92 18
        C 108 14, 118 42, 120 66
        C 122 63, 124 62, 126 62
        Z
      `,
      inner1: `M 136 70 Q 140 68, 143 71`,
      inner2: `M 90 36 C 96 48, 100 64, 102 80`,
      inner3: `M 52 70 C 66 82, 78 92, 92 98`,
    },
    poseB: {
      outer: `
        M 130 56
        C 142 50, 154 56, 154 66
        C 162 68, 168 71, 160 75
        C 154 77, 150 76, 146 78
        C 150 96, 142 118, 122 130
        C 104 140, 82 144, 60 154
        C 48 160, 38 156, 44 144
        C 52 132, 64 126, 74 120
        C 46 122, 22 112, 26 98
        C 30 86, 56 90, 80 96
        C 56 86, 44 70, 56 62
        C 70 54, 98 66, 122 62
        C 125 58, 128 57, 130 56
        Z
      `,
      inner1: `M 140 64 Q 144 62, 147 65`,
      inner2: `M 66 70 C 80 74, 94 80, 106 86`,
      inner3: `M 42 102 C 58 104, 74 106, 90 106`,
    },
  },
};

const COMPILED: Record<SpiritCreatureKey, CompiledCreature> = {
  gazelle: compileCreaturePoses(CREATURE_POSES.gazelle.poseA, CREATURE_POSES.gazelle.poseB),
  fennec: compileCreaturePoses(CREATURE_POSES.fennec.poseA, CREATURE_POSES.fennec.poseB),
  butterfly: compileCreaturePoses(CREATURE_POSES.butterfly.poseA, CREATURE_POSES.butterfly.poseB),
  swan: compileCreaturePoses(CREATURE_POSES.swan.poseA, CREATURE_POSES.swan.poseB),
  dove: compileCreaturePoses(CREATURE_POSES.dove.poseA, CREATURE_POSES.dove.poseB),
};

const INITIAL_SVG_PATHS: Record<
  SpiritCreatureKey,
  { outer: string; inner1: string; inner2: string; inner3: string }
> = {
  gazelle: {
    outer: pointsToSmoothSvg(COMPILED.gazelle.a.outer, true),
    inner1: pointsToSmoothSvg(COMPILED.gazelle.a.inner1, false),
    inner2: pointsToSmoothSvg(COMPILED.gazelle.a.inner2, false),
    inner3: pointsToSmoothSvg(COMPILED.gazelle.a.inner3, false),
  },
  fennec: {
    outer: pointsToSmoothSvg(COMPILED.fennec.a.outer, true),
    inner1: pointsToSmoothSvg(COMPILED.fennec.a.inner1, false),
    inner2: pointsToSmoothSvg(COMPILED.fennec.a.inner2, false),
    inner3: pointsToSmoothSvg(COMPILED.fennec.a.inner3, false),
  },
  butterfly: {
    outer: pointsToSmoothSvg(COMPILED.butterfly.a.outer, true),
    inner1: pointsToSmoothSvg(COMPILED.butterfly.a.inner1, false),
    inner2: pointsToSmoothSvg(COMPILED.butterfly.a.inner2, false),
    inner3: pointsToSmoothSvg(COMPILED.butterfly.a.inner3, false),
  },
  swan: {
    outer: pointsToSmoothSvg(COMPILED.swan.a.outer, true),
    inner1: pointsToSmoothSvg(COMPILED.swan.a.inner1, false),
    inner2: pointsToSmoothSvg(COMPILED.swan.a.inner2, false),
    inner3: pointsToSmoothSvg(COMPILED.swan.a.inner3, false),
  },
  dove: {
    outer: pointsToSmoothSvg(COMPILED.dove.a.outer, true),
    inner1: pointsToSmoothSvg(COMPILED.dove.a.inner1, false),
    inner2: pointsToSmoothSvg(COMPILED.dove.a.inner2, false),
    inner3: pointsToSmoothSvg(COMPILED.dove.a.inner3, false),
  },
};

function makeZeroPts(len: number): Pt[] {
  return Array.from({ length: len }, (): Pt => [0, 0]);
}

interface GaitSample {
  poseBlend: number;
  dyPx: number;
  tiltDeg: number;
}

function sampleCreatureGait(
  key: SpiritCreatureKey,
  sec: number,
  passProgress: number,
  actorOffset: number,
  scaleFactor: number,
): GaitSample {
  if (key === "gazelle") {
    const theta = sec * 1.55 * Math.PI * 2 + actorOffset;
    const poseBlend = 0.5 - 0.5 * Math.cos(theta);
    // Graceful parabolic bound hop synced 1:1 with leg leap!
    const leapLift = Math.pow(0.5 + 0.5 * Math.cos(theta), 1.35);
    return {
      poseBlend,
      dyPx: -leapLift * 14 * scaleFactor,
      tiltDeg: Math.sin(theta) * 5.2,
    };
  }
  if (key === "fennec") {
    const theta = sec * 2.35 * Math.PI * 2 + actorOffset;
    const poseBlend = 0.5 - 0.5 * Math.cos(theta);
    const trotHop = 0.5 + 0.5 * Math.cos(theta);
    return {
      poseBlend,
      dyPx: -trotHop * 6.5 * scaleFactor,
      tiltDeg: Math.sin(theta) * 3.6,
    };
  }
  if (key === "butterfly") {
    const theta = sec * 3.25 * Math.PI * 2 + actorOffset;
    const poseBlend = 0.5 - 0.5 * Math.cos(theta);
    const wavePhase = passProgress * Math.PI * 3 + actorOffset;
    return {
      poseBlend,
      dyPx: (Math.sin(wavePhase) * 20 - Math.cos(theta) * 3) * scaleFactor,
      tiltDeg: Math.cos(wavePhase) * 11,
    };
  }
  if (key === "dove") {
    const theta = sec * 2.15 * Math.PI * 2 + actorOffset;
    const poseBlend = 0.5 - 0.5 * Math.cos(theta);
    const soarPhase = passProgress * Math.PI * 2 + actorOffset;
    return {
      poseBlend,
      dyPx: (Math.sin(soarPhase) * 15 - Math.cos(theta) * 3.2) * scaleFactor,
      tiltDeg: Math.cos(soarPhase) * 7,
    };
  }
  // swan: serene unhurried glide
  const theta = sec * 0.9 * Math.PI * 2 + actorOffset;
  return {
    poseBlend: 0.5 - 0.5 * Math.cos(theta),
    dyPx: Math.sin(passProgress * Math.PI * 2 + actorOffset) * 3 * scaleFactor,
    tiltDeg: Math.sin(theta) * 1.5,
  };
}

function makeWeightVector(activeKey: SpiritCreatureKey): number[] {
  return CREATURE_KEYS.map((k) => (k === activeKey ? 1 : 0));
}

function softPassOpacity(p: number): number {
  const edge = 0.11;
  if (p < edge) return easeInOutCubic(p / edge);
  if (p > 1 - edge) return easeInOutCubic((1 - p) / edge);
  return 1;
}

export function CoutureSpiritBackdrop({
  dressCode,
  occasion,
  variant = "stage",
}: {
  dressCode?: string;
  occasion?: Occasion;
  variant?: "hero" | "modal" | "stage" | "card";
}) {
  const { theme } = useTheme();
  const spirit = resolveDressSpirit(dressCode, occasion);
  const targetHex = theme === "dark" ? spirit.darkHex : spirit.lightHex;

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const auraRef = React.useRef<HTMLDivElement | null>(null);

  const actor1WrapRef = React.useRef<HTMLDivElement | null>(null);
  const actor1OuterRef = React.useRef<SVGPathElement | null>(null);
  const actor1I1Ref = React.useRef<SVGPathElement | null>(null);
  const actor1I2Ref = React.useRef<SVGPathElement | null>(null);
  const actor1I3Ref = React.useRef<SVGPathElement | null>(null);

  const actor2WrapRef = React.useRef<HTMLDivElement | null>(null);
  const actor2OuterRef = React.useRef<SVGPathElement | null>(null);
  const actor2I1Ref = React.useRef<SVGPathElement | null>(null);
  const actor2I2Ref = React.useRef<SVGPathElement | null>(null);
  const actor2I3Ref = React.useRef<SVGPathElement | null>(null);

  // Persistent animation + cross-creature morph state (zero React re-renders!)
  const engineRef = React.useRef<{
    boxW: number;
    boxH: number;
    inView: boolean;
    raf: number;
    curW: number[];
    startW: number[];
    targetIdx: number;
    curRgb: [number, number, number];
    startRgb: [number, number, number];
    targetRgb: [number, number, number];
    morphStart: number;
    morphDuration: number;
    morphing: boolean;
    seedOffset: number;
  }>({
    boxW: 360,
    boxH: 380,
    inView: true,
    raf: 0,
    curW: makeWeightVector(spirit.creature),
    startW: makeWeightVector(spirit.creature),
    targetIdx: CREATURE_KEYS.indexOf(spirit.creature),
    curRgb: hexToRgb(targetHex),
    startRgb: hexToRgb(targetHex),
    targetRgb: hexToRgb(targetHex),
    morphStart: 0,
    morphDuration: 780,
    morphing: false,
    seedOffset:
      dressCode && dressCode.length >= 5
        ? ((parseInt(dressCode.slice(-2), 10) || 1) * 0.17) % 1
        : 0.14,
  });

  const livePropsRef = React.useRef({ theme, variant });
  const wakeLoopRef = React.useRef<() => void>(() => {});
  React.useEffect(() => {
    livePropsRef.current = { theme, variant };
  }, [theme, variant]);

  // Trigger smooth cross-creature Bézier + RGB morph whenever dressCode / theme changes!
  React.useEffect(() => {
    const e = engineRef.current;
    const nextIdx = CREATURE_KEYS.indexOf(spirit.creature);
    const nextRgb = hexToRgb(targetHex);

    const sameTarget =
      e.targetIdx === nextIdx &&
      e.targetRgb[0] === nextRgb[0] &&
      e.targetRgb[1] === nextRgb[1] &&
      e.targetRgb[2] === nextRgb[2];

    if (!sameTarget) {
      e.startW = [...e.curW];
      e.startRgb = [...e.curRgb];
      e.targetIdx = nextIdx;
      e.targetRgb = nextRgb;
      e.morphStart = performance.now();
      e.morphing = true;
      wakeLoopRef.current();
    }
  }, [spirit.creature, targetHex]);

  // Main viewport-aware living locomotion + Bézier morph loop
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const e = engineRef.current;

    const measure = () => {
      const rect = root.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        e.boxW = rect.width;
        e.boxH = rect.height;
      }
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(root);

    // Scratch buffers for zero-allocation weighted point blending per frame
    const buf1Outer = makeZeroPts(96);
    const buf1I1 = makeZeroPts(24);
    const buf1I2 = makeZeroPts(24);
    const buf1I3 = makeZeroPts(24);

    const buf2Outer = makeZeroPts(96);
    const buf2I1 = makeZeroPts(24);
    const buf2I2 = makeZeroPts(24);
    const buf2I3 = makeZeroPts(24);

    const applyActorSvg = (
      outerEl: SVGPathElement | null,
      i1El: SVGPathElement | null,
      i2El: SVGPathElement | null,
      i3El: SVGPathElement | null,
      bOuter: Pt[],
      bI1: Pt[],
      bI2: Pt[],
      bI3: Pt[],
      rgbStr: string,
    ) => {
      if (outerEl) {
        outerEl.setAttribute("d", pointsToSmoothSvg(bOuter, true));
        outerEl.setAttribute("stroke", rgbStr);
        outerEl.setAttribute("fill", rgbStr);
      }
      if (i1El) {
        i1El.setAttribute("d", pointsToSmoothSvg(bI1, false));
        i1El.setAttribute("stroke", rgbStr);
      }
      if (i2El) {
        i2El.setAttribute("d", pointsToSmoothSvg(bI2, false));
        i2El.setAttribute("stroke", rgbStr);
      }
      if (i3El) {
        i3El.setAttribute("d", pointsToSmoothSvg(bI3, false));
        i3El.setAttribute("stroke", rgbStr);
      }
    };

    const blendWeightedActor = (
      sec: number,
      passP: number,
      actorOffset: number,
      scaleFactor: number,
      outOuter: Pt[],
      outI1: Pt[],
      outI2: Pt[],
      outI3: Pt[],
    ): { dyPx: number; tiltDeg: number } => {
      for (let m = 0; m < 96; m++) {
        outOuter[m][0] = 0;
        outOuter[m][1] = 0;
      }
      for (let m = 0; m < 24; m++) {
        outI1[m][0] = 0;
        outI1[m][1] = 0;
        outI2[m][0] = 0;
        outI2[m][1] = 0;
        outI3[m][0] = 0;
        outI3[m][1] = 0;
      }

      let dyPx = 0;
      let tiltDeg = 0;

      for (let k = 0; k < CREATURE_KEYS.length; k++) {
        const w = e.curW[k];
        if (w < 0.001) continue;
        const key = CREATURE_KEYS[k];
        const comp = COMPILED[key];
        const gait = sampleCreatureGait(key, sec, passP, actorOffset, scaleFactor);
        const pb = gait.poseBlend;
        const pa = 1 - pb;

        dyPx += gait.dyPx * w;
        tiltDeg += gait.tiltDeg * w;

        for (let m = 0; m < 96; m++) {
          outOuter[m][0] += (comp.a.outer[m][0] * pa + comp.b.outer[m][0] * pb) * w;
          outOuter[m][1] += (comp.a.outer[m][1] * pa + comp.b.outer[m][1] * pb) * w;
        }
        for (let m = 0; m < 24; m++) {
          outI1[m][0] += (comp.a.inner1[m][0] * pa + comp.b.inner1[m][0] * pb) * w;
          outI1[m][1] += (comp.a.inner1[m][1] * pa + comp.b.inner1[m][1] * pb) * w;

          outI2[m][0] += (comp.a.inner2[m][0] * pa + comp.b.inner2[m][0] * pb) * w;
          outI2[m][1] += (comp.a.inner2[m][1] * pa + comp.b.inner2[m][1] * pb) * w;

          outI3[m][0] += (comp.a.inner3[m][0] * pa + comp.b.inner3[m][0] * pb) * w;
          outI3[m][1] += (comp.a.inner3[m][1] * pa + comp.b.inner3[m][1] * pb) * w;
        }
      }

      return { dyPx, tiltDeg };
    };

    const renderFrame = (now: number) => {
      // 1. Advance cross-creature Bézier + RGB morph if active
      if (e.morphing) {
        const rawT = clamp((now - e.morphStart) / e.morphDuration, 0, 1);
        const mt = easeInOutCubic(rawT);
        for (let k = 0; k < CREATURE_KEYS.length; k++) {
          const goal = k === e.targetIdx ? 1 : 0;
          e.curW[k] = e.startW[k] + (goal - e.startW[k]) * mt;
        }
        e.curRgb = lerpRgb(e.startRgb, e.targetRgb, mt);
        if (rawT >= 1) {
          e.curW = makeWeightVector(CREATURE_KEYS[e.targetIdx]);
          e.curRgb = [...e.targetRgb];
          e.morphing = false;
        }
      }

      const { theme: curTheme, variant: curVariant } = livePropsRef.current;
      const rgb = e.curRgb;
      const rgbStr = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

      if (auraRef.current) {
        const auraAlpha = curTheme === "dark" ? 0.14 : 0.095;
        auraRef.current.style.background = `radial-gradient(56% 58% at 50% 46%, rgba(${rgb[0]},${rgb[1]},${rgb[2]},${auraAlpha}) 0%, transparent 74%)`;
      }

      const W = Math.max(160, e.boxW);
      const H = Math.max(180, e.boxH);
      const isNarrow = W < 560;
      const sec = now / 1000;

      // Variant-specific safe stage geometry (zero overlap with buttons or titles!)
      let size1 = 96;
      let lane1Ratio = 0.56;
      let lane2Ratio = 0.28;
      let cycleSec = 9.8;
      let xMin = -20;
      let xMax = W + 20;
      let baseAlpha1 = curTheme === "dark" ? 0.25 : 0.23;
      const baseAlpha2 = curTheme === "dark" ? 0.20 : 0.185;

      if (curVariant === "hero") {
        size1 = isNarrow ? clamp(W * 0.21, 70, 84) : clamp(H * 0.28, 116, 144);
        // Mobile Hero: roam across the open studio horizon above side gowns & behind central gown's shoulders.
        // Desktop Hero: roam across the central [26%..74%] spotlight corridors & behind the central gown!
        lane1Ratio = isNarrow ? 0.15 : 0.54;
        lane2Ratio = isNarrow ? 0.09 : 0.26;
        cycleSec = isNarrow ? 8.6 : 9.4;
        xMin = isNarrow ? -size1 * 0.2 : W * 0.26;
        xMax = isNarrow ? W + size1 * 0.2 : W * 0.74;
      } else if (curVariant === "modal") {
        // Strictly inside the 340px / 490px dress stage box (completely below × إغلاق and above text!)
        size1 = isNarrow ? 84 : 114;
        lane1Ratio = 0.58;
        lane2Ratio = 0.26;
        cycleSec = 8.8;
        xMin = -size1 * 0.2;
        xMax = W + size1 * 0.2;
      } else if (curVariant === "stage") {
        // Strictly inside [18%..74%] of DressSpinViewer (clear of top RD-XX tag and bottom zoom/flip controls!)
        size1 = isNarrow ? 84 : 108;
        lane1Ratio = 0.57;
        lane2Ratio = 0.29;
        cycleSec = 9.2;
        xMin = -size1 * 0.2;
        xMax = W + size1 * 0.2;
      } else {
        // "card": delicate roaming watermark in safe middle band [28%..64%] behind the gown
        size1 = clamp(W * 0.34, 54, 72);
        lane1Ratio = 0.45;
        cycleSec = 7.8;
        xMin = -size1 * 0.2;
        xMax = W + size1 * 0.2;
        baseAlpha1 = curTheme === "dark" ? 0.19 : 0.17;
      }

      const scaleFactor = size1 / 110;
      const span = Math.max(80, xMax - xMin);

      // Actor 1: Runs / Bounds / Trots / Flies Left → Right behind the cutout gown!
      const p1 = (sec / cycleSec + e.seedOffset) % 1;
      const x1 = xMin + p1 * span - size1 * 0.5;
      const g1 = blendWeightedActor(
        sec,
        p1,
        0,
        scaleFactor,
        buf1Outer,
        buf1I1,
        buf1I2,
        buf1I3,
      );
      const y1 = H * lane1Ratio - size1 * 0.5 + g1.dyPx;
      const op1 = softPassOpacity(p1) * baseAlpha1;

      if (actor1WrapRef.current) {
        actor1WrapRef.current.style.width = `${size1.toFixed(0)}px`;
        actor1WrapRef.current.style.height = `${size1.toFixed(0)}px`;
        actor1WrapRef.current.style.opacity = op1.toFixed(3);
        actor1WrapRef.current.style.transform = `translate3d(${x1.toFixed(1)}px, ${y1.toFixed(1)}px, 0) rotate(${g1.tiltDeg.toFixed(2)}deg)`;
      }
      applyActorSvg(
        actor1OuterRef.current,
        actor1I1Ref.current,
        actor1I2Ref.current,
        actor1I3Ref.current,
        buf1Outer,
        buf1I1,
        buf1I2,
        buf1I3,
        rgbStr,
      );

      // Actor 2 (Hero / Modal / Stage): Companion moving Right → Left in complementary studio lane!
      if (curVariant !== "card" && actor2WrapRef.current) {
        const size2 = size1 * 0.8;
        const p2 = (sec / (cycleSec * 1.08) + e.seedOffset + 0.5) % 1;
        const x2 = xMax - p2 * span - size2 * 0.5;
        const g2 = blendWeightedActor(
          sec,
          p2,
          2.2,
          scaleFactor * 0.8,
          buf2Outer,
          buf2I1,
          buf2I2,
          buf2I3,
        );
        const y2 = H * lane2Ratio - size2 * 0.5 + g2.dyPx;
        const op2 = softPassOpacity(p2) * baseAlpha2;

        actor2WrapRef.current.style.width = `${size2.toFixed(0)}px`;
        actor2WrapRef.current.style.height = `${size2.toFixed(0)}px`;
        actor2WrapRef.current.style.opacity = op2.toFixed(3);
        actor2WrapRef.current.style.transform = `translate3d(${x2.toFixed(1)}px, ${y2.toFixed(1)}px, 0) scaleX(-1) rotate(${g2.tiltDeg.toFixed(2)}deg)`;

        applyActorSvg(
          actor2OuterRef.current,
          actor2I1Ref.current,
          actor2I2Ref.current,
          actor2I3Ref.current,
          buf2Outer,
          buf2I1,
          buf2I2,
          buf2I3,
          rgbStr,
        );
      }
    };

    const tick = (now: number) => {
      renderFrame(now);
      if (e.inView && !document.hidden) {
        e.raf = requestAnimationFrame(tick);
      } else {
        e.raf = 0;
      }
    };

    const startIfNeeded = () => {
      if (!e.raf && e.inView && !document.hidden) {
        e.raf = requestAnimationFrame(tick);
      }
    };
    wakeLoopRef.current = startIfNeeded;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        e.inView = entry.isIntersecting;
        if (e.inView) {
          measure();
          startIfNeeded();
        } else if (e.raf) {
          cancelAnimationFrame(e.raf);
          e.raf = 0;
        }
      },
      { threshold: 0.02 },
    );
    io.observe(root);

    const onVis = () => {
      if (document.hidden && e.raf) {
        cancelAnimationFrame(e.raf);
        e.raf = 0;
      } else if (!document.hidden) {
        startIfNeeded();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    startIfNeeded();

    return () => {
      if (e.raf) cancelAnimationFrame(e.raf);
      e.raf = 0;
      wakeLoopRef.current = () => {};
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const initialPaths = INITIAL_SVG_PATHS[spirit.creature];

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      style={{
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, black 7%, black 93%, transparent 100%)",
        maskImage:
          "linear-gradient(90deg, transparent 0%, black 7%, black 93%, transparent 100%)",
      }}
      className={`pointer-events-none absolute z-0 overflow-hidden select-none ${
        variant === "hero" ? "-top-7 inset-x-0 bottom-0 sm:inset-0" : "inset-0"
      }`}
    >
      {/* Smoothly Morphing Ambient Spotlight Aura */}
      <div ref={auraRef} className="absolute inset-0" />

      {/* Primary Roaming Couture Creature (Runs / Bounds / Trots / Flies Left → Right Behind the Gown) */}
      <div
        ref={actor1WrapRef}
        style={{ opacity: 0, willChange: "transform, opacity" }}
        className="absolute left-0 top-0"
      >
        <svg viewBox="0 0 200 200" className="size-full overflow-visible">
          <path
            ref={actor1OuterRef}
            d={initialPaths.outer}
            fill={targetHex}
            fillOpacity="0.06"
            stroke={targetHex}
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            ref={actor1I1Ref}
            d={initialPaths.inner1}
            fill="none"
            stroke={targetHex}
            strokeWidth="1.45"
            strokeLinecap="round"
          />
          <path
            ref={actor1I2Ref}
            d={initialPaths.inner2}
            fill="none"
            stroke={targetHex}
            strokeWidth="1.45"
            strokeLinecap="round"
          />
          <path
            ref={actor1I3Ref}
            d={initialPaths.inner3}
            fill="none"
            stroke={targetHex}
            strokeWidth="1.45"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Companion Roaming Couture Creature (Moves Right → Left in Complementary Studio Lane Behind the Gown) */}
      {variant !== "card" && (
        <div
          ref={actor2WrapRef}
          style={{ opacity: 0, willChange: "transform, opacity" }}
          className="absolute left-0 top-0"
        >
          <svg viewBox="0 0 200 200" className="size-full overflow-visible">
            <path
              ref={actor2OuterRef}
              d={initialPaths.outer}
              fill={targetHex}
              fillOpacity="0.05"
              stroke={targetHex}
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              ref={actor2I1Ref}
              d={initialPaths.inner1}
              fill="none"
              stroke={targetHex}
              strokeWidth="1.45"
              strokeLinecap="round"
            />
            <path
              ref={actor2I2Ref}
              d={initialPaths.inner2}
              fill="none"
              stroke={targetHex}
              strokeWidth="1.45"
              strokeLinecap="round"
            />
            <path
              ref={actor2I3Ref}
              d={initialPaths.inner3}
              fill="none"
              stroke={targetHex}
              strokeWidth="1.45"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
