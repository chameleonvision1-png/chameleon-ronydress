"use client";

import * as React from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { AtelierCategory, Dress, Occasion } from "@/lib/types";
import { STATUS_LABELS_AR } from "@/lib/whatsapp";
import { DressCard } from "./DressCard";

export function CollectionClient({
  dresses,
  categories,
  initialOccasion,
}: {
  dresses: Dress[];
  categories: AtelierCategory[];
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
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <p dir="ltr" className="micro-label text-[var(--brand-gold)]">
          RONY DRESS // ATELIER ARCHIVE
        </p>
        <h1 className="mt-1.5 text-2xl font-bold text-[var(--text-strong)] md:text-4xl">
          كولكشن فساتين أتيليه فستان ست البنات
        </h1>
        <p className="mt-2 max-w-2xl text-xs text-[var(--text-muted)] sm:text-sm">
          تصفحي الفساتين حسب المناسبة، المقاس، أو الخدمة المتاحة. افتحي أي فستان لاستعراضه ٣٦٠° على المنصة الدوارة والتحقق من توفر تاريخك.
        </p>
      </div>

      {/* Couture Filters Toolbar */}
      <div className="mt-6 space-y-3.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOccasion("all")}
            className={`h-9 rounded-[4px] border px-3.5 text-xs font-semibold transition-colors ${
              occasion === "all"
                ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#FAF7F2]"
                : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-strong)] hover:border-[var(--brand-gold)]"
            }`}
          >
            الكل ({dresses.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setOccasion(cat.slug)}
              className={`h-9 rounded-[4px] border px-3.5 text-xs font-semibold transition-colors ${
                occasion === cat.slug
                  ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#FAF7F2]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-strong)] hover:border-[var(--brand-gold)]"
              }`}
            >
              {cat.nameAr}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[var(--text-muted)]"
              strokeWidth={1.5}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحثي بالاسم أو الكود (RD-01)..."
              className="h-10 w-full rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] pr-9 pl-3 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
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
              className="h-10 w-full rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
            >
              <option value="all">كل الخدمات (إيجار / تفصيل)</option>
              <option value="rent">متاح للإيجار</option>
              <option value="tailor">متاح للتفصيل والطلب</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="تصفية حسب الحالة"
            className="h-10 w-full rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
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
            className="h-10 w-full rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
          >
            <option value="all">كل المقاسات المتاحة</option>
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
        <div className="mt-10 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-16 text-center">
          <p className="text-base font-bold text-[var(--text-strong)]">
            لم يتم العثور على فساتين مطابقة لهذا البحث
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
            className="mt-4 h-10 rounded-[4px] bg-[var(--brand-gold)] px-5 text-xs font-semibold text-[#FAF7F2]"
          >
            عرض جميع الفساتين
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 md:gap-5">
          {filtered.map((dress) => (
            <DressCard key={dress.code} dress={dress} />
          ))}
        </div>
      )}
    </div>
  );
}
