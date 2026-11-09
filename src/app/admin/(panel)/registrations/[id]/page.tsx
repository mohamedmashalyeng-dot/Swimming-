import { ArrowLeft, ArrowRight, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RegistrationEditor } from "@/components/admin/RegistrationControls";
import { WhatsappIcon } from "@/components/ui/SocialIcons";
import { getAdminLocale, isManagerRole, requireAdmin } from "@/lib/admin/auth";
import { adminDict } from "@/lib/admin/i18n";
import { DAYS, EXPERIENCE, lbl } from "@/lib/admin/resources";
import type { Registration } from "@/lib/types";
import { formatTime, whatsappLink } from "@/lib/utils";

export default async function RegistrationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, admin } = await requireAdmin();
  const locale = await getAdminLocale();
  const d = adminDict(locale);
  if (!isManagerRole(admin.role)) return <p className="card p-8 text-center text-slate-500">{d.forbidden}</p>;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await supabase.from("registrations").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const r = data as Registration;
  const [{ data: course }, { data: loc }, { data: sched }] = await Promise.all([
    r.course_id ? supabase.from("courses").select("title_ar, title_en").eq("id", r.course_id).maybeSingle() : Promise.resolve({ data: null }),
    r.location_id ? supabase.from("locations").select("name_ar, name_en").eq("id", r.location_id).maybeSingle() : Promise.resolve({ data: null }),
    r.schedule_id ? supabase.from("schedules").select("day_of_week, start_time, end_time, capacity, booked_count").eq("id", r.schedule_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const Back = locale === "ar" ? ArrowRight : ArrowLeft;
  const wa = whatsappLink(r.phone);
  const rows: [string, React.ReactNode][] = [
    [d.regs.student, <strong key="n">{r.student_name}</strong>],
    [d.regs.parent, r.parent_name ?? "—"],
    [d.regs.age, r.age],
    [d.regs.phone, <span key="p" dir="ltr">{r.phone}</span>],
    [d.regs.email, r.email ?? "—"],
    [d.regs.experience, lbl(EXPERIENCE.find((e) => e.value === r.experience)?.label ?? ["", ""], locale)],
    [d.regs.course, course ? (locale === "ar" ? course.title_ar : course.title_en) : "—"],
    [d.regs.location, loc ? (locale === "ar" ? loc.name_ar : loc.name_en) : "—"],
    [d.regs.day, r.preferred_day != null ? lbl(DAYS[r.preferred_day], locale) : "—"],
    [d.regs.time, d.regs.times[(r.preferred_time ?? "any") as keyof typeof d.regs.times]],
    [d.regs.session, sched ? <span key="s" dir="ltr">{lbl(DAYS[sched.day_of_week], locale)} {formatTime(sched.start_time, locale)}–{formatTime(sched.end_time, locale)} · {sched.booked_count}/{sched.capacity}</span> : "—"],
    [d.regs.created, new Date(r.created_at).toLocaleString(locale === "ar" ? "ar-EG" : "en-GB")],
    ["Locale", r.locale.toUpperCase()],
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/registrations" className="rounded-xl border border-line bg-white p-2 hover:border-ocean-500" aria-label={d.common.back}><Back className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-extrabold">{r.student_name}</h1>
        <span className="rounded-full bg-mist px-3 py-1 font-mono text-xs font-bold" dir="ltr">#{r.reference}</span>
        {r.is_demo ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{d.common.demo}</span> : null}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <dl className="card divide-y divide-line">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[150px_1fr] gap-4 px-5 py-3 text-sm">
                <dt className="font-semibold text-slate-500">{k}</dt><dd>{v}</dd>
              </div>
            ))}
          </dl>
          {r.notes ? (
            <div className="card p-5"><h2 className="label">{d.regs.notes}</h2><p className="whitespace-pre-line text-sm text-slate-700">{r.notes}</p></div>
          ) : null}
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${r.phone}`} className="btn-outline px-4 py-2"><Phone className="h-4 w-4" aria-hidden="true" />{d.regs.call}</a>
            {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline px-4 py-2 text-emerald-700"><WhatsappIcon className="h-4 w-4" />{d.regs.whatsapp}</a> : null}
            {r.email ? <a href={`mailto:${r.email}`} className="btn-outline px-4 py-2"><Mail className="h-4 w-4" aria-hidden="true" />Email</a> : null}
          </div>
          <RegistrationEditor id={r.id} status={r.status} notes={r.internal_notes ?? ""} locale={locale} />
          <p className="text-xs text-slate-500">{d.regs.seatNote}</p>
        </div>
      </div>
    </div>
  );
}
