"use client";

import { useEffect } from "react";

/** Cards that carry the hover spotlight drawn in globals.css. */
const CARDS = ".svc-item, .rev";

/**
 * Feeds the pointer position to the card under it as --mx/--my, which the
 * card's ::before uses to centre a soft accent glow. One delegated listener
 * covers every card, and touch screens (no hover) skip it entirely.
 */
export function PointerGlow() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;

    const onMove = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest<HTMLElement>(CARDS);
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  return null;
}
