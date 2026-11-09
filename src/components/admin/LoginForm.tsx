"use client";
import { Globe, Loader2, Lock, Mail } from "lucide-react";
import { startTransition, useActionState, useTransition, type FormEvent } from "react";
import { setAdminLocaleAction, signInAction, signOutAction, type FormState } from "@/app/admin/actions";
import { Logo } from "@/components/ui/Logo";
import { lbl } from "@/lib/admin/resources";
import type { Locale } from "@/lib/types";

export function LoginForm({
  locale, next, configured, notAdmin, d,
}: { locale: Locale; next: string; configured: boolean; notAdmin: boolean; d: Record<string, string> }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signInAction, {});
  const [switching, start] = useTransition();
  // Dispatch manually so React does not reset the inputs after a failed attempt.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
  return (
    <div className="relative w-full max-w-md">
      <div className="mb-6 flex items-center justify-between">
        <Logo nameAr="كابتن أمير سلامي" nameEn="Captain Amir Salami" locale={locale} light />
        <button type="button" disabled={switching} onClick={() => start(() => setAdminLocaleAction(locale === "ar" ? "en" : "ar"))}
          className="btn-ghost px-3 py-2 text-xs"><Globe className="h-4 w-4" aria-hidden="true" />{d.language}</button>
      </div>
      <form onSubmit={onSubmit} className="rounded-3xl bg-white p-7 shadow-lift sm:p-8">
        <h1 className="text-xl font-extrabold">{d.title}</h1>
        {!configured ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{d.notConfigured}</p> : null}
        {notAdmin ? (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {d.notAdmin}
            <button type="button" onClick={() => start(() => signOutAction())} className="ms-2 font-bold underline">Sign out</button>
          </div>
        ) : null}
        <input type="hidden" name="next" value={next} />
        <label className="mt-6 block">
          <span className="label">{d.email}</span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input name="email" type="email" autoComplete="username" required dir="ltr" className="input ps-10 rtl:text-right" />
          </span>
        </label>
        <label className="mt-4 block">
          <span className="label">{d.password}</span>
          <span className="relative block">
            <Lock className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input name="password" type="password" autoComplete="current-password" required dir="ltr" className="input ps-10 rtl:text-right" />
          </span>
        </label>
        {state.message ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{lbl(state.message, locale)}</p> : null}
        <button type="submit" disabled={pending || !configured} className="btn-ocean mt-6 w-full py-3.5">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {pending ? d.signingIn : d.submit}
        </button>
        <a href={`/${locale}`} className="mt-4 block text-center text-sm font-semibold text-slate-500 hover:text-ocean-600">{d.back}</a>
      </form>
    </div>
  );
}
