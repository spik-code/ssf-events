import type { GalleryItem, Service, SiteSettings } from "./types";
import { ikVideo, ikPoster } from "./imagekit";

/**
 * Canonical seed / fallback content.
 *
 * This is the single source of truth that (a) seeds Supabase and (b) renders the
 * site if Supabase is unreachable or not yet seeded. Keep it in sync with
 * supabase/migrations/0001_init.sql.
 *
 * Every image path points at ImageKit (uploaded under /ssf/...).
 */

type SeedGallery = Omit<GalleryItem, "id" | "imagekit_file_id" | "event_id" | "created_at">;

export const GALLERY: SeedGallery[] = [
  { imagekit_url: "/ssf/gallery/22_C3mwzlILf0Q.webp", category: "reception", venue: null, location: null, guest_count: null, caption: "Banquet-hall reception", alt: "Lotus-centre reception stage in a banquet hall", order_index: 1, featured: true, is_published: true },
  { imagekit_url: "/ssf/gallery/31_CqZey2IraXd.webp", category: "mandap", venue: null, location: "Avani, Kolar", guest_count: null, caption: "Gopuram mandap in a tent pavilion", alt: "Gopuram-style mandap inside a tent pavilion", order_index: 2, featured: true, is_published: true },
  { imagekit_url: "/ssf/gallery/26_CpFQAiJLHum.webp", category: "reception", venue: null, location: null, guest_count: null, caption: "Reception aisle, flower stands & drapes", alt: "Reception aisle dressed with tall flower stands and draped chairs", order_index: 3, featured: true, is_published: true },
  { imagekit_url: "/ssf/gallery/38_CoEZH74rgWc.webp", category: "celebration", venue: null, location: null, guest_count: null, caption: "Peacock-fan backdrop, naming ceremony", alt: "Pastel peacock-fan backdrop for a naming ceremony", order_index: 4, featured: true, is_published: true },
  { imagekit_url: "/ssf/gallery/12_C0tQGUUr6nj.webp", category: "wedding", venue: null, location: null, guest_count: null, caption: "Illuminated arch stage, wide wedding backdrop", alt: "Row of illuminated floral arches forming a wide wedding stage", order_index: 5, featured: true, is_published: true },
  { imagekit_url: "/ssf/gallery/36_CoEZdBjr0ZD.webp", category: "reception", venue: null, location: null, guest_count: null, caption: "Rose-curtain stage, marigold pelmet", alt: "Rose-curtain stage with a marigold pelmet and a carved settee", order_index: 6, featured: true, is_published: true },
  { imagekit_url: "/ssf/gallery/23_ComnbsSvpzz.webp", category: "reception", venue: null, location: null, guest_count: null, caption: "Carved red & gold reception stage", alt: "Carved red and gold reception stage with horse motifs", order_index: 7, featured: false, is_published: true },
  { imagekit_url: "/ssf/gallery/33_CokFlU6PwCH.webp", category: "mandap", venue: null, location: null, guest_count: null, caption: "Brass gateway entrance, betrothal / pooja", alt: "Brass Venkateshwara gateway framing a red-carpet entrance", order_index: 8, featured: false, is_published: true },
  { imagekit_url: "/ssf/gallery/29_CpSfO0uLhI-.webp", category: "reception", venue: null, location: null, guest_count: null, caption: "Pearl-curtain stage, blue wash", alt: "Pearl-curtain stage with blue uplight and flower stands along the aisle", order_index: 9, featured: false, is_published: true },
  { imagekit_url: "/ssf/gallery/01_C3sc9aDyjI2.webp", category: "haldi", venue: null, location: "Kolar", guest_count: null, caption: "Haldi stage & marigold rangoli", alt: "Green and yellow haldi stage with a marigold floor rangoli", order_index: 10, featured: false, is_published: true },
  { imagekit_url: "/ssf/gallery/32_CokFpHKvVAt.webp", category: "mandap", venue: null, location: null, guest_count: null, caption: "Lattice flower backdrop, engagement settee", alt: "Diamond-lattice flower backdrop in yellow and red with a settee", order_index: 11, featured: false, is_published: true },
  { imagekit_url: "/ssf/gallery/18_C3mxQWVr_OS.webp", category: "mandap", venue: null, location: null, guest_count: null, caption: "White colonnade stage, brass deities", alt: "White colonnade stage with brass deities and a floral canopy", order_index: 12, featured: false, is_published: true },
  { imagekit_url: "/ssf/gallery/13_CxzBMQiSRBw.webp", category: "mandap", venue: null, location: "Bengaluru", guest_count: null, caption: "Traditional mandap with deities", alt: "Traditional mandap with deities and dense greenery", order_index: 13, featured: false, is_published: true },
  { imagekit_url: "/ssf/gallery/19_CxzBEmUy_tZ.webp", category: "mandap", venue: null, location: "Bengaluru", guest_count: null, caption: "Brass peacock pillars", alt: "Brass peacock pillars with layered floral garlands", order_index: 14, featured: false, is_published: true },
  { imagekit_url: "/ssf/gallery/37_CoEZKjgr_S_.webp", category: "reception", venue: null, location: null, guest_count: null, caption: "White lattice stage, floral arches", alt: "White lattice stage with floral arches and potted greenery", order_index: 15, featured: false, is_published: true },
  { imagekit_url: "/ssf/gallery/00_C3_ohmNPbLG.webp", category: "reception", venue: null, location: null, guest_count: null, caption: "Violet LED reception stage", alt: "Reception stage with a violet LED backdrop", order_index: 16, featured: false, is_published: true },
  { imagekit_url: "/ssf/gallery/30_CwlyWhavjsN.webp", category: "wedding", venue: "CMR", location: "Bengaluru", guest_count: null, caption: "Banquet aisle dressing, CMR", alt: "Long banquet aisle with red carpet and draped chairs", order_index: 17, featured: false, is_published: true },
  { imagekit_url: "/ssf/gallery/20_CxzBSZeSDOE.webp", category: "mandap", venue: null, location: "Bengaluru", guest_count: null, caption: "Peacock & flower detail", alt: "Close view of brass peacock and flower detailing on a mandap pillar", order_index: 18, featured: false, is_published: true },
  { imagekit_url: "/ssf/gallery/24_CqGF3k6PRXT.webp", category: "celebration", venue: "Govt Junior College", location: "Kolar", guest_count: null, caption: "Function stage, Govt Junior College", alt: "Function stage with a bright floral border", order_index: 19, featured: false, is_published: true },
  { imagekit_url: "/ssf/gallery/35_CqZe7eMrbZV.webp", category: "mandap", venue: null, location: null, guest_count: null, caption: "Pavilion mandap, tent setup", alt: "Mandap under a clear-span tent pavilion", order_index: 20, featured: false, is_published: true },
];

