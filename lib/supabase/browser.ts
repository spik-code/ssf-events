"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for Client Components. Session lives in cookies, so the
 *  server can read it too. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
