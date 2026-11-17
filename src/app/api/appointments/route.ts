import { NextResponse } from "next/server";
import { readDB, uid, updateDB } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import type { Appointment, Occasion } from "@/lib/types";
import { normalizeDigits } from "@/lib/utils";
import { buildAppointmentWhatsAppUrl } from "@/lib/whatsapp";

const VALID_OCCASIONS: Occasion[] = ["engagement", "soiree", "katb-ketab", "bridal", "handmade"];

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`appointments:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "طلبات كثيرة، يرجى الانتظار دقيقة" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "بيانات الحجز غير صالحة" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const phone = normalizeDigits(String(body.phone || "")).replace(/[^\d+]/g, "");
  const occasionRaw = String(body.occasion || "engagement").trim() as Occasion;
  const occasion = VALID_OCCASIONS.includes(occasionRaw) ? occasionRaw : "engagement";
  const eventDate = String(body.eventDate || "").trim();
  const preferredColor = String(body.preferredColor || "").trim().slice(0, 80);
  const approxSize = String(body.approxSize || "").trim().slice(0, 40);
  const dressCode = String(body.dressCode || "").trim().slice(0, 40);
  const dressType = String(body.dressType || "").trim().slice(0, 120);
  const visitDate = String(body.visitDate || "").trim();
  const visitTime = String(body.visitTime || "").trim().slice(0, 40);
  const notes = String(body.notes || "").trim().slice(0, 500);

  if (
    name.length < 2 ||
    phone.length < 8 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(visitDate) ||
    !visitTime
  ) {
    return NextResponse.json(
      { error: "يرجى استيفاء الاسم والموبايل وتاريخ المناسبة وتاريخ ووقت الزيارة" },
      { status: 400 },
    );
  }

  const dbCheck = await readDB();
  if (!dbCheck.settings.acceptingBookings) {
    return NextResponse.json({ error: "حجز المواعيد متوقف مؤقتاً" }, { status: 403 });
  }

  const created = await updateDB((db) => {
    const apt: Appointment = {
      id: uid("ap_"),
      name,
      phone,
      occasion,
      eventDate,
      preferredColor: preferredColor || undefined,
      approxSize: approxSize || undefined,
      dressCode: dressCode || undefined,
      dressType: dressType || undefined,
      visitDate,
      visitTime,
      notes: notes || undefined,
      status: "new",
      createdAt: new Date().toISOString(),
    };
    db.appointments.unshift(apt);
    return { appointment: apt, whatsapp: db.settings.whatsapp };
  });

  const origin = req.headers.get("origin") || "https://ronydress.chameleon.vision";
  const whatsappUrl = buildAppointmentWhatsAppUrl(created.whatsapp, created.appointment, origin);

  return NextResponse.json(
    {
      appointment: created.appointment,
      whatsappUrl,
    },
    { status: 201 },
  );
}
