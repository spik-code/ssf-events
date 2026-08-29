import Image from "next/image";
import { Header } from "@/components/Header";
import { Gallery } from "@/components/Gallery";
import { Reel } from "@/components/Reel";
import { EnquiryForm } from "@/components/EnquiryForm";
import { Reviews } from "@/components/Reviews";
import { Footer } from "@/components/Footer";
import {
  PhoneIcon,
  ChatIcon,
  InstagramIcon,
  PinIcon,
  MailIcon,
  ListIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { getGallery, getServices, getSettings, getReviews, averageRating } from "@/lib/queries";
import { REEL } from "@/lib/content";
import { SITE } from "@/lib/site";
import { resolveContact } from "@/lib/contact";

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

  // The headline reads "Life is an event. Make it memorable." — the second
  // sentence is set in the accent script face.
  const [headLead, ...headRest] = settings.hero_headline.split(". ");
  const headTail = headRest.join(". ");

  return (
    <>
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
        <section className="hero">
          <div className="hero-media" aria-hidden="true">
            <Image
              src={settings.hero_image_url}
              alt=""
              fill
              priority
              sizes="100vw"
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className="wrap hero-in">
            <p className="eyebrow">
              <span className="tick" /> Wedding &amp; event decor &nbsp;·&nbsp; Kolar &amp;
              Bengaluru, Karnataka
            </p>
            <h1 className="h1">
              {headLead}. <em className="script">{headTail}</em>
            </h1>
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
          </div>
        </section>

        {/* ── PLACES MARQUEE ───────────────────────────────────── */}
        <div className="strip" aria-hidden="true">
          <div className="strip-in">
            <span>{PLACES}</span>
            <span>{PLACES}</span>
          </div>
        </div>

        {/* ── THE WORK ─────────────────────────────────────────── */}
        <section id="work" className="band wrap">
          <header className="band-head reveal in">
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
          <header className="band-head reveal in">
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
          <div className="svc reveal in">
            {services.map((s, i) => (
              <div className="svc-item" key={s.id}>
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="h3">{s.name}</h3>
                <p>{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── REEL ─────────────────────────────────────────────── */}
        <section id="reel" className="band wrap">
          <header className="band-head reveal in">
            <p className="eyebrow">
              <span className="tick" /> On camera
            </p>
            <h2 className="h2">Walk-throughs from the floor</h2>
            <p className="note">
              Short clips from our Instagram &mdash; tap any one to play. Sound is on the original
              reels.
            </p>
          </header>
          <Reel clips={REEL} />
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
            <div className="badge reveal in">
              <Image
                src="/ssf/brand/logo.webp"
                alt={`${SITE.name} — ${SITE.legalName} crest`}
                width={600}
                height={380}
                sizes="(max-width: 760px) 90vw, 300px"
                style={{ width: "100%", height: "auto" }}
              />
            </div>
            <div className="reveal in">
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
          <header className="band-head reveal in">
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

            <div className="rows reveal in">
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

      {/* Always-reachable WhatsApp. Most enquiries here arrive by WhatsApp, and
          a customer halfway down the gallery shouldn't have to find the form. */}
      <a
        className="wa-fab"
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Message ${SITE.name} on WhatsApp`}
        title="Message us on WhatsApp"
      >
        <WhatsAppIcon />
      </a>
    </>
  );
}
