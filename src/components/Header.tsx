"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpLeft,
  CalendarCheck,
  Heart,
  Link2,
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

const NAV_OCCASIONS = [
  { href: "/collection?occasion=engagement", labelAr: "خطوبة", badgeEn: "ENGAGEMENT" },
  { href: "/collection?occasion=soiree", labelAr: "سواريه", badgeEn: "SOIREE" },
  { href: "/collection?occasion=katb-ketab", labelAr: "كتب كتاب", badgeEn: "KATB KETAB" },
  { href: "/collection?occasion=bridal", labelAr: "زفاف", badgeEn: "BRIDAL" },
  { href: "/collection?occasion=handmade", labelAr: "هاند ميد", badgeEn: "HANDMADE" },
];

const SITE_LINKS = [
  { href: "/", labelAr: "الرئيسية" },
  { href: "/collection", labelAr: "كتالوج الفساتين الكامل" },
  { href: "/rental", labelAr: "نظام وشروط الإيجار" },
  { href: "/tailoring", labelAr: "التفصيل والهاند ميد" },
  { href: "/booking", labelAr: "حجز موعد بروفة" },
  { href: "/contact", labelAr: "العنوان ومواعيد الأتيليه" },
];

export function Header(_props: { announcementAr?: string }) {
  void _props;
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
      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)]/85 bg-[var(--bg-primary)]/94 backdrop-blur-md">
        {/* Main Header Bar — Guaranteed Zero Overflow on 320px..1920px */}
        <div
          dir="ltr"
          className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3.5 sm:h-16 sm:px-6 lg:px-8"
        >
          <Link
            href="/"
            aria-label="Rony Dress — الصفحة الرئيسية"
            className="inline-flex min-w-0 shrink-0 items-center gap-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)]"
          >
            <BrandLogo variant="monogram" className="h-7 w-auto shrink-0 sm:h-8" />
            <span className="font-editorial text-lg font-semibold tracking-[0.04em] text-[var(--text-strong)] sm:text-xl">
              Rony Dress
            </span>
          </Link>

          <nav
            dir="rtl"
            aria-label="أقسام أتيليه Rony Dress"
            className="hidden items-center gap-6 lg:flex"
          >
            {NAV_OCCASIONS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[13px] font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
              >
                {item.labelAr}
              </Link>
            ))}
            <Link
              href="/booking"
              className="text-[13px] font-semibold text-[var(--brand-gold)] transition-colors hover:text-[var(--text-strong)]"
            >
              حجز بروفة
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <Link
              href="/collection"
              aria-label="البحث وتصفح الكولكشن"
              className="inline-flex size-8.5 items-center justify-center rounded-full text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface)] sm:size-9"
            >
              <Search className="size-[17px]" strokeWidth={1.5} />
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
              className="inline-flex size-8.5 items-center justify-center rounded-full text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface)] sm:size-9"
            >
              {theme === "dark" ? (
                <Sun className="size-[17px]" strokeWidth={1.5} />
              ) : (
                <Moon className="size-[17px]" strokeWidth={1.5} />
              )}
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={`قائمة البروفة (${items.length})`}
              className="inline-flex h-8.5 items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 px-2.5 text-[var(--text-primary)] transition-colors hover:border-[var(--brand-gold)] sm:h-9 sm:px-3"
            >
              <Heart
                className={`size-3.5 text-[var(--brand-gold)] ${items.length > 0 ? "fill-current" : ""}`}
                strokeWidth={1.6}
              />
              <span className="font-en text-xs font-semibold">{items.length}</span>
            </button>

            <button
              type="button"
              onClick={() => openDrawer("menu")}
              aria-label="فتح القائمة الجانبية"
              aria-expanded={drawerOpen}
              className="inline-flex size-8.5 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 text-[var(--text-primary)] transition-colors hover:border-[var(--text-primary)] sm:size-9"
            >
              <Menu className="size-[17px]" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Symmetric Compact Mobile Occasion Strip — Fits 100% Inside 320px..1023px With Zero Clipping */}
        <div
          dir="rtl"
          className="flex items-center justify-center gap-3.5 border-t border-[var(--border-subtle)]/70 px-3 py-1.5 sm:gap-6 lg:hidden"
        >
          {NAV_OCCASIONS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[11.5px] font-semibold whitespace-nowrap text-[var(--text-muted)] transition-colors hover:text-[var(--brand-gold)] sm:text-xs"
            >
              {item.labelAr}
            </Link>
          ))}
        </div>
      </header>

      {/* Ultra-Clean Soft Slide-Over Sidebar (Zero Stacked Box Clutter) */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="القائمة الرئيسية"
          className="fixed inset-0 z-[60]"
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={closeDrawer}
          />
          <aside
            dir="rtl"
            data-modal-scroll
            className="no-scrollbar animate-drawer-right fixed inset-y-0 right-0 z-10 flex w-[min(84vw,330px)] flex-col justify-between overflow-y-auto border-l border-[var(--border-subtle)] bg-[var(--bg-primary)] px-5 py-5"
          >
            <div>
              {/* Minimal Top Bar */}
              <div className="flex items-center justify-between pb-4">
                <Link href="/" onClick={closeDrawer} className="inline-flex items-center gap-2">
                  <BrandLogo variant="monogram" className="h-6 w-auto" />
                  <span className="font-editorial text-base font-semibold text-[var(--text-strong)]">
                    Rony Dress
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={closeDrawer}
                  aria-label="إغلاق القائمة"
                  className="inline-flex size-8 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                >
                  <X className="size-4" strokeWidth={1.5} />
                </button>
              </div>

              {/* Sleek Pill Segmented Switcher */}
              <div className="grid grid-cols-2 gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1">
                <button
                  type="button"
                  onClick={() => setDrawerState((s) => ({ ...s, view: "menu" }))}
                  className={`h-8 rounded-full text-xs font-semibold transition-colors ${
                    drawerState.view === "menu"
                      ? "bg-[var(--bg-primary)] text-[var(--text-strong)] shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  تصفح الأتيليه
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerState((s) => ({ ...s, view: "hub" }))}
                  className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition-colors ${
                    drawerState.view === "hub"
                      ? "bg-[var(--bg-primary)] text-[var(--brand-gold)] shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Link2 className="size-3.5" strokeWidth={1.5} />
                  <span>القنوات الرسمية</span>
                </button>
              </div>

              {drawerState.view === "menu" ? (
                <>
                  {/* Symmetric 2x2 Quick Occasion Pills */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {NAV_OCCASIONS.slice(0, 4).map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={closeDrawer}
                        className="flex h-9.5 items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/65 px-3 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]"
                      >
                        <span>{sub.labelAr}</span>
                        <ArrowLeft className="size-3 text-[var(--text-muted)]" strokeWidth={1.5} />
                      </Link>
                    ))}
                  </div>

                  {/* Clean Hairline-Divided Navigation Rows (Zero Heavy Rectangles) */}
                  <nav
                    aria-label="روابط الموقع"
                    className="mt-5 flex flex-col divide-y divide-[var(--border-subtle)]/70 border-t border-[var(--border-subtle)]/70"
                  >
                    {SITE_LINKS.map((link) => {
                      const active = pathname === link.href;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={closeDrawer}
                          className={`flex items-center justify-between py-3 text-[13px] transition-colors ${
                            active
                              ? "font-bold text-[var(--brand-gold)]"
                              : "font-medium text-[var(--text-primary)] hover:text-[var(--brand-gold)]"
                          }`}
                        >
                          <span>{link.labelAr}</span>
                          <ArrowLeft
                            className={`size-3.5 transition-opacity ${
                              active ? "opacity-100" : "opacity-35"
                            }`}
                            strokeWidth={1.5}
                          />
                        </Link>
                      );
                    })}
                  </nav>
                </>
              ) : (
                <div className="mt-5 space-y-2.5">
                  <div className="pb-1 text-center">
                    <p className="text-xs font-bold text-[var(--text-strong)]">
                      أتيليه فستان ست البنات — كفر الزيات
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                      شارع السينما — أمام قاعة ليلتي
                    </p>
                  </div>

                  <a
                    href="https://www.instagram.com/rony_dress/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 px-3.5 py-3 transition-colors hover:border-[var(--brand-gold)]"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-strong)]">إنستجرام الرسمي</p>
                      <p dir="ltr" className="font-en text-[10px] text-[var(--text-muted)]">
                        @rony_dress
                      </p>
                    </div>
                    <ArrowUpLeft className="size-3.5 text-[var(--brand-gold)]" strokeWidth={1.5} />
                  </a>

                  <a
                    href="https://www.facebook.com/share/1DJ2bf2K2x/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 px-3.5 py-3 transition-colors hover:border-[var(--brand-gold)]"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-strong)]">صفحة فيسبوك الرسمية</p>
                      <p className="text-[10px] text-[var(--text-muted)]">أتيليه فستان ست البنات</p>
                    </div>
                    <ArrowUpLeft className="size-3.5 text-[var(--brand-gold)]" strokeWidth={1.5} />
                  </a>

                  <Link
                    href="/links"
                    onClick={closeDrawer}
                    className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 px-3.5 py-3 transition-colors hover:border-[var(--brand-gold)]"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-strong)]">مركز الروابط الكامل</p>
                      <p className="text-[10px] text-[var(--text-muted)]">جميع الروابط وحجز المواعيد</p>
                    </div>
                    <ArrowLeft className="size-3.5 text-[var(--brand-gold)]" strokeWidth={1.5} />
                  </Link>
                </div>
              )}
            </div>

            {/* Symmetric Rounded Capsule Bottom Row */}
            <div className="mt-6 border-t border-[var(--border-subtle)] pt-3.5">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/booking"
                  onClick={closeDrawer}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--brand-gold)] px-3 text-xs font-semibold text-[#F7F6F3] transition-colors hover:bg-[var(--brand-gold-hover)]"
                >
                  <CalendarCheck className="size-3.5" strokeWidth={1.5} />
                  <span>حجز بروفة</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    closeDrawer();
                    setQrOpen(true);
                  }}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--text-primary)]"
                >
                  <QrCode className="size-3.5" strokeWidth={1.5} />
                  <span>كود QR</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      <QrModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        url="https://ronydress.chameleon.vision"
      />
    </>
  );
}
