# Wedding Events Management — Backend Build Prompt

## Context
Build the full backend for a premium wedding events management company website. Frontend UI/design is already handled by an existing frontend skill — do NOT design pages from scratch, only wire backend logic into existing/expected components. Focus entirely on data layer, APIs, auth, integrations, and business logic.

## Positioning inputs (shaped the schema below)
Reviewed comparable companies (CM Event Design, The Velvet Desk, ABP OneStop Weddings, Agape Weddings). Takeaways that the data layer must support:
- **No packages, no public pricing.** Like CM Event Design, every celebration is quoted custom. The site sells *how the work is run*, not tiers. There is a `services` table for the capability list ("what a quote can include") but it carries names and descriptions only — never prices.
- **Proof over badges.** Competitors lean on award logos; this brand leads with hard operational numbers (weddings run, cities/countries covered, timeline variance, quote turnaround). These live in `site_settings` so staff can edit them without a deploy.
- **Portfolio with substance.** Gallery items need real context — venue, location, guest count, and a short "what we ran" caption — not just a category tag.
- **Destination is first-class.** Inquiries and gallery items carry a location; couples come from many cities and countries.
- **Paid-social traffic.** Acquisition is heavy on Instagram / Google Ads with UTM links, so inquiries capture a referral source.
- **Quote SLA is a promise.** Public confirmation says a written quote lands in 24–48 hours; `inquiries.quoted_at` tracks whether that was met.

## Tech Stack
- **Database/Auth/Storage**: Supabase (Postgres, Auth, Edge Functions, Row Level Security)
- **Image CDN**: ImageKit (all gallery/portfolio images served via ImageKit, not Supabase Storage directly)
- **Email/Notifications**: Resend (fallback: Supabase built-in SMTP)
- **Hosting**: Vercel
- **AI Video**: Ambient hero b-roll only (Runway Gen-4 / Google Veo 3 / Luma) — not part of backend scope. The hero video URL is stored as a `site_settings` row (`hero_video_url`), editable from the admin dashboard; keep an env fallback for first boot.

## Users
- Only **admin/staff** need authenticated accounts (via Supabase Auth). No client/vendor portals in this phase.
- Public site visitors interact only through public forms (no login).

## Database Schema (create as Supabase SQL migrations)

Design and generate migrations for:

1. **gallery_items** — id, imagekit_url, imagekit_file_id, category (enum: ceremony/reception/decor/couple/etc), event_id (nullable), venue (nullable), location (nullable — city/region), guest_count (int, nullable), caption (nullable — short "what we ran" line), order_index, featured (bool), is_published (bool, default false), created_at
2. **testimonials** — id, couple_names, quote, rating (1-5), event_date, location (nullable — e.g. "Udaipur"), image_url, is_published, created_at. Public attribution is built from `couple_names` + `location` + `event_date`.
3. **inquiries** (quotation requests) — id, name, email, phone, event_date, event_location (nullable — venue or city; supports destination weddings), guest_count, budget_range (nullable — optional on the form), event_type (enum: wedding/engagement/reception/other), message, referral_source (nullable — e.g. instagram/google/referral, may be derived from UTM params passed by the frontend), status (enum: new/contacted/quoted/won/lost), quoted_at (timestamptz, nullable — set when status first moves to `quoted`), created_at
4. **bookings** — id, inquiry_id (fk), confirmed_date, deposit_status (enum: pending/partial/paid), total_amount, notes, created_at
5. **services** — id, name, description, order_index, is_active (bool, default true), created_at. The capability list rendered as "what a quote can include" (e.g. Full planning, Design & styling, Vendor sourcing & contracts, Budget tracking, Run-of-show, Day-of team, Guest logistics, Travel & hospitality desk). **Names and descriptions only — no price columns.**
6. **site_settings** — key (text, primary key), value (jsonb), updated_at. Admin-editable singletons: `hero_video_url`, `hero_headline`, `hero_subcopy`, and `proof_metrics` (jsonb array of `{ label, value }` for the homepage stat strip — weddings run, cities, countries, average timeline variance, quote turnaround). Seed with sensible defaults in the migration.
7. Enable **Row Level Security** on all tables:
   - `gallery_items`, `testimonials`: public SELECT where `is_published` = true; admin-only INSERT/UPDATE/DELETE
   - `services`: public SELECT where `is_active` = true; admin-only INSERT/UPDATE/DELETE
   - `site_settings`: public SELECT (all rows are safe, non-secret display content); admin-only INSERT/UPDATE/DELETE
   - `inquiries`: public INSERT only (no read/update); admin-only SELECT/UPDATE
   - `bookings`: admin-only for all operations
