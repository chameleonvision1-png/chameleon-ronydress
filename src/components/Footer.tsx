"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpLeft, ChevronDown, Link2, MapPin, QrCode } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { QrModal } from "./QrModal";
import type { AtelierSettings } from "@/lib/types";

type MenuKey = "collections" | "guide" | "hub";

const COLLECTION_ITEMS = [
  { href: "/collection?occasion=engagement", labelAr: "فساتين خطوبة", badgeEn: "ENGAGEMENT" },
  { href: "/collection?occasion=soiree", labelAr: "فساتين سواريه", badgeEn: "SOIREE" },
  { href: "/collection?occasion=katb-ketab", labelAr: "فساتين كتب كتاب", badgeEn: "KATB KETAB" },
  { href: "/collection?occasion=bridal", labelAr: "فساتين عروس وزفاف", badgeEn: "BRIDAL" },
];

const GUIDE_ITEMS = [
  { href: "/rental", labelAr: "نظام وشروط الإيجار" },
  { href: "/tailoring", labelAr: "التفصيل والهاند ميد" },
  { href: "/booking", labelAr: "حجز موعد بروفة" },
  { href: "/contact", labelAr: "العنوان ومواعيد العمل" },
];

const MENUS: Array<{ key: MenuKey; titleAr: string }> = [
  { key: "collections", titleAr: "أقسام وتشكيلات الأتيليه" },
  { key: "guide", titleAr: "دليل الإيجار والتفصيل والبروفة" },
  { key: "hub", titleAr: "القنوات الرسمية ورمز QR" },
];

export function Footer({
  settings,
}: {
  settings: Omit<AtelierSettings, "adminPassword" | "adminUsername">;
}) {
  const [openKey, setOpenKey] = React.useState<MenuKey | null>(null);
  const [qrOpen, setQrOpen] = React.useState(false);

  const toggle = (key: MenuKey) => setOpenKey((prev) => (prev === key ? null : key));

  const renderMenuContent = (key: MenuKey) => {
    if (key === "collections") {
      return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {COLLECTION_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpenKey(null)}
              className="flex flex-col items-center justify-center rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-center transition-colors hover:border-[var(--brand-gold)]"
            >
              <span dir="ltr" className="font-en text-[10px] font-bold tracking-[0.16em] text-[var(--brand-gold)]">
                {item.badgeEn}
              </span>
              <span className="mt-0.5 text-xs font-medium text-[var(--text-primary)]">
                {item.labelAr}
              </span>
            </Link>
          ))}
        </div>
      );
    }

    if (key === "guide") {
      return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GUIDE_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpenKey(null)}
              className="flex items-center justify-center rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-center text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]"
            >
              {item.labelAr}
            </Link>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2.5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <a
            href={settings.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-1.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3.5 py-2.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--brand-gold)]"
          >
            <span>إنستجرام ({settings.instagramHandle})</span>
            <ArrowUpLeft className="size-3.5 shrink-0 text-[var(--brand-gold)]" strokeWidth={1.5} />
          </a>
          <a
            href={settings.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-1.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3.5 py-2.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--brand-gold)]"
          >
            <span>فيسبوك — فستان ست البنات</span>
            <ArrowUpLeft className="size-3.5 shrink-0 text-[var(--brand-gold)]" strokeWidth={1.5} />
          </a>
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className="flex items-center justify-between gap-1.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3.5 py-2.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--brand-gold)]"
          >
            <span>باركود QR الأتيليه</span>
            <QrCode className="size-3.5 shrink-0 text-[var(--brand-gold)]" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex justify-center">
          <Link
            href="/links"
            onClick={() => setOpenKey(null)}
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-2 text-xs font-semibold text-[var(--brand-gold)] transition-colors hover:border-[var(--brand-gold)]"
          >
            <Link2 className="size-3.5" strokeWidth={1.5} />
            <span>فتح مركز الروابط الرسمي (Link Hub)</span>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col items-center text-center">
          <Link href="/" aria-label="Rony Dress">
            <BrandLogo variant="full" className="h-20 w-auto sm:h-24" />
          </Link>
          <p className="mt-3 text-xs font-semibold text-[var(--text-strong)] sm:text-sm">
            {settings.storeNameAr} — فساتين خطوبة وسواريه وكتب كتاب وزفاف
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <MapPin className="size-3.5 text-[var(--brand-gold)]" strokeWidth={1.5} />
            <span>{settings.addressAr}</span>
          </p>
        </div>

        {/* Symmetric Collapsible Menus (MO WORLD Minimal Architecture) */}
        <div className="mt-7 divide-y divide-[var(--border-subtle)] rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)]/60">
          {MENUS.map((m) => {
            const isOpen = openKey === m.key;
            return (
              <div key={m.key}>
                <button
                  type="button"
                  onClick={() => toggle(m.key)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--brand-gold)] sm:px-5"
                >
                  <span>{m.titleAr}</span>
                  <ChevronDown
                    className={`size-4 text-[var(--brand-gold)] transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    strokeWidth={1.5}
                  />
                </button>
                {isOpen && <div className="px-4 pb-4 sm:px-5">{renderMenuContent(m.key)}</div>}
              </div>
            );
          })}
        </div>

        {/* Bottom Legal & Chameleon Badge */}
        <div className="mt-7 flex flex-col items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-5 text-[11px] text-[var(--text-muted)] sm:flex-row">
          <div className="flex items-center gap-3">
            <span>© {new Date().getFullYear()} Rony Dress — أتيليه فستان ست البنات</span>
            <span>·</span>
            <Link href="/admin" className="hover:text-[var(--brand-gold)]">
              الإدارة
            </Link>
          </div>

          <a
            href="https://chameleon.vision"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-1.5 transition-colors hover:border-[var(--brand-gold)]"
          >
            <img
              src="/chameleon-logo.webp"
              alt="Chameleon Vision"
              className="size-4 rounded-full object-contain"
            />
            <span dir="ltr" className="font-en text-[10px] font-semibold tracking-[0.14em] text-[var(--text-primary)]">
              CRAFTED BY CHAMELEON VISION
            </span>
          </a>
        </div>
      </div>

      <QrModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        url="https://ronydress.chameleon.vision/links"
      />
    </footer>
  );
}
