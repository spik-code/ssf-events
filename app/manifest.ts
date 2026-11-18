import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SSF Events Owner",
    short_name: "SSF Owner",
    description: "Leads, quotations, bills, calendar and expenses for SSF Events.",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#15151D",
    theme_color: "#15151D",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
