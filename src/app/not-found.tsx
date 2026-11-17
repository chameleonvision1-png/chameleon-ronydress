import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <BrandLogo variant="monogram" className="h-20" />
      <p className="mt-4 font-en text-xs font-bold tracking-widest text-[var(--brand-gold)]">404</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--text-strong)]">
        الصفحة المطلوبة غير موجودة
      </h1>
      <p className="mt-2 max-w-md text-sm text-[var(--text-muted)]">
        قد يكون كود الفستان غير مكتمل أو تم نقل الصفحة. يمكنك استعراض الكولكشن الكامل أو العودة للرئيسية.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded bg-[var(--brand-gold)] px-5 py-2.5 text-xs font-bold text-[#FFF9F2]"
        >
          الصفحة الرئيسية
        </Link>
        <Link
          href="/collection"
          className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-2.5 text-xs font-bold text-[var(--text-strong)]"
        >
          تصفحي الكولكشن
        </Link>
      </div>
    </div>
  );
}
