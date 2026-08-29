-- ══════════════════════════════════════════════════════════════════════
-- Fix: restore EXECUTE on public.is_admin() to `authenticated`.
--
-- 20260829102739_harden_security_advisors.sql revoked EXECUTE on is_admin()
-- from anon, authenticated and public, on the mistaken belief (see its own
-- comment) that an RLS policy's USING / WITH CHECK expression is evaluated as
-- the table owner. It is not -- it runs with the privileges of the querying
-- role. Every admin-only policy in this schema is scoped to the `authenticated`
-- role and gated by is_admin(), so that revoke made a real signed-in admin hit
--   ERROR: permission denied for function is_admin
-- on inquiries, bookings, admin_users, gallery_items, reviews, services,
-- site_settings and testimonials -- i.e. the entire /admin dashboard was dead.
--
-- Restoring EXECUTE for `authenticated` is safe: is_admin() takes no arguments
-- and only reports whether the calling user (auth.uid()) is in admin_users,
-- which the caller can already infer from whether the dashboard loads. `anon`
-- is intentionally left without EXECUTE; no anon-scoped policy references it.
-- ══════════════════════════════════════════════════════════════════════

grant execute on function public.is_admin() to authenticated;
