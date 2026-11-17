import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, Gem, Layers, Scissors } from "lucide-react";
import { publicDB } from "@/lib/db";
import { DressCard } from "@/components/DressCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "التفصيل والتصميمات الهاند ميد",
  description:
    "تفاصيل تنفيذ الفساتين الهاند ميد، باكستنشن التل، البروشات، وطلب تصميم بمقاسك ولونك في Rony Dress.",
};

export default async function TailoringPage() {
  const { dresses } = await publicDB();
  const handmadeDresses = dresses.filter((d) => d.modes.tailor).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <p dir="ltr" className="micro-label text-[var(--brand-gold)]">
          HANDMADE &amp; BESPOKE ATELIER
        </p>
        <h1 className="mt-1.5 text-2xl font-bold text-[var(--text-strong)] md:text-4xl">
          التصميمات الهاند ميد والتفصيل الخاص
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
          في أتيليه فستان ست البنات ننفذ إضافات وتفاصيل يدوية مخصصة تمنح كل فستان بصمته الفريدة — من الشك والتطريز اليدوي إلى باكستنشن التل القابل للفصل وتنسيق الطرحة.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
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
            icon: Gem,
            title: "تطريز يدوي وتنسيق اللوك الكامل",
            desc: "شك الخرز والكريستال يدوياً، تثبيت البروشات، وتنسيق طرحة العروس أو الحجاب بما يناسب تفاصيل الفستان.",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--brand-gold)]">
                <Icon className="size-5" strokeWidth={1.5} />
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
            className="inline-flex h-10 items-center gap-1.5 rounded-2xl bg-[var(--brand-gold)] px-4 text-xs font-bold text-[#FAF7F2]"
          >
            <CalendarCheck className="size-3.5" strokeWidth={1.5} />
            <span>احجزي استشارة وتفصيل</span>
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4 md:gap-5">
          {handmadeDresses.map((d) => (
            <DressCard key={d.code} dress={d} />
          ))}
        </div>
      </section>

      <div className="mt-10 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-strong)]">
          <CheckCircle2 className="size-4 text-[var(--brand-gold)]" strokeWidth={1.5} />
          <span>تنسيق الإطلالة الكاملة</span>
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
          يتوفر في الأتيليه تنسيق طرح وحجاب العروس والسواريه والإكسسوارات المكملة للفستان حسب طبيعة الطلب في جلسة البروفة.
        </p>
      </div>
    </div>
  );
}
