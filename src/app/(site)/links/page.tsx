import type { Metadata } from "next";
import { publicDB } from "@/lib/db";
import { LinkHubClient } from "@/components/LinkHubClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مركز الروابط الرسمي",
  description: "جميع روابط أتيليه Rony Dress الرسمي في مكان واحد مع رمز QR.",
};

export default async function LinksPage() {
  const { settings } = await publicDB();
  return <LinkHubClient settings={settings} />;
}
