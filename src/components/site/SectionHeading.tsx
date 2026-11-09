import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow, title, subtitle, light = false, align = "center", className,
}: { eyebrow?: string | null; title: string; subtitle?: string | null; light?: boolean; align?: "center" | "start"; className?: string }) {
  return (
    <div className={cn("mb-12 max-w-3xl", align === "center" ? "mx-auto text-center" : "text-start", className)}>
      {eyebrow ? <span className={cn("eyebrow", light && "bg-white/10 text-turquoise-300")}>{eyebrow}</span> : null}
      <h2 className={cn("mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-[2.75rem]", light ? "text-white" : "text-navy-900")}>
        {title}
      </h2>
      {subtitle ? <p className={cn("mt-4 text-base leading-relaxed sm:text-lg", light ? "text-white/75" : "text-slate-600")}>{subtitle}</p> : null}
    </div>
  );
}
