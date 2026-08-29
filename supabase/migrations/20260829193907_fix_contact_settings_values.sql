-- The seeded contact settings were unusable:
--   contact_phone   = '9353568207'   -- no country code, not the displayed form
--   whatsapp_number = '9353568207'   -- wa.me needs the country code or the
--                                       link opens an unknown-number chat
-- The public site had been rendering the env-backed constants instead, which
-- masked this. Now that the site reads site_settings first (lib/contact.ts),
-- these have to be right.
update public.site_settings
   set value = '"+91 93535 68207"'::jsonb, updated_at = now()
 where key = 'contact_phone';

update public.site_settings
   set value = '"919353568207"'::jsonb, updated_at = now()
 where key = 'whatsapp_number';
