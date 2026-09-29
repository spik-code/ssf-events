-- ── reels ─────────────────────────────────────────────────────────────
-- Short video clips for the "On camera" strip, managed from /admin/reels.
-- imagekit_url / poster_url store ImageKit PATHS, like gallery_items. A null
-- poster_url means "use ImageKit's auto thumbnail". Newest first on the site,
-- so there is no order column — created_at is the order.
create table if not exists public.reels (
  id                uuid primary key default gen_random_uuid(),
  imagekit_url      text not null,
  imagekit_file_id  text,
  poster_url        text,
  poster_file_id    text,
  caption           text,
  is_published      boolean not null default false,
  created_at        timestamptz not null default now()
);

create index if not exists reels_published_created_idx
  on public.reels (created_at desc) where is_published;

alter table public.reels enable row level security;

drop policy if exists reels_public_read on public.reels;
create policy reels_public_read on public.reels
  for select to anon, authenticated using (is_published = true);

drop policy if exists reels_admin_all on public.reels;
create policy reels_admin_all on public.reels
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
