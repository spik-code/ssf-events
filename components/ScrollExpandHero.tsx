"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";

/** The crest, the same asset the About section badges. Dark indigo, gold ring. */
const CREST = "/ssf/brand/logo-v2.webp";

/**
 * The hero, choreographed by scroll position: the SSF crest starts as a small
 * badge over the venue photo and expands towards full-bleed while the headline
 * splits apart around it and the photo fades back to paper.
 *
 * Deliberately *not* scroll-jacking. The section is simply taller than the
 * viewport with a sticky stage inside it, so progress is read from where the
 * page already is rather than from wheel deltas. Native scrolling, the nav's
 * "#" anchors, keyboard paging, find-in-page and the browser's own scroll
 * restoration all keep working — nothing calls preventDefault on a visitor who
 * only wanted to reach the enquiry form.
 *
 * Progress is written straight to the DOM as the `--p` custom property (0 → 1)
 * inside a rAF, never through React state, so a scroll costs one style write
 * rather than a re-render per frame. Every animated value in `.xhero*` is a
 * calc() off `--p`, which CSS defaults to 0 — so before hydration, with
 * JavaScript blocked, or under prefers-reduced-motion, the section renders as
 * a complete static hero.
 */
export function ScrollExpandHero({
  bgSrc,
  eyebrow,
  headLead,
  headTail,
  children,
}: {
  /** Background photograph — an ImageKit path from site_settings. */
  bgSrc: string;
  eyebrow: ReactNode;
  /** Headline split at the sentence break: lead stays roman, tail is script. */
  headLead: string;
  headTail: string;
  /** Sub-copy, calls to action and tags, read after the crest has expanded. */
  children: ReactNode;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;

    const paint = () => {
      raf = 0;
      // The stage pins under the sticky top bar, so the bar's height is both
      // the stage's offset and the y at which progress is 0. Measured rather
      // than assumed: the bar shrinks at the 400px breakpoint.
      const bar = document.querySelector(".bar");
      const barH = bar ? bar.getBoundingClientRect().height : 0;
      section.style.setProperty("--bar", `${barH}px`);

      const box = track.getBoundingClientRect();
      // How far the sticky stage can travel inside its own track.
      const travel = box.height - (window.innerHeight - barH);
      const p = travel <= 0 ? 1 : Math.min(Math.max((barH - box.top) / travel, 0), 1);
      section.style.setProperty("--p", p.toFixed(4));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const detach = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const attach = () => {
      // Someone who asked for less motion gets the resting frame and a section
      // of ordinary height: crest, headline and photo, stacked, no travel.
      if (reduce.matches) {
        section.style.setProperty("--p", "0");
        setReduced(true);
        return;
      }
      setReduced(false);
      paint();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
    };

    const onPrefChange = () => {
      detach();
      attach();
    };

    attach();
    reduce.addEventListener("change", onPrefChange);
    return () => {
      detach();
      reduce.removeEventListener("change", onPrefChange);
    };
  }, []);

  return (
    <section ref={sectionRef} className={`xhero${reduced ? " is-static" : ""}`}>
      <div className="xhero-track" ref={trackRef}>
        <div className="xhero-stage">
          <div className="xhero-media" aria-hidden="true">
            <Image src={bgSrc} alt="" fill priority sizes="100vw" style={{ objectFit: "cover" }} />
          </div>

          <p className="eyebrow xhero-eyebrow">{eyebrow}</p>

          {/* Decorative here — the header wordmark and the About badge already
              name the business, so the crest needs no second announcement. */}
          <div className="xhero-card" aria-hidden="true">
            <Image
              src={CREST}
              alt=""
              fill
              priority
              sizes="(max-width:760px) 92vw, 1180px"
              style={{ objectFit: "cover" }}
            />
          </div>

          <div className="xhero-foot">
            <h1 className="h1 xhero-title">
              <span className="xhero-lead">{headLead}.</span>{" "}
              <em className="script xhero-tail">{headTail}</em>
            </h1>
            <p className="xhero-hint" aria-hidden="true">
              Scroll
            </p>
          </div>
        </div>
      </div>

      <div className="wrap xhero-in">{children}</div>
    </section>
  );
}
