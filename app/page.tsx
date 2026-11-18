import type { CSSProperties } from "react";
import Image from "next/image";
import { Header } from "@/components/Header";
import { ScrollExpandHero } from "@/components/ScrollExpandHero";
import { Gallery } from "@/components/Gallery";
import { EnquiryForm } from "@/components/EnquiryForm";
import { Reviews } from "@/components/Reviews";
import { Footer } from "@/components/Footer";
import { PointerGlow } from "@/components/PointerGlow";
import { IraGuide } from "@/components/IraGuide";
import {
  PhoneIcon,
  ChatIcon,
  InstagramIcon,
  PinIcon,
  MailIcon,
  ListIcon,
  WhatsAppIcon,
} from "@/components/icons";
import {
  getGallery,
  getServices,
  getSettings,
  getReviews,
  averageRating,
} from "@/lib/queries";
import { SITE, SITE_URL } from "@/lib/site";
import { resolveContact } from "@/lib/contact";
import { CountUp } from "@/components/CountUp";
import type { GalleryItem } from "@/lib/types";

export const revalidate = 300;

const TAGS = [
  "Stage & backdrop",
  "Mandap",
  "Reception",
  "Haldi",
  "Baby shower",
  "Birthday",
  "Theme decor",
  "DJ & lighting",
  "Catering",
];

// Services carry no photo of their own, so each borrows the first unused
// gallery photo that fits its name; one that fits nothing stays text-only.
// shortcut: keyword match on the service name — add an image column to
// `services` when the admin needs to choose the photo.
const SERVICE_PHOTO: [RegExp, (g: GalleryItem) => boolean][] = [
  [/mandap|pooja|tradition/i, (g) => g.category === "mandap"],
  [/reception|entrance/i, (g) => g.category === "reception"],
  [/haldi/i, (g) => g.category === "haldi"],
  [/baby|birthday|naming/i, (g) => g.category === "celebration"],
  [/light|dj|theme/i, (g) => /led|light/i.test(g.caption ?? "")],
  [/wedding|stage/i, (g) => g.category === "wedding"],
];

// How a booking runs, drawn from what the Services, About and Enquire copy
// already promise.
const STEPS: [title: string, text: string][] = [
  [
    "Tell us about the function",
    "Send the date, the hall, a rough guest count and a couple of reference photos — by the form, a call or WhatsApp.",
  ],
  ["We quote for your hall", "A quote built for exactly what that date and that venue need."],
  [
    "The design is settled",
    "Stage, flowers, drapes, lighting and sound are agreed with one point of contact, so nothing falls between vendors.",
  ],
  [
    "Built that morning, struck that night",
    "The people who designed your stage build it on the day and take it down after the function.",
  ],
];

const PLACES = "Kolar  ·  Bengaluru  ·  Bangarpet  ·  Avani  ·  Tumkur  ·  across Karnataka";

