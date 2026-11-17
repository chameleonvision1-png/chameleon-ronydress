"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpLeft,
  CalendarCheck,
  Heart,
  Menu,
  Moon,
  QrCode,
  Search,
  Sun,
  X,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { QrModal } from "./QrModal";
import { useShortlist } from "./ShortlistProvider";
import { useTheme } from "./ThemeProvider";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

const SLASH_NAV = [
  { href: "/collection?occasion=engagement", labelEn: "RONY / ENGAGEMENT", shortEn: "ENGAGEMENT" },
  { href: "/collection?occasion=soiree", labelEn: "RONY / SOIREE", shortEn: "SOIREE" },
  { href: "/collection?occasion=katb-ketab", labelEn: "RONY / KATB KETAB", shortEn: "KATB KETAB" },
  { href: "/collection?occasion=bridal", labelEn: "RONY / BRIDAL", shortEn: "BRIDAL" },
  { href: "/collection?occasion=handmade", labelEn: "RONY / HANDMADE", shortEn: "HANDMADE" },
];

const SITE_LINKS = [
  { href: "/", labelAr: "الرئيسية — صالون العرض ٣٦٠°" },
  { href: "/collection", labelAr: "كتالوج الفساتين الكامل" },
  { href: "/rental", labelAr: "نظام وشروط الإيجار" },
  { href: "/tailoring", labelAr: "التفصيل والتصميمات الهاند ميد" },
  { href: "/booking", labelAr: "حجز موعد بروفة وزيارة" },
  { href: "/contact", labelAr: "العنوان ومواعيد الأتيليه" },
];

