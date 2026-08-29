-- ══════════════════════════════════════════════════════════════════════
-- SSF Events (Sri Sai Flora Enterprises) — core schema
-- Wedding & event decor, Kolar / Bengaluru.
-- No packages, no public pricing: `services` is a capability list only.
-- ══════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── enums ─────────────────────────────────────────────────────────────
do $$ begin
  create type gallery_category as enum
    ('wedding','reception','mandap','haldi','celebration','decor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_type as enum
    ('wedding','reception','engagement','haldi','baby_shower','birthday','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type inquiry_status as enum ('new','contacted','quoted','won','lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type deposit_status as enum ('pending','partial','paid');
exception when duplicate_object then null; end $$;

-- ── admin roster ──────────────────────────────────────────────────────
-- Membership in this table is what makes an authenticated user an admin.
create table if not exists public.admin_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  created_at  timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users a where a.id = auth.uid());
$$;

-- ── gallery_items ─────────────────────────────────────────────────────
-- imagekit_url stores the ImageKit PATH (e.g. /ssf/gallery/x.webp); the app
-- builds the delivery URL with transformations.
create table if not exists public.gallery_items (
  id                uuid primary key default gen_random_uuid(),
  imagekit_url      text not null,
  imagekit_file_id  text,
  category          gallery_category not null default 'wedding',
  event_id          uuid,
  venue             text,
  location          text,
  guest_count       integer check (guest_count is null or guest_count >= 0),
  caption           text,
  alt               text,
  order_index       integer not null default 0,
  featured          boolean not null default false,
  is_published      boolean not null default false,
  created_at        timestamptz not null default now()
);

create index if not exists gallery_items_category_idx     on public.gallery_items (category);
create index if not exists gallery_items_location_idx     on public.gallery_items (location);
create index if not exists gallery_items_order_idx        on public.gallery_items (order_index);
create index if not exists gallery_items_published_idx    on public.gallery_items (is_published) where is_published;

-- ── testimonials ──────────────────────────────────────────────────────
create table if not exists public.testimonials (
  id            uuid primary key default gen_random_uuid(),
  couple_names  text not null,
  quote         text not null,
  rating        smallint not null default 5 check (rating between 1 and 5),
  event_date    date,
  location      text,
  image_url     text,
  is_published  boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists testimonials_published_idx on public.testimonials (is_published) where is_published;
create index if not exists testimonials_event_date_idx on public.testimonials (event_date);

-- ── services (capability list — never prices) ─────────────────────────
create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text not null default '',
  order_index  integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists services_order_idx on public.services (order_index);

-- ── inquiries ─────────────────────────────────────────────────────────
create table if not exists public.inquiries (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  email            text,
  phone            text not null,
  event_date       date,
  event_location   text,
  guest_count      integer check (guest_count is null or guest_count >= 0),
  budget_range     text,
  event_type       event_type not null default 'wedding',
  message          text,
  referral_source  text,
  status           inquiry_status not null default 'new',
  quoted_at        timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists inquiries_status_idx     on public.inquiries (status);
create index if not exists inquiries_quoted_at_idx  on public.inquiries (quoted_at);
create index if not exists inquiries_event_date_idx on public.inquiries (event_date);
create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);

-- Stamp quoted_at the first time status becomes 'quoted' (24-48h SLA metric).
create or replace function public.stamp_quoted_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'quoted' and old.status is distinct from 'quoted' and new.quoted_at is null then
    new.quoted_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists inquiries_stamp_quoted_at on public.inquiries;
create trigger inquiries_stamp_quoted_at
  before update on public.inquiries
  for each row execute function public.stamp_quoted_at();

-- ── bookings ──────────────────────────────────────────────────────────
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  inquiry_id      uuid references public.inquiries(id) on delete set null,
  confirmed_date  date not null,
  deposit_status  deposit_status not null default 'pending',
  total_amount    numeric(12,2),
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists bookings_confirmed_date_idx on public.bookings (confirmed_date);

-- Double-booking visibility: flag, don't hard-block (two events can run in a day).
create or replace view public.booking_conflicts as
  select confirmed_date, count(*) as booking_count, array_agg(id) as booking_ids
  from public.bookings
  group by confirmed_date
  having count(*) > 1;

-- ── site_settings ─────────────────────────────────────────────────────
create table if not exists public.site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ══════════════════════════════════════════════════════════════════════
alter table public.gallery_items enable row level security;
alter table public.testimonials  enable row level security;
alter table public.services      enable row level security;
alter table public.inquiries     enable row level security;
alter table public.bookings      enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_users   enable row level security;

-- gallery_items: public reads published rows; admins do everything.
drop policy if exists gallery_public_read on public.gallery_items;
create policy gallery_public_read on public.gallery_items
  for select to anon, authenticated using (is_published = true);

drop policy if exists gallery_admin_all on public.gallery_items;
create policy gallery_admin_all on public.gallery_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- testimonials
drop policy if exists testimonials_public_read on public.testimonials;
create policy testimonials_public_read on public.testimonials
  for select to anon, authenticated using (is_published = true);

drop policy if exists testimonials_admin_all on public.testimonials;
create policy testimonials_admin_all on public.testimonials
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- services
drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services
  for select to anon, authenticated using (is_active = true);

drop policy if exists services_admin_all on public.services;
create policy services_admin_all on public.services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- site_settings: all rows are non-secret display content.
drop policy if exists settings_public_read on public.site_settings;
create policy settings_public_read on public.site_settings
  for select to anon, authenticated using (true);

drop policy if exists settings_admin_write on public.site_settings;
create policy settings_admin_write on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- inquiries: public may INSERT only. No public SELECT/UPDATE/DELETE at all.
drop policy if exists inquiries_public_insert on public.inquiries;
create policy inquiries_public_insert on public.inquiries
  for insert to anon, authenticated with check (true);

drop policy if exists inquiries_admin_read on public.inquiries;
create policy inquiries_admin_read on public.inquiries
  for select to authenticated using (public.is_admin());

drop policy if exists inquiries_admin_update on public.inquiries;
create policy inquiries_admin_update on public.inquiries
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists inquiries_admin_delete on public.inquiries;
create policy inquiries_admin_delete on public.inquiries
  for delete to authenticated using (public.is_admin());

-- bookings: admin only, every operation.
drop policy if exists bookings_admin_all on public.bookings;
create policy bookings_admin_all on public.bookings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- admin_users: an admin may read the roster; nobody self-inserts.
drop policy if exists admin_users_self_read on public.admin_users;
create policy admin_users_self_read on public.admin_users
  for select to authenticated using (public.is_admin());
