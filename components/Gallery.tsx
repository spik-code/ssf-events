"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import { GALLERY_FILTERS } from "@/lib/content";
import type { GalleryItem } from "@/lib/types";

/**
 * Filterable masonry gallery. Every image is served from ImageKit through the
 * custom loader, so Next requests exactly the width it needs at f-auto/q-72.
 */
export function Gallery({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState("all");
  const [filtered, setFiltered] = useState(false);
  let shown = 0;

  const visible = (item: GalleryItem) => {
    if (active === "all") return true;
    const filter = GALLERY_FILTERS.find((f) => f.key === active);
    return filter ? filter.match.includes(item.category) : true;
  };

  return (
    <>
      <div className="chips" role="group" aria-label="Filter the gallery">
        {GALLERY_FILTERS.map((f) => (
          <button
            key={f.key}
            className={`chip${active === f.key ? " is-on" : ""}`}
            aria-pressed={active === f.key}
            onClick={() => {
              setActive(f.key);
              setFiltered(true);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Each photo rises on its own as it is scrolled to. Once a filter has
          been pressed, the key changes with the filter so the photos are
          rebuilt and replay the settle animation; they drop `.reveal`,
          which RevealOnScroll would never see on a rebuilt element. */}
      <div className={`gallery${filtered ? " is-filtered" : ""}`}>
        {items.map((item) => (
          <figure
            key={filtered ? `${active}:${item.id}` : item.id}
            hidden={!visible(item)}
            className={filtered ? undefined : "reveal"}
            style={{ "--i": visible(item) ? shown++ : 0 } as CSSProperties}
          >
            <Image
              src={item.imagekit_url}
              alt={item.alt || item.caption || "SSF Events decor setup"}
              width={800}
              height={800}
              sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
              style={{ width: "100%", height: "auto" }}
            />
            <figcaption>
              <b>{item.caption}</b>
              {[item.venue, item.location].filter(Boolean).join(" · ") || item.category}
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
