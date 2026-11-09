"use client";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { WhatsappIcon } from "@/components/ui/SocialIcons";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FloatingActions({ locale, whatsapp }: { locale: Locale; whatsapp: string | null }) {
  const d = getDictionary(locale);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 700);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <div className="fixed bottom-5 end-5 z-40 flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label={d.common.backToTop}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full bg-navy-900 text-white shadow-lift transition hover:bg-ocean-600",
          show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
      {whatsapp ? (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={d.common.whatsapp}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_10px_30px_-6px_rgba(16,185,129,.7)] transition hover:scale-110"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-30" aria-hidden="true" />
          <WhatsappIcon className="relative h-7 w-7" />
        </a>
      ) : null}
    </div>
  );
}
