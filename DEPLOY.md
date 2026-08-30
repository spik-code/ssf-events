# Deploying SSF Events

The repo is on GitHub at **`spik-code/ssf-events`** (private). Host is **Vercel**.

Two ways to set it up — pick one:

- **CLI** (below) — fastest, all from the terminal.
- **Dashboard** (from "## 1. Create the Vercel project") — clicks through the web
  UI; also wires up auto-deploy-on-push in one step.

Either way, once done, connecting the Git repo means every push to `main`
auto-deploys.

---

## CLI deploy

Run these from the project folder. In the Claude Code prompt, prefix each with
`! ` so the output shows up here.

```bash
# 1. Log in (opens a browser / emails a code) — one time per machine
npx vercel login

# 2. Link this folder to a Vercel project
#    Answer: set up "spik-code/ssf-events"? yes · scope: your account ·
#    link to existing? no · project name: ssf-events · directory: ./
npx vercel link

# 3. Push all non-secret env vars from .env.local
bash deploy/set-vercel-env.sh

# 4. Add the secrets by hand (paste each value when prompted)
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production   # Supabase → Settings → API → service_role
npx vercel env add RESEND_API_KEY production              # resend.com → API Keys (optional)

# 5. Deploy to production — prints the live https://ssf-events-*.vercel.app URL
npx vercel --prod
```

Then do **step 4 below** ("Point auth at the real URL") with that URL, and
**step 5** ("First admin login").

To get auto-deploy on every `git push`: Vercel dashboard → the project →
**Settings → Git → Connect Git Repository** → `spik-code/ssf-events`.

The env-var table in the next section applies to both paths — it's what
`deploy/set-vercel-env.sh` reads from `.env.local`, plus the secrets you add in
step 4.

---

## 1. Create the Vercel project

1. Sign in at <https://vercel.com> with the **same GitHub account** that owns the
   repo (`spik-code`), or an account that has access to it.
2. **Add New… → Project** → find `spik-code/ssf-events` → **Import**.
   - If the repo doesn't show up, click *Adjust GitHub App Permissions* and grant
     Vercel access to it.
3. Framework preset: **Next.js** (auto-detected). Leave build command, output
   directory and install command on their defaults.
4. **Do not click Deploy yet** — add the environment variables first (next step),
   otherwise the first build bakes in wrong values.

---

## 2. Environment variables

In the import screen (or later under **Project → Settings → Environment
Variables**), add every row below for the **Production** environment (and
Preview, if you want preview branches to work too).

Copy the values from your local `.env.local` unless noted otherwise.

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | from `.env.local` | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from `.env.local` | public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | from `.env.local` | public |
| `SUPABASE_SERVICE_ROLE_KEY` | **Supabase → Project Settings → API → `service_role` secret** | secret. Still `REPLACE_ME` locally — paste the real one here. |
| `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` | from `.env.local` | public |
| `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` | from `.env.local` | public |
| `IMAGEKIT_PRIVATE_KEY` | from `.env.local` (already set) | secret — needed for admin photo upload |
| `RESEND_API_KEY` | **resend.com → API Keys** (starts `re_`) | secret. Optional: without it, enquiries still save, the notification email is skipped. |
| `ENQUIRY_NOTIFICATION_EMAIL` | `srisaifloraevent@gmail.com` | where new enquiries land |
| `ENQUIRY_FROM_EMAIL` | `onboarding@resend.dev` for now | swap to an address on a Resend-verified domain for production |
| `NEXT_PUBLIC_SITE_URL` | see step 4 | set to the real URL **after** the first deploy, then redeploy |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `919353568207` | |
| `NEXT_PUBLIC_CONTACT_PHONE` | `+91 93535 68207` | |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `srisaifloraevent@gmail.com` | |
| `NEXT_PUBLIC_INSTAGRAM_URL` | `https://www.instagram.com/ssf_events/` | |
| `GOOGLE_PLACES_API_KEY` | leave unset for now | only needed for automatic Google-review pulling |
| `CRON_SECRET` | leave unset for now | only needed if you wire a cron to `/api/reviews/sync` |

