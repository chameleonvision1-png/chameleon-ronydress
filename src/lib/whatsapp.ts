import type { Appointment, RentalRequest } from "./types";

export const OCCASION_LABELS_AR: Record<string, string> = {
  engagement: "خطوبة",
  soiree: "سواريه ومناسبات",
  "katb-ketab": "كتب كتاب",
  bridal: "زفاف وعروس",
  handmade: "هاند ميد خاص",
};

export const STATUS_LABELS_AR: Record<string, string> = {
  available: "متاح للإيجار",
  reserved: "محجوز حالياً",
  bookable: "متاح للحجز",
  sale: "متاح للبيع",
  tailor: "متاح للتفصيل",
  unavailable: "غير متاح حالياً",
};

export function buildRentalWhatsAppUrl(
  whatsappNumber: string,
  req: RentalRequest,
  originUrl?: string,
): string {
  const cleanPhone = whatsappNumber.replace(/[^\d]/g, "");
  if (!cleanPhone) return "";
  const typeLabel = req.requestType === "tailor" ? "طلب تفصيل تصميم مماثل" : "طلب حجز إيجار فستان";
  const lines = [
    `Rony Dress — أتيليه فستان ست البنات`,
    `${typeLabel} (#${req.id.slice(-6).toUpperCase()})`,
    "────────────────────",
    `الكود: ${req.dressCode} — ${req.dressNameAr}`,
    `الاسم: ${req.customerName}`,
    `الموبايل: ${req.customerPhone}`,
    `تاريخ المناسبة: ${req.eventDate}`,
    req.requestType === "rent" ? `فترة الإيجار المقترحة: ${req.pickupDate} إلى ${req.returnDate}` : "",
    req.sizeLabel ? `المقاس المطلوب: ${req.sizeLabel}` : "",
    req.colorNameAr ? `اللون المطلوب: ${req.colorNameAr}` : "",
    req.notes ? `ملاحظات: ${req.notes}` : "",
    originUrl ? `رابط متابعة الطلب: ${originUrl}/request/${req.id}` : "",
  ].filter(Boolean);

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function buildAppointmentWhatsAppUrl(
  whatsappNumber: string,
  apt: Appointment,
  originUrl?: string,
): string {
  const cleanPhone = whatsappNumber.replace(/[^\d]/g, "");
  if (!cleanPhone) return "";
  const lines = [
    `Rony Dress — أتيليه فستان ست البنات`,
    `حجز موعد زيارة وبروفة (#${apt.id.slice(-6).toUpperCase()})`,
    "────────────────────",
    `الاسم: ${apt.name}`,
    `الموبايل: ${apt.phone}`,
    `نوع المناسبة: ${OCCASION_LABELS_AR[apt.occasion] || apt.occasion}`,
    `تاريخ المناسبة: ${apt.eventDate}`,
    apt.dressCode ? `كود الفستان المختار: ${apt.dressCode}` : "",
    apt.dressType ? `نوع الفستان المطلوب: ${apt.dressType}` : "",
    apt.preferredColor ? `اللون المفضل: ${apt.preferredColor}` : "",
    apt.approxSize ? `المقاس التقريبي: ${apt.approxSize}` : "",
    `تاريخ الزيارة: ${apt.visitDate} | الساعة: ${apt.visitTime}`,
    apt.notes ? `ملاحظات: ${apt.notes}` : "",
    originUrl ? `رابط متابعة الحجز: ${originUrl}/request/${apt.id}` : "",
  ].filter(Boolean);

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function buildDirectWhatsAppUrl(whatsappNumber: string, message: string): string {
  const cleanPhone = whatsappNumber.replace(/[^\d]/g, "");
  if (!cleanPhone) return "";
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
