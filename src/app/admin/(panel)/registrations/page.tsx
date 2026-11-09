import { Download, Search } from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/admin/Pagination";
import { RegistrationQuickStatus } from "@/components/admin/RegistrationControls";
import { getAdminLocale, isManagerRole, requireAdmin } from "@/lib/admin/auth";
import { adminDict } from "@/lib/admin/i18n";
import { DAYS, EXPERIENCE, lbl, REG_STATUSES } from "@/lib/admin/resources";
import type { Registration } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Registrations" };
const PAGE_SIZE = 20;

export default async function RegistrationsPage({ searchParams }: {
  searchParams: Promise<{ q?: string; status?: string; course?: string; location?: string; page?: string; demo?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, admin } = await requireAdmin();
  const locale = await getAdminLocale();
  const d = adminDict(locale);
  if (!isManagerRole(admin.role)) return <p className="card p-8 text-center text-slate-500">{d.forbidden}</p>;

  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").trim().replace(/[%,()]/g, " ").slice(0, 80);
  let query = supabase.from("registrations").select("*", { count: "exact" });
  if (q) query = query.or(`student_name.ilike.%${q}%,parent_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,reference.ilike.%${q}%`);
  if (sp.status) query = query.eq("status", sp.status);
  if (sp.course) query = query.eq("course_id", sp.course);
  if (sp.location) query = query.eq("location_id", sp.location);
  if (sp.demo === "1") query = query.eq("is_demo", true);
  if (sp.demo === "0") query = query.eq("is_demo", false);
  const { data, count } = await query.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const rows = (data ?? []) as Registration[];

  const [{ data: courses }, { data: locations }, { data: counts }] = await Promise.all([
    supabase.from("courses").select("id, title_ar, title_en").order("sort_order"),
    supabase.from("locations").select("id, name_ar, name_en").order("sort_order"),
    supabase.from("registrations").select("status"),
  ]);
  const byStatus = (counts ?? []).reduce<Record<string, number>>((a, r) => ({ ...a, [r.status as string]: (a[r.status as string] ?? 0) + 1 }), {});
  const cName = (id: string | null) => { const c = courses?.find((x) => x.id === id); return c ? (locale === "ar" ? c.title_ar : c.title_en) : "—"; };
  const lName = (id: string | null) => { const c = locations?.find((x) => x.id === id); return c ? (locale === "ar" ? c.name_ar : c.name_en) : "—"; };
  const total = count ?? 0;
  const exportQs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "page") as [string, string][]).toString();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-extrabold">{d.nav.registrations}</h1>
          <p className="mt-1 text-sm text-slate-500">{total} {d.common.total} · {d.regs.seatNote}</p>
        </div>
        <a href={`/admin/registrations/export${exportQs ? `?${exportQs}` : ""}`} className="btn-ocean"><Download className="h-4 w-4" aria-hidden="true" />{d.common.exportCsv}</a>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/registrations" className="filter-chip" aria-pressed={!sp.status}>{d.common.all} ({counts?.length ?? 0})</Link>
        {REG_STATUSES.map((s) => (
          <Link key={s.value} href={`/admin/registrations?status=${s.value}`} className="filter-chip" aria-pressed={sp.status === s.value}>
            {lbl(s.label, locale)} ({byStatus[s.value] ?? 0})
          </Link>
        ))}
      </div>

      <form method="get" className="card grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-[1fr_200px_200px_140px_auto]">
        {sp.status ? <input type="hidden" name="status" value={sp.status} /> : null}
        <label className="relative">
          <span className="sr-only">{d.common.search}</span>
          <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input name="q" defaultValue={sp.q ?? ""} placeholder={d.common.search} className="input py-2.5 ps-10" />
        </label>
        <select name="course" defaultValue={sp.course ?? ""} className="input py-2.5" aria-label={d.regs.course}>
          <option value="">{d.regs.course}: {d.common.all}</option>
          {courses?.map((c) => <option key={c.id} value={c.id}>{locale === "ar" ? c.title_ar : c.title_en}</option>)}
        </select>
        <select name="location" defaultValue={sp.location ?? ""} className="input py-2.5" aria-label={d.regs.location}>
          <option value="">{d.regs.location}: {d.common.all}</option>
          {locations?.map((c) => <option key={c.id} value={c.id}>{locale === "ar" ? c.name_ar : c.name_en}</option>)}
        </select>
        <select name="demo" defaultValue={sp.demo ?? ""} className="input py-2.5" aria-label={d.common.demo}>
          <option value="">{d.common.all}</option>
          <option value="1">{d.common.demo}</option>
          <option value="0">{locale === "ar" ? "حقيقي" : "Real"}</option>
        </select>
        <button className="btn-outline px-5 py-2.5" type="submit">{d.common.filter}</button>
      </form>

      {rows.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">{q || sp.status ? d.common.emptySearch : d.common.empty}</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-mist text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-start">{d.regs.student}</th>
                  <th className="px-4 py-3 text-start">{d.regs.phone}</th>
                  <th className="px-4 py-3 text-start">{d.regs.course}</th>
                  <th className="px-4 py-3 text-start">{d.regs.day}</th>
                  <th className="px-4 py-3 text-start">{d.regs.experience}</th>
                  <th className="px-4 py-3 text-start">{d.regs.created}</th>
                  <th className="px-4 py-3 text-start">{d.regs.status}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-mist/60">
                    <td className="px-4 py-3">
                      <Link href={`/admin/registrations/${r.id}`} className="font-bold text-navy-900 hover:text-ocean-600">{r.student_name}</Link>
                      <span className="block text-xs text-slate-400">
                        #{r.reference} · {d.regs.age}: {r.age}{r.parent_name ? ` · ${r.parent_name}` : ""}
                        {r.is_demo ? <span className="ms-1 rounded bg-amber-50 px-1 text-[10px] font-bold text-amber-700">{d.common.demo}</span> : null}
                      </span>
                    </td>
                    <td className="px-4 py-3" dir="ltr"><a href={`tel:${r.phone}`} className="hover:text-ocean-600">{r.phone}</a></td>
                    <td className="px-4 py-3"><span className="line-clamp-1">{cName(r.course_id)}</span><span className="block text-xs text-slate-400">{lName(r.location_id)}</span></td>
                    <td className="px-4 py-3">{r.preferred_day != null ? lbl(DAYS[r.preferred_day], locale) : "—"}<span className="block text-xs text-slate-400">{d.regs.times[(r.preferred_time ?? "any") as keyof typeof d.regs.times]}</span></td>
                    <td className="px-4 py-3">{lbl(EXPERIENCE.find((e) => e.value === r.experience)?.label ?? ["", ""], locale)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(r.created_at, locale)}</td>
                    <td className="px-4 py-3"><RegistrationQuickStatus id={r.id} status={r.status} locale={locale} /></td>
                    <td className="px-4 py-3 text-end"><Link href={`/admin/registrations/${r.id}`} className="text-xs font-bold text-ocean-600 hover:underline">{d.common.details}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Pagination base="/admin/registrations" page={page} pages={Math.max(1, Math.ceil(total / PAGE_SIZE))} params={sp} locale={locale} />
    </div>
  );
}
