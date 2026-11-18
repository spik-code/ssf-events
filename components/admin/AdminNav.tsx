"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./SignOutButton";
import { ThemeSelect } from "../ThemeSelect";
import { PushToggle } from "./PushToggle";

const LINKS = [
  { href: "/admin", label: "Leads", exact: true },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/reels", label: "Reels" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/documents", label: "Quotes & bills" },
  { href: "/admin/bookings", label: "Calendar" },
  { href: "/admin/expenses", label: "Expenses" },
];

export function AdminNav({ email, newLeads = 0 }: { email: string; newLeads?: number }) {
  const pathname = usePathname();

  return (
    <header className="adm-bar">
      <div className="adm-bar-in">
        <Link className="adm-mark" href="/admin">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-ring.png" alt="" width={34} height={34} />
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
          <PushToggle />
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
