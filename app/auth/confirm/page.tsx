"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

/**
 * Finishes an implicit-flow sign-in.
 *
 * Supabase's default Magic Link template ({{ .ConfirmationURL }}) sends the
 * session back in the URL *fragment*:
 *
 *   /auth/callback#access_token=…&refresh_token=…&type=magiclink
 *
 * A fragment is never transmitted to the server, so the callback route handler
 * sees an empty query and cannot complete the sign-in. It forwards here — the
 * browser carries the fragment across the redirect — and this component reads
 * the tokens and hands them to the Supabase browser client, which writes the
 * same cookies the server reads.
 *
 * The token_hash template is still the better setup (tokens never touch the
 * URL, and the link survives mail-scanner pre-fetching), but this makes sign-in
 * work whichever template the project has.
 */
export default function ConfirmPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    // Supabase reports failures in the fragment too.
    const hashError = hash.get("error_code") || hash.get("error");
    if (hashError) {
      router.replace(
        `/admin/login?error=${hashError.includes("expired") ? "link_expired" : "missing_code"}`,
      );
      return;
    }

    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    if (!access_token || !refresh_token) {
      router.replace("/admin/login?error=missing_code");
      return;
    }

    // Only ever continue to a path on this site.
    const raw = new URLSearchParams(window.location.search).get("next") ?? "/admin";
    const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/admin";

    createClient()
      .auth.setSession({ access_token, refresh_token })
      .then(({ error: err }) => {
        if (err) {
          setError(err.message);
          return;
        }
        // Drop the tokens out of the address bar before moving on.
        window.history.replaceState(null, "", window.location.pathname);
        router.replace(next);
        router.refresh();
      });
  }, [router]);

  return (
    <main className="auth">
      <div className="auth-card">
        <h1 className="h2">{error ? "Could not sign you in" : "Signing you in…"}</h1>
        <p className="note">
          {error ?? "One moment — finishing the sign-in and taking you to the dashboard."}
        </p>
        {error && (
          <a className="btn btn-primary" href="/admin/login">
            Back to sign in
          </a>
        )}
      </div>
    </main>
  );
}
