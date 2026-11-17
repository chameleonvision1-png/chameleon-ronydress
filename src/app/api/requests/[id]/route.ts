import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const db = await readDB();

  const rental = db.rentalRequests.find((r) => r.id === id);
  if (rental) {
    return NextResponse.json({ kind: "rental", item: rental });
  }
  const appointment = db.appointments.find((a) => a.id === id);
  if (appointment) {
    return NextResponse.json({ kind: "appointment", item: appointment });
  }
  return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
}
