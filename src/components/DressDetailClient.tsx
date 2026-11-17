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
  XCircle,
} from "lucide-react";
import type { AtelierSettings, Dress } from "@/lib/types";
import { formatDateAr, formatPrice } from "@/lib/utils";
import { buildDirectWhatsAppUrl, OCCASION_LABELS_AR, STATUS_LABELS_AR } from "@/lib/whatsapp";
import { DressCard } from "./DressCard";
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
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 md:py-10 lg:px-8">
      {/* Couture Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] pb-3.5 text-xs text-[var(--text-muted)]">
        <Link href="/" className="transition-colors hover:text-[var(--brand-gold)]">
          الرئيسية
        </Link>
        <span>/</span>
        <Link href="/collection" className="transition-colors hover:text-[var(--brand-gold)]">
          الكولكشن
        </Link>
        <span>/</span>
        <span dir="ltr" className="font-en text-[11px] font-bold tracking-[0.16em] text-[var(--brand-gold)]">
          {dress.code}
        </span>
        <span>·</span>
        <span className="font-semibold text-[var(--text-strong)]">{dress.nameAr}</span>
      </nav>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-10">
        {/* Sticky 360° Turntable Pedestal Column */}
        <div className="lg:sticky lg:top-20">
          <DressSpinViewer dress={dress} />
        </div>

        {/* Couture Dossier & Reservation Column */}
        <div className="space-y-5">
          <div className="border-b border-[var(--border-subtle)] pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  dir="ltr"
                  className="rounded-full border border-[var(--brand-gold)]/55 bg-[var(--bg-surface)] px-2.5 py-0.5 font-en text-[11px] font-bold tracking-[0.18em] text-[var(--brand-gold)]"
                >
                  {dress.code}
                </span>
                <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text-primary)]">
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
                className={`inline-flex h-8 items-center gap-1.5 rounded-2xl border px-3 text-xs font-semibold transition-colors ${
                  saved
                    ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#FAF7F2]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-strong)] hover:border-[var(--brand-gold)]"
                }`}
              >
                <Heart className={`size-3.5 ${saved ? "fill-current" : ""}`} strokeWidth={1.5} />
                <span>{saved ? "محفوظ للبروفة" : "حفظ للبروفة"}</span>
              </button>
            </div>

            <h1 className="mt-3 text-2xl font-bold text-[var(--text-strong)] sm:text-3xl">
              {dress.nameAr}
            </h1>
            <p dir="ltr" className="mt-0.5 font-editorial text-lg italic text-[var(--text-muted)]">
              {dress.nameEn}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-primary)] sm:text-sm">
              {dress.storyAr}
            </p>

            {/* Occasion Houses */}
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {dress.occasions.map((o) => (
                <Link
                  key={o}
                  href={`/collection?occasion=${o}`}
                  className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-strong)] transition-colors hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]"
                >
                  {OCCASION_LABELS_AR[o]}
                </Link>
              ))}
            </div>

            {/* Pricing / Atelier Policy Box */}
            <div className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              {dress.showPrice && dress.rentPrice ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      سعر الإيجار ({dress.rentalDays || 3} أيام)
                    </p>
                    <p className="text-xl font-bold text-[var(--brand-gold)]">
                      {formatPrice(dress.rentPrice)}
                    </p>
                  </div>
                  {dress.deposit ? (
                    <div className="text-left">
                      <p className="text-[11px] text-[var(--text-muted)]">تأمين مسترد</p>
                      <p className="text-sm font-bold text-[var(--text-strong)]">
                        {formatPrice(dress.deposit)}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[var(--text-strong)] sm:text-sm">
                      متاح للإيجار أو التفصيل — تواصلي لمعرفة السعر حسب تاريخك
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                      يشمل جلسة البروفة، تضييق المقاس مجاناً، والدراي كلين على الأتيليه
                    </p>
                  </div>
                  <span
                    dir="ltr"
                    className="shrink-0 font-en text-[10px] font-bold tracking-[0.16em] text-[var(--brand-gold)]"
                  >
                    ATELIER
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Fabric & Cut Specifications */}
          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5">
              <p className="text-[11px] font-semibold text-[var(--text-muted)]">الخامة والتطريز</p>
              <p className="mt-1 font-medium leading-relaxed text-[var(--text-strong)]">
                {dress.fabricAr}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5">
              <p className="text-[11px] font-semibold text-[var(--text-muted)]">الطول والقصّة</p>
              <p className="mt-1 font-medium leading-relaxed text-[var(--text-strong)]">
                {dress.lengthAr}
              </p>
            </div>
          </div>

          {/* Colors & Sizes */}
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-bold text-[var(--text-strong)]">اللون المتاح:</p>
              <div className="flex flex-wrap gap-2">
                {dress.colors.map((c) => (
                  <button
                    key={c.nameAr}
                    type="button"
                    onClick={() => setSelectedColor(c.nameAr)}
                    className={`inline-flex h-9 items-center gap-2 rounded-2xl border px-3 text-xs font-medium transition-colors ${
                      selectedColor === c.nameAr
                        ? "border-[var(--brand-gold)] bg-[var(--bg-surface)] text-[var(--text-strong)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:border-[var(--brand-gold)]/60"
                    }`}
                  >
                    <span
                      style={{ backgroundColor: c.hex }}
                      className="size-3.5 rounded-[2px] border border-black/20"
                    />
                    <span>{c.nameAr}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-[var(--text-strong)]">المقاسات المتاحة:</p>
                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--brand-gold)]">
                  <Ruler className="size-3.5" strokeWidth={1.5} />
                  <span>تضييق وضبط مجاني عند البروفة</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {dress.sizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`h-9 min-w-12 rounded-2xl border px-3 font-en text-xs font-bold transition-colors ${
                      selectedSize === sz
                        ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#FAF7F2]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-strong)] hover:border-[var(--brand-gold)]"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {dress.detailsAr.length > 0 && (
              <ul className="space-y-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-xs text-[var(--text-primary)]">
                {dress.detailsAr.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <ShieldCheck
                      className="mt-0.5 size-3.5 shrink-0 text-[var(--brand-gold)]"
                      strokeWidth={1.5}
                    />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Reservation / Bespoke Tailoring Dossier Form */}
          <div className="rounded-2xl border border-[var(--brand-gold)]/50 bg-[var(--bg-surface)] p-5">
            <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-1">
              <button
                type="button"
                onClick={() => setActiveTab("rent")}
                className={`h-9 rounded-full text-xs font-bold transition-colors ${
                  activeTab === "rent"
                    ? "bg-[var(--brand-gold)] text-[#FAF7F2]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                }`}
              >
                احجزي الفستان للإيجار
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tailor")}
                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-colors ${
                  activeTab === "tailor"
                    ? "bg-[var(--brand-gold)] text-[#FAF7F2]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                }`}
              >
                <Scissors className="size-3.5" strokeWidth={1.5} />
                <span>اطلبي تفصيل تصميم مماثل</span>
              </button>
            </div>

            {submitted ? (
              <div className="space-y-3 py-3 text-center">
                <CheckCircle2
                  className="mx-auto size-10 text-[var(--brand-gold)]"
                  strokeWidth={1.5}
                />
                <h3 className="text-base font-bold text-[var(--text-strong)]">
                  تم استلام طلبك بنجاح
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  رقم الطلب:{" "}
                  <span className="font-en font-bold text-[var(--brand-gold)]">{submitted.id}</span>
                  {" — "}تاريخ المناسبة: {formatDateAr(submitted.eventDate)}
                </p>
                <div className="flex flex-col gap-2 pt-2">
                  {submitted.whatsappUrl && (
                    <a
                      href={submitted.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[var(--brand-gold)] px-4 text-xs font-semibold text-[#FAF7F2]"
                    >
                      <MessageCircle className="size-4" strokeWidth={1.5} />
                      <span>أرسلي تفاصيل الحجز عبر واتساب</span>
                    </a>
                  )}
                  <Link
                    href={`/request/${submitted.id}`}
                    className="inline-flex h-10 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 text-xs font-semibold text-[var(--text-strong)]"
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
                    className="h-10 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
                  />
                  {availLoading && (
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                      جارٍ التحقق من جدول الحجوزات...
                    </p>
                  )}
                  {availResult && (
                    <div
                      className={`mt-2 flex items-start gap-2 rounded-2xl border p-2.5 text-xs ${
                        availResult.available
                          ? "border-[var(--brand-gold)]/45 bg-[var(--brand-gold)]/10 text-[var(--text-strong)]"
                          : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-strong)]"
                      }`}
                    >
                      {availResult.available ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--brand-gold)]" />
                      ) : (
                        <XCircle className="mt-0.5 size-4 shrink-0 text-[#8A4A57]" />
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
                                className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 text-[11px] font-semibold text-[var(--brand-gold)] hover:border-[var(--brand-gold)]"
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
                      className="h-10 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
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
                      className="h-10 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
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
                        ? "اكتبي اللون المفضل أو أي تعديل تحبيه في التصميم"
                        : "مثال: أحتاج موعد بروفة مساءً أو تنسيق طرحة متطابقة"
                    }
                    className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
                  />
                </div>

                {submitError && (
                  <p className="rounded-2xl bg-[#3A2930] px-3 py-2 text-xs text-[#FAF7F2]">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 w-full rounded-2xl bg-[var(--brand-gold)] text-sm font-bold text-[#FAF7F2] transition-colors hover:bg-[var(--brand-gold-hover)] disabled:opacity-60"
                >
                  {submitting
                    ? "جارٍ تسجيل الطلب..."
                    : activeTab === "tailor"
                      ? "تأكيد طلب التفصيل والتنفيذ"
                      : "احجزي الفستان وسجلي الطلب"}
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={`/booking?dress=${encodeURIComponent(dress.code)}`}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-xs font-semibold text-[var(--text-strong)] transition-colors hover:border-[var(--brand-gold)]"
                  >
                    <CalendarCheck className="size-3.5 text-[var(--brand-gold)]" strokeWidth={1.5} />
                    <span>موعد بروفة</span>
                  </Link>

                  {directWa ? (
                    <a
                      href={directWa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-xs font-semibold text-[var(--text-strong)] transition-colors hover:border-[var(--brand-gold)]"
                    >
                      <MessageCircle className="size-3.5 text-[var(--brand-gold)]" strokeWidth={1.5} />
                      <span>استفسار واتساب</span>
                    </a>
                  ) : (
                    <Link
                      href="/contact"
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-xs font-semibold text-[var(--text-strong)] transition-colors hover:border-[var(--brand-gold)]"
                    >
                      <MessageCircle className="size-3.5 text-[var(--brand-gold)]" strokeWidth={1.5} />
                      <span>تواصلي معنا</span>
                    </Link>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Similar Couture Pieces */}
      {similarDresses.length > 0 && (
        <section className="mt-14 border-t border-[var(--border-subtle)] pt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p dir="ltr" className="micro-label text-[var(--brand-gold)]">
                RELATED COUTURE EDITS
              </p>
              <h2 className="mt-1 text-xl font-bold text-[var(--text-strong)] sm:text-2xl">
                موديلات مشابهة قد تعجبك
              </h2>
            </div>
            <Link
              href="/collection"
              className="text-xs font-semibold text-[var(--brand-gold)] hover:underline"
            >
              عرض الكولكشن بالكامل
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4 md:gap-5">
            {similarDresses.map((sim) => (
              <DressCard key={sim.code} dress={sim} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
