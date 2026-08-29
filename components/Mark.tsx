import { SITE } from "@/lib/site";

/** The SSF ring mark — used in the header and footer. `href` defaults to the
 *  in-page top anchor; pass "/" on standalone pages that have no #top. */
export function Mark({ label, href = "#top" }: { label: string; href?: string }) {
  return (
    <a className="mark" href={href} aria-label={label}>
      <svg className="ring" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="18" stroke="var(--gold)" strokeWidth="1.4" />
        <circle
          cx="20"
          cy="20"
          r="14.5"
          stroke="var(--gold)"
          strokeWidth="1"
          strokeDasharray="1.6 2.4"
        />
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
      <span className="txt">
        <b>{SITE.name}</b>
        <span>{SITE.legalName}</span>
      </span>
    </a>
  );
}
