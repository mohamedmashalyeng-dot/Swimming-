"use client";
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteRecordAction, moveRecordAction, setReviewStatusAction, togglePublishAction, type FormState,
} from "@/app/admin/actions";
import { adminDict } from "@/lib/admin/i18n";
import { lbl } from "@/lib/admin/resources";
import type { Locale } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { toast } from "./Toast";

export function RowActions({
  locale, resource, id, published, canReorder, canDelete, isFirst, isLast, reviewStatus, editHref,
}: {
  locale: Locale; resource: string; id: string; published?: boolean | null; canReorder?: boolean; canDelete?: boolean;
  isFirst?: boolean; isLast?: boolean; reviewStatus?: string; editHref: string;
}) {
  const d = adminDict(locale);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);

  const run = (fn: () => Promise<FormState>, okMsg?: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) { if (okMsg) toast(okMsg); router.refresh(); }
      else toast(r.message ? lbl(r.message, locale) : d.common.error, "error");
    });

  const btn = "rounded-lg p-2 text-slate-500 transition hover:bg-mist hover:text-navy-900 disabled:opacity-30";
  return (
    <div className="flex items-center justify-end gap-0.5">
      {reviewStatus !== undefined ? (
        <>
          {reviewStatus !== "approved" ? (
            <button type="button" className={`${btn} text-emerald-600`} disabled={pending} title={d.common.approve} aria-label={d.common.approve}
              onClick={() => run(() => setReviewStatusAction(id, "approved"), d.common.saved)}><Check className="h-4 w-4" /></button>
          ) : null}
          {reviewStatus !== "rejected" ? (
            <button type="button" className={`${btn} text-amber-600`} disabled={pending} title={d.common.reject} aria-label={d.common.reject}
              onClick={() => run(() => setReviewStatusAction(id, "rejected"), d.common.saved)}><X className="h-4 w-4" /></button>
          ) : null}
        </>
      ) : null}
      {published !== undefined && published !== null ? (
        <button type="button" className={btn} disabled={pending} title={published ? d.common.unpublish : d.common.publish} aria-label={published ? d.common.unpublish : d.common.publish}
          onClick={() => run(() => togglePublishAction(resource, id, !published), d.common.saved)}>
          {published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      ) : null}
      {canReorder ? (
        <>
          <button type="button" className={btn} disabled={pending || isFirst} aria-label={d.common.moveUp} title={d.common.moveUp}
            onClick={() => run(() => moveRecordAction(resource, id, -1))}><ArrowUp className="h-4 w-4" /></button>
          <button type="button" className={btn} disabled={pending || isLast} aria-label={d.common.moveDown} title={d.common.moveDown}
            onClick={() => run(() => moveRecordAction(resource, id, 1))}><ArrowDown className="h-4 w-4" /></button>
        </>
      ) : null}
      <Link href={editHref} className={btn} aria-label={d.common.edit} title={d.common.edit}><Pencil className="h-4 w-4" /></Link>
      {canDelete ? (
        <button type="button" className={`${btn} hover:bg-red-50 hover:text-red-600`} disabled={pending} aria-label={d.common.delete} title={d.common.delete}
          onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" /></button>
      ) : null}
      <ConfirmDialog
        open={confirm}
        title={d.common.confirmDelete}
        body={d.common.confirmDeleteBody}
        confirmLabel={d.common.yes}
        cancelLabel={d.common.cancel}
        pending={pending}
        onClose={() => setConfirm(false)}
        onConfirm={() => { setConfirm(false); run(() => deleteRecordAction(resource, id), d.common.deleted); }}
      />
    </div>
  );
}
