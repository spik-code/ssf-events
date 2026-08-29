-- ══════════════════════════════════════════════════════════════════════
-- SSF Events' live Google Business Profile.
--
-- Resolved from the review short link https://g.page/r/CfOo1cNvxLYOEBI/review,
-- which redirects to a Maps feature id of
--   0x3badf156d4a74589:0xeb6c46fc3d5a8f3
-- whose second half is the CID in hex (= 1060250746598303987).
--
-- google_place_id is deliberately left empty: a g.page link yields only a CID,
-- and /api/reviews/sync resolves the Place ID from the name + address on its
-- first run and caches it here.
-- ══════════════════════════════════════════════════════════════════════

update public.site_settings
   set value = '"https://g.page/r/CfOo1cNvxLYOEBI/review"'::jsonb, updated_at = now()
 where key = 'google_reviews_url';

update public.site_settings
   set value = '"https://maps.google.com/?cid=1060250746598303987"'::jsonb, updated_at = now()
 where key = 'google_maps_url';

insert into public.site_settings (key, value) values
  ('google_cid',           '"1060250746598303987"'::jsonb),
  ('google_business_name', '"Ssf Events"'::jsonb),
  ('google_address',       '"Vadagur village, post, Kembodi, Kolar, Karnataka 563103"'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();
