import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  MapPin,
  Scissors,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { AtelierCategory, AtelierSettings, Dress } from "@/lib/types";
import { AtelierOrbitCarousel } from "./AtelierOrbitCarousel";
import { BrandLogo } from "./BrandLogo";
import { DressCard } from "./DressCard";

export function HomeClientSections({
  settings,
  categories,
  dresses,
}: {
  settings: Omit<AtelierSettings, "adminPassword" | "adminUsername">;
  categories: AtelierCategory[];
  dresses: Dress[];
}) {
  const orbitDresses = dresses
    .filter((d) => d.onOrbit)
    .sort((a, b) => a.orbitOrder - b.orbitOrder);

  const featuredDresses = dresses.filter((d) => d.isFeatured).slice(0, 8);

  return (
    <>
      {/* 1. LUXURY HERO WITH 3D CIRCULAR COUTURE CAROUSEL */}
      <section className="relative overflow-hidden border-b border-[var(--border-subtle)] bg-[radial-gradient(ellipse_at_top,rgba(232,207,197,0.28)_0%,transparent_65%)] pt-8 pb-12 md:pt-12 md:pb-16">
        <div className="mx-auto max-w-7xl px-4 text-center md:px-8">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[var(--brand-gold)]/40 bg-[var(--bg-surface)] px-4 py-1.5 text-xs font-semibold text-[var(--brand-gold)]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>أتيليه فستان ست البنات · كفر الزيات</span>
          </div>

          <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-bold leading-snug text-[var(--text-strong)] md:text-5xl md:leading-tight">
            إطلالتك تبدأ من <span className="font-editorial text-[var(--brand-gold)]">Rony Dress</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)] md:text-base">
            فساتين خطوبة وسواريه وكتب كتاب وزفاف بتفاصيل هاند ميد منتقاة بعناية — متاحة للإيجار أو التفصيل حسب طلبك. اسحبي أو اختاري أي فستان لاستعراضه ٣٦٠°.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/collection"
              className="inline-flex items-center gap-2 rounded bg-[var(--brand-gold)] px-6 py-3 text-sm font-bold text-[#FFF9F2] shadow-sm transition hover:bg-[var(--brand-gold-hover)]"
            >
              <span>شاهدي الكولكشن</span>
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 rounded border border-[var(--brand-gold)] bg-[var(--bg-primary)] px-6 py-3 text-sm font-bold text-[var(--text-strong)] transition hover:bg-[var(--bg-surface)]"
            >
              <CalendarCheck className="h-4 w-4 text-[var(--brand-gold)]" />
              <span>احجزي موعد بروفة</span>
            </Link>
          </div>
        </div>

        {/* Ultra-Light 3D Circular Dress Carousel */}
        <div className="mx-auto mt-6 max-w-7xl px-2 md:mt-8 md:px-6">
          <AtelierOrbitCarousel dresses={orbitDresses.length > 0 ? orbitDresses : dresses} />
        </div>
      </section>

      {/* 2. OCCASION CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="micro-label text-[var(--brand-gold)]">OCCASIONS & COUTURE</p>
            <h2 className="mt-1 text-2xl font-bold text-[var(--text-strong)] md:text-3xl">
              اختاري فستانك حسب مناسبتك
            </h2>
          </div>
          <Link
            href="/collection"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-gold)] hover:underline"
          >
            <span>تصفحي كل الفساتين</span>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/collection?occasion=${cat.slug}`}
              className="group flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition hover:border-[var(--brand-gold)] hover:shadow-md"
            >
              <div>
                <p className="font-en text-[11px] font-semibold tracking-wider text-[var(--brand-gold)] uppercase">
                  {cat.nameEn}
                </p>
                <h3 className="mt-1.5 text-lg font-bold text-[var(--text-strong)] group-hover:text-[var(--brand-gold)]">
                  {cat.nameAr}
                </h3>
                <p className="mt-1 text-xs font-medium text-[var(--text-strong)]">
                  {cat.subtitleAr}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                  {cat.descriptionAr}
                </p>
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-gold)]">
                <span>شاهدي الموديلات</span>
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED DRESSES CATALOG */}
      <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-surface)]/55 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="micro-label text-[var(--brand-gold)]">SELECTED ATELIER EDITS</p>
              <h2 className="mt-1 text-2xl font-bold text-[var(--text-strong)] md:text-3xl">
                موديلات منفذة ومتاحة للإيجار والتفصيل
              </h2>
            </div>
            <Link
              href="/collection"
              className="rounded border border-[var(--brand-gold)] px-4 py-2 text-xs font-bold text-[var(--brand-gold)] transition hover:bg-[var(--brand-gold)] hover:text-[#FFF9F2]"
            >
              عرض الكولكشن بالكامل
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {featuredDresses.map((dress) => (
              <DressCard key={dress.code} dress={dress} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW RENTAL & TAILORING WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <div className="text-center">
          <p className="micro-label text-[var(--brand-gold)]">ATELIER EXPERIENCE</p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--text-strong)] md:text-3xl">
            كيف تحجزين فستانك في Rony Dress؟
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "٠١",
              title: "اختاري الموديل والمناسبة",
              desc: "استعرضي الكاروسيل أو الكتالوج ولفي كل فستان لمشاهدة التفاصيل والتطريز من كل زاوية.",
            },
            {
              step: "٠٢",
              title: "تأكدي من التوفر بتاريخك",
              desc: "أدخلي تاريخ المناسبة في صفحة الفستان للتأكد فوراً من إتاحته للإيجار أو طلب تفصيل تصميم مماثل.",
            },
            {
              step: "٠٣",
              title: "احجزي موعد البروفة",
              desc: "شرفينا في الأتيليه لتجربة الفستان وأخذ المقاس وضبط التضييق مجاناً وتنسيق الطرحة.",
            },
            {
              step: "٠٤",
              title: "استلمي إطلالتك جاهزة",
              desc: "تستلمين الفستان مكوياً بالبخار ومجهزاً بالكامل قبل مناسبتك، والدراي كلين بعد الإرجاع علينا.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"
            >
              <span className="font-en text-2xl font-bold text-[var(--brand-gold)]">{item.step}</span>
              <h3 className="mt-2 text-base font-bold text-[var(--text-strong)]">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. STYLING, ACCESSORIES & HANDMADE DETAILS */}
      <section className="border-t border-[var(--border-subtle)] bg-[#3A2930] py-12 text-[#FFF9F2] md:py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 lg:grid-cols-2 md:px-8">
          <div className="space-y-4">
            <p className="micro-label text-[#D7B98E]">STYLING & HANDMADE ATELIER</p>
            <h2 className="text-2xl font-bold md:text-3xl">
              تنسيق الإطلالة الكاملة & التصميمات الهاند ميد
            </h2>
            <p className="text-sm leading-relaxed text-[#E8CFC5]">
              لا نكتفي بتوفير الفستان فقط — في أتيليه فستان ست البنات ننسق لكِ تفاصيل اللوك بالكامل من الطرح المتطابقة وتثبيت باكستنشن التول والإضافات اليدوية لضمان إطلالة محتشمة ومتكاملة ليلة مناسبتك.
            </p>
            <ul className="space-y-2.5 pt-2 text-xs text-[#FFF9F2]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#B89040]" />
                <span>تنسيق طرح وحجاب متناغم مع درجة التطريز ولون الفستان عند البروفة</span>
              </li>
              <li className="flex items-center gap-2">
                <Scissors className="h-4 w-4 shrink-0 text-[#B89040]" />
                <span>تنفيذ وتعديل باكستنشن التول، البروشات، والإضافات اليدوية الخاصة</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#B89040]" />
                <span>إمكانية تفصيل موديلات مختارة بألوان ومقاسات مخصصة بالطلب</span>
              </li>
            </ul>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/tailoring"
                className="rounded bg-[#B89040] px-5 py-2.5 text-xs font-bold text-[#FFF9F2] transition hover:bg-[#9C7730]"
              >
                تفاصيل التفصيل والهاند ميد
              </Link>
              <Link
                href="/rental"
                className="rounded border border-[#D7B98E]/50 px-5 py-2.5 text-xs font-bold text-[#FFF9F2] transition hover:border-[#B89040]"
              >
                سياسة ونظام الإيجار
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-[#B89040]/40 bg-[#171317] p-6 text-center md:p-8">
            <BrandLogo variant="full" tone="gold" className="mx-auto h-28" />
            <div className="mt-5 space-y-2 border-t border-white/10 pt-5 text-xs text-[#E8CFC5]">
              <p className="inline-flex items-center justify-center gap-1.5 font-semibold text-[#FFF9F2]">
                <MapPin className="h-4 w-4 text-[#B89040]" />
                <span>{settings.addressAr}</span>
              </p>
              <p>{settings.workingHoursAr}</p>
              <div className="pt-3">
                <Link
                  href="/booking"
                  className="inline-flex items-center gap-2 rounded bg-[#B89040] px-6 py-2.5 text-xs font-bold text-[#FFF9F2]"
                >
                  <CalendarCheck className="h-4 w-4" />
                  <span>احجزي موعد زيارتك الآن</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
