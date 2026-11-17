import { publicDB } from "@/lib/db";
import { HomeClientSections } from "@/components/HomeClientSections";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { settings, categories, dresses } = await publicDB();

  return <HomeClientSections settings={settings} categories={categories} dresses={dresses} />;
}
