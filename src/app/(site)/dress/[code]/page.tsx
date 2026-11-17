import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicDB } from "@/lib/db";
import { DressDetailClient } from "@/components/DressDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const { dresses } = await publicDB();
  const dress = dresses.find((d) => d.code.toLowerCase() === decodeURIComponent(code).toLowerCase());
  if (!dress) return { title: "الفستان غير موجود" };
  return {
    title: `${dress.nameAr} (${dress.code})`,
    description: dress.storyAr,
    openGraph: {
      images: dress.shots[0]?.src ? [{ url: dress.shots[0].src }] : undefined,
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
