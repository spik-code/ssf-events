# SSF Events — project log

What was built, why it is built that way, and what is still open. Written for
whoever picks this up next, including a future me.

- **Client:** Sri Sai Flora Enterprises, trading as SSF Events — wedding and
  event decor, Vadagur / Kembodi, Kolar, Karnataka
- **Live:** <https://ssf-events.vercel.app> · admin at `/admin`
- **Repo:** `spik-code/ssf-events` (private)
- **Started from:** the company's Instagram, <https://instagram.com/ssf_events>

---

## What it is

A one-page marketing site plus a small CRM. Enquiries land in a database and the
owner works them from a dashboard on the same domain. There is no page the owner
cannot edit without a developer.

| Layer | Choice | Why |
|---|---|---|
| App | Next.js 16, App Router, Turbopack | Server Components fetch content per request, revalidated every 5 min |
| Database | Supabase Postgres (`ydohhfpbmxwwjaalnpen`, Seoul / ap-northeast-2) | Row Level Security on every table |
| Images | ImageKit (`ik.imagekit.io/4pihrvfy8a`) | Automatic resizing and format; DB stores the path only |
| Video | `public/media` | 16 reel clips, ~133 MB, served statically |
| Auth | Supabase magic links | One owner account, no passwords to leak |
| Email | Resend | New-enquiry notification — **key not yet set** |
| Hosting | Vercel, auto-deploy from `main` | |

---

## Phase 1 — the public site

Built from the real Instagram content: 20 gallery photos and 16 reel clips, all
genuine SSF Events work, uploaded to ImageKit. Hand-written CSS, two themes
(cotton / candlelight), no UI framework.

Sections: scroll-expanding crest hero, gallery with category filters, seven
services, reel strip with a lightbox, reviews, about, enquiry form.

Decisions worth keeping:

- **No prices anywhere.** `services` is a capability list; every function is
  quoted individually.
- **Catering is a partner service.** Wording is "arranged and managed by us
  through caterers we work with regularly" — never implying an in-house kitchen.
- **Nothing invented.** No stock photos, no placeholder testimonials, no sample
  reviews. Every image is their work; every quote must be a real customer's words.
- **The hero is scroll-driven, not scroll-jacked.** The SSF crest starts as a
  small badge over the venue photograph and expands towards full-bleed as you
  scroll, the headline parting around it. The reference implementation for this
  effect swallows wheel and touch events and calls `window.scrollTo(0, 0)` on
  every scroll until the animation finishes, which would have broken the nav's
  `#` anchors, keyboard paging and find-in-page — on a site whose whole purpose
  is getting someone to the enquiry form. Ours is a section taller than the
  viewport with a sticky stage inside it, so progress is read from where the
  page already is. Nothing calls `preventDefault`; the page scrolls normally
  the entire time.

## Phase 2 — the admin

`/admin` on the same domain. Magic-link sign-in, single owner account.

**Three independent gates, all must pass:**

1. `proxy.ts` — redirects signed-out requests away from `/admin/*` before any
   page renders
2. `app/admin/(dash)/layout.tsx` — re-checks `isAdmin()` server-side and shows a
   refusal screen otherwise
3. Postgres RLS — every admin-only table is gated by `is_admin()`

**First-admin bootstrap without a back door:** an `admin_allowlist` table with
RLS on and *zero policies* (so only the service role can read it), plus a trigger
on `auth.users` INSERT that promotes a signup only if its email is on the list.
Anyone else can request a link, sign in, and reach nothing.

Pages: Leads inbox (filters, WhatsApp/call/email, status pipeline), Gallery
(ImageKit upload, inline editing, publish/feature/delete), Content (site text,
contact details, services), Reviews (publish/hold, add a direct quote), Bookings.

Every server action begins with `requireAdmin()` — a Server Action is a public
HTTP endpoint, and rendering inside a protected layout does not protect it.

## Phase 3 — privacy, deployment, and the long tail of real-world bugs

See the timeline below.

---

## Bugs found and fixed

These are the ones worth remembering — most were silent.

**`is_admin()` was revoked from `authenticated`, killing the whole dashboard.**
An earlier "hardening" migration revoked EXECUTE on the mistaken belief that RLS
policy expressions run as the table owner. They run as the *querying role*. Every
admin policy calls `is_admin()`, so a real signed-in admin got
`permission denied for function is_admin` on every table. Fixed by granting
EXECUTE back, then rebuilding `is_admin()` as SECURITY INVOKER with a
non-recursive `admin_users` self-read policy — which also cleared the advisor
warning the first fix raised.

