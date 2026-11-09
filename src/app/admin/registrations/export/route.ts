import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function csvCell(v: unknown) {
  let s = v == null ? "" : String(v);
  // Neutralise spreadsheet formula injection
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: admin } = await supabase.from("admins").select("role").eq("id", user.id).maybeSingle();
  if (!admin || !["super_admin", "admin"].includes(admin.role as string)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  let q = supabase.from("registrations").select("*").order("created_at", { ascending: false }).limit(10000);
  if (sp.get("status")) q = q.eq("status", sp.get("status")!);
  if (sp.get("course")) q = q.eq("course_id", sp.get("course")!);
  if (sp.get("location")) q = q.eq("location_id", sp.get("location")!);
  if (sp.get("demo") === "1") q = q.eq("is_demo", true);
  if (sp.get("demo") === "0") q = q.eq("is_demo", false);
  const term = (sp.get("q") ?? "").trim().replace(/[%,()]/g, " ").slice(0, 80);
  if (term) q = q.or(`student_name.ilike.%${term}%,parent_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%,reference.ilike.%${term}%`);
  const [{ data: regs, error }, { data: courses }, { data: locs }, { data: scheds }] = await Promise.all([
    q,
    supabase.from("courses").select("id, title_en, title_ar"),
    supabase.from("locations").select("id, name_en, name_ar"),
    supabase.from("schedules").select("id, day_of_week, start_time, end_time"),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = ["Reference", "Status", "Submitted", "Student", "Parent", "Age", "Phone", "Email", "Experience",
    "Course", "Location", "Session", "Preferred day", "Preferred time", "Notes", "Internal notes", "Language", "Demo"];
  const lines = [header.map(csvCell).join(",")];
  for (const r of regs ?? []) {
    const c = courses?.find((x) => x.id === r.course_id);
    const l = locs?.find((x) => x.id === r.location_id);
    const s = scheds?.find((x) => x.id === r.schedule_id);
    lines.push([
      r.reference, r.status, new Date(r.created_at).toISOString(), r.student_name, r.parent_name, r.age, r.phone, r.email,
      r.experience, c ? `${c.title_en} / ${c.title_ar}` : "", l ? `${l.name_en} / ${l.name_ar}` : "",
      s ? `${DAYS[s.day_of_week]} ${String(s.start_time).slice(0, 5)}-${String(s.end_time).slice(0, 5)}` : "",
      r.preferred_day != null ? DAYS[r.preferred_day] : "", r.preferred_time, r.notes, r.internal_notes, r.locale, r.is_demo ? "yes" : "no",
    ].map(csvCell).join(","));
  }
  // BOM so Excel opens UTF-8 Arabic text correctly
  const body = "﻿" + lines.join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registrations-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
