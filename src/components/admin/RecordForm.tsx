"use client";
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, Save, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, startTransition, useActionState, useEffect, useState, type FormEvent } from "react";
import type { FormState } from "@/app/admin/actions";
import { Icon, ICON_NAMES } from "@/components/ui/Icon";
import { adminDict } from "@/lib/admin/i18n";
import { DAYS, lbl, type Field } from "@/lib/admin/resources";
import type { Locale } from "@/lib/types";
import { cn, parseVideoUrl } from "@/lib/utils";
import { GalleryField, ImageField } from "./ImageField";
import { toast } from "./Toast";

export interface RelOption { id: string; label: string }

export function RecordForm({
  locale, fields, record, action, backHref, title, relations, joins, afterCreate,
}: {
  locale: Locale;
  fields: Field[];
  record: Record<string, unknown>;
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  backHref?: string;
  title: string;
  relations: Record<string, RelOption[]>;
  joins: Record<string, string[]>;
  afterCreate?: string; // base path for redirect after create
}) {
  const d = adminDict(locale);
  const router = useRouter();
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const Back = locale === "ar" ? ArrowRight : ArrowLeft;

  useEffect(() => {
    if (!state.ts) return;
    if (state.ok) {
      toast(lbl(state.message ?? ["تم الحفظ", "Saved"], locale));
      if (afterCreate && !record.id && state.id) router.replace(`${afterCreate}/${state.id}`);
      else router.refresh();
    } else if (state.message) {
      toast(lbl(state.message, locale), "error");
    }
  }, [state, locale, afterCreate, record.id, router]);

  // Submit via dispatch (not the form `action` prop) so React does not reset
  // the uncontrolled inputs when the server returns validation errors.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  };

  const errs = state.errors ?? {};
  const val = (k: string) => record[k];

  const renderInput = (f: Field, key: string, lang?: "ar" | "en") => {
    const err = errs[key];
    const common = {
      id: key, name: key, "aria-invalid": !!err, "aria-describedby": err ? `${key}-err` : undefined,
      dir: lang === "en" ? "ltr" : lang === "ar" ? "rtl" : undefined,
    };
    const v = val(key);
    switch (f.type) {
      case "textarea":
        return <textarea {...common} rows={5} defaultValue={(v as string) ?? ""} className="input" required={f.required} />;
      case "list":
        return <textarea {...common} rows={5} defaultValue={((v as string[]) ?? []).join("\n")} className="input font-mono text-[13px] leading-6" />;
      case "number":
        return <input {...common} type="number" step="any" min={f.min} max={f.max} defaultValue={v == null ? "" : String(v)} className="input" required={f.required} />;
      case "rating":
        return <RatingInput name={key} defaultValue={Number(v ?? 5)} />;
      case "time":
        return <input {...common} type="time" defaultValue={v ? String(v).slice(0, 5) : ""} className="input" required={f.required} dir="ltr" />;
      case "date":
        return <input {...common} type="date" defaultValue={v ? String(v).slice(0, 10) : new Date().toISOString().slice(0, 10)} className="input" required={f.required} dir="ltr" />;
      case "url":
      case "email":
      case "slug":
        return <input {...common} type={f.type === "email" ? "email" : f.type === "url" ? "url" : "text"} dir="ltr" defaultValue={(v as string) ?? ""} className="input" required={f.required} readOnly={f.readOnly} />;
      case "video":
        return <VideoInput {...common} defaultValue={(v as string) ?? ""} />;
      case "select":
        return (
          <select {...common} defaultValue={v == null ? "" : String(v)} className="input" required={f.required}>
            {!f.required ? <option value="">—</option> : null}
            {f.options?.map((o) => <option key={o.value} value={o.value}>{lbl(o.label, locale)}</option>)}
          </select>
        );
      case "relation":
        return (
          <select {...common} defaultValue={(v as string) ?? ""} className="input" required={f.required}>
            <option value="">—</option>
            {(relations[f.name] ?? []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        );
      case "image":
        return <ImageField name={key} defaultValue={(v as string) ?? ""} folder={f.folder ?? "general"} locale={locale} invalid={!!err} describedBy={err ? `${key}-err` : undefined} />;
      case "images":
        return <GalleryField name={key} defaultValue={(v as string[]) ?? []} folder={f.folder ?? "general"} locale={locale} />;
      case "icon":
        return <IconPicker name={key} defaultValue={(v as string) ?? "waves"} />;
      case "boolean":
        return (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
            <input type="checkbox" name={key} defaultChecked={!!v} className="h-5 w-5 accent-ocean-600" />
            <span className="text-sm font-semibold">{lbl(f.label, locale)}</span>
          </label>
        );
      case "days": {
        const sel = new Set(((v as number[]) ?? []).map(Number));
        return (
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day, i) => (
              <label key={i} className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm has-[:checked]:border-ocean-500 has-[:checked]:bg-ocean-100">
                <input type="checkbox" name={key} value={i} defaultChecked={sel.has(i)} className="accent-ocean-600" />{lbl(day, locale)}
              </label>
            ))}
          </div>
        );
      }
      case "multi": {
        const sel = new Set(joins[f.name] ?? []);
        const opts = relations[f.name] ?? [];
        return (
          <div className="grid max-h-64 gap-2 overflow-y-auto rounded-xl border border-line bg-white p-3 sm:grid-cols-2">
            {opts.length === 0 ? <span className="text-sm text-slate-400">—</span> : null}
            {opts.map((o) => (
              <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-mist">
                <input type="checkbox" name={key} value={o.id} defaultChecked={sel.has(o.id)} className="accent-ocean-600" />{o.label}
              </label>
            ))}
          </div>
        );
      }
      default:
        return <input {...common} type="text" defaultValue={(v as string) ?? ""} className={cn("input", f.readOnly && "bg-mist")} readOnly={f.readOnly} required={f.required} />;
    }
  };

  const errorText = (key: string) => errs[key]
    ? <p id={`${key}-err`} className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600"><AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />{lbl(errs[key], locale)}</p>
    : null;

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          {backHref ? <Link href={backHref} className="rounded-xl border border-line bg-white p-2 hover:border-ocean-500" aria-label={d.common.back}><Back className="h-5 w-5" /></Link> : null}
          <h1 className="text-2xl font-extrabold">{title}</h1>
          {record.is_demo ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{d.common.demo}</span> : null}
        </div>
        <button type="submit" className="btn-ocean" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          {pending ? d.common.saving : d.common.save}
        </button>
      </div>

      {state.message && !state.ok ? (
        <p className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />{lbl(state.message, locale)}
        </p>
      ) : null}

      <div className="card divide-y divide-line">
        {groupFields(fields).map((g, gi) => (
          <fieldset key={gi} className="p-5 sm:p-6">
            {g.title ? <legend className="sr-only">{lbl(g.title, locale)}</legend> : null}
            {g.title ? <h2 className="mb-5 text-sm font-extrabold uppercase tracking-wide text-ocean-700">{lbl(g.title, locale)}</h2> : null}
            <div className="grid gap-5 md:grid-cols-2">
              {g.fields.map((f) => (
                <Fragment key={f.name}>
                  {f.bi ? (
                    <div className="md:col-span-2">
                      <p className="label">{lbl(f.label, locale)} {f.required ? <span className="text-red-500">*</span> : null}</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        {(["ar", "en"] as const).map((lang) => (
                          <div key={lang}>
                            <label htmlFor={`${f.name}_${lang}`} className="mb-1 inline-flex items-center gap-1.5 rounded-md bg-mist px-2 py-0.5 text-[11px] font-bold text-slate-500">
                              {lang === "ar" ? `🇸🇦 ${d.common.arabic}` : `🇬🇧 ${d.common.english}`}
                            </label>
                            {renderInput(f, `${f.name}_${lang}`, lang)}
                            {errorText(`${f.name}_${lang}`)}
                          </div>
                        ))}
                      </div>
                      {f.help ? <p className="mt-1.5 text-xs text-slate-400">{lbl(f.help, locale)}</p> : null}
                    </div>
                  ) : (
                    <div className={cn((f.full || ["textarea", "image", "images", "multi", "days", "video", "icon"].includes(f.type)) && "md:col-span-2")}>
                      {f.type !== "boolean" ? (
                        <label htmlFor={f.name} className="label">{lbl(f.label, locale)} {f.required ? <span className="text-red-500">*</span> : null}</label>
                      ) : null}
                      {renderInput(f, f.name)}
                      {errorText(f.name)}
                      {f.help ? <p className="mt-1.5 text-xs text-slate-400">{lbl(f.help, locale)}</p> : null}
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-ocean" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          {pending ? d.common.saving : d.common.save}
        </button>
      </div>
    </form>
  );
}

function groupFields(fields: Field[]) {
  const groups: { title?: Field["group"]; fields: Field[] }[] = [];
  for (const f of fields) {
    if (f.group || !groups.length) groups.push({ title: f.group, fields: [] });
    groups[groups.length - 1].fields.push(f);
  }
  return groups;
}

function RatingInput({ name, defaultValue }: { name: string; defaultValue: number }) {
  const [v, setV] = useState(defaultValue || 5);
  return (
    <div className="flex items-center gap-1">
      <input type="hidden" name={name} value={v} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => setV(n)} aria-label={`${n}`} aria-pressed={v === n} className="p-0.5">
          <Star className={cn("h-7 w-7", n <= v ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
        </button>
      ))}
    </div>
  );
}

function IconPicker({ name, defaultValue }: { name: string; defaultValue: string }) {
  const [v, setV] = useState(defaultValue);
  return (
    <div>
      <input type="hidden" name={name} value={v} />
      <div className="flex flex-wrap gap-1.5">
        {ICON_NAMES.map((n) => (
          <button key={n} type="button" onClick={() => setV(n)} title={n} aria-label={n} aria-pressed={v === n}
            className={cn("flex h-10 w-10 items-center justify-center rounded-xl border transition", v === n ? "border-ocean-600 bg-ocean-600 text-white" : "border-line bg-white text-navy-700 hover:border-ocean-500")}>
            <Icon name={n} className="h-5 w-5" />
          </button>
        ))}
      </div>
    </div>
  );
}

function VideoInput(props: { id: string; name: string; defaultValue: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) {
  const [v, setV] = useState(props.defaultValue);
  const parsed = parseVideoUrl(v);
  return (
    <div className="space-y-3">
      <input {...props} defaultValue={undefined} value={v} onChange={(e) => setV(e.target.value)} type="url" dir="ltr" className="input" placeholder="https://www.youtube.com/watch?v=…  /  https://vimeo.com/…" />
      {parsed ? (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
          ✓ {parsed.provider === "youtube" ? "YouTube" : "Vimeo"} · ID: <code dir="ltr">{parsed.id}</code>
          {parsed.provider === "youtube" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`https://i.ytimg.com/vi/${parsed.id}/mqdefault.jpg`} alt="" className="ms-auto h-12 rounded-md" />
          ) : null}
        </div>
      ) : v ? <p className="text-xs font-semibold text-amber-600">YouTube / Vimeo URL?</p> : null}
    </div>
  );
}
