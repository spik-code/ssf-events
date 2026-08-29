export type GalleryCategory =
  | "wedding"
  | "reception"
  | "mandap"
  | "haldi"
  | "celebration"
  | "decor";

export interface GalleryItem {
  id: string;
  imagekit_url: string; // stored as an ImageKit path, e.g. "/ssf/gallery/22_C3mwzlILf0Q.webp"
  imagekit_file_id: string | null;
  category: GalleryCategory;
  event_id: string | null;
  venue: string | null;
  location: string | null;
  guest_count: number | null;
  caption: string | null;
  alt: string | null;
  order_index: number;
  featured: boolean;
  is_published: boolean;
  created_at: string;
}

export interface Testimonial {
  id: string;
  couple_names: string;
  quote: string;
  rating: number;
  event_date: string | null;
  location: string | null;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface ProofMetric {
  label: string;
  value: string;
}

export interface SiteSettings {
  hero_headline: string;
  hero_subcopy: string;
  hero_video_url: string;
  hero_image_url: string;
  proof_metrics: ProofMetric[];
  /** Empty until the Google Business Profile exists. */
  google_place_id: string;
  google_reviews_url: string;
  google_maps_url: string;
}

export type ReviewSource = "google" | "direct";

export interface Review {
  id: string;
  source: ReviewSource;
  external_id: string | null;
  author_name: string;
  author_photo_url: string | null;
  author_url: string | null;
  rating: number;
  text: string;
  reviewed_at: string | null;
  relative_time: string | null;
  source_url: string | null;
  is_published: boolean;
  order_index: number;
  synced_at: string | null;
  created_at: string;
}

export type EventType =
  | "wedding"
  | "reception"
  | "engagement"
  | "haldi"
  | "baby_shower"
  | "birthday"
  | "other";

export interface EnquiryInput {
  name: string;
  email?: string;
  phone: string;
  event_date?: string;
  event_location?: string;
  guest_count?: number;
  event_type: EventType;
  message?: string;
  referral_source?: string;
  services_needed?: string[];
  consent?: boolean;
  privacy_version?: string;
}
