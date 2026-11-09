import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../../globals.css";
import { cairo, outfit } from "@/lib/fonts";
import { dirOf, isLocale, locales } from "@/lib/i18n/config";
import { getSettings } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#061B35",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const settings = await getSettings().catch(() => null);
  return buildMetadata(locale, settings);
}

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const fontVars =
    locale === "ar"
      ? { "--font-body": "var(--font-cairo)", "--font-heading": "var(--font-cairo)" }
      : { "--font-body": "var(--font-outfit)", "--font-heading": "var(--font-outfit)" };
  return (
    <html lang={locale} dir={dirOf(locale)} className={`${cairo.variable} ${outfit.variable}`} style={fontVars as React.CSSProperties}>
      <body>{children}</body>
    </html>
  );
}
