import type { Metadata } from "next";
import "../globals.css";
import { cairo, outfit } from "@/lib/fonts";
import { getAdminLocale } from "@/lib/admin/auth";
import { dirOf } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: { default: "Admin | Captain Amir Salami", template: "%s | Admin" },
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getAdminLocale();
  const fontVars =
    locale === "ar"
      ? { "--font-body": "var(--font-cairo)", "--font-heading": "var(--font-cairo)" }
      : { "--font-body": "var(--font-outfit)", "--font-heading": "var(--font-outfit)" };
  return (
    <html lang={locale} dir={dirOf(locale)} className={`${cairo.variable} ${outfit.variable}`} style={fontVars as React.CSSProperties}>
      <body className="bg-mist">{children}</body>
    </html>
  );
}
