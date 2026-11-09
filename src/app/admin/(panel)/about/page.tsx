import Link from "next/link";
import { saveRecordAction } from "@/app/admin/actions";
import { RecordForm } from "@/components/admin/RecordForm";
import { getAdminLocale, requireAdmin } from "@/lib/admin/auth";
import { loadFormData } from "@/lib/admin/form-data";
import { RESOURCES } from "@/lib/admin/resources";

export const metadata = { title: "About Captain Amir" };

/** Edits the primary coach profile shown in the "About" section. */
export default async function AboutPage() {
  const { supabase } = await requireAdmin();
  const locale = await getAdminLocale();
  const res = RESOURCES.coaches;
  const { data } = await supabase.from("coaches").select("*").order("is_primary", { ascending: false }).order("sort_order").limit(1).maybeSingle();
  const record = data ?? { is_primary: true, is_published: true };
  const { relations, joins } = await loadFormData(supabase, res.fields, data?.id ?? null, locale);
  return (
    <div className="space-y-4">
      <RecordForm
        locale={locale}
        fields={res.fields}
        record={record}
        relations={relations}
        joins={joins}
        action={saveRecordAction.bind(null, "coaches", data?.id ?? null)}
        afterCreate="/admin/coaches"
        title={locale === "ar" ? "عن كابتن أمير" : "About Captain Amir"}
      />
      <p className="text-center text-sm text-slate-500">
        <Link href="/admin/coaches" className="font-semibold text-ocean-600 hover:underline">
          {locale === "ar" ? "إدارة كل المدربين (للجدول) ←" : "Manage all coaches (used in schedules) →"}
        </Link>
      </p>
    </div>
  );
}
