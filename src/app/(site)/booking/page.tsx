import type { Metadata } from "next";
import { MapPin, Clock } from "lucide-react";
import { publicDB } from "@/lib/db";
import { BookingClient } from "@/components/BookingClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "حجز موعد بروفة وزيارة الأتيليه",
  description: "احجزي موعدك لزيارة أتيليه Rony Dress في كفر الزيات لتجربة الفساتين وتنسيق إطلالتك.",
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ dress?: string; dresses?: string }>;
}) {
  const sp = await searchParams;
  const { dresses, settings } = await publicDB();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <p className="micro-label text-[var(--brand-gold)]">ATELIER FITTING APPOINTMENT</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--text-strong)] md:text-4xl">
          حجز موعد تجربة وبروفة في الأتيليه
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          املئي بيانات مناسبتك لنجهز لكِ الموديلات المقترحة ومقاسك عند وصولك لأتيليه فستان ست البنات.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <BookingClient dresses={dresses} initialDressCode={sp.dress || sp.dresses} />

        <aside className="space-y-4">
          <div className="rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-xs">
            <h2 className="text-sm font-bold text-[var(--text-strong)]">بيانات الزيارة</h2>
            <div className="mt-3 space-y-3 text-[var(--text-primary)]">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-gold)]" />
                <span>{settings.addressAr}</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-gold)]" />
                <span>{settings.workingHoursAr}</span>
              </div>
            </div>
            <p className="mt-4 border-t border-[var(--border-subtle)] pt-3 leading-relaxed text-[var(--text-muted)]">
              {settings.visitingPolicyAr}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
