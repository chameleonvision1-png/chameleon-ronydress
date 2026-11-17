import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Clock, Instagram, MapPin, MessageCircle, Phone, Share2 } from "lucide-react";
import { publicDB } from "@/lib/db";
import { buildDirectWhatsAppUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "العنوان والتواصل",
  description: "عنوان أتيليه Rony Dress (أتيليه فستان ست البنات) في كفر الزيات ومواعيد العمل وحسابات التواصل الرسمية.",
};

export default async function ContactPage() {
  const { settings } = await publicDB();
  const waUrl = buildDirectWhatsAppUrl(
    settings.whatsapp,
    "أهلاً أتيليه Rony Dress — أود الاستفسار عن الفساتين ومواعيد البروفة.",
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <p className="micro-label text-[var(--brand-gold)]">ATELIER LOCATION & CONTACT</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--text-strong)] md:text-4xl">
          العنوان والتواصل — أتيليه فستان ست البنات
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          شرفينا بزيارة الأتيليه في كفر الزيات أو تواصلي معنا عبر القنوات الرسمية لتنسيق موعد البروفة.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
          <h2 className="text-base font-bold text-[var(--text-strong)]">بيانات الأتيليه</h2>

          <div className="flex items-start gap-3 text-sm">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-gold)]" />
            <div>
              <p className="font-bold text-[var(--text-strong)]">{settings.addressAr}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{settings.addressNoteAr}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-gold)]" />
            <div>
              <p className="font-bold text-[var(--text-strong)]">ساعات العمل</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{settings.workingHoursAr}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{settings.visitingPolicyAr}</p>
            </div>
          </div>

          {settings.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-5 w-5 shrink-0 text-[var(--brand-gold)]" />
              <a href={`tel:${settings.phone}`} className="font-bold hover:text-[var(--brand-gold)]" dir="ltr">
                {settings.phone}
              </a>
            </div>
          )}

          {settings.mapsUrl && (
            <a
              href={settings.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded bg-[var(--brand-gold)] px-4 py-2 text-xs font-bold text-[#FFF9F2]"
            >
              <MapPin className="h-4 w-4" />
              <span>فتح الموقع على خرائط Google</span>
            </a>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
          <h2 className="text-base font-bold text-[var(--text-strong)]">الحسابات الرسمية والحجز السريع</h2>

          <div className="space-y-2.5">
            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-3 text-sm font-semibold transition-colors hover:border-[var(--brand-gold)]"
            >
              <span className="inline-flex items-center gap-2.5">
                <Instagram className="h-4 w-4 text-[var(--brand-gold)]" />
                <span>إنستجرام الرسمي</span>
              </span>
              <span className="font-en text-xs text-[var(--brand-gold)]" dir="ltr">
                {settings.instagramHandle}
              </span>
            </a>

            <a
              href={settings.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-3 text-sm font-semibold transition-colors hover:border-[var(--brand-gold)]"
            >
              <span className="inline-flex items-center gap-2.5">
                <Share2 className="h-4 w-4 text-[var(--brand-gold)]" />
                <span>صفحة Rony Dress على فيسبوك</span>
              </span>
              <span className="text-xs text-[var(--text-muted)]">فستان ست البنات</span>
            </a>

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-2xl bg-[var(--brand-gold)] px-4 py-3 text-sm font-bold text-[#FAF7F2]"
              >
                <span className="inline-flex items-center gap-2.5">
                  <MessageCircle className="h-4 w-4" />
                  <span>مراسلة واتساب المباشرة</span>
                </span>
                <span className="text-xs">رد سريع</span>
              </a>
            )}

            <Link
              href="/booking"
              className="flex items-center justify-between rounded-2xl border border-[var(--brand-gold)] bg-[var(--bg-primary)] px-4 py-3 text-sm font-bold text-[var(--text-strong)] transition-colors hover:bg-[var(--brand-gold)] hover:text-[#FAF7F2]"
            >
              <span className="inline-flex items-center gap-2.5">
                <CalendarCheck className="h-4 w-4 text-[var(--brand-gold)]" />
                <span>حجز موعد بروفة وزيارة</span>
              </span>
              <span className="text-xs">أونلاين</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