export default async function Home() {
  const [gallery, services, settings, reviews] = await Promise.all([
    getGallery(),
    getServices(),
    getSettings(),
    getReviews(),
  ]);

  // Contact details come from site_settings when the admin has set them,
  // falling back to the env-backed SITE constants.
  const contact = resolveContact(settings);

  const waHref = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    `Hi ${SITE.name}, I'd like a quote for my function.`,
  )}`;
  // Gmail's compose URL, for people with no desktop mail client behind mailto:.
  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    contact.email,
  )}&su=${encodeURIComponent(`Enquiry for ${SITE.name}`)}`;

  // LocalBusiness structured data, so Google can tie the site to the Maps
  // listing. Address and Maps link come from the same site_settings rows.
  const address = typeof settings.google_address === "string" ? settings.google_address : "";
  const ikEndpoint = (
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/4pihrvfy8a"
  ).replace(/\/$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE.name,
    alternateName: SITE.legalName,
    description:
      "Since 1999, stage, mandap and celebration decor for 5,000+ weddings, plus receptions, engagements, haldi, baby showers and birthdays.",
    foundingDate: "1999",
    url: SITE_URL,
    telephone: contact.phone,
    email: contact.email,
    image: `${ikEndpoint}/ssf/brand/logo-v2.webp`,
    ...(address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: address,
        addressLocality: "Kolar",
        addressRegion: "Karnataka",
        postalCode: address.match(/\b\d{6}\b/)?.[0],
        addressCountry: "IN",
      },
    }),
    areaServed: ["Kolar", "Bengaluru", "Bangarpet", "Avani", "Tumkur", "Karnataka"],
    ...(settings.google_maps_url && { hasMap: settings.google_maps_url }),
    sameAs: [contact.instagram, settings.google_maps_url].filter(Boolean),
  };

  // The headline reads "Life is an event. Make it memorable." — the second
  // sentence is set in the accent script face.
  const [headLead, ...headRest] = settings.hero_headline.split(". ");
  const headTail = headRest.join(". ");

  const rating = averageRating(reviews);
  const stats: { to: number; decimals?: number; suffix?: string; label: string }[] = [
    { to: new Date().getFullYear() - 1999, label: "Years decorating, since 1999" },
    { to: 5000, suffix: "+", label: "Weddings decorated" },
    { to: services.length, label: "Services from one team" },
    ...(rating
      ? [{ to: rating, decimals: 1, suffix: "★", label: `Average of ${reviews.length} reviews` }]
      : []),
  ];

  const usedPhotos = new Set<string>();
  const servicePhotos = services.map((s) => {
    const fits = SERVICE_PHOTO.find(([re]) => re.test(s.name))?.[1];
    const photo =
      fits &&
      gallery.find(
        (g) => fits(g) && !usedPhotos.has(g.id) && g.imagekit_url !== settings.hero_image_url,
      );
    if (photo) usedPhotos.add(photo.id);
    return photo;
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <a className="skip" href="#main">
        Skip to content
      </a>

      <Header
        showReviews={reviews.length > 0 || Boolean(settings.google_reviews_url)}
        phone={contact.phone}
        telHref={contact.telHref}
      />

      <main id="main">
        <span id="top" />

        {/* ── HERO ─────────────────────────────────────────────── */}
        {/* Scroll-driven: the crest expands out of the photograph while the
            headline parts around it. Everything below is the copy it hands
            over to. */}
        <ScrollExpandHero
          bgSrc={settings.hero_image_url}
          videoSrc={settings.hero_video_url}
          eyebrow={
            <>
              <span className="tick" /> Since 1999 &nbsp;·&nbsp; 5,000+ weddings &nbsp;·&nbsp;
              Kolar &amp; Bengaluru
            </>
          }
          headLead={headLead}
          headTail={headTail}
        >
          <p className="lede">{settings.hero_subcopy}</p>
          <div className="hero-cta">
            <a className="btn btn-primary" href="#enquire">
              <ChatIcon />
              Plan your event
            </a>
            <a className="btn btn-ghost" href="#work">
              See recent setups
            </a>
          </div>
          <ul className="hero-tags">
            {TAGS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </ScrollExpandHero>

        {/* ── PLACES MARQUEE ───────────────────────────────────── */}
        <div className="strip" aria-hidden="true">
          <div className="strip-in">
            <span>{PLACES}</span>
            <span>{PLACES}</span>
          </div>
        </div>

        {/* ── NUMBERS ──────────────────────────────────────────── */}
        <section className="stats wrap reveal stagger" aria-label={`${SITE.name} in numbers`}>
          {stats.map((s, i) => (
            <div className="stat" key={s.label} style={{ "--i": i } as CSSProperties}>
              <b>
                <CountUp to={s.to} decimals={s.decimals} />
                {s.suffix}
              </b>
              <p className="note">{s.label}</p>
            </div>
          ))}
        </section>

        {/* ── THE WORK ─────────────────────────────────────────── */}
        <section id="work" className="band wrap">
          <header className="band-head reveal">
            <p className="eyebrow">
              <span className="tick" /> The work
            </p>
            <h2 className="h2">Setups from the last two seasons</h2>
            <p className="note">
              Every photo here is a real SSF Events setup. Filter by the kind of function.
            </p>
          </header>
          <Gallery items={gallery} />
        </section>

        {/* ── SERVICES ─────────────────────────────────────────── */}
        <section id="services" className="band wrap">
          <header className="band-head reveal">
            <p className="eyebrow">
              <span className="tick" /> What we do
            </p>
            <h2 className="h2">One team, whole function</h2>
            <p className="note">
              Decor end to end &mdash; design, flowers, structure, lighting and on-the-day setup
              &mdash; plus catering arranged through caterers we work with regularly. Tell us the
              date and the hall; we quote for exactly what that function needs.
            </p>
          </header>
          <div className="svc reveal stagger">
            {services.map((s, i) => (
              <div className="svc-item" key={s.id} style={{ "--i": i } as CSSProperties}>
                {servicePhotos[i] && (
                  <div className="svc-photo">
                    <Image
                      src={servicePhotos[i].imagekit_url}
                      alt={servicePhotos[i].alt || servicePhotos[i].caption || ""}
                      fill
                      sizes="(max-width: 520px) 100vw, (max-width: 860px) 50vw, 33vw"
                    />
                  </div>
                )}
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="h3">{s.name}</h3>
                <p>{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────── */}
        {/* The rail down the steps fills in as the list scrolls through. */}
        <section id="how" className="band wrap">
          <div className="how">
            <header className="band-head reveal">
              <p className="eyebrow">
                <span className="tick" /> How it works
              </p>
              <h2 className="h2">From first call to the last flower</h2>
              <p className="note">Four steps, one team, one point of contact throughout.</p>
            </header>
            <ol className="steps reveal stagger">
              {STEPS.map(([title, text], i) => (
                <li className="step" key={title} style={{ "--i": i } as CSSProperties}>
                  <span className="n">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="h3">{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── REVIEWS ──────────────────────────────────────────── */}
        {/* Renders nothing until real reviews exist. */}
        <Reviews
          reviews={reviews}
          average={averageRating(reviews)}
          reviewsUrl={settings.google_reviews_url}
          mapsUrl={settings.google_maps_url}
        />

        {/* ── ABOUT ────────────────────────────────────────────── */}
        <section id="about" className="band wrap">
          <div className="about">
            <div className="badge reveal">
              <Image
                src="/brand/logo-new.webp"
                alt={`${SITE.name} — ${SITE.legalName} crest`}
                width={600}
                height={399}
                sizes="(max-width: 760px) 90vw, 300px"
                style={{ width: "100%", height: "auto" }}
              />
            </div>
            <div className="reveal">
              <p className="eyebrow" style={{ marginBottom: 16 }}>
                <span className="tick" /> The name
              </p>
              <h2 className="h2" style={{ marginBottom: 14 }}>
                {SITE.name} &mdash; {SITE.legalName}
              </h2>
              <p>
                {SITE.name} is the decor arm of <b>{SITE.legalName}</b>, working out of {SITE.base}{" "}
                and taking functions across the district and into {SITE.serving}.
              </p>
              <p style={{ marginTop: 14 }}>
                We have been decorating weddings <b>since 1999</b> &mdash; more than{" "}
                <b>5,000 weddings</b> so far, from small house functions to full hall decor.
              </p>
              <p style={{ marginTop: 14 }}>
                We are a hands-on team: the people who design your stage are the people who build it
                that morning and take it down that night. Flowers, structure, drapes, lighting and
                sound come from one point of contact, so nothing falls between vendors on the day.
              </p>
              <p className="sig">Life is an event &mdash; make it memorable.</p>
            </div>
          </div>
        </section>

        {/* ── ENQUIRE ──────────────────────────────────────────── */}
        <section id="enquire" className="band wrap">
          <header className="band-head reveal">
            <p className="eyebrow">
              <span className="tick" /> Enquire
            </p>
            <h2 className="h2">Tell us about the function</h2>
            <p className="note">
              Send the details and we&rsquo;ll come back with a quote built for your date and hall
              &mdash; or call us directly.
            </p>
          </header>
          <div className="contact">
            <EnquiryForm whatsapp={contact.whatsapp} />

            <div className="rows reveal">
              <div className="crow">
                <span className="ic">
                  <PhoneIcon />
                </span>
                <div>
                  <div className="k">Call or WhatsApp</div>
                  <a className="v" href={contact.telHref}>
                    {contact.phone}
                  </a>
                  {/* A tel: link only dials — it never opens WhatsApp — so the
                      WhatsApp handoff needs its own wa.me link. */}
                  <div className="crow-acts">
                    <a className="cact" href={contact.telHref}>
                      <PhoneIcon />
                      Call
                    </a>
                    <a
                      className="cact is-wa"
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <WhatsAppIcon />
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
              <div className="crow">
                <span className="ic">
                  <MailIcon />
                </span>
                <div>
                  <div className="k">Email</div>
                  <a className="v" href={contact.mailHref}>
                    {contact.email}
                  </a>
                  {/* mailto: does nothing on a device with no mail app set up,
                      so offer Gmail's compose window as a second route. */}
                  <div className="crow-acts">
                    <a className="cact" href={contact.mailHref}>
                      <MailIcon />
                      Mail app
                    </a>
                    <a className="cact" href={gmailHref} target="_blank" rel="noopener noreferrer">
                      <MailIcon />
                      Gmail
                    </a>
                  </div>
                </div>
              </div>
              <div className="crow">
                <span className="ic">
                  <InstagramIcon />
                </span>
                <div>
                  <div className="k">Instagram</div>
                  <a className="v" href={contact.instagram} target="_blank" rel="noopener noreferrer">
                    @ssf_events
                  </a>
                </div>
              </div>
              <div className="crow">
                <span className="ic">
                  <PinIcon />
                </span>
                <div>
                  <div className="k">Based in</div>
                  <div className="v">
                    {SITE.base} &mdash; serving {SITE.serving}
                  </div>
                </div>
              </div>
              <div className="crow">
                <span className="ic">
                  <ListIcon />
                </span>
                <div>
                  <div className="k">Good to have ready</div>
                  <div className="v">
                    Date, venue, guest count and a couple of reference photos.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer home />
      <PointerGlow />

      {/* Ira, the lotus mascot: section guide and guided chat. She also carries
          the always-reachable WhatsApp link (most enquiries arrive by WhatsApp,
          and a customer halfway down the gallery shouldn't have to find the form). */}
      <IraGuide
        showReviews={reviews.length > 0 || Boolean(settings.google_reviews_url)}
        whatsapp={contact.whatsapp}
        waHref={waHref}
      />
    </>
  );
}
