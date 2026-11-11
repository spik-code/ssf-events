"use client";

import { useEffect, useState } from "react";
import { withViewTransition } from "@/lib/viewTransition";

const KEY = "ssf-theme";
const THEMES = ["cotton", "candlelight"] as const;
type Theme = (typeof THEMES)[number];

/** Palette switcher. The pre-paint script in layout.tsx has already applied the saved value. */
export function ThemeSelect() {
  const [theme, setTheme] = useState<Theme>("cotton");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "candlelight") setTheme("candlelight");
  }, []);

  function apply(next: string) {
    const t: Theme = next === "candlelight" ? "candlelight" : "cotton";
    // The new palette wipes across the page from the bar.
    withViewTransition(() => {
      setTheme(t);
      document.documentElement.setAttribute("data-theme", t);
    }, "theme-wipe");
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* private mode / storage blocked — the choice just won't persist */
    }
  }

  return (
    <label className="theme-pick">
      <span className="sr-only">Colour theme</span>
      <select value={theme} onChange={(e) => apply(e.target.value)} aria-label="Colour theme">
        <option value="cotton">Cotton</option>
        <option value="candlelight">Candlelight</option>
      </select>
    </label>
  );
}
