"use client";
import { Loader2, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useState, useTransition, type FormEvent } from "react";
import {
  deleteRegistrationAction, quickRegistrationStatusAction, updateRegistrationAction, type FormState,
} from "@/app/admin/actions";
import { adminDict } from "@/lib/admin/i18n";
import { lbl, REG_STATUSES } from "@/lib/admin/resources";
import type { Locale, RegistrationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { toast } from "./Toast";

const COLORS: Record<string, string> = {
  new: "border-sky-200 bg-sky-50 text-sky-700", pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700", rejected: "border-red-200 bg-red-50 text-red-700",
  completed: "border-slate-200 bg-slate-100 text-slate-700",
};

export function RegistrationQuickStatus({ id, status, locale }: { id: string; status: RegistrationStatus; locale: Locale }) {
  const d = adminDict(locale);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [value, setValue] = useState(status);
  useEffect(() => setValue(status), [status]);
  return (
    <span className="relative inline-flex items-center">
      <select
        value={value}
        disabled={pending}
        aria-label={d.regs.status}
        onChange={(e) => {
          const next = e.target.value as RegistrationStatus;
          setValue(next);
          start(async () => {
            const r = await quickRegistrationStatusAction(id, next);
            if (r.ok) { toast(d.common.saved); router.refresh(); }
            else { setValue(status); toast(r.message ? lbl(r.message, locale) : d.common.error, "error"); }
          });
        }}
        className={cn("rounded-full border px-3 py-1 pe-7 text-xs font-bold", COLORS[value])}
      >
        {REG_STATUSES.map((s) => <option key={s.value} value={s.value}>{lbl(s.label, locale)}</option>)}
      </select>
      {pending ? <Loader2 className="absolute -end-5 h-3.5 w-3.5 animate-spin text-slate-400" /> : null}
    </span>
  );
}

export function RegistrationEditor({ id, status, notes, locale }: { id: string; status: RegistrationStatus; notes: string; locale: Locale }) {
  const d = adminDict(locale);
  const router = useRouter();
  const [state, dispatch, pending] = useActionState<FormState, FormData>(updateRegistrationAction.bind(null, id), {});
  const [confirm, setConfirm] = useState(false);
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    if (!state.ts) return;
    if (state.ok) { toast(d.common.saved); router.refresh(); }
    else if (state.message) toast(lbl(state.message, locale), "error");
  }, [state, d.common.saved, locale, router]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-5">
      <fieldset>
        <legend className="label">{d.regs.status}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {REG_STATUSES.map((s) => (
            <label key={s.value} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold has-[:checked]:ring-2 has-[:checked]:ring-ocean-500", COLORS[s.value])}>
              <input type="radio" name="status" value={s.value} defaultChecked={status === s.value} className="accent-ocean-600" />
              {lbl(s.label, locale)}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="label">{d.regs.internal}</span>
        <textarea name="internal_notes" rows={5} defaultValue={notes} className="input" />
      </label>
      {state.message && !state.ok ? <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">{lbl(state.message, locale)}</p> : null}
      <div className="flex flex-wrap justify-between gap-2">
        <button type="button" className="btn-outline px-4 py-2 text-red-600" onClick={() => setConfirm(true)} disabled={deleting}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />{d.common.delete}
        </button>
        <button type="submit" className="btn-ocean" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" aria-hidden="true" />}{pending ? d.common.saving : d.common.save}
        </button>
      </div>
      <ConfirmDialog open={confirm} title={d.common.confirmDelete} body={d.common.confirmDeleteBody} confirmLabel={d.common.yes} cancelLabel={d.common.cancel}
        onClose={() => setConfirm(false)} pending={deleting}
        onConfirm={() => startDelete(async () => {
          const r = await deleteRegistrationAction(id);
          if (r.ok) { toast(d.common.deleted); router.push("/admin/registrations"); } else toast(d.common.error, "error");
        })} />
    </form>
  );
}
