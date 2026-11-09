"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2, Mail, Phone, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { submitRegistrationAction } from "@/app/(site)/[locale]/actions";
import { WhatsappIcon } from "@/components/ui/SocialIcons";
import { socialLinks } from "./social";
import { getDictionary } from "@/lib/i18n";
import type { Course, Locale, Location, Schedule, SiteSettings, WebsiteSection } from "@/lib/types";
import { registrationSchema, type RegistrationInput } from "@/lib/validation";
import { cn, formatTime, t, telLink, whatsappLink } from "@/lib/utils";
import { onPrefill } from "./bus";

// zod skips object-level refinements while other fields are invalid, so the
// "parent required for minors" rule is also checked here for instant feedback.
const baseResolver = zodResolver(registrationSchema);
const registrationResolver: typeof baseResolver = async (values, ctx, opts) => {
  const res = await baseResolver(values, ctx, opts);
  const age = Number(values.age);
  if (Number.isFinite(age) && age > 0 && age < 18 && !String(values.parent_name ?? "").trim() && !res.errors.parent_name) {
    return { values: {}, errors: { ...res.errors, parent_name: { type: "custom", message: "parentRequired" } } };
  }
  return res;
};

export function Contact({
  locale, settings, section, courses, locations, schedules,
}: {
  locale: Locale; settings: SiteSettings; section?: WebsiteSection;
  courses: Course[]; locations: Location[]; schedules: Schedule[];
}) {
  const d = getDictionary(locale);
  const wa = whatsappLink(settings.whatsapp, t(settings, "whatsapp_message", locale));
  const tel = telLink(settings.phone);
  const socials = socialLinks(settings);

  return (
    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="space-y-4">
        {wa ? (
          <a href={wa} target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-3xl bg-emerald-500 p-6 text-white shadow-lift transition hover:bg-emerald-600">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20"><WhatsappIcon className="h-8 w-8" /></span>
            <span>
              <span className="block text-lg font-extrabold">{d.common.whatsapp}</span>
              <span className="block text-sm text-white/85" dir="ltr">+{settings.whatsapp}</span>
            </span>
          </a>
        ) : null}
        {tel ? (
          <a href={tel} className="card card-hover flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ocean-100 text-ocean-600"><Phone className="h-6 w-6" aria-hidden="true" /></span>
            <span><span className="block text-xs font-semibold text-slate-500">{d.contact.phone}</span><span className="block font-bold" dir="ltr">{settings.phone}</span></span>
          </a>
        ) : null}
        {settings.email ? (
          <a href={`mailto:${settings.email}`} className="card card-hover flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-turquoise-100 text-turquoise-600"><Mail className="h-6 w-6" aria-hidden="true" /></span>
            <span><span className="block text-xs font-semibold text-slate-500">{d.contact.email}</span><span className="block font-bold">{settings.email}</span></span>
          </a>
        ) : null}
        {socials.length ? (
          <div className="card p-5">
            <p className="text-sm font-bold">{d.contact.follow}</p>
            <div className="mt-3 flex gap-2">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-white transition hover:bg-ocean-600">
                  <s.Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </aside>

      <RegistrationForm locale={locale} section={section} courses={courses} locations={locations} schedules={schedules} />
    </div>
  );
}

function RegistrationForm({
  locale, section, courses, locations, schedules,
}: { locale: Locale; section?: WebsiteSection; courses: Course[]; locations: Location[]; schedules: Schedule[] }) {
  const d = getDictionary(locale);
  const v = d.validation as Record<string, string>;
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ reference: string } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const startedAt = useRef<number>(0);
  const formRef = useRef<HTMLFormElement>(null);

  const { register, handleSubmit, watch, setValue, reset, setError, formState: { errors } } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    mode: "onTouched",
    defaultValues: {
      student_name: "", parent_name: "", age: "" as unknown as number, phone: "", email: "", course_id: "",
      experience: "" as unknown as "none", location_id: "", preferred_day: "", schedule_id: "any", notes: "", website: "",
    },
  });

  useEffect(() => { startedAt.current = Date.now(); }, []);

  const courseId = watch("course_id");
  const locationId = watch("location_id");
  const day = watch("preferred_day");
  const age = Number(watch("age"));
  const isMinor = Number.isFinite(age) && age > 0 && age < 18;

  // Prefill from "Book" buttons elsewhere on the page.
  useEffect(() => onPrefill((p) => {
    if (p.courseId) setValue("course_id", p.courseId);
    setValue("location_id", p.locationId ?? "");
    setValue("preferred_day", p.day ?? "");
    setTimeout(() => setValue("schedule_id", p.scheduleId ?? "any"), 0);
    setTimeout(() => formRef.current?.querySelector<HTMLInputElement>("#student_name")?.focus({ preventScroll: true }), 600);
  }), [setValue]);

  const course = courses.find((c) => c.id === courseId);
  const locationOptions = course?.location_ids?.length ? locations.filter((l) => course.location_ids!.includes(l.id)) : locations;

  const sessionOptions = useMemo(() => schedules.filter((s) =>
    (!courseId || s.course_id === courseId) &&
    (!locationId || s.location_id === locationId) &&
    (day === "" || day === undefined || s.day_of_week === Number(day)) &&
    s.status === "open"), [schedules, courseId, locationId, day]);

  // Reset an incompatible selection when filters change.
  const scheduleId = watch("schedule_id");
  useEffect(() => {
    if (scheduleId && /^[0-9a-f-]{36}$/i.test(scheduleId) && !sessionOptions.some((s) => s.id === scheduleId)) {
      setValue("schedule_id", "any");
    }
  }, [sessionOptions, scheduleId, setValue]);
  useEffect(() => {
    if (locationId && !locationOptions.some((l) => l.id === locationId)) setValue("location_id", "");
  }, [locationOptions, locationId, setValue]);

  const onSubmit = (values: RegistrationInput) => {
    setServerError(null);
    start(async () => {
      const res = await submitRegistrationAction({ ...values, started_at: startedAt.current }, locale);
      if (res.ok) {
        setResult(res.data);
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (res.error === "validation" && res.fields) {
        for (const [k, msg] of Object.entries(res.fields)) setError(k as keyof RegistrationInput, { message: msg });
      } else {
        setServerError((d.errors as Record<string, string>)[res.error] ?? d.errors.generic);
      }
    });
  };

  const err = (k: keyof RegistrationInput) => {
    const m = errors[k]?.message as string | undefined;
    return m ? <p id={`${k}-err`} className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600"><AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />{v[m] ?? m}</p> : null;
  };
  const aria = (k: keyof RegistrationInput) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${k}-err` : undefined });

  if (result) {
    return (
      <div ref={formRef as unknown as React.RefObject<HTMLDivElement>} className="card flex flex-col items-center justify-center gap-4 p-8 text-center sm:p-12" role="status">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50"><CheckCircle2 className="h-12 w-12 text-emerald-500" aria-hidden="true" /></span>
        <h3 className="text-2xl font-extrabold">{d.contact.successTitle}</h3>
        <p className="max-w-lg leading-7 text-slate-600">{d.contact.successBody}</p>
        <p className="rounded-2xl bg-mist px-5 py-3 text-sm">
          {d.contact.reference}: <strong className="font-mono text-base tracking-wider" dir="ltr">{result.reference}</strong>
        </p>
        <button type="button" className="btn-outline mt-2" onClick={() => { reset(); setResult(null); startedAt.current = Date.now(); }}>
          {d.contact.another}
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit)} noValidate className="card p-5 sm:p-8" aria-labelledby="reg-title">
      <h3 id="reg-title" className="text-xl font-extrabold">{d.contact.formTitle}</h3>
      <p className="mt-1 text-sm text-slate-500">{d.contact.formIntro}</p>

      {/* honeypot */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>Website<input type="text" tabIndex={-1} autoComplete="off" {...register("website")} /></label>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="student_name">{d.contact.fields.student_name} *</label>
          <input id="student_name" autoComplete="name" className="input" placeholder={d.contact.placeholders.student_name} {...aria("student_name")} {...register("student_name")} />
          {err("student_name")}
        </div>
        <div>
          <label className="label" htmlFor="age">{d.contact.fields.age} *</label>
          <input id="age" type="number" inputMode="numeric" min={1} max={100} className="input" {...aria("age")} {...register("age")} />
          {err("age")}
        </div>
        <div>
          <label className="label" htmlFor="parent_name">{d.contact.fields.parent_name} {isMinor ? "*" : ""}</label>
          <input id="parent_name" className="input" placeholder={d.contact.placeholders.parent_name} {...aria("parent_name")} {...register("parent_name")} />
          {err("parent_name")}
        </div>
        {isMinor ? (
          <p className="-mt-2 rounded-xl bg-ocean-100 px-3 py-2 text-xs font-semibold text-ocean-700 sm:col-span-2">{d.contact.minorNotice}</p>
        ) : null}
        <div>
          <label className="label" htmlFor="phone">{d.contact.fields.phone} *</label>
          <input id="phone" type="tel" dir="ltr" autoComplete="tel" inputMode="tel" className="input text-start rtl:text-right" placeholder={d.contact.placeholders.phone} {...aria("phone")} {...register("phone")} />
          {err("phone")}
        </div>
        <div>
          <label className="label" htmlFor="email">{d.contact.fields.email}</label>
          <input id="email" type="email" dir="ltr" autoComplete="email" className="input rtl:text-right" placeholder={d.contact.placeholders.email} {...aria("email")} {...register("email")} />
          {err("email")}
        </div>
        <div>
          <label className="label" htmlFor="course_id">{d.contact.fields.course_id}</label>
          <select id="course_id" className="input" {...register("course_id")}>
            <option value="">{d.contact.selectCourse}</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{t(c, "title", locale)}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="experience">{d.contact.fields.experience} *</label>
          <select id="experience" className="input" {...aria("experience")} {...register("experience")}>
            <option value="">—</option>
            {(["none", "basic", "intermediate", "advanced"] as const).map((x) => <option key={x} value={x}>{d.contact.experience[x]}</option>)}
          </select>
          {err("experience")}
        </div>
        <div>
          <label className="label" htmlFor="location_id">{d.contact.fields.location_id}</label>
          <select id="location_id" className="input" {...register("location_id")}>
            <option value="">{d.contact.anyLocation}</option>
            {locationOptions.map((l) => <option key={l.id} value={l.id}>{t(l, "name", locale)}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="preferred_day">{d.contact.fields.preferred_day}</label>
          <select id="preferred_day" className="input" {...register("preferred_day")}>
            <option value="">{d.contact.anyDay}</option>
            {d.days.map((name, i) => <option key={name} value={i}>{name}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="schedule_id">{d.contact.fields.schedule_id}</label>
          <select id="schedule_id" className="input" {...register("schedule_id")}>
            <optgroup label={d.contact.flexibleLabel}>
              <option value="any">{d.contact.anyTime}</option>
              <option value="morning">{d.contact.morning}</option>
              <option value="afternoon">{d.contact.afternoon}</option>
              <option value="evening">{d.contact.evening}</option>
            </optgroup>
            {sessionOptions.length ? (
              <optgroup label={d.contact.sessionsLabel}>
                {sessionOptions.map((s) => {
                  const full = s.booked_count >= s.capacity;
                  const c = courses.find((x) => x.id === s.course_id);
                  const l = locations.find((x) => x.id === s.location_id);
                  return (
                    <option key={s.id} value={s.id} disabled={full}>
                      {d.days[s.day_of_week]} {formatTime(s.start_time, locale)} — {t(c, "title", locale)} · {t(l, "name", locale)}
                      {full ? ` (${d.contact.sessionFull})` : ` (${d.schedule.spotsLeft(s.capacity - s.booked_count, s.capacity)})`}
                    </option>
                  );
                })}
              </optgroup>
            ) : null}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="notes">{d.contact.fields.notes}</label>
          <textarea id="notes" rows={3} className="input" placeholder={d.contact.placeholders.notes} {...aria("notes")} {...register("notes")} />
          {err("notes")}
        </div>
      </div>

      {serverError ? (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{serverError}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={cn("btn-primary mt-6 w-full py-4 text-base")}>
        {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />}
        {pending ? d.contact.submitting : t(section, "cta_primary", locale) || d.contact.submit}
      </button>
      <p className="mt-3 text-center text-xs text-slate-400">{d.contact.privacy}</p>
    </form>
  );
}
