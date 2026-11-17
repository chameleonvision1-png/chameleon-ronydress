import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/db";

export async function GET(
  _req: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segs } = await context.params;
  const safeName = path.basename(segs.join("/"));
  const filePath = path.join(UPLOAD_DIR, safeName);
  if (!fs.existsSync(filePath)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(safeName).toLowerCase();
  const contentType =
    ext === ".webp"
      ? "image/webp"
      : ext === ".png"
        ? "image/png"
        : "image/jpeg";
  return new NextResponse(buf, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