export function Header({ announcementAr }: { announcementAr?: string }) {
  const pathname = usePathname();
  const { items, setDrawerOpen } = useShortlist();
  const { theme, toggleTheme } = useTheme();
  const [drawerState, setDrawerState] = React.useState<{
    open: boolean;
    forPath: string;
    view: "menu" | "hub";
  }>({
    open: false,
    forPath: pathname,
    view: "menu",
  });
  const [qrOpen, setQrOpen] = React.useState(false);

  const drawerOpen = drawerState.open && drawerState.forPath === pathname;
  useLockBodyScroll(drawerOpen);

  const openDrawer = (view: "menu" | "hub" = "menu") =>
    setDrawerState({ open: true, forPath: pathname, view });
  const closeDrawer = () =>
    setDrawerState((prev) => ({ ...prev, open: false, forPath: pathname }));

  return (
    <>
      {announcementAr && (
        <div className="hidden border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-center sm:block">
          <p className="mx-auto max-w-2xl truncate text-[11px] font-medium text-[var(--text-primary)] sm:text-xs">
            {announcementAr}
          </p>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-md">
        <div
          dir="ltr"
          className="mx-auto flex h-15 max-w-7xl items-center justify-between gap-3 px-4 sm:h-[4.25rem] sm:px-6 lg:px-8"
        >
          <Link
            href="/"
            aria-label="Rony Dress — الصفحة الرئيسية"
            className="inline-flex shrink-0 items-center gap-2.5 py-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)]"
          >
            <BrandLogo variant="monogram" className="h-8 w-auto sm:h-9" />
            <div className="flex flex-col leading-none">
              <span className="font-editorial text-lg font-semibold tracking-[0.06em] text-[var(--text-strong)] sm:text-xl">
                RONY DRESS
              </span>
              <span className="mt-1 font-en text-[8.5px] font-semibold tracking-[0.26em] text-[var(--brand-gold)] uppercase">
                COUTURE ATELIER
              </span>
            </div>
          </Link>

          <nav aria-label="أقسام أتيليه Rony Dress" className="hidden items-center gap-6 lg:flex">
            {SLASH_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-en text-[11px] font-semibold tracking-[0.18em] text-[var(--text-muted)] transition-colors hover:text-[var(--brand-gold)]"
              >
                {item.labelEn}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/collection"
              aria-label="البحث وتصفح الكتالوج"
              className="inline-flex size-9 items-center justify-center rounded-[4px] border border-transparent text-[var(--text-primary)] transition-colors hover:border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
            >
              <Search className="size-[17px]" strokeWidth={1.5} />
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
              className="inline-flex size-9 items-center justify-center rounded-[4px] border border-transparent text-[var(--text-primary)] transition-colors hover:border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
            >
              {theme === "dark" ? (
                <Sun className="size-[17px] text-[var(--brand-gold)]" strokeWidth={1.5} />
              ) : (
                <Moon className="size-[17px]" strokeWidth={1.5} />
              )}
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={`قائمة اختياراتي (${items.length})`}
              className="relative inline-flex h-9 items-center gap-1.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-[var(--text-primary)] transition-colors hover:border-[var(--brand-gold)]"
            >
              <Heart className="size-4 text-[var(--brand-gold)]" strokeWidth={1.5} />
              <span className="font-en text-xs font-semibold">{items.length}</span>
            </button>

            <button
              type="button"
              onClick={() => openDrawer("menu")}
              aria-label="فتح القائمة الجانبية"
              aria-expanded={drawerOpen}
              className="inline-flex size-9 items-center justify-center rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] transition-colors hover:border-[var(--brand-gold)]"
            >
              <Menu className="size-[18px]" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Symmetric Mobile/Tablet Couture Strip (Fits 100% cleanly on 1 line at 360px) */}
        <div
          dir="ltr"
          className="flex items-center justify-center gap-3 border-t border-[var(--border-subtle)] px-2.5 py-1.5 sm:gap-6 lg:hidden"
        >
          {SLASH_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-en text-[9.5px] font-semibold tracking-[0.13em] text-[var(--text-muted)] whitespace-nowrap transition-colors hover:text-[var(--brand-gold)] sm:text-[10px]"
            >
              {item.shortEn}
            </Link>
          ))}
        </div>
      </header>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-start bg-black/55 backdrop-blur-xs"
          onClick={closeDrawer}
          role="dialog"
          aria-modal="true"
          aria-label="القائمة الجانبية"
        >
          <div
            className="animate-drawer-right flex h-full w-84 max-w-[88vw] flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            data-modal-scroll
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div className="flex items-center gap-2.5">
                <BrandLogo variant="monogram" className="h-9" />
                <div>
                  <p className="font-editorial text-lg font-semibold text-[var(--text-strong)]">
                    Rony Dress
                  </p>
                  <p className="text-[11px] font-medium text-[var(--brand-gold)]">
                    أتيليه فستان ست البنات
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="إغلاق"
                className="flex size-8.5 items-center justify-center rounded-[4px] border border-[var(--border-subtle)] text-[var(--text-strong)] hover:border-[var(--brand-gold)]"
              >
                <X className="size-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Mode Switcher: Menu vs Official Link Hub */}
            <div className="mt-4 grid grid-cols-2 gap-1 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1">
              <button
                type="button"
                onClick={() => openDrawer("menu")}
                className={`rounded-[3px] py-1.5 text-xs font-semibold transition-colors ${
                  drawerState.view === "menu"
                    ? "bg-[var(--brand-gold)] text-[#FAF7F2]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                تصفح الأتيليه
              </button>
              <button
                type="button"
                onClick={() => openDrawer("hub")}
                className={`rounded-[3px] py-1.5 text-xs font-semibold transition-colors ${
                  drawerState.view === "hub"
                    ? "bg-[var(--brand-gold)] text-[#FAF7F2]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                القنوات و QR
              </button>
            </div>

            {drawerState.view === "menu" ? (
              <nav className="mt-4 flex-1 space-y-1">
                {SITE_LINKS.map((link) => {
                  const active =
                    link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeDrawer}
                      className={`flex items-center justify-between rounded-[4px] border px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                        active
                          ? "border-[var(--brand-gold)] bg-[var(--brand-gold)]/12 text-[var(--brand-gold)]"
                          : "border-transparent text-[var(--text-primary)] hover:border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
                      }`}
                    >
                      <span>{link.labelAr}</span>
                      <ArrowLeft className="size-3.5 text-[var(--brand-gold)]" strokeWidth={1.5} />
                    </Link>
                  );
                })}
              </nav>
            ) : (
              <div className="mt-4 flex-1 space-y-2.5">
                <a
                  href="https://www.instagram.com/rony_dress/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-3 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--brand-gold)]"
                >
                  <span>إنستجرام الرسمي (@rony_dress)</span>
                  <ArrowUpLeft className="size-3.5 text-[var(--brand-gold)]" strokeWidth={1.5} />
                </a>
                <a
                  href="https://www.facebook.com/rony.dress.2025/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-3 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--brand-gold)]"
                >
                  <span>صفحة فيسبوك — فستان ست البنات</span>
                  <ArrowUpLeft className="size-3.5 text-[var(--brand-gold)]" strokeWidth={1.5} />
                </a>
                <Link
                  href="/links"
                  onClick={closeDrawer}
                  className="flex items-center justify-between rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-3 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--brand-gold)]"
                >
                  <span>صفحة الروابط الرسمية الكاملة</span>
                  <ArrowLeft className="size-3.5 text-[var(--brand-gold)]" strokeWidth={1.5} />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    closeDrawer();
                    setQrOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-[4px] border border-[var(--brand-gold)]/50 bg-[var(--bg-surface)] px-3.5 py-3 text-xs font-semibold text-[var(--brand-gold)]"
                >
                  <QrCode className="size-4" strokeWidth={1.5} />
                  <span>فتح وتحميل باركود QR الأتيليه</span>
                </button>
              </div>
            )}

            <div className="border-t border-[var(--border-subtle)] pt-4">
              <Link
                href="/booking"
                onClick={closeDrawer}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-[4px] bg-[var(--brand-gold)] px-4 text-xs font-semibold text-[#FAF7F2] transition-colors hover:bg-[var(--brand-gold-hover)]"
              >
                <CalendarCheck className="size-4" strokeWidth={1.5} />
                <span>احجزي موعد بروفة في الأتيليه</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      <QrModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        url="https://ronydress.chameleon.vision/links"
      />
    </>
  );
}
