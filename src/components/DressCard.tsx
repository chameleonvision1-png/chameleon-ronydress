"use client";

import * as React from "react";
import Link from "next/link";
import { ViewTransition } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import type { Dress } from "@/lib/types";
import { OCCASION_LABELS_AR, STATUS_LABELS_AR } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/utils";
import { useShortlist } from "./ShortlistProvider";

export function DressCard({ dress }: { dress: Dress }) {
  const { hasItem, toggleItem } = useShortlist();
  const front = dress.shots.find((s) => s.angle === "front") || dress.shots[0];
  const back =
    dress.shots.find((s) => s.angle === "back") ||
    dress.shots.find((s) => s.angle === "three-quarter");
  const saved = hasItem(dress.code);

  return (
    <article className="group flex flex-col">
      {/* 3:4 Frameless Couture Studio Portrait (Matches MO WORLD ProductCard Architecture) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-stage)] transition-colors group-hover:border-[var(--brand-gold)]/70">
        <Link href={`/dress/${dress.code}`} className="block h-full w-full p-2.5 sm:p-3.5">
          <ViewTransition name={`dress-${dress.code}`} share="morph" default="none">
            <div className="relative h-full w-full">
              {/* Grounded elliptical floor shadow under cutout gown */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-1 left-1/2 h-4 w-[62%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(18,14,16,0.32)_0%,transparent_72%)]"
              />
              {front && (
                <img
                  src={front.src}
                  alt={dress.nameAr}
                  loading="lazy"
                  className={`h-full w-full object-contain transition-opacity duration-300 ${
                    back ? "group-hover:opacity-0" : ""
                  }`}
                />
              )}
              {back && (
                <img
                  src={back.src}
                  alt={`${dress.nameAr} — الظهر`}
                  loading="lazy"
                  className="pointer-events-none absolute inset-0 h-full w-full object-contain p-2.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:p-3.5"
                />
              )}
            </div>
          </ViewTransition>
        </Link>

        {/* Minimal Editorial Top Badges */}
        <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-1.5">
          <span className="rounded-[3px] border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 px-2 py-0.5 text-[9.5px] font-semibold text-[var(--text-primary)]">
            {STATUS_LABELS_AR[dress.status] || "متاح للإيجار"}
          </span>
          <span
            dir="ltr"
            className="rounded-[3px] border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 px-1.5 py-0.5 font-en text-[9px] font-bold tracking-[0.16em] text-[var(--brand-gold)]"
          >
            {dress.code}
          </span>
        </div>

        {/* Bottom Quick Action Bar Inside Frame */}
        <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1.5">
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
            aria-label={saved ? "إزالة من اختياراتي" : "حفظ للبروفة"}
            className={`flex size-7.5 items-center justify-center rounded-[3px] border backdrop-blur-xs transition-colors ${
              saved
                ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[#FAF7F2]"
                : "border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 text-[var(--text-primary)] hover:border-[var(--brand-gold)]"
            }`}
          >
            <Heart className={`size-3.5 ${saved ? "fill-current" : ""}`} strokeWidth={1.5} />
          </button>

          <Link
            href={`/dress/${dress.code}`}
            className="inline-flex h-7.5 items-center gap-1 rounded-[3px] border border-[var(--border-subtle)] bg-[var(--bg-primary)]/92 px-2.5 text-[10px] font-semibold text-[var(--text-strong)] backdrop-blur-xs transition-colors hover:border-[var(--brand-gold)] hover:bg-[var(--brand-gold)] hover:text-[#FAF7F2]"
          >
            <span>٣٦٠° والتفاصيل</span>
            <ArrowLeft className="size-3" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* Clean Architectural Caption Underneath */}
      <div className="mt-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/dress/${dress.code}`}>
            <h3 className="truncate text-xs font-bold text-[var(--text-strong)] transition-colors group-hover:text-[var(--brand-gold)] sm:text-sm">
              {dress.nameAr}
            </h3>
          </Link>
          <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">
            {dress.occasions.map((o) => OCCASION_LABELS_AR[o]).slice(0, 2).join(" · ")}
            {" — "}
            {dress.showPrice && dress.rentPrice
              ? formatPrice(dress.rentPrice)
              : "إيجار وتفصيل"}
          </p>
        </div>

        <div className="mt-1 flex shrink-0 items-center gap-1">
          {dress.colors.slice(0, 2).map((c) => (
            <span
              key={c.nameAr}
              title={c.nameAr}
              style={{ backgroundColor: c.hex }}
              className="size-3 rounded-full border border-[var(--border-subtle)]"
            />
          ))}
        </div>
      </div>
    </article>
  );
}
