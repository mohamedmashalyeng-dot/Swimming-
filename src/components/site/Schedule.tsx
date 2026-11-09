"use client";
import { Clock, MapPin, User, Users } from "lucide-react";
import { useState } from "react";
import { getDictionary } from "@/lib/i18n";
import type { AgeGroup, Coach, Course, Locale, Location, Schedule as Sched } from "@/lib/types";
import { cn, formatNumber, formatTime, t } from "@/lib/utils";
import { FilterSelect } from "./Courses";
import { selectCourse } from "./bus";

export type Availability = "available" | "limited" | "full" | "closed" | "cancelled";

export function availabilityOf(s: Sched): Availability {
  if (s.status === "cancelled") return "cancelled";
  if (s.status === "closed") return "closed";
  const left = s.capacity - s.booked_count;
  if (left <= 0) return "full";
  if (left <= Math.max(1, Math.ceil(s.capacity * 0.25))) return "limited";
  return "available";
}

const badge: Record<Availability, string> = {
  available: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  limited: "bg-amber-50 text-amber-700 ring-amber-200",
  full: "bg-red-50 text-red-700 ring-red-200",
  closed: "bg-slate-100 text-slate-600 ring-slate-200",
  cancelled: "bg-slate-100 text-slate-500 ring-slate-200 line-through",
};
const bar: Record<Availability, string> = {
  available: "bg-emerald-500", limited: "bg-amber-500", full: "bg-red-500", closed: "bg-slate-400", cancelled: "bg-slate-300",
};

export function Schedule({
  locale, schedules, courses, locations, ageGroups, coaches,
}: { locale: Locale; schedules: Sched[]; courses: Course[]; locations: Location[]; ageGroups: AgeGroup[]; coaches: Coach[] }) {
  const d = getDictionary(locale);
  const [day, setDay] = useState<number | null>(null);
  const [course, setCourse] = useState("");
  const [age, setAge] = useState("");
  const [loc, setLoc] = useState("");

  const filtered = schedules.filter((s) =>
    (day === null || s.day_of_week === day) &&
    (!course || s.course_id === course) &&
    (!age || s.age_group_id === age) &&
    (!loc || s.location_id === loc));

  const daysToShow = day === null ? [0, 1, 2, 3, 4, 5, 6] : [day];
  const label = (a: Availability) => d.schedule[a];

  return (
    <>
      <div className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label={d.schedule.filterDay}>
        <button type="button" className="filter-chip shrink-0" aria-pressed={day === null} onClick={() => setDay(null)}>{d.schedule.allDays}</button>
        {d.days.map((name, i) => (
          <button type="button" key={name} className="filter-chip shrink-0" aria-pressed={day === i} onClick={() => setDay(i)}>
            {name}
            <span className="ms-1.5 text-[11px] opacity-70">({formatNumber(schedules.filter((s) => s.day_of_week === i).length, locale)})</span>
          </button>
        ))}
      </div>

      <div className="card mb-6 grid gap-4 p-4 sm:grid-cols-3">
        <FilterSelect label={d.schedule.filterCourse} value={course} onChange={setCourse} allLabel={d.common.all}
          options={courses.map((c) => ({ value: c.id, label: t(c, "title", locale) }))} />
        <FilterSelect label={d.schedule.filterAge} value={age} onChange={setAge} allLabel={d.common.all}
          options={ageGroups.map((g) => ({ value: g.id, label: t(g, "name", locale) }))} />
        <FilterSelect label={d.schedule.filterLocation} value={loc} onChange={setLoc} allLabel={d.common.all}
          options={locations.map((l) => ({ value: l.id, label: t(l, "name", locale) }))} />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
        <span>{d.schedule.legend}:</span>
        {(["available", "limited", "full", "closed"] as Availability[]).map((a) => (
          <span key={a} className="inline-flex items-center gap-1.5"><span className={cn("h-2.5 w-2.5 rounded-full", bar[a])} aria-hidden="true" />{label(a)}</span>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 p-12 text-center">
          <p className="text-slate-500">{d.common.noResults}</p>
          <button type="button" className="btn-outline" onClick={() => { setDay(null); setCourse(""); setAge(""); setLoc(""); }}>{d.common.resetFilters}</button>
        </div>
      ) : (
        <div className="space-y-6">
          {daysToShow.map((dow) => {
            const items = filtered.filter((s) => s.day_of_week === dow);
            if (!items.length) return null;
            return (
              <section key={dow} aria-labelledby={`day-${dow}`} className="card overflow-hidden">
                <h3 id={`day-${dow}`} className="flex items-center justify-between bg-navy-900 px-5 py-3 text-base font-extrabold text-white">
                  {d.days[dow]}
                  <span className="text-xs font-semibold text-white/60">{formatNumber(items.length, locale)}</span>
                </h3>
                <ul className="divide-y divide-line">
                  {items.map((s) => {
                    const a = availabilityOf(s);
                    const left = Math.max(0, s.capacity - s.booked_count);
                    const c = courses.find((x) => x.id === s.course_id);
                    const l = locations.find((x) => x.id === s.location_id);
                    const g = ageGroups.find((x) => x.id === s.age_group_id);
                    const coach = coaches.find((x) => x.id === s.coach_id);
                    const bookable = a === "available" || a === "limited";
                    return (
                      <li key={s.id} className="grid gap-4 p-5 md:grid-cols-[150px_1fr_220px_auto] md:items-center">
                        <div className="flex items-center gap-2 font-display text-base font-extrabold text-ocean-700" dir="ltr">
                          <Clock className="h-4 w-4" aria-hidden="true" />
                          <span>{formatTime(s.start_time, locale)} – {formatTime(s.end_time, locale)}</span>
                        </div>
                        <div>
                          <p className="font-bold">{t(c, "title", locale)}</p>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{t(l, "name", locale)}</span>
                            {g ? <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden="true" />{t(g, "name", locale)}</span> : null}
                            {coach ? <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" aria-hidden="true" />{d.schedule.coach}: {t(coach, "name", locale)}</span> : null}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className={cn("rounded-full px-2.5 py-0.5 ring-1", badge[a])}>{label(a)}</span>
                            <span className="text-slate-500">{d.schedule.spotsLeft(left, s.capacity)}</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={s.capacity} aria-valuenow={s.booked_count} aria-label={d.schedule.capacity}>
                            <div className={cn("h-full rounded-full", bar[a])} style={{ width: `${Math.min(100, (s.booked_count / s.capacity) * 100)}%` }} />
                          </div>
                        </div>
                        <a
                          href={bookable ? "#contact" : undefined}
                          aria-disabled={!bookable}
                          onClick={(e) => {
                            if (!bookable) { e.preventDefault(); return; }
                            selectCourse({ courseId: s.course_id, locationId: s.location_id, scheduleId: s.id, day: s.day_of_week });
                          }}
                          className={cn("btn px-4 py-2 text-xs", bookable ? "btn-primary" : "pointer-events-none border border-line bg-slate-50 text-slate-400")}
                        >
                          {bookable ? d.common.bookSession : label(a)}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
