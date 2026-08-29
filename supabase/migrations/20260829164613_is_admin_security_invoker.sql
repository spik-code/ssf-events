-- ══════════════════════════════════════════════════════════════════════
-- Make is_admin() SECURITY INVOKER and clear the advisor warning
-- 0029_authenticated_security_definer_function_executable without
-- re-breaking the admin dashboard.
--
-- is_admin() only needed SECURITY DEFINER to bypass RLS on admin_users. The
-- one policy on that table, admin_users_self_read, was itself `using
-- (is_admin())`, so a plain SECURITY INVOKER is_admin() would recurse
-- (is_admin -> read admin_users -> policy -> is_admin -> ...).
--
-- Fix: let a user read their OWN admin_users row directly by primary key, with
-- no function call. is_admin() then runs as SECURITY INVOKER: for a signed-in
-- user it reads at most their own row, which is all it needs. Every other
-- admin policy keeps calling is_admin(), now resolved with the caller's own
-- privileges and no elevation.
-- ══════════════════════════════════════════════════════════════════════

drop policy if exists admin_users_self_read on public.admin_users;
create policy admin_users_self_read on public.admin_users
  for select to authenticated
  using ((select auth.uid()) = id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (select 1 from public.admin_users a where a.id = (select auth.uid()));
$$;

-- INVOKER functions still need EXECUTE; keep it for authenticated, deny anon.
revoke execute on function public.is_admin() from anon, public;
grant execute on function public.is_admin() to authenticated;
