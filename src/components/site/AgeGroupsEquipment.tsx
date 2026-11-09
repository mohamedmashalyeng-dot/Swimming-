import { CheckCircle2, ClipboardCheck, Info, ShieldAlert, ShieldCheck, UserCheck } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { SmartImage } from "@/components/ui/SmartImage";
import { getDictionary } from "@/lib/i18n";
import type { AgeGroup, Course, Equipment, Locale, WebsiteSection } from "@/lib/types";
import { ageRange, rangesOverlap, t, tList } from "@/lib/utils";

export function AgeGroups({ locale, groups, courses }: { locale: Locale; groups: AgeGroup[]; courses: Course[] }) {
  const d = getDictionary(locale);
  return (
    <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((g, i) => {
        const programs = courses.filter((c) => rangesOverlap(c.age_min, c.age_max, g.age_min, g.age_max));
        return (
          <li key={g.id} className={`card card-hover flex flex-col overflow-hidden ${i === 0 ? "lg:col-span-1" : ""}`}>
            <div className="relative h-40 bg-navy-900">
              <SmartImage src={g.image_url} alt={t(g, "name", locale)} fill sizes="(min-width:1024px) 400px, 100vw" className="object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 to-transparent" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-turquoise-500 text-navy-950">
                  <Icon name={g.icon} className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-white">{t(g, "name", locale)}</h3>
                  <p className="text-xs font-bold text-turquoise-300">{d.ageGroups.range}: {ageRange(g.age_min, g.age_max, locale)}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-4 p-5">
              {t(g, "approach", locale) ? (
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400">{d.ageGroups.approach}</h4>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{t(g, "approach", locale)}</p>
                </div>
              ) : null}
              <MiniList title={d.ageGroups.objectives} items={tList(g, "objectives", locale)} />
              <MiniList title={d.ageGroups.considerations} items={tList(g, "considerations", locale)} icon="info" />
              {programs.length ? (
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400">{d.ageGroups.programs}</h4>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {programs.map((c) => <span key={c.id} className="chip">{t(c, "title", locale)}</span>)}
                  </div>
                </div>
              ) : null}
              {g.requires_guardian ? (
                <p className="mt-auto flex items-center gap-2 rounded-xl bg-ocean-100 px-3 py-2 text-xs font-semibold text-ocean-700">
                  <UserCheck className="h-4 w-4 shrink-0" aria-hidden="true" />{d.ageGroups.guardian}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function MiniList({ title, items, icon }: { title: string; items: string[]; icon?: "info" }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="text-xs font-bold uppercase text-slate-400">{title}</h4>
      <ul className="mt-2 space-y-1.5">
        {items.map((i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-700">
            {icon === "info"
              ? <Info className="mt-0.5 h-4 w-4 shrink-0 text-ocean-500" aria-hidden="true" />
              : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />}
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EquipmentSection({ locale, items, section }: { locale: Locale; items: Equipment[]; section?: WebsiteSection }) {
  const d = getDictionary(locale);
  const prep = tList(section, "highlights", locale);
  const safety = tList(section, "notes", locale);
  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((e) => (
          <li key={e.id} className="card card-hover group relative overflow-hidden p-6">
            <div className="absolute -end-6 -top-6 h-24 w-24 rounded-full bg-turquoise-100 transition group-hover:scale-125" aria-hidden="true" />
            {e.image_url ? (
              <div className="relative mb-4 h-28 overflow-hidden rounded-2xl bg-mist">
                <SmartImage src={e.image_url} alt={t(e, "name", locale)} fill sizes="300px" className="object-cover" />
              </div>
            ) : (
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-turquoise-500">
                <Icon name={e.icon} className="h-7 w-7" />
              </span>
            )}
            <div className="relative mt-4 flex items-center gap-2">
              <h3 className="font-extrabold">{t(e, "name", locale)}</h3>
              <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${e.category === "essential" ? "bg-ocean-100 text-ocean-700" : "bg-slate-100 text-slate-600"}`}>
                {e.category === "essential" ? d.equipment.essential : d.equipment.recommended}
              </span>
            </div>
            <p className="relative mt-2 text-sm leading-6 text-slate-600">{t(e, "description", locale)}</p>
          </li>
        ))}
      </ul>

      {prep.length || safety.length ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {prep.length ? (
            <div className="rounded-3xl bg-navy-900 p-7 text-white">
              <h3 className="flex items-center gap-2 text-lg font-extrabold"><ClipboardCheck className="h-6 w-6 text-turquoise-500" aria-hidden="true" />{d.equipment.preparation}</h3>
              <ol className="mt-5 space-y-3">
                {prep.map((p, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-6 text-white/85">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-turquoise-500 text-xs font-extrabold text-navy-950">{i + 1}</span>{p}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          {safety.length ? (
            <div className="rounded-3xl border-2 border-red-100 bg-white p-7">
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-red-700"><ShieldAlert className="h-6 w-6" aria-hidden="true" />{d.equipment.safety}</h3>
              <ul className="mt-5 space-y-3">
                {safety.map((p, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />{p}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
