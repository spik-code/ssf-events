"use client";

import { useEffect } from "react";

/** Reveal an element once its top edge is this far down the viewport. */
const TRIGGER = 0.9;

/**
 * Reveals every `.reveal` element as it comes into view, by adding `.in`.
 *
 * The paired CSS in globals.css has existed since the first commit, but every
 * call site rendered `reveal in` from the server, so the system shipped
 * permanently switched on and nothing ever moved. This is the missing half.
 *
 * The hidden state is gated on `.js-reveal`, which the boot script in
 * app/layout.tsx puts on <html> before first paint. That ordering matters in
 * both directions: without the class nothing is ever hidden, so JavaScript
 * being blocked leaves the page fully readable rather than blank; and because
 * the class lands before paint rather than at hydration, nothing flashes in
 * and back out. If anything here cannot run, the class comes straight off.
 *
 * This sweeps positions on scroll rather than using an IntersectionObserver,
 * because the observer gets this wrong on exactly the move this site's
 * navigation is built out of. Clicking "Enquire" jumps the page in a single
 * frame, so every band in between goes from below the viewport to above it
 * without ever being sampled as intersecting — no callback fires, and those
 * bands stay invisible for the rest of the visit. A position sweep reveals
 * anything whose top has passed the line, including everything skipped over.
 * With a few dozen elements, each dropped from the list as it fires, the
 * cost is a handful of rect reads on the frames that need them.
 */
export function RevealOnScroll() {
  useEffect(() => {
    const root = document.documentElement;
    const showEverything = () => root.classList.remove("js-reveal");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) {
      showEverything();
      return;
    }

    let pending = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.in)"));
    let raf = 0;

    const detach = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const sweep = () => {
      raf = 0;
      const line = window.innerHeight * TRIGGER;
      pending = pending.filter((el) => {
        // Anything at or above the line has been reached, including elements
        // now scrolled well past it with a negative top.
        if (el.getBoundingClientRect().top >= line) return true;
        el.classList.add("in");
        return false;
      });
      if (!pending.length) detach();
    };

    function onScroll() {
      if (!raf) raf = requestAnimationFrame(sweep);
    }

    // Someone can turn reduced motion on mid-visit; honour it immediately.
    const onPrefChange = () => {
      if (!reduce.matches) return;
      detach();
      showEverything();
    };

    sweep();
    if (pending.length) {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
    }
    reduce.addEventListener("change", onPrefChange);

    return () => {
      detach();
      reduce.removeEventListener("change", onPrefChange);
    };
  }, []);

  return null;
}
