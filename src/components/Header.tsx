"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Heart, Menu, Moon, Sun, X } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { useShortlist } from "./ShortlistProvider";
import { useTheme } from "./ThemeProvider";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

const NAV_LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/collection", label: "الكولكشن" },
  { href: "/rental", label: "نظام الإيجار" },
  { href: "/tailoring", label: "التفصيل الهاند ميد" },
  { href: "/booking", label: "حجز موعد" },
  { href: "/contact", label: "العنوان والتواصل" },
];

export function Header({ announcementAr }: { announcementAr?: string }) {
  const pathname = usePathname();
  const [drawerOpenPath, setDrawerOpenPath] = React.useState<string | null>(null);
  const mobileOpen = drawerOpenPath === pathname;
  const { items, setDrawerOpen } = useShortlist();
  const { theme, toggleTheme } = useTheme();

  useLockBodyScroll(mobileOpen);

  return (
    <>
      {announcementAr && (
        <div className="border-b border-[var(--border-subtle)] bg-[#3A2930] px-4 py-2 text-center text-[11px] font-medium text-[#FFF9F2] md:text-xs">
          {announcementAr}
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/92 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:h-18 md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpenPath(mobileOpen ? null : pathname)}
              aria-label="فتح القائمة"
              className="flex h-10 w-10 items-center justify-center rounded border border-[var(--border-subtle)] text-[var(--text-strong)] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link
              href="/"
              className="flex items-center gap-2.5"
              aria-label="Rony Dress — الصفحة الرئيسية"
            >
              <BrandLogo variant="monogram" className="h-10 md:h-11" />
              <div className="flex flex-col leading-tight">
                <span className="font-editorial text-lg font-semibold tracking-wide text-[var(--text-strong)] md:text-xl">
                  Rony Dress
                </span>
                <span className="text-[10px] font-medium text-[var(--brand-gold)] md:text-[11px]">
                  أتيليه فستان ست البنات
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="التنقل الرئيسي">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-1 text-sm font-medium transition-colors ${
                    active
                      ? "text-[var(--brand-gold)]"
                      : "text-[var(--text-primary)] hover:text-[var(--brand-gold)]"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full bg-[var(--brand-gold)]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
              className="flex h-9 w-9 items-center justify-center rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-strong)] transition hover:border-[var(--brand-gold)]"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-[var(--brand-gold)]" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="قائمة اختياراتي"
              className="relative flex h-9 items-center gap-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs font-semibold text-[var(--text-strong)] transition hover:border-[var(--brand-gold)]"
            >
              <Heart className="h-4 w-4 text-[var(--brand-gold)]" />
              <span className="hidden sm:inline">اختياراتي</span>
              {items.length > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-gold)] px-1 text-[10px] font-bold text-[#FFF9F2]">
                  {items.length}
                </span>
              )}
            </button>

            <Link
              href="/booking"
              className="hidden items-center gap-1.5 rounded bg-[var(--brand-gold)] px-4 py-2 text-xs font-semibold text-[#FFF9F2] transition hover:bg-[var(--brand-gold-hover)] sm:inline-flex"
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              <span>احجزي موعدك</span>
            </Link>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-start bg-black/55 backdrop-blur-xs lg:hidden"
          onClick={() => setDrawerOpenPath(null)}
          role="dialog"
          aria-modal="true"
          aria-label="القائمة الجانبية"
        >
          <div
            className="animate-drawer-right flex h-full w-80 max-w-[85vw] flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5 shadow-2xl"
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
                  <p className="text-[11px] text-[var(--brand-gold)]">أتيليه فستان ست البنات</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpenPath(null)}
                aria-label="إغلاق"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-strong)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="mt-5 flex-1 space-y-1.5">
              {NAV_LINKS.map((link) => {
                const active =
                  link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setDrawerOpenPath(null)}
                    className={`flex items-center justify-between rounded px-3.5 py-3 text-sm font-semibold transition ${
                      active
                        ? "bg-[var(--brand-gold)] text-[#FFF9F2]"
                        : "text-[var(--text-strong)] hover:bg-[var(--bg-surface)]"
                    }`}
                  >
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              <Link
                href="/links"
                onClick={() => setDrawerOpenPath(null)}
                className="flex items-center justify-between rounded px-3.5 py-3 text-sm font-semibold text-[var(--text-strong)] hover:bg-[var(--bg-surface)]"
              >
                <span>روابط الأتيليه و QR</span>
              </Link>
            </nav>

            <div className="border-t border-[var(--border-subtle)] pt-4">
              <Link
                href="/booking"
                onClick={() => setDrawerOpenPath(null)}
                className="flex w-full items-center justify-center gap-2 rounded bg-[var(--brand-gold)] px-4 py-3 text-sm font-semibold text-[#FFF9F2]"
              >
                <CalendarCheck className="h-4 w-4" />
                <span>احجزي موعد بروفة</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
