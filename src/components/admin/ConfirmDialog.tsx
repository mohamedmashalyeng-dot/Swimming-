"use client";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export function ConfirmDialog({
  open, title, body, confirmLabel, cancelLabel, onConfirm, onClose, pending,
}: { open: boolean; title: string; body: string; confirmLabel: string; cancelLabel: string; onConfirm: () => void; onClose: () => void; pending?: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" closeLabel={cancelLabel}>
      <div className="p-6">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></span>
          <p className="pt-2 text-sm text-slate-600">{body}</p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-outline px-4 py-2" onClick={onClose} data-autofocus>{cancelLabel}</button>
          <button type="button" className="btn bg-red-600 px-4 py-2 text-white hover:bg-red-700" onClick={onConfirm} disabled={pending}>{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}
