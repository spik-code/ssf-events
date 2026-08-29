-- ══════════════════════════════════════════════════════════════════════
-- Seed: services, site settings, gallery.
-- Gallery images live in ImageKit under /ssf/gallery/. imagekit_url stores
-- the path; the app builds the delivery URL with transformations.
-- ══════════════════════════════════════════════════════════════════════

-- ── services ──────────────────────────────────────────────────────────
insert into public.services (name, description, order_index, is_active) values
  ('Wedding stage & backdrop', 'Feature stages, floral walls and seating for the muhurtham and the reception.', 1, true),
  ('Mandap & tradition',       'Gopuram and pillar mandaps, brass deities, garlands and pooja setups.',        2, true),
  ('Reception & entrance',     'Aisle flower stands, draped chairs, gateway arches and photo corners.',        3, true),
  ('Haldi & get-togethers',    'Bright marigold staging, floor rangoli, seating and props for the day functions.', 4, true),
  ('Baby shower & birthday',   'Balloon and flower backdrops, name boards and themed corners.',                5, true),
  ('Theme decor, DJ & lighting','A colour story carried across the hall, with uplights, LED walls and sound.',  6, true)
on conflict do nothing;

-- ── site_settings ─────────────────────────────────────────────────────
insert into public.site_settings (key, value) values
  ('hero_headline',  '"Life is an event. Make it memorable."'::jsonb),
  ('hero_subcopy',   '"We build the stage, the mandap and the flowers your day is remembered by — weddings, receptions, engagements, haldi, baby showers and birthdays, set up and struck by one team."'::jsonb),
  ('hero_video_url', '""'::jsonb),
  ('hero_image_url', '"/ssf/gallery/22_C3mwzlILf0Q.webp"'::jsonb),
  ('proof_metrics',  '[{"label":"Function types","value":"8+"},{"label":"Home base","value":"Kolar"},{"label":"Also serving","value":"Bengaluru"},{"label":"State","value":"Karnataka"}]'::jsonb),
  ('contact_phone',  '"+91 93535 68207"'::jsonb),
  ('contact_email',  '"srisaifloraevent@gmail.com"'::jsonb),
  ('whatsapp_number','"919353568207"'::jsonb),
  ('instagram_url',  '"https://www.instagram.com/ssf_events/"'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ── gallery_items ─────────────────────────────────────────────────────
insert into public.gallery_items
  (imagekit_url, category, venue, location, caption, alt, order_index, featured, is_published)
values
  ('/ssf/gallery/22_C3mwzlILf0Q.webp','reception',null,null,'Banquet-hall reception','Lotus-centre reception stage in a banquet hall',1,true,true),
  ('/ssf/gallery/31_CqZey2IraXd.webp','mandap',null,'Avani, Kolar','Gopuram mandap in a tent pavilion','Gopuram-style mandap inside a tent pavilion',2,true,true),
  ('/ssf/gallery/26_CpFQAiJLHum.webp','reception',null,null,'Reception aisle, flower stands & drapes','Reception aisle dressed with tall flower stands and draped chairs',3,true,true),
  ('/ssf/gallery/38_CoEZH74rgWc.webp','celebration',null,null,'Peacock-fan backdrop, naming ceremony','Pastel peacock-fan backdrop for a naming ceremony',4,true,true),
  ('/ssf/gallery/12_C0tQGUUr6nj.webp','wedding',null,null,'Illuminated arch stage, wide wedding backdrop','Row of illuminated floral arches forming a wide wedding stage',5,true,true),
  ('/ssf/gallery/36_CoEZdBjr0ZD.webp','reception',null,null,'Rose-curtain stage, marigold pelmet','Rose-curtain stage with a marigold pelmet and a carved settee',6,true,true),
  ('/ssf/gallery/23_ComnbsSvpzz.webp','reception',null,null,'Carved red & gold reception stage','Carved red and gold reception stage with horse motifs',7,false,true),
  ('/ssf/gallery/33_CokFlU6PwCH.webp','mandap',null,null,'Brass gateway entrance, betrothal / pooja','Brass Venkateshwara gateway framing a red-carpet entrance',8,false,true),
  ('/ssf/gallery/29_CpSfO0uLhI-.webp','reception',null,null,'Pearl-curtain stage, blue wash','Pearl-curtain stage with blue uplight and flower stands along the aisle',9,false,true),
  ('/ssf/gallery/01_C3sc9aDyjI2.webp','haldi',null,'Kolar','Haldi stage & marigold rangoli','Green and yellow haldi stage with a marigold floor rangoli',10,false,true),
  ('/ssf/gallery/32_CokFpHKvVAt.webp','mandap',null,null,'Lattice flower backdrop, engagement settee','Diamond-lattice flower backdrop in yellow and red with a settee',11,false,true),
  ('/ssf/gallery/18_C3mxQWVr_OS.webp','mandap',null,null,'White colonnade stage, brass deities','White colonnade stage with brass deities and a floral canopy',12,false,true),
  ('/ssf/gallery/13_CxzBMQiSRBw.webp','mandap',null,'Bengaluru','Traditional mandap with deities','Traditional mandap with deities and dense greenery',13,false,true),
  ('/ssf/gallery/19_CxzBEmUy_tZ.webp','mandap',null,'Bengaluru','Brass peacock pillars','Brass peacock pillars with layered floral garlands',14,false,true),
  ('/ssf/gallery/37_CoEZKjgr_S_.webp','reception',null,null,'White lattice stage, floral arches','White lattice stage with floral arches and potted greenery',15,false,true),
  ('/ssf/gallery/00_C3_ohmNPbLG.webp','reception',null,null,'Violet LED reception stage','Reception stage with a violet LED backdrop',16,false,true),
  ('/ssf/gallery/30_CwlyWhavjsN.webp','wedding','CMR','Bengaluru','Banquet aisle dressing, CMR','Long banquet aisle with red carpet and draped chairs',17,false,true),
  ('/ssf/gallery/20_CxzBSZeSDOE.webp','mandap',null,'Bengaluru','Peacock & flower detail','Close view of brass peacock and flower detailing on a mandap pillar',18,false,true),
  ('/ssf/gallery/24_CqGF3k6PRXT.webp','celebration','Govt Junior College','Kolar','Function stage, Govt Junior College','Function stage with a bright floral border',19,false,true),
  ('/ssf/gallery/35_CqZe7eMrbZV.webp','mandap',null,null,'Pavilion mandap, tent setup','Mandap under a clear-span tent pavilion',20,false,true)
on conflict do nothing;