**Half the Content editor did nothing.** `contact_phone`, `whatsapp_number`,
`contact_email` and `instagram_url` wrote to `site_settings`, but every page
rendered the env-backed `SITE` constants. Editing them changed nothing. Fixed
with `lib/contact.ts`, which resolves settings-first and falls back to env.

**The stored contact values were unusable.** `contact_phone` and
`whatsapp_number` were both bare `9353568207` — no country code, so the wa.me
link would have gone nowhere once the site started reading them. Repaired by
migration; the resolver also normalises a 10-digit number as a safety net.

**"Call or WhatsApp" had no WhatsApp link.** The row carried only a `tel:` link;
the sole `wa.me` link on the site fired after a form submit. Someone who just
wanted to message had no way to. Each row now offers the routes it names, plus a
Gmail fallback for `mailto:` (which silently does nothing without a mail client),
plus a floating WhatsApp button.

**Vercel silently blocked every deployment for a day.** `git init` set the commit
email to an address not attached to the GitHub account, and Vercel refuses to
build commits it cannot attribute. Production kept serving the last good build,
so the site looked healthy while seven pushes never shipped. Fixed by committing
as the account's own address. Related trap: Vercel's **Redeploy** button rebuilds
the *same commit* with current env vars — right after an env change, useless for
shipping code.

**Magic links landed on the homepage, then failed on the callback.** Two causes
in sequence. First, the production callback was not on Supabase's Redirect URL
allowlist, so Supabase discarded it and fell back to the Site URL. Second, once
that was fixed, Supabase's default template returns the session in the URL
*fragment*, which is never sent to the server — so the route handler saw an empty
query. Fixed with `/auth/confirm`, a client page that reads the fragment and
completes the sign-in, so it works on whichever email template the project has.

**Phones rendered the whole site zoomed out.** The enquiry form was a fixed
two-column grid with no mobile breakpoint, and its columns could not shrink below
~485px. Nothing visibly overflowed — mobile browsers respond by scaling the
entire page down, so all text was ~25% smaller than intended on a 390px phone.
Fixed with a single-column breakpoint and `min-width:0` on the fields.

**The reviews sync could never have worked.** It only spoke to the legacy Places
API, which Google stopped letting new Cloud projects enable in 2025. It also
swallowed Google's status and returned a flat "could not find a place". Rewritten
against Places API (New) with the legacy path as fallback, and failures now
report exactly what Google said.

**Checkboxes rendered a red X when ticked.** Two CSS gradients formed an X rather
than a checkmark — the opposite of "selected". Replaced with an SVG tick.

**An empty toast pill sat at the bottom of every page.** The enquiry-form toast
parks itself off-screen with `translate(-50%, 150%)`, but 150% of its own 26px
height is 39px — 13px short of clearing its `bottom: 26px` offset. A small dark
empty rounded box was visible under the fold on every page, in both themes,
from the first deploy. It now parks a full height plus its own offset.

**No favicon** — a 404 on every page load.

---

## Privacy — DPDP Act 2023

- `/privacy` — plain-English notice: what the form collects, why, who sees it
  (us, Supabase, Resend, and a catering partner when catering is requested), how
  long it is kept, and how to ask for a copy, correction or deletion.
- The enquiry form has a **required consent checkbox**. The API rejects any
  submission without it and stores `consent_given` plus the `privacy_version`
  the person saw.
- **No IP addresses, no analytics, no tracking cookies.** Only what the customer
  typed. Keep it that way.
- Data sits in Seoul (`ap-northeast-2`); the privacy page names the region.

---

## Verified, not assumed

Security, by role:

| | anon | signed-in non-admin | admin |
|---|---|---|---|
| Read `inquiries` / `bookings` / `admin_users` | `[]` | `[]` | full |
| `UPDATE gallery_items` | 0 rows | 0 rows | works |
| `INSERT reviews` | blocked | violates RLS | works |
| `INSERT admin_users` (self-promote) | blocked | violates RLS | — |
| `/api/imagekit/auth` | 401 | 401 | 200 + signature |
| `/admin/*` | redirect | "Not an admin" | dashboard |

