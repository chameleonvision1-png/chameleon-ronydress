"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarCheck, Instagram, Layers, MapPin, MessageCircle, QrCode, Share2, ShieldCheck } from "lucide-react";
import type { AtelierSettings } from "@/lib/types";
import { buildDirectWhatsAppUrl } from "@/lib/whatsapp";
import { BrandLogo } from "./BrandLogo";
import { QrModal } from "./QrModal";

export function LinkHubClient({
  settings,
}: {
  settings: Omit<AtelierSettings, "adminPassword" | "adminUsername">;
}) {
  const [qrOpen, setQrOpen] = React.useState(false);
  const waUrl = buildDirectWhatsAppUrl(
    settings.whatsapp,
    "أهلاً أتيليه Rony Dress — أود السؤال عن توفر فستان.",
  );

  const links = [
    {
      href: "/collection",
      label: "شاهدي كولكشن الفساتين ٣٦٠°",
      sub: "خطوبة · سواريه · كتب كتاب · زفاف · هاند ميد",
      icon: Layers,
      internal: true,
    },
    {
      href: "/booking",
      label: "احجزي موعد بروفة في الأتيليه",
      sub: "تحديد الموعد والمقاس المبدئي أونلاين",
      icon: CalendarCheck,
      internal: true,
    },
    {
      href: "/rental",
      label: "نظام الإيجار والتفصيل",
      sub: "المدة، التأمين المسترد، التعديل، والدراي كلين",
      icon: ShieldCheck,
      internal: true,
    },
    {
      href: settings.instagramUrl,
      label: `إنستجرام الرسمي (${settings.instagramHandle})`,
      sub: "أحدث الموديلات المنفذة والتفاصيل اليومية",
      icon: Instagram,
      internal: false,
    },
    {
      href: settings.facebookUrl,
      label: "صفحة فيسبوك الرسمية — فستان ست البنات",
      sub: "متابعة الكولكشن والعروض",
      icon: Share2,
      internal: false,
    },
  ];

  return (
    <div className="mx-auto max-w-lg px-4 py-12 text-center">
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-7">
        <BrandLogo variant="full" className="mx-auto h-24" />
        <h1 className="mt-4 text-xl font-bold text-[var(--text-strong)]">
          {settings.storeName} — {settings.storeNameAr}
        </h1>
        <p className="mt-1 inline-flex items-center justify-center gap-1 text-xs text-[var(--text-muted)]">
          <MapPin className="size-3.5 text-[var(--brand-gold)]" strokeWidth={1.5} />
          <span>{settings.addressAr}</span>
        </p>

        <div className="mt-6 space-y-2.5 text-right">
          {links.map((item) => {
            const Icon = item.icon;
            const cls =
              "flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-3.5 transition-colors hover:border-[var(--brand-gold)]";
            const inner = (
              <>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--brand-gold)]">
                  <Icon className="size-4" strokeWidth={1.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--text-strong)]">{item.label}</p>
                  <p className="truncate text-[11px] text-[var(--text-muted)]">{item.sub}</p>
                </div>
              </>
            );
            return item.internal ? (
              <Link key={item.href} href={item.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>
                {inner}
              </a>
            );
          })}

          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl bg-[var(--brand-gold)] px-4 py-3.5 text-[#FAF7F2]"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <MessageCircle className="size-4" strokeWidth={1.5} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">تواصلي عبر واتساب الأتيليه</p>
                <p className="text-[11px] text-[#FAF7F2]/85">للسؤال عن التوفر والأسعار</p>
              </div>
            </a>
          )}
        </div>

        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[var(--brand-gold)] bg-[var(--bg-primary)] px-5 text-xs font-bold text-[var(--brand-gold)] transition-colors hover:bg-[var(--brand-gold)] hover:text-[#FAF7F2]"
        >
          <QrCode className="size-4" strokeWidth={1.5} />
          <span>عرض وتحميل رمز QR</span>
        </button>
      </div>

      <QrModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        url="https://ronydress.chameleon.vision/links"
      />
    </div>
  );
}
