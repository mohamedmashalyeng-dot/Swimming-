"use client";
import { Globe, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { getDictionary } from "@/lib/i18n";
import { LOCALE_COOKIE } from "@/lib/i18n/config";
import type { Locale } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface NavItem { id: string; key: keyof ReturnType<typeof getDictionary>["nav"] }

export function Header({
  locale, brandAr, brandEn, items,
}: { locale: Locale; brandAr: string; brandEn: string; items: NavItem[] }) {
  const d = getDictionary(locale);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");
  const other: Locale = locale === "ar" ? "en" : "ar";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy: highlight the section currently in view.
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const rememberLocale = () => {
    document.cookie = `${LOCALE_COOKIE}=${other}; path=/; max-age=31536000; samesite=lax`;
  };

  const solid = scrolled || open;

  return (
    <>
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        solid ? "bg-white/90 shadow-[0_6px_30px_-12px_rgba(6,27,53,.25)] backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        {d.nav.skip}
      </a>
      <div className="container-x flex h-[4.5rem] items-center justify-between gap-4">
        <a href="#top" className="shrink-0" aria-label={locale === "ar" ? brandAr : brandEn}>
          <Logo nameAr={brandAr} nameEn={brandEn} locale={locale} light={!solid} />
        </a>

        <nav className="hidden xl:block" aria-label="Main">
          <ul className="flex items-center gap-0.5">
            {items.map((i) => (
              <li key={i.id}>
                <a
                  href={`#${i.id}`}
                  className={cn(
                    "whitespace-nowrap rounded-full px-2 py-2 text-[13px] font-semibold transition 2xl:px-3 2xl:text-sm",
                    solid ? "text-navy-800 hover:bg-mist" : "text-white/85 hover:bg-white/10 hover:text-white",
                    active === i.id && (solid ? "bg-ocean-100 text-ocean-700" : "bg-white/15 text-white"),
                  )}
                  aria-current={active === i.id ? "true" : undefined}
                >
                  {d.nav[i.key] as string}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={`/${other}`}
            onClick={rememberLocale}
            hrefLang={other}
            lang={other}
            aria-label={d.meta.switchLabel}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-bold transition",
              solid ? "border-line text-navy-800 hover:border-ocean-500" : "border-white/30 text-white hover:bg-white/10",
            )}
          >
            <Globe className="h-4 w-4" aria-hidden="true" />
            {d.meta.switchTo}
          </Link>
          <a href="#contact" className="btn-primary hidden px-5 py-2.5 sm:inline-flex">
            {d.nav.register}
          </a>
          <button
            type="button"
            className={cn("rounded-full p-2.5 xl:hidden", solid ? "text-navy-900 hover:bg-mist" : "text-white hover:bg-white/10")}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? d.nav.close : d.nav.menu}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

    </header>
      {/* Mobile menu */}
      <div
        id="mobile-nav"
        className={cn(
          "fixed inset-x-0 bottom-0 top-[4.5rem] z-50 origin-top bg-white transition duration-300 xl:hidden",
          open ? "visible opacity-100" : "invisible -translate-y-2 opacity-0",
        )}
      >
        <nav className="container-x h-full overflow-y-auto pb-10 pt-4" aria-label="Mobile">
          <ul className="grid grid-cols-2 gap-2">
            {items.map((i) => (
              <li key={i.id}>
                <a
                  href={`#${i.id}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-2xl border border-line px-4 py-3.5 text-base font-semibold text-navy-800 transition hover:border-ocean-500",
                    active === i.id && "border-ocean-500 bg-ocean-100 text-ocean-700",
                  )}
                >
                  {d.nav[i.key] as string}
                </a>
              </li>
            ))}
          </ul>
          <a href="#contact" onClick={() => setOpen(false)} className="btn-primary mt-6 w-full py-4 text-base">
            {d.nav.register}
          </a>
        </nav>
      </div>
    </>
  );
}
