"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The section links. A plain row on wide screens; below 1000px the same <nav>
 * becomes a panel under the bar, opened by the menu button (see globals.css).
 * `children` rides along after the links — the theme picker lives here so the
 * phone bar has room for the button.
 */
export function Nav({ links, children }: { links: [href: string, label: string][]; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div className="nav-wrap" ref={wrap}>
      <button
        className="menu-btn"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="site-nav"
        onClick={() => setOpen((o) => !o)}
      >
        <span />
        <span />
      </button>
      <nav
        id="site-nav"
        className={`nav${open ? " is-open" : ""}`}
        aria-label="Sections"
        // Following a link closes the panel; using the theme picker does not.
        onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
      >
        {links.map(([href, label]) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
        {children}
      </nav>
    </div>
  );
}
