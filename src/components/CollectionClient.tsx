"use client";

import * as React from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { AtelierCategory, Dress, Occasion } from "@/lib/types";
import { STATUS_LABELS_AR } from "@/lib/whatsapp";
import { DressCard } from "./DressCard";

const SHORT_OCCASIONS: Array<{ slug: string; labelAr: string }> = [
  { slug: "all", labelAr: "الكل" },
  { slug: "engagement", labelAr: "خطوبة" },
  { slug: "soiree", labelAr: "سواريه" },
  { slug: "katb-ketab", labelAr: "كتب كتاب" },
  { slug: "bridal", labelAr: "زفاف" },
  { slug: "handmade", labelAr: "هاند ميد" },
];

export function CollectionClient({
  dresses,
  initialOccasion,
}: {
  dresses: Dress[];
  categories?: AtelierCategory[];
  initialOccasion?: string;
}) {
  const [occasion, setOccasion] = React.useState<string>(initialOccasion || "all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [modeFilter, setModeFilter] = React.useState<string>("all");
  const [sizeFilter, setSizeFilter] = React.useState<string>("all");
  const [query, setQuery] = React.useState("");

  const allSizes = React.useMemo(() => {
    const s = new Set<string>();
    dresses.forEach((d) => d.sizes.forEach((sz) => s.add(sz)));
    return Array.from(s).sort();
  }, [dresses]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return dresses.filter((d) => {
      if (occasion !== "all" && !d.occasions.includes(occasion as Occasion)) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (modeFilter === "rent" && !d.modes.rent) return false;
      if (modeFilter === "tailor" && !d.modes.tailor) return false;
      if (sizeFilter !== "all" && !d.sizes.includes(sizeFilter)) return false;
      if (
        q &&
        !d.nameAr.toLowerCase().includes(q) &&
        !d.nameEn.toLowerCase().includes(q) &&
        !d.code.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [dresses, occasion, statusFilter, modeFilter, sizeFilter, query]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      <div className="text-center sm:text-right">
        <p dir="ltr" className="micro-label text-[var(--brand-gold)]">
          ATELIER ARCHIVE
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--text-strong)] md:text-3xl">
          كتالوج فساتين Rony Dress
        </h1>
      </div>

      {/* Soft Couture Filters Card */}
      <div className="mt-5 space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        {/* Symmetric 3x2 Capsule Grid on Mobile, Flex Row on Desktop */}
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
          {SHORT_OCCASIONS.map((item) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => setOccasion(item.slug)}
              className={`h-9 rounded-full border px-3.5 text-xs font-semibold whitespace-nowrap transition-colors sm:px-5 ${
                occasion === item.slug
                  ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#F7F6F3]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-strong)] hover:border-[var(--brand-gold)]"
              }`}
            >
              {item.labelAr}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--text-muted)]"
              strokeWidth={1.5}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحثي بالاسم أو الكود..."
              className="h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] pr-9 pl-3 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal
              className="size-4 shrink-0 text-[var(--brand-gold)]"
              strokeWidth={1.5}
            />
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              aria-label="تصفية حسب الخدمة"
              className="h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
            >
              <option value="all">كل الخدمات (إيجار / تفصيل)</option>
              <option value="rent">متاح للإيجار</option>
              <option value="tailor">متاح للتفصيل</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="تصفية حسب الحالة"
            className="h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
          >
            <option value="all">جميع الحالات</option>
            {Object.entries(STATUS_LABELS_AR).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            aria-label="تصفية حسب المقاس"
            className="h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
          >
            <option value="all">كل المقاسات</option>
            {allSizes.map((sz) => (
              <option key={sz} value={sz}>
                مقاس {sz}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-14 text-center">
          <p className="text-sm font-bold text-[var(--text-strong)]">
            لم يتم العثور على فساتين مطابقة
          </p>
          <button
            type="button"
            onClick={() => {
              setOccasion("all");
              setStatusFilter("all");
              setModeFilter("all");
              setSizeFilter("all");
              setQuery("");
            }}
            className="mt-4 h-10 rounded-full bg-[var(--brand-gold)] px-6 text-xs font-semibold text-[#F7F6F3]"
          >
            عرض جميع الفساتين
          </button>
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-2 gap-x-3.5 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8 lg:grid-cols-4">
          {filtered.map((dress) => (
            <DressCard key={dress.code} dress={dress} />
          ))}
        </div>
      )}
    </div>
  );
}
