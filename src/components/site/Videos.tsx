"use client";
import { Clock, Play, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { SmartImage } from "@/components/ui/SmartImage";
import { getDictionary } from "@/lib/i18n";
import type { Locale, Video, VideoCategory } from "@/lib/types";
import { cn, formatDuration, t, videoEmbedUrl, videoThumbnail } from "@/lib/utils";

const PAGE = 6;

export function VideoPlayerModal({
  video, locale, onClose,
}: { video: Video | null; locale: Locale; onClose: () => void }) {
  const d = getDictionary(locale);
  return (
    <Modal open={!!video} onClose={onClose} title={video ? t(video, "title", locale) : ""} size="video" closeLabel={d.common.close}>
      {video ? (
        <div>
          <div className="relative aspect-video w-full bg-black">
            <iframe
              src={videoEmbedUrl(video.provider, video.provider_video_id)}
              title={t(video, "title", locale)}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          {t(video, "description", locale) ? (
            <p className="px-5 py-4 text-sm leading-6 text-white/75 sm:px-6">{t(video, "description", locale)}</p>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}

export function VideoCard({ video, locale, onPlay, compact = false }: { video: Video; locale: Locale; onPlay: () => void; compact?: boolean }) {
  const d = getDictionary(locale);
  return (
    <button
      type="button"
      onClick={onPlay}
      className="card card-hover group block w-full overflow-hidden text-start"
      aria-label={`${d.videos.play}: ${t(video, "title", locale)}`}
    >
      <div className="relative aspect-video overflow-hidden bg-navy-900">
        <SmartImage src={videoThumbnail(video)} alt="" fill sizes="(min-width:1024px) 400px, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 to-transparent" aria-hidden="true" />
        <span className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-ocean-600 shadow-lift transition group-hover:scale-110 group-hover:bg-turquoise-500 group-hover:text-navy-950" aria-hidden="true">
          <Play className="h-6 w-6 translate-x-0.5 fill-current" />
        </span>
        {video.duration_seconds ? (
          <span className="absolute bottom-3 end-3 inline-flex items-center gap-1 rounded-full bg-navy-950/80 px-2.5 py-1 text-xs font-bold text-white" dir="ltr">
            <Clock className="h-3 w-3" aria-hidden="true" />{formatDuration(video.duration_seconds)}
          </span>
        ) : null}
        {video.is_featured && !compact ? (
          <span className="absolute start-3 top-3 rounded-full bg-turquoise-500 px-3 py-1 text-xs font-bold text-navy-950">{d.videos.featured}</span>
        ) : null}
      </div>
      <div className={cn("p-5", compact && "p-4")}>
        <div className="flex flex-wrap gap-2 text-[11px] font-bold">
          <span className="text-ocean-600">{d.videoCategories[video.category]}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500">{d.levels[video.level]}</span>
        </div>
        <h3 className={cn("mt-1 font-extrabold leading-snug", compact ? "text-sm" : "text-base")}>{t(video, "title", locale)}</h3>
        {!compact && t(video, "description", locale) ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{t(video, "description", locale)}</p>
        ) : null}
      </div>
    </button>
  );
}

export function Videos({ locale, videos }: { locale: Locale; videos: Video[] }) {
  const d = getDictionary(locale);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<VideoCategory | "">("");
  const [visible, setVisible] = useState(PAGE);
  const [playing, setPlaying] = useState<Video | null>(null);

  const categories = useMemo(() => Array.from(new Set(videos.map((v) => v.category))), [videos]);
  const filtered = videos.filter((v) => {
    if (cat && v.category !== cat) return false;
    if (q.trim()) {
      const hay = `${v.title_ar} ${v.title_en} ${v.description_ar ?? ""} ${v.description_en ?? ""}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    }
    return true;
  });
  const featured = !q && !cat ? videos.find((v) => v.is_featured) : undefined;
  const list = featured ? filtered.filter((v) => v.id !== featured.id) : filtered;

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label={d.common.all}>
          <button type="button" className="filter-chip shrink-0" aria-pressed={cat === ""} onClick={() => { setCat(""); setVisible(PAGE); }}>{d.common.all}</button>
          {categories.map((c) => (
            <button type="button" key={c} className="filter-chip shrink-0" aria-pressed={cat === c} onClick={() => { setCat(c); setVisible(PAGE); }}>
              {d.videoCategories[c]}
            </button>
          ))}
        </div>
        <label className="relative block w-full lg:w-72">
          <span className="sr-only">{d.common.search}</span>
          <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setVisible(PAGE); }} placeholder={d.videos.searchPlaceholder} className="input ps-11" />
        </label>
      </div>

      {featured ? (
        <button
          type="button"
          onClick={() => setPlaying(featured)}
          className="group relative mb-8 block w-full overflow-hidden rounded-[2rem] bg-navy-900 text-start shadow-lift"
          aria-label={`${d.videos.play}: ${t(featured, "title", locale)}`}
        >
          <div className="relative aspect-[16/9] sm:aspect-[21/9]">
            <SmartImage src={videoThumbnail(featured)} alt="" fill sizes="100vw" className="object-cover opacity-80 transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent rtl:bg-gradient-to-t" aria-hidden="true" />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 sm:p-10">
            <div className="max-w-2xl">
              <span className="rounded-full bg-turquoise-500 px-3 py-1 text-xs font-bold text-navy-950">{d.videos.featured}</span>
              <h3 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">{t(featured, "title", locale)}</h3>
              <p className="mt-2 hidden text-white/75 sm:block">{t(featured, "description", locale)}</p>
            </div>
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-turquoise-500 text-navy-950 shadow-glow transition group-hover:scale-110 sm:h-20 sm:w-20" aria-hidden="true">
              <Play className="h-7 w-7 translate-x-0.5 fill-current" />
            </span>
          </div>
        </button>
      ) : null}

      {list.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">{d.videos.empty}</div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.slice(0, visible).map((v) => (
            <li key={v.id}><VideoCard video={v} locale={locale} onPlay={() => setPlaying(v)} /></li>
          ))}
        </ul>
      )}

      {list.length > visible ? (
        <div className="mt-10 text-center">
          <button type="button" className="btn-outline" onClick={() => setVisible((n) => n + PAGE)}>{d.common.showMore}</button>
        </div>
      ) : null}

      <VideoPlayerModal video={playing} locale={locale} onClose={() => setPlaying(null)} />
    </>
  );
}
