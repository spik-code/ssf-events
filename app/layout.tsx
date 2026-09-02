import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RevealOnScroll } from "@/components/RevealOnScroll";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SSF Events — Wedding & Event Decor · Kolar & Bengaluru",
    template: "%s · SSF Events",
  },
  description:
    "SSF Events (Sri Sai Flora Enterprises) — stage, mandap and celebration decor for weddings, receptions, engagements, haldi, baby showers and birthdays across Kolar, Bengaluru and Karnataka.",
  keywords: [
    "wedding decor Kolar",
    "wedding decoration Bengaluru",
    "mandap decoration Karnataka",
    "reception stage decor",
    "haldi decoration",
    "baby shower decoration Kolar",
    "SSF Events",
    "Sri Sai Flora Enterprises",
  ],
  openGraph: {
    type: "website",
    siteName: "SSF Events",
    title: "SSF Events — Wedding & Event Decor · Kolar & Bengaluru",
    description:
      "Stage, mandap and celebration decor across Kolar, Bengaluru and Karnataka. Life is an event — make it memorable.",
    url: SITE_URL,
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ECEBE6" },
    { media: "(prefers-color-scheme: dark)", color: "#15151D" },
  ],
};

/** Applies the saved theme before paint so there is no flash of the wrong palette. */
const THEME_BOOT = `(function(){try{var t=localStorage.getItem("ssf-theme");document.documentElement.setAttribute("data-theme",t==="candlelight"?"candlelight":"cotton");}catch(e){}})();`;

/** Arms the scroll reveal before paint. Only once this class is on <html> does
 *  anything start hidden, so a browser with JavaScript off — or one that never
 *  reaches this script — renders the page fully visible instead of blank. */
const REVEAL_BOOT = `(function(){try{if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("js-reveal");}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="cotton">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Sans:wght@400;500;600&family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <script dangerouslySetInnerHTML={{ __html: REVEAL_BOOT }} />
      </head>
      <body>
        {children}
        <RevealOnScroll />
      </body>
    </html>
  );
}
