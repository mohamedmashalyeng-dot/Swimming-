import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "../supabase/server";
import { ADMIN_LOCALE_COOKIE, isLocale } from "../i18n/config";
import type { Locale } from "../types";

export interface AdminUser { id: string; email: string; full_name: string | null; role: "super_admin" | "admin" | "editor" }

export const getAdminLocale = cache(async (): Promise<Locale> => {
  const v = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : "ar";
});

/** Returns the signed-in admin (validated against Supabase Auth) or redirects to login. */
export const requireAdmin = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: admin } = await supabase.from("admins").select("id, email, full_name, role").eq("id", user.id).maybeSingle();
  if (!admin) redirect("/admin/login?error=notAdmin");
  return { supabase, user, admin: admin as AdminUser };
});

export const isManagerRole = (r: AdminUser["role"]) => r === "super_admin" || r === "admin";
