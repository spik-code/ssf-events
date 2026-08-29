import { createClient } from "@supabase/supabase-js";

/**
 * Anonymous, read-only Supabase client for Server Components / route handlers.
 * RLS enforces what the public role may read (published rows only) and that the
 * public role may INSERT into `inquiries` but never read them.
 */
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY)");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Service-role client — bypasses RLS. Server only. Used by admin routes (Phase 2)
 * and, in Phase 1, only if you want the enquiry route to write with elevated
 * rights. Falls back to null when the key is absent so the app still boots.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key === "REPLACE_ME") return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
