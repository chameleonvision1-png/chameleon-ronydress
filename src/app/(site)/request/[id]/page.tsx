import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, Clock } from "lucide-react";
import { readDB } from "@/lib/db";
import { formatDateAr } from "@/lib/utils";
import { OCCASION_LABELS_AR } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const RENTAL_STATUS_MAP: Record<string, string> = {
  new: "طلب جديد — قيد المراجعة والتأكيد",
  confirmed: "تم تأكيد الحجز",
  ready: "الفستان جاهز للاستلام والبروفة",
  "picked-up": "تم استلام الفستان",
  returned: "تم إرجاع الفستان بنجاح",
  cancelled: "ملغي",
};

const APT_STATUS_MAP: Record<string, string> = {
  new: "تم استلام موعد الزيارة — بانتظار التأكيد",
  confirmed: "تم تأكيد موعد البروفة",
  done: "تمت الزيارة",
  cancelled: "ملغي",
};

export default async function RequestTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDB();

  const rental = db.rentalRequests.find((r) => r.id === id);
  const apt = !rental ? db.appointments.find((a) => a.id === id) : undefined;

  if (!rental && !apt) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-8">
      <div className="rounded-xl border border-[var(--brand-gold)]/45 bg-[var(--bg-surface)] p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-7 w-7 text-[var(--brand-gold)]" />
          <div>
            <p className="font-en text-xs font-bold text-[var(--brand-gold)]">#{id}</p>
            <h1 className="text-xl font-bold text-[var(--text-strong)]">
              {rental ? "متابعة طلب الفستان" : "متابعة موعد البروفة"}
            </h1>
          </div>
        </div>

        <div className="mt-6 space-y-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5 text-sm">
          {rental ? (
            <>
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                <span className="text-[var(--text-muted)]">الحالة الحالية</span>
                <span className="font-bold text-[var(--brand-gold)]">
                  {RENTAL_STATUS_MAP[rental.status] || rental.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">الفستان</span>
                <span className="font-bold">[{rental.dressCode}] {rental.dressNameAr}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">نوع الطلب</span>
                <span className="font-semibold">
                  {rental.requestType === "tailor" ? "طلب تفصيل مماثل" : "حجز إيجار"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">تاريخ المناسبة</span>
                <span className="font-semibold">{formatDateAr(rental.eventDate)}</span>
              </div>
              {rental.requestType === "rent" && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">فترة الإيجار</span>
                  <span className="font-semibold">
                    {rental.pickupDate} → {rental.returnDate}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">الاسم</span>
                <span>{rental.customerName}</span>
              </div>
            </>
          ) : apt ? (
            <>
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                <span className="text-[var(--text-muted)]">حالة الموعد</span>
                <span className="font-bold text-[var(--brand-gold)]">
                  {APT_STATUS_MAP[apt.status] || apt.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">الاسم</span>
                <span className="font-bold">{apt.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">المناسبة</span>
                <span>{OCCASION_LABELS_AR[apt.occasion]}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">موعد الزيارة</span>
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Clock className="h-3.5 w-3.5 text-[var(--brand-gold)]" />
                  {formatDateAr(apt.visitDate)} — {apt.visitTime}
                </span>
              </div>
            </>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/collection"
            className="rounded bg-[var(--brand-gold)] px-5 py-2.5 text-xs font-bold text-[#FFF9F2]"
          >
            العودة للكتالوج
          </Link>
          <Link
            href="/booking"
            className="inline-flex items-center gap-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-5 py-2.5 text-xs font-semibold text-[var(--text-strong)]"
          >
            <CalendarCheck className="h-3.5 w-3.5 text-[var(--brand-gold)]" />
            <span>حجز موعد آخر</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
