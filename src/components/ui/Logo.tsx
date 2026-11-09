import { cn } from "@/lib/utils";

/**
 * Captain Amir Salami brand mark: a stylised "A" peak formed by a swimmer's
 * arm stroke, sitting on two wave lines — water movement + athletic drive.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-10 w-10", className)} aria-hidden="true">
      <defs>
        <linearGradient id="cas-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#20C6C8" />
          <stop offset="1" stopColor="#0877B9" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="#061B35" />
      <path d="M11 30 L22 11 Q24 8 26 11 L37 30" fill="none" stroke="url(#cas-g)" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="31.5" cy="14.5" r="3.2" fill="#20C6C8" />
      <path d="M8 34.5c3.3 0 3.3-2.5 6.6-2.5s3.3 2.5 6.6 2.5 3.3-2.5 6.6-2.5 3.3 2.5 6.6 2.5 3.3-2.5 6.6-2.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M11 39.5c3 0 3-2 6-2s3 2 6 2 3-2 6-2 3 2 6 2 3-2 6-2" fill="none" stroke="#20C6C8" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({
  nameAr, nameEn, locale, light = false, className,
}: { nameAr: string; nameEn: string; locale: "ar" | "en"; light?: boolean; className?: string }) {
  const primary = locale === "ar" ? nameAr : nameEn;
  const secondary = locale === "ar" ? nameEn : nameAr;
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <LogoMark />
      <span className="flex flex-col leading-tight">
        <span className={cn("font-display text-base font-extrabold sm:text-lg", light ? "text-white" : "text-navy-900")}>
          {primary}
        </span>
        <span className={cn("text-[11px] font-semibold tracking-wide", light ? "text-turquoise-300" : "text-ocean-600")}>
          {secondary}
        </span>
      </span>
    </span>
  );
}
