"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CalendarCheck, MapPin } from "lucide-react";
import type { AtelierCategory, AtelierSettings, Dress, Occasion } from "@/lib/types";
import { AtelierOrbitCarousel } from "./AtelierOrbitCarousel";
import { DressCard } from "./DressCard";

const FILTER_TABS: Array<{ key: "all" | Occasion; labelAr: string }> = [
  { key: "all", labelAr: "الكل" },
  { key: "engagement", labelAr: "خطوبة" },
  { key: "soiree", labelAr: "سواريه" },
  { key: "katb-ketab", labelAr: "كتب كتاب" },
  { key: "bridal", labelAr: "زفاف" },
  { key: "handmade", labelAr: "هاند ميد" },
];

const FOUR_HOUSES: Array<{
  slug: Occasion;
  shortEn: string;
  fullEn: string;
  titleAr: string;
  briefAr: string;
}> = [
  {
    slug: "engagement",
    shortEn: "ENGAGEMENT",
    fullEn: "RONY / ENGAGEMENT",
    titleAr: "فساتين خطوبة",
    briefAr: "قصّات وتطريز ملكي",
  },
  {
    slug: "soiree",
    shortEn: "SOIREE",
    fullEn: "RONY / SOIREE",
    titleAr: "فساتين سواريه",
    briefAr: "تصاميم سهرة محتشمة",
  },
  {
    slug: "katb-ketab",
    shortEn: "KATB KETAB",
    fullEn: "RONY / KATB KETAB",
    titleAr: "كتب كتاب",
    briefAr: "أوف وايت وشامبين ناعم",
  },
  {
    slug: "bridal",
    shortEn: "BRIDAL",
    fullEn: "RONY / BRIDAL",
    titleAr: "زفاف وعروس",
    briefAr: "إطلالة العروس الكاملة",
  },
];

