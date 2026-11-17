"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, MessageCircle } from "lucide-react";
import type { Dress, Occasion } from "@/lib/types";
import { OCCASION_LABELS_AR } from "@/lib/whatsapp";

export function BookingClient({
  dresses,
  initialDressCode,
}: {
  dresses: Dress[];
  initialDressCode?: string;
}) {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [occasion, setOccasion] = React.useState<Occasion>("engagement");
  const [eventDate, setEventDate] = React.useState("");
  const [preferredColor, setPreferredColor] = React.useState("");
  const [approxSize, setApproxSize] = React.useState("");
  const [dressCode, setDressCode] = React.useState(initialDressCode || "");
  const [dressType, setDressType] = React.useState("");
  const [visitDate, setVisitDate] = React.useState("");
  const [visitTime, setVisitTime] = React.useState("05:00 مساءً");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState<{ id: string; whatsappUrl: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          occasion,
          eventDate,
          preferredColor,
          approxSize,
          dressCode,
          dressType,
          visitDate,
          visitTime,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "تعذر تسجيل موعد الزيارة");
      } else {
        setDone({
          id: data.appointment.id,
          whatsappUrl: data.whatsappUrl || "",
        });
      }
    } catch {
      setError("حدث خطأ في الاتصال، حاولي مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[var(--brand-gold)]/50 bg-[var(--bg-surface)] p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--brand-gold)]" />
        <h2 className="mt-4 text-xl font-bold text-[var(--text-strong)]">
          تم حجز موعد الزيارة بنجاح
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          رقم المتابعة الخاص بك:{" "}
          <span className="font-en font-bold text-[var(--brand-gold)]">{done.id}</span>
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {done.whatsappUrl && (
            <a
              href={done.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded bg-[var(--brand-gold)] px-5 py-3 text-sm font-bold text-[#FFF9F2]"
            >
              <MessageCircle className="h-4 w-4" />
              <span>تأكيد الموعد عبر واتساب</span>
            </a>
          )}
          <Link
            href={`/request/${done.id}`}
            className="inline-flex items-center justify-center rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-5 py-3 text-sm font-semibold text-[var(--text-strong)]"
          >
            متابعة حالة الحجز
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 md:p-8"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[var(--text-strong)]">
            الاسم بالكامل *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: مريم محمود"
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[var(--text-strong)]">
            رقم الهاتف / واتساب *
          </label>
          <input
            type="tel"
            required
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[var(--text-strong)]">
            نوع المناسبة *
          </label>
          <select
            value={occasion}
            onChange={(e) => setOccasion(e.target.value as Occasion)}
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
          >
            {Object.entries(OCCASION_LABELS_AR).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[var(--text-strong)]">
            تاريخ المناسبة *
          </label>
          <input
            type="date"
            required
            value={eventDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[var(--text-strong)]">
            اللون المفضل
          </label>
          <input
            type="text"
            value={preferredColor}
            onChange={(e) => setPreferredColor(e.target.value)}
            placeholder="مثال: عنابي، أسود، شامبين، وردي هادئ..."
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[var(--text-strong)]">
            المقاس التقريبي
          </label>
          <input
            type="text"
            value={approxSize}
            onChange={(e) => setApproxSize(e.target.value)}
            placeholder="مثال: 40 أو L"
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[var(--text-strong)]">
            الفستان المحدد من الكتالوج (اختياري)
          </label>
          <select
            value={dressCode}
            onChange={(e) => setDressCode(e.target.value)}
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
          >
            <option value="">غير محدد — أحتاج استشارة في الأتيليه</option>
            {dresses.map((d) => (
              <option key={d.code} value={d.code}>
                [{d.code}] {d.nameAr}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[var(--text-strong)]">
            نوع الفستان المطلوب
          </label>
          <input
            type="text"
            value={dressType}
            onChange={(e) => setDressType(e.target.value)}
            placeholder="مثال: سهرة محتشم / منفوش / هاند ميد / إيجار أو تفصيل"
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[var(--text-strong)]">
            تاريخ الزيارة للأتيليه *
          </label>
          <input
            type="date"
            required
            value={visitDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setVisitDate(e.target.value)}
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[var(--text-strong)]">
            وقت الزيارة المفضل *
          </label>
          <select
            value={visitTime}
            onChange={(e) => setVisitTime(e.target.value)}
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
          >
            <option value="02:00 عصراً">٠٢:٠٠ عصراً</option>
            <option value="03:30 عصراً">٠٣:٣٠ عصراً</option>
            <option value="05:00 مساءً">٠٥:٠٠ مساءً</option>
            <option value="06:30 مساءً">٠٦:٣٠ مساءً</option>
            <option value="08:00 مساءً">٠٨:٠٠ مساءً</option>
            <option value="09:30 مساءً">٠٩:٣٠ مساءً</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-[var(--text-strong)]">
          ملاحظات إضافية
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="أي تفاصيل تحبي تضيفيها عن الموديل أو الموعد أو تنسيق الطرحة..."
          className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
        />
      </div>

      {error && (
        <p className="rounded bg-[#3A2930] px-4 py-2.5 text-xs text-[#FFF9F2]">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded bg-[var(--brand-gold)] py-3.5 text-sm font-bold text-[#FFF9F2] transition hover:bg-[var(--brand-gold-hover)] disabled:opacity-60"
      >
        <CalendarCheck className="h-4 w-4" />
        <span>{submitting ? "جارٍ تسجيل الموعد..." : "تأكيد حجز موعد البروفة"}</span>
      </button>
    </form>
  );
}
