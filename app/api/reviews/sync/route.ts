import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Pull reviews from the Google Business Profile and upsert them into `reviews`.
 *
 * Dormant until GOOGLE_PLACES_API_KEY is set. Until then it returns 503 and
 * writes nothing, so the site can never show a review that did not come from a
 * real customer.
 *
 * The Place ID is resolved automatically from google_business_name +
 * google_address on first run and cached into site_settings.
 *
 * Google's Places API returns at most 5 reviews per place; they are refreshed
 * on each sync. Run this from a cron (Vercel Cron: daily is plenty).
 *
 * Protected by CRON_SECRET when that is set.
 */

interface GooglePlaceReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  text?: string;
  time: number; // unix seconds
  relative_time_description?: string;
}

/**
 * Resolve a Place ID from the business name + address.
 *
 * A g.page short link only yields a CID, and the Places API needs a Place ID.
 * Rather than making someone hunt for it, look it up once from details we
 * already have and cache the result back into site_settings.
 */
async function resolvePlaceId(
  apiKey: string,
  name: string,
  address: string,
): Promise<string | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
  url.searchParams.set("input", `${name} ${address}`.trim());
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", "place_id,name");
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = (await res.json()) as {
      status: string;
      candidates?: { place_id?: string }[];
    };
    if (data.status !== "OK") return null;
    return data.candidates?.[0]?.place_id ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const settings = await getSettings();

  if (!apiKey || apiKey === "REPLACE_ME") {
    return NextResponse.json(
      {
        ok: false,
        error:
          "GOOGLE_PLACES_API_KEY is not set. Enable the Places API in Google Cloud and add the key.",
      },
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

  // Use the stored Place ID, or derive one from the business name + address and
  // cache it so this lookup only ever happens once.
  let placeId = settings.google_place_id;
  if (!placeId) {
    const name = String(settings.google_business_name ?? "");
    const address = String(settings.google_address ?? "");
    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Set either google_place_id or google_business_name in site_settings." },
        { status: 503 },
      );
    }
    const resolved = await resolvePlaceId(apiKey, name, address);
    if (!resolved) {
      return NextResponse.json(
        { ok: false, error: `Could not find a Google place for "${name}".` },
        { status: 404 },
      );
    }
    placeId = resolved;
    await supabase
      .from("site_settings")
      .upsert({ key: "google_place_id", value: placeId, updated_at: new Date().toISOString() });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "name,rating,user_ratings_total,reviews,url");
  url.searchParams.set("reviews_sort", "newest");
  url.searchParams.set("key", apiKey);

  let payload: {
    status: string;
    error_message?: string;
    result?: { reviews?: GooglePlaceReview[]; url?: string; rating?: number };
  };

  try {
    const res = await fetch(url, { cache: "no-store" });
    payload = await res.json();
  } catch (err) {
    console.error("[reviews/sync] fetch failed:", err);
    return NextResponse.json({ ok: false, error: "Could not reach Google." }, { status: 502 });
  }

  if (payload.status !== "OK") {
    return NextResponse.json(
      { ok: false, error: payload.error_message || payload.status },
      { status: 502 },
    );
  }

  const reviews = payload.result?.reviews ?? [];
  if (!reviews.length) {
    return NextResponse.json({ ok: true, synced: 0, message: "No reviews on the profile yet." });
  }

  const rows = reviews.map((r) => ({
    source: "google" as const,
    // Google gives no stable review id, so key on author + timestamp.
    external_id: `${r.author_name}:${r.time}`,
    author_name: r.author_name,
    author_photo_url: r.profile_photo_url ?? null,
    author_url: r.author_url ?? null,
    rating: Math.max(1, Math.min(5, Math.round(r.rating))),
    text: (r.text ?? "").slice(0, 4000),
    reviewed_at: new Date(r.time * 1000).toISOString(),
    relative_time: r.relative_time_description ?? null,
    source_url: payload.result?.url ?? null,
    // Only 4- and 5-star reviews auto-publish; anything lower is held for review
    // so a bad review is a conversation with the customer, not a surprise.
    is_published: r.rating >= 4,
    synced_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("reviews")
    .upsert(rows, { onConflict: "source,external_id" });

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
