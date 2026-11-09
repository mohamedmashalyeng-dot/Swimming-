import { notFound } from "next/navigation";
import { About } from "@/components/site/About";
import { AgeGroups, EquipmentSection } from "@/components/site/AgeGroupsEquipment";
import { Contact } from "@/components/site/Contact";
import { Courses } from "@/components/site/Courses";
import { Faq } from "@/components/site/Faq";
import { FloatingActions } from "@/components/site/FloatingActions";
import { Footer } from "@/components/site/Footer";
import { Header, type NavItem } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Learning } from "@/components/site/Learning";
import { Locations } from "@/components/site/Locations";
import { Reviews } from "@/components/site/Reviews";
import { Schedule } from "@/components/site/Schedule";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Videos } from "@/components/site/Videos";
import { getSiteData } from "@/lib/content";
import { siteUrl } from "@/lib/env";
import { getDictionary } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n/config";
import type { Locale, SectionKey, SiteData } from "@/lib/types";
import { cn, t, whatsappLink } from "@/lib/utils";

// ISR: the page is static and refreshed every 5 min, plus on-demand
// revalidation whenever an admin saves something in the dashboard.
export const revalidate = 300;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const d = getDictionary(locale);

  let data: SiteData | null = null;
  let failed = false;
  try {
    data = await getSiteData();
  } catch (e) {
    console.error("[site] failed to load content", e);
    failed = true;
  }

  if (!data) {
    return (
      <main className="water-bg flex min-h-screen items-center justify-center p-6 text-white">
        <div className="max-w-lg rounded-3xl bg-white/10 p-8 text-center backdrop-blur">
          <h1 className="text-2xl font-extrabold">{failed ? d.errors.generic : d.setup.title}</h1>
          {!failed ? <p className="mt-3 text-white/80">{d.setup.body}</p> : null}
        </div>
      </main>
    );
  }

  const { settings, sections: S } = data;
  const showDemo = settings.show_demo_badge;
  const currency = locale === "ar" ? settings.currency_ar : settings.currency_en;
  const wa = whatsappLink(settings.whatsapp, t(settings, "whatsapp_message", locale));

  // A section is shown when it's published (row present) and has content.
  const has = (key: SectionKey, nonEmpty = true) => !!S[key] && nonEmpty;
  const nav: NavItem[] = (
    [
      { id: "about", key: "about", show: has("about", !!data.coach) },
      { id: "courses", key: "courses", show: has("courses", data.courses.length > 0) },
      { id: "videos", key: "videos", show: has("videos", data.videos.length > 0) },
      { id: "learning", key: "learning", show: has("learning", data.lessons.length > 0) },
      { id: "age-groups", key: "age_groups", show: has("age_groups", data.ageGroups.length > 0) },
      { id: "equipment", key: "equipment", show: has("equipment", data.equipment.length > 0) },
      { id: "locations", key: "locations", show: has("locations", data.locations.length > 0) },
      { id: "schedule", key: "schedule", show: has("schedule", data.schedules.length > 0) },
      { id: "reviews", key: "reviews", show: has("reviews", data.reviews.length > 0) },
      { id: "faq", key: "faq", show: has("faq", data.faqs.length > 0) },
      { id: "contact", key: "contact", show: has("contact") },
    ] as (NavItem & { show: boolean })[]
  ).filter((n) => n.show);
  const visible = new Set(nav.map((n) => n.id));

  const heading = (key: SectionKey, fallback: string, light = false) => (
    <SectionHeading eyebrow={t(S[key], "eyebrow", locale)} title={t(S[key], "title", locale) || fallback} subtitle={t(S[key], "subtitle", locale)} light={light} />
  );

  const jsonLd = buildJsonLd(locale, data);

  return (
    <>
      <Header locale={locale} brandAr={settings.brand_name_ar} brandEn={settings.brand_name_en} items={nav} />
      <main id="main" className="overflow-x-clip">
        <Hero locale={locale} section={S.hero} settings={settings} coach={data.coach} />

        {visible.has("about") ? <About locale={locale} section={S.about} coach={data.coach} showDemo={showDemo} /> : null}

        {visible.has("courses") ? (
          <section id="courses" className="section bg-white">
            <div className="container-x">
              {heading("courses", d.nav.courses)}
              <Courses locale={locale} courses={data.courses} ageGroups={data.ageGroups} locations={data.locations}
                schedules={data.schedules} currency={currency} showDemo={showDemo} />
            </div>
          </section>
        ) : null}

        {visible.has("videos") ? (
          <section id="videos" className="section">
            <div className="container-x">
              {heading("videos", d.nav.videos)}
              <Videos locale={locale} videos={data.videos} />
            </div>
          </section>
        ) : null}

        {visible.has("learning") ? (
          <section id="learning" className="section bg-white">
            <div className="container-x">
              {heading("learning", d.nav.learning)}
              <Learning locale={locale} lessons={data.lessons} videos={data.videos} />
            </div>
          </section>
        ) : null}

        {visible.has("age-groups") ? (
          <section id="age-groups" className="section">
            <div className="container-x">
              {heading("age_groups", d.nav.age_groups)}
              <AgeGroups locale={locale} groups={data.ageGroups} courses={data.courses} />
            </div>
          </section>
        ) : null}

        {visible.has("equipment") ? (
          <section id="equipment" className="section bg-white">
            <div className="container-x">
              {heading("equipment", d.nav.equipment)}
              <EquipmentSection locale={locale} items={data.equipment} section={S.equipment} />
            </div>
          </section>
        ) : null}

        {visible.has("locations") ? (
          <section id="locations" className="section">
            <div className="container-x">
              {heading("locations", d.nav.locations)}
              <Locations locale={locale} locations={data.locations} courses={data.courses} />
            </div>
          </section>
        ) : null}

        {visible.has("schedule") ? (
          <section id="schedule" className="section bg-white">
            <div className="container-x">
              {heading("schedule", d.nav.schedule)}
              <Schedule locale={locale} schedules={data.schedules} courses={data.courses} locations={data.locations}
                ageGroups={data.ageGroups} coaches={data.coach ? [data.coach] : []} />
            </div>
          </section>
        ) : null}

        {visible.has("reviews") ? (
          <section id="reviews" className={cn("section water-bg overflow-hidden")}>
            <div className="caustics absolute inset-0 opacity-50" aria-hidden="true" />
            <div className="container-x relative">
              {heading("reviews", d.nav.reviews, true)}
              <Reviews locale={locale} reviews={data.reviews} courses={data.courses} showDemo={showDemo} />
            </div>
          </section>
        ) : null}

        {visible.has("faq") ? (
          <section id="faq" className="section">
            <div className="container-x">
              {heading("faq", d.nav.faq)}
              <Faq locale={locale} faqs={data.faqs} />
            </div>
          </section>
        ) : null}

        {visible.has("contact") ? (
          <section id="contact" className="section bg-white">
            <div className="container-x">
              {heading("contact", d.nav.contact)}
              <Contact locale={locale} settings={settings} section={S.contact} courses={data.courses}
                locations={data.locations} schedules={data.schedules} />
            </div>
          </section>
        ) : null}
      </main>
      <Footer locale={locale} settings={settings} items={nav} />
      <FloatingActions locale={locale} whatsapp={wa} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}

