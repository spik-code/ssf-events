-- ══════════════════════════════════════════════════════════════════════
-- Address Supabase security advisor findings.
-- ══════════════════════════════════════════════════════════════════════

-- 1) booking_conflicts was SECURITY DEFINER, so it would run with the creator's
--    rights and leak booking data past RLS. Recreate as SECURITY INVOKER: the
--    caller's own policies apply, so only admins ever see rows.
drop view if exists public.booking_conflicts;
create view public.booking_conflicts
with (security_invoker = true)
as
  select confirmed_date, count(*) as booking_count, array_agg(id) as booking_ids
  from public.bookings
  group by confirmed_date
  having count(*) > 1;

-- 2) Pin search_path on the trigger function so it cannot be hijacked by a
--    caller-controlled schema.
create or replace function public.stamp_quoted_at()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.status = 'quoted' and old.status is distinct from 'quoted' and new.quoted_at is null then
    new.quoted_at := now();
  end if;
  return new;
end;
$$;

-- 3) is_admin() must stay SECURITY DEFINER (it reads admin_users, which is
--    itself RLS-protected), but it should not be callable as a public RPC.
--    Revoke EXECUTE from the API roles; RLS policies still call it internally
--    because policy evaluation runs as the table owner.
revoke execute on function public.is_admin() from anon, authenticated, public;
