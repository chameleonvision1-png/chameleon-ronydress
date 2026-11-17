"use client";

import * as React from "react";
import { Check, Copy, Download, X } from "lucide-react";
import { generateQrMatrix } from "@/lib/qrcode";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

interface QrModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

export function QrModal({
  open,
  onClose,
  url,
  title = "رمز QR الرسمي — Rony Dress",
}: QrModalProps) {
  useLockBodyScroll(open);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const matrix = React.useMemo(() => generateQrMatrix(url, "Q"), [url]);

  if (!open) return null;

  const size = matrix.length;
  const qrSize = 260;
  const pad = 16;
  const cell = (qrSize - pad * 2) / size;
  const clearModules = Math.floor(size * 0.24);
  const centerStart = Math.floor((size - clearModules) / 2);
  const centerEnd = centerStart + clearModules;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleDownload = () => {
    const canvas = document.createElement("canvas");
    const dim = 720;
    canvas.width = dim;
    canvas.height = dim;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#FFF9F2";
    ctx.fillRect(0, 0, dim, dim);

    const cPad = 60;
    const cCell = (dim - cPad * 2) / size;
    ctx.fillStyle = "#3A2930";
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (r >= centerStart && r < centerEnd && c >= centerStart && c < centerEnd) continue;
        if (matrix[r][c]) {
          ctx.fillRect(cPad + c * cCell, cPad + r * cCell, Math.ceil(cCell), Math.ceil(cCell));
        }
      }
    }

    const boxSize = clearModules * cCell * 0.94;
    const bx = (dim - boxSize) / 2;
    ctx.fillStyle = "#FFF9F2";
    ctx.fillRect(bx, bx, boxSize, boxSize);
    ctx.strokeStyle = "#B89040";
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, bx, boxSize, boxSize);

    const img = new window.Image();
    img.onload = () => {
      const logoDim = boxSize * 0.78;
      ctx.drawImage(img, (dim - logoDim) / 2, (dim - logoDim) / 2, logoDim, logoDim);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "ronydress-qr.png";
      a.click();
    };
    img.src = "/logo-monogram.webp";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="relative w-full max-w-sm rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-modal-scroll
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute top-3 left-3 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--brand-gold)]"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="micro-label text-[var(--brand-gold)]">RONY DRESS LINK HUB</p>
        <h3 className="mt-1 text-lg font-bold text-[var(--text-strong)]">{title}</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          امسحي الكود لفتح كتالوج الفساتين وحجز المواعيد مباشرة
        </p>

        <div className="mx-auto mt-5 inline-block rounded border border-[var(--brand-gold)]/40 bg-[#FFF9F2] p-3">
          <div className="relative h-[260px] w-[260px]">
            <svg viewBox={`0 0 ${qrSize} ${qrSize}`} className="h-full w-full">
              <rect width={qrSize} height={qrSize} fill="#FFF9F2" />
              {matrix.map((row, r) =>
                row.map((dark, c) => {
                  if (!dark) return null;
                  if (r >= centerStart && r < centerEnd && c >= centerStart && c < centerEnd) {
                    return null;
                  }
                  return (
                    <rect
                      key={`${r}-${c}`}
                      x={pad + c * cell}
                      y={pad + r * cell}
                      width={cell + 0.15}
                      height={cell + 0.15}
                      fill="#3A2930"
                    />
                  );
                }),
              )}
            </svg>
            <div className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded border border-[var(--brand-gold)] bg-[#FFF9F2] p-1.5 shadow-sm">
              <img
                src="/logo-monogram.webp"
                alt="Rony Dress"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>

        <p className="mt-3 truncate text-xs text-[var(--text-muted)] font-en" dir="ltr">
          {url}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5 text-xs font-semibold text-[var(--text-strong)] hover:border-[var(--brand-gold)]"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[var(--brand-gold)]" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "تم النسخ" : "نسخ الرابط"}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-1.5 rounded bg-[var(--brand-gold)] px-3 py-2.5 text-xs font-semibold text-[#FFF9F2] hover:bg-[var(--brand-gold-hover)]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>تحميل QR</span>
          </button>
        </div>
      </div>
    </div>
  );
}
