"use client";
import { ChevronLeft, ChevronRight, Clock, Lightbulb, ListOrdered, PlayCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SmartImage } from "@/components/ui/SmartImage";
import { getDictionary } from "@/lib/i18n";
import type { Lesson, Locale, Video } from "@/lib/types";
import { cn, formatNumber, parseVideoUrl, t, tList } from "@/lib/utils";
import { VideoCard, VideoPlayerModal } from "./Videos";

export function Learning({ locale, lessons, videos }: { locale: Locale; lessons: Lesson[]; videos: Video[] }) {
  const d = getDictionary(locale);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState<Video | null>(null);
  const lesson = lessons[idx];

  const related = useMemo(() => {
    if (!lesson) return [];
    const vids = (lesson.video_ids ?? []).map((id) => videos.find((v) => v.id === id)).filter(Boolean) as Video[];
    // A lesson can also carry its own video URL.
    if (lesson.video_url) {
      const p = parseVideoUrl(lesson.video_url);
      if (p && !vids.some((v) => v.provider_video_id === p.id)) {
        vids.unshift({
          id: `lesson-${lesson.id}`, title_ar: lesson.title_ar, title_en: lesson.title_en,
          description_ar: lesson.description_ar, description_en: lesson.description_en, category: "beginner",
          level: lesson.level, video_url: lesson.video_url, provider: p.provider, provider_video_id: p.id,
          thumbnail_url: null, duration_seconds: null, is_featured: false, is_published: true, sort_order: 0,
          is_demo: lesson.is_demo, created_at: lesson.created_at, updated_at: lesson.updated_at,
        });
      }
    }
    return vids;
  }, [lesson, videos]);

  if (!lessons.length || !lesson) return null;
  const Prev = locale === "ar" ? ChevronRight : ChevronLeft;
  const Next = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* Lesson list */}
      <nav aria-label={d.nav.learning} className="card min-w-0 p-2 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
        <ol className="scrollbar-none flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
          {lessons.map((l, i) => (
            <li key={l.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIdx(i)}
                aria-current={i === idx ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start text-sm font-semibold transition",
                  i === idx ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-mist",
                )}
              >
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold",
                  i === idx ? "bg-turquoise-500 text-navy-950" : "bg-mist text-ocean-600")}>
                  {formatNumber(i + 1, locale)}
                </span>
                <span className="whitespace-nowrap lg:whitespace-normal">{t(l, "title", locale)}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* Lesson detail */}
      <article className="card min-w-0 overflow-hidden" aria-live="polite">
        <div className="relative aspect-[21/9] bg-navy-900">
          <SmartImage src={lesson.image_url} alt={t(lesson, "title", locale)} fill sizes="(min-width:1024px) 860px, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/30 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5 sm:p-7">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-turquoise-500 text-navy-950">
              <Icon name={lesson.icon} className="h-7 w-7" />
            </span>
            <div>
              <p className="text-xs font-bold text-turquoise-300">
                {d.learning.lesson} {formatNumber(idx + 1, locale)} {d.learning.of} {formatNumber(lessons.length, locale)}
              </p>
              <h3 className="text-2xl font-extrabold text-white sm:text-3xl">{t(lesson, "title", locale)}</h3>
            </div>
          </div>
        </div>

        <div className="space-y-8 p-5 sm:p-8">
          <div className="flex flex-wrap gap-2">
            <span className="chip">{d.learning.level}: {d.levels[lesson.level]}</span>
            {lesson.estimated_minutes ? (
              <span className="chip"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{d.learning.estimated}: {formatNumber(lesson.estimated_minutes, locale)} {d.common.minutes}</span>
            ) : null}
          </div>
          <p className="text-base leading-8 text-slate-600">{t(lesson, "description", locale)}</p>

          <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
            {tList(lesson, "steps", locale).length ? (
              <div>
                <h4 className="flex items-center gap-2 font-bold"><ListOrdered className="h-5 w-5 text-turquoise-600" aria-hidden="true" />{d.learning.steps}</h4>
                <ol className="mt-4 space-y-3">
                  {tList(lesson, "steps", locale).map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ocean-100 text-xs font-extrabold text-ocean-700">{formatNumber(i + 1, locale)}</span>
                      <span className="pt-0.5 text-sm leading-6 text-slate-700">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
            {tList(lesson, "tips", locale).length ? (
              <div className="rounded-3xl bg-amber-50 p-5">
                <h4 className="flex items-center gap-2 font-bold text-amber-800"><Lightbulb className="h-5 w-5" aria-hidden="true" />{d.learning.tips}</h4>
                <ul className="mt-3 space-y-2">
                  {tList(lesson, "tips", locale).map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-6 text-amber-900">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {related.length ? (
            <div>
              <h4 className="flex items-center gap-2 font-bold"><PlayCircle className="h-5 w-5 text-turquoise-600" aria-hidden="true" />{d.learning.related}</h4>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {related.map((v) => <li key={v.id}><VideoCard video={v} locale={locale} compact onPlay={() => setPlaying(v)} /></li>)}
              </ul>
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t border-line pt-6">
            <button type="button" className="btn-outline px-4 py-2" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>
              <Prev className="h-4 w-4" aria-hidden="true" />{d.common.previous}
            </button>
            <button type="button" className="btn-ocean px-4 py-2" disabled={idx === lessons.length - 1} onClick={() => setIdx((i) => i + 1)}>
              {d.common.next}<Next className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>

      <VideoPlayerModal video={playing} locale={locale} onClose={() => setPlaying(null)} />
    </div>
  );
}
