-- DPDP Act 2023: record that the person gave free, informed, unambiguous
-- consent at the point of collection, and which version of the privacy notice
-- they saw. created_at already timestamps the consent.
alter table public.inquiries
  add column if not exists consent_given boolean not null default false,
  add column if not exists privacy_version text;

comment on column public.inquiries.consent_given is
  'True when the enquiry form consent checkbox was ticked. The API rejects submissions without it.';
comment on column public.inquiries.privacy_version is
  'The privacy-notice version string shown to the person when they consented (see lib/legal.ts).';
