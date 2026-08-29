/**
 * Privacy-notice metadata, kept in one place so the /privacy page, the enquiry
 * form and the API all agree.
 *
 * Bump PRIVACY_VERSION (to the date it changed) whenever the substance of the
 * privacy page changes — the value is stored against every enquiry, so a later
 * dispute can be answered with "this is the notice you actually agreed to".
 */
export const PRIVACY_VERSION = "2026-08-29";

/** Last time the /privacy page wording was reviewed. */
export const PRIVACY_UPDATED = "29 August 2026";

/**
 * Where enquiry data physically sits. Supabase pins a project to one region at
 * creation and it cannot be moved afterwards; read it from
 * Project Settings → General in the Supabase dashboard.
 *
 * Set this to a human string (e.g. "Mumbai, India (ap-south-1)" or
 * "Singapore (ap-southeast-1)") to have the privacy page name the location
 * outright. Left null, the page falls back to a truthful generic sentence.
 */
export const DATA_REGION: string | null = "Seoul, South Korea (AWS ap-northeast-2)";
