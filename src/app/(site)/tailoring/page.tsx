import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, Layers, Scissors, Sparkles } from "lucide-react";
import { publicDB } from "@/lib/db";
import { DressCard } from "@/components/DressCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "التفصيل والتصميمات الهاند ميد",
  description: "تفاصيل تنفيذ الفساتين الهاند ميد، باكستنشن التل، البروشات، وطلب تصميم بمقاسك ولونك في Rony Dress.",
};

export default async function TailoringPage() {
  const { dresses } = await publicDB();
  const handmadeDresses = dresses.filter((d) => d.modes.tailor).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <p className="micro-label text-[var(--brand-gold)]">HANDMADE & BESPOKE ATELIER</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--text-strong)] md:text-4xl">
          التصميمات الهاند ميد والتفصيل الخاص
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
          في أتيليه فستان ست البنات ننفذ إضافات وتفاصيل يدوية مخصصة تمنح كل فستان بصمته الفريدة — من الشك والتطريز اليدوي إلى باكستنشن التل القابل للفصل وتنسيق الطرحة.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        {[
          {
            icon: Scissors,
            title: "تنفيذ تصميم مماثل بمقاسك",
            desc: "يمكنك اختيار أي موديل من أعمال الأتيليه المنفذة لطلب تفصيله بمقاساتك الخاصة مع مرونة اختيار درجة اللون.",
          },
          {
            icon: Layers,
            title: "باكستنشن تول وإضافات قابلة للفصل",
            desc: "تجهيز باكستنشن التل المتصل بالخصر أو الكاب الملكي لتحصلي على إطلالتين مختلفتين في الزفة والسهرة.",
          },
          {
            icon: Sparkles,
            title: "تطريز يدوي وتنسيق اللوك الكامل",
            desc: "شك الخرز والكريستال يدوياً، تثبيت البروشات، وتنسيق طرحة العروس أو الحجاب بما يناسب تفاصيل الفستان.",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-gold)]/15 text-[var(--brand-gold)]">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-3 text-base font-bold text-[var(--text-strong)]">{item.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">{item.desc}</p>
            </div>
          );
        })}
      </div>

      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-[var(--text-strong)]">
            نماذج منفذة متاحة للطلب والتفصيل المماثل
          </h2>
          <Link
            href="/booking"
            className="inline-flex items-center gap-1.5 rounded bg-[var(--brand-gold)] px-4 py-2 text-xs font-bold text-[#FFF9F2]"
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            <span>احجزي استشارة وتفصيل</span>
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-6">
          {handmadeDresses.map((d) => (
            <DressCard key={d.code} dress={d} />
          ))}
        </div>
      </section>

      <div className="mt-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-strong)]">
          <CheckCircle2 className="h-4 w-4 text-[var(--brand-gold)]" />
          <span>ملاحظة تنسيق وإكسسوارات</span>
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
          يتوفر في الأتيليه تنسيق طرح وحجاب العروس والسواريه والإكسسوارات المكملة للفستان حسب طبيعة الطلب في جلسة البروفة.
        </p>
      </div>
    </div>
  );
}
