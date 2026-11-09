"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ChevronLeft, ChevronRight, MessageSquarePlus, Quote, Star } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/Modal";
import { SmartImage } from "@/components/ui/SmartImage";
import { Stars } from "@/components/ui/Stars";
import { submitReviewAction } from "@/app/(site)/[locale]/actions";
import { getDictionary } from "@/lib/i18n";
import type { Course, Locale, Review } from "@/lib/types";
import { reviewSchema, type ReviewInput } from "@/lib/validation";
import { cn, formatDate, formatNumber, t } from "@/lib/utils";

export function Reviews({
  locale, reviews, courses, showDemo,
}: { locale: Locale; reviews: Review[]; courses: Course[]; showDemo: boolean }) {
  const d = getDictionary(locale);
  const track = useRef<HTMLUListElement>(null);
  const [writeOpen, setWriteOpen] = useState(false);
  const [paused, setPaused] = useState(false);

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const anyDemo = reviews.some((r) => r.is_demo);

  const scrollBy = useCallback((dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = (card?.clientWidth ?? 320) + 24;
    const rtl = getComputedStyle(el).direction === "rtl";
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    if (dir === 1 && pos >= max - 4) { el.scrollTo({ left: 0, behavior: "smooth" }); return; }
    el.scrollBy({ left: dir * step * (rtl ? -1 : 1), behavior: "smooth" });
  }, []);

  // Auto-advance carousel (pauses on hover/focus).
  useEffect(() => {
    if (paused || reviews.length < 2) return;
    const id = setInterval(() => scrollBy(1), 6000);
    return () => clearInterval(id);
  }, [paused, scrollBy, reviews.length]);

  const PrevI = locale === "ar" ? ChevronRight : ChevronLeft;
  const NextI = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <>
      <div className="mb-8 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        {reviews.length ? (
          <div className="flex items-center gap-4">
            <p className="font-display text-5xl font-extrabold text-white">{formatNumber(Number(avg.toFixed(1)), locale)}</p>
            <div>
              <Stars value={avg} label={`${avg.toFixed(1)} ${d.reviews.outOf}`} />
              <p className="mt-1 text-sm text-white/70">{d.reviews.basedOn(reviews.length)}</p>
            </div>
          </div>
        ) : <span />}
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => scrollBy(-1)} className="rounded-full border border-white/20 p-3 text-white transition hover:bg-white/10" aria-label={d.reviews.prev}>
            <PrevI className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => scrollBy(1)} className="rounded-full border border-white/20 p-3 text-white transition hover:bg-white/10" aria-label={d.reviews.next}>
            <NextI className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => setWriteOpen(true)} className="btn-primary ms-2">
            <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />{d.reviews.write}
          </button>
        </div>
      </div>

      <ul
        ref={track}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        aria-roledescription="carousel"
      >
        {reviews.map((r) => {
          const course = courses.find((c) => c.id === r.course_id);
          return (
            <li key={r.id} className="w-[85%] shrink-0 snap-start sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
              <figure className="flex h-full flex-col rounded-3xl bg-white p-6 shadow-lift">
                <div className="flex items-center justify-between">
                  <Stars value={r.rating} label={d.reviews.stars(r.rating)} />
                  <Quote className="h-8 w-8 text-turquoise-100 rtl:-scale-x-100" aria-hidden="true" />
                </div>
                <blockquote className="mt-4 flex-1 text-[15px] leading-7 text-slate-700">“{t(r, "text", locale)}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-4">
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-turquoise-500 to-ocean-600 font-bold text-white">
                    {r.photo_url ? <SmartImage src={r.photo_url} alt="" fill sizes="44px" className="object-cover" /> : r.customer_name.trim().charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{r.customer_name}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {course ? t(course, "title", locale) + " · " : ""}{formatDate(r.review_date, locale)}
                    </span>
                  </span>
                  {r.is_demo && showDemo ? (
                    <span className="ms-auto shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">{d.common.demo}</span>
                  ) : null}
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ul>

      {anyDemo && showDemo ? <p className="mt-4 text-center text-xs text-white/50">{d.reviews.demoNotice}</p> : null}

      <Modal open={writeOpen} onClose={() => setWriteOpen(false)} title={d.reviews.write} size="md" closeLabel={d.common.close}>
        <ReviewForm locale={locale} courses={courses} onDone={() => undefined} />
      </Modal>
    </>
  );
}

function ReviewForm({ locale, courses, onDone }: { locale: Locale; courses: Course[]; onDone: () => void }) {
  const d = getDictionary(locale);
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { customer_name: "", rating: 0, text: "", course_id: "", website: "" },
  });
  const rating = watch("rating");

  const onSubmit = (values: ReviewInput) => {
    setServerError(null);
    start(async () => {
      const res = await submitReviewAction({ ...values, locale });
      if (res.ok) { setDone(true); onDone(); }
      else setServerError((d.errors as Record<string, string>)[res.error] ?? d.errors.generic);
    });
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <CheckCircle2 className="h-14 w-14 text-emerald-500" aria-hidden="true" />
        <p className="font-semibold text-slate-700" role="status">{d.reviews.success}</p>
      </div>
    );
  }

  const v = d.validation as Record<string, string>;
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-5 sm:p-6" noValidate>
      <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" {...register("website")} />
      <div>
        <label className="label" htmlFor="rv-name">{d.reviews.yourName} *</label>
        <input id="rv-name" className="input" aria-invalid={!!errors.customer_name} {...register("customer_name")} />
        {errors.customer_name ? <p className="mt-1 text-xs text-red-600">{v[errors.customer_name.message!] ?? errors.customer_name.message}</p> : null}
      </div>
      <fieldset>
        <legend className="label">{d.reviews.rating} *</legend>
        <div className="flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={d.reviews.stars(n)}
              onClick={() => setValue("rating", n, { shouldValidate: true })} className="rounded-lg p-1 transition hover:scale-110">
              <Star className={cn("h-8 w-8", n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
            </button>
          ))}
        </div>
        {errors.rating ? <p className="mt-1 text-xs text-red-600">{v[errors.rating.message!] ?? errors.rating.message}</p> : null}
      </fieldset>
      <div>
        <label className="label" htmlFor="rv-course">{d.reviews.selectCourse}</label>
        <select id="rv-course" className="input" {...register("course_id")}>
          <option value="">—</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{t(c, "title", locale)}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="rv-text">{d.reviews.yourReview} *</label>
        <textarea id="rv-text" rows={4} className="input" aria-invalid={!!errors.text} {...register("text")} />
        {errors.text ? <p className="mt-1 text-xs text-red-600">{v[errors.text.message!] ?? errors.text.message}</p> : null}
      </div>
      {serverError ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{serverError}</p> : null}
      <button type="submit" className="btn-primary w-full" disabled={pending}>{pending ? d.contact.submitting : d.reviews.submit}</button>
    </form>
  );
}
