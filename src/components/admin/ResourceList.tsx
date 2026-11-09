import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SmartImage } from "@/components/ui/SmartImage";
import { Stars } from "@/components/ui/Stars";
import { getAdminLocale, isManagerRole, requireAdmin } from "@/lib/admin/auth";
import { adminDict } from "@/lib/admin/i18n";
import { DAYS, getResource, lbl, type Column, type Resource } from "@/lib/admin/resources";
import type { Locale } from "@/lib/types";
import { cn, formatDate, formatTime, videoThumbnail } from "@/lib/utils";
import { Pagination } from "./Pagination";
import { RowActions } from "./RowActions";

const PAGE_SIZE = 20;
type Row = Record<string, unknown> & { id: string };

export async function ResourceList({
  resourceKey, searchParams,
}: { resourceKey: string; searchParams: { q?: string; page?: string; demo?: string; status?: string } }) {
  const res = getResource(resourceKey);
  if (!res) notFound();
  const { supabase, admin } = await requireAdmin();
  const locale = await getAdminLocale();
  const d = adminDict(locale);
  if (res.managerOnly && !isManagerRole(admin.role)) return <p className="card p-8 text-center text-slate-500">{d.forbidden}</p>;

  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? "").trim().replace(/[%,()]/g, " ").slice(0, 80);

  let query = supabase.from(res.table).select("*", { count: "exact" });
  if (q && res.search.length) query = query.or(res.search.map((c) => `${c}.ilike.%${q}%`).join(","));
  if (searchParams.demo === "1") query = query.eq("is_demo", true);
  if (searchParams.demo === "0") query = query.eq("is_demo", false);
  const statusCol = res.columns.find((c) => c.kind === "status");
  if (statusCol && searchParams.status) query = query.eq(statusCol.field, searchParams.status);
  for (const o of res.orderBy) query = query.order(o.column, { ascending: o.ascending });
  query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data, count, error } = await query;
  const rows = (data ?? []) as Row[];

  // Resolve relation labels
  const relLabels: Record<string, Record<string, string>> = {};
  for (const c of res.columns.filter((c) => c.kind === "relation" && c.relation)) {
    const ids = Array.from(new Set(rows.map((r) => r[c.field]).filter(Boolean))) as string[];
    if (!ids.length) continue;
    const { data: rel } = await supabase.from(c.relation!.table).select(`id, ${c.relation!.label}_ar, ${c.relation!.label}_en`).in("id", ids);
    relLabels[c.field] = Object.fromEntries(((rel ?? []) as unknown as Row[]).map((r) => [r.id, String(r[`${c.relation!.label}_${locale}`] ?? r[`${c.relation!.label}_ar`] ?? "")]));
  }

  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const base = `/admin/${resourceKey === "sections" ? "content" : resourceKey}`;
  const editBase = `/admin/${resourceKey}`;
  const firstSort = rows[0];
  const reorderable = res.canReorder && !q && !searchParams.demo && !searchParams.status;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-extrabold">{lbl(res.title, locale)}</h1>
          <p className="mt-1 text-sm text-slate-500">{total} {d.common.total}</p>
          {res.description ? <p className="mt-2 max-w-2xl text-sm text-slate-500">{lbl(res.description, locale)}</p> : null}
        </div>
        {res.canCreate ? (
          <Link href={`${editBase}/new`} className="btn-ocean"><Plus className="h-4 w-4" aria-hidden="true" />{d.common.add}</Link>
        ) : null}
      </div>

      <form className="card flex flex-col gap-3 p-3 sm:flex-row" method="get">
        {res.search.length ? (
          <label className="relative flex-1">
            <span className="sr-only">{d.common.search}</span>
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input name="q" defaultValue={searchParams.q ?? ""} placeholder={d.common.search} className="input py-2.5 ps-10" />
          </label>
        ) : <span className="flex-1" />}
        {statusCol ? (
          <select name="status" defaultValue={searchParams.status ?? ""} className="input py-2.5 sm:w-44" aria-label={statusCol.label[locale === "ar" ? 0 : 1]}>
            <option value="">{d.common.all}</option>
            {statusCol.options?.map((o) => <option key={o.value} value={o.value}>{lbl(o.label, locale)}</option>)}
          </select>
        ) : null}
        {res.fields.some((f) => f.name === "is_demo") ? (
          <select name="demo" defaultValue={searchParams.demo ?? ""} className="input py-2.5 sm:w-44" aria-label={d.common.demo}>
            <option value="">{d.common.all}</option>
            <option value="1">{d.common.demo}</option>
            <option value="0">{locale === "ar" ? "حقيقي" : "Real"}</option>
          </select>
        ) : null}
        <button className="btn-outline px-5 py-2.5" type="submit">{d.common.filter}</button>
      </form>

      {error ? <p className="card p-6 text-red-600">{error.message}</p> : null}

      {rows.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          {q || searchParams.demo || searchParams.status ? d.common.emptySearch : d.common.empty}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-mist text-xs font-bold uppercase text-slate-500">
                <tr>
                  {res.columns.map((c) => <th key={c.field} className="px-4 py-3 text-start">{lbl(c.label, locale)}</th>)}
                  <th className="px-4 py-3 text-end">{d.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r, i) => (
                  <tr key={r.id} className="transition hover:bg-mist/60">
                    {res.columns.map((c) => (
                      <td key={c.field} className="px-4 py-3 align-middle">
                        <Cell column={c} row={r} res={res} locale={locale} rel={relLabels[c.field]} demoLabel={d.common.demo} yesNo={d.common.yesNo} />
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      <RowActions
                        locale={locale}
                        resource={resourceKey}
                        id={r.id}
                        editHref={`${editBase}/${r.id}`}
                        published={res.publishField ? (r[res.publishField] as boolean) : undefined}
                        canReorder={reorderable}
                        canDelete={res.canDelete}
                        isFirst={page === 1 && i === 0}
                        isLast={page === pages && i === rows.length - 1}
                        reviewStatus={res.table === "reviews" ? String(r.status) : undefined}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {firstSort ? <Pagination base={base} page={page} pages={pages} params={searchParams} locale={locale} /> : null}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-sky-50 text-sky-700", pending: "bg-amber-50 text-amber-700", approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700", completed: "bg-slate-100 text-slate-700", open: "bg-emerald-50 text-emerald-700",
  closed: "bg-slate-100 text-slate-600", cancelled: "bg-red-50 text-red-700",
};

function Cell({ column: c, row: r, res, locale, rel, demoLabel, yesNo }: {
  column: Column; row: Row; res: Resource; locale: Locale; rel?: Record<string, string>; demoLabel: string; yesNo: string[];
}) {
  const v = r[c.field];
  switch (c.kind) {
    case "image": {
      const src = c.field === "thumbnail" ? videoThumbnail(r as never) : (v as string | null);
      return (
        <span className="relative block h-11 w-16 overflow-hidden rounded-lg bg-navy-900">
          <SmartImage src={src} alt="" fill sizes="64px" className="object-cover" />
        </span>
      );
    }
    case "bi": {
      const main = String(r[`${c.field}_${locale}`] ?? "") || String(r[`${c.field}_${locale === "ar" ? "en" : "ar"}`] ?? "");
      const sub = String(r[`${c.field}_${locale === "ar" ? "en" : "ar"}`] ?? "");
      const isFirstBi = res.columns.find((x) => x.kind === "bi")?.field === c.field;
      return (
        <span className="block max-w-xs">
          <span className="line-clamp-1 font-bold text-navy-900">{main || "—"}</span>
          {sub && sub !== main ? <span className="line-clamp-1 text-xs text-slate-400">{sub}</span> : null}
          {isFirstBi && r.is_demo ? <span className="mt-1 inline-block rounded bg-amber-50 px-1.5 text-[10px] font-bold text-amber-700">{demoLabel}</span> : null}
        </span>
      );
    }
    case "badge":
    case "status": {
      const o = c.options?.find((x) => x.value === String(v));
      return <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", STATUS_COLORS[String(v)] ?? "bg-mist text-navy-700")}>{o ? lbl(o.label, locale) : String(v ?? "—")}</span>;
    }
    case "bool":
      return <span className={cn("inline-block h-2.5 w-2.5 rounded-full", v ? "bg-emerald-500" : "bg-slate-300")} title={yesNo[v ? 1 : 0]} aria-label={yesNo[v ? 1 : 0]} />;
    case "relation":
      return <span className="line-clamp-1">{rel?.[String(v)] ?? "—"}</span>;
    case "day":
      return <span className="font-semibold">{lbl(DAYS[Number(v)] ?? ["", ""], locale)}</span>;
    case "time":
      return <span dir="ltr" className="whitespace-nowrap font-semibold">{formatTime(String(r.start_time), locale)} – {formatTime(String(r.end_time), locale)}</span>;
    case "capacity": {
      const cap = Number(r.capacity), b = Number(r.booked_count);
      return (
        <span className="block w-28">
          <span className="text-xs font-bold" dir="ltr">{b} / {cap}</span>
          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100">
            <span className={cn("block h-full", b >= cap ? "bg-red-500" : b / cap > 0.75 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, (b / cap) * 100)}%` }} />
          </span>
        </span>
      );
    }
    case "rating":
      return <Stars value={Number(v)} />;
    case "date":
      return <span className="whitespace-nowrap text-slate-600">{v ? formatDate(String(v), locale) : "—"}</span>;
    case "number":
      return <span>{v == null ? "—" : String(v)}</span>;
    default: {
      const text = String(v ?? "—");
      return <span className={cn("line-clamp-1", c.field === "full_name" || c.field === "customer_name" ? "font-bold" : "")}>{text}
        {(c.field === "full_name" || c.field === "customer_name" || c.field === "key") && r.is_demo ? <span className="ms-2 rounded bg-amber-50 px-1.5 text-[10px] font-bold text-amber-700">{demoLabel}</span> : null}</span>;
    }
  }
}
