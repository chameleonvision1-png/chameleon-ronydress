import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rony Dress — أتيليه فستان ست البنات",
    short_name: "Rony Dress",
    description:
      "فساتين خطوبة وسواريه وكتب كتاب وزفاف وتصميمات هاند ميد متاحة للإيجار والتفصيل وحجز المواعيد في كفر الزيات.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF9F2",
    theme_color: "#B89040",
    dir: "rtl",
    lang: "ar",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
