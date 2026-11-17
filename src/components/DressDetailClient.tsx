"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  Heart,
  MessageCircle,
  Ruler,
  Scissors,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { AtelierSettings, Dress } from "@/lib/types";
import { formatDateAr, formatPrice } from "@/lib/utils";
import { buildDirectWhatsAppUrl, OCCASION_LABELS_AR, STATUS_LABELS_AR } from "@/lib/whatsapp";
import { DressSpinViewer } from "./DressSpinViewer";
import { useShortlist } from "./ShortlistProvider";

interface AvailabilityResp {
  available: boolean;
  reasonAr?: string;
  conflictRange?: string;
  suggestions?: Array<{ code: string; nameAr: string; image: string }>;
}

export function DressDetailClient({
  dress,
  settings,
  similarDresses,
}: {
  dress: Dress;
  settings: Omit<AtelierSettings, "adminPassword" | "adminUsername">;
  similarDresses: Dress[];
}) {
  const { hasItem, toggleItem } = useShortlist();
  const saved = hasItem(dress.code);

  const [eventDate, setEventDate] = React.useState("");
  const [availLoading, setAvailLoading] = React.useState(false);
  const [availResult, setAvailResult] = React.useState<AvailabilityResp | null>(null);

  const [activeTab, setActiveTab] = React.useState<"rent" | "tailor">("rent");
  const [selectedSize, setSelectedSize] = React.useState(dress.sizes[0] || "38");
  const [selectedColor, setSelectedColor] = React.useState(dress.colors[0]?.nameAr || "");
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");
  const [submitted, setSubmitted] = React.useState<{
    id: string;
    whatsappUrl: string;
    eventDate: string;
  } | null>(null);

  const checkAvailability = async (dateVal: string) => {
    setEventDate(dateVal);
    setAvailResult(null);
    if (!dateVal) return;
    setAvailLoading(true);
    try {
      const res = await fetch(
        `/api/availability?code=${encodeURIComponent(dress.code)}&date=${encodeURIComponent(dateVal)}`,
      );
      const data = (await res.json()) as AvailabilityResp;
      setAvailResult(data);
    } catch {
      // Ignore network hiccup
    } finally {
      setAvailLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dressCode: dress.code,
          customerName,
          customerPhone,
          eventDate,
          sizeLabel: selectedSize,
          colorNameAr: selectedColor,
          requestType: activeTab,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "تعذر تسجيل الطلب");
      } else {
        setSubmitted({
          id: data.request.id,
          whatsappUrl: data.whatsappUrl || "",
          eventDate: data.request.eventDate,
        });
      }
    } catch {
      setSubmitError("حدث خطأ في الاتصال، حاولي مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  const directWa = buildDirectWhatsAppUrl(
    settings.whatsapp,
    `أهلاً أتيليه Rony Dress — أود السؤال عن توفر الفستان [${dress.code}] (${dress.nameAr})${
      eventDate ? ` لتاريخ مناسبة ${eventDate}` : ""
    }.`,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link href="/" className="hover:text-[var(--brand-gold)]">الرئيسية</Link>
        <span>/</span>
        <Link href="/collection" className="hover:text-[var(--brand-gold)]">الكولكشن</Link>
        <span>/</span>
        <span className="font-semibold text-[var(--text-strong)]">{dress.nameAr}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_500px]">
        {/* Spin 360° Viewer Column */}
        <div>
          <DressSpinViewer dress={dress} />
        </div>

        {/* Details & Booking Column */}
        <div className="space-y-6">
          <div className="border-b border-[var(--border-subtle)] pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-en text-xs font-bold tracking-wider text-[var(--brand-gold)]">
                  {dress.code}
                </span>
                <span className="rounded-full bg-[var(--brand-gold)]/15 px-3 py-0.5 text-xs font-semibold text-[var(--brand-gold)]">
                  {STATUS_LABELS_AR[dress.status] || "متاح للإيجار"}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  toggleItem({
                    code: dress.code,
                    nameAr: dress.nameAr,
                    nameEn: dress.nameEn,
                    image: dress.shots[0]?.src || "",
                    status: dress.status,
                    occasionLabel: OCCASION_LABELS_AR[dress.occasions[0]] || "مناسبات",
                  })
                }
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  saved
                    ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#FFF9F2]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-strong)] hover:border-[var(--brand-gold)]"
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
                <span>{saved ? "محفوظ في اختياراتي" : "احفظي للبروفة"}</span>
              </button>
            </div>

            <h1 className="mt-2 text-2xl font-bold text-[var(--text-strong)] md:text-3xl">
              {dress.nameAr}
            </h1>
            <p className="font-editorial text-base italic text-[var(--text-muted)]">
              {dress.nameEn}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-primary)]">
              {dress.storyAr}
            </p>

            {/* Occasion tags & Pricing */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {dress.occasions.map((o) => (
                <Link
                  key={o}
                  href={`/collection?occasion=${o}`}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-strong)] hover:border-[var(--brand-gold)]"
                >
                  {OCCASION_LABELS_AR[o]}
                </Link>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              {dress.showPrice && dress.rentPrice ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">سعر الإيجار ({dress.rentalDays || 3} أيام)</p>
                    <p className="text-xl font-bold text-[var(--brand-gold)]">
                      {formatPrice(dress.rentPrice)}
                    </p>
                  </div>
                  {dress.deposit ? (
                    <div className="text-left">
                      <p className="text-xs text-[var(--text-muted)]">تأمين مسترد</p>
                      <p className="text-sm font-bold text-[var(--text-strong)]">
                        {formatPrice(dress.deposit)}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[var(--text-strong)]">
                      اسألي عن سعر الإيجار أو التفصيل
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      يشمل البروفة، تضييق المقاس، والدراي كلين على الأتيليه
                    </p>
                  </div>
                  <Sparkles className="h-5 w-5 shrink-0 text-[var(--brand-gold)]" />
                </div>
              )}
            </div>
          </div>

          {/* Specifications */}
          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
              <p className="font-semibold text-[var(--text-muted)]">الخامة والتطريز</p>
              <p className="mt-1 font-medium text-[var(--text-strong)]">{dress.fabricAr}</p>
            </div>
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
              <p className="font-semibold text-[var(--text-muted)]">الطول والقصّة</p>
              <p className="mt-1 font-medium text-[var(--text-strong)]">{dress.lengthAr}</p>
            </div>
          </div>

          {/* Colors & Sizes */}
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-bold text-[var(--text-strong)]">الألوان المتاحة:</p>
              <div className="flex flex-wrap gap-2">
                {dress.colors.map((c) => (
                  <button
                    key={c.nameAr}
                    type="button"
                    onClick={() => setSelectedColor(c.nameAr)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      selectedColor === c.nameAr
                        ? "border-[var(--brand-gold)] bg-[var(--brand-gold)]/12 text-[var(--text-strong)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)]"
                    }`}
                  >
                    <span
                      style={{ backgroundColor: c.hex }}
                      className="h-3.5 w-3.5 rounded-full border border-black/15"
                    />
                    <span>{c.nameAr}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold text-[var(--text-strong)]">المقاسات المتاحة:</p>
                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--brand-gold)]">
                  <Ruler className="h-3.5 w-3.5" />
                  <span>تضييق وضبط مجاني عند البروفة</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {dress.sizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`min-w-12 rounded border px-3 py-1.5 font-en text-xs font-bold transition ${
                      selectedSize === sz
                        ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#FFF9F2]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-strong)] hover:border-[var(--brand-gold)]"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {dress.detailsAr.length > 0 && (
              <ul className="space-y-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-xs text-[var(--text-primary)]">
                {dress.detailsAr.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brand-gold)]" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Reservation / Tailoring Form Box */}
          <div className="rounded-xl border border-[var(--brand-gold)]/45 bg-[var(--bg-surface)] p-5">
            <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-[var(--bg-primary)] p-1">
              <button
                type="button"
                onClick={() => setActiveTab("rent")}
                className={`rounded-md py-2 text-xs font-bold transition ${
                  activeTab === "rent"
                    ? "bg-[var(--brand-gold)] text-[#FFF9F2]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                }`}
              >
                احجزي الفستان للإيجار
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tailor")}
                className={`inline-flex items-center justify-center gap-1 rounded-md py-2 text-xs font-bold transition ${
                  activeTab === "tailor"
                    ? "bg-[var(--brand-gold)] text-[#FFF9F2]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                }`}
              >
                <Scissors className="h-3.5 w-3.5" />
                <span>اطلبي تصميم زيه (تفصيل)</span>
              </button>
            </div>

            {submitted ? (
              <div className="space-y-3 py-3 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-[var(--brand-gold)]" />
                <h3 className="text-base font-bold text-[var(--text-strong)]">
                  تم استلام طلبك بنجاح
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  رقم الطلب: <span className="font-en font-bold text-[var(--brand-gold)]">{submitted.id}</span>
                  {" — "}تاريخ المناسبة: {formatDateAr(submitted.eventDate)}
                </p>
                <div className="flex flex-col gap-2 pt-2">
                  {submitted.whatsappUrl && (
                    <a
                      href={submitted.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded bg-[var(--brand-gold)] px-4 py-2.5 text-xs font-semibold text-[#FFF9F2]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>أرسلي تفاصيل الحجز عبر واتساب</span>
                    </a>
                  )}
                  <Link
                    href={`/request/${submitted.id}`}
                    className="inline-flex items-center justify-center rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-2.5 text-xs font-semibold text-[var(--text-strong)]"
                  >
                    صفحة متابعة الطلب
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-strong)]">
                    تاريخ المناسبة *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => checkAvailability(e.target.value)}
                    className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
                  />
                  {availLoading && (
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">جارٍ التحقق من التوفر...</p>
                  )}
                  {availResult && (
                    <div
                      className={`mt-2 flex items-start gap-2 rounded p-2.5 text-xs ${
                        availResult.available
                          ? "bg-[var(--brand-gold)]/15 text-[var(--text-strong)]"
                          : "bg-[#3A2930]/12 text-[var(--text-strong)]"
                      }`}
                    >
                      {availResult.available ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-gold)]" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#3A2930]" />
                      )}
                      <div>
                        <p className="font-semibold">
                          {availResult.available
                            ? "الفستان متاح مبدئياً في هذا التاريخ"
                            : availResult.reasonAr || "محجوز في هذا الموعد"}
                        </p>
                        {availResult.suggestions && availResult.suggestions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {availResult.suggestions.map((sg) => (
                              <Link
                                key={sg.code}
                                href={`/dress/${sg.code}`}
                                className="rounded bg-[var(--bg-primary)] px-2 py-1 text-[11px] font-semibold text-[var(--brand-gold)] underline"
                              >
                                {sg.code}: {sg.nameAr}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--text-strong)]">
                      الاسم بالكامل *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="مثال: سلمى أحمد"
                      className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--text-strong)]">
                      رقم الموبايل / واتساب *
                    </label>
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-strong)]">
                    ملاحظات إضافية (اختياري)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      activeTab === "tailor"
                        ? "اكتبي اللون المفضل أو أي تعديل بسيط تحبيه في التصميم"
                        : "مثال: أحتاج موعد بروفة مساءً أو تنسيق طرحة متطابقة"
                    }
                    className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
                  />
                </div>

                {submitError && (
                  <p className="rounded bg-[#3A2930] px-3 py-2 text-xs text-[#FFF9F2]">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded bg-[var(--brand-gold)] py-3 text-sm font-bold text-[#FFF9F2] transition hover:bg-[var(--brand-gold-hover)] disabled:opacity-60"
                >
                  {submitting
                    ? "جارٍ تسجيل الطلب..."
                    : activeTab === "tailor"
                      ? "تأكيد طلب التفصيل والتنفيذ"
                      : "احجزي الفستان وسجلي الطلب"}
                </button>

                <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                  <Link
                    href={`/booking?dress=${encodeURIComponent(dress.code)}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] py-2.5 text-xs font-semibold text-[var(--text-strong)] hover:border-[var(--brand-gold)]"
                  >
                    <CalendarCheck className="h-3.5 w-3.5 text-[var(--brand-gold)]" />
                    <span>احجزي موعد بروفة</span>
                  </Link>

                  {directWa ? (
                    <a
                      href={directWa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] py-2.5 text-xs font-semibold text-[var(--text-strong)] hover:border-[var(--brand-gold)]"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-[var(--brand-gold)]" />
                      <span>اسألي على واتساب</span>
                    </a>
                  ) : (
                    <Link
                      href="/contact"
                      className="inline-flex items-center justify-center gap-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] py-2.5 text-xs font-semibold text-[var(--text-strong)] hover:border-[var(--brand-gold)]"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-[var(--brand-gold)]" />
                      <span>تواصلي مع الأتيليه</span>
                    </Link>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Similar Dresses */}
      {similarDresses.length > 0 && (
        <section className="mt-14 border-t border-[var(--border-subtle)] pt-10">
          <h2 className="text-xl font-bold text-[var(--text-strong)]">موديلات مشابهة قد تعجبك</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {similarDresses.map((sim) => (
              <Link
                key={sim.code}
                href={`/dress/${sim.code}`}
                className="group overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              >
                <div className="aspect-[2/3] overflow-hidden bg-[#F7F1E8]">
                  <img
                    src={sim.shots[0]?.src}
                    alt={sim.nameAr}
                    className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <span className="font-en text-[10px] font-bold text-[var(--brand-gold)]">
                    {sim.code}
                  </span>
                  <p className="truncate text-xs font-bold text-[var(--text-strong)]">
                    {sim.nameAr}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
