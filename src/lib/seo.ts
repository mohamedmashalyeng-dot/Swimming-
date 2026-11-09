import type { Metadata } from "next";
import type { Locale, SiteSettings } from "./types";
import { siteUrl } from "./env";

export function buildMetadata(locale: Locale, s: SiteSettings | null): Metadata {
  const base = siteUrl(s?.site_url);
  const brand = locale === "ar" ? s?.brand_name_ar ?? "كابتن أمير سلامي" : s?.brand_name_en ?? "Captain Amir Salami";
  const title = (locale === "ar" ? s?.seo_title_ar : s?.seo_title_en) || brand;
  const description = (locale === "ar" ? s?.seo_description_ar : s?.seo_description_en) || "";
  const keywords = (locale === "ar" ? s?.seo_keywords_ar : s?.seo_keywords_en) || undefined;
  return {
    metadataBase: new URL(base),
    title: { default: title, template: `%s | ${brand}` },
    description,
    keywords: keywords?.split(",").map((k) => k.trim()).filter(Boolean),
    applicationName: brand,
    alternates: {
      canonical: `${base}/${locale}`,
      languages: { ar: `${base}/ar`, en: `${base}/en`, "x-default": `${base}/ar` },
    },
    openGraph: {
      type: "website",
      url: `${base}/${locale}`,
      siteName: brand,
      title,
      description,
      locale: locale === "ar" ? "ar_EG" : "en_US",
      alternateLocale: locale === "ar" ? ["en_US"] : ["ar_EG"],
      images: s?.og_image_url ? [{ url: s.og_image_url, width: 1200, height: 630, alt: brand }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
    verification: s?.google_site_verification ? { google: s.google_site_verification } : undefined,
    icons: s?.favicon_url ? { icon: s.favicon_url } : { icon: "/icon.svg" },
  };
}
