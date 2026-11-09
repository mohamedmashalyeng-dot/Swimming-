import {
  CalendarClock, CheckCircle2, ClipboardList, Clock, GraduationCap, Inbox, MapPin, PlayCircle, Star, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { RegistrationsChart, StatusPie } from "@/components/admin/Charts";
import { Stars } from "@/components/ui/Stars";
import { getAdminLocale, isManagerRole, requireAdmin } from "@/lib/admin/auth";
import { adminDict } from "@/lib/admin/i18n";
import { DAYS, lbl, REG_STATUSES, REVIEW_STATUSES } from "@/lib/admin/resources";
import type { Registration, Review, Schedule } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils";

export const metadata = { title: "Overview" };

interface Stats {
  registrations_total: number; registrations_new: number; registrations_pending: number; registrations_approved: number;
  courses: number; videos: number; locations: number; reviews: number; reviews_pending: number; students: number; sessions: number;
  by_status: Record<string, number>; by_day: { day: string; count: number }[];
  by_course: { title_ar: string; title_en: string; count: number }[];
}

export default async function Overview() {
  const { supabase, admin } = await requireAdmin();
  const locale = await getAdminLocale();
  const d = adminDict(locale);
  const manager = isManagerRole(admin.role);

  const [{ data: statsRaw }, { data: recent }, { data: reviews }, { data: sessions }, { data: courses }, { data: locs }, { count: demoCount }] = await Promise.all([
    supabase.rpc("dashboard_stats"),
    manager ? supabase.from("registrations").select("*").order("created_at", { ascending: false }).limit(6) : Promise.resolve({ data: [] }),
    supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("schedules").select("*").eq("status", "open").eq("is_published", true),
    supabase.from("courses").select("id, title_ar, title_en"),
    supabase.from("locations").select("id, name_ar, name_en"),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("is_demo", true),
  ]);
  const s = statsRaw as Stats | null;

  // Upcoming sessions: next 7 days ordered from today (0=Saturday … 6=Friday)
  const jsDay = new Date().getDay(); // 0=Sunday
  const today = (jsDay + 1) % 7;
  const nowHM = new Date().toTimeString().slice(0, 5);
  const upcoming = ((sessions ?? []) as Schedule[])
    .map((x) => ({ ...x, offset: (x.day_of_week - today + 7) % 7 }))
    .filter((x) => x.offset > 0 || x.start_time.slice(0, 5) >= nowHM)
    .sort((a, b) => a.offset - b.offset || a.start_time.localeCompare(b.start_time))
    .slice(0, 6);
  const cName = (id: string | null) => { const c = courses?.find((x) => x.id === id); return c ? (locale === "ar" ? c.title_ar : c.title_en) : "—"; };
  const lName = (id: string | null) => { const c = locs?.find((x) => x.id === id); return c ? (locale === "ar" ? c.name_ar : c.name_en) : "—"; };

  const cards = [
    manager && { label: d.overview.totalRegs, value: s?.registrations_total, icon: ClipboardList, href: "/admin/registrations", tone: "bg-ocean-100 text-ocean-700" },
    manager && { label: d.overview.newRegs, value: s?.registrations_new, icon: Inbox, href: "/admin/registrations?status=new", tone: "bg-sky-50 text-sky-700" },
    manager && { label: d.overview.approved, value: s?.registrations_approved, icon: CheckCircle2, href: "/admin/registrations?status=approved", tone: "bg-emerald-50 text-emerald-700" },
    manager && { label: d.overview.pending, value: s?.registrations_pending, icon: Clock, href: "/admin/registrations?status=pending", tone: "bg-amber-50 text-amber-700" },
    { label: d.overview.courses, value: s?.courses, icon: GraduationCap, href: "/admin/courses", tone: "bg-violet-50 text-violet-700" },
    { label: d.overview.videos, value: s?.videos, icon: PlayCircle, href: "/admin/videos", tone: "bg-rose-50 text-rose-700" },
    { label: d.overview.locations, value: s?.locations, icon: MapPin, href: "/admin/locations", tone: "bg-turquoise-100 text-turquoise-600" },
    { label: d.overview.reviews, value: s?.reviews, icon: Star, href: "/admin/reviews", tone: "bg-yellow-50 text-yellow-700" },
  ].filter(Boolean) as { label: string; value?: number; icon: typeof Star; href: string; tone: string }[];

  const byDay = (s?.by_day ?? []).map((x) => ({
    day: new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "short" }).format(new Date(x.day)),
    count: x.count,
  }));
  const pie = REG_STATUSES.map((st) => ({ key: st.value, name: lbl(st.label, locale), value: s?.by_status?.[st.value] ?? 0 })).filter((x) => x.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-slate-500">{d.overview.welcome}</p>
        <h1 className="text-2xl font-extrabold">{admin.full_name || admin.email}</h1>
      </div>

      {demoCount ? (
        <p className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{d.overview.demoBanner}
        </p>
      ) : null}
      {s?.reviews_pending ? (
        <Link href="/admin/reviews?status=pending" className="flex items-center gap-2 rounded-2xl bg-navy-900 p-4 text-sm font-semibold text-white hover:bg-navy-800">
          <Star className="h-4 w-4 text-turquoise-500" aria-hidden="true" />{s.reviews_pending} {d.overview.pendingReviews}
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card card-hover p-5">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.tone}`}><c.icon className="h-5 w-5" aria-hidden="true" /></span>
            <p className="mt-4 font-display text-3xl font-extrabold">{c.value ?? 0}</p>
            <p className="text-xs font-semibold text-slate-500">{c.label}</p>
          </Link>
        ))}
      </div>

      {manager ? (
        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <section className="card p-5">
            <h2 className="mb-4 font-extrabold">{d.overview.regsChart}</h2>
            <RegistrationsChart data={byDay} label={d.nav.registrations} />
          </section>
          <section className="card p-5">
            <h2 className="mb-4 font-extrabold">{d.overview.statusChart}</h2>
            {pie.length ? <StatusPie data={pie} /> : <p className="text-sm text-slate-500">{d.common.empty}</p>}
            {s?.by_course?.length ? (
              <>
                <h3 className="mb-3 mt-6 text-sm font-extrabold">{d.overview.byCourse}</h3>
                <ul className="space-y-2">
                  {s.by_course.slice(0, 5).map((c) => {
                    const max = s.by_course[0].count || 1;
                    return (
                      <li key={c.title_en} className="text-xs">
                        <div className="flex justify-between font-semibold"><span>{locale === "ar" ? c.title_ar : c.title_en}</span><span>{c.count}</span></div>
                        <div className="mt-1 h-1.5 rounded-full bg-mist"><div className="h-full rounded-full bg-turquoise-500" style={{ width: `${(c.count / max) * 100}%` }} /></div>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : null}
          </section>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        {manager ? (
          <section className="card overflow-hidden xl:col-span-2">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-extrabold">{d.overview.recentRegs}</h2>
              <Link href="/admin/registrations" className="text-xs font-bold text-ocean-600 hover:underline">{d.overview.viewAll}</Link>
            </div>
            <ul className="divide-y divide-line">
              {((recent ?? []) as Registration[]).map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/registrations/${r.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-mist/60">
                    <span>
                      <span className="block font-bold">{r.student_name}</span>
                      <span className="block text-xs text-slate-500">{cName(r.course_id)} · {formatDate(r.created_at, locale)}</span>
                    </span>
                    <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-bold">{lbl(REG_STATUSES.find((x) => x.value === r.status)!.label, locale)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="flex items-center gap-2 font-extrabold"><CalendarClock className="h-4 w-4 text-turquoise-600" aria-hidden="true" />{d.overview.upcoming}</h2>
            <Link href="/admin/schedules" className="text-xs font-bold text-ocean-600 hover:underline">{d.overview.viewAll}</Link>
          </div>
          <ul className="divide-y divide-line">
            {upcoming.map((x) => (
              <li key={x.id} className="px-5 py-3 text-sm">
                <p className="font-bold">{cName(x.course_id)}</p>
                <p className="text-xs text-slate-500">
                  {lbl(DAYS[x.day_of_week], locale)} · <span dir="ltr">{formatTime(x.start_time, locale)}</span> · {lName(x.location_id)} · {x.booked_count}/{x.capacity}
                </p>
              </li>
            ))}
          </ul>
        </section>
        <section className={`card overflow-hidden ${manager ? "xl:col-span-3" : "xl:col-span-2"}`}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-extrabold">{d.overview.latestReviews}</h2>
            <Link href="/admin/reviews" className="text-xs font-bold text-ocean-600 hover:underline">{d.overview.viewAll}</Link>
          </div>
          <ul className="grid divide-y divide-line md:grid-cols-2 md:divide-y-0">
            {((reviews ?? []) as Review[]).map((r) => (
              <li key={r.id} className="border-line px-5 py-4 md:border-b">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">{r.customer_name}</span><Stars value={r.rating} />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{(locale === "ar" ? r.text_ar : r.text_en) || r.text_ar || r.text_en}</p>
                <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${r.status === "approved" ? "bg-emerald-50 text-emerald-700" : r.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{lbl(REVIEW_STATUSES.find((x) => x.value === r.status)?.label ?? ["", ""], locale)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
