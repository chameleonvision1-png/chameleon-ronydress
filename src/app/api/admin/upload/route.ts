import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { isAdmin } from "@/lib/auth";
import { uid, UPLOAD_DIR } from "@/lib/db";
import { isR2Configured, uploadToR2 } from "@/lib/r2";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
]);

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const fd = await req.formData();
  const file = fd.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "لم يتم اختيار ملف" }, { status: 400 });
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "صيغة الصورة غير مدعومة" }, { status: 400 });
  }
  if (file.size > 12 * 1024 * 1024) {
    return NextResponse.json({ error: "الحد الأقصى لحجم الصورة ١٢ ميجابايت" }, { status: 400 });
  }

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const out = await sharp(input)
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 86 })
      .toBuffer();

    const name = `rd_${uid()}.webp`;
    if (isR2Configured()) {
      const publicUrl = await uploadToR2(`ronydress/uploads/${name}`, out, "image/webp");
      return NextResponse.json({ url: publicUrl });
    }
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOAD_DIR, name), out);
    return NextResponse.json({ url: `/api/uploads/${name}` });
  } catch {
    return NextResponse.json({ error: "تعذر معالجة الصورة" }, { status: 400 });
  }
}