export function HomeClientSections({
  settings,
  dresses,
}: {
  settings: Omit<AtelierSettings, "adminPassword" | "adminUsername">;
  categories?: AtelierCategory[];
  dresses: Dress[];
}) {
  const [activeFilter, setActiveFilter] = React.useState<"all" | Occasion>("all");

  const orbitDresses = React.useMemo(
    () =>
      dresses
        .filter((d) => d.onOrbit)
        .sort((a, b) => a.orbitOrder - b.orbitOrder),
    [dresses],
  );

  const visibleDresses = React.useMemo(() => {
    if (activeFilter === "all") return dresses.slice(0, 8);
    return dresses.filter((d) => d.occasions.includes(activeFilter)).slice(0, 8);
  }, [dresses, activeFilter]);

  return (
    <>
      {/* 1. FULL-VIEWPORT 3D CIRCULAR COUTURE HERO */}
      <AtelierOrbitCarousel dresses={orbitDresses.length > 0 ? orbitDresses : dresses} />

      {/* 2. CURATED COUTURE GALLERY (Symmetric 3x2 Mobile Filter Capsules + 2/4-Col Dress Grid) */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <p dir="ltr" className="micro-label text-[var(--brand-gold)]">
            CURATED COLLECTION
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--text-strong)] sm:text-3xl">
            موديلات منفذة ومتاحة للحجز
          </h2>
        </div>

        {/* Symmetric 3x2 Capsule Grid on Mobile, Centered Single Row on Desktop */}
        <div className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-2 sm:flex sm:max-w-none sm:flex-wrap sm:items-center sm:justify-center">
          {FILTER_TABS.map((tab) => {
            const active = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={`inline-flex h-9 items-center justify-center rounded-full border px-3 text-xs font-semibold whitespace-nowrap transition-colors sm:px-5 ${
                  active
                    ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#F7F6F3]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--brand-gold)]"
                }`}
              >
                {tab.labelAr}
              </button>
            );
          })}
        </div>

        <div className="mt-7 grid grid-cols-2 gap-x-3.5 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8 lg:grid-cols-4">
          {visibleDresses.map((dress) => (
            <DressCard key={dress.code} dress={dress} />
          ))}
        </div>

        <div className="mt-9 flex justify-center">
          <Link
            href="/collection"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-7 text-xs font-semibold text-[var(--text-strong)] transition-colors hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]"
          >
            <span>تصفحي الكولكشن بالكامل</span>
            <ArrowLeft className="size-3.5" strokeWidth={1.5} />
          </Link>
        </div>
      </section>

      {/* 3. SYMMETRIC 2x2 COUTURE HOUSES (4 Equal Cards — Zero Odd Row, Zero Text Bloat) */}
      <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-surface)] py-11 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-lg text-center">
            <p dir="ltr" className="micro-label text-[var(--brand-gold)]">
              ATELIER LINES
            </p>
            <h2 className="mt-1 text-xl font-bold text-[var(--text-strong)] sm:text-2xl">
              خطوط الأتيليه الأربعة
            </h2>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {FOUR_HOUSES.map((house) => {
              const count = dresses.filter((d) => d.occasions.includes(house.slug)).length;
              return (
                <Link
                  key={house.slug}
                  href={`/collection?occasion=${house.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 transition-colors hover:border-[var(--brand-gold)] sm:p-5"
                >
                  <div>
                    <div
                      dir="ltr"
                      className="flex items-center justify-between gap-1.5"
                    >
                      <span className="font-en text-[9.5px] font-bold tracking-[0.14em] whitespace-nowrap text-[var(--brand-gold)] sm:text-[10.5px]">
                        <span className="sm:hidden">{house.shortEn}</span>
                        <span className="hidden sm:inline">{house.fullEn}</span>
                      </span>
                      <span className="rounded-full bg-[var(--bg-surface)] px-2 py-0.5 font-en text-[9px] font-semibold text-[var(--text-muted)]">
                        0{count}
                      </span>
                    </div>

                    <h3 className="mt-2.5 text-sm font-bold text-[var(--text-strong)] transition-colors group-hover:text-[var(--brand-gold)] sm:text-base">
                      {house.titleAr}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-[11px] text-[var(--text-muted)] sm:text-xs">
                      {house.briefAr}
                    </p>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between border-t border-[var(--border-subtle)]/70 pt-2.5 text-[11px] font-semibold text-[var(--brand-gold)]">
                    <span>استعرضي الموديلات</span>
                    <ArrowLeft
                      className="size-3.5 shrink-0 transition-transform group-hover:-translate-x-0.5"
                      strokeWidth={1.5}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. COMPACT EDITORIAL CRAFTSMANSHIP SHOWCASE */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-7 lg:grid-cols-12 lg:gap-12">
          {/* Symmetric 2-Col Macro Beadwork Diptych */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-6">
            <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src="/images/dresses/rd-02-detail.webp"
                  alt="تفاصيل تطريز يدوي وفرينج"
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src="/images/dresses/rd-04-detail.webp"
                  alt="تفاصيل شك كريستال شامبين"
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
          </div>

          {/* Concise Editorial Copy & Symmetric Stats */}
          <div className="text-center lg:col-span-6 lg:text-right">
            <p dir="ltr" className="micro-label text-[var(--brand-gold)]">
              HANDMADE ATELIER
            </p>
            <h2 className="mt-1.5 text-xl font-bold leading-snug text-[var(--text-strong)] sm:text-3xl">
              شك يدوي متقن وبروفة تضبط المقاس بدقة
            </h2>
            <p className="mx-auto mt-2.5 max-w-md text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm lg:mx-0">
              ننسق لكِ تفاصيل الإطلالة بالكامل من التطريز اليدوي وباكستنشن التول القابل للفصل إلى تنسيق الطرحة وضبط المقاس مجاناً قبل استلام فستانك.
            </p>

            {/* Symmetric 3-Col Stats Bar */}
            <div className="mt-5 grid grid-cols-3 divide-x divide-x-reverse divide-[var(--border-subtle)] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-3.5 text-center">
              <div className="px-1.5">
                <p dir="ltr" className="font-en text-xs font-bold text-[var(--brand-gold)] sm:text-sm">
                  HANDMADE
                </p>
                <p className="mt-0.5 text-[10.5px] whitespace-nowrap text-[var(--text-muted)]">
                  شك وتطريز يدوي
                </p>
              </div>
              <div className="px-1.5">
                <p dir="ltr" className="font-en text-xs font-bold text-[var(--brand-gold)] sm:text-sm">
                  FREE FIT
                </p>
                <p className="mt-0.5 text-[10.5px] whitespace-nowrap text-[var(--text-muted)]">
                  بروفة وتضييق
                </p>
              </div>
              <div className="px-1.5">
                <p dir="ltr" className="font-en text-xs font-bold text-[var(--brand-gold)] sm:text-sm">
                  {settings.rentalDurationDays} DAYS
                </p>
                <p className="mt-0.5 text-[10.5px] whitespace-nowrap text-[var(--text-muted)]">
                  شامل الدراي كلين
                </p>
              </div>
            </div>

            {/* Symmetric Dual Capsule CTAs */}
            <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-2.5 lg:mx-0">
              <Link
                href="/booking"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-[var(--brand-gold)] px-4 text-xs font-semibold text-[#F7F6F3] whitespace-nowrap transition-colors hover:bg-[var(--brand-gold-hover)]"
              >
                <CalendarCheck className="size-3.5 shrink-0" strokeWidth={1.5} />
                <span>احجزي موعد بروفة</span>
              </Link>
              <Link
                href="/tailoring"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 text-xs font-semibold text-[var(--text-strong)] whitespace-nowrap transition-colors hover:border-[var(--text-primary)]"
              >
                التفصيل والهاند ميد
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. COMPACT SYMMETRIC 2x2 BOOKING STEPS & SALON BAR */}
      <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/65 py-11 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[
              { num: "01", title: "اختيار الموديل", desc: "معاينة الأمام والظهر والتفاصيل" },
              { num: "02", title: "فحص التاريخ", desc: "تأكيد التوفر في يوم مناسبتك" },
              { num: "03", title: "جلسة البروفة", desc: "ضبط المقاس وتنسيق الطرحة مجاناً" },
              { num: "04", title: "الاستلام جاهزاً", desc: "مجهز بالبخار وشامل الدراي كلين" },
            ].map((step) => (
              <div
                key={step.num}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 text-center sm:text-right"
              >
                <span
                  dir="ltr"
                  className="font-en text-[11px] font-bold tracking-[0.18em] text-[var(--brand-gold)]"
                >
                  {step.num}
                </span>
                <h3 className="mt-1 text-xs font-bold text-[var(--text-strong)] sm:text-sm">
                  {step.title}
                </h3>
                <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)]">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Sleek Salon Location Capsule Bar */}
          <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-3.5 text-center sm:flex-row sm:px-6 sm:text-right">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:justify-start">
              <MapPin className="size-4 shrink-0 text-[var(--brand-gold)]" strokeWidth={1.5} />
              <span className="font-bold text-[var(--text-strong)]">{settings.addressAr}</span>
              <span className="hidden text-[var(--border-subtle)] sm:inline">•</span>
              <span className="text-[11px] text-[var(--text-muted)]">{settings.workingHoursAr}</span>
            </div>
            <div className="grid w-full max-w-xs shrink-0 grid-cols-2 gap-2 sm:w-auto">
              <Link
                href="/rental"
                className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--border-subtle)] px-4 text-xs font-semibold text-[var(--text-primary)] whitespace-nowrap transition-colors hover:border-[var(--brand-gold)]"
              >
                شروط الإيجار
              </Link>
              <Link
                href="/booking"
                className="inline-flex h-9 items-center justify-center rounded-full bg-[var(--brand-gold)] px-4 text-xs font-semibold text-[#F7F6F3] whitespace-nowrap transition-colors hover:bg-[var(--brand-gold-hover)]"
              >
                حجز زيارة
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
