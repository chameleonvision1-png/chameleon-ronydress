export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(" ");
}

export function formatPrice(amount?: number | null): string {
  if (!amount || amount <= 0) return "اسألي عن السعر";
  return `${Math.round(amount).toLocaleString("en-US")} ج.م`;
}

export function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}

export function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + days));
  return dt.toISOString().slice(0, 10);
}

export function formatDateAr(isoDate?: string): string {
  if (!isoDate) return "";
  try {
    const dt = new Date(`${isoDate}T00:00:00Z`);
    return dt.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return isoDate;
  }
}
