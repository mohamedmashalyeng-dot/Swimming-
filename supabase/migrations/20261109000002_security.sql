-- =====================================================================
-- Row Level Security
--  * Public (anon) visitors can only READ published content.
--  * Visitors can never read registrations, students, admins or media rows
--    directly; they submit through security-definer functions.
--  * editors manage content; admins also manage registrations/students/settings;
--    super_admins also manage admin accounts.
-- =====================================================================

alter table public.admins            enable row level security;
alter table public.site_settings     enable row level security;
alter table public.website_sections  enable row level security;
alter table public.coaches           enable row level security;
alter table public.age_groups        enable row level security;
alter table public.locations         enable row level security;
alter table public.courses           enable row level security;
alter table public.course_locations  enable row level security;
alter table public.videos            enable row level security;
alter table public.lessons           enable row level security;
alter table public.lesson_videos     enable row level security;
alter table public.equipment         enable row level security;
alter table public.schedules         enable row level security;
alter table public.students          enable row level security;
alter table public.registrations     enable row level security;
alter table public.reviews           enable row level security;
alter table public.faqs              enable row level security;
alter table public.media             enable row level security;

-- ---------- public read of published content --------------------------
create policy "public read settings"   on public.site_settings    for select using (true);
create policy "public read sections"   on public.website_sections for select using (is_published or public.is_admin());
create policy "public read coaches"    on public.coaches          for select using (is_published or public.is_admin());
create policy "public read age groups" on public.age_groups       for select using (is_published or public.is_admin());
create policy "public read locations"  on public.locations        for select using (is_published or public.is_admin());
create policy "public read courses"    on public.courses          for select using (is_published or public.is_admin());
create policy "public read course_loc" on public.course_locations for select using (true);
create policy "public read videos"     on public.videos           for select using (is_published or public.is_admin());
create policy "public read lessons"    on public.lessons          for select using (is_published or public.is_admin());
create policy "public read lesson_vid" on public.lesson_videos    for select using (true);
create policy "public read equipment"  on public.equipment        for select using (is_published or public.is_admin());
create policy "public read schedules"  on public.schedules        for select using (is_published or public.is_admin());
create policy "public read faqs"       on public.faqs             for select using (is_published or public.is_admin());
create policy "public read reviews"    on public.reviews          for select using (status = 'approved' or public.is_admin());

-- ---------- content management (any admin role incl. editor) ----------
do $$
declare t text;
begin
  foreach t in array array['website_sections','coaches','age_groups','locations','courses','course_locations',
                           'videos','lessons','lesson_videos','equipment','schedules','faqs','reviews','media']
  loop
    execute format('create policy "admins insert %1$s" on public.%1$I for insert to authenticated with check (public.is_admin())', t);
    execute format('create policy "admins update %1$s" on public.%1$I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy "admins delete %1$s" on public.%1$I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

create policy "admins read media" on public.media for select to authenticated using (public.is_admin());

-- ---------- settings: admins/super admins only ------------------------
create policy "managers update settings" on public.site_settings for update to authenticated
  using (public.is_manager()) with check (public.is_manager());

-- ---------- registrations & students: admins/super admins only --------
create policy "managers read registrations"   on public.registrations for select to authenticated using (public.is_manager());
create policy "managers update registrations" on public.registrations for update to authenticated using (public.is_manager()) with check (public.is_manager());
create policy "managers delete registrations" on public.registrations for delete to authenticated using (public.is_manager());
create policy "managers insert registrations" on public.registrations for insert to authenticated with check (public.is_manager());

create policy "managers read students"   on public.students for select to authenticated using (public.is_manager());
create policy "managers update students" on public.students for update to authenticated using (public.is_manager()) with check (public.is_manager());
create policy "managers delete students" on public.students for delete to authenticated using (public.is_manager());
create policy "managers insert students" on public.students for insert to authenticated with check (public.is_manager());

-- ---------- admins table ----------------------------------------------
create policy "admins read self or super" on public.admins for select to authenticated
  using (id = auth.uid() or public.is_super_admin());
create policy "super admins manage admins" on public.admins for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------- grants ----------------------------------------------------
revoke all on public.registrations, public.students, public.admins, public.media from anon;
grant execute on function public.submit_registration(jsonb) to anon, authenticated;
grant execute on function public.submit_review(jsonb) to anon, authenticated;
revoke execute on function public.dashboard_stats() from anon;
grant execute on function public.dashboard_stats() to authenticated;

-- =====================================================================
-- Storage: public "media" bucket (read by everyone, written by admins)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760,
        array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','image/avif'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "public read media bucket" on storage.objects for select
  using (bucket_id = 'media');
create policy "admins upload media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
create policy "admins update media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin());
create policy "admins delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
