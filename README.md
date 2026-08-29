# SSF Events — Sri Sai Flora Enterprises

Wedding &amp; event decor, Kolar &amp; Bengaluru. Next.js 16 + Supabase + ImageKit.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Stack

| Layer | Choice | Notes |
|---|---|---|
| App | Next.js 16 (App Router) | Server Components fetch content at request time, revalidated every 5 min |
| Database | Supabase Postgres | Row Level Security on every table |
| Images | ImageKit | All gallery/brand imagery; global `next/image` loader |
| Video | `/public/media` | Reels served locally in Phase 1 |
| Email | Resend | New-enquiry notification |

## How images work

Gallery images live in ImageKit under `/ssf/gallery/`, the crest under `/ssf/brand/`.
The database stores only the **path** (`/ssf/gallery/22_C3mwzlILf0Q.webp`) — never a
full URL. `lib/imagekit-loader.ts` is wired in as `images.loaderFile`, so every
`<Image>` automatically becomes an ImageKit delivery URL with `w-<width>,q-72,f-auto`.
Next generates a full responsive srcset from it.

Local paths (`/media/…`, `/brand/…`) pass through the loader untouched and are
served by Next, so the reel videos keep working.

To add a new gallery image: upload it to `/ssf/gallery/` in ImageKit, then insert a
row into `gallery_items` with that path. Nothing else needs to change.

## Environment

Copy `.env.example` to `.env.local`. Four secrets are still `REPLACE_ME`, each
unlocking one feature — nothing else breaks while they are unset:

