import Link from "next/link";
import { Mark } from "./Mark";
import { SITE } from "@/lib/site";

/** Shared site footer. On the homepage the mark scrolls back to top; on
 *  standalone pages (e.g. /privacy) it links home instead. */
export function Footer({ home = false }: { home?: boolean }) {
  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <Mark
          label={home ? `${SITE.name}, back to top` : `${SITE.name}, home`}
          href={home ? "#top" : "/"}
        />
        <span>Wedding &amp; event decor · Kolar &amp; Bengaluru</span>
        <span className="grow">
          © {new Date().getFullYear()} {SITE.legalName}
        </span>
        <Link className="foot-link" href="/privacy">
          Privacy
        </Link>
      </div>
    </footer>
  );
}
