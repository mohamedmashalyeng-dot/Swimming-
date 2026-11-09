"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isManagerRole, requireAdmin } from "@/lib/admin/auth";
import { buildPayload, type FieldErrors } from "@/lib/admin/payload";
import { getResource, SEO_FIELDS, SETTINGS_FIELDS, type L } from "@/lib/admin/resources";
import { ADMIN_LOCALE_COOKIE } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Locale, RegistrationStatus } from "@/lib/types";

export interface FormState { ok?: boolean; message?: L; errors?: FieldErrors; id?: string; ts?: number }

const ERR_GENERIC: L = ["حدث خطأ أثناء الحفظ.", "Something went wrong while saving."];
const ERR_FORBIDDEN: L = ["ليست لديك صلاحية لهذا الإجراء.", "You don't have permission for this action."];
const OK_SAVED: L = ["تم الحفظ بنجاح.", "Saved successfully."];

function dbError(e: { code?: string; message?: string } | null): L {
  if (!e) return ERR_GENERIC;
  if (e.message?.includes("SESSION_FULL")) return ["الحصة مكتملة — لا يمكن تجاوز السعة القصوى.", "The session is full — capacity cannot be exceeded."];
  if (e.message?.includes("schedules_capacity_not_exceeded")) return ["عدد المحجوز لا يمكن أن يتجاوز السعة.", "Booked seats cannot exceed capacity."];
  if (e.message?.includes("schedules_time_order")) return ["وقت النهاية يجب أن يكون بعد وقت البداية.", "End time must be after start time."];
  if (e.message?.includes("coaches_one_primary")) return ["يوجد مدرب رئيسي بالفعل. ألغِ التحديد عنه أولاً.", "There is already a primary coach. Unset it first."];
  if (e.code === "23505") return ["القيمة مستخدمة بالفعل (مثل المعرّف slug).", "This value is already in use (e.g. slug)."];
  if (e.code === "23514") return ["قيمة غير مسموح بها — راجع الحقول.", "A value is not allowed — please check the fields."];
  if (e.code === "42501") return ERR_FORBIDDEN;
  return [`${ERR_GENERIC[0]} (${e.message ?? ""})`, `${ERR_GENERIC[1]} (${e.message ?? ""})`];
}

function revalidateSite() {
  revalidatePath("/ar");
  revalidatePath("/en");
}

