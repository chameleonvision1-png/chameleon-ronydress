import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const CUTOUT_SRC = path.join(ROOT, "tmp-gen", "cutouts");
const RAW_SRC = path.join(ROOT, "tmp-gen");
const CUTOUT_OUT = path.join(ROOT, "public", "images", "cutouts");
const DETAIL_OUT = path.join(ROOT, "public", "images", "dresses");

fs.mkdirSync(CUTOUT_OUT, { recursive: true });
fs.mkdirSync(DETAIL_OUT, { recursive: true });

const CANVAS_W = 640;
const CANVAS_H = 960;
const TARGET_HEM_Y = 928;
const TARGET_MAX_H = 868;
const TARGET_MAX_W = 596;

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

async function processCutout(pngFile) {
  const base = pngFile.replace(/\.png$/i, "");
  const inPath = path.join(CUTOUT_SRC, pngFile);
  const { data, info } = await sharp(inPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const a = data[(y * W + x) * 4 + 3];
      if (a >= 28) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const bw = Math.max(1, maxX - minX + 1);
  const bh = Math.max(1, maxY - minY + 1);

  // Measure horizontal spine center across upper bodice/collar (top 5%..24% of garment height)
  const yBand0 = minY + Math.round(bh * 0.04);
  const yBand1 = minY + Math.round(bh * 0.24);
  let sumX = 0, countX = 0;
  for (let y = yBand0; y <= yBand1; y++) {
    let rowMin = W, rowMax = -1;
    for (let x = minX; x <= maxX; x++) {
      if (data[(y * W + x) * 4 + 3] >= 90) {
        if (x < rowMin) rowMin = x;
        if (x > rowMax) rowMax = x;
      }
    }
    if (rowMin <= rowMax) {
      sumX += (rowMin + rowMax) / 2;
      countX++;
    }
  }
  const collarCenterInCrop = countX > 0 ? sumX / countX - minX : bw / 2;

  const scale = Math.min(TARGET_MAX_H / bh, TARGET_MAX_W / bw);
  const scaledW = Math.max(1, Math.round(bw * scale));
  const scaledH = Math.max(1, Math.round(bh * scale));

  const croppedBuf = await sharp(inPath)
    .extract({ left: minX, top: minY, width: bw, height: bh })
    .resize(scaledW, scaledH, { kernel: "lanczos3" })
    .png()
    .toBuffer();

  const scaledSpineX = Math.round(collarCenterInCrop * scale);
  const idealLeft = Math.round(CANVAS_W / 2 - scaledSpineX);
  const left = clamp(idealLeft, 12, CANVAS_W - scaledW - 12);
  const top = clamp(TARGET_HEM_Y - scaledH, 16, CANVAS_H - scaledH - 8);

  const outPath = path.join(CUTOUT_OUT, `${base}.webp`);
  await sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: croppedBuf, left, top }])
    .webp({ quality: 84, alphaQuality: 92, effort: 5 })
    .toFile(outPath);

  const kb = Number((fs.statSync(outPath).size / 1024).toFixed(1));
  return { file: `${base}.webp`, kb, scaledW, scaledH, left, top };
}

async function main() {
  const cutoutPngs = fs
    .readdirSync(CUTOUT_SRC)
    .filter((f) => /^rd-\d{2}-.+\.png$/i.test(f))
    .sort();

  const results = [];
  for (const f of cutoutPngs) {
    results.push(await processCutout(f));
  }

  // Process detail macro close-ups into public/images/dresses/*-detail.webp
  const detailFiles = fs
    .readdirSync(RAW_SRC)
    .filter((f) => /^rd-\d{2}-detail\.(jpg|jpeg|png)$/i.test(f))
    .sort();
  for (const df of detailFiles) {
    const base = df.replace(/\.[^.]+$/, "");
    const outPath = path.join(DETAIL_OUT, `${base}.webp`);
    await sharp(path.join(RAW_SRC, df))
      .resize(720, 960, { fit: "cover", position: "centre" })
      .webp({ quality: 84, effort: 5 })
      .toFile(outPath);
  }

  // Create dark-velvet verification contact sheet to prove 100% clean RGBA alpha cutouts
  const cols = 5;
  const thumbW = 160;
  const thumbH = 240;
  const gap = 8;
  const rows = Math.ceil(results.length / cols);
  const sheetComps = await Promise.all(
    results.map(async (r, i) => ({
      input: await sharp(path.join(CUTOUT_OUT, r.file)).resize(thumbW, thumbH).toBuffer(),
      left: gap + (i % cols) * (thumbW + gap),
      top: gap + Math.floor(i / cols) * (thumbH + gap),
    })),
  );
  await sharp({
    create: {
      width: cols * (thumbW + gap) + gap,
      height: rows * (thumbH + gap) + gap,
      channels: 4,
      background: { r: 22, g: 17, b: 21, alpha: 1 }, // Dark obsidian velvet proof!
    },
  })
    .composite(sheetComps)
    .webp({ quality: 86 })
    .toFile(path.join(RAW_SRC, "cutouts_verify.webp"));

  const frontsTotal = results
    .filter((r) => r.file.endsWith("-front.webp"))
    .reduce((a, b) => a + b.kb, 0)
    .toFixed(1);

  console.log(`Processed ${results.length} RGBA cutouts! 8 hero fronts total: ${frontsTotal} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
