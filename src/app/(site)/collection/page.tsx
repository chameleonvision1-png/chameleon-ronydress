import type { Metadata } from "next";
import { publicDB } from "@/lib/db";
import { CollectionClient } from "@/components/CollectionClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "كولكشن الفساتين",
  description: "تصفحي جميع فساتين الخطوبة والسواريه وكتب الكتاب والزفاف والتصميمات الهاند ميد المتاحة للإيجار والتفصيل.",
};

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ occasion?: string }>;
}) {
  const sp = await searchParams;
  const { dresses, categories } = await publicDB();

  return (
    <CollectionClient
      dresses={dresses}
      categories={categories}
      initialOccasion={sp.occasion}
    />
  );
}