For `NEXT_PUBLIC_SITE_URL` on the very first deploy, just use
`http://localhost:3000` as a placeholder — it only affects Open Graph / canonical
tags, not login. Fix it in step 4.

---

## 3. Deploy

Click **Deploy**. First build takes ~2–3 minutes. When it's done Vercel gives you
a URL like `https://ssf-events-xxxx.vercel.app`.

Open it and check:
- Home page loads, gallery images render (served from ImageKit).
- `/privacy` loads.
- `/admin` redirects to `/admin/login`.

---

## 4. Point auth at the real URL

Two places need the deployed URL (use the `*.vercel.app` one for now, your
custom domain later):

**a. Vercel** — Settings → Environment Variables → edit `NEXT_PUBLIC_SITE_URL`
to `https://<your-vercel-url>` → then **Deployments → ⋯ → Redeploy** so it takes
effect.

**b. Supabase** — Dashboard → **Authentication → URL Configuration**:
- **Site URL**: `https://<your-vercel-url>`
- **Redirect URLs** — add both:
  - `https://<your-vercel-url>/auth/callback`
  - `http://localhost:3000/auth/callback` (keeps local dev working)

Without (b) the magic-link login will refuse to redirect back after you click the
email link.

---

## 5. First admin login

1. Visit `https://<your-vercel-url>/admin/login`.
2. Enter `srisaifloraevent@gmail.com`, click *Send me a link*.
3. Open the email, click the link. It hits `/auth/callback`, creates the session,
   and the signup trigger promotes that address to admin (it's the only one on
   `admin_allowlist`). You land on the Leads inbox.

If the email doesn't arrive: Supabase's built-in mailer is rate-limited to a
handful per hour — wait and retry, or check spam.

---

## 6. Adding a custom domain later

1. Buy a domain (Namecheap / Cloudflare / Hostinger — see the README notes).
2. Vercel → Project → **Settings → Domains** → add it → follow the DNS records
   Vercel shows (an `A` record and/or `CNAME` at your registrar). HTTPS is
   automatic.
3. Redo step 4 with the custom domain in place of the `*.vercel.app` URL
   (update `NEXT_PUBLIC_SITE_URL`, redeploy, update the Supabase Site URL and
   Redirect URLs). Keep the localhost redirect entry.

---

## Troubleshooting

### Deployments show "Blocked"

> The deployment was blocked because the commit email `…` could not be matched
> to a GitHub account.

Vercel refuses to build a commit whose author email does not belong to a GitHub
account with access to the project. The site keeps serving the last successful
deployment, so nothing looks broken — the code just silently stops updating.

Check what git is stamping on your commits:

```bash
git config user.email
```

It must be an email **verified on your GitHub account**. The always-safe choice
is GitHub's noreply address, which is guaranteed to match and does not publish a
personal address:

```bash
git config user.email "<id>+<username>@users.noreply.github.com"
```

Find `<id>` with `gh api user -q .id` (this project uses
`184151110+spik-code@users.noreply.github.com`). Alternatively, add the email you
already commit with to GitHub under Settings → Emails and verify it.

Fixing the config only affects **new** commits. Earlier commits stay blocked —
that is fine, since Vercel deploys whatever the newest commit points at, and the
next good commit ships the whole tree. To relabel the old ones too you would have
to rewrite history and force-push.

### Redeploy didn't pick up my code

Vercel's **Redeploy** button rebuilds the **same commit** with the current
environment variables. It is the right tool after an env-var change and the wrong
one for shipping new code — for that, push a commit (or run `npx vercel --prod`).

## Notes

- **Auto-deploy**: once connected, every push to `main` builds and deploys.
  Other branches get preview URLs.
- **Node**: pinned to `22.x` in `package.json` (`engines`), which is what Vercel
  runs.
- **Reel videos** (~130 MB in `public/media/`) are committed and served
  statically by Vercel. This works, but moving them to ImageKit video delivery
  (see README → "Later") will shrink the repo and speed up builds.
- **Rate limiting** on the enquiry form is in-memory per serverless instance, so
  it resets often on Vercel. Fine for casual spam; move to Upstash Redis if it
  becomes a problem.
