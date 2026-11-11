"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { GALLERY_FILTERS } from "@/lib/content";
import { withViewTransition } from "@/lib/viewTransition";
import type { GalleryItem } from "@/lib/types";

const meta = (item: GalleryItem) =>
  [item.venue, item.location].filter(Boolean).join(" · ") || item.category;

/**
 * Filterable masonry gallery with a full-screen viewer. Every image is served
 * from ImageKit through the custom loader, so Next requests exactly the width
 * it needs at f-auto/q-72.
 */
export function Gallery({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState("all");
  const [filtered, setFiltered] = useState(false);
  // Index into `shown` of the photo open in the viewer.
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const touchX = useRef(0);

  const filter = GALLERY_FILTERS.find((f) => f.key === active);
  const shown =
    active === "all" || !filter ? items : items.filter((i) => filter.match.includes(i.category));
  const current = open === null ? null : shown[open];

  const step = (d: number) =>
    setOpen((i) => (i === null ? i : (i + d + shown.length) % shown.length));

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open !== null && !d.open) d.showModal();
    if (open === null && d.open) d.close();
  }, [open]);

  /** Hands the photo over to the enquiry form, without overwriting a draft. */
  const ask = () => {
    const msg = document.getElementById("f-msg") as HTMLTextAreaElement | null;
    if (msg && !msg.value && current) {
      msg.value = `I liked this setup: ${current.caption || current.category}.`;
    }
    setOpen(null);
  };

  return (
    <>
      <div className="chips" role="group" aria-label="Filter the gallery">
        {GALLERY_FILTERS.map((f) => (
          <button
            key={f.key}
            className={`chip${active === f.key ? " is-on" : ""}`}
            aria-pressed={active === f.key}
            onClick={() =>
              // Photos that survive the filter glide to their new places.
              withViewTransition(() => {
                setActive(f.key);
                setFiltered(true);
              })
            }
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
        {items.map((item) => {
          const idx = shown.indexOf(item);
          return (
            <figure
              key={filtered ? `${active}:${item.id}` : item.id}
              hidden={idx < 0}
              className={filtered ? undefined : "reveal"}
              style={{ "--i": Math.max(idx, 0), "--vt": `g-${item.id}` } as CSSProperties}
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
                {meta(item)}
              </figcaption>
              <button
                className="gallery-open"
                aria-label={`View photo: ${item.caption || item.category}`}
                onClick={() => setOpen(idx)}
              />
            </figure>
          );
        })}
      </div>

      {/* Native <dialog>: focus trap, Esc and the backdrop come with it. The
          dialog fills the screen, so a click that lands on the dialog itself
          is a click on the empty area around the photo. */}
      <dialog
        ref={dialog}
        className="lightbox"
        aria-label="Photo viewer"
        onClose={() => setOpen(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1);
        }}
      >
        {current && open !== null && (
          <>
            <Image
              key={current.id}
              className="lightbox-img"
              src={current.imagekit_url}
              alt={current.alt || current.caption || "SSF Events decor setup"}
              width={1600}
              height={1600}
              sizes="100vw"
            />
            <div className="lightbox-bar">
              <p>
                <b>{current.caption}</b>
                {meta(current)} &nbsp;·&nbsp; {open + 1} / {shown.length}
              </p>
              <a className="btn btn-primary" href="#enquire" onClick={ask}>
                Ask about this setup
              </a>
            </div>
            {shown.length > 1 && (
              <>
                <button className="lightbox-nav is-prev" aria-label="Previous photo" onClick={() => step(-1)}>
                  ‹
                </button>
                <button className="lightbox-nav is-next" aria-label="Next photo" onClick={() => step(1)}>
                  ›
                </button>
              </>
            )}
            <button className="lightbox-x" aria-label="Close" onClick={() => setOpen(null)}>
              ×
            </button>
          </>
        )}
      </dialog>
    </>
  );
}
