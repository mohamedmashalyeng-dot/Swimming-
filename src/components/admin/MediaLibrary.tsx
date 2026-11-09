"use client";
import { Copy, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deleteMediaAction, updateMediaAltAction } from "@/app/admin/actions";
import { Modal } from "@/components/ui/Modal";
import { SmartImage } from "@/components/ui/SmartImage";
import { adminDict } from "@/lib/admin/i18n";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Locale, MediaItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { uploadToMedia } from "./ImageField";
import { toast } from "./Toast";

const FOLDERS: { value: string; label: [string, string] }[] = [
  { value: "general", label: ["عام", "General"] },
  { value: "coach", label: ["صور المدرب", "Coach photos"] },
  { value: "courses", label: ["صور الكورسات", "Course images"] },
  { value: "locations", label: ["حمامات السباحة", "Swimming pools"] },
  { value: "thumbnails", label: ["صور الفيديوهات", "Video thumbnails"] },
  { value: "lessons", label: ["الدروس", "Lessons"] },
  { value: "reviews", label: ["الآراء", "Reviews"] },
  { value: "brand", label: ["الهوية", "Brand"] },
];

export function MediaLibrary({ locale, items, folder }: { locale: Locale; items: MediaItem[]; folder: string }) {
  const d = adminDict(locale);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [uploadFolder, setUploadFolder] = useState(folder || "general");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const L = (l: [string, string]) => (locale === "ar" ? l[0] : l[1]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    let ok = 0;
    for (const f of Array.from(files)) {
      try { await uploadToMedia(f, uploadFolder); ok++; } catch (e) { toast(`${f.name}: ${(e as Error).message}`, "error"); }
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    if (ok) { toast(`${d.common.saved} (${ok})`); router.refresh(); }
  };

  // Replace keeps the same URL by overwriting the storage object.
  const replace = async (file: File | undefined) => {
    if (!file || !selected) return;
    setBusy(true);
    const sb = createSupabaseBrowserClient();
    const { error } = await sb.storage.from(selected.bucket).update(selected.path, file, { contentType: file.type, cacheControl: "60", upsert: true });
    if (!error) await sb.from("media").update({ size_bytes: file.size, mime_type: file.type, file_name: file.name }).eq("id", selected.id);
    setBusy(false);
    if (replaceRef.current) replaceRef.current.value = "";
    if (error) toast(error.message, "error");
    else { toast(d.common.saved); setSelected(null); router.refresh(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-extrabold">{d.media.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{items.length} · {d.media.hint}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)} className="input w-auto py-2.5" aria-label={d.media.folder}>
            {FOLDERS.map((f) => <option key={f.value} value={f.value}>{L(f.label)}</option>)}
          </select>
          <button type="button" className="btn-ocean" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" aria-hidden="true" />}{busy ? d.common.uploading : d.media.upload}
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => upload(e.target.files)} />
        </div>
      </div>

      <div
        className="rounded-3xl border-2 border-dashed border-line bg-white p-6 text-center text-sm text-slate-500"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}
      >
        <Upload className="mx-auto mb-2 h-6 w-6 text-slate-400" aria-hidden="true" />
        {locale === "ar" ? "اسحب الصور وأفلتها هنا" : "Drag & drop images here"}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/media" className="filter-chip" aria-pressed={!folder}>{d.common.all}</Link>
        {FOLDERS.map((f) => <Link key={f.value} href={`/admin/media?folder=${f.value}`} className="filter-chip" aria-pressed={folder === f.value}>{L(f.label)}</Link>)}
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">{d.media.empty}</div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => setSelected(m)} className="card card-hover block w-full overflow-hidden text-start">
                <span className="relative block aspect-square bg-mist">
                  <SmartImage src={m.url} alt={m.alt_en ?? ""} fill sizes="240px" className="object-cover" />
                </span>
                <span className="block truncate px-3 pt-2 text-xs font-semibold">{m.file_name}</span>
                <span className="block px-3 pb-2 text-[11px] text-slate-400">{L(FOLDERS.find((f) => f.value === m.folder)?.label ?? ["", ""])} · {m.size_bytes ? `${Math.round(m.size_bytes / 1024)} KB` : ""}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.file_name} size="lg" closeLabel={d.common.close}>
        {selected ? (
          <MediaDetails key={selected.id} m={selected} locale={locale} busy={busy || pending}
            onReplace={() => replaceRef.current?.click()} onDelete={() => setConfirm(true)}
            onSaveAlt={(ar, en) => start(async () => { const r = await updateMediaAltAction(selected.id, ar, en); if (r.ok) { toast(d.common.saved); router.refresh(); } else toast(d.common.error, "error"); })} />
        ) : null}
      </Modal>
      <input ref={replaceRef} type="file" accept="image/*" className="hidden" onChange={(e) => replace(e.target.files?.[0])} />
      <ConfirmDialog open={confirm} title={d.common.confirmDelete} body={`${d.common.confirmDeleteBody} ${d.media.inUseWarning}`} confirmLabel={d.common.yes}
        cancelLabel={d.common.cancel} pending={pending} onClose={() => setConfirm(false)}
        onConfirm={() => start(async () => {
          if (!selected) return;
          const r = await deleteMediaAction(selected.id);
          setConfirm(false);
          if (r.ok) { toast(d.common.deleted); setSelected(null); router.refresh(); } else toast(d.common.error, "error");
        })} />
    </div>
  );
}

function MediaDetails({ m, locale, busy, onReplace, onDelete, onSaveAlt }: {
  m: MediaItem; locale: Locale; busy: boolean; onReplace: () => void; onDelete: () => void; onSaveAlt: (ar: string, en: string) => void;
}) {
  const d = adminDict(locale);
  const [ar, setAr] = useState(m.alt_ar ?? "");
  const [en, setEn] = useState(m.alt_en ?? "");
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid gap-5 p-5 md:grid-cols-2">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-mist">
        <SmartImage src={m.url} alt={m.alt_en ?? ""} fill sizes="400px" className="object-contain" />
      </div>
      <div className="space-y-4">
        <div>
          <span className="label">URL</span>
          <div className="flex gap-2">
            <input readOnly value={m.url} dir="ltr" className="input py-2 text-xs" onFocus={(e) => e.target.select()} />
            <button type="button" className="btn-outline shrink-0 px-3 py-2 text-xs" onClick={async () => { await navigator.clipboard.writeText(m.url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />{copied ? d.media.copied : d.media.copy}
            </button>
          </div>
        </div>
        <label className="block"><span className="label">{d.media.alt} (AR)</span><input value={ar} onChange={(e) => setAr(e.target.value)} className="input py-2" dir="rtl" /></label>
        <label className="block"><span className="label">{d.media.alt} (EN)</span><input value={en} onChange={(e) => setEn(e.target.value)} className="input py-2" dir="ltr" /></label>
        <button type="button" className="btn-ocean w-full py-2.5" disabled={busy} onClick={() => onSaveAlt(ar, en)}>{d.common.save}</button>
        <div className="flex gap-2 border-t border-line pt-4">
          <button type="button" className={cn("btn-outline flex-1 px-3 py-2 text-xs")} disabled={busy} onClick={onReplace}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />{d.media.replace}
          </button>
          <button type="button" className="btn-outline flex-1 px-3 py-2 text-xs text-red-600" disabled={busy} onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />{d.common.delete}
          </button>
        </div>
      </div>
    </div>
  );
}
