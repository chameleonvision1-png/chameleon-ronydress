"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarCheck, Heart, Trash2, X } from "lucide-react";
import { useShortlist } from "./ShortlistProvider";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import { STATUS_LABELS_AR } from "@/lib/whatsapp";

export function ShortlistDrawer() {
  const { items, drawerOpen, setDrawerOpen, removeItem, clear } = useShortlist();
  useLockBodyScroll(drawerOpen);

  React.useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, setDrawerOpen]);

  if (!drawerOpen) return null;

  const firstCodes = items.map((i) => i.code).join("، ");

  return (
    <div
      className="fixed inset-0 z-50 flex justify-start bg-black/55 backdrop-blur-xs"
      onClick={() => setDrawerOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="قائمة اختياراتي"
    >
      <div
        className="animate-drawer-right flex h-full w-full max-w-md flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-primary)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Heart className="size-4 text-[var(--brand-gold)]" strokeWidth={1.5} />
            <div>
              <h2 className="text-base font-bold text-[var(--text-strong)]">قائمة اختياراتي للبروفة</h2>
              <p className="text-xs text-[var(--text-muted)]">
                احفظي الفساتين المفضلة لتجربتها في موعد زيارتك
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="إغلاق القائمة"
            className="flex size-9 items-center justify-center rounded-2xl border border-[var(--border-subtle)] text-[var(--text-primary)] transition-colors hover:border-[var(--brand-gold)]"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5" data-modal-scroll>
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-14 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--brand-gold)]">
                <Heart className="size-6" strokeWidth={1.5} />
              </div>
              <p className="mt-4 text-sm font-semibold text-[var(--text-strong)]">
                لم تختاري أي فساتين بعد
              </p>
              <p className="mt-1 max-w-xs text-xs text-[var(--text-muted)]">
                تصفحي الكولكشن أو المنصة الدائرية وأضيفي الفساتين المفضلة لتجهيزها لكِ قبل البروفة.
              </p>
              <Link
                href="/collection"
                onClick={() => setDrawerOpen(false)}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-2xl bg-[var(--brand-gold)] px-5 text-xs font-semibold text-[#FAF7F2]"
              >
                شاهدي الكولكشن
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.code}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5"
                >
                  <Link
                    href={`/dress/${item.code}`}
                    onClick={() => setDrawerOpen(false)}
                    className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[var(--bg-stage)] p-1"
                  >
                    <img
                      src={item.image}
                      alt={item.nameAr}
                      className="h-full w-full object-contain"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        dir="ltr"
                        className="font-en text-[11px] font-bold tracking-[0.16em] text-[var(--brand-gold)]"
                      >
                        {item.code}
                      </span>
                      <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                        {STATUS_LABELS_AR[item.status] || "متاح"}
                      </span>
                    </div>
                    <Link
                      href={`/dress/${item.code}`}
                      onClick={() => setDrawerOpen(false)}
                      className="mt-0.5 block truncate text-sm font-bold text-[var(--text-strong)] hover:text-[var(--brand-gold)]"
                    >
                      {item.nameAr}
                    </Link>
                    <p className="text-[11px] text-[var(--text-muted)]">{item.occasionLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.code)}
                    aria-label={`إزالة ${item.nameAr}`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-2xl border border-transparent text-[var(--text-muted)] transition-colors hover:border-[var(--border-subtle)] hover:text-[var(--text-strong)]"
                  >
                    <Trash2 className="size-4" strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="space-y-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <Link
              href={`/booking?dresses=${encodeURIComponent(firstCodes)}`}
              onClick={() => setDrawerOpen(false)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-gold)] px-4 text-sm font-semibold text-[#FAF7F2] transition-colors hover:bg-[var(--brand-gold-hover)]"
            >
              <CalendarCheck className="size-4" strokeWidth={1.5} />
              <span>احجزي موعد بروفة ({items.length})</span>
            </Link>
            <button
              type="button"
              onClick={clear}
              className="w-full py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-strong)]"
            >
              تفريغ القائمة
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