Also verified end-to-end on production: gallery upload (browser → signed ImageKit
upload → DB row) and delete (DB row *and* the ImageKit file); magic-link sign-in;
session persists across a browser restart; enquiry API rejects missing consent;
layout width equals viewport width on iPhone 13, Pixel 5 and iPhone SE.

Supabase advisors: 2 remaining, both expected — `admin_allowlist` has RLS with no
policies (deliberate), and leaked-password protection is off (irrelevant while
there are no passwords).

---

## Commit timeline

| | Commit | |
|---|---|---|
| 1 | `e7c6b80` | Initial commit — the whole site |
| 2 | `9e4d18d` | Deploy guide, Node 22 pin, data region |
| 3 | `46e5553` | CLI deploy path |
| 4 | `34dbd41` | `.gitattributes`, LF endings |
| 5 | `bd756dd` | Auth callback accepts `token_hash` |
| 6 | `d948456` | `admin-magic-link.mjs` — sign-in without email |
| 7 | `6c4b850` | Callback tolerates a missing `type` |
| 8 | `e8df5ac` | Contact fields actually change the site; favicon |
| 9 | `e801405` | Working WhatsApp and email links |
| 10 | `4ba6a2a` | Commit email Vercel can attribute |
| 11 | `c49ef98` | Commit as the GitHub account address |
| 12 | `66d3455` | Complete sign-in from the URL fragment |
| 13 | `0d09713` | Stop phones zooming the site out |
| 14 | `a27ec21` | Reviews sync on Places API (New) |
| 15 | | Scroll-expanding crest hero; empty toast pill |

---

## Still open

**Needs the owner:**

- **Rotate the Supabase service-role key.** Two service-role credentials were
  pasted into a chat transcript; both still work. Rotate in Settings → API Keys,
  then update `.env.local` and Vercel.
- **`RESEND_API_KEY`** — until it is set, a new enquiry sends no email. The
  enquiry still saves, and the customer is also handed to WhatsApp, so nothing is
  lost, but the owner has to check the dashboard.
- **Add `http://localhost:3000/**` back** to Supabase Redirect URLs — it was
  replaced rather than joined, so the login form no longer works in local dev
  (production is fine, and `admin-magic-link.mjs` works regardless).
- **Google reviews** need a billing account on the Google Cloud project. Google
  refuses Places requests without one. For a handful of reviews, adding them by
  hand in `/admin/reviews` is the proportionate answer.

**Worth doing:**

- Move the 133 MB of reel video to ImageKit video delivery. It is 96% of the
  repository. **Not** Git LFS — GitHub's free LFS bandwidth is 1 GB/month and
  Vercel refetches on cold builds, which would turn working deploys into metered
  ones.
- Password login for the admin instead of magic links — discussed, not built.
  Keep magic link as a fallback.
- Booking-conversion UI on a won lead (`convertToBooking` exists, no button).
- Move the enquiry rate limiter off in-memory state (it resets per serverless
  instance) if spam appears.
- A daily cron on `/api/reviews/sync`, once billing is sorted.

---

## Gotchas for whoever is next

- **Vercel "Redeploy" reuses the same commit.** To ship code, push.
- **Commit email must match a GitHub account** with project access, or Vercel
  blocks the build and says nothing on the site.
- **RLS policy expressions run as the caller**, not the table owner. Revoking
  EXECUTE on a function a policy calls breaks that policy.
- **Supabase silently falls back to Site URL** when a redirect target is not
  allowlisted — it does not error.
- **`app/icon.svg` is served at `/icon.svg`**, not `/icon`.
- **Grid and flex items default to `min-width:auto`**, so a wide control stops the
  whole page shrinking on mobile — and browsers zoom out rather than overflow.
- **`next/image` with `fill` needs a positioned parent, or it escapes.** The
  reduced-motion branch of the hero originally dropped the stage and the crest
  card to `position: static`; both of their `fill` images then resolved against
  the section instead and covered the copy below it. Only visitors who ask for
  less motion would ever have seen it. If you switch a positioned box to
  `static`, check what was absolutely positioned inside it.
- **A sticky element's `top` still applies when you make it `relative`.** Turning
  off `position: sticky` is two properties, not one — leave `top` set and the
  box is offset by that much in normal flow.
