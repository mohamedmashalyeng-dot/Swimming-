import { LoginForm } from "@/components/admin/LoginForm";
import { getAdminLocale } from "@/lib/admin/auth";
import { adminDict } from "@/lib/admin/i18n";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const locale = await getAdminLocale();
  const d = adminDict(locale);
  const sp = await searchParams;
  const configured = isSupabaseConfigured();
  let notAdmin = sp.error === "notAdmin";
  if (configured) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: admin } = await supabase.from("admins").select("id").eq("id", user.id).maybeSingle();
      if (admin) redirect("/admin");
      notAdmin = true;
    }
  }
  return (
    <main className="water-bg relative flex min-h-screen items-center justify-center p-4">
      <div className="caustics absolute inset-0 opacity-50" aria-hidden="true" />
      <LoginForm locale={locale} next={sp.next ?? "/admin"} configured={configured} notAdmin={notAdmin} d={{ ...d.login, language: d.language }} />
    </main>
  );
}
