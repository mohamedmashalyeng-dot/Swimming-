"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

const OPTIMIZABLE = [/^images\.unsplash\.com$/, /\.supabase\.co$/, /^i\.ytimg\.com$/, /^i\.vimeocdn\.com$/];

function canOptimize(src: string) {
  try {
    const u = new URL(src);
    const configured = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host : "";
    return OPTIMIZABLE.some((r) => r.test(u.hostname)) || (configured && u.host === configured);
  } catch {
    return src.startsWith("/");
  }
}

/**
 * next/image wrapper that (1) works with any admin-provided URL and
 * (2) falls back to a branded water illustration if the image fails.
 */
export function SmartImage({
  src, alt, className, fallbackLabel, fallbackArt = true, ...rest
}: Omit<ImageProps, "src"> & { src?: string | null; fallbackLabel?: string; fallbackArt?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    if (!fallbackArt) return null;
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn("water-bg caustics flex items-center justify-center overflow-hidden", className, rest.fill && "absolute inset-0 h-full w-full")}
      >
        <svg viewBox="0 0 200 60" className="w-2/3 max-w-[220px] opacity-60" aria-hidden="true">
          <path d="M0 30c16 0 16-10 33-10s17 10 33 10 17-10 34-10 16 10 33 10 17-10 33-10 17 10 34 10" fill="none" stroke="#20C6C8" strokeWidth="4" strokeLinecap="round" />
          <path d="M0 46c16 0 16-10 33-10s17 10 33 10 17-10 34-10 16 10 33 10 17-10 33-10 17 10 34 10" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="3" strokeLinecap="round" />
        </svg>
        {fallbackLabel ? <span className="sr-only">{fallbackLabel}</span> : null}
      </div>
    );
  }
  return (
    <Image
      {...rest}
      src={src}
      alt={alt}
      className={className}
      unoptimized={!canOptimize(src)}
      onError={() => setFailed(true)}
    />
  );
}
