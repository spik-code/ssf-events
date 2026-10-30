import { createServerClient } from "./supabase/server";
import { GALLERY, SERVICES, SETTINGS } from "./content";
import type {
  GalleryItem,
  Service,
  SiteSettings,
  Testimonial,
  ProofMetric,
  Review,
} from "./types";

/**
 * Read helpers for the public site.
 *
 * Every one of these degrades to the seed content in lib/content.ts if Supabase
 * is unreachable, so the marketing pages always render. Empty results come back
 * as [] / {} — never null.
 */

const FALLBACK_GALLERY: GalleryItem[] = GALLERY.map((g, i) => ({
  ...g,
  id: `seed-${i}`,
  imagekit_file_id: null,
  event_id: null,
  created_at: new Date(0).toISOString(),
}));

const FALLBACK_SERVICES: Service[] = SERVICES.map((s, i) => ({
  ...s,
  id: `seed-${i}`,
  created_at: new Date(0).toISOString(),
}));

export async function getGallery(category?: string): Promise<GalleryItem[]> {
  try {
    const supabase = createServerClient();
    let q = supabase
      .from("gallery_items")
      .select("*")
      .eq("is_published", true)
      .order("order_index", { ascending: true });

    if (category && category !== "all") q = q.eq("category", category);

    const { data, error } = await q;
    if (error || !data?.length) return category ? [] : FALLBACK_GALLERY;
    return data as GalleryItem[];
  } catch {
    return category ? [] : FALLBACK_GALLERY;
  }
}

export async function getServices(): Promise<Service[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (error || !data?.length) return FALLBACK_SERVICES;
    return data as Service[];
  } catch {
    return FALLBACK_SERVICES;
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("is_published", true)
      .order("event_date", { ascending: false, nullsFirst: false });

    if (error || !data) return [];
    return data as Testimonial[];
  } catch {
    return [];
  }
}

/**
 * Published reviews, newest first.
 *
 * Returns [] when there are none — the page then renders no reviews section at
 * all. There is deliberately no seed/fallback here: a review must be something
 * a real customer actually wrote.
 */
export async function getReviews(): Promise<Review[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("is_published", true)
      .order("order_index", { ascending: true })
      .order("reviewed_at", { ascending: false, nullsFirst: false });

    if (error || !data) return [];
    return data as Review[];
  } catch {
    return [];
  }
}

/** Average rating across published reviews, rounded to one decimal. */
export function averageRating(reviews: Review[]): number | null {
  if (!reviews.length) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export async function getSettings(): Promise<SiteSettings & Record<string, unknown>> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.from("site_settings").select("key, value");
    if (error || !data?.length) return { ...SETTINGS };

    const map: Record<string, unknown> = {};
    for (const row of data as { key: string; value: unknown }[]) map[row.key] = row.value;

    return {
      hero_headline: (map.hero_headline as string) ?? SETTINGS.hero_headline,
      hero_subcopy: (map.hero_subcopy as string) ?? SETTINGS.hero_subcopy,
      hero_video_url: (map.hero_video_url as string) ?? SETTINGS.hero_video_url,
      hero_image_url: (map.hero_image_url as string) ?? SETTINGS.hero_image_url,
      proof_metrics: (map.proof_metrics as ProofMetric[]) ?? SETTINGS.proof_metrics,
      google_place_id: (map.google_place_id as string) ?? "",
      google_reviews_url: (map.google_reviews_url as string) ?? "",
      google_maps_url: (map.google_maps_url as string) ?? "",
      ...map,
    };
  } catch {
    return { ...SETTINGS };
  }
}
