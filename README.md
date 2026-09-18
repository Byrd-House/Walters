# Walter's — Landscaping & Construction

Production marketing site for Walter's (Chapel Hill, NC). Static-first **Astro 7** +
**Tailwind v4**, with one serverless endpoint that turns the "Get a Quote" form into
a lead (email fallback now, Jobber when credentials land).

## Stack

- **Astro 7** (static output) + TypeScript
- **Tailwind v4** via `@tailwindcss/vite` — design tokens are CSS-first in `src/styles/global.css` (`@theme`)
- **Astro Content Collections** for dev-maintained content (testimonials)
- **One serverless function** `src/pages/api/quote.ts` → lead pipeline (`src/lib/leads/`)
- Deploy: **Vercel** (adapter configured). Netlify documented below.

## Getting started

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static site + the /api/quote function
npm run preview  # serve the build
```

Node **22.12+** required (Astro 7). Vercel functions run on Node 24.

## Project structure

```
src/
  assets/{logo,photos}/   real client images (optimized via astro:assets)
  components/             Header, TrustBar, Footer, Hero, ServicesPreview, Testimonials, QuoteForm…
  content/testimonials/   add real review quotes here (see below)
  content.config.ts       content collection schemas
  data/site.ts            business facts (phone, areas, rating, services) — single source of truth
  layouts/BaseLayout.astro
  lib/leads/              lead pipeline: schema (validation), email, jobber, console, pipeline
  lib/jobber/             Jobber OAuth + GraphQL client + mutations
  pages/                  index (Home), services, about, contact
  pages/api/quote.ts      serverless lead endpoint (prerender = false)
  styles/global.css       Tailwind import + design tokens (@theme)
public/
  fonts/                  self-hosted Birdie (display face)
  video/hero.mp4          hero background loop
```

## Fonts

- **Birdie** (display/H1) — self-hosted from `public/fonts/`.
- **Freight** (`freight-text-pro`) + **Avenir** (`avenir-lt-pro`) — Adobe Fonts kit `ioy6xpq`, loaded
  via the `<link>` in `BaseLayout.astro`. The kit ships weights **400/700 only**, so headings render 700.

## Editing content

- **Business facts** (phone, service areas, rating, service descriptions): `src/data/site.ts`.
- **Testimonials**: add a file per review in `src/content/testimonials/` (e.g. `jane-d.yaml`):
  ```yaml
  author: "Jane D."
  location: "Chapel Hill"
  rating: 5
  quote: "They showed up on time and the yard has never looked better."
  ```
  The Home testimonials section shows an empty state until at least one exists. **Never invent quotes.**

## Environment variables

Copy `.env.example` → `.env`. All are server-only. **In dev, leads are logged to the
console** until these are set, so the form works immediately.

| Var | Purpose |
|---|---|
| `RESEND_API_KEY`, `LEAD_FALLBACK_EMAIL`, `LEAD_FROM_EMAIL` | Email fallback (the guaranteed lead capture) via [Resend](https://resend.com). Verify a sending domain. |
| `JOBBER_CLIENT_ID`, `JOBBER_CLIENT_SECRET`, `JOBBER_REDIRECT_URI`, `JOBBER_REFRESH_TOKEN`, `JOBBER_API_VERSION`, `JOBBER_LEAD_CUSTOM_FIELD_ID` | Jobber GraphQL integration (best-effort CRM sync — creates a Client per lead). See setup below. |

### How the lead pipeline behaves

`/api/quote` validates (zod + honeypot + time-trap), then runs configured sinks
(`src/lib/leads/pipeline.ts`):

1. **Durable** sinks first (email; console in dev) — success here = the lead is safe; the visitor sees success.
2. **Best-effort** sinks (Jobber) — run after, never block the response.

Unconfigured sinks are skipped, so the form works today (console/email) and Jobber
joins automatically once its env vars are set — no code change.

### Jobber setup (when credentials are available)

> **Full step-by-step walkthrough:** [`docs/JOBBER_INTEGRATION.md`](docs/JOBBER_INTEGRATION.md)
> (developer-app + no-seat path, with exact commands). The summary below is the overview.

Jobber's API **cannot create a "Request"** (those mutations were removed in 2023 and never
re-added), and client **notes** aren't writable either. So each website lead is synced as a
**Client**, with the request details (services, timing, message) stored in a Client **custom
text field**. The email sink always captures the full lead regardless — Jobber is convenience,
not the system of record.

1. **Create the app** — in Jobber's [Developer Center](https://developer.getjobber.com/),
   create a new app with **write access to clients**, set a **Redirect URI** (e.g.
   `http://localhost:5173/callback`), and turn **Refresh Token Rotation OFF**. Rotation is only
   required to publish to Jobber's Marketplace; as a private/custom integration the refresh
   token stays long-lived and can live in an env var (no token store needed). Copy the Client
   ID/Secret into `.env`.
2. **Mint a refresh token** — with `JOBBER_CLIENT_ID/SECRET/REDIRECT_URI` set in `.env`:
   ```bash
   node scripts/jobber-auth.mjs         # prints the authorize URL
   # open it, approve, copy the ?code=… from the redirect, then:
   node scripts/jobber-auth.mjs <code>  # prints JOBBER_REFRESH_TOKEN
   ```
   Paste the printed token into `JOBBER_REFRESH_TOKEN`.
3. **(Optional) request details on the client** — in Jobber, create a **text custom field** on
   Clients (e.g. "Website request"), then set `JOBBER_LEAD_CUSTOM_FIELD_ID` to its
   `customFieldConfigurationId` (find it in GraphiQL via `customFieldConfigurations`). Without
   it, the client is created without those details.
4. **[VERIFY-LIVE]** in Jobber's GraphiQL before launch: the current `X-JOBBER-GRAPHQL-VERSION`
   date and the exact `ClientCreateInput` field names (`emails`/`phones`/`billingAddress`/
   `customFields`). These are isolated in `src/lib/jobber/mutations.ts` and `oauth.ts`.
5. Creating a client auto-captures the app name as the Jobber **lead source**. Confirm Jesse's
   new-client notifications are enabled so leads reach his phone.

## Deploy

- **Vercel** (default): connect the repo, set the env vars in the dashboard, deploy. The
  `@astrojs/vercel` adapter builds the static site + the `/api/quote` function.
- **Netlify**: `npx astro add netlify`, move env vars to the Netlify UI. The `src/lib/` code is
  host-agnostic; only the adapter changes.

Set the real domain in `astro.config.mjs` (`site`) before launch — it drives canonical URLs,
the sitemap, and OG tags.

## Still needed from the client (TODOs)

1. Business **email** + **hours** (`[CONFIRM]` in `src/data/site.ts`).
2. **3–5 real testimonial quotes** (the 5.0 / 25 rating is confirmed).
3. **Social profile URLs** (handle "JW Landscape and Maintenance").
4. **Jobber API credentials** for the live integration.
5. Vector logo (only a raster tree mark exists today) + production domain.

## Notes

- `npm audit` currently reports advisories in transitive build deps; review before launch
  (do not blindly `--force`, which pulls breaking changes).
- Pages: **Home**, **Services**, **About**, **Contact**.
