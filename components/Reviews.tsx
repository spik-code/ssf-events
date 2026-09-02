import { GoogleGlyph, StarRow, PinIcon } from "./icons";
import type { Review } from "@/lib/types";

/**
 * Reviews section, with three states:
 *
 *   1. Reviews exist        → rating summary + review cards + "leave a review".
 *   2. No reviews, but the Google profile is set up → a short invitation to be
 *      the first to review. This is what actually earns the first reviews.
 *   3. No reviews and no profile → renders nothing at all.
 *
 * There is no placeholder or sample review in any state: a review shown on this
 * page is always something a real customer wrote.
 */
export function Reviews({
  reviews,
  average,
  reviewsUrl,
  mapsUrl,
}: {
  reviews: Review[];
  average: number | null;
  reviewsUrl?: string;
  mapsUrl?: string;
}) {
  const hasReviews = reviews.length > 0;
  if (!hasReviews && !reviewsUrl) return null;

  // ── State 2: profile live, no reviews yet ──────────────────────────
  if (!hasReviews) {
    return (
      <section id="reviews" className="band wrap">
        <div className="ask reveal">
          <div className="ask-body">
            <p className="eyebrow">
              <span className="tick" /> Reviews
            </p>
            <h2 className="h2">Worked with us?</h2>
            <p className="note">
              We&rsquo;re on Google now and building up reviews. If we&rsquo;ve done your
              function, a few words would mean a lot &mdash; and it helps the next family in
              Kolar find us.
            </p>
            <div className="ask-cta">
              <a
                className="btn btn-primary"
                href={reviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GoogleGlyph />
                Write a review
              </a>
              {mapsUrl && (
                <a className="btn btn-ghost" href={mapsUrl} target="_blank" rel="noopener noreferrer">
                  <PinIcon />
                  Find us on Maps
                </a>
              )}
            </div>
          </div>
          {/* Empty outlines — decorative only. Filled stars here would read as a
              5.0 rating the profile has not actually earned yet. */}
          <span className="ask-stars" aria-hidden="true">
            <StarRow rating={0} />
          </span>
        </div>
      </section>
    );
  }

  // ── State 1: real reviews ──────────────────────────────────────────
  return (
    <section id="reviews" className="band wrap">
      <header className="band-head reveal">
        <p className="eyebrow">
          <span className="tick" /> Reviews
        </p>
        <h2 className="h2">What people say</h2>
        {average !== null && (
          <p className="rate-line">
            <StarRow rating={Math.round(average)} />
            <b>{average.toFixed(1)}</b>
            <span>
              from {reviews.length} {reviews.length === 1 ? "review" : "reviews"} on Google
            </span>
          </p>
        )}
      </header>

      <div className="revs reveal">
        {reviews.map((r) => (
          <blockquote className="rev" key={r.id}>
            <div className="rev-top">
              <StarRow rating={r.rating} />
              {r.source === "google" && (
                <span className="rev-src" title="From our Google Business Profile">
                  <GoogleGlyph />
                </span>
              )}
            </div>
            <p>{r.text}</p>
            <footer>
              <b>{r.author_name}</b>
              {r.relative_time && <span>{r.relative_time}</span>}
            </footer>
          </blockquote>
        ))}
      </div>

      {reviewsUrl && (
        <p className="rev-cta reveal">
          <a className="btn btn-ghost" href={reviewsUrl} target="_blank" rel="noopener noreferrer">
            <GoogleGlyph />
            Leave us a review
          </a>
        </p>
      )}
    </section>
  );
}
