# Captain Amir Salami — كابتن أمير سلامي

A premium, bilingual (Arabic RTL / English LTR) **one-page** website for a personal swimming coach, with a separate, secure **admin dashboard**. Every piece of content (courses, videos, lessons, age groups, equipment, locations, schedule, reviews, FAQs, section texts, SEO and contact settings) is stored in **Supabase (PostgreSQL)** and editable from the dashboard, with no code changes needed.

> All initial content is **demo data**, flagged with `is_demo = true` in the database. Qualifications, statistics, prices and reviews are placeholders. They are **not** verified credentials or genuine customer endorsements, and the site shows "Demo" badges on them until you turn that off in **Settings**.

---

## Contents
1. [Tech stack](#tech-stack)
2. [Project structure](#project-structure)
3. [Quick start (local)](#quick-start-local)
4. [Supabase configuration (production)](#supabase-configuration-production)
5. [Environment variables](#environment-variables)
6. [Admin accounts & roles](#admin-accounts--roles)
7. [Replacing the demo data](#replacing-the-demo-data)
8. [Uploading images and videos](#uploading-images-and-videos)
9. [Deployment](#deployment)
10. [Database schema](#database-schema)
11. [Completed features](#completed-features)
12. [External services & credentials](#external-services--credentials)
13. [Testing performed](#testing-performed)

---

## Tech stack
| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, custom design system (navy `#061B35`, ocean `#0877B9`, turquoise `#20C6C8`), Cairo (Arabic) + Outfit (English) fonts |
| Icons | lucide-react (+ small inline brand glyphs) |
| Data | Supabase PostgreSQL with Row Level Security |
| Auth | Supabase Auth (email + password), `admins` table with roles |
| Storage | Supabase Storage public bucket `media` |
| Forms | React Hook Form + Zod (client), Zod + SQL checks (server) |
| Charts | Recharts |

## Project structure
```
src/
  app/
    (site)/[locale]/        → the ONE public page at /ar and /en (+ actions, OG image, 404)
    admin/                  → dashboard (login, overview, generic CRUD, registrations, media, SEO, settings)
    admin/registrations/export/route.ts → CSV export
    sitemap.ts, robots.ts
  components/
    site/                   → Header, Hero, About, Courses, Videos, Learning, AgeGroups/Equipment,
                              Locations, Schedule, Reviews, FAQ, Contact (registration), Footer, floating buttons
    admin/                  → Shell, ResourceList, RecordForm, ImageField/MediaPicker, MediaLibrary, charts…
    ui/                     → Logo, Modal, SmartImage, Icon, Stars, social icons
  lib/
    i18n/                   → centralized Arabic & English UI dictionaries
    admin/resources.ts      → declarative definition of every manageable table (fields, columns, labels)
    admin/payload.ts        → server-side validation/normalisation of admin forms
    content.ts              → loads all published content for the public page
    validation.ts           → Zod schemas (registration, review)
    supabase/               → server / browser clients
  middleware.ts             → "/" → language redirect, remembers language, protects /admin
supabase/
  migrations/               → schema, RLS policies, storage bucket, SQL functions
  seed.sql                  → demo data (all rows is_demo = true)
  config.toml               → Supabase CLI local config
scripts/
  create-admin.mjs          → create/promote an admin user
  seed.mjs                  → load / reset / clear demo data on any database
```

## Quick start (local)
Requirements: Node 20+, Docker (for the local Supabase stack).

```bash
npm install
npx supabase start          # starts Postgres, Auth, Storage, REST locally (Docker)
npx supabase db reset       # applies migrations + supabase/seed.sql (demo data)
cp .env.example .env.local  # then paste the values printed by `npx supabase status`
npm run create-admin -- admin@example.com 'StrongPass123!' super_admin "Your Name"
npm run dev                 # http://localhost:3000 → redirects to /ar
```
Dashboard: http://localhost:3000/admin

For a local stack, `.env.local` uses:
`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`, the `ANON_KEY` / `SERVICE_ROLE_KEY` from `npx supabase status`, and `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres`.

## Supabase configuration (production)
1. Create a project at [supabase.com](https://supabase.com).
2. **Apply the schema** using one of these:
   - CLI: `npx supabase link --project-ref <ref>` then `npx supabase db push`
   - or paste `supabase/migrations/20261109000001_schema.sql` and then `…000002_security.sql` into **SQL Editor** and run them in order.
3. **Load demo data**: `npm run seed` (uses `DATABASE_URL`), or paste `supabase/seed.sql` into the SQL Editor.
4. **Auth settings** (Authentication → URL configuration): set *Site URL* to your domain. For an admin-only site, disable public sign-ups (Authentication → Providers → Email → turn off "Allow new users to sign up"). Admins are created with the script below.
5. **Storage**: the migration creates the public `media` bucket (10 MB limit, images only) and its policies. Nothing else to do.

## Environment variables
See `.env.example`.

| Variable | Where used | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | app (browser + server) | no |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | app (browser + server). Protected by RLS. | no |
| `NEXT_PUBLIC_SITE_URL` | canonical URLs, sitemap, Open Graph | no |
| `SUPABASE_SERVICE_ROLE_KEY` | **only** `scripts/create-admin.mjs` | **yes**, never deploy it to the browser |
| `DATABASE_URL` | **only** `scripts/seed.mjs` | **yes** |

The web app never uses the service-role key. All admin writes run as the signed-in user and are authorised by RLS.

## Admin accounts & roles
```bash
npm run create-admin -- <email> <password> [super_admin|admin|editor] [full name]
```
Running it again for an existing email updates the password and role.

| Role | Can do |
|---|---|
| `editor` | manage all website content, reviews and media |
| `admin` | everything an editor can do, plus registrations, students, CSV export, SEO and general settings |
| `super_admin` | everything, plus managing rows in the `admins` table |

Roles are enforced in the database (RLS) and in the UI.

## Replacing the demo data
Everything is editable at **/admin**, in Arabic and English side by side:

| What | Where in the dashboard |
|---|---|
| Coach bio, photo, stats, certifications | **About Captain Amir** |
| Hero headline, buttons, background, section titles, preparation and safety lists | **Website Content** (unpublish a section to hide it from the page and the menu) |
| Phone, WhatsApp, email, address, social links, currency, demo badges | **General Settings** |
| SEO titles, descriptions, keywords, share image, Google verification | **SEO Settings** |
| Courses, Videos, Lessons, Age Groups, Equipment, Locations, Schedules, Reviews, FAQs | their own sections (add, edit, delete, publish/hide, reorder) |

**Finding demo rows:** every list has a **Demo / Real** filter, and demo rows show a "Demo" badge. When your real content is in, you can either:
- delete demo rows one by one in the dashboard, or
- remove all of them at once: `npm run seed -- --clear` (deletes every row with `is_demo = true`), or in SQL: `delete from <table> where is_demo;`

Finally, untick **"Show Demo badges"** in General Settings.

## Uploading images and videos
- **Images:** every image field has **Upload** (stored in Supabase Storage → `media` bucket and recorded in the Media Library), **Library** (pick an existing upload), or paste any `https://` URL. **Media Library** lets you upload in bulk (drag and drop), filter by folder (coach, courses, pools, thumbnails…), copy URLs, edit alt text, **replace** a file while keeping its URL, and delete. Allowed: JPG, PNG, WebP, AVIF, GIF, SVG, up to 10 MB.
- **Videos:** go to **Videos → Add new** and paste a YouTube link (`youtube.com/watch?v=…`, `youtu.be/…`, `/shorts/…`) or a Vimeo link. The provider, ID and thumbnail are detected automatically. A custom thumbnail is optional. Link videos to lessons from the lesson form ("Related videos").
- **Hero background video:** in **Website Content → hero**, set *Background video* to a direct `.mp4`/`.webm` URL (e.g. uploaded to Supabase Storage).
- **Maps:** each location takes a *Google Maps link* (opens in Maps) and an optional *Map embed URL* (shown in a modal). The simplest embed URL that needs no API key is `https://www.google.com/maps?q=<address>&output=embed`.

## Deployment
**Vercel (recommended):**
1. Push the repo and import it in Vercel.
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SITE_URL` as environment variables. Do **not** add the service-role key.
3. Deploy. The public page is statically generated per language and refreshed every 5 minutes (ISR), and instantly whenever an admin saves something (on-demand revalidation).
4. In Supabase Auth, set the Site URL to the production domain.

Any Node host also works: `npm run build && npm start`.

## Database schema
Tables (all in `public`, all with RLS):

| Table | Purpose |
|---|---|
| `admins` | links `auth.users` to a role |
| `site_settings` | single row: brand, contact, social, SEO |
| `website_sections` | headings/texts per page section (`hero`, `about`, … `footer`) |
| `coaches` | coach profiles and statistics (one `is_primary`) |
| `courses` + `course_locations` | courses and the locations they run at (M:N) |
| `videos` | YouTube/Vimeo videos (`provider`, `provider_video_id` parsed from URL) |
| `lessons` + `lesson_videos` | step-by-step lessons and related videos (M:N) |
| `age_groups` | editable age ranges, approach, objectives |
| `equipment` | essential/recommended items |
| `locations` | pools, address, map links, facilities, training days, hours |
| `schedules` | weekly sessions: course, location, coach, age group, day, times, `capacity`, `booked_count`, status |
| `students` | unique per phone + name |
| `registrations` | form submissions (snapshot + links), status workflow, internal notes |
| `reviews` | rating, AR/EN text, course, date, approval status, source |
| `faqs` | AR/EN questions and answers |
| `media` | uploaded files (bucket path, URL, folder, alt text) |

Key rules in the database:
- **Capacity:** a registration linked to a session holds a seat while it is `new`, `pending` or `approved`. A trigger keeps `booked_count` in sync, and a check constraint (`booked_count <= capacity`) makes overbooking impossible, including under concurrent requests. Admins get a clear error if approving would exceed capacity.
- **Public writes** go only through `submit_registration(jsonb)` and `submit_review(jsonb)` (security-definer functions with validation and rate limits). Visitors can never read registrations, students, admins or media rows.
- Public reads are limited to published rows and approved reviews.

## Completed features
**Public one-page site** (`/ar` default, `/en`)
- Arabic RTL and English LTR, language switcher, remembered language (cookie), `/` redirects by cookie or browser language
- Sticky header with scroll-spy, smooth scrolling, mobile hamburger menu, skip link
- Hero with background image or video, CTAs, highlights, animated wave
- About: photo, bio, philosophy, stats, specialties, certifications, achievements, demo notice
- Courses: cards, filters (level, age group, type), detail modal (objectives, requirements, locations, live schedules, price), "Book this course" prefills the form
- Video gallery: featured video, category chips, search, "show more" pagination, YouTube/Vimeo modal player (privacy-enhanced embeds)
- Learn to Swim: 15 step-by-step lessons with steps, tips, level, time, related videos, previous/next
- Age groups with recommended ranges, approach, objectives, considerations, matching programs, guardian notice
- Equipment, preparation instructions and safety requirements
- Locations: photo, gallery lightbox, address, facilities, training days, hours, map modal, Google Maps, call, WhatsApp
- Weekly schedule: day tabs, filters (day/course/age/location), availability indicators and capacity bars, full/closed sessions not bookable, "Book this session" prefills the form
- Testimonials carousel (auto-advance, pause on hover/focus), average rating, **"Write a review"** form (goes to admin approval)
- FAQ accordion (accessible)
- Contact: WhatsApp, phone, email, social links, registration form with all 11 fields, live validation, minor → parent required, sessions filtered by course/location/day with seats left, honeypot + timing + IP rate limit + DB rate limit, success screen with reference number that clearly says the booking is **pending review**
- Footer, floating WhatsApp button, back-to-top button
- SEO: per-language metadata, canonical and `hreflang` alternates, Open Graph (auto-generated image or custom), JSON-LD (SportsActivityLocation, Person, Course, FAQPage), `sitemap.xml`, `robots.txt`; semantic headings; lazy images via `next/image` with branded fallbacks
- Accessibility: focus-trapped modals, ESC to close, ARIA states, reduced-motion support

**Admin dashboard** (`/admin`, Arabic/English UI)
- Supabase Auth login, protected routes (middleware and server checks), roles, sign out
- Overview: 8 stat cards, 14-day registrations chart, status donut, registrations by course, recent registrations, upcoming sessions, latest reviews, demo-data and pending-review banners
- Generic CRUD for Courses, Videos, Lessons, Age Groups, Equipment, Locations, Schedules, Students, Reviews, FAQs, Coaches, Website Content: search, demo/real filter, pagination, create, edit, delete (with confirmation), publish/unpublish, reorder, bilingual fields side by side, server-side validation with field errors, success/error toasts
- Registrations: status tabs with counts, search, course/location filters, inline status change, detail page (contact shortcuts, internal notes, status), delete, CSV export (UTF-8 with BOM for Excel, formula-injection safe)
- Reviews: one-click approve/reject
- Media library: upload (multi, drag and drop), folders, preview, copy URL, alt text, replace, delete
- General settings and SEO settings

## External services & credentials
| Feature | Needs |
|---|---|
| Database, auth, storage, registrations | A Supabase project (URL + anon key). Nothing works without it; the site shows a "Database not configured" screen instead of fake data. |
| Admin creation / seeding scripts | Service-role key / `DATABASE_URL` (local machine only) |
| YouTube / Vimeo videos | none (public embeds) |
| Google Maps | none for the link/embed formats above. A Maps Embed API key is only needed if you choose the `/maps/embed/v1/…` URL format. |
| WhatsApp button | none (`wa.me` link). Set the number in Settings. |
| Email notifications for new registrations | **Not included.** Registrations appear in the dashboard (with a badge). To get emails, add a Supabase Database Webhook / Edge Function with an email provider (e.g. Resend), which needs that provider's API key. |
| Google Search Console | paste the verification code in SEO Settings |

Demo images are hot-linked from Unsplash and demo videos are public YouTube tutorials by other creators. Replace both with your own media before launch.

## Testing performed
Tested against a real local Supabase stack (Postgres, Auth, Storage, PostgREST):
- Migrations and seed apply cleanly. Counts: 8 courses, 15 lessons, 12 videos, 1 coach, 4 locations, 20 sessions, 15 registrations, 12 reviews, 10 FAQs, 8 equipment items, 5 age groups. Seat counters are derived correctly by the trigger.
- Browser end-to-end (Playwright, production build): course filters and modal, booking prefill, video filter/search/player, lessons navigation, schedule filters, FAQ, form validation (phone, minor → parent), successful registration (seat count incremented in DB), review submission (stored as pending), language switch (RTL ↔ LTR), no horizontal overflow on mobile in either language.
- Admin: login (wrong and correct password), all 21 screens load, create/edit/delete course with locations, duplicate-slug error, unpublish, reorder, schedule time validation, add video from URL only, approve review, change registration status with notes, CSV export, image upload to Storage, settings save, admin language switch, editor role blocked from registrations and CSV (403), sign out.
- Security, as an anonymous API user: reading registrations/students/admins is denied, inserting content is denied, updating settings affects 0 rows, the dashboard stats function is forbidden, overbooking a full session returns `SESSION_FULL`, a closed session returns `SESSION_CLOSED`, a minor without a parent returns `PARENT_REQUIRED`.
