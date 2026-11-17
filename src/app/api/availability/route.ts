import { NextResponse } from "next/server";
import { checkDateAvailability, readDB } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = (searchParams.get("code") || "").trim();
  const date = (searchParams.get("date") || "").trim();

  if (!code || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "يرجى إدخال كود الفستان وتاريخ المناسبة بصيغة صحيحة" },
      { status: 400 },
    );
  }

  const db = await readDB();
  const target = db.dresses.find((d) => d.code.toLowerCase() === code.toLowerCase());
  if (!target) {
    return NextResponse.json({ error: "كود الفستان غير موجود" }, { status: 404 });
  }

  const result = checkDateAvailability(db, target.code, date);
  const suggestions = result.available
    ? []
    : db.dresses
        .filter((d) => d.code !== target.code && d.occasions.some((o) => target.occasions.includes(o)))
        .filter((d) => checkDateAvailability(db, d.code, date).available)
        .slice(0, 3)
        .map((d) => ({
          code: d.code,
          nameAr: d.nameAr,
          image: d.shots[0]?.src || "",
          status: d.status,
        }));

  return NextResponse.json({
    code: target.code,
    date,
    available: result.available,
    reasonAr: result.reasonAr,
    conflictRange: result.conflictRange,
    suggestions,
  });
}
