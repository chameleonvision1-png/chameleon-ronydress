import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Droplets,
  RefreshCw,
  Ruler,
  ShieldCheck,
} from "lucide-react";
import { publicDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "نظام وشروط الإيجار",
  description:
    "تفاصيل كيفية الحجز، مدة الإيجار، مبلغ التأمين المسترد، التنظيف، وتعديل المقاس في أتيليه Rony Dress.",
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
      icon: Droplets,
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
        <p dir="ltr" className="micro-label text-[var(--brand-gold)]">
          ATELIER RENTAL GUIDE
        </p>
        <h1 className="mt-1.5 text-2xl font-bold text-[var(--text-strong)] md:text-4xl">
          نظام الإيجار والسياسات في Rony Dress
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
          نحرص على أن تكون تجربة استئجار فستانك واضحة ومريحة من أول معاينة وحتى ما بعد مناسبتك.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {policies.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className="rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--brand-gold)]">
                  <Icon className="size-4" strokeWidth={1.5} />
                </span>
                <h2 className="text-base font-bold text-[var(--text-strong)]">{p.title}</h2>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[var(--text-primary)]">{p.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:flex-row md:p-8">
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 size-5 shrink-0 text-[var(--brand-gold)]"
            strokeWidth={1.5}
          />
          <div>
            <h3 className="text-base font-bold text-[var(--text-strong)]">
              جاهزة لاختيار فستان مناسبتك؟
            </h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              تصفحي الفساتين وتأكدي من توفر تاريخك أو احجزي موعد بروفة مباشرة في الأتيليه.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2.5">
          <Link
            href="/collection"
            className="inline-flex h-10 items-center justify-center rounded-[4px] bg-[var(--brand-gold)] px-5 text-xs font-bold text-[#FAF7F2]"
          >
            شاهدي الكولكشن
          </Link>
          <Link
            href="/booking"
            className="inline-flex h-10 items-center justify-center rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-5 text-xs font-bold text-[var(--text-strong)] hover:border-[var(--brand-gold)]"
          >
            حجز موعد
          </Link>
        </div>
      </div>
    </div>
  );
}