function buildJsonLd(locale: Locale, data: SiteData) {
  const base = siteUrl(data.settings.site_url);
  const url = `${base}/${locale}`;
  const brand = t(data.settings, "brand_name", locale);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "SportsActivityLocation",
      "@id": `${base}/#business`,
      name: brand,
      url,
      description: t(data.settings, "seo_description", locale),
      telephone: data.settings.phone ?? undefined,
      email: data.settings.email ?? undefined,
      image: data.settings.og_image_url ?? undefined,
      sameAs: [data.settings.facebook_url, data.settings.instagram_url, data.settings.youtube_url, data.settings.tiktok_url].filter(Boolean),
      address: data.settings.address_en ? { "@type": "PostalAddress", streetAddress: t(data.settings, "address", locale) } : undefined,
    },
    data.coach && {
      "@type": "Person",
      name: t(data.coach, "name", locale),
      jobTitle: t(data.coach, "title", locale),
      worksFor: { "@id": `${base}/#business` },
      image: data.coach.photo_url ?? undefined,
    },
    ...data.courses.map((c) => ({
      "@type": "Course",
      name: t(c, "title", locale),
      description: t(c, "summary", locale) || t(c, "description", locale),
      provider: { "@id": `${base}/#business` },
      inLanguage: locale,
      offers: c.price != null ? { "@type": "Offer", price: c.price, priceCurrency: data.settings.currency_en || "EGP", category: "Paid" } : undefined,
    })),
    data.faqs.length && {
      "@type": "FAQPage",
      mainEntity: data.faqs.map((f) => ({
        "@type": "Question",
        name: t(f, "question", locale),
        acceptedAnswer: { "@type": "Answer", text: t(f, "answer", locale) },
      })),
    },
  ].filter(Boolean) as Record<string, unknown>[];
  return { "@context": "https://schema.org", "@graph": graph };
}
