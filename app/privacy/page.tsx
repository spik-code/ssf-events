import type { Metadata } from "next";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { Footer } from "@/components/Footer";
import { SITE, telHref, mailHref } from "@/lib/site";
import { PRIVACY_UPDATED, DATA_REGION } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What SSF Events collects from the enquiry form, why, who sees it, and how to ask for a copy or deletion under India's DPDP Act 2023.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <span id="top" />
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
          <span className="tick" /> Privacy
        </p>
        <h1 className="h1">What we collect, and why</h1>
        <p className="note">
          {SITE.name} ({SITE.legalName}) runs one form on this site &mdash; the enquiry form. This
          page explains what it collects and what happens to it. Last reviewed {PRIVACY_UPDATED}.
        </p>

        <h2 className="h2">The short version</h2>
        <ul>
          <li>
            We only get what you type into the enquiry form. Nothing is collected in the background.
          </li>
          <li>No cookies for tracking, no analytics, no advertising pixels, no IP-address logging.</li>
          <li>
            We use it to prepare your quote and contact you about your function &mdash; nothing else.
          </li>
          <li>We never sell it and never add you to a mailing list.</li>
          <li>Ask us any time for a copy, a correction, or deletion.</li>
        </ul>

        <h2 className="h2">What the form collects</h2>
        <p>When you send an enquiry, we store:</p>
        <ul>
          <li>
            Your <b>name</b> and <b>phone number</b> (required to reply).
          </li>
          <li>
            Your <b>email</b>, if you choose to add it.
          </li>
          <li>
            Details about the function: <b>type</b> (wedding, reception, haldi, &hellip;),{" "}
            <b>date</b>, <b>venue or town</b>, <b>approximate guest count</b>, which <b>services</b>{" "}
            you need (decor, catering, DJ &amp; lighting), and your <b>message</b>.
          </li>
          <li>
            Where you came to the site from, if that is in the link you clicked (for example
            &ldquo;instagram&rdquo; or &ldquo;google&rdquo;). This is a single word, not a profile.
          </li>
          <li>The fact that you ticked the consent box, and the date.</li>
        </ul>
        <p>
          That is the whole list. We do not record your IP address, your location, or anything about
          your device or browsing.
        </p>

        <h2 className="h2">Why we have it</h2>
        <p>
          To understand your function, prepare a quote for it, and stay in touch with you about it
          &mdash; by phone, WhatsApp or email. We rely on the consent you give when you tick the box
          and submit the form. You can withdraw that consent at any time (see below); it does not
          affect anything we did while it was in place.
        </p>

        <h2 className="h2">Who sees it</h2>
        <ul>
          <li>
            <b>Us</b> &mdash; the {SITE.name} team.
          </li>
          <li>
            <b>Supabase</b>, our database provider, stores the enquiry on our behalf.{" "}
            {DATA_REGION
              ? `Their servers for this project are in ${DATA_REGION}.`
              : "Ask us if you need the specific hosting location."}
          </li>
          <li>
            <b>Resend</b>, our email provider, delivers a copy of the enquiry to our inbox when email
            notifications are switched on.
          </li>
          <li>
            If you ask for <b>catering</b>, we pass the details a caterer needs &mdash; date, venue,
            guest count, veg / non-veg &mdash; to the catering partner we assign to your function. We
            work with a regular set of caterers; catering is arranged and managed by us through them.
          </li>
        </ul>
        <p>We do not share your details with anyone else, and we do not sell data.</p>

        <h2 className="h2">How long we keep it</h2>
        <p>
          For as long as we need it to respond to you and, if you book us, for the run of the work
          plus a reasonable period for our own records. Ask us to delete it sooner and we will,
          unless we are required to keep something (for example a tax record).
        </p>

        <h2 className="h2">Your rights under the DPDP Act 2023</h2>
        <p>You can ask us to:</p>
        <ul>
          <li>tell you what we hold about you and give you a copy;</li>
          <li>correct anything that is wrong or out of date;</li>
          <li>delete it;</li>
          <li>stop using it &mdash; withdraw your consent.</li>
        </ul>
        <p>
          Email <a href={mailHref}>{SITE.email}</a> or call <a href={telHref}>{SITE.phone}</a> and we
          will act on it. If you are not satisfied with how we have handled your data, please raise it
          with us first; you may also complain to the Data Protection Board of India.
        </p>

        <h2 className="h2">Contact</h2>
        <p>
          {SITE.legalName} ({SITE.name})
          <br />
          {SITE.base} &mdash; serving {SITE.serving}
          <br />
          <a href={mailHref}>{SITE.email}</a> &middot; <a href={telHref}>{SITE.phone}</a>
        </p>

        <h2 className="h2">Changes</h2>
        <p>
          If we change what we collect or why, we will update this page and the &ldquo;last
          reviewed&rdquo; date at the top before the change takes effect.
        </p>
       </div>
      </main>

      <Footer />
    </>
  );
}
