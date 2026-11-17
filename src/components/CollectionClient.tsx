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
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <p className="micro-label text-[var(--brand-gold)]">ATELIER RONY DRESS CATALOG</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--text-strong)] md:text-4xl">
          كولكشن فساتين أتيليه فستان ست البنات
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
          تصفحي الفساتين حسب المناسبة، المقاس، أو الخدمة المتاحة. اضغطي على أي فستان لفتحه وتدويره ومراجعة تفاصيله وحجزه.
        </p>
      </div>

      {/* Filters Toolbar */}
      <div className="mt-6 space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOccasion("all")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              occasion === "all"
                ? "bg-[var(--brand-gold)] text-[#FFF9F2]"
                : "border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-strong)] hover:border-[var(--brand-gold)]"
            }`}
          >
            الكل ({dresses.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setOccasion(cat.slug)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                occasion === cat.slug
                  ? "bg-[var(--brand-gold)] text-[#FFF9F2]"
                  : "border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-strong)] hover:border-[var(--brand-gold)]"
              }`}
            >
              {cat.nameAr}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحثي بالاسم أو الكود (مثل RD-01)..."
              className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] py-2 pr-9 pl-3 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-[var(--brand-gold)]" />
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              aria-label="تصفية حسب الخدمة"
              className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
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
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
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
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-strong)] outline-none focus:border-[var(--brand-gold)]"
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
        <div className="mt-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-16 text-center">
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
            className="mt-4 rounded bg-[var(--brand-gold)] px-5 py-2 text-xs font-semibold text-[#FFF9F2]"
          >
            عرض جميع الفساتين
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 md:gap-6">
          {filtered.map((dress) => (
            <DressCard key={dress.code} dress={dress} />
          ))}
        </div>
      )}
    </div>
  );
}
