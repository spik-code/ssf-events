import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Pull reviews from the Google Business Profile and upsert them into `reviews`.
 *
 * Dormant until GOOGLE_PLACES_API_KEY is set. Until then it writes nothing, so
 * the site can never show a review that did not come from a real customer.
 *
 * Talks to **Places API (New)** (places.googleapis.com) and falls back to the
 * legacy Places API. Google stopped letting new Cloud projects enable the
 * legacy API in 2025, so a freshly created key only works against the new one —
 * trying both means the route works whichever the project has enabled.
 *
 * The Place ID is resolved from google_business_name + google_address on first
 * run and cached into site_settings.
 *
 * Google returns at most 5 reviews per place, refreshed on each sync.
 * Protected by CRON_SECRET when that is set.
 */

/** Normalised review, independent of which API version produced it. */
interface Review {
  externalId: string;
  authorName: string;
  authorPhoto: string | null;
  authorUrl: string | null;
  rating: number;
  text: string;
  publishedAt: string;
  relativeTime: string | null;
}

interface PlaceResult {
  placeId: string;
  mapsUrl: string | null;
  reviews: Review[];
}

const NEW_BASE = "https://places.googleapis.com/v1";
const LEGACY_BASE = "https://maps.googleapis.com/maps/api/place";

/** Errors we want to show the operator verbatim — they name the actual fix. */
function googleError(source: string, status: string, message?: string) {
  return `${source}: ${status}${message ? ` — ${message}` : ""}`;
}

// ── Places API (New) ──────────────────────────────────────────────────────

async function newApiFindPlace(apiKey: string, query: string) {
  const res = await fetch(`${NEW_BASE}/places:searchText`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { id: null as string | null, error: googleError("Places API (New)", data?.error?.status ?? String(res.status), data?.error?.message) };
  }
  return { id: (data?.places?.[0]?.id as string) ?? null, error: null as string | null };
}

interface NewApiReview {
  name?: string;
  rating?: number;
  publishTime?: string;
  relativePublishTimeDescription?: string;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
}

async function newApiDetails(apiKey: string, placeId: string) {
  const res = await fetch(`${NEW_BASE}/places/${encodeURIComponent(placeId)}`, {
    cache: "no-store",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,displayName,rating,userRatingCount,googleMapsUri,reviews",
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { result: null as PlaceResult | null, error: googleError("Places API (New)", data?.error?.status ?? String(res.status), data?.error?.message) };
  }

  const reviews: Review[] = ((data?.reviews ?? []) as NewApiReview[]).map((r) => ({
    // The new API gives a stable review resource name — a far better key than
    // author+timestamp, which changes if someone edits their display name.
    externalId: r.name ?? `${r.authorAttribution?.displayName ?? "anon"}:${r.publishTime ?? ""}`,
    authorName: r.authorAttribution?.displayName ?? "Google user",
    authorPhoto: r.authorAttribution?.photoUri ?? null,
    authorUrl: r.authorAttribution?.uri ?? null,
    rating: Math.max(1, Math.min(5, Math.round(r.rating ?? 0))),
    text: (r.originalText?.text ?? r.text?.text ?? "").slice(0, 4000),
    publishedAt: r.publishTime ?? new Date().toISOString(),
    relativeTime: r.relativePublishTimeDescription ?? null,
  }));

  return {
    result: { placeId: data?.id ?? placeId, mapsUrl: data?.googleMapsUri ?? null, reviews },
    error: null as string | null,
  };
}

// ── Legacy Places API ─────────────────────────────────────────────────────

async function legacyFindPlace(apiKey: string, query: string) {
  const url = new URL(`${LEGACY_BASE}/findplacefromtext/json`);
  url.searchParams.set("input", query);
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", "place_id");
  url.searchParams.set("key", apiKey);
  const data = await (await fetch(url, { cache: "no-store" })).json().catch(() => ({}));
  if (data?.status !== "OK") {
    return { id: null as string | null, error: googleError("Places API (legacy)", data?.status ?? "UNKNOWN", data?.error_message) };
  }
  return { id: (data?.candidates?.[0]?.place_id as string) ?? null, error: null as string | null };
}

interface LegacyReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  text?: string;
  time: number;
  relative_time_description?: string;
}

