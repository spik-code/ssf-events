import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

/**
 * Supabase client for Server Components, Server Actions and route handlers.
 *
 * Reads the session from cookies, so every query runs as the signed-in user and
 * RLS applies. This is the client the admin pages use — an admin sees rows
 * because `public.is_admin()` returns true for them, not because we bypass RLS.
 */
export async function createSSRClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The proxy (proxy.ts) refreshes the session instead, so this is safe.
          }
        },
      },
    },
  );
}

/** The signed-in user, or null. */
// cache(): the layout and the page ask in the same render; one network call, not several.
export const getUser = cache(async () => {
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * True when the signed-in user is on the admin roster.
 *
 * Checked by querying `admin_users` — RLS only returns a row to an actual
 * admin, so a non-admin gets nothing back and is refused.
 */
export const isAdmin = cache(async (): Promise<boolean> => {
  const user = await getUser();
  if (!user) return false;
  const supabase = await createSSRClient();

  const { data, error } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  return !error && Boolean(data);
});
