import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://ronydress.chameleon.vision";
  const now = new Date();
  const dressCodes = [
    "RD-01",
    "RD-02",
    "RD-03",
    "RD-04",
    "RD-05",
    "RD-06",
    "RD-07",
    "RD-08",
  ];
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/collection`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${base}/rental`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/tailoring`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/booking`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/links`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ...dressCodes.map((code) => ({
      url: `${base}/dress/${code}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  ];
}
