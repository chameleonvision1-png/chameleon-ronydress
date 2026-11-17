import { publicDB } from "@/lib/db";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ShortlistDrawer } from "@/components/ShortlistDrawer";
import { ShortlistProvider } from "@/components/ShortlistProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { settings } = await publicDB();

  return (
    <ThemeProvider>
      <ShortlistProvider>
        <div className="flex min-h-svh flex-col">
          <Header announcementAr={settings.announcementAr} />
          <main className="flex-1">{children}</main>
          <Footer settings={settings} />
        </div>
        <ShortlistDrawer />
      </ShortlistProvider>
    </ThemeProvider>
  );
}
