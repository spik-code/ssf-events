/**
 * Generate a working admin sign-in link WITHOUT sending an email.
 *
 * Sidesteps the Supabase email rate limit and mail-scanner link pre-fetch.
 * Uses the Auth Admin API (generateLink), so it needs the SERVICE ROLE key.
 *
 * Usage (from the project folder, dev server running on :3000):
 *
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node deploy/admin-magic-link.mjs
 *
 * Optional args:
 *   node deploy/admin-magic-link.mjs someone@else.com https://your-site.com
 *
 * It prints a URL. Paste it into the browser you want to be logged in.
 * The link is single-use and valid for about an hour.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function fromEnvFile(key) {
  try {
    const line = readFileSync(".env.local", "utf8")
      .split("\n")
      .find((l) => l.startsWith(key + "="));
    return line ? line.slice(key.length + 1).trim() : undefined;
  } catch {
    return undefined;
  }
}

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || fromEnvFile("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  (fromEnvFile("SUPABASE_SERVICE_ROLE_KEY") !== "REPLACE_ME"
    ? fromEnvFile("SUPABASE_SERVICE_ROLE_KEY")
    : undefined);

const email = process.argv[2] || "srisaifloraevent@gmail.com";
const siteUrl = (process.argv[3] || "http://localhost:3000").replace(/\/$/, "");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing config. Set SUPABASE_SERVICE_ROLE_KEY (Supabase - Settings - API - service_role)\n" +
      "and make sure NEXT_PUBLIC_SUPABASE_URL is in .env.local.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.generateLink({
  type: "magiclink",
  email,
  options: { redirectTo: `${siteUrl}/auth/callback?next=/admin` },
});

if (error) {
  console.error("generateLink failed:", error.message);
  process.exit(1);
}

const { hashed_token, verification_type } = data.properties;
const url = `${siteUrl}/auth/callback?token_hash=${hashed_token}&type=${verification_type}&next=/admin`;

console.log("\nPaste this into the browser you want signed in as " + email + ":\n");
console.log(url + "\n");
