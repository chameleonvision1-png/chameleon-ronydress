"use client";

import * as React from "react";
import Link from "next/link";
import { ViewTransition } from "react";
import { Heart } from "lucide-react";
import type { Dress } from "@/lib/types";
import { OCCASION_LABELS_AR, STATUS_LABELS_AR } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/utils";
import { useShortlist } from "./ShortlistProvider";

export function DressCard({ dress }: { dress: Dress }) {
  const { hasItem, toggleItem } = useShortlist();
  const front = dress.shots.find((s) => s.angle === "front") ?? dress.shots[0];
  const back =
    dress.shots.find((s) => s.angle === "back") ??
    dress.shots.find((s) => s.angle === "three-quarter");
  const saved = hasItem(dress.code);

  return (
    <article className="group flex flex-col">
      {/* Soft Rounded-2xl Couture Studio Frame */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-colors group-hover:border-[var(--brand-gold)]/65">
        <Link href={`/dress/${dress.code}`} className="block size-full p-2.5 sm:p-3.5">
          <ViewTransition name={`dress-${dress.code}`} share="morph" default="none">
            <div className="relative size-full">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-1 left-1/2 h-4 w-[56%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(11,9,12,0.24)_0%,transparent_72%)]"
              />
              {front && (
                <img
                  src={front.src}
                  alt={dress.nameAr}
                  loading="lazy"
                  className={`size-full object-contain transition-opacity duration-300 ${
                    back ? "group-hover:opacity-0" : ""
                  }`}
                />
              )}
              {back && (
                <img
                  src={back.src}
                  alt={`${dress.nameAr} — الظهر`}
                  loading="lazy"
                  className="pointer-events-none absolute inset-0 size-full object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
              )}
            </div>
          </ViewTransition>
        </Link>

        {/* Delicate Soft Capsule Top Badges */}
        <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-1.5">
          <span className="rounded-full border border-[var(--border-subtle)]/80 bg-[var(--bg-primary)]/90 px-2.5 py-0.5 text-[9.5px] font-semibold text-[var(--text-primary)] backdrop-blur-xs">
            {STATUS_LABELS_AR[dress.status] ?? "متاح للإيجار"}
          </span>
          <span
            dir="ltr"
            className="hidden rounded-full border border-[var(--border-subtle)]/80 bg-[var(--bg-primary)]/88 px-2 py-0.5 font-en text-[9px] font-medium tracking-wider text-[var(--text-muted)] sm:inline-block"
          >
            {dress.code}
          </span>
        </div>

        {/* Soft Circular Shortlist Button */}
        <div className="absolute bottom-2.5 right-2.5 z-10">
          <button
            type="button"
            onClick={() =>
              toggleItem({
                code: dress.code,
                nameAr: dress.nameAr,
                nameEn: dress.nameEn,
                image: front?.src ?? "",
                status: dress.status,
                occasionLabel: OCCASION_LABELS_AR[dress.occasions[0]] ?? "مناسبات",
              })
            }
            aria-label={saved ? "إزالة من اختياراتي" : "حفظ للبروفة"}
            className={`inline-flex size-8.5 items-center justify-center rounded-full border backdrop-blur-xs transition-colors ${
              saved
                ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#F7F6F3]"
                : "border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 text-[var(--text-primary)] hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]"
            }`}
          >
            <Heart className={`size-3.5 ${saved ? "fill-current" : ""}`} strokeWidth={1.6} />
          </button>
        </div>
      </div>

      {/* Full-Width Un-Chopped Title + Symmetric Sub-Row */}
      <div className="mt-2.5 flex flex-col gap-0.5 px-0.5">
        <Link
          href={`/dress/${dress.code}`}
          className="text-right text-xs font-bold text-[var(--text-strong)] transition-colors hover:text-[var(--brand-gold)] sm:text-[13.5px]"
        >
          <span className="line-clamp-1">{dress.nameAr}</span>
        </Link>

        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] text-[var(--text-muted)]">
            {dress.showPrice && dress.rentPrice
              ? formatPrice(dress.rentPrice)
              : OCCASION_LABELS_AR[dress.occasions[0]] ?? "إيجار وتفصيل"}
          </span>

          <div className="flex shrink-0 items-center gap-1">
            {dress.colors.slice(0, 2).map((c) => (
              <span
                key={c.nameAr}
                title={c.nameAr}
                style={{ backgroundColor: c.hex }}
                className="size-2.5 rounded-full border border-black/20"
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
