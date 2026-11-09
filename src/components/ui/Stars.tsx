import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ value, className, label }: { value: number; className?: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={label ?? `${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("h-4 w-4", i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")} aria-hidden="true" />
      ))}
    </span>
  );
}
