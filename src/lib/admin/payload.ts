import type { Field, L } from "./resources";
import { parseVideoUrl } from "../utils";

export type FieldErrors = Record<string, L>;

const REQ: L = ["هذا الحقل مطلوب.", "This field is required."];
const NUM: L = ["أدخل رقماً صحيحاً.", "Enter a valid number."];
const URLE: L = ["أدخل رابطاً صحيحاً يبدأ بـ https://", "Enter a valid URL starting with https://"];
const EMAIL: L = ["أدخل بريداً إلكترونياً صحيحاً.", "Enter a valid email address."];
const VIDEO: L = ["رابط غير مدعوم. استخدم رابط YouTube أو Vimeo.", "Unsupported link. Use a YouTube or Vimeo URL."];
const SLUG: L = ["أحرف إنجليزية صغيرة وأرقام وشرطات فقط.", "Lowercase letters, numbers and dashes only."];
const TIME: L = ["أدخل وقتاً صحيحاً.", "Enter a valid time."];
const range = (min?: number, max?: number): L => [
  `القيمة يجب أن تكون${min != null ? ` ≥ ${min}` : ""}${max != null ? ` و ≤ ${max}` : ""}.`,
  `Value must be${min != null ? ` ≥ ${min}` : ""}${max != null ? ` and ≤ ${max}` : ""}.`,
];

function isUrl(v: string) {
  if (v.startsWith("/")) return true;
  try { const u = new URL(v); return u.protocol === "https:" || u.protocol === "http:"; } catch { return false; }
}

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
};
const lines = (v: string) => v.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

/**
 * Converts submitted FormData into a DB row according to the resource field
 * definitions, validating on the server. Join-table (multi) values are
 * returned separately.
 */
export function buildPayload(fields: Field[], fd: FormData) {
  const row: Record<string, unknown> = {};
  const joins: Record<string, string[]> = {};
  const errors: FieldErrors = {};

  for (const f of fields) {
    if (f.readOnly) continue;
    const keys = f.bi ? [`${f.name}_ar`, `${f.name}_en`] : [f.name];

    if (f.type === "multi") {
      joins[f.name] = fd.getAll(f.name).map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x));
      continue;
    }
    if (f.type === "boolean") {
      row[f.name] = fd.get(f.name) === "on" || fd.get(f.name) === "true";
      continue;
    }
    if (f.type === "days") {
      row[f.name] = Array.from(new Set(fd.getAll(f.name).map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))).sort();
      continue;
    }

    for (const k of keys) {
      const v = str(fd, k);
      if (!v) {
        if (f.required) errors[k] = REQ;
        row[k] = f.type === "list" || f.type === "images" ? [] : null;
        continue;
      }
      switch (f.type) {
        case "number":
        case "rating": {
          const n = Number(v);
          if (!Number.isFinite(n)) { errors[k] = NUM; break; }
          if ((f.min != null && n < f.min) || (f.max != null && n > f.max)) { errors[k] = range(f.min, f.max); break; }
          row[k] = f.type === "rating" ? Math.round(n) : n;
          break;
        }
        case "list":
          row[k] = lines(v).slice(0, 50);
          break;
        case "images": {
          const urls = lines(v);
          if (urls.some((u) => !isUrl(u))) errors[k] = URLE;
          row[k] = urls.slice(0, 30);
          break;
        }
        case "url":
        case "image":
          if (!isUrl(v)) errors[k] = URLE;
          row[k] = v;
          break;
        case "email":
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) errors[k] = EMAIL;
          row[k] = v.toLowerCase();
          break;
        case "slug":
          if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v)) errors[k] = SLUG;
          row[k] = v;
          break;
        case "time":
          if (!/^\d{2}:\d{2}(:\d{2})?$/.test(v)) errors[k] = TIME;
          row[k] = v;
          break;
        case "select":
          if (f.options && !f.options.some((o) => o.value === v)) errors[k] = REQ;
          row[k] = /^\d+$/.test(v) && f.options?.every((o) => /^\d+$/.test(o.value)) ? Number(v) : v;
          break;
        case "relation":
          row[k] = /^[0-9a-f-]{36}$/i.test(v) ? v : null;
          break;
        case "video": {
          const p = parseVideoUrl(v);
          if (!p) { errors[k] = VIDEO; break; }
          row[k] = v;
          row.provider = p.provider;
          row.provider_video_id = p.id;
          break;
        }
        default:
          row[k] = v.slice(0, 10000);
      }
    }
  }
  return { row, joins, errors };
}