- Add indexes on `status`, `quoted_at`, `event_date`, `category`, `location`, `order_index` where relevant.
- Add a `double_booking_check` — prevent two `bookings` from sharing the same `confirmed_date` (flag conflict, don't hard-block, since some events may run concurrently at different times).

## API / Backend Logic to Build

1. **Public "Request a Quotation" endpoint**
   - No packages/pricing tiers shown on site — all pricing is custom, handled via quote request only
   - Validate required fields (name, email, event_date, guest_count, event_type); `budget_range`, `phone`, `event_location` are optional
   - Accept an optional `referral_source` (frontend may pass it straight through or derive it from UTM params such as `utm_source` / `gclid`)
   - Rate-limit by IP (prevent spam — max 5 submissions/hour per IP)
   - Insert into `inquiries` with `status = 'new'`, `quoted_at = null`
   - Trigger email notification to admin inbox via Resend on new quotation request
   - Return success/error response frontend can handle (e.g. "Thanks — we'll send your quote within 24-48 hours")

2. **Public content endpoints** (read-only, no auth — feed the marketing pages)
   - GET published `gallery_items` (include venue, location, guest_count, caption, category, featured, order_index) with optional `?category=` filter
   - GET published `testimonials`
   - GET active `services` ordered by `order_index`
   - GET `site_settings` (hero copy, hero video URL, proof metrics) as a single keyed object
   - All must return `[]` / `{}` rather than null when empty

3. **Admin authentication**
   - Supabase Auth email/password login for admin/staff
   - Protect all `/admin/*` API routes with session check
   - Simple role check (single admin role is fine for MVP)

4. **Admin dashboard data endpoints**
   - GET leads list (quotation requests) with filter by status and by `referral_source`, sort by date
   - PATCH inquiry status (new → contacted → quoted → won/lost); when it first moves to `quoted`, stamp `quoted_at = now()` so the 24–48h SLA is measurable
   - GET/POST/PATCH/DELETE gallery items including venue, location, guest_count, caption, publish toggle (with ImageKit upload handling — generate signed upload URL or use ImageKit server SDK)
   - GET/POST/PATCH testimonials (with publish toggle; includes `location`)
   - GET/POST/PATCH/DELETE services (name, description, order_index, is_active) — reorderable capability list
   - GET/PATCH site_settings (hero copy, `hero_video_url`, `proof_metrics`)
   - POST booking (convert inquiry → booking, set deposit status and final quoted amount)
   - GET bookings calendar data (for double-booking visibility)

5. **ImageKit integration**
   - Server-side auth params endpoint for secure client uploads
   - Helper to delete files from ImageKit when gallery item is removed
   - Store `imagekit_file_id` alongside URL for cleanup

6. **Email notifications**
   - New inquiry → admin
   - Optional: status change confirmation templates (can be stubbed for later)

## Error Handling & Edge Cases
- Graceful validation errors on all public-facing endpoints (never leak internal errors to public)
- Empty states handled at data layer (return `[]` not null) — the homepage still renders with zero gallery items, testimonials, or services
- Sanitize all public form inputs before DB insert; clamp `referral_source` to a short known-value set or a length limit
- Audit RLS policies so public role truly cannot read `inquiries`, `bookings`, unpublished `gallery_items`/`testimonials`, or inactive `services`

## Deliverables
- Supabase SQL migration files, ready to run (including `services` and `site_settings` with seeded defaults)
- All API routes/Edge Functions with clear naming
- `.env.example` listing required environment variables (Supabase URL/keys, ImageKit keys, Resend key, `HERO_VIDEO_URL` fallback)
- Short `ADMIN_GUIDE.md` explaining how to manage gallery items/testimonials/services, edit the homepage proof metrics and hero settings, and respond to quotation requests from the dashboard once built

## Constraints
- Do not build or restyle frontend pages/components — assume they exist or will be built separately by the frontend skill
- No packages, tiers, or prices anywhere in the schema or API — `services` is a capability list only, and all quoting happens off-site by staff
- Do not implement client or vendor portals — admin-only auth for this phase
- Keep everything modular so a client portal can be added later without schema rewrites
