import { saveSettingsAction } from "@/app/admin/actions";
import { getAdminLocale, isManagerRole, requireAdmin } from "@/lib/admin/auth";
import { adminDict } from "@/lib/admin/i18n";
import { SEO_FIELDS, SETTINGS_FIELDS } from "@/lib/admin/resources";
import { RecordForm } from "./RecordForm";

export async function SettingsPage({ kind }: { kind: "settings" | "seo" }) {
  const { supabase, admin } = await requireAdmin();
  const locale = await getAdminLocale();
  const d = adminDict(locale);
  if (!isManagerRole(admin.role)) return <p className="card p-8 text-center text-slate-500">{d.settings.managerOnly}</p>;
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return (
    <RecordForm
      locale={locale}
      fields={kind === "seo" ? SEO_FIELDS : SETTINGS_FIELDS}
      record={data ?? {}}
      relations={{}}
      joins={{}}
      action={saveSettingsAction.bind(null, kind)}
      title={kind === "seo" ? d.settings.seoTitle : d.settings.title}
    />
  );
}
