"use client";
import { ImagePlus, Library, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { SmartImage } from "@/components/ui/SmartImage";
import { adminDict } from "@/lib/admin/i18n";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Locale, MediaItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "./Toast";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml";
const MAX = 10 * 1024 * 1024;

/** Uploads a file to the public "media" bucket and records it in the media table. */
export async function uploadToMedia(file: File, folder: string): Promise<MediaItem> {
  if (!ACCEPT.split(",").includes(file.type)) throw new Error("Unsupported file type");
  if (file.size > MAX) throw new Error("File is larger than 10 MB");
  const sb = createSupabaseBrowserClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const safe = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "image";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safe}.${ext}`;
  const { error: upErr } = await sb.storage.from("media").upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (upErr) throw new Error(upErr.message);
  const { data: pub } = sb.storage.from("media").getPublicUrl(path);
  const { data: { user } } = await sb.auth.getUser();
  const { data, error } = await sb.from("media").insert({
    bucket: "media", path, url: pub.publicUrl, file_name: file.name, mime_type: file.type, size_bytes: file.size,
    folder, uploaded_by: user?.id ?? null,
  }).select("*").single();
  if (error) throw new Error(error.message);
  return data as MediaItem;
}

export function MediaPicker({ open, onClose, onPick, locale }: { open: boolean; onClose: () => void; onPick: (url: string) => void; locale: Locale }) {
  const d = adminDict(locale);
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    const { data } = await createSupabaseBrowserClient().from("media").select("*").order("created_at", { ascending: false }).limit(200);
    setItems((data ?? []) as MediaItem[]);
    setLoading(false);
  };
  if (open && items === null && !loading) void load();
  return (
    <Modal open={open} onClose={onClose} title={d.media.title} size="xl" closeLabel={d.common.close}>
      <div className="p-5">
        {loading ? <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-ocean-600" /></div> : null}
        {items && items.length === 0 ? <p className="p-10 text-center text-slate-500">{d.media.empty}</p> : null}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {items?.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => { onPick(m.url); onClose(); }}
                className="group block w-full overflow-hidden rounded-xl border border-line text-start transition hover:border-ocean-500">
                <span className="relative block aspect-square bg-mist">
                  <SmartImage src={m.url} alt={m.alt_en ?? m.file_name} fill sizes="200px" className="object-cover" />
                </span>
                <span className="block truncate px-2 py-1.5 text-[11px] text-slate-500">{m.file_name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}

export function ImageField({
  name, defaultValue, folder, locale, invalid, describedBy,
}: { name: string; defaultValue: string; folder: string; locale: Locale; invalid?: boolean; describedBy?: string }) {
  const d = adminDict(locale);
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      const m = await uploadToMedia(f, folder);
      setUrl(m.url);
      toast(d.common.saved);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className={cn("relative h-28 w-full shrink-0 overflow-hidden rounded-xl border border-line bg-mist sm:w-40", !url && "flex items-center justify-center")}>
        {url ? <SmartImage src={url} alt="" fill sizes="160px" className="object-cover" /> : <ImagePlus className="h-8 w-8 text-slate-300" aria-hidden="true" />}
        {busy ? <span className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 className="h-6 w-6 animate-spin text-ocean-600" /></span> : null}
      </div>
      <div className="flex-1 space-y-2">
        <input name={name} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" dir="ltr"
          className="input py-2.5 text-xs" aria-invalid={invalid} aria-describedby={describedBy} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-outline px-3 py-2 text-xs" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />{busy ? d.common.uploading : d.common.upload}
          </button>
          <button type="button" className="btn-outline px-3 py-2 text-xs" onClick={() => setPicker(true)}>
            <Library className="h-3.5 w-3.5" aria-hidden="true" />{d.common.library}
          </button>
          {url ? (
            <button type="button" className="btn-outline px-3 py-2 text-xs text-red-600" onClick={() => setUrl("")}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />{d.common.remove}
            </button>
          ) : null}
        </div>
        <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      <MediaPicker open={picker} onClose={() => setPicker(false)} onPick={setUrl} locale={locale} />
    </div>
  );
}

export function GalleryField({ name, defaultValue, folder, locale }: { name: string; defaultValue: string[]; folder: string; locale: Locale }) {
  const d = adminDict(locale);
  const [urls, setUrls] = useState<string[]>(defaultValue);
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        const m = await uploadToMedia(f, folder);
        setUrls((u) => [...u, m.url]);
      }
    } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  };
  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={urls.join("\n")} />
      {urls.length ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {urls.map((u, i) => (
            <li key={u + i} className="group relative aspect-video overflow-hidden rounded-lg border border-line bg-mist">
              <SmartImage src={u} alt="" fill sizes="160px" className="object-cover" />
              <button type="button" onClick={() => setUrls((x) => x.filter((_, j) => j !== i))} aria-label={d.common.remove}
                className="absolute end-1 top-1 rounded-md bg-white/90 p-1 text-red-600 shadow"><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-outline px-3 py-2 text-xs" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" aria-hidden="true" />}{d.common.upload}
        </button>
        <button type="button" className="btn-outline px-3 py-2 text-xs" onClick={() => setPicker(true)}>
          <Library className="h-3.5 w-3.5" aria-hidden="true" />{d.common.library}
        </button>
      </div>
      <input ref={fileRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
      <MediaPicker open={picker} onClose={() => setPicker(false)} onPick={(u) => setUrls((x) => [...x, u])} locale={locale} />
    </div>
  );
}
