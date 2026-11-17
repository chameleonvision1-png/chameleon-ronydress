"use client";

import * as React from "react";
import Link from "next/link";
import { ViewTransition } from "react";
import { Eye, Heart } from "lucide-react";
import type { Dress } from "@/lib/types";
import { OCCASION_LABELS_AR, STATUS_LABELS_AR } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/utils";
import { useShortlist } from "./ShortlistProvider";

export function DressCard({ dress }: { dress: Dress }) {
  const { hasItem, toggleItem } = useShortlist();
  const [hovered, setHovered] = React.useState(false);

  const front = dress.shots.find((s) => s.angle === "front") || dress.shots[0];
  const alt = dress.shots.find((s) => s.angle === "three-quarter") || dress.shots[1];
  const saved = hasItem(dress.code);

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] transition hover:border-[var(--brand-gold)]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#F7F1E8]">
        <Link href={`/dress/${dress.code}`} className="block h-full w-full">
          <ViewTransition name={`dress-${dress.code}`} share="morph" default="none">
            <div className="relative h-full w-full">
              {front && (
                <img
                  src={front.src}
                  alt={dress.nameAr}
                  className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                />
              )}
              {alt && hovered && (
                <img
                  src={alt.src}
                  alt={`${dress.nameAr} — زاوية أخرى`}
                  className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-300"
                />
              )}
            </div>
          </ViewTransition>
        </Link>

        <span className="pointer-events-none absolute top-2.5 right-2.5 rounded bg-[#171317]/80 px-2 py-0.5 font-en text-[10px] font-semibold tracking-wider text-[#FFF9F2]">
          {dress.code}
        </span>

        <button
          type="button"
          onClick={() =>
            toggleItem({
              code: dress.code,
              nameAr: dress.nameAr,
              nameEn: dress.nameEn,
              image: front?.src || "",
              status: dress.status,
              occasionLabel: OCCASION_LABELS_AR[dress.occasions[0]] || "مناسبات",
            })
          }
          aria-label={saved ? "إزالة من اختياراتي" : "حفظ في اختياراتي"}
          className={`absolute top-2.5 left-2.5 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-xs transition ${
            saved
              ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#FFF9F2]"
              : "border-[#3A2930]/15 bg-[#FFF9F2]/88 text-[#3A2930] hover:border-[var(--brand-gold)]"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
        </button>

        <span className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-full bg-[#FFF9F2]/92 px-2.5 py-0.5 text-[10px] font-semibold text-[#3A2930]">
          {STATUS_LABELS_AR[dress.status] || "متاح"}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between p-3.5">
        <div>
          <p className="text-[11px] font-medium text-[var(--brand-gold)]">
            {dress.occasions.map((o) => OCCASION_LABELS_AR[o]).slice(0, 2).join(" • ")}
          </p>
          <Link href={`/dress/${dress.code}`}>
            <h3 className="mt-1 line-clamp-1 text-sm font-bold text-[var(--text-strong)] group-hover:text-[var(--brand-gold)]">
              {dress.nameAr}
            </h3>
          </Link>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {dress.showPrice && dress.rentPrice
              ? `الإيجار: ${formatPrice(dress.rentPrice)}`
              : "اسألي عن التوفر وسعر الإيجار / التفصيل"}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3">
          <div className="flex items-center gap-1">
            {dress.colors.slice(0, 3).map((c) => (
              <span
                key={c.nameAr}
                title={c.nameAr}
                style={{ backgroundColor: c.hex }}
                className="h-3.5 w-3.5 rounded-full border border-[var(--border-subtle)]"
              />
            ))}
          </div>
          <Link
            href={`/dress/${dress.code}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-gold)] hover:underline"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>استعرضي ٣٦٠°</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
