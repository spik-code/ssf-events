-- ══════════════════════════════════════════════════════════════════════
-- Admin bootstrap.
--
-- Problem: admin_users is empty and nobody can insert into it (by design), so
-- there is no way to become the first admin without a back door.
--
-- Solution: an allowlist of email addresses. When someone signs in through
-- Supabase Auth for the first time, a trigger promotes them to admin ONLY if
-- their email is on that list. The allowlist is not readable or writable by
-- anon/authenticated, so it cannot be used to grant yourself access.
-- ══════════════════════════════════════════════════════════════════════

create table if not exists public.admin_allowlist (
  email       text primary key,
  note        text,
  created_at  timestamptz not null default now()
);

alter table public.admin_allowlist enable row level security;
-- No policies at all: only the service role and SECURITY DEFINER functions
-- can touch this table. RLS with zero policies denies everyone else.

insert into public.admin_allowlist (email, note)
values ('srisaifloraevent@gmail.com', 'SSF Events owner')
on conflict (email) do nothing;

-- Promote an allowlisted user to admin on signup / first login.
create or replace function public.promote_allowlisted_admin()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1 from public.admin_allowlist a
    where lower(a.email) = lower(new.email)
  ) then
    insert into public.admin_users (id, email)
    values (new.id, new.email)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_promote_admin on auth.users;
create trigger on_auth_user_created_promote_admin
  after insert on auth.users
  for each row execute function public.promote_allowlisted_admin();

-- Backfill: promote anyone who already signed up before this trigger existed.
insert into public.admin_users (id, email)
select u.id, u.email
from auth.users u
join public.admin_allowlist a on lower(a.email) = lower(u.email)
on conflict (id) do nothing;

revoke execute on function public.promote_allowlisted_admin() from anon, authenticated, public;
