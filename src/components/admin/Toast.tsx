"use client";
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ToastMsg = { id: number; text: string; kind: "ok" | "error" };
const EVENT = "cas:toast";

export function toast(text: string, kind: "ok" | "error" = "ok") {
  window.dispatchEvent(new CustomEvent<ToastMsg>(EVENT, { detail: { id: Date.now() + Math.random(), text, kind } }));
}

export function Toaster() {
  const [items, setItems] = useState<ToastMsg[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const h = (e: Event) => {
      const m = (e as CustomEvent<ToastMsg>).detail;
      setItems((x) => [...x, m]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== m.id)), 4000);
    };
    window.addEventListener(EVENT, h);
    return () => window.removeEventListener(EVENT, h);
  }, []);
  if (!mounted) return null;
  return createPortal(
    <div className="fixed bottom-4 start-1/2 z-[200] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 rtl:translate-x-1/2" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lift animate-fade-up ${t.kind === "ok" ? "bg-navy-900 text-white" : "bg-red-600 text-white"}`}>
          {t.kind === "ok" ? <CheckCircle2 className="h-5 w-5 text-turquoise-500" aria-hidden="true" /> : <XCircle className="h-5 w-5" aria-hidden="true" />}
          {t.text}
        </div>
      ))}
    </div>,
    document.body,
  );
}
