import { NextResponse } from "next/server";
import { createSSRClient } from "@/lib/supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Magic-link landing point. Supabase sends the user here with a one-time code;
 * we exchange it for a session cookie and send them on to /admin.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  // Only ever redirect within this site — never to a URL supplied in the query.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/admin";

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?error=missing_code`);
  }

  const supabase = await createSSRClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/admin/login?error=link_expired`);
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
