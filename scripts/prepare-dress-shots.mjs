import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "tmp-gen");
const OUT_DIR = path.join(ROOT, "public", "images", "dresses");

fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  const files = fs
    .readdirSync(SRC_DIR)
    .filter((f) => /^rd-\d{2}-.+\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort();

  const summary = [];
  for (const file of files) {
    const base = file.replace(/\.[^.]+$/, "");
    const inputPath = path.join(SRC_DIR, file);
    const outPath = path.join(OUT_DIR, `${base}.webp`);

    // 640x960 (2:3 ratio) — crisp on retina cards while keeping hero payloads ultra-light (< 60 KB each)
    await sharp(inputPath)
      .rotate()
      .resize(640, 960, { fit: "cover", position: "centre" })
      .webp({ quality: 82, effort: 5 })
      .toFile(outPath);

    const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);
    summary.push({ file: `${base}.webp`, kb: Number(sizeKB) });
  }

  const fronts = summary.filter((x) => x.file.endsWith("-front.webp"));
  const totalFrontKB = fronts.reduce((acc, x) => acc + x.kb, 0).toFixed(1);
  console.log(`Processed ${summary.length} dress shots into public/images/dresses/`);
  console.log(`Hero initial 8 fronts total: ${totalFrontKB} KB`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
