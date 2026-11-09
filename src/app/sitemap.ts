import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { getSettings } from "@/lib/content";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const s = await getSettings().catch(() => null);
  const base = siteUrl(s?.site_url);
  const now = new Date();
  return (["ar", "en"] as const).map((l) => ({
    url: `${base}/${l}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: l === "ar" ? 1 : 0.9,
    alternates: { languages: { ar: `${base}/ar`, en: `${base}/en` } },
  }));
}
