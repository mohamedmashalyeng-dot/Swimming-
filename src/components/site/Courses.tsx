"use client";
import { CalendarDays, CheckCircle2, Clock, Layers, MapPin, Target, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { SmartImage } from "@/components/ui/SmartImage";
import { getDictionary } from "@/lib/i18n";
import type { AgeGroup, Course, CourseType, Level, Locale, Location, Schedule } from "@/lib/types";
import { ageRange, cn, formatNumber, formatPrice, formatTime, rangesOverlap, t, tList } from "@/lib/utils";
import { selectCourse } from "./bus";

const levelColors: Record<Level, string> = {
  beginner: "bg-emerald-50 text-emerald-700",
  intermediate: "bg-sky-50 text-sky-700",
  advanced: "bg-violet-50 text-violet-700",
  all: "bg-turquoise-100 text-turquoise-600",
};

export function Courses({
  locale, courses, ageGroups, locations, schedules, currency, showDemo,
}: {
  locale: Locale;
  courses: Course[];
  ageGroups: AgeGroup[];
  locations: Location[];
  schedules: Schedule[];
  currency: string;
  showDemo: boolean;
}) {
  const d = getDictionary(locale);
  const [level, setLevel] = useState<Level | "">("");
  const [age, setAge] = useState<string>("");
  const [type, setType] = useState<CourseType | "">("");
  const [openId, setOpenId] = useState<string | null>(null);

  const levels = useMemo(() => Array.from(new Set(courses.map((c) => c.level))), [courses]);
  const types = useMemo(() => Array.from(new Set(courses.map((c) => c.course_type))), [courses]);

  const filtered = courses.filter((c) => {
    if (level && c.level !== level && c.level !== "all") return false;
    if (type && c.course_type !== type) return false;
    if (age) {
      const g = ageGroups.find((x) => x.id === age);
      if (g && !rangesOverlap(c.age_min, c.age_max, g.age_min, g.age_max)) return false;
    }
    return true;
  });

  const open = courses.find((c) => c.id === openId) ?? null;
  const locName = (id: string) => t(locations.find((l) => l.id === id), "name", locale);

  const reset = () => { setLevel(""); setAge(""); setType(""); };

  return (
    <>
      {/* Filters */}
      <div className="card mb-10 grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
        <FilterSelect label={d.courses.filterLevel} value={level} onChange={(v) => setLevel(v as Level | "")} allLabel={d.common.all}
          options={levels.map((l) => ({ value: l, label: d.levels[l] }))} />
        <FilterSelect label={d.courses.filterAge} value={age} onChange={setAge} allLabel={d.common.all}
          options={ageGroups.map((g) => ({ value: g.id, label: `${t(g, "name", locale)} (${ageRange(g.age_min, g.age_max, locale)})` }))} />
        <FilterSelect label={d.courses.filterType} value={type} onChange={(v) => setType(v as CourseType | "")} allLabel={d.common.all}
          options={types.map((x) => ({ value: x, label: d.courseTypes[x] }))} />
      </div>

      <p className="mb-6 text-sm font-semibold text-slate-500" aria-live="polite">{d.courses.count(filtered.length)}</p>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 p-12 text-center">
          <p className="text-slate-500">{d.common.noResults}</p>
          <button type="button" onClick={reset} className="btn-outline">{d.common.resetFilters}</button>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c) => (
            <li key={c.id} className="card card-hover group flex flex-col overflow-hidden">
              <div className="relative aspect-[4/3] overflow-hidden bg-navy-900">
                <SmartImage src={c.image_url} alt={t(c, "title", locale)} fill sizes="(min-width:1280px) 300px, (min-width:640px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-x-3 top-3 flex justify-between gap-2">
                  <span className={cn("rounded-full px-3 py-1 text-xs font-bold", levelColors[c.level])}>{d.levels[c.level]}</span>
                  {c.is_featured ? <span className="rounded-full bg-turquoise-500 px-3 py-1 text-xs font-bold text-navy-950">{d.courses.featured}</span> : null}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-bold text-ocean-600">{d.courseTypes[c.course_type]}</p>
                <h3 className="mt-1 text-lg font-extrabold leading-snug">{t(c, "title", locale)}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{t(c, "summary", locale) || t(c, "description", locale)}</p>
                <ul className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                  <li className="flex items-center gap-1.5"><Users className="h-4 w-4 text-turquoise-600" aria-hidden="true" />{ageRange(c.age_min, c.age_max, locale)}</li>
                  <li className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-turquoise-600" aria-hidden="true" />{formatNumber(c.duration_weeks, locale)} {d.common.weeks}</li>
                  <li className="flex items-center gap-1.5"><Layers className="h-4 w-4 text-turquoise-600" aria-hidden="true" />{formatNumber(c.sessions_count, locale)} {d.common.sessions}</li>
                  <li className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-turquoise-600" aria-hidden="true" />{formatNumber(c.session_minutes, locale)} {d.common.minutes}</li>
                </ul>
                <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                  <div>
                    {c.price != null ? (
                      <>
                        <p className="font-display text-xl font-extrabold text-navy-900">{formatPrice(c.price, locale, currency)}</p>
                        <p className="text-[11px] text-slate-400">{t(c, "price_note", locale)}</p>
                      </>
                    ) : null}
                  </div>
                  <button type="button" onClick={() => setOpenId(c.id)} className="btn-outline px-4 py-2 text-xs">
                    {d.common.viewDetails}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!open} onClose={() => setOpenId(null)} title={open ? t(open, "title", locale) : ""} closeLabel={d.common.close} size="lg">
        {open ? (
          <div>
            <div className="relative aspect-[21/9] bg-navy-900">
              <SmartImage src={open.image_url} alt={t(open, "title", locale)} fill sizes="768px" className="object-cover" />
            </div>
            <div className="space-y-6 p-5 sm:p-7">
              <div className="flex flex-wrap gap-2">
                <span className={cn("rounded-full px-3 py-1 text-xs font-bold", levelColors[open.level])}>{d.levels[open.level]}</span>
                <span className="chip">{d.courseTypes[open.course_type]}</span>
                {open.is_demo && showDemo ? <span className="chip border-amber-200 bg-amber-50 text-amber-700">{d.common.demoContent}</span> : null}
              </div>
              <p className="leading-7 text-slate-600">{t(open, "description", locale)}</p>

              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { k: d.courses.ages, v: ageRange(open.age_min, open.age_max, locale) },
                  { k: d.courses.duration, v: `${formatNumber(open.duration_weeks, locale)} ${d.common.weeks}` },
                  { k: d.courses.sessionsCount, v: formatNumber(open.sessions_count, locale) },
                  { k: d.courses.sessionLength, v: `${formatNumber(open.session_minutes, locale)} ${d.common.minutes}` },
                ].map((x) => (
                  <div key={x.k} className="rounded-2xl bg-mist p-4">
                    <dt className="text-xs font-semibold text-slate-500">{x.k}</dt>
                    <dd className="mt-1 font-bold">{x.v}</dd>
                  </div>
                ))}
              </dl>

              <div className="grid gap-6 sm:grid-cols-2">
                <DetailList icon={Target} title={d.courses.objectives} items={tList(open, "objectives", locale)} />
                <DetailList icon={CheckCircle2} title={d.courses.requirements} items={tList(open, "requirements", locale)} />
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold"><MapPin className="h-4 w-4 text-turquoise-600" aria-hidden="true" />{d.courses.locations}</h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(open.location_ids ?? []).map((id) => <span key={id} className="chip">{locName(id)}</span>)}
                </div>
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold"><CalendarDays className="h-4 w-4 text-turquoise-600" aria-hidden="true" />{d.courses.schedules}</h4>
                {schedules.filter((s) => s.course_id === open.id).length ? (
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {schedules.filter((s) => s.course_id === open.id).map((s) => (
                      <li key={s.id} className="rounded-xl border border-line px-3 py-2 text-sm">
                        <span className="font-bold">{d.days[s.day_of_week]}</span>{" · "}
                        <span dir="ltr">{formatTime(s.start_time, locale)} – {formatTime(s.end_time, locale)}</span>
                        <span className="block text-xs text-slate-500">{locName(s.location_id)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">{d.courses.noSchedules}</p>
                )}
              </div>

              <div className="flex flex-col items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
                {open.price != null ? (
                  <div>
                    <p className="text-xs font-semibold text-slate-500">{d.courses.price}</p>
                    <p className="font-display text-2xl font-extrabold">{formatPrice(open.price, locale, currency)}</p>
                    <p className="text-xs text-slate-400">{t(open, "price_note", locale)}</p>
                  </div>
                ) : <span />}
                <a
                  href="#contact"
                  onClick={() => { selectCourse({ courseId: open.id }); setOpenId(null); }}
                  className="btn-primary w-full sm:w-auto"
                >
                  {d.common.bookThis}
                </a>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function DetailList({ icon: I, title, items }: { icon: typeof Target; title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="flex items-center gap-2 text-sm font-bold"><I className="h-4 w-4 text-turquoise-600" aria-hidden="true" />{title}</h4>
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-600">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />{i}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FilterSelect({
  label, value, onChange, options, allLabel,
}: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; allLabel: string }) {
  return (
    <label className="block">
      <span className="label text-xs">{label}</span>
      <select className="input py-2.5" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{allLabel}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
