import { AdminShell } from "@/components/admin/Shell";
import { getAdminLocale, isManagerRole, requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { supabase, admin } = await requireAdmin();
  const locale = await getAdminLocale();
  const badges: Record<string, number> = {};
  const [{ count: rv }, regs] = await Promise.all([
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    isManagerRole(admin.role)
      ? supabase.from("registrations").select("id", { count: "exact", head: true }).eq("status", "new")
      : Promise.resolve({ count: 0 }),
  ]);
  if (rv) badges.reviews = rv;
  if (regs.count) badges.registrations = regs.count;
  return (
    <AdminShell locale={locale} email={admin.email} role={admin.role} badges={badges}>
      {children}
    </AdminShell>
  );
}