| Key | Where | Unlocks |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | server-side writes that need to bypass RLS (currently only a fallback; the dashboard works without it via the admin's own session) |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit → Developer → API Keys | signed uploads — `/api/imagekit/auth`, so **Gallery → Upload photos** in the admin |
| `RESEND_API_KEY` | Resend → API Keys | the email that notifies you of a new enquiry (the enquiry still saves without it) |
| `GOOGLE_PLACES_API_KEY` | console.cloud.google.com → enable *Places API* | automatic Google review pulling (dormant by design until set) |

The public site and the admin dashboard both run with none of them set. Signing in
needs only the Supabase URL + anon key, which are already filled.

## Database

Migrations are in `supabase/migrations/`, already applied to the linked project.

| Table | Public access | Admin access |
|---|---|---|
| `gallery_items` | SELECT where `is_published` | full |
| `reviews` | SELECT where `is_published` | full |
| `testimonials` | SELECT where `is_published` | full |
| `services` | SELECT where `is_active` | full |
| `site_settings` | SELECT all (display content only) | full |
| `inquiries` | **INSERT only** — no reads | SELECT / UPDATE / DELETE |
| `bookings` | none | full |
| `admin_users` | none | SELECT (own row) |
| `admin_allowlist` | none | none (service-role only) |

`inquiries` carries `consent_given` (boolean, `NOT NULL DEFAULT false`) and
`privacy_version` (text) — see **Privacy & consent** below. The API refuses to
insert a row with `consent_given = false`.

"Admin" means a row in `admin_users` keyed to an `auth.users` id, checked by
`public.is_admin()` (a `STABLE SECURITY INVOKER` function; `authenticated` may
execute it, `anon` may not). `admin_users` itself lets a signed-in user read only
their own row, so the check never recurses.

There are no price columns anywhere. `services` is a capability list; every
function is quoted individually off-site.

### Verified

- Public / `anon` role cannot read `inquiries`, `bookings`, or `admin_users` — returns `[]`
- A signed-in **non-admin** gets the same: `[]` from every admin-only table, no error
- A signed-in **admin** reads `inquiries`, `bookings`, `gallery_items`, `reviews`,
  `services`, `site_settings`, `testimonials` through RLS
- Public UPDATE/DELETE on `gallery_items` affects 0 rows (RLS filters them out)
- Supabase security advisors: 2 remaining, both expected —
  `admin_allowlist` has RLS on with **no policies** (deliberate: service-role-only),
  and leaked-password protection is off (irrelevant — this project is magic-link only,
  no passwords)

## Editing content

Everything on the page is database-driven. Sign in at `/admin` and use **Content**,
**Gallery** and **Reviews** — or edit the tables directly in the Supabase editor:

- **Hero copy / contact details** → `site_settings` (`hero_headline`, `hero_subcopy`, `contact_phone`, …)
- **Gallery** → `gallery_items` (`caption`, `location`, `category`, `order_index`, `is_published`, `featured`)
- **Services** → `services` (`name`, `description`, `order_index`, `is_active`)
- **Reviews / testimonials** → `reviews` — only add words a real customer actually said

Changes appear within 5 minutes (ISR revalidation).

## Google reviews

The Google Business Profile is **live**:

| | |
|---|---|
| Name | Ssf Events |
| Category | Florist |
| Address | Vadagur village, post, Kembodi, Kolar, Karnataka 563103 |
| CID | `1060250746598303987` |
| Review link | `https://g.page/r/CfOo1cNvxLYOEBI/review` |

Those are stored in `site_settings` (`google_reviews_url`, `google_maps_url`,
`google_cid`, `google_business_name`, `google_address`).

### The three states

The reviews section renders differently depending on what actually exists — and
never shows a placeholder review:

1. **Reviews exist** → rating average, review cards, "Leave us a review".
2. **Profile set up, no reviews yet** ← *current state.* A "Worked with us?"
   invitation with "Write a review" and "Find us on Maps". The decorative stars
   are deliberately **empty outlines**, so nothing reads as a rating that has not
   been earned.
3. **No profile, no reviews** → renders nothing.

### Turning on automatic review pulling

Only one thing is still missing: a Places API key.

1. Go to [console.cloud.google.com](https://console.cloud.google.com), enable the
   **Places API**, create an API key.
2. Put it in `GOOGLE_PLACES_API_KEY` in `.env.local`.
3. Call `POST /api/reviews/sync`, or wire it to a daily Vercel Cron.

The Place ID does **not** need to be looked up by hand — a `g.page` link only
yields a CID, so the sync route resolves the Place ID from the business name and
address on first run and caches it into `site_settings.google_place_id`.

Notes:
- Google returns at most **5 reviews** per place, refreshed each sync.
- Only **4- and 5-star** reviews auto-publish. Anything lower is stored with
  `is_published = false`, so a bad review is a conversation you choose to have,
  not a surprise on the homepage.
- `reviews.source` is `google` or `direct`. Direct quotes (a WhatsApp message a
  customer sent you) can be inserted by hand and render without the Google glyph.
- Set `CRON_SECRET` to require `Authorization: Bearer <secret>` on the sync route.

### Worth doing on the Google profile itself

The profile is currently missing information that directly affects whether people
find and contact you:

- **No phone number** — add +91 93535 68207
- **No website** — add the site URL once deployed
- **No opening hours**
- **No photos** — you have 24 good ones already in ImageKit
- **Category is "Florist"** — "Event planner" or "Wedding service" matches what you
  actually sell and is what people search for

## Catering

Catering is service **07**, arranged through partner caterers — the copy says
"arranged and managed by us through caterers we work with regularly" rather than
implying an in-house kitchen. Covers pure veg and non-veg menus, live counters and
evening snacks, serving staff, crockery and dining-area dressing.

The enquiry form has a "What do you need?" checkbox set (decor / catering /
DJ & lighting / everything) which lands in `inquiries.services_needed`, so leads
arrive already qualified. Values are clamped to that known set server-side.

## Enquiries

`POST /api/enquiry` validates and sanitises input, rate-limits to 5/hour per IP,
inserts into `inquiries` with `status = 'new'`, and (if Resend is configured)
emails the enquiry to `ENQUIRY_NOTIFICATION_EMAIL`. The form then opens a
pre-filled WhatsApp message to **+91 93535 68207** so the customer can add photos —
and so an enquiry still reaches you if the API is unreachable.

UTM parameters (`utm_source`, `gclid`) are captured into `referral_source`, clamped
to a known set, so paid-social traffic is attributable. Ticked service checkboxes
land in `services_needed`.

The rate limiter is an in-memory `Map` keyed by IP — it resets on every deploy /
cold start. That is deliberately enough to stop casual spam; move it to Upstash or
Redis if the form starts getting hammered.

### Privacy & consent (DPDP Act 2023)

- **`/privacy`** — a short, plain-English notice: what the form collects, why, who
  it is shared with (us, Supabase, Resend, and a catering partner if catering is
  requested), how long it is kept, and how to ask for a copy / correction /
  deletion. Linked from the footer and from the form.
- The enquiry form has a **required consent checkbox**. `POST /api/enquiry`
  rejects any submission where `consent !== true`, and stores `consent_given` plus
  the `privacy_version` string the person saw (`created_at` is the timestamp).
- We deliberately **do not** store IP addresses, run analytics, or set tracking
  cookies — "only what the customer typed". Keep it that way.
- `lib/legal.ts` holds `PRIVACY_VERSION`, `PRIVACY_UPDATED` and `DATA_REGION`.
  Bump `PRIVACY_VERSION` (to the date) whenever the notice's substance changes.
  Set `DATA_REGION` to your Supabase project's region (dashboard → Project
  Settings → General) and the privacy page will name it outright instead of
  saying "ask us".

### Enquiry email (Resend)

Optional — the enquiry always saves; only the notification email needs this.

1. Sign up at [resend.com](https://resend.com), create a key at **API Keys** (it
   starts `re_`).
2. `RESEND_API_KEY` = that key.
3. `ENQUIRY_NOTIFICATION_EMAIL` = the inbox that should receive enquiries
   (already set to `srisaifloraevent@gmail.com`).
4. `ENQUIRY_FROM_EMAIL` = the "from" address. `onboarding@resend.dev` works
   immediately for testing; for production, verify a domain in Resend and use an
   address on it (e.g. `hello@ssfevents.in`). The customer's email, if they gave
   one, is set as `Reply-To`.

## Admin dashboard

`/admin` on the same site. One owner account, magic-link login, no passwords.

### Getting in

1. Go to `/admin` (or `/admin/login`).
2. Enter **`srisaifloraevent@gmail.com`** and press *Send me a link*.
3. Open the email, click the link → it lands on `/auth/callback`, which exchanges
   the code for a session and drops you at the dashboard.

Only that address works. It sits in `admin_allowlist`; an `auth.users` INSERT
trigger (`promote_allowlisted_admin`) copies an allowlisted signup into
`admin_users`. Anyone else who requests a link still gets one, signs in, and hits
a *"Not an admin"* screen with nothing behind it. To add or change the owner
address, edit `admin_allowlist` in the Supabase editor (service-role only — it is
not reachable from the app).

### Three gates, all must pass

1. `proxy.ts` — redirects a signed-out request away from `/admin/*` before any page renders
2. `app/admin/(dash)/layout.tsx` — re-checks `isAdmin()` server-side, shows the refusal screen otherwise
3. Postgres RLS — every admin-only table is gated by `is_admin()`

### Sections

| Route | Does |
|---|---|
| `/admin` | **Leads** inbox — filter by status/source, expand a row for phone/date/needs, one-tap WhatsApp/Call/Email, move status `new → contacted → quoted → won/lost`, delete. Rows over 48h still `new` get a *needs reply* flag. |
| `/admin/gallery` | Upload photos straight to ImageKit (needs `IMAGEKIT_PRIVATE_KEY`), edit caption/location/category inline, toggle Live/Draft/Featured, delete (removes the ImageKit file too). New photos arrive as drafts. |
| `/admin/content` | Edit hero text and contact details, and the service list (add / rename / re-describe / hide / delete). |
| `/admin/reviews` | Hold or publish each review, delete, or add a quote a customer gave you directly. Nothing fabricated. |
| `/admin/bookings` | Confirmed bookings with the source enquiry; a same-day count warns of a clash. |

Server actions live next to each route in `actions.ts` and every one begins with
`requireAdmin()`.

## Later

- Move reel videos to ImageKit video delivery
- Booking-conversion UI on a won lead (the `convertToBooking` action exists; no button yet)
- Move the enquiry rate limiter off in-memory state (Upstash/Redis) if spam picks up
- Set `DATA_REGION` in `lib/legal.ts` once the Supabase project region is confirmed

## Layout

```
proxy.ts            request gate — session refresh + /admin redirect
app/                public routes, API handlers, globals.css
app/privacy/        the DPDP privacy notice
app/admin/          login page, auth callback, (dash)/ route group
app/admin/(dash)/   dashboard pages + their server actions, admin.css
components/          Header, Footer, Gallery, Reel, EnquiryForm, Reviews, icons
components/admin/    LoginForm, AdminNav, LeadsTable, GalleryManager, ContentEditor, ReviewsManager
lib/                Supabase clients (server / browser / ssr), queries, ImageKit helpers, seed content
lib/legal.ts        PRIVACY_VERSION, PRIVACY_UPDATED, DATA_REGION
lib/supabase/ssr.ts getUser(), isAdmin()
supabase/           SQL migrations (9, all applied to the linked project)
public/media/       reel videos + posters
prototype/          the original static HTML this was built from
```
