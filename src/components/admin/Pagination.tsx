import Link from "next/link";
import { adminDict } from "@/lib/admin/i18n";
import type { Locale } from "@/lib/types";

export function Pagination({ base, page, pages, params, locale }: { base: string; page: number; pages: number; params: Record<string, string | undefined>; locale: Locale }) {
  if (pages <= 1) return null;
  const d = adminDict(locale);
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") sp.set(k, v);
    sp.set("page", String(p));
    return `${base}?${sp.toString()}`;
  };
  return (
    <nav className="flex items-center justify-between gap-4" aria-label="Pagination">
      {page > 1 ? <Link className="btn-outline px-4 py-2" href={href(page - 1)}>{d.common.prev}</Link> : <span />}
      <span className="text-sm font-semibold text-slate-500">{d.common.page} {page} {d.common.of} {pages}</span>
      {page < pages ? <Link className="btn-outline px-4 py-2" href={href(page + 1)}>{d.common.next}</Link> : <span />}
    </nav>
  );
}
