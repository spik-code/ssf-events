"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./SignOutButton";
import { ThemeSelect } from "../ThemeSelect";

const LINKS = [
  { href: "/admin", label: "Leads", exact: true },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/reels", label: "Reels" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/bookings", label: "Bookings" },
];

export function AdminNav({ email, newLeads = 0 }: { email: string; newLeads?: number }) {
  const pathname = usePathname();

  return (
    <header className="adm-bar">
      <div className="adm-bar-in">
        <Link className="adm-mark" href="/admin">
          <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <circle cx="20" cy="20" r="18" stroke="var(--gold)" strokeWidth="1.4" />
            <text
              x="20"
              y="24.5"
              textAnchor="middle"
              fontFamily="IBM Plex Mono, monospace"
              fontSize="12"
              fontWeight="600"
              fill="var(--gold)"
            >
              SSF
            </text>
          </svg>
          <b>Admin</b>
        </Link>

        <nav className="adm-nav" aria-label="Admin sections">
          {LINKS.map((l) => {
            const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={active ? "is-on" : ""}>
                {l.label}
                {l.exact && newLeads > 0 && (
                  <span className="adm-badge" aria-label={`${newLeads} awaiting a first reply`}>
                    {newLeads}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="adm-user">
          <ThemeSelect />
          <a href="/" target="_blank" rel="noopener noreferrer" className="adm-view">
            View site ↗
          </a>
          <span className="adm-email" title={email}>
            {email}
          </span>
          <SignOutButton compact />
        </div>
      </div>
    </header>
  );
}
