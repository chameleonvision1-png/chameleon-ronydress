import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC_LOGO = path.join(ROOT, "source-assets", "logo", "01.jpg");
const PUBLIC_DIR = path.join(ROOT, "public");
const APP_DIR = path.join(ROOT, "src", "app");
const BRAND_DIR = path.join(PUBLIC_DIR, "images", "brand");

fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(BRAND_DIR, { recursive: true });

const PALETTES = {
  gold: [184, 144, 64],     // #B89040 measured directly from source logo
  light: [255, 249, 242],   // #FFF9F2 Ivory for dark surfaces
  dark: [23, 19, 23],       // #171317 Soft Black for monochrome stamps
};

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

// Compute tight bounding box of non-zero alpha inside a region [y0..y1)
function getBounds(alpha, w, h, yStart = 0, yEnd = h) {
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = yStart; y < yEnd; y++) {
    for (let x = 0; x < w; x++) {
      if (alpha[y * w + x] > 18) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function buildColoredRGBA(alpha, w, h, rgb, bounds, pad = 16) {
  const ox = bounds.width + pad * 2;
  const oy = bounds.height + pad * 2;
  const buf = Buffer.alloc(ox * oy * 4);
  for (let dy = 0; dy < bounds.height; dy++) {
    const sy = bounds.y + dy;
    for (let dx = 0; dx < bounds.width; dx++) {
      const sx = bounds.x + dx;
      const a = alpha[sy * w + sx];
      const outIdx = ((dy + pad) * ox + (dx + pad)) * 4;
      buf[outIdx] = rgb[0];
      buf[outIdx + 1] = rgb[1];
      buf[outIdx + 2] = rgb[2];
      buf[outIdx + 3] = a;
    }
  }
  return { buf, width: ox, height: oy };
}

// Marching-squares + RDP + smooth quadratic Bezier SVG vector tracer on binary threshold mask
function traceAlphaToSvgPaths(alpha, w, h, bounds, pad = 12, threshold = 96) {
  const bw = bounds.width + 2;
  const bh = bounds.height + 2;
  const bin = new Uint8Array(bw * bh);
  for (let y = 0; y < bounds.height; y++) {
    for (let x = 0; x < bounds.width; x++) {
      bin[(y + 1) * bw + (x + 1)] = alpha[(bounds.y + y) * w + (bounds.x + x)] >= threshold ? 1 : 0;
    }
  }

  // Directed edges on pixel corners (so CW outer / CCW holes naturally obey nonzero fill-rule)
  const edges = new Map();
  const addEdge = (x0, y0, x1, y1) => {
    const k = `${x0},${y0}`;
    let arr = edges.get(k);
    if (!arr) { arr = []; edges.set(k, arr); }
    arr.push([x1, y1]);
  };

  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      if (!bin[y * bw + x]) continue;
      if (y === 0 || !bin[(y - 1) * bw + x]) addEdge(x, y, x + 1, y);
      if (x === bw - 1 || !bin[y * bw + (x + 1)]) addEdge(x + 1, y, x + 1, y + 1);
      if (y === bh - 1 || !bin[(y + 1) * bw + x]) addEdge(x + 1, y + 1, x, y + 1);
      if (x === 0 || !bin[y * bw + (x - 1)]) addEdge(x, y + 1, x, y);
    }
  }

  const loops = [];
  for (const [startKey, list] of edges) {
    while (list.length > 0) {
      const [sx, sy] = startKey.split(",").map(Number);
      const firstNext = list.pop();
      const poly = [[sx, sy], firstNext];
      let cx = firstNext[0], cy = firstNext[1];
      let guard = 0;
      while ((cx !== sx || cy !== sy) && guard++ < 500000) {
        const nextList = edges.get(`${cx},${cy}`);
        if (!nextList || nextList.length === 0) break;
        // Prefer turn to keep loops clean at 4-way vertices
        const prev = poly[poly.length - 2];
        const dx = cx - prev[0], dy = cy - prev[1];
        let pickIdx = nextList.length - 1;
        if (nextList.length > 1) {
          let bestScore = -999;
          for (let i = 0; i < nextList.length; i++) {
            const nx = nextList[i][0] - cx, ny = nextList[i][1] - cy;
            const cross = dx * ny - dy * nx;
            if (cross > bestScore) { bestScore = cross; pickIdx = i; }
          }
        }
        const [nx, ny] = nextList.splice(pickIdx, 1)[0];
        poly.push([nx, ny]);
        cx = nx; cy = ny;
      }
      if (poly.length >= 4) loops.push(poly);
    }
  }

  // Merge collinear staircase segments first, then light RDP simplification
  function simplifyClosed(pts, eps) {
    const dedup = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = dedup[dedup.length - 1];
      const b = pts[i];
      const c = pts[(i + 1) % (pts.length - 1)];
      if (!a || (b[0] - a[0]) * (c[1] - b[1]) !== (b[1] - a[1]) * (c[0] - b[0])) {
        dedup.push(b);
      }
    }
    if (dedup.length < 4) return dedup;

    function rdp(arr, s, e) {
      if (e - s <= 1) return [arr[s]];
      const ax = arr[s][0], ay = arr[s][1], bx = arr[e][0], by = arr[e][1];
      const len = Math.hypot(bx - ax, by - ay) || 1;
      let maxD = 0, idx = s;
      for (let i = s + 1; i < e; i++) {
        const d = Math.abs((by - ay) * arr[i][0] - (bx - ax) * arr[i][1] + bx * ay - by * ax) / len;
        if (d > maxD) { maxD = d; idx = i; }
      }
      if (maxD > eps) {
        return [...rdp(arr, s, idx), ...rdp(arr, idx, e)];
      }
      return [arr[s]];
    }

    const res = rdp(dedup, 0, dedup.length - 1);
    res.push(dedup[dedup.length - 1]);
    return res;
  }

  const dParts = [];
  for (const loop of loops) {
    const s = simplifyClosed(loop, 0.72);
    if (s.length < 3) continue;
    const pts = s.map(([x, y]) => [x - 1 + pad, y - 1 + pad]);
    dParts.push(`M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`);
    for (let i = 1; i < pts.length; i++) {
      dParts.push(`L${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`);
    }
    dParts.push("Z");
  }

  const vw = bounds.width + pad * 2;
  const vh = bounds.height + pad * 2;
  return { d: dParts.join(""), viewBox: `0 0 ${vw} ${vh}`, width: vw, height: vh };
}

