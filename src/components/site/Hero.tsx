import { ArrowDown, CalendarCheck, CheckCircle2, PlayCircle } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { getDictionary } from "@/lib/i18n";
import type { Coach, Locale, SiteSettings, WebsiteSection } from "@/lib/types";
import { formatNumber, t, tList } from "@/lib/utils";

function isDirectVideo(url: string | null) {
  return !!url && /\.(mp4|webm)(\?|$)/i.test(url);
}

export function Hero({
  locale, section, settings, coach,
}: { locale: Locale; section?: WebsiteSection; settings: SiteSettings; coach: Coach | null }) {
  const d = getDictionary(locale);
  const brand = t(settings, "brand_name", locale);
  const title = t(section, "title", locale) || brand;
  const bg = section?.image_url;
  const video = section?.video_url;

  return (
    <section id="top" className="water-bg relative isolate flex min-h-[100svh] items-center overflow-hidden pb-28 pt-28">
      {/* Background media */}
      {isDirectVideo(video ?? null) ? (
        <video
          className="absolute inset-0 -z-20 h-full w-full object-cover"
          src={video!}
          autoPlay
          muted
          loop
          playsInline
          poster={bg ?? undefined}
          aria-hidden="true"
        />
      ) : bg ? (
        <SmartImage src={bg} alt="" fill priority fallbackArt={false} sizes="100vw" className="-z-20 object-cover" />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-navy-950/85 via-navy-900/70 to-navy-900/95" aria-hidden="true" />
      <div className="caustics absolute inset-0 -z-10 opacity-60" aria-hidden="true" />

      <div className="container-x grid items-center gap-12 lg:grid-cols-[1.25fr_1fr]">
        <div className="animate-fade-up">
          <span className="eyebrow bg-white/10 text-turquoise-300 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-turquoise-500" aria-hidden="true" />
            {t(section, "eyebrow", locale) || d.hero.badge}
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {t(section, "subtitle", locale) ? (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">{t(section, "subtitle", locale)}</p>
          ) : null}

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#contact" className="btn-primary px-8 py-4 text-base">
              <CalendarCheck className="h-5 w-5" aria-hidden="true" />
              {t(section, "cta_primary", locale) || d.nav.register}
            </a>
            <a href="#videos" className="btn-ghost px-8 py-4 text-base">
              <PlayCircle className="h-5 w-5" aria-hidden="true" />
              {t(section, "cta_secondary", locale) || d.nav.videos}
            </a>
          </div>

          {tList(section, "highlights", locale).length ? (
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
              {tList(section, "highlights", locale).map((h) => (
                <li key={h} className="flex items-center gap-2 text-sm font-semibold text-white/85">
                  <CheckCircle2 className="h-5 w-5 text-turquoise-500" aria-hidden="true" />
                  {h}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {coach ? (
          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="animate-float rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur-xl">
              <p className="text-sm font-semibold text-turquoise-300">{brand}</p>
              <p className="mt-1 text-2xl font-extrabold text-white">{t(coach, "title", locale)}</p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {[
                  { v: `${formatNumber(coach.students_trained, locale)}+`, l: d.about.stats.students },
                  { v: `${formatNumber(coach.years_experience, locale)}+`, l: d.about.stats.years },
                  { v: formatNumber(coach.programs_count, locale), l: d.about.stats.programs },
                  { v: `${formatNumber(coach.satisfaction_rate, locale)}%`, l: d.about.stats.satisfaction },
                ].map((s) => (
                  <div key={s.l} className="rounded-2xl bg-navy-950/40 p-4">
                    <p className="font-display text-3xl font-extrabold text-white">{s.v}</p>
                    <p className="mt-1 text-xs font-medium text-white/70">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <a href="#about" className="absolute bottom-24 start-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs font-semibold text-white/70 transition hover:text-white rtl:translate-x-1/2 sm:flex">
        {d.hero.scroll}
        <ArrowDown className="h-4 w-4 animate-bounce" aria-hidden="true" />
      </a>

      {/* animated wave divider */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 overflow-hidden" dir="ltr" aria-hidden="true">
        <svg className="animate-wave absolute bottom-0 left-0 h-full w-[200%]" viewBox="0 0 2880 80" preserveAspectRatio="none">
          <path d="M0 40c180 0 180-26 360-26s180 26 360 26 180-26 360-26 180 26 360 26 180-26 360-26 180 26 360 26 180-26 360-26 180 26 360 26v40H0z" fill="#F4F8FB" />
        </svg>
      </div>
    </section>
  );
}
