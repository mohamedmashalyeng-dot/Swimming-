import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { WhatsappIcon } from "@/components/ui/SocialIcons";
import { getDictionary } from "@/lib/i18n";
import type { Locale, SiteSettings } from "@/lib/types";
import { t, telLink, whatsappLink } from "@/lib/utils";
import { socialLinks } from "./social";
import type { NavItem } from "./Header";

export function Footer({ locale, settings, items }: { locale: Locale; settings: SiteSettings; items: NavItem[] }) {
  const d = getDictionary(locale);
  const wa = whatsappLink(settings.whatsapp, t(settings, "whatsapp_message", locale));
  const tel = telLink(settings.phone);
  const year = new Date().getFullYear();
  return (
    <footer className="water-bg relative overflow-hidden text-white">
      <div className="caustics absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="container-x relative grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo nameAr={settings.brand_name_ar} nameEn={settings.brand_name_en} locale={locale} light />
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/70">{t(settings, "footer_about", locale) || t(settings, "tagline", locale)}</p>
          <div className="mt-6 flex gap-2">
            {socialLinks(settings).map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition hover:bg-turquoise-500 hover:text-navy-950">
                <s.Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
        <nav aria-label={d.footer.quickLinks}>
          <h2 className="text-sm font-bold text-turquoise-300">{d.footer.quickLinks}</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            {items.map((i) => (
              <li key={i.id}><a href={`#${i.id}`} className="text-white/75 transition hover:text-white">{d.nav[i.key] as string}</a></li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="text-sm font-bold text-turquoise-300">{d.footer.contact}</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            {tel ? <li><a href={tel} className="flex items-center gap-2 hover:text-white"><Phone className="h-4 w-4 text-turquoise-500" aria-hidden="true" /><span dir="ltr">{settings.phone}</span></a></li> : null}
            {wa ? <li><a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white"><WhatsappIcon className="h-4 w-4 text-turquoise-500" />WhatsApp</a></li> : null}
            {settings.email ? <li><a href={`mailto:${settings.email}`} className="flex items-center gap-2 hover:text-white"><Mail className="h-4 w-4 text-turquoise-500" aria-hidden="true" />{settings.email}</a></li> : null}
            {t(settings, "address", locale) ? <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-turquoise-500" aria-hidden="true" />{t(settings, "address", locale)}</li> : null}
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-white/50 sm:flex-row">
          <p>© {year} {t(settings, "brand_name", locale)}. {d.footer.rights}</p>
          <a href="/admin" rel="nofollow" className="hover:text-white/80">{d.footer.admin}</a>
        </div>
      </div>
    </footer>
  );
}
