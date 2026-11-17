"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpLeft, ChevronDown, Link2 } from "lucide-react";
import type { AtelierSettings } from "@/lib/types";
import { BrandLogo } from "./BrandLogo";

type MenuKey = "collections" | "guide" | "hub";

const COLLECTION_ITEMS = [
  { href: "/collection?occasion=engagement", labelAr: "فساتين خطوبة", badgeEn: "ENGAGEMENT" },
  { href: "/collection?occasion=soiree", labelAr: "فساتين سواريه", badgeEn: "SOIREE" },
  { href: "/collection?occasion=katb-ketab", labelAr: "كتب كتاب", badgeEn: "KATB KETAB" },
  { href: "/collection?occasion=bridal", labelAr: "زفاف وعروس", badgeEn: "BRIDAL" },
];

const GUIDE_ITEMS = [
  { href: "/collection", labelAr: "كتالوج الفساتين" },
  { href: "/rental", labelAr: "شروط الإيجار" },
  { href: "/tailoring", labelAr: "التفصيل والهاند ميد" },
  { href: "/booking", labelAr: "حجز موعد بروفة" },
];

const MENUS: Array<{ key: MenuKey; titleAr: string }> = [
  { key: "collections", titleAr: "أقسام وتشكيلات الأتيليه" },
  { key: "guide", titleAr: "دليل الإيجار والبروفة" },
  { key: "hub", titleAr: "القنوات والروابط الرسمية" },
];

export function Footer({
  settings,
}: {
  settings: Omit<AtelierSettings, "adminPassword" | "adminUsername">;
}) {
  const [openKey, setOpenKey] = React.useState<MenuKey | null>(null);
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
              className="flex flex-col items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5 text-center transition-colors hover:border-[var(--brand-gold)]"
            >
              <span
                dir="ltr"
                className="font-en text-[9.5px] font-bold tracking-[0.14em] text-[var(--brand-gold)]"
              >
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
              className="flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5 text-center text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]"
            >
              {item.labelAr}
            </Link>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <a
            href={settings.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--brand-gold)]"
          >
            <span className="truncate">إنستجرام الأتيليه</span>
            <ArrowUpLeft className="size-3.5 shrink-0 text-[var(--brand-gold)]" strokeWidth={1.5} />
          </a>
          <a
            href={settings.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--brand-gold)]"
          >
            <span className="truncate">صفحة فيسبوك</span>
            <ArrowUpLeft className="size-3.5 shrink-0 text-[var(--brand-gold)]" strokeWidth={1.5} />
          </a>
          <Link
            href="/links"
            onClick={() => setOpenKey(null)}
            className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5 text-xs font-semibold text-[var(--brand-gold)] transition-colors hover:border-[var(--brand-gold)] sm:col-span-1"
          >
            <Link2 className="size-3.5" strokeWidth={1.5} />
            <span>مركز الروابط و QR</span>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-5xl px-4 py-9 sm:px-6 sm:py-11">
        {/* 1. Centered Symmetric Brand Block */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" aria-label="Rony Dress">
            <BrandLogo variant="monogram" className="h-10 w-auto sm:h-11" />
          </Link>
          <p className="mt-2 text-xs font-semibold text-[var(--text-strong)]">
            {settings.storeName} — {settings.storeNameAr}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{settings.addressAr}</p>
        </div>

        {/* 2. Soft Symmetric Dropdown Menus */}
        <div className="mx-auto mt-6 max-w-2xl">
          <div className="divide-y divide-[var(--border-subtle)] overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] sm:hidden">
            {MENUS.map((m) => {
              const isOpen = openKey === m.key;
              return (
                <div key={m.key}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggle(m.key)}
                    className="grid w-full grid-cols-[16px_1fr_16px] items-center px-4 py-3 text-center text-xs font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--brand-gold)]"
                  >
                    <span aria-hidden="true" />
                    <span>{m.titleAr}</span>
                    <ChevronDown
                      className={`size-4 text-[var(--text-muted)] transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[var(--brand-gold)]" : ""
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-[var(--border-subtle)] px-3 py-3">
                      {renderMenuContent(m.key)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="hidden sm:block">
            <div className="grid grid-cols-3 gap-2.5">
              {MENUS.map((m) => {
                const isOpen = openKey === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggle(m.key)}
                    className={`inline-flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-xs font-semibold transition-colors ${
                      isOpen
                        ? "border-[var(--brand-gold)] bg-[var(--bg-primary)] text-[var(--brand-gold)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[var(--text-primary)]"
                    }`}
                  >
                    <span>{m.titleAr}</span>
                    <ChevronDown
                      className={`size-3.5 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : "text-[var(--text-muted)]"
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>
                );
              })}
            </div>
            {openKey && (
              <div className="mt-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4">
                {renderMenuContent(openKey)}
              </div>
            )}
          </div>
        </div>

        {/* 3. Symmetric Bottom Bar + Official Powered by Chameleon Pill */}
        <div className="mt-7 flex flex-col items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-5 text-center text-xs text-[var(--text-muted)] sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>جميع الحقوق محفوظة</span>
            <span dir="ltr" className="font-en font-medium text-[var(--text-primary)]">
              © {new Date().getFullYear()} Rony Dress
            </span>
            <span className="opacity-40">•</span>
            <Link
              href="/admin"
              className="font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--brand-gold)]"
            >
              لوحة الإدارة
            </Link>
          </div>

          <a
            href="https://chameleon.vision/"
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            className="group inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-1.5 whitespace-nowrap transition-colors hover:border-[var(--brand-gold)]"
          >
            <span className="font-en text-[11px] font-semibold tracking-wide text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-primary)]">
              Powered by
            </span>
            <img
              src="/chameleon-logo.webp"
              alt="Chameleon"
              className="h-4 w-auto shrink-0 object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <span className="font-en text-xs font-black tracking-wider text-[var(--brand-gold)]">
              Chameleon
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
