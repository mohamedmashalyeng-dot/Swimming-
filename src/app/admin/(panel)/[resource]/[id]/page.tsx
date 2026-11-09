import { notFound } from "next/navigation";
import { saveRecordAction } from "@/app/admin/actions";
import { RecordForm } from "@/components/admin/RecordForm";
import { getAdminLocale, isManagerRole, requireAdmin } from "@/lib/admin/auth";
import { loadFormData } from "@/lib/admin/form-data";
import { adminDict } from "@/lib/admin/i18n";
import { getResource, lbl } from "@/lib/admin/resources";

export default async function EditRecordPage({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource: key, id } = await params;
  const res = getResource(key);
  if (!res) notFound();
  const { supabase, admin } = await requireAdmin();
  const locale = await getAdminLocale();
  const d = adminDict(locale);
  if (res.managerOnly && !isManagerRole(admin.role)) return <p className="card p-8 text-center text-slate-500">{d.forbidden}</p>;

  const isNew = id === "new";
  if (isNew && !res.canCreate) notFound();
  let record: Record<string, unknown> = { ...(res.defaults ?? {}) };
  if (!isNew) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const { data } = await supabase.from(res.table).select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    record = data;
  }
  const { relations, joins } = await loadFormData(supabase, res.fields, isNew ? null : id, locale);
  const listHref = key === "sections" ? "/admin/content" : key === "coaches" ? "/admin/about" : `/admin/${key}`;
  const name = (record[`${res.fields[0].name}_${locale}`] ?? record[res.fields[0].name] ?? "") as string;

  return (
    <RecordForm
      locale={locale}
      fields={res.fields}
      record={record}
      relations={relations}
      joins={joins}
      action={saveRecordAction.bind(null, key, isNew ? null : id)}
      backHref={listHref}
      afterCreate={`/admin/${key}`}
      title={isNew ? `${d.common.add}: ${lbl(res.singular, locale)}` : `${lbl(res.singular, locale)}${name ? ` — ${name}` : ""}`}
    />
  );
}
