-- =====================================================================
-- Captain Amir Salami — core schema
-- Every bilingual field has an *_ar and *_en column.
-- Every content table has: is_demo (marks seed/demo rows), is_published,
-- sort_order, created_at, updated_at.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- helpers ----------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- admins -----------------------------------------------------
create table public.admins (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text,
  role        text not null default 'admin'
              check (role in ('super_admin', 'admin', 'editor')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Role helpers (security definer so they can be used inside RLS policies
-- without recursive policy evaluation on the admins table).
create or replace function public.admin_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.admins where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where id = auth.uid())
$$;

-- admin or super_admin (can see registrations / students / settings)
create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where id = auth.uid() and role in ('super_admin','admin'))
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where id = auth.uid() and role = 'super_admin')
$$;

-- ---------- site settings (single row) --------------------------------
create table public.site_settings (
  id                  smallint primary key default 1 check (id = 1),
  brand_name_ar       text not null default 'كابتن أمير سلامي',
  brand_name_en       text not null default 'Captain Amir Salami',
  tagline_ar          text,
  tagline_en          text,
  footer_about_ar     text,
  footer_about_en     text,
  logo_url            text,
  favicon_url         text,
  phone               text,
  whatsapp            text,            -- international format, digits only e.g. 201000000000
  whatsapp_message_ar text,
  whatsapp_message_en text,
  email               text,
  address_ar          text,
  address_en          text,
  facebook_url        text,
  instagram_url       text,
  youtube_url         text,
  tiktok_url          text,
  x_url               text,
  currency_ar         text not null default 'ج.م',
  currency_en         text not null default 'EGP',
  show_demo_badge     boolean not null default true,
  -- SEO
  site_url            text,
  seo_title_ar        text,
  seo_title_en        text,
  seo_description_ar  text,
  seo_description_en  text,
  seo_keywords_ar     text,
  seo_keywords_en     text,
  og_image_url        text,
  google_site_verification text,
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------- website sections (headings / texts per one-page section) --
create table public.website_sections (
  id                uuid primary key default gen_random_uuid(),
  key               text not null unique
                    check (key in ('hero','about','courses','videos','learning','age_groups',
                                   'equipment','locations','schedule','reviews','faq','contact','footer')),
  eyebrow_ar        text,
  eyebrow_en        text,
  title_ar          text not null default '',
  title_en          text not null default '',
  subtitle_ar       text,
  subtitle_en       text,
  body_ar           text,
  body_en           text,
  cta_primary_ar    text,
  cta_primary_en    text,
  cta_secondary_ar  text,
  cta_secondary_en  text,
  image_url         text,
  video_url         text,
  highlights_ar     text[] not null default '{}',
  highlights_en     text[] not null default '{}',
  notes_ar          text[] not null default '{}',
  notes_en          text[] not null default '{}',
  is_published      boolean not null default true,
  sort_order        integer not null default 0,
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------- coaches ----------------------------------------------------
create table public.coaches (
  id                  uuid primary key default gen_random_uuid(),
  name_ar             text not null,
  name_en             text not null,
  title_ar            text,
  title_en            text,
  photo_url           text,
  bio_ar              text,
  bio_en              text,
  philosophy_ar       text,
  philosophy_en       text,
  specialties_ar      text[] not null default '{}',
  specialties_en      text[] not null default '{}',
  certifications_ar   text[] not null default '{}',
  certifications_en   text[] not null default '{}',
  achievements_ar     text[] not null default '{}',
  achievements_en     text[] not null default '{}',
  years_experience    integer not null default 0 check (years_experience >= 0),
  students_trained    integer not null default 0 check (students_trained >= 0),
  programs_count      integer not null default 0 check (programs_count >= 0),
  satisfaction_rate   integer not null default 0 check (satisfaction_rate between 0 and 100),
  phone               text,
  email               text,
  is_primary          boolean not null default false,
  is_published        boolean not null default true,
  sort_order          integer not null default 0,
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create unique index coaches_one_primary on public.coaches (is_primary) where is_primary;

-- ---------- age groups -------------------------------------------------
create table public.age_groups (
  id                  uuid primary key default gen_random_uuid(),
  name_ar             text not null,
  name_en             text not null,
  age_min             integer not null check (age_min >= 0),
  age_max             integer check (age_max is null or age_max >= age_min),
  icon                text not null default 'users',
  image_url           text,
  approach_ar         text,
  approach_en         text,
  objectives_ar       text[] not null default '{}',
  objectives_en       text[] not null default '{}',
  considerations_ar   text[] not null default '{}',
  considerations_en   text[] not null default '{}',
  requires_guardian   boolean not null default false,
  is_published        boolean not null default true,
  sort_order          integer not null default 0,
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------- locations --------------------------------------------------
create table public.locations (
  id                  uuid primary key default gen_random_uuid(),
  name_ar             text not null,
  name_en             text not null,
  image_url           text,
  gallery_urls        text[] not null default '{}',
  address_ar          text,
  address_en          text,
  city_ar             text,
  city_en             text,
  map_url             text,
  map_embed_url       text,
  facilities_ar       text[] not null default '{}',
  facilities_en       text[] not null default '{}',
  training_days       smallint[] not null default '{}',   -- 0=Saturday … 6=Friday
  working_hours_ar    text,
  working_hours_en    text,
  phone               text,
  whatsapp            text,
  email               text,
  is_published        boolean not null default true,
  sort_order          integer not null default 0,
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint locations_training_days_valid check (training_days <@ array[0,1,2,3,4,5,6]::smallint[])
);

-- ---------- courses ----------------------------------------------------
create table public.courses (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title_ar            text not null,
  title_en            text not null,
  image_url           text,
  summary_ar          text,
  summary_en          text,
  description_ar      text,
  description_en      text,
  level               text not null default 'beginner'
                      check (level in ('beginner','intermediate','advanced','all')),
  course_type         text not null default 'group'
                      check (course_type in ('group','private','kids','adults','professional','safety')),
  age_min             integer not null default 0 check (age_min >= 0),
  age_max             integer check (age_max is null or age_max >= age_min),
  duration_weeks      integer not null default 4 check (duration_weeks > 0),
  session_minutes     integer not null default 45 check (session_minutes > 0),
  sessions_count      integer not null default 8 check (sessions_count > 0),
  objectives_ar       text[] not null default '{}',
  objectives_en       text[] not null default '{}',
  requirements_ar     text[] not null default '{}',
  requirements_en     text[] not null default '{}',
  price               numeric(10,2) check (price is null or price >= 0),
  price_note_ar       text,
  price_note_en       text,
  is_featured         boolean not null default false,
  is_published        boolean not null default true,
  sort_order          integer not null default 0,
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.course_locations (
  course_id   uuid not null references public.courses(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  primary key (course_id, location_id)
);

-- ---------- videos -----------------------------------------------------
create table public.videos (
  id                  uuid primary key default gen_random_uuid(),
  title_ar            text not null,
  title_en            text not null,
  description_ar      text,
  description_en      text,
  category            text not null default 'beginner'
                      check (category in ('beginner','techniques','breathing','exercises','pro_tips','water_safety')),
  level               text not null default 'beginner'
                      check (level in ('beginner','intermediate','advanced','all')),
  video_url           text not null,
  provider            text not null check (provider in ('youtube','vimeo')),
  provider_video_id   text not null,
  thumbnail_url       text,
  duration_seconds    integer check (duration_seconds is null or duration_seconds >= 0),
  is_featured         boolean not null default false,
  is_published        boolean not null default true,
  sort_order          integer not null default 0,
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------- lessons ----------------------------------------------------
create table public.lessons (
  id                  uuid primary key default gen_random_uuid(),
  title_ar            text not null,
  title_en            text not null,
  icon                text not null default 'waves',
  image_url           text,
  video_url           text,
  description_ar      text,
  description_en      text,
  level               text not null default 'beginner'
                      check (level in ('beginner','intermediate','advanced','all')),
  estimated_minutes   integer check (estimated_minutes is null or estimated_minutes > 0),
  steps_ar            text[] not null default '{}',
  steps_en            text[] not null default '{}',
  tips_ar             text[] not null default '{}',
  tips_en             text[] not null default '{}',
  is_published        boolean not null default true,
  sort_order          integer not null default 0,
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.lesson_videos (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  video_id  uuid not null references public.videos(id) on delete cascade,
  primary key (lesson_id, video_id)
);

-- ---------- equipment --------------------------------------------------
create table public.equipment (
  id                  uuid primary key default gen_random_uuid(),
  name_ar             text not null,
  name_en             text not null,
  description_ar      text,
  description_en      text,
  icon                text not null default 'package',
  image_url           text,
  category            text not null default 'essential'
                      check (category in ('essential','recommended')),
  is_published        boolean not null default true,
  sort_order          integer not null default 0,
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------- schedules (training sessions) -----------------------------
create table public.schedules (
  id                  uuid primary key default gen_random_uuid(),
  course_id           uuid not null references public.courses(id) on delete cascade,
  location_id         uuid not null references public.locations(id) on delete cascade,
  coach_id            uuid references public.coaches(id) on delete set null,
  age_group_id        uuid references public.age_groups(id) on delete set null,
  day_of_week         smallint not null check (day_of_week between 0 and 6), -- 0=Saturday
  start_time          time not null,
  end_time            time not null,
  capacity            integer not null check (capacity > 0),
  booked_count        integer not null default 0 check (booked_count >= 0),
  status              text not null default 'open' check (status in ('open','closed','cancelled')),
  notes_ar            text,
  notes_en            text,
  is_published        boolean not null default true,
  sort_order          integer not null default 0,
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint schedules_time_order check (end_time > start_time),
  constraint schedules_capacity_not_exceeded check (booked_count <= capacity)
);
create index schedules_day_idx on public.schedules (day_of_week, start_time);

-- ---------- students ---------------------------------------------------
create table public.students (
  id                  uuid primary key default gen_random_uuid(),
  full_name           text not null,
  parent_name         text,
  age                 integer check (age between 1 and 100),
  phone               text not null,
  email               text,
  experience          text check (experience in ('none','basic','intermediate','advanced')),
  notes               text,
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create unique index students_phone_name_uidx on public.students (phone, lower(full_name));

-- ---------- registrations ---------------------------------------------
create table public.registrations (
  id                  uuid primary key default gen_random_uuid(),
  reference           text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  student_id          uuid references public.students(id) on delete set null,
  course_id           uuid references public.courses(id) on delete set null,
  location_id         uuid references public.locations(id) on delete set null,
  schedule_id         uuid references public.schedules(id) on delete set null,
  -- snapshot of submitted form
  student_name        text not null,
  parent_name         text,
  age                 integer not null check (age between 1 and 100),
  phone               text not null,
  email               text,
  experience          text not null check (experience in ('none','basic','intermediate','advanced')),
  preferred_day       smallint check (preferred_day between 0 and 6),
  preferred_time      text check (preferred_time in ('any','morning','afternoon','evening','session')),
  notes               text,
  locale              text not null default 'ar' check (locale in ('ar','en')),
  status              text not null default 'new'
                      check (status in ('new','pending','approved','rejected','completed')),
  internal_notes      text,
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index registrations_status_idx on public.registrations (status, created_at desc);

-- ---------- reviews ----------------------------------------------------
create table public.reviews (
  id                  uuid primary key default gen_random_uuid(),
  customer_name       text not null,
  photo_url           text,
  rating              smallint not null check (rating between 1 and 5),
  text_ar             text,
  text_en             text,
  course_id           uuid references public.courses(id) on delete set null,
  review_date         date not null default current_date,
  status              text not null default 'pending' check (status in ('pending','approved','rejected')),
  source              text not null default 'admin' check (source in ('admin','website')),
  sort_order          integer not null default 0,
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint reviews_has_text check (coalesce(text_ar, text_en) is not null)
);

-- ---------- faqs -------------------------------------------------------
create table public.faqs (
  id                  uuid primary key default gen_random_uuid(),
  question_ar         text not null,
  question_en         text not null,
  answer_ar           text not null,
  answer_en           text not null,
  is_published        boolean not null default true,
  sort_order          integer not null default 0,
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------- media library ---------------------------------------------
create table public.media (
  id                  uuid primary key default gen_random_uuid(),
  bucket              text not null default 'media',
  path                text not null,
  url                 text not null,
  file_name           text not null,
  mime_type           text,
  size_bytes          bigint,
  folder              text not null default 'general'
                      check (folder in ('general','coach','courses','locations','thumbnails','lessons','reviews','brand')),
  alt_ar              text,
  alt_en              text,
  uploaded_by         uuid references auth.users(id) on delete set null,
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (bucket, path)
);

-- ---------- updated_at triggers ---------------------------------------
do $$
declare t text;
begin
  foreach t in array array['admins','site_settings','website_sections','coaches','age_groups','locations',
                           'courses','videos','lessons','equipment','schedules','students','registrations',
                           'reviews','faqs','media']
  loop
    execute format('create trigger %I_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- =====================================================================
-- Booking capacity: a registration linked to a session holds a seat while
-- it is new / pending / approved. booked_count is kept in sync here and the
-- check constraint (booked_count <= capacity) makes overbooking impossible,
-- even under concurrent submissions (row lock on the schedule).
-- =====================================================================
create or replace function public.registration_holds_seat(p_status text)
returns boolean language sql immutable as $$
  select p_status in ('new','pending','approved')
$$;

create or replace function public.sync_schedule_seats()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  old_holds boolean := false;
  new_holds boolean := false;
begin
  if tg_op in ('UPDATE','DELETE') then
    old_holds := old.schedule_id is not null and public.registration_holds_seat(old.status);
  end if;
  if tg_op in ('INSERT','UPDATE') then
    new_holds := new.schedule_id is not null and public.registration_holds_seat(new.status);
  end if;

  if tg_op = 'UPDATE' and old_holds and new_holds and old.schedule_id = new.schedule_id then
    return new;
  end if;

  if old_holds then
    update public.schedules set booked_count = greatest(booked_count - 1, 0) where id = old.schedule_id;
  end if;

  if new_holds then
    begin
      update public.schedules set booked_count = booked_count + 1 where id = new.schedule_id;
    exception when check_violation then
      raise exception 'SESSION_FULL' using errcode = 'P0001',
        hint = 'The selected training session has reached its maximum capacity.';
    end;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

create trigger registrations_sync_seats
after insert or update of status, schedule_id or delete on public.registrations
for each row execute function public.sync_schedule_seats();

-- =====================================================================
-- Public registration entry point. Anonymous visitors cannot write to the
-- tables directly; they call this function, which validates input,
-- upserts the student and creates the registration atomically.
-- =====================================================================
create or replace function public.submit_registration(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_name       text := btrim(payload->>'student_name');
  v_parent     text := nullif(btrim(coalesce(payload->>'parent_name','')), '');
  v_age        integer := (payload->>'age')::integer;
  v_phone      text := regexp_replace(coalesce(payload->>'phone',''), '[^0-9+]', '', 'g');
  v_email      text := nullif(lower(btrim(coalesce(payload->>'email',''))), '');
  v_exp        text := payload->>'experience';
  v_course     uuid := nullif(payload->>'course_id','')::uuid;
  v_location   uuid := nullif(payload->>'location_id','')::uuid;
  v_schedule   uuid := nullif(payload->>'schedule_id','')::uuid;
  v_day        smallint := nullif(payload->>'preferred_day','')::smallint;
  v_time       text := coalesce(nullif(payload->>'preferred_time',''), 'any');
  v_notes      text := nullif(btrim(coalesce(payload->>'notes','')), '');
  v_locale     text := coalesce(nullif(payload->>'locale',''), 'ar');
  v_student    uuid;
  v_reg        public.registrations;
  v_sched      public.schedules;
begin
  if v_name is null or length(v_name) < 3 or length(v_name) > 120 then
    raise exception 'INVALID_NAME' using errcode = '22023';
  end if;
  if v_age is null or v_age < 1 or v_age > 100 then
    raise exception 'INVALID_AGE' using errcode = '22023';
  end if;
  if v_age < 18 and v_parent is null then
    raise exception 'PARENT_REQUIRED' using errcode = '22023';
  end if;
  if length(regexp_replace(v_phone, '\D', '', 'g')) not between 8 and 15 then
    raise exception 'INVALID_PHONE' using errcode = '22023';
  end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'INVALID_EMAIL' using errcode = '22023';
  end if;
  if v_exp not in ('none','basic','intermediate','advanced') then
    raise exception 'INVALID_EXPERIENCE' using errcode = '22023';
  end if;
  if v_notes is not null and length(v_notes) > 1000 then
    raise exception 'NOTES_TOO_LONG' using errcode = '22023';
  end if;
  if v_course is not null and not exists (select 1 from courses where id = v_course and is_published) then
    raise exception 'INVALID_COURSE' using errcode = '22023';
  end if;
  if v_location is not null and not exists (select 1 from locations where id = v_location and is_published) then
    raise exception 'INVALID_LOCATION' using errcode = '22023';
  end if;

  if v_schedule is not null then
    select * into v_sched from schedules where id = v_schedule and is_published for update;
    if not found then raise exception 'INVALID_SESSION' using errcode = '22023'; end if;
    if v_sched.status <> 'open' then raise exception 'SESSION_CLOSED' using errcode = 'P0001'; end if;
    if v_sched.booked_count >= v_sched.capacity then raise exception 'SESSION_FULL' using errcode = 'P0001'; end if;
    v_course   := coalesce(v_course, v_sched.course_id);
    v_location := coalesce(v_location, v_sched.location_id);
    v_day      := v_sched.day_of_week;
    v_time     := 'session';
  end if;

  -- simple abuse guard: max 3 registrations per phone per hour
  if (select count(*) from registrations
      where phone = v_phone and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'TOO_MANY_REQUESTS' using errcode = 'P0001';
  end if;

  insert into students (full_name, parent_name, age, phone, email, experience)
  values (v_name, v_parent, v_age, v_phone, v_email, v_exp)
  on conflict (phone, lower(full_name)) do update
    set parent_name = coalesce(excluded.parent_name, students.parent_name),
        age         = excluded.age,
        email       = coalesce(excluded.email, students.email),
        experience  = excluded.experience
  returning id into v_student;

  insert into registrations (student_id, course_id, location_id, schedule_id, student_name, parent_name,
                             age, phone, email, experience, preferred_day, preferred_time, notes, locale, status)
  values (v_student, v_course, v_location, v_schedule, v_name, v_parent, v_age, v_phone, v_email, v_exp,
          v_day, v_time, v_notes, v_locale, 'new')
  returning * into v_reg;

  return jsonb_build_object('reference', v_reg.reference, 'status', v_reg.status);
end $$;

-- Public review submission (always lands as pending, needs admin approval)
create or replace function public.submit_review(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_name   text := btrim(coalesce(payload->>'customer_name',''));
  v_rating smallint := (payload->>'rating')::smallint;
  v_text   text := btrim(coalesce(payload->>'text',''));
  v_locale text := coalesce(nullif(payload->>'locale',''), 'ar');
  v_course uuid := nullif(payload->>'course_id','')::uuid;
begin
  if length(v_name) < 2 or length(v_name) > 80 then raise exception 'INVALID_NAME' using errcode='22023'; end if;
  if v_rating is null or v_rating not between 1 and 5 then raise exception 'INVALID_RATING' using errcode='22023'; end if;
  if length(v_text) < 10 or length(v_text) > 800 then raise exception 'INVALID_TEXT' using errcode='22023'; end if;
  if v_course is not null and not exists (select 1 from courses where id = v_course) then v_course := null; end if;
  if (select count(*) from reviews where source = 'website' and created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'TOO_MANY_REQUESTS' using errcode = 'P0001';
  end if;
  insert into reviews (customer_name, rating, text_ar, text_en, course_id, status, source)
  values (v_name, v_rating,
          case when v_locale = 'ar' then v_text end,
          case when v_locale = 'en' then v_text end,
          v_course, 'pending', 'website');
  return jsonb_build_object('status', 'pending');
end $$;

-- Dashboard statistics in a single round-trip
create or replace function public.dashboard_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  return jsonb_build_object(
    'registrations_total',   (select count(*) from registrations),
    'registrations_new',     (select count(*) from registrations where status = 'new'),
    'registrations_pending', (select count(*) from registrations where status = 'pending'),
    'registrations_approved',(select count(*) from registrations where status = 'approved'),
    'courses',   (select count(*) from courses),
    'videos',    (select count(*) from videos),
    'locations', (select count(*) from locations),
    'reviews',   (select count(*) from reviews),
    'reviews_pending', (select count(*) from reviews where status = 'pending'),
    'students',  (select count(*) from students),
    'sessions',  (select count(*) from schedules where status = 'open'),
    'by_status', (select coalesce(jsonb_object_agg(status, c), '{}'::jsonb)
                  from (select status, count(*) c from registrations group by status) s),
    'by_day',    (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'count', coalesce(c,0)) order by d), '[]'::jsonb)
                  from generate_series(current_date - 13, current_date, interval '1 day') d
                  left join (select created_at::date dd, count(*) c from registrations group by 1) r on r.dd = d::date),
    'by_course', (select coalesce(jsonb_agg(jsonb_build_object('title_ar', c.title_ar, 'title_en', c.title_en, 'count', x.c) order by x.c desc), '[]'::jsonb)
                  from (select course_id, count(*) c from registrations where course_id is not null group by course_id) x
                  join courses c on c.id = x.course_id)
  );
end $$;
