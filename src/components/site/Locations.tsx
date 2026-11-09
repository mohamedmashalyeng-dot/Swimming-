"use client";
import { CalendarDays, Clock, Images, Map, MapPin, Phone, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { SmartImage } from "@/components/ui/SmartImage";
import { WhatsappIcon } from "@/components/ui/SocialIcons";
import { getDictionary } from "@/lib/i18n";
import type { Course, Locale, Location } from "@/lib/types";
import { cn, t, telLink, tList, whatsappLink } from "@/lib/utils";

export function Locations({ locale, locations, courses }: { locale: Locale; locations: Location[]; courses: Course[] }) {
  const d = getDictionary(locale);
  const [mapFor, setMapFor] = useState<Location | null>(null);
  const [gallery, setGallery] = useState<{ loc: Location; i: number } | null>(null);

  return (
    <>
      <ul className="grid gap-6 md:grid-cols-2">
        {locations.map((l) => {
          const available = courses.filter((c) => c.location_ids?.includes(l.id));
          const photos = [l.image_url, ...(l.gallery_urls ?? [])].filter(Boolean) as string[];
          const wa = whatsappLink(l.whatsapp);
          const tel = telLink(l.phone);
          return (
            <li key={l.id} className="card card-hover flex flex-col overflow-hidden">
              <div className="relative aspect-[16/9] bg-navy-900">
                <SmartImage src={l.image_url} alt={t(l, "name", locale)} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
                {photos.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setGallery({ loc: l, i: 0 })}
                    className="absolute bottom-3 end-3 inline-flex items-center gap-1.5 rounded-full bg-navy-950/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur transition hover:bg-navy-950"
                  >
                    <Images className="h-4 w-4" aria-hidden="true" />{d.common.gallery} ({photos.length})
                  </button>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-4 p-6">
                <div>
                  <h3 className="text-xl font-extrabold">{t(l, "name", locale)}</h3>
                  <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-turquoise-600" aria-hidden="true" />
                    {[t(l, "address", locale), t(l, "city", locale)].filter(Boolean).join("، ")}
                  </p>
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-2xl bg-mist p-3">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{d.locations.days}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {d.daysShort.map((day, i) => (
                        <span key={day} className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-bold",
                          l.training_days.includes(i) ? "bg-ocean-600 text-white" : "bg-white text-slate-300")}>{day}</span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-mist p-3">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{d.locations.hours}</p>
                    <p className="mt-2 font-semibold">{t(l, "working_hours", locale)}</p>
                  </div>
                </div>

                {tList(l, "facilities", locale).length ? (
                  <div>
                    <p className="text-xs font-bold text-slate-500">{d.locations.facilities}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tList(l, "facilities", locale).map((f) => <span key={f} className="chip">{f}</span>)}
                    </div>
                  </div>
                ) : null}

                {available.length ? (
                  <div>
                    <p className="text-xs font-bold text-slate-500">{d.locations.courses}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {available.map((c) => <span key={c.id} className="chip border-ocean-100 bg-ocean-100/50 text-ocean-700">{t(c, "title", locale)}</span>)}
                    </div>
                  </div>
                ) : null}

                <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-4">
                  {l.map_embed_url ? (
                    <button type="button" onClick={() => setMapFor(l)} className="btn-ocean px-4 py-2 text-xs">
                      <Map className="h-4 w-4" aria-hidden="true" />{d.common.showMap}
                    </button>
                  ) : null}
                  {l.map_url ? (
                    <a href={l.map_url} target="_blank" rel="noopener noreferrer" className="btn-outline px-4 py-2 text-xs">
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />{d.common.openMap}
                    </a>
                  ) : null}
                  {tel ? (
                    <a href={tel} className="btn-outline px-4 py-2 text-xs" aria-label={`${d.common.call} ${l.phone}`}>
                      <Phone className="h-4 w-4" aria-hidden="true" /><span dir="ltr">{l.phone}</span>
                    </a>
                  ) : null}
                  {wa ? (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline px-4 py-2 text-xs text-emerald-700" aria-label={d.common.whatsapp}>
                      <WhatsappIcon className="h-4 w-4" />WhatsApp
                    </a>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <Modal open={!!mapFor} onClose={() => setMapFor(null)} title={mapFor ? t(mapFor, "name", locale) : ""} size="xl" closeLabel={d.common.close}>
        {mapFor?.map_embed_url ? (
          <div className="relative aspect-[4/3] w-full sm:aspect-video">
            <iframe
              src={mapFor.map_embed_url}
              title={t(mapFor, "name", locale)}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        ) : null}
      </Modal>

      <Modal open={!!gallery} onClose={() => setGallery(null)} title={gallery ? `${t(gallery.loc, "name", locale)} — ${d.common.gallery}` : ""} size="xl" closeLabel={d.common.close}>
        {gallery ? (() => {
          const photos = [gallery.loc.image_url, ...(gallery.loc.gallery_urls ?? [])].filter(Boolean) as string[];
          const i = gallery.i;
          return (
            <div className="p-4 sm:p-6">
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-navy-900">
                <SmartImage src={photos[i]} alt={`${t(gallery.loc, "name", locale)} ${i + 1}`} fill sizes="1000px" className="object-cover" />
              </div>
              <div className="mt-4 flex items-center justify-between gap-4">
                <button type="button" className="btn-outline px-4 py-2" disabled={i === 0} onClick={() => setGallery({ ...gallery, i: i - 1 })}>{d.common.previous}</button>
                <span className="text-sm font-semibold text-slate-500" dir="ltr">{i + 1} / {photos.length}</span>
                <button type="button" className="btn-outline px-4 py-2" disabled={i === photos.length - 1} onClick={() => setGallery({ ...gallery, i: i + 1 })}>{d.common.next}</button>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {photos.map((p, j) => (
                  <button key={p + j} type="button" onClick={() => setGallery({ ...gallery, i: j })}
                    className={cn("relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2", j === i ? "border-turquoise-500" : "border-transparent opacity-70")}
                    aria-label={`${j + 1}`}>
                    <SmartImage src={p} alt="" fill sizes="96px" className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          );
        })() : null}
      </Modal>
    </>
  );
}
