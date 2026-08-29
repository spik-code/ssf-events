import { NextResponse } from "next/server";
import { createServerClient, createServiceClient } from "@/lib/supabase/server";
import type { EventType } from "@/lib/types";
import { clean, cleanMultiline } from "@/lib/sanitize";
import { PRIVACY_VERSION } from "@/lib/legal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENT_TYPES: EventType[] = [
  "wedding",
  "reception",
  "engagement",
  "haldi",
  "baby_shower",
  "birthday",
  "other",
];

const REFERRALS = ["instagram", "google", "facebook", "referral", "walk_in", "other"];
const SERVICE_NEEDS = ["decor", "catering", "dj_lighting", "full"];

/** In-memory IP throttle: 5 submissions per hour. Resets on cold start — good
 *  enough to stop casual spam; move to Upstash/Redis if the site gets busy. */
const HITS = new Map<string, number[]>();
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    HITS.set(ip, recent);
    return true;
  }
  recent.push(now);
  HITS.set(ip, recent);
  return false;
}



async function notify(row: Record<string, unknown>) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ENQUIRY_NOTIFICATION_EMAIL;
  if (!key || key === "REPLACE_ME" || !to) return;

  const lines = [
    `Name: ${row.name}`,
    `Phone: ${row.phone}`,
    row.email ? `Email: ${row.email}` : "",
    `Function: ${row.event_type}`,
    row.event_date ? `Date: ${row.event_date}` : "",
    row.event_location ? `Venue/town: ${row.event_location}` : "",
    row.guest_count ? `Guests: ${row.guest_count}` : "",
    Array.isArray(row.services_needed) && row.services_needed.length
      ? `Needs: ${row.services_needed.join(", ")}`
      : "",
    row.referral_source ? `Came from: ${row.referral_source}` : "",
    "",
    row.message ? `Message:\n${row.message}` : "",
  ].filter(Boolean);

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    await resend.emails.send({
      from: process.env.ENQUIRY_FROM_EMAIL || "onboarding@resend.dev",
      to,
      replyTo: typeof row.email === "string" ? row.email : undefined,
      subject: `New enquiry — ${row.name} (${row.event_type})`,
      text: lines.join("\n"),
    });
  } catch (err) {
    // Never fail the request because email failed — the row is already saved.
    console.error("[enquiry] notification failed:", err);
  }
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many enquiries from this connection. Please call us instead." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const name = clean(body.name, 120);
  const phone = clean(body.phone, 32);
  const eventTypeRaw = clean(body.event_type, 32);

  if (!name || !phone || !eventTypeRaw) {
    return NextResponse.json(
      { ok: false, error: "Name, phone and function type are required." },
      { status: 400 },
    );
  }

  // DPDP Act 2023: no storing personal data without consent given by a clear
  // affirmative action. The form sends `consent: true` only when the box is
  // ticked; anything else is refused.
  if (body.consent !== true) {
    return NextResponse.json(
      { ok: false, error: "Please tick the consent box so we can reply." },
      { status: 400 },
    );
  }
  const privacy_version = clean(body.privacy_version, 20) || PRIVACY_VERSION;

  const event_type = (EVENT_TYPES as string[]).includes(eventTypeRaw)
    ? (eventTypeRaw as EventType)
    : "other";

  const email = clean(body.email, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "That email doesn't look right." }, { status: 400 });
  }

  const referralRaw = clean(body.referral_source, 40)?.toLowerCase() ?? null;
  const referral_source = referralRaw
    ? REFERRALS.includes(referralRaw)
      ? referralRaw
      : "other"
    : null;

  const guestRaw = Number(body.guest_count);
  const guest_count =
    Number.isFinite(guestRaw) && guestRaw > 0 && guestRaw < 100000 ? Math.floor(guestRaw) : null;

  const dateRaw = clean(body.event_date, 10);
  const event_date = dateRaw && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : null;

  // Clamp to the known set and de-duplicate, so the column can't be stuffed.
  const services_needed = Array.isArray(body.services_needed)
    ? [...new Set(body.services_needed.map(String).filter((v) => SERVICE_NEEDS.includes(v)))]
    : [];

  const row = {
    name,
    phone,
    email,
    event_type,
    event_date,
    event_location: clean(body.event_location, 200),
    guest_count,
    message: cleanMultiline(body.message, 2000),
    referral_source,
    services_needed,
    consent_given: true,
    privacy_version,
    status: "new" as const,
    quoted_at: null,
  };

  // Public insert is allowed by RLS; the service client is used when available
  // so the write succeeds even if policies are tightened later.
  const supabase = createServiceClient() ?? createServerClient();
  const { error } = await supabase.from("inquiries").insert(row);

  if (error) {
    console.error("[enquiry] insert failed:", error.message);
    return NextResponse.json(
      { ok: false, error: "We couldn't save that. Please call or WhatsApp us." },
      { status: 500 },
    );
  }

  await notify(row);

  return NextResponse.json({
    ok: true,
    message: "Thanks — we'll get back to you with a quote shortly.",
  });
}
