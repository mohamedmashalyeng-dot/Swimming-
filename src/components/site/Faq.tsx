"use client";
import { Plus } from "lucide-react";
import { useState } from "react";
import type { Faq as FaqT, Locale } from "@/lib/types";
import { cn, t } from "@/lib/utils";

export function Faq({ locale, faqs }: { locale: Locale; faqs: FaqT[] }) {
  const [open, setOpen] = useState<string | null>(faqs[0]?.id ?? null);
  return (
    <ul className="mx-auto max-w-3xl space-y-3">
      {faqs.map((f) => {
        const isOpen = open === f.id;
        return (
          <li key={f.id} className={cn("card overflow-hidden transition", isOpen && "border-ocean-500/40 shadow-lift")}>
            <h3>
              <button
                type="button"
                id={`faq-q-${f.id}`}
                aria-expanded={isOpen}
                aria-controls={`faq-a-${f.id}`}
                onClick={() => setOpen(isOpen ? null : f.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-start text-base font-bold sm:px-6"
              >
                {t(f, "question", locale)}
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition",
                  isOpen ? "rotate-45 bg-turquoise-500 text-navy-950" : "bg-mist text-ocean-600")}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </span>
              </button>
            </h3>
            <div
              id={`faq-a-${f.id}`}
              role="region"
              aria-labelledby={`faq-q-${f.id}`}
              className={cn("grid transition-all duration-300", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-6 leading-7 text-slate-600 sm:px-6">{t(f, "answer", locale)}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