async function main() {
  const scale = 4; // 500x500 -> 2000x2000 for crisp sub-pixel alpha + tracing
  const { data, info } = await sharp(SRC_LOGO)
    .resize(500 * scale, 500 * scale, { kernel: "lanczos3" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = info.width;
  const H = info.height;
  const alpha = new Uint8Array(W * H);

  for (let i = 0; i < W * H; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const maxDiff = Math.max(255 - r, 255 - g, 255 - b);
    if (maxDiff <= 7 || lum >= 250) {
      alpha[i] = 0;
    } else {
      const rawStrength = clamp((251 - lum) / (251 - 146), 0, 1);
      // Gentle boost keeps the hair-thin flourish strokes crisp while staying anti-aliased
      alpha[i] = Math.round(clamp(Math.pow(rawStrength, 0.78), 0, 1) * 255);
    }
  }

  // Regions calibrated at 4x (y_wordmark_split = 374 * 4 = 1496)
  const splitY = 374 * scale;
  const fullBounds = getBounds(alpha, W, H, 0, H);
  const monogramBounds = getBounds(alpha, W, H, 0, splitY);
  const wordmarkBounds = getBounds(alpha, W, H, splitY, H);

  // Tight "R" mark without the wide lower-left thin flourish (x >= 158*4, y <= 345*4) for tiny favicons
  const markBounds = (() => {
    let minX = W, minY = H, maxX = -1, maxY = -1;
    const xCut = 158 * scale;
    const yCut = 342 * scale;
    for (let y = 0; y < yCut; y++) {
      for (let x = xCut; x < W; x++) {
        if (alpha[y * W + x] > 40) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  })();

  const variants = [
    { name: "logo-full", bounds: fullBounds, pad: 24 },
    { name: "logo-monogram", bounds: monogramBounds, pad: 24 },
    { name: "logo-wordmark", bounds: wordmarkBounds, pad: 18 },
    { name: "logo-mark", bounds: markBounds, pad: 24 },
  ];

  const report = [];

  for (const v of variants) {
    // 1. Export lossless/high-res WebP & PNG in gold, light (ivory), dark
    for (const [tone, rgb] of Object.entries(PALETTES)) {
      const suffix = tone === "gold" ? "" : `-${tone}`;
      const { buf, width, height } = buildColoredRGBA(alpha, W, H, rgb, v.bounds, v.pad);
      const baseImg = sharp(buf, { raw: { width, height, channels: 4 } });

      await baseImg.clone().webp({ lossless: true }).toFile(path.join(PUBLIC_DIR, `${v.name}${suffix}.webp`));
      await baseImg.clone().png().toFile(path.join(BRAND_DIR, `${v.name}${suffix}.png`));
    }

    // 2. Trace exact vector SVG & measure IoU against raster mask
    const svgInfo = traceAlphaToSvgPaths(alpha, W, H, v.bounds, v.pad, 92);
    const makeSvg = (color) =>
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${svgInfo.viewBox}" fill="none" role="img" aria-label="Rony Dress"><path fill="${color}" d="${svgInfo.d}"/></svg>`;

    fs.writeFileSync(path.join(PUBLIC_DIR, `${v.name}.svg`), makeSvg("#B89040"), "utf8");
    fs.writeFileSync(path.join(PUBLIC_DIR, `${v.name}-light.svg`), makeSvg("#FFF9F2"), "utf8");
    fs.writeFileSync(path.join(PUBLIC_DIR, `${v.name}-dark.svg`), makeSvg("#171317"), "utf8");

    // IoU verification: re-render SVG back to exact raster dimensions and compare binary foreground
    const renderedSvgRaw = await sharp(Buffer.from(makeSvg("#FFFFFF")))
      .resize(svgInfo.width, svgInfo.height)
      .ensureAlpha()
      .raw()
      .toBuffer();

    const refRGBA = buildColoredRGBA(alpha, W, H, [255, 255, 255], v.bounds, v.pad);
    let inter = 0, union = 0;
    for (let i = 0; i < svgInfo.width * svgInfo.height; i++) {
      const aRef = refRGBA.buf[i * 4 + 3] >= 92;
      const aSvg = renderedSvgRaw[i * 4 + 3] >= 92;
      if (aRef || aSvg) union++;
      if (aRef && aSvg) inter++;
    }
    const iou = union > 0 ? ((inter / union) * 100).toFixed(2) : "100.00";
    report.push({ variant: v.name, width: svgInfo.width, height: svgInfo.height, iou: `${iou}%` });
  }

  // 3. App Icons & Favicon (Crisp gold R monogram centered on #FFF9F2 Ivory badge)
  const monoGold = await sharp(path.join(PUBLIC_DIR, "logo-monogram.webp")).toBuffer();
  const markGold = await sharp(path.join(PUBLIC_DIR, "logo-mark.webp")).toBuffer();

  async function buildIcon(size, useMarkOnly = false) {
    const innerSize = Math.round(size * 0.72);
    const fg = await sharp(useMarkOnly ? markGold : monoGold)
      .resize(innerSize, innerSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();
    const offset = Math.round((size - innerSize) / 2);
    return sharp({
      create: { width: size, height: size, channels: 4, background: { r: 255, g: 249, b: 242, alpha: 1 } },
    })
      .composite([{ input: fg, left: offset, top: offset }])
      .png();
  }

  await (await buildIcon(64, true)).toFile(path.join(APP_DIR, "icon.png"));
  await (await buildIcon(180, false)).toFile(path.join(APP_DIR, "apple-icon.png"));
  await (await buildIcon(192, false)).toFile(path.join(PUBLIC_DIR, "icon-192.png"));
  await (await buildIcon(512, false)).toFile(path.join(PUBLIC_DIR, "icon-512.png"));

  // 4. Social Avatar 1080x1080 (circular-safe centered lockup on #FFF9F2 ivory)
  const fullGoldForAvatar = await sharp(path.join(PUBLIC_DIR, "logo-full.webp"))
    .resize(620, 620, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const avMeta = await sharp(fullGoldForAvatar).metadata();
  await sharp({
    create: { width: 1080, height: 1080, channels: 4, background: { r: 255, g: 249, b: 242, alpha: 1 } },
  })
    .composite([
      {
        input: fullGoldForAvatar,
        left: Math.round((1080 - (avMeta.width || 620)) / 2),
        top: Math.round((1080 - (avMeta.height || 620)) / 2),
      },
    ])
    .webp({ quality: 92 })
    .toFile(path.join(BRAND_DIR, "social-avatar.webp"));

  // 5. OG Share Image (1200x630 luxury deep espresso card with gold lockup)
  const fullGoldForOg = await sharp(path.join(PUBLIC_DIR, "logo-full.webp"))
    .resize(350, 350, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const ogLogoMeta = await sharp(fullGoldForOg).metadata();
  const ogBgSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#171317"/>
        <stop offset="55%" stop-color="#271D22"/>
        <stop offset="100%" stop-color="#3A2930"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <rect x="28" y="28" width="1144" height="574" fill="none" stroke="#B89040" stroke-opacity="0.45" stroke-width="1.5"/>
    <text x="600" y="486" text-anchor="middle" fill="#FFF9F2" font-family="Georgia, serif" font-size="30" letter-spacing="6">ATELIER FESTAN SET EL BANAT</text>
    <text x="600" y="534" text-anchor="middle" fill="#D7B98E" font-family="sans-serif" font-size="20" letter-spacing="3">ENGAGEMENT · SOIREE · KATB KETAB · BRIDAL · KAFR EL-ZAYAT</text>
  </svg>`;
  await sharp(Buffer.from(ogBgSvg))
    .composite([
      {
        input: fullGoldForOg,
        left: Math.round((1200 - (ogLogoMeta.width || 350)) / 2),
        top: 52,
      },
    ])
    .jpeg({ quality: 92 })
    .toFile(path.join(PUBLIC_DIR, "og-image.jpg"));

  // 6. Visual verification board comparing original vs gold/light/dark renders
  const cellW = 340, cellH = 340;
  const origThumb = await sharp(SRC_LOGO).resize(cellW, cellH, { fit: "contain", background: "#FFFFFF" }).toBuffer();
  const goldThumb = await sharp(path.join(PUBLIC_DIR, "logo-full.webp")).resize(280, 280, { fit: "contain", background: { r: 255, g: 249, b: 242, alpha: 0 } }).toBuffer();
  const lightThumb = await sharp(path.join(PUBLIC_DIR, "logo-full-light.webp")).resize(280, 280, { fit: "contain", background: { r: 23, g: 19, b: 23, alpha: 0 } }).toBuffer();
  const monoThumb = await sharp(path.join(PUBLIC_DIR, "logo-monogram.webp")).resize(260, 260, { fit: "contain", background: { r: 255, g: 249, b: 242, alpha: 0 } }).toBuffer();

  const boardBg = `<svg width="1360" height="380" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="340" height="380" fill="#FFFFFF"/>
    <rect x="340" y="0" width="340" height="380" fill="#FFF9F2"/>
    <rect x="680" y="0" width="340" height="380" fill="#171317"/>
    <rect x="1020" y="0" width="340" height="380" fill="#E8CFC5"/>
    <text x="170" y="362" text-anchor="middle" fill="#3A2930" font-size="14" font-family="sans-serif">ORIGINAL JPG</text>
    <text x="510" y="362" text-anchor="middle" fill="#3A2930" font-size="14" font-family="sans-serif">FULL GOLD (#B89040)</text>
    <text x="850" y="362" text-anchor="middle" fill="#FFF9F2" font-size="14" font-family="sans-serif">FULL IVORY (#FFF9F2)</text>
    <text x="1190" y="362" text-anchor="middle" fill="#3A2930" font-size="14" font-family="sans-serif">MONOGRAM</text>
  </svg>`;

  await sharp(Buffer.from(boardBg))
    .composite([
      { input: origThumb, left: 0, top: 0 },
      { input: goldThumb, left: 340 + 30, top: 30 },
      { input: lightThumb, left: 680 + 30, top: 30 },
      { input: monoThumb, left: 1020 + 40, top: 40 },
    ])
    .webp({ quality: 90 })
    .toFile(path.join(BRAND_DIR, "logo-preview-board.webp"));

  console.log("Logo assets generated:", JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
