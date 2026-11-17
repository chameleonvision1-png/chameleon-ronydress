import { NextResponse } from "next/server";
import { checkDateAvailability, readDB, uid, updateDB } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import type { RentalRequest } from "@/lib/types";
import { addDaysIso, normalizeDigits } from "@/lib/utils";
import { buildRentalWhatsAppUrl } from "@/lib/whatsapp";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`rentals:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "طلبات كثيرة، يرجى الانتظار دقيقة" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "بيانات الطلب غير صالحة" }, { status: 400 });
  }

  const dressCode = String(body.dressCode || "").trim();
  const customerName = String(body.customerName || "").trim();
  const customerPhone = normalizeDigits(String(body.customerPhone || "")).replace(/[^\d+]/g, "");
  const eventDate = String(body.eventDate || "").trim();
  const sizeLabel = String(body.sizeLabel || "").trim();
  const colorNameAr = String(body.colorNameAr || "").trim();
  const requestType = body.requestType === "tailor" ? "tailor" : "rent";
  const notes = String(body.notes || "").trim().slice(0, 500);

  if (!dressCode || customerName.length < 2 || customerPhone.length < 8 || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return NextResponse.json(
      { error: "يرجى استيفاء الاسم ورقم الهاتف وتاريخ المناسبة وكود الفستان" },
      { status: 400 },
    );
  }

  const dbCheck = await readDB(true);
  if (!dbCheck.settings.acceptingBookings) {
    return NextResponse.json({ error: "الحجز الأونلاين متوقف مؤقتاً" }, { status: 403 });
  }

  const dress = dbCheck.dresses.find((d) => d.code.toLowerCase() === dressCode.toLowerCase());
  if (!dress) {
    return NextResponse.json({ error: "الفستان غير موجود" }, { status: 404 });
  }

  if (requestType === "rent") {
    const avail = checkDateAvailability(dbCheck, dress.code, eventDate);
    if (!avail.available) {
      return NextResponse.json(
        { error: avail.reasonAr || "هذا الفستان محجوز في التاريخ المختار" },
        { status: 409 },
      );
    }
  }

  const duration = Math.max(1, dress.rentalDays || dbCheck.settings.rentalDurationDays || 3);
  const pickupDate = addDaysIso(eventDate, -1);
  const returnDate = addDaysIso(eventDate, duration - 1);

  const created = await updateDB((db) => {
    const entry: RentalRequest = {
      id: uid("rd_"),
      dressId: dress.id,
      dressCode: dress.code,
      dressNameAr: dress.nameAr,
      customerName,
      customerPhone,
      eventDate,
      pickupDate,
      returnDate,
      sizeLabel: sizeLabel || dress.sizes[0] || "مقاس خاص",
      colorNameAr: colorNameAr || undefined,
      requestType,
      notes: notes || undefined,
      status: "new",
      createdAt: new Date().toISOString(),
    };
    db.rentalRequests.unshift(entry);
    return { request: entry, whatsapp: db.settings.whatsapp };
  });

  const origin = req.headers.get("origin") || "https://ronydress.chameleon.vision";
  const whatsappUrl = buildRentalWhatsAppUrl(created.whatsapp, created.request, origin);

  return NextResponse.json(
    {
      request: created.request,
      whatsappUrl,
    },
    { status: 201 },
  );
}