export const SERVICES: Omit<Service, "id" | "created_at">[] = [
  { name: "Wedding stage & backdrop", description: "Feature stages, floral walls and seating for the muhurtham and the reception.", order_index: 1, is_active: true },
  { name: "Mandap & tradition", description: "Gopuram and pillar mandaps, brass deities, garlands and pooja setups.", order_index: 2, is_active: true },
  { name: "Reception & entrance", description: "Aisle flower stands, draped chairs, gateway arches and photo corners.", order_index: 3, is_active: true },
  { name: "Haldi & get-togethers", description: "Bright marigold staging, floor rangoli, seating and props for the day functions.", order_index: 4, is_active: true },
  { name: "Baby shower & birthday", description: "Balloon and flower backdrops, name boards and themed corners.", order_index: 5, is_active: true },
  { name: "Theme decor, DJ & lighting", description: "A colour story carried across the hall, with uplights, LED walls and sound.", order_index: 6, is_active: true },
  { name: "Catering & dining", description: "Pure veg and non-veg menus, live counters and evening snacks, with serving staff, crockery and the dining area dressed to match. Arranged and managed by us through caterers we work with regularly.", order_index: 7, is_active: true },
];

export const SETTINGS: SiteSettings = {
  hero_headline: "Life is an event. Make it memorable.",
  hero_subcopy:
    "We build the stage, the mandap and the flowers your day is remembered by — weddings, receptions, engagements, haldi, baby showers and birthdays, set up and struck by one team.",
  hero_video_url: "",
  hero_image_url: "/ssf/gallery/22_C3mwzlILf0Q.webp",
  proof_metrics: [
    { label: "Function types", value: "8+" },
    { label: "Home base", value: "Kolar" },
    { label: "Also serving", value: "Bengaluru" },
    { label: "State", value: "Karnataka" },
  ],
  google_place_id: "",
  google_reviews_url: "",
  google_maps_url: "",
};

/** What an enquiry can ask for. Drives the checkboxes on the enquiry form. */
export const SERVICE_NEEDS: { value: string; label: string }[] = [
  { value: "decor", label: "Decor & staging" },
  { value: "catering", label: "Catering & dining" },
  { value: "dj_lighting", label: "DJ & lighting" },
  { value: "full", label: "Everything — full function" },
];

/** Reel clips. The live list is the `reels` table, managed at /admin/reels;
 *  this is the fallback when Supabase is unreachable. Files are on ImageKit. */
export interface ReelClip {
  src: string;
  poster: string;
  caption: string;
}

const reel = (key: string, caption: string): ReelClip => ({
  src: ikVideo(`/ssf/reels/${key}.mp4`),
  poster: ikPoster(`/ssf/reels/${key}.mp4`, `/ssf/reels/${key}_poster.jpg`),
  caption,
});

export const REEL: ReelClip[] = [
  reel("34_CwkNawOSHQH", "Baby shower · Kolar"),
  reel("39_CoG8qUHDoGx", "Anniversary · Tumkur"),
  reel("07_C3xdNTuyJpI", "Stage · Bangarpet"),
  reel("14_C3mx-Tqrmo7", "Sri Nandini Palace"),
  reel("09_C55DBR8r8HP", "Reception hall"),
  reel("06_C3xezUTSmHo", "Floral stage"),
  reel("10_C3_0KY8r_n-", "Mandap detail"),
  reel("27_CoiV1ZqjdVT", "Entrance decor"),
  reel("28_CoiZEEcjw-l", "Hall & seating"),
  reel("03_C35NNM9v4R0", "Setup clip"),
  reel("08_C7wveRZSl9e", "Evening lighting"),
];

export const GALLERY_FILTERS: { key: string; label: string; match: string[] }[] = [
  { key: "all", label: "All", match: [] },
  { key: "wedding", label: "Weddings & receptions", match: ["wedding", "reception"] },
  { key: "mandap", label: "Mandap & tradition", match: ["mandap", "decor"] },
  { key: "celebration", label: "Haldi & celebrations", match: ["haldi", "celebration"] },
];
