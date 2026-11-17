import type { Metadata, Viewport } from "next";
import { Cairo, Cormorant_Garamond, Montserrat, Tajawal } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const editorialFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-editorial",
  display: "swap",
});

const enFont = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-en",
  display: "swap",
});

const arFont = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-ar",
  display: "swap",
});

const arUiFont = Cairo({
  subsets: ["arabic"],
  weight: ["500", "600", "700"],
  variable: "--font-ar-ui",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ronydress.chameleon.vision"),
  title: {
    default: "Rony Dress | أتيليه فستان ست البنات — فساتين خطوبة وسواريه وكتب كتاب",
    template: "%s | Rony Dress — أتيليه فستان ست البنات",
  },
  description:
    "إطلالتك تبدأ من Rony Dress — أتيليه فستان ست البنات في كفر الزيات. فساتين خطوبة، سواريه، كتب كتاب، زفاف، وتصميمات هاند ميد متاحة للإيجار والتفصيل وحجز موعد بروفة.",
  openGraph: {
    title: "Rony Dress | أتيليه فستان ست البنات",
    description:
      "فساتين خطوبة وسواريه وكتب كتاب وزفاف بتفاصيل هاند ميد فاخرة — متاحة للإيجار وحجز البروفة في كفر الزيات.",
    url: "https://ronydress.chameleon.vision",
    siteName: "Rony Dress",
    locale: "ar_EG",
    type: "website",
    images: [
      {
        url: "/og-cover.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Rony Dress — أتيليه فستان ست البنات",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rony Dress | أتيليه فستان ست البنات",
    description: "فساتين خطوبة وسواريه وكتب كتاب وتصميمات هاند ميد للإيجار وحجز المواعيد في كفر الزيات.",
    images: ["/og-cover.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F6F3" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0A0C" },
  ],
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('ronydress_theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.removeAttribute('data-theme');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${editorialFont.variable} ${enFont.variable} ${arFont.variable} ${arUiFont.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-svh bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
