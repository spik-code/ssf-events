import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** The only public pages. Add new ones here as they are built. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
