import { clsx, type ClassValue } from "clsx";
import type { Locale } from "./types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = object;

/** Pick the localized value of a bilingual field, falling back to the other language. */
export function t<T extends Row>(row: T | null | undefined, field: string, locale: Locale): string {
  if (!row) return "";
  const r = row as Record<string, unknown>;
  const primary = r[`${field}_${locale}`];
  const fallback = r[`${field}_${locale === "ar" ? "en" : "ar"}`];
  return ((primary as string) || (fallback as string) || "") as string;
}

export function tList<T extends Row>(row: T | null | undefined, field: string, locale: Locale): string[] {
  if (!row) return [];
  const r = row as Record<string, unknown>;
  const primary = r[`${field}_${locale}`] as string[] | undefined;
  const fallback = r[`${field}_${locale === "ar" ? "en" : "ar"}`] as string[] | undefined;
  return primary && primary.length ? primary : fallback ?? [];
}

export function formatNumber(n: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(n);
}

export function formatPrice(n: number | null, locale: Locale, currency: string) {
  if (n == null) return "";
  return `${formatNumber(n, locale)} ${currency}`;
}

/** "16:00:00" → "4:00 PM" / "٤:٠٠ م" */
export function formatTime(time: string, locale: Locale) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(Date.UTC(2000, 0, 1, h, m));
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    hour: "numeric", minute: "2-digit", timeZone: "UTC",
  }).format(d);
}

export function formatDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    year: "numeric", month: "short", day: "numeric",
  }).format(new Date(date));
}

export function formatDuration(seconds: number | null) {
  if (!seconds && seconds !== 0) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ageRange(min: number, max: number | null, locale: Locale) {
  if (max == null) return locale === "ar" ? `${formatNumber(min, locale)}+ سنة` : `${min}+ yrs`;
  return locale === "ar"
    ? `${formatNumber(min, locale)} – ${formatNumber(max, locale)} سنة`
    : `${min}–${max} yrs`;
}

export function rangesOverlap(aMin: number, aMax: number | null, bMin: number, bMax: number | null) {
  const aHi = aMax ?? 200;
  const bHi = bMax ?? 200;
  return aMin <= bHi && bMin <= aHi;
}

export function whatsappLink(number: string | null | undefined, message?: string | null) {
  if (!number) return null;
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function telLink(phone: string | null | undefined) {
  if (!phone) return null;
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

// ---- video URL parsing (YouTube / Vimeo) ------------------------------
export interface ParsedVideo {
  provider: "youtube" | "vimeo";
  id: string;
}

export function parseVideoUrl(raw: string): ParsedVideo | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return /^[\w-]{11}$/.test(id) ? { provider: "youtube", id } : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
    const v = url.searchParams.get("v");
    if (v && /^[\w-]{11}$/.test(v)) return { provider: "youtube", id: v };
    const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/);
    return m ? { provider: "youtube", id: m[1] } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = url.pathname.match(/(?:\/video)?\/(\d{5,})/);
    return m ? { provider: "vimeo", id: m[1] } : null;
  }
  return null;
}

export function videoEmbedUrl(provider: "youtube" | "vimeo", id: string, autoplay = true) {
  return provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1${autoplay ? "&autoplay=1" : ""}`
    : `https://player.vimeo.com/video/${id}?dnt=1${autoplay ? "&autoplay=1" : ""}`;
}

export function videoThumbnail(v: { provider: string; provider_video_id: string; thumbnail_url: string | null }) {
  if (v.thumbnail_url) return v.thumbnail_url;
  if (v.provider === "youtube") return `https://i.ytimg.com/vi/${v.provider_video_id}/hqdefault.jpg`;
  return `https://vumbnail.com/${v.provider_video_id}.jpg`;
}

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
