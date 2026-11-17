import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicDB } from "@/lib/db";
import { DressDetailClient } from "@/components/DressDetailClient";

export const dynamic = "force-dynamic";

const DEDICATED_OG_CODES = new Set([
  "rd-01",
  "rd-02",
  "rd-03",
  "rd-04",
  "rd-05",
  "rd-06",
  "rd-07",
  "rd-08",
]);

function resolveDressOgImage(code: string, firstShotSrc?: string): string {
  const codeSlug = code.toLowerCase().trim();
  if (DEDICATED_OG_CODES.has(codeSlug)) {
    return `/images/og/${codeSlug}.jpg`;
  }
  if (firstShotSrc && /\.(jpe?g|png)$/i.test(firstShotSrc)) {
    return firstShotSrc;
  }
  return "/og-cover.jpg";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const { dresses } = await publicDB();
  const dress = dresses.find((d) => d.code.toLowerCase() === decodeURIComponent(code).toLowerCase());
  if (!dress) return { title: "الفستان غير موجود" };

  const ogImg = resolveDressOgImage(dress.code, dress.shots[0]?.src);
  const fullTitle = `${dress.nameAr} (${dress.code}) | Rony Dress — أتيليه فستان ست البنات`;

  return {
    title: `${dress.nameAr} (${dress.code})`,
    description: dress.storyAr,
    openGraph: {
      title: fullTitle,
      description: dress.storyAr,
      url: `https://ronydress.chameleon.vision/dress/${dress.code}`,
      siteName: "Rony Dress",
      locale: "ar_EG",
      type: "website",
      images: [
        {
          url: ogImg,
          width: 1200,
          height: 630,
          type: "image/jpeg",
          alt: `${dress.nameAr} — Rony Dress`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: dress.storyAr,
      images: [ogImg],
    },
  };
}

export default async function DressDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const { dresses, settings } = await publicDB();
  const dress = dresses.find((d) => d.code.toLowerCase() === decodeURIComponent(code).toLowerCase());

  if (!dress) notFound();

  const similarDresses = dresses
    .filter((d) => d.code !== dress.code && d.occasions.some((o) => dress.occasions.includes(o)))
    .slice(0, 4);

  return (
    <DressDetailClient
      dress={dress}
      settings={settings}
      similarDresses={similarDresses}
    />
  );
}
