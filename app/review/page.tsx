import type { Metadata } from "next";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { Footer } from "@/components/Footer";
import { ReviewRedirect } from "@/components/ReviewRedirect";
import { SITE } from "@/lib/site";
import { getSettings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Review us",
  description: `Leave ${SITE.name} a review on Google.`,
  // A short link for stories, cards and the standee — not a page to rank.
  robots: { index: false },
};

export const revalidate = 300;

export default async function ReviewPage() {
  const settings = await getSettings();
  // The review link set in the admin; the Maps listing if it is missing.
  const url = settings.google_reviews_url || settings.google_maps_url || "/";

  return (
    <>
      <header className="bar">
        <div className="wrap bar-in legal-bar">
          <Mark label={`${SITE.name}, home`} href="/" />
          <Link className="nav-back" href="/">
            &larr; Back to site
          </Link>
        </div>
      </header>

      <main id="main" className="band wrap legal">
        <div className="legal-in">
          <p className="eyebrow">
            <span className="tick" /> Review
          </p>
          <h1 className="h1">Rate {SITE.name} on Google</h1>
          <p className="note">
            Thank you for celebrating with us. A one-minute review helps another family find us
            for their big day.
          </p>
          {/* Works without JavaScript; ReviewRedirect usually leaves before this is read. */}
          <p className="review-go">
            <a className="btn btn-primary" href={url}>
              Write a review
            </a>
          </p>
          <ReviewRedirect url={url} />
        </div>
      </main>

      <Footer />
    </>
  );
}
