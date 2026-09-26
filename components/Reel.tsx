"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { PlayIcon, CloseIcon } from "./icons";
import type { ReelClip } from "@/lib/content";

/** Horizontal clip strip; tapping a card opens the video in a focus-trapped lightbox. */
export function Reel({ clips }: { clips: ReelClip[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    videoRef.current?.pause();
    setOpen(null);
    lastFocus.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      <div className="reel reveal stagger">
        {clips.map((c, i) => (
          <button
            key={c.src}
            style={{ "--i": i } as CSSProperties}
            onClick={(e) => {
              lastFocus.current = e.currentTarget;
              setOpen(c.src);
            }}
            aria-label={`Play clip: ${c.caption}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img loading="lazy" src={c.poster} alt="" />
            <span className="play">
              <i aria-hidden="true">
                <PlayIcon />
              </i>
            </span>
            <span className="cap">{c.caption}</span>
          </button>
        ))}
      </div>

      <div
        className={`lb${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Video player"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <button className="lb-close" ref={closeRef} onClick={close} aria-label="Close video">
          <CloseIcon />
        </button>
        {open && <video ref={videoRef} src={open} controls autoPlay playsInline preload="metadata" />}
      </div>
    </>
  );
}
