"use client";

import * as React from "react";
import Link from "next/link";
import { Instagram, MapPin, QrCode, Share2 } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { QrModal } from "./QrModal";
import type { AtelierSettings } from "@/lib/types";

export function Footer({
  settings,
}: {
  settings: Omit<AtelierSettings, "adminPassword" | "adminUsername">;
}) {
  const [qrOpen, setQrOpen] = React.useState(false);

  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[#171317] text-[#FFF9F2]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 md:grid-cols-4 md:px-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <BrandLogo variant="full" tone="gold" className="h-16" />
            <div>
              <p className="font-editorial text-xl font-semibold text-[#FFF9F2]">
                Rony Dress
              </p>
              <p className="text-xs text-[#D7B98E]">{settings.storeNameAr}</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-[#CBBAB1]">
            فساتين خطوبة وسواريه وكتب كتاب وزفاف وتصميمات هاند ميد متاحة للإيجار والتفصيل وحجز البروفة بعناية في كفر الزيات.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded border border-[#B89040]/45 bg-[#2A2127] px-3 py-1.5 text-xs font-medium text-[#FFF9F2] hover:border-[#B89040]"
            >
              <Instagram className="h-3.5 w-3.5 text-[#B89040]" />
              <span className="font-en" dir="ltr">{settings.instagramHandle}</span>
            </a>
            <a
              href={settings.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded border border-[#B89040]/45 bg-[#2A2127] px-3 py-1.5 text-xs font-medium text-[#FFF9F2] hover:border-[#B89040]"
            >
              <Share2 className="h-3.5 w-3.5 text-[#B89040]" />
              <span>صفحة فيسبوك</span>
            </a>
            <button
              type="button"
              onClick={() => setQrOpen(true)}
              className="inline-flex items-center gap-1.5 rounded border border-[#B89040]/45 bg-[#2A2127] px-3 py-1.5 text-xs font-medium text-[#FFF9F2] hover:border-[#B89040]"
            >
              <QrCode className="h-3.5 w-3.5 text-[#B89040]" />
              <span>QR</span>
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold tracking-wider text-[#D7B98E]">الأتيليه والكتالوج</h3>
          <ul className="mt-4 space-y-2.5 text-xs text-[#CBBAB1]">
            <li><Link href="/collection" className="hover:text-[#FFF9F2]">جميع الفساتين</Link></li>
            <li><Link href="/collection?occasion=engagement" className="hover:text-[#FFF9F2]">فساتين خطوبة</Link></li>
            <li><Link href="/collection?occasion=soiree" className="hover:text-[#FFF9F2]">فساتين سواريه</Link></li>
            <li><Link href="/collection?occasion=katb-ketab" className="hover:text-[#FFF9F2]">فساتين كتب كتاب</Link></li>
            <li><Link href="/collection?occasion=bridal" className="hover:text-[#FFF9F2]">فساتين عروس وزفاف</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold tracking-wider text-[#D7B98E]">الخدمات والسياسات</h3>
          <ul className="mt-4 space-y-2.5 text-xs text-[#CBBAB1]">
            <li><Link href="/rental" className="hover:text-[#FFF9F2]">نظام وشروط الإيجار</Link></li>
            <li><Link href="/tailoring" className="hover:text-[#FFF9F2]">التفصيل والتنفيذ الهاند ميد</Link></li>
            <li><Link href="/booking" className="hover:text-[#FFF9F2]">حجز موعد تجربة وبروفة</Link></li>
            <li><Link href="/links" className="hover:text-[#FFF9F2]">روابط الأتيليه الرسمية</Link></li>
            <li><Link href="/admin" className="hover:text-[#FFF9F2]">إدارة الأتيليه</Link></li>
          </ul>
        </div>

        <div className="space-y-3 text-xs text-[#CBBAB1]">
          <h3 className="text-xs font-bold tracking-wider text-[#D7B98E]">العنوان والمواعيد</h3>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#B89040]" />
            <span>{settings.addressAr}</span>
          </div>
          <p>{settings.workingHoursAr}</p>
          {settings.phone && (
            <p className="font-semibold text-[#FFF9F2]" dir="ltr">
              {settings.phone}
            </p>
          )}
          <Link
            href="/contact"
            className="inline-block rounded border border-[#B89040] px-4 py-2 text-xs font-semibold text-[#FFF9F2] transition hover:bg-[#B89040]"
          >
            بيانات العنوان والتواصل
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-[11px] text-[#CBBAB1] sm:flex-row md:px-8">
          <p>© {new Date().getFullYear()} Rony Dress — أتيليه فستان ست البنات. جميع الحقوق محفوظة.</p>
          <a
            href="https://chameleon.vision"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 transition hover:border-[#B89040]"
          >
            <img
              src="/chameleon-logo.webp"
              alt="Chameleon Vision"
              className="h-4 w-4 rounded-full object-contain"
            />
            <span className="font-en text-[10px] tracking-wider text-[#FFF9F2]">
              Crafted by Chameleon Vision
            </span>
          </a>
        </div>
      </div>

      <QrModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        url="https://ronydress.chameleon.vision/links"
      />
    </footer>
  );
}
