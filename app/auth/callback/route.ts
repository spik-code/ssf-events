import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSSRClient } from "@/lib/supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Magic-link landing point. Supabase sends the user here after they click the
 * link in the email. Two URL shapes are accepted:
 *
 *   ?token_hash=…&type=magiclink   preferred. Set up in the "Magic Link" email
 *                                  template as
 *                                  {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink&next=/admin
 *                                  Verified with verifyOtp() — survives link
 *                                  pre-fetching by mail scanners and does not
 *                                  depend on a PKCE cookie being present.
 *
 *   ?code=…                        the PKCE flow, used when the template still
 *                                  points at {{ .ConfirmationURL }}.
 *
 * Either way we end up with a session cookie and send the user on to `next`.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/admin";

  // Only ever redirect within this site — never to a URL supplied in the query.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/admin";

  const supabase = await createSSRClient();

  let failed: string | null = null;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) failed = "link_expired";
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) failed = "link_expired";
  } else {
    failed = "missing_code";
  }

  if (failed) {
    return NextResponse.redirect(`${origin}/admin/login?error=${failed}`);
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
