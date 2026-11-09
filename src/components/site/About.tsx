import { Award, BadgeCheck, Medal, Quote, Sparkles } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { getDictionary } from "@/lib/i18n";
import type { Coach, Locale, WebsiteSection } from "@/lib/types";
import { formatNumber, t, tList } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

export function About({
  locale, section, coach, showDemo,
}: { locale: Locale; section?: WebsiteSection; coach: Coach | null; showDemo: boolean }) {
  const d = getDictionary(locale);
  if (!coach) return null;
  const name = t(coach, "name", locale);

  const stats = [
    { value: `${formatNumber(coach.students_trained, locale)}+`, label: d.about.stats.students },
    { value: `${formatNumber(coach.years_experience, locale)}+`, label: d.about.stats.years },
    { value: formatNumber(coach.programs_count, locale), label: d.about.stats.programs },
    { value: `${formatNumber(coach.satisfaction_rate, locale)}%`, label: d.about.stats.satisfaction },
  ];

  const lists: { title: string; items: string[]; icon: typeof Award }[] = [
    { title: d.about.specialties, items: tList(coach, "specialties", locale), icon: Sparkles },
    { title: d.about.certifications, items: tList(coach, "certifications", locale), icon: BadgeCheck },
    { title: d.about.achievements, items: tList(coach, "achievements", locale), icon: Medal },
  ];

  return (
    <section id="about" className="section overflow-x-clip">
      <div className="container-x">
        <SectionHeading
          eyebrow={t(section, "eyebrow", locale)}
          title={t(section, "title", locale) || d.nav.about}
          subtitle={t(section, "subtitle", locale)}
        />

        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Photo */}
          <div className="relative mx-auto w-full max-w-md lg:sticky lg:top-28">
            <div className="absolute -inset-4 -z-10 rotate-3 rounded-[2.5rem] bg-gradient-to-br from-turquoise-500 to-ocean-600 opacity-90" aria-hidden="true" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-navy-900 shadow-lift">
              <SmartImage
                src={coach.photo_url}
                alt={name}
                fill
                sizes="(min-width: 1024px) 420px, 90vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 start-6 rounded-2xl bg-white px-5 py-4 shadow-lift">
              <p className="font-display text-3xl font-extrabold text-ocean-600">{formatNumber(coach.years_experience, locale)}+</p>
              <p className="text-xs font-semibold text-slate-500">{d.about.experienceBadge}</p>
            </div>
          </div>

          {/* Bio */}
          <div>
            <p className="text-sm font-bold text-turquoise-600">{t(coach, "title", locale)}</p>
            <h3 className="mt-1 text-3xl font-extrabold">{name}</h3>
            <p className="text-sm font-semibold text-slate-400">{locale === "ar" ? coach.name_en : coach.name_ar}</p>
            <p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-600">{t(coach, "bio", locale)}</p>

            {t(coach, "philosophy", locale) ? (
              <figure className="mt-8 rounded-3xl bg-navy-900 p-6 text-white sm:p-8">
                <Quote className="h-8 w-8 text-turquoise-500 rtl:-scale-x-100" aria-hidden="true" />
                <figcaption className="mt-2 text-sm font-bold text-turquoise-300">{d.about.philosophy}</figcaption>
                <blockquote className="mt-2 text-lg leading-8 text-white/90">{t(coach, "philosophy", locale)}</blockquote>
              </figure>
            ) : null}

            <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="card p-5 text-center">
                  <dd className="font-display text-3xl font-extrabold text-ocean-600">{s.value}</dd>
                  <dt className="mt-1 text-xs font-semibold text-slate-500">{s.label}</dt>
                </div>
              ))}
            </dl>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {lists.filter((l) => l.items.length).map((l) => (
                <div key={l.title} className="card p-5">
                  <div className="flex items-center gap-2">
                    <l.icon className="h-5 w-5 text-turquoise-600" aria-hidden="true" />
                    <h4 className="text-sm font-bold">{l.title}</h4>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {l.items.map((i) => (
                      <li key={i} className="flex gap-2 text-sm leading-6 text-slate-600">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-turquoise-500" aria-hidden="true" />
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {coach.is_demo && showDemo ? (
              <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
                <Award className="h-4 w-4" aria-hidden="true" />
                {d.about.demoNotice}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
