"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CalendarCheck, MapPin } from "lucide-react";
import type { AtelierCategory, AtelierSettings, Dress, Occasion } from "@/lib/types";
import { AtelierOrbitCarousel } from "./AtelierOrbitCarousel";
import { DressCard } from "./DressCard";

const SLASH_CODES: Record<Occasion, string> = {
  engagement: "RONY / ENGAGEMENT",
  soiree: "RONY / SOIREE",
  "katb-ketab": "RONY / KATB KETAB",
  bridal: "RONY / BRIDAL",
  handmade: "RONY / HANDMADE",
};

export function HomeClientSections({
  settings,
  categories,
  dresses,
}: {
  settings: Omit<AtelierSettings, "adminPassword" | "adminUsername">;
  categories: AtelierCategory[];
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
      {/* 1. SINGLE-VIEWPORT 3D FRAMELESS COUTURE RUNWAY HERO */}
      <AtelierOrbitCarousel dresses={orbitDresses.length > 0 ? orbitDresses : dresses} />

      {/* 2. SYMMETRIC SLASH COUTURE HOUSES */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p dir="ltr" className="micro-label text-[var(--brand-gold)]">
            ATELIER HOUSES
          </p>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--text-strong)] sm:text-3xl">
            أقسام أتيليه فستان ست البنات
          </h2>
          <p className="mt-1.5 text-xs text-[var(--text-muted)] sm:text-sm">
            خمسة خطوط تصميم منتقاة لتناسب كل ليلة استثنائية — متاحة للإيجار أو التفصيل الخاص
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {categories.map((cat, idx) => {
            const count = dresses.filter((d) => d.occasions.includes(cat.slug)).length;
            const isLastOddMobile = idx === categories.length - 1 && categories.length % 2 === 1;
            return (
              <Link
                key={cat.id}
                href={`/collection?occasion=${cat.slug}`}
                className={`group flex flex-col justify-between rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition-colors hover:border-[var(--brand-gold)] sm:p-5 ${
                  isLastOddMobile ? "col-span-2 lg:col-span-1" : ""
                }`}
              >
                <div>
                  <div
                    dir="ltr"
                    className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5"
                  >
                    <span className="font-en text-[10px] font-bold tracking-[0.16em] text-[var(--brand-gold)] uppercase">
                      {SLASH_CODES[cat.slug] || cat.nameEn}
                    </span>
                    <span className="font-en text-[9.5px] font-semibold tracking-[0.14em] text-[var(--text-muted)]">
                      0{count}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-[var(--text-strong)] transition-colors group-hover:text-[var(--brand-gold)] sm:text-lg">
                    {cat.nameAr}
                  </h3>
                  <p className="mt-1 text-[11px] font-medium text-[var(--text-primary)]">
                    {cat.subtitleAr}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
                    {cat.descriptionAr}
                  </p>
                </div>

                <div className="mt-4 inline-flex items-center gap-1.5 pt-2 text-[11px] font-semibold text-[var(--brand-gold)]">
                  <span>استعرضي القسم</span>
                  <ArrowLeft
                    className="size-3.5 transition-transform group-hover:-translate-x-1"
                    strokeWidth={1.5}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. EDITORIAL CRAFTSMANSHIP & ATELIER SPLIT BANNER */}
      <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-surface)] py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Editorial Macro Embroidery Diptych */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-6">
              <div className="overflow-hidden rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-stage)]">
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src="/images/dresses/rd-02-detail.webp"
                    alt="تفاصيل تطريز خرز وفرينج يدوي من أتيليه Rony Dress"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div
                  dir="ltr"
                  className="border-t border-[var(--border-subtle)] px-3 py-2 font-en text-[9.5px] font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase"
                >
                  RD-02 // BEADWORK &amp; FRINGE
                </div>
              </div>

              <div className="overflow-hidden rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-stage)]">
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src="/images/dresses/rd-04-detail.webp"
                    alt="تفاصيل شك كريستال ولؤلؤ شامبين من أتيليه Rony Dress"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div
                  dir="ltr"
                  className="border-t border-[var(--border-subtle)] px-3 py-2 font-en text-[9.5px] font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase"
                >
                  RD-04 // CHAMPAGNE CRYSTAL
                </div>
              </div>
            </div>

            {/* Editorial Copy & Symmetric Stats */}
            <div className="lg:col-span-6">
              <p dir="ltr" className="micro-label text-[var(--brand-gold)]">
                BESPOKE &amp; COUTURE CRAFTSMANSHIP
              </p>
              <p
                dir="ltr"
                className="mt-2 font-editorial text-2xl italic text-[var(--text-muted)] sm:text-3xl"
              >
                “Crafted for Every Unforgettable Night.”
              </p>
              <h2 className="mt-2 text-2xl font-bold leading-snug text-[var(--text-strong)] sm:text-3xl">
                شك يدوي متقن، تنسيق كامل للإطلالة، وبروفة تضبط المقاس بدقة
              </h2>
              <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">
                في أتيليه فستان ست البنات نهتم بكل تفصيلة تصنع حضورك — من نقوش الخرز والكريستال المشغولة يدوياً وباكستنشن التول الملكي القابل للفصل، إلى تنسيق درجة الطرحة وضبط المقاس مجاناً قبل استلام فستانك مكوياً بالبخار.
              </p>

              {/* Symmetric 3-Column Couture Stats */}
              <div className="mt-6 grid grid-cols-3 divide-x divide-x-reverse divide-[var(--border-subtle)] rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] py-3.5 text-center">
                <div className="px-2">
                  <p dir="ltr" className="font-en text-xs font-bold tracking-[0.14em] text-[var(--brand-gold)] sm:text-sm">
                    HANDMADE
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-[var(--text-muted)] sm:text-xs">
                    تطريز وشك يدوي
                  </p>
                </div>
                <div className="px-2">
                  <p dir="ltr" className="font-en text-xs font-bold tracking-[0.14em] text-[var(--brand-gold)] sm:text-sm">
                    FREE FIT
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-[var(--text-muted)] sm:text-xs">
                    بروفة وتضييق مجاني
                  </p>
                </div>
                <div className="px-2">
                  <p dir="ltr" className="font-en text-xs font-bold tracking-[0.14em] text-[var(--brand-gold)] sm:text-sm">
                    {settings.rentalDurationDays} DAYS
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-[var(--text-muted)] sm:text-xs">
                    شامل الدراي كلين
                  </p>
                </div>
              </div>

              {/* Symmetric Dual CTAs */}
              <div className="mt-6 grid max-w-md grid-cols-2 gap-3">
                <Link
                  href="/booking"
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[4px] bg-[var(--brand-gold)] px-4 text-xs font-semibold text-[#FAF7F2] whitespace-nowrap transition-colors hover:bg-[var(--brand-gold-hover)]"
                >
                  <CalendarCheck className="size-3.5 shrink-0" strokeWidth={1.5} />
                  <span>احجزي موعد بروفة</span>
                </Link>
                <Link
                  href="/tailoring"
                  className="inline-flex h-11 items-center justify-center rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 text-xs font-semibold text-[var(--text-strong)] whitespace-nowrap transition-colors hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]"
                >
                  التفصيل والهاند ميد
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FILTERABLE COUTURE GALLERY */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p dir="ltr" className="micro-label text-[var(--brand-gold)]">
            CURATED ATELIER COLLECTION
          </p>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--text-strong)] sm:text-3xl">
            موديلات منفذة ومتاحة للحجز
          </h2>
          <p className="mt-1.5 text-xs text-[var(--text-muted)] sm:text-sm">
            مرري المؤشر لمشاهدة ظهر الفستان، أو افتحي أي موديل لاستعراضه ٣٦٠° والتحقق من توفر تاريخ مناسبتك
          </p>
        </div>

        {/* Clean Couture Filter Tabs */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`h-9 rounded-[4px] border px-4 text-xs font-semibold transition-colors ${
              activeFilter === "all"
                ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#FAF7F2]"
                : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--brand-gold)]"
            }`}
          >
            الكل ({dresses.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveFilter(cat.slug)}
              className={`h-9 rounded-[4px] border px-3.5 text-xs font-semibold transition-colors ${
                activeFilter === cat.slug
                  ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#FAF7F2]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--brand-gold)]"
              }`}
            >
              {cat.nameAr}
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 md:gap-5">
          {visibleDresses.map((dress) => (
            <DressCard key={dress.code} dress={dress} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/collection"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[4px] border border-[var(--brand-gold)] bg-[var(--bg-primary)] px-7 text-xs font-semibold text-[var(--text-strong)] transition-colors hover:bg-[var(--brand-gold)] hover:text-[#FAF7F2]"
          >
            <span>عرض الكولكشن بالكامل وأدوات الفلترة</span>
            <ArrowLeft className="size-3.5" strokeWidth={1.5} />
          </Link>
        </div>
      </section>

      {/* 5. 4-STEP ATELIER BOOKING PROTOCOL & LOCATION BAR */}
      <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <p dir="ltr" className="micro-label text-[var(--brand-gold)]">
              ATELIER PROTOCOL
            </p>
            <h2 className="mt-1.5 text-2xl font-bold text-[var(--text-strong)] sm:text-3xl">
              أربع خطوات لإطلالتك في ليلة العمر
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                num: "01",
                title: "استعراض ٣٦٠° واختيار الموديل",
                desc: "تصفحي المنصة الدائرية أو الكتالوج ولفي الفستان من جميع الزوايا لمعاينة القصّة والتطريز.",
              },
              {
                num: "02",
                title: "فحص إتاحة تاريخ مناسبتك",
                desc: "تحققي فوراً من توفر الفستان في يوم مناسبتك أو اطلبي تنفيذ تصميم مماثل بمقاسك الخاص.",
              },
              {
                num: "03",
                title: "جلسة البروفة وتنسيق الطرحة",
                desc: "نضبط المقاس مجاناً في الأتيليه وننسق درجة الطرحة والباكستنشن بما يليق بإطلالتك.",
              },
              {
                num: "04",
                title: "استلام الفستان جاهزاً بالكامل",
                desc: "تستلمين الفستان مكوياً بالبخار ومجهزاً قبل مناسبتك بيوم، والدراي كلين بعد الإرجاع علينا.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5"
              >
                <span
                  dir="ltr"
                  className="font-en text-xs font-bold tracking-[0.2em] text-[var(--brand-gold)]"
                >
                  STEP // {step.num}
                </span>
                <h3 className="mt-2.5 text-sm font-bold text-[var(--text-strong)] sm:text-base">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Minimal Salon Location Strip */}
          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-5 py-4 sm:flex-row sm:px-6">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm">
              <MapPin className="size-4 shrink-0 text-[var(--brand-gold)]" strokeWidth={1.5} />
              <div>
                <span className="font-bold text-[var(--text-strong)]">{settings.addressAr}</span>
                <span className="mx-2 text-[var(--border-subtle)]">|</span>
                <span className="text-[var(--text-muted)]">{settings.workingHoursAr}</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <Link
                href="/rental"
                className="inline-flex h-9 items-center justify-center rounded-[4px] border border-[var(--border-subtle)] px-4 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]"
              >
                شروط الإيجار
              </Link>
              <Link
                href="/booking"
                className="inline-flex h-9 items-center justify-center rounded-[4px] bg-[var(--brand-gold)] px-4 text-xs font-semibold text-[#FAF7F2] transition-colors hover:bg-[var(--brand-gold-hover)]"
              >
                حجز زيارة الأتيليه
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