async function legacyDetails(apiKey: string, placeId: string) {
  const url = new URL(`${LEGACY_BASE}/details/json`);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "name,rating,user_ratings_total,reviews,url");
  url.searchParams.set("reviews_sort", "newest");
  url.searchParams.set("key", apiKey);
  const data = await (await fetch(url, { cache: "no-store" })).json().catch(() => ({}));
  if (data?.status !== "OK") {
    return { result: null as PlaceResult | null, error: googleError("Places API (legacy)", data?.status ?? "UNKNOWN", data?.error_message) };
  }
  const reviews: Review[] = ((data?.result?.reviews ?? []) as LegacyReview[]).map((r) => ({
    externalId: `${r.author_name}:${r.time}`,
    authorName: r.author_name,
    authorPhoto: r.profile_photo_url ?? null,
    authorUrl: r.author_url ?? null,
    rating: Math.max(1, Math.min(5, Math.round(r.rating))),
    text: (r.text ?? "").slice(0, 4000),
    publishedAt: new Date(r.time * 1000).toISOString(),
    relativeTime: r.relative_time_description ?? null,
  }));
  return { result: { placeId, mapsUrl: data?.result?.url ?? null, reviews }, error: null as string | null };
}

// ── Route ─────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || apiKey === "REPLACE_ME") {
    return NextResponse.json(
      { ok: false, error: "GOOGLE_PLACES_API_KEY is not set. Enable the Places API in Google Cloud and add the key." },
      { status: 503 },
    );
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is required to write reviews." },
      { status: 503 },
    );
  }

  const settings = await getSettings();
  const tried: string[] = [];

  // 1. Place ID — cached, or resolved from the business name and address.
  let placeId = String(settings.google_place_id ?? "");
  if (!placeId) {
    const name = String(settings.google_business_name ?? "");
    const address = String(settings.google_address ?? "");
    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Set either google_place_id or google_business_name in site_settings." },
        { status: 503 },
      );
    }
    const query = `${name} ${address}`.trim();

    const viaNew = await newApiFindPlace(apiKey, query);
    if (viaNew.error) tried.push(viaNew.error);
    let found = viaNew.id;

    if (!found) {
      const viaLegacy = await legacyFindPlace(apiKey, query);
      if (viaLegacy.error) tried.push(viaLegacy.error);
      found = viaLegacy.id;
    }

    if (!found) {
      return NextResponse.json(
        {
          ok: false,
          error: `Could not resolve a Place ID for "${query}".`,
          googleSaid: tried,
          hint: "If Google reports REQUEST_DENIED or SERVICE_DISABLED, enable 'Places API (New)' for this key's project and check the key's API restrictions. If it reports ZERO_RESULTS, set google_place_id directly in site_settings.",
        },
        { status: 404 },
      );
    }
    placeId = found;
    await supabase
      .from("site_settings")
      .upsert({ key: "google_place_id", value: placeId, updated_at: new Date().toISOString() });
  }

  // 2. Details + reviews.
  let details = await newApiDetails(apiKey, placeId);
  if (details.error) {
    tried.push(details.error);
    details = await legacyDetails(apiKey, placeId);
    if (details.error) tried.push(details.error);
  }
  if (!details.result) {
    return NextResponse.json({ ok: false, error: "Could not read the place.", googleSaid: tried }, { status: 502 });
  }

  const { reviews, mapsUrl } = details.result;
  if (!reviews.length) {
    return NextResponse.json({ ok: true, placeId, synced: 0, message: "No reviews on the profile yet." });
  }

  const rows = reviews.map((r) => ({
    source: "google" as const,
    external_id: r.externalId,
    author_name: r.authorName,
    author_photo_url: r.authorPhoto,
    author_url: r.authorUrl,
    rating: r.rating,
    text: r.text,
    reviewed_at: r.publishedAt,
    relative_time: r.relativeTime,
    source_url: mapsUrl,
    // Only 4- and 5-star reviews auto-publish; anything lower is held, so a bad
    // review is a conversation with the customer, not a surprise on the homepage.
    is_published: r.rating >= 4,
    synced_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("reviews").upsert(rows, { onConflict: "source,external_id" });
  if (error) {
    console.error("[reviews/sync] upsert failed:", error.message);
    return NextResponse.json({ ok: false, error: "Could not save reviews." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    placeId,
    synced: rows.length,
    published: rows.filter((r) => r.is_published).length,
    held: rows.filter((r) => !r.is_published).length,
  });
}

/** Convenience: same as POST, so a cron GET also works. */
export async function GET(request: Request) {
  return POST(request);
}
