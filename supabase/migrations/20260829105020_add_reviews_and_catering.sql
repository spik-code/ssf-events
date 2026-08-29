-- ══════════════════════════════════════════════════════════════════════
-- 1) Reviews — Google Business Profile reviews + direct customer quotes.
--
-- Deliberately separate from `testimonials` so a Google review keeps its
-- provenance (author, rating, permalink, external id for dedupe) and can be
-- re-synced from the Places API without clobbering hand-entered quotes.
-- The site renders NOTHING until there is at least one published row, so no
-- placeholder or invented review can ever reach the page.
-- ══════════════════════════════════════════════════════════════════════

do $$ begin
  create type review_source as enum ('google','direct');
exception when duplicate_object then null; end $$;

create table if not exists public.reviews (
  id                uuid primary key default gen_random_uuid(),
  source            review_source not null default 'google',
  -- Stable id from the provider; lets a sync upsert instead of duplicating.
  external_id       text,
  author_name       text not null,
  author_photo_url  text,
  author_url        text,
  rating            smallint not null check (rating between 1 and 5),
  text              text not null default '',
  -- When the customer actually wrote it (not when we synced it).
  reviewed_at       timestamptz,
  relative_time     text,
  source_url        text,
  is_published      boolean not null default true,
  order_index       integer not null default 0,
  synced_at         timestamptz,
  created_at        timestamptz not null default now()
);

create unique index if not exists reviews_external_id_key
  on public.reviews (source, external_id) where external_id is not null;
create index if not exists reviews_published_idx on public.reviews (is_published) where is_published;
create index if not exists reviews_reviewed_at_idx on public.reviews (reviewed_at desc);

alter table public.reviews enable row level security;

drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews
  for select to anon, authenticated using (is_published = true);

drop policy if exists reviews_admin_all on public.reviews;
create policy reviews_admin_all on public.reviews
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Google Business Profile config. Empty until the profile exists — the site
-- checks these before rendering the reviews section or the "review us" CTA.
insert into public.site_settings (key, value) values
  ('google_place_id',    '""'::jsonb),
  ('google_reviews_url', '""'::jsonb),
  ('google_maps_url',    '""'::jsonb)
on conflict (key) do nothing;

-- ══════════════════════════════════════════════════════════════════════
-- 2) Catering — new service line, arranged through partner caterers.
-- ══════════════════════════════════════════════════════════════════════

insert into public.services (name, description, order_index, is_active) values
  ('Catering & dining',
   'Pure veg and non-veg menus, live counters and evening snacks, with serving staff, crockery and the dining area dressed to match. Arranged and managed by us through caterers we work with regularly.',
   7, true)
on conflict do nothing;

-- Lets an enquiry say what it actually needs, so leads arrive qualified.
alter table public.inquiries
  add column if not exists services_needed text[] not null default '{}';

create index if not exists inquiries_services_needed_idx
  on public.inquiries using gin (services_needed);
