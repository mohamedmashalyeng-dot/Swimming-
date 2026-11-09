import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RelOption } from "@/components/admin/RecordForm";
import type { Field } from "./resources";
import type { Locale } from "../types";

/** Loads <select> options for relation & multi fields, and current join selections. */
export async function loadFormData(sb: SupabaseClient, fields: Field[], recordId: string | null, locale: Locale) {
  const relations: Record<string, RelOption[]> = {};
  const joins: Record<string, string[]> = {};
  await Promise.all(fields.map(async (f) => {
    const target = f.type === "relation" ? f.relation : f.type === "multi" && f.join ? { table: f.join.otherTable, label: f.join.label } : null;
    if (!target) return;
    const { data } = await sb.from(target.table).select(`id, ${target.label}_ar, ${target.label}_en`).order("sort_order");
    relations[f.name] = ((data ?? []) as unknown as Record<string, string>[]).map((r) => ({
      id: r.id,
      label: r[`${target.label}_${locale}`] || r[`${target.label}_ar`] || r.id,
    }));
    if (f.type === "multi" && f.join && recordId) {
      const { data: j } = await sb.from(f.join.table).select(f.join.otherKey).eq(f.join.selfKey, recordId);
      joins[f.name] = ((j ?? []) as unknown as Record<string, string>[]).map((r) => r[f.join!.otherKey]);
    }
  }));
  return { relations, joins };
}
