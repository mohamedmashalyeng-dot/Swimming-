import type { Locale } from "../types";

export const locales: Locale[] = ["ar", "en"];
export const defaultLocale: Locale = "ar";
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const ADMIN_LOCALE_COOKIE = "ADMIN_LOCALE";

export function isLocale(v: string | undefined | null): v is Locale {
  return v === "ar" || v === "en";
}

export const dirOf = (l: Locale) => (l === "ar" ? "rtl" : "ltr");
