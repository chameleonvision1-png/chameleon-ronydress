import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  Ruler,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { publicDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "نظام وشروط الإيجار",
  description: "تفاصيل كيفية الحجز، مدة الإيجار، مبلغ التأمين المسترد، التنظيف، وتعديل المقاس في أتيليه Rony Dress.",
};

export default async function RentalPolicyPage() {
  const { settings } = await publicDB();

  const policies = [
    {
      icon: CalendarCheck,
      title: "١. الحجز المسبق وتأكيد التاريخ",
      desc: "يتم حجز الفستان بتاريخ المناسبة إما أونلاين عبر صفحة الفستان أو عند زيارة الأتيليه، مع إتمام البروفة وتحديد المقاس لتثبيت الحجز في جدول المواعيد.",
    },
    {
      icon: Clock,
      title: `٢. مدة الإيجار والاستلام (${settings.rentalDurationDays} أيام)`,
      desc: "يُستلم الفستان مجهزاً قبل المناسبة بيوم واحد، ويُعاد إلى الأتيليه في اليوم التالي للمناسبة وفق الموعد المتفق عليه في إيصال الحجز.",
    },
    {
      icon: ShieldCheck,
      title: "٣. مبلغ التأمين واسترداده",
      desc: settings.depositPolicyAr,
    },
    {
      icon: Ruler,
      title: "٤. تعديل وتضييق المقاس للبروفة",
      desc: settings.alterationPolicyAr,
    },
    {
      icon: Sparkles,
      title: "٥. التنظيف والدراي كلين",
      desc: settings.cleaningPolicyAr,
    },
    {
      icon: RefreshCw,
      title: "٦. التبديل أو تعديل الموعد وسياسة التلف",
      desc: `${settings.cancellationPolicyAr} ${settings.damagePolicyAr}`,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <p className="micro-label text-[var(--brand-gold)]">ATELIER RENTAL GUIDE</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--text-strong)] md:text-4xl">
          نظام الإيجار والسياسات في Rony Dress
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
          نحرص على أن تكون تجربة استئجار فستانك واضحة ومريحة من أول معاينة وحتى ما بعد مناسبتك.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        {policies.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-gold)]/15 text-[var(--brand-gold)]">
                  <Icon className="h-4 w-4" />
                </span>
                <h2 className="text-base font-bold text-[var(--text-strong)]">{p.title}</h2>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[var(--text-primary)]">{p.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-xl border border-[var(--brand-gold)]/40 bg-[#3A2930] p-6 text-[#FFF9F2] sm:flex-row md:p-8">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#B89040]" />
          <div>
            <h3 className="text-base font-bold">جاهزة لاختيار فستان مناسبتك؟</h3>
            <p className="mt-1 text-xs text-[#E8CFC5]">
              تصفحي الفساتين وتأكدي من توفر تاريخك أو احجزي موعد بروفة مباشرة في الأتيليه.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2.5">
          <Link
            href="/collection"
            className="rounded bg-[#B89040] px-5 py-2.5 text-xs font-bold text-[#FFF9F2]"
          >
            شاهدي الكولكشن
          </Link>
          <Link
            href="/booking"
            className="rounded border border-[#D7B98E]/50 px-5 py-2.5 text-xs font-bold text-[#FFF9F2]"
          >
            حجز موعد
          </Link>
        </div>
      </div>
    </div>
  );
}
