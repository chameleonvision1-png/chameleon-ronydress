import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { readDB, uid, updateDB } from "@/lib/db";
import type { AppointmentStatus, RentalRequestStatus } from "@/lib/types";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = await readDB();
  return NextResponse.json({
    rentalRequests: db.rentalRequests,
    appointments: db.appointments,
    blockedDates: db.blockedDates,
  });
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const kind = String(body.kind || "");
  const id = String(body.id || "");
  const status = String(body.status || "");

  if (kind === "block" && body.action === "add") {
    const dressCode = String(body.dressCode || "").trim();
    const startDate = String(body.startDate || "").trim();
    const endDate = String(body.endDate || "").trim();
    const reasonAr = String(body.reasonAr || "محجوز في الأتيليه").trim();
    if (!dressCode || !startDate || !endDate) {
      return NextResponse.json({ error: "بيانات الإغلاق ناقصة" }, { status: 400 });
    }
    const created = await updateDB((db) => {
      const entry = { id: uid("blk_"), dressCode, startDate, endDate, reasonAr };
      db.blockedDates.unshift(entry);
      return entry;
    });
    return NextResponse.json({ blockedDate: created });
  }

  if (kind === "block" && body.action === "remove") {
    await updateDB((db) => {
      db.blockedDates = db.blockedDates.filter((b) => b.id !== id);
    });
    return NextResponse.json({ ok: true });
  }

  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  const ok = await updateDB((db) => {
    if (kind === "rental") {
      const item = db.rentalRequests.find((r) => r.id === id);
      if (!item) return false;
      item.status = status as RentalRequestStatus;
      return true;
    }
    if (kind === "appointment") {
      const item = db.appointments.find((a) => a.id === id);
      if (!item) return false;
      item.status = status as AppointmentStatus;
      return true;
    }
    return false;
  });

  if (!ok) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