// ---------- auth ------------------------------------------------------
export async function signInAction(_: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { message: ["لم يتم ضبط Supabase.", "Supabase is not configured."] };
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { message: ["أدخل البريد وكلمة المرور.", "Enter email and password."] };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { message: ["البريد الإلكتروني أو كلمة المرور غير صحيحة.", "Invalid email or password."] };
  const { data: admin } = await supabase.from("admins").select("id").eq("id", data.user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return { message: ["هذا الحساب لا يملك صلاحية الإدارة.", "This account does not have admin access."] };
  }
  const next = String(fd.get("next") ?? "/admin");
  redirect(next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : "/admin");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function setAdminLocaleAction(locale: Locale) {
  (await cookies()).set(ADMIN_LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/admin", "layout");
}

// ---------- generic CRUD ----------------------------------------------
export async function saveRecordAction(resourceKey: string, id: string | null, _: FormState, fd: FormData): Promise<FormState> {
  const res = getResource(resourceKey);
  if (!res) return { message: ERR_GENERIC };
  const { supabase, admin } = await requireAdmin();
  if (res.managerOnly && !isManagerRole(admin.role)) return { message: ERR_FORBIDDEN };
  if (!id && !res.canCreate) return { message: ERR_FORBIDDEN };

  const { row, joins, errors } = buildPayload(res.fields, fd);
  if (Object.keys(errors).length) {
    return { errors, message: ["راجع الحقول المميزة.", "Please review the highlighted fields."], ts: Date.now() };
  }

  // Cross-field checks
  if (res.table === "schedules" && typeof row.start_time === "string" && typeof row.end_time === "string" && row.end_time <= row.start_time) {
    return { errors: { end_time: ["يجب أن يكون بعد وقت البداية.", "Must be after the start time."] }, message: ERR_GENERIC, ts: Date.now() };
  }
  if ((row.age_max as number | null) != null && (row.age_min as number) > (row.age_max as number)) {
    return { errors: { age_max: ["يجب أن يكون أكبر من أو يساوي أقل عمر.", "Must be ≥ minimum age."] }, message: ERR_GENERIC, ts: Date.now() };
  }

  let recordId = id;
  if (id) {
    const { error } = await supabase.from(res.table).update(row).eq("id", id);
    if (error) return { message: dbError(error), ts: Date.now() };
  } else {
    if (res.canReorder && row.sort_order == null) {
      const { data: last } = await supabase.from(res.table).select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
      row.sort_order = ((last?.sort_order as number) ?? 0) + 1;
    }
    const { data, error } = await supabase.from(res.table).insert(row).select("id").single();
    if (error) return { message: dbError(error), ts: Date.now() };
    recordId = data.id as string;
  }

  // Many-to-many join tables
  for (const f of res.fields) {
    if (f.type !== "multi" || !f.join || !recordId) continue;
    const ids = joins[f.name] ?? [];
    const { error: delErr } = await supabase.from(f.join.table).delete().eq(f.join.selfKey, recordId);
    if (delErr) return { message: dbError(delErr), ts: Date.now() };
    if (ids.length) {
      const { error: insErr } = await supabase.from(f.join.table).insert(ids.map((o) => ({ [f.join!.selfKey]: recordId, [f.join!.otherKey]: o })));
      if (insErr) return { message: dbError(insErr), ts: Date.now() };
    }
  }

  revalidateSite();
  revalidatePath(`/admin/${resourceKey}`);
  return { ok: true, id: recordId!, message: OK_SAVED, ts: Date.now() };
}

export async function deleteRecordAction(resourceKey: string, id: string): Promise<FormState> {
  const res = getResource(resourceKey);
  if (!res || !res.canDelete) return { message: ERR_FORBIDDEN };
  const { supabase, admin } = await requireAdmin();
  if (res.managerOnly && !isManagerRole(admin.role)) return { message: ERR_FORBIDDEN };
  const { error, count } = await supabase.from(res.table).delete({ count: "exact" }).eq("id", id);
  if (error) return { message: dbError(error) };
  if (!count) return { message: ERR_FORBIDDEN };
  revalidateSite();
  revalidatePath(`/admin/${resourceKey}`);
  return { ok: true, message: ["تم الحذف.", "Deleted."] };
}

export async function togglePublishAction(resourceKey: string, id: string, value: boolean): Promise<FormState> {
  const res = getResource(resourceKey);
  if (!res?.publishField) return { message: ERR_FORBIDDEN };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from(res.table).update({ [res.publishField]: value }).eq("id", id);
  if (error) return { message: dbError(error) };
  revalidateSite();
  revalidatePath(`/admin/${resourceKey}`);
  return { ok: true };
}

export async function moveRecordAction(resourceKey: string, id: string, dir: -1 | 1): Promise<FormState> {
  const res = getResource(resourceKey);
  if (!res?.canReorder) return { message: ERR_FORBIDDEN };
  const { supabase } = await requireAdmin();
  const { data: rows, error } = await supabase.from(res.table).select("id, sort_order").order("sort_order").order("created_at");
  if (error || !rows) return { message: dbError(error) };
  // normalise, then swap
  const list = rows.map((r, i) => ({ id: r.id as string, sort_order: i + 1 }));
  const i = list.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return { ok: true };
  [list[i].sort_order, list[j].sort_order] = [list[j].sort_order, list[i].sort_order];
  const changed = list.filter((r, k) => r.sort_order !== (rows[k].sort_order as number));
  for (const r of changed) {
    const { error: e } = await supabase.from(res.table).update({ sort_order: r.sort_order }).eq("id", r.id);
    if (e) return { message: dbError(e) };
  }
  revalidateSite();
  revalidatePath(`/admin/${resourceKey}`);
  return { ok: true };
}

export async function setReviewStatusAction(id: string, status: "approved" | "rejected" | "pending"): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
  if (error) return { message: dbError(error) };
  revalidateSite();
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  return { ok: true };
}

// ---------- registrations ---------------------------------------------
export async function updateRegistrationAction(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const { supabase, admin } = await requireAdmin();
  if (!isManagerRole(admin.role)) return { message: ERR_FORBIDDEN };
  const status = String(fd.get("status") ?? "") as RegistrationStatus;
  if (!["new", "pending", "approved", "rejected", "completed"].includes(status)) return { message: ERR_GENERIC };
  const internal_notes = String(fd.get("internal_notes") ?? "").trim().slice(0, 4000) || null;
  const { error } = await supabase.from("registrations").update({ status, internal_notes }).eq("id", id);
  if (error) return { message: dbError(error), ts: Date.now() };
  revalidateSite();
  revalidatePath("/admin/registrations");
  revalidatePath("/admin");
  return { ok: true, message: OK_SAVED, ts: Date.now() };
}

export async function quickRegistrationStatusAction(id: string, status: RegistrationStatus): Promise<FormState> {
  const fd = new FormData();
  fd.set("status", status);
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("registrations").select("internal_notes").eq("id", id).maybeSingle();
  fd.set("internal_notes", (data?.internal_notes as string) ?? "");
  return updateRegistrationAction(id, {}, fd);
}

export async function deleteRegistrationAction(id: string): Promise<FormState> {
  const { supabase, admin } = await requireAdmin();
  if (!isManagerRole(admin.role)) return { message: ERR_FORBIDDEN };
  const { error } = await supabase.from("registrations").delete().eq("id", id);
  if (error) return { message: dbError(error) };
  revalidateSite();
  revalidatePath("/admin/registrations");
  return { ok: true };
}

// ---------- settings --------------------------------------------------
export async function saveSettingsAction(kind: "settings" | "seo", _: FormState, fd: FormData): Promise<FormState> {
  const { supabase, admin } = await requireAdmin();
  if (!isManagerRole(admin.role)) return { message: ERR_FORBIDDEN };
  const { row, errors } = buildPayload(kind === "seo" ? SEO_FIELDS : SETTINGS_FIELDS, fd);
  if (Object.keys(errors).length) return { errors, message: ["راجع الحقول المميزة.", "Please review the highlighted fields."], ts: Date.now() };
  if (typeof row.whatsapp === "string") row.whatsapp = row.whatsapp.replace(/\D/g, "") || null;
  const { error } = await supabase.from("site_settings").update(row).eq("id", 1);
  if (error) return { message: dbError(error), ts: Date.now() };
  revalidateSite();
  revalidatePath("/", "layout");
  return { ok: true, message: OK_SAVED, ts: Date.now() };
}

// ---------- media -----------------------------------------------------
export async function deleteMediaAction(id: string): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { data: m } = await supabase.from("media").select("bucket, path").eq("id", id).maybeSingle();
  if (!m) return { message: ERR_GENERIC };
  const { error: se } = await supabase.storage.from(m.bucket as string).remove([m.path as string]);
  if (se) return { message: [se.message, se.message] };
  const { error } = await supabase.from("media").delete().eq("id", id);
  if (error) return { message: dbError(error) };
  revalidatePath("/admin/media");
  return { ok: true };
}

export async function updateMediaAltAction(id: string, alt_ar: string, alt_en: string): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("media").update({ alt_ar: alt_ar.slice(0, 300) || null, alt_en: alt_en.slice(0, 300) || null }).eq("id", id);
  if (error) return { message: dbError(error) };
  revalidatePath("/admin/media");
  return { ok: true };
}
