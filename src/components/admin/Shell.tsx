"use client";
import {
  Backpack, BookOpen, CalendarDays, ClipboardList, ExternalLink, Globe, GraduationCap, HelpCircle, Image as ImageIcon,
  LayoutDashboard, LayoutTemplate, LogOut, MapPin, Menu, PlayCircle, Search, Settings, Star, UserCheck, UserRound, Users, X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { setAdminLocaleAction, signOutAction } from "@/app/admin/actions";
import { LogoMark } from "@/components/ui/Logo";
import { adminDict } from "@/lib/admin/i18n";
import type { Locale } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Toaster } from "./Toast";

const NAV = [
  { href: "/admin", key: "overview", icon: LayoutDashboard },
  { href: "/admin/about", key: "about", icon: UserCheck },
  { href: "/admin/courses", key: "courses", icon: GraduationCap },
  { href: "/admin/videos", key: "videos", icon: PlayCircle },
  { href: "/admin/lessons", key: "lessons", icon: BookOpen },
  { href: "/admin/age-groups", key: "age-groups", icon: Users },
  { href: "/admin/equipment", key: "equipment", icon: Backpack },
  { href: "/admin/locations", key: "locations", icon: MapPin },
  { href: "/admin/schedules", key: "schedules", icon: CalendarDays },
  { href: "/admin/registrations", key: "registrations", icon: ClipboardList, manager: true },
  { href: "/admin/students", key: "students", icon: UserRound, manager: true },
  { href: "/admin/reviews", key: "reviews", icon: Star },
  { href: "/admin/faqs", key: "faqs", icon: HelpCircle },
  { href: "/admin/content", key: "content", icon: LayoutTemplate },
  { href: "/admin/media", key: "media", icon: ImageIcon },
  { href: "/admin/seo", key: "seo", icon: Search, manager: true },
  { href: "/admin/settings", key: "settings", icon: Settings, manager: true },
] as const;

export function AdminShell({
  locale, email, role, badges, children,
}: { locale: Locale; email: string; role: string; badges: Record<string, number>; children: React.ReactNode }) {
  const d = adminDict(locale);
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const isManager = role === "super_admin" || role === "admin";
  useEffect(() => setOpen(false), [path]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-3 px-5 py-5">
        <LogoMark className="h-9 w-9" />
        <span className="leading-tight">
          <span className="block text-sm font-extrabold text-white">{locale === "ar" ? "كابتن أمير سلامي" : "Captain Amir Salami"}</span>
          <span className="block text-[11px] font-semibold text-turquoise-300">{d.brandAdmin}</span>
        </span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label={d.dashboard}>
        <ul className="space-y-0.5">
          {NAV.filter((n) => !("manager" in n) || isManager).map((n) => {
            const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
            const badge = badges[n.key];
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                    active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <n.icon className={cn("h-[18px] w-[18px]", active && "text-turquoise-500")} aria-hidden="true" />
                  <span className="flex-1">{d.nav[n.key]}</span>
                  {badge ? <span className="rounded-full bg-turquoise-500 px-2 py-0.5 text-[11px] font-extrabold text-navy-950">{badge}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="truncate text-xs text-white/60" title={email}>{email}</p>
        <p className="text-[11px] font-bold uppercase text-turquoise-300">{role.replace("_", " ")}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:ps-64">
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 bg-navy-900 lg:block">{sidebar}</aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 start-0 w-72 bg-navy-900 shadow-lift">
            <button type="button" onClick={() => setOpen(false)} className="absolute end-3 top-5 rounded-lg p-1.5 text-white/70 hover:bg-white/10" aria-label={d.common.close}>
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6">
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-mist lg:hidden" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>
        <span className="hidden text-sm font-bold text-slate-500 lg:block">{d.dashboard}</span>
        <div className="flex items-center gap-2">
          <a href={`/${locale}`} target="_blank" rel="noopener noreferrer" className="btn-outline px-3 py-2 text-xs">
            <ExternalLink className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">{d.viewSite}</span>
          </a>
          <button type="button" disabled={pending} onClick={() => start(() => setAdminLocaleAction(locale === "ar" ? "en" : "ar"))} className="btn-outline px-3 py-2 text-xs">
            <Globe className="h-4 w-4" aria-hidden="true" />{d.language}
          </button>
          <form action={signOutAction}>
            <button type="submit" className="btn-outline px-3 py-2 text-xs text-red-600 hover:border-red-300 hover:text-red-700">
              <LogOut className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" /><span className="hidden sm:inline">{d.signOut}</span>
            </button>
          </form>
        </div>
      </header>
      <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      <Toaster />
    </div>
  );
}
