# PopFeed Codebase Review & Cloudflare Migration Plan

*Generated 2026-06-11. No code was changed — this is analysis only.*

A note on what this repo actually is: it's **both** the marketing site **and** the early
product. The landing/pricing/contact pages and the logged-in dashboard (Create Post,
Analytics, Settings) all live in one React app, plus a small set of serverless API
functions for Stripe, email, and triggering your n8n automation. Keep that in mind
throughout — some recommendations differ for "marketing page" code vs "product" code.

---

## Phase 1 — Map of the project

### The stack, in plain language

| Piece | What it is | Why it's here |
|---|---|---|
| **React 19** | The UI library — your pages are JavaScript functions that return HTML-like markup | All visible pages |
| **Vite 7** | The build tool. In dev it serves files instantly; for production it bundles everything into static files in `dist/` | `npm run dev` / `npm run build` |
| **Supabase** (`@supabase/supabase-js`) | A hosted Postgres database + login system + file storage, accessed straight from the browser | Auth, user profiles, settings, posts, analytics, image uploads, waitlist |
| **Stripe** (`stripe` server-side, `@stripe/stripe-js` client-side) | Payments. Checkout + customer billing portal + a webhook that records who paid | Subscriptions ($49 Starter / $79 Unlimited) |
| **Resend** | Transactional email API | Sends contact-form messages to your Gmail |
| **n8n** | Your external automation engine (separate service, not in this repo) | Actually generates and schedules the social posts |
| **three / @react-three/fiber** | A 3D/WebGL graphics engine | Only used for the animated "Silk" hero background |
| **motion** | Animation library | Only used for the scrolling-text marquee |
| **recharts** | Charting library | The dashboard analytics line chart |
| **ogl** | Another WebGL library | **Unused — imported by nothing** (see Phase 3) |

"Serverless function" = a small piece of backend code that only runs when a request
hits it; you don't manage a server. Vercel auto-deploys anything in `api/` this way.

### Project structure

```
my-site/
├── index.html              ← The single HTML page the SPA loads into
├── vite.config.js          ← Build config (nearly default)
├── vercel.json             ← Vercel routing: send all paths to index.html
│                              EXCEPT /api/* and /waitlist.html
├── package.json            ← Frontend deps + scripts
│
├── src/                    ← The React app (the SPA)
│   ├── main.jsx            ← Entry point: mounts <App /> into #root
│   ├── App.jsx (1012 ln)   ← Navbar, Home, Pricing, Contact, Login, Signup,
│   │                          Examples, Account, Footer + hand-rolled routing
│   ├── Dashboard.jsx (1481 ln) ← The logged-in product: Overview, Create Post,
│   │                          Accounts, Analytics, Posts, Settings
│   ├── supabaseClient.js   ← Creates the shared Supabase connection
│   ├── stripeConfig.js     ← Stripe publishable key + price IDs from env vars
│   ├── Silk.jsx            ← WebGL animated hero background (three.js shader)
│   ├── ScrollVelocity.jsx  ← Scroll-speed-reactive text marquee (motion)
│   ├── MagnetLines.jsx     ← Mouse-following line grid on login/signup
│   ├── index.css (1239 ln) ← All global styles + Google Fonts import
│   ├── Dashboard.css       ← Dashboard styles
│   └── App.css             ← 1 line, effectively dead
│
├── api/                    ← Vercel serverless functions (Node.js)
│   ├── create-checkout.js        ← Makes a Stripe Checkout session
│   ├── create-portal-session.js  ← Makes a Stripe billing-portal session
│   ├── stripe-webhook.js         ← Stripe calls this after payment; writes
│   │                                the plan into Supabase `profiles`
│   ├── contact.js                ← Contact form → email via Resend
│   ├── trigger-automation.js     ← Verifies subscription, logs a run,
│   │                                fires your n8n webhook (URL kept secret)
│   └── package.json              ← Just `stripe` (Vercel merges with root deps)
│
├── public/                 ← Copied verbatim into the build
│   ├── logo.png, big-logo.png, favicon.ico
│   └── waitlist.html       ← Standalone waitlist page (own CSS/JS, no React)
│
└── supabase/schema.sql     ← Tables: user_settings, automation_runs, posts,
                               post_analytics + Row Level Security policies
```

### How a request flows

1. **Any URL** (`/`, `/pricing`, `/dashboard`…) → Vercel's rewrite (`vercel.json:2`)
   serves `index.html` → `src/main.jsx` boots React → `App.jsx:928` reads
   `window.location.pathname` and picks a page from a hand-written lookup table
   (`PAGE_TO_PATH`, `App.jsx:912`). There's no router library — navigation is a
   `useState` + `history.pushState` (`App.jsx:982`) + a `popstate` listener
   (`App.jsx:972`). It works, and for 8 pages it's fine.
2. **On load**, `App.jsx:931` asks Supabase "is someone logged in?" and fetches their
   `profiles` row to learn their name and subscription tier.
3. **Browser ↔ Supabase directly** for almost all data: login/signup, dashboard stats,
   posts, analytics, settings, and image uploads to Supabase Storage. Security is
   enforced by Row Level Security (RLS) policies in `supabase/schema.sql:75-98` —
   the database itself refuses to return rows that don't belong to the logged-in user.
4. **Browser → `/api/*`** only for things that need secrets: Stripe (secret key),
   Resend (API key), and the n8n webhook URL (`api/trigger-automation.js:60`).
5. **Stripe → `/api/stripe-webhook`** after a successful payment, which sets
   `profiles.subscription` to `starter`/`unlimited` (`api/stripe-webhook.js:50`).
6. **n8n** (external) receives the trigger payload, generates content, and writes
   rows back into `posts`/`post_analytics`/`automation_runs` using the service-role
   key (which bypasses RLS).

### Environment variables in use

Client-side (baked into the JS bundle at **build time** — `VITE_` prefix):
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (`src/supabaseClient.js:3-4`)
- `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_STARTER_PRICE_ID`, `VITE_UNLIMITED_PRICE_ID` (`src/stripeConfig.js`)

Server-side (secrets, only ever read inside `api/`):
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STARTER_PRICE_ID`, `UNLIMITED_PRICE_ID`
- `SUPABASE_SERVICE_ROLE_KEY` (admin key — bypasses all RLS; treat like a root password)
- `RESEND_API_KEY`
- `N8N_WEBHOOK_URL`
- Note: `api/*` also reads `VITE_SUPABASE_URL` (e.g. `api/trigger-automation.js:4`) —
  a slightly odd reuse of a client-prefixed var on the server, but harmless.

### Half-finished, unused, or duplicated

- **`ogl` dependency** (`package.json:16`) — installed, imported nowhere. Dead weight.
- **`stripePromise`** (`src/stripeConfig.js:3`) — created but never imported anywhere;
  the `@stripe/stripe-js` package exists only for this. Checkout actually happens by
  redirecting to a Stripe-hosted URL, so the client library isn't needed at all.
- **`src/App.css`** (1 line) and **`src/assets/react.svg`** — leftovers from the Vite
  template, unused.
- **Accounts tab is a mock** (`src/Dashboard.jsx:312-340`): "Connect" just flips local
  state and shows `@popfeed_demo`. The real OAuth flow is a TODO comment
  (`Dashboard.jsx:320-331`). Related: "Accounts Linked" stat is hardcoded to 0
  (`Dashboard.jsx:181`).
- **`waitlist` table is undocumented** — `public/waitlist.html:461` inserts into a
  `waitlist` table that doesn't exist in `supabase/schema.sql`. It presumably exists
  in your live Supabase, but the schema file is now out of date.
- **Duplicated plan/feature lists** — pricing features appear in `App.jsx:295-329`
  (PricingPage) and again in `App.jsx:825-829` (AccountPage). Easy to update one and
  forget the other.
- **Bug: Examples page crash** — `App.jsx:812` references `user`, but `ExamplesPage`
  only receives `setPage` (`App.jsx:703`). Clicking **"Subscribe Now"** at the bottom
  of /examples throws a `ReferenceError` and the click does nothing. Same pattern at
  `App.jsx:999`: the `default:` case renders `<HomePage>` without the `user` prop
  (harmless today, but inconsistent).
- **Duplicated session-restore logic** — the same "get session → fetch profile →
  setUser" block appears twice in `App.jsx:932-948` and `App.jsx:955-968` (the
  post-payment `setTimeout` hack).

---

## Phase 2 — A guided tour

Think of the whole system as a **restaurant**:

- **The dining room** is `App.jsx` — the public-facing marketing pages. Pretty
  decorations (Silk, ScrollVelocity, MagnetLines) live here. Anyone can walk in.
- **The members-only lounge** is `Dashboard.jsx` — you need a paid subscription to
  get in (checked at `Dashboard.jsx:40`, though see Phase 3: that check is only the
  velvet rope, not the locked door — the locked door is Supabase RLS).
- **The pantry** is Supabase — one shared database holding profiles, settings, posts,
  analytics, and uploaded images. The browser talks to it directly, and the pantry's
  own rules (RLS) decide what each customer may take.
- **The cashier** is the `api/` folder — the only place secret keys live. Stripe money
  matters, sending email, and the n8n webhook URL all go through here, because if you
  put those keys in the browser, anyone could read them with View Source.
- **The kitchen** is n8n, which isn't in this repo at all. The dashboard's "Run Now"
  button (`Dashboard.jsx:191`) and "Begin Posting" (`Dashboard.jsx:1182`) ring a bell
  (`/api/trigger-automation`) and the kitchen cooks asynchronously, writing finished
  dishes (posts) back into the pantry for the dashboard to display.

Walking the user journey: a visitor lands on `/`, sees the WebGL silk hero and the
services grid. They sign up (`SignupPage`, `App.jsx:597`) — Supabase creates the auth
user and (via a database trigger you presumably set up) a `profiles` row. On the
pricing page (`App.jsx:283`), clicking Subscribe POSTs to `/api/create-checkout`,
which creates a Stripe-hosted payment page and redirects there. When they pay, two
things happen in parallel: Stripe calls `/api/stripe-webhook` to flip their profile to
`starter`/`unlimited`, and Stripe sends the *browser* back to `/?success=true`, where
`App.jsx:951-969` waits 2.5 seconds and re-fetches the profile, hoping the webhook has
landed by then (a known race condition, see Phase 3). Now `Dashboard.jsx` lets them in:
they fill in Settings (saved to `user_settings`), hit Create Post — the hero image goes
to Supabase Storage (`Dashboard.jsx:1190`), then `/api/trigger-automation` validates
their subscription **server-side** (`api/trigger-automation.js:17-25`, good), logs an
`automation_runs` row, and fires the n8n webhook with all their preferences. Later,
the Posts and Analytics tabs read whatever n8n wrote back.

The standalone `public/waitlist.html` is a completely separate, self-contained page
(its own CSS and vanilla JS, no React) that inserts straight into a Supabase `waitlist`
table using the public anon key — that's safe *as long as* that table's RLS only allows
inserts, not reads.

---

## Phase 3 — Efficiency & quality review (ordered by impact-for-effort)

### 1. ~~Security~~ Correctness of the API trust model — **highest impact**
*Files: `api/create-portal-session.js`, `api/create-checkout.js`, `api/trigger-automation.js`*

All three endpoints trust whatever `userId`/`userEmail` the browser sends, with no
proof the caller actually *is* that user:

- **`create-portal-session.js:16-44` is the serious one.** Anyone can POST any email
  address; the function looks up the Stripe customer by email (`:33`) and returns a
  live **billing-portal URL for that customer** — letting a stranger view invoices,
  change the card, or cancel another user's subscription. Fix: require the Supabase
  access token (the browser already has it: `supabase.auth.getSession()`), verify it
  server-side with `supabase.auth.getUser(token)`, and derive the user ID/email from
  the verified token instead of the request body. Same pattern for the other two
  endpoints. **Effort: small** (a ~10-line helper used in 3 files + 3 small frontend
  header additions).
- `trigger-automation.js:13-14`: any visitor who learns a user ID can burn that
  user's automation runs/credits.
- `contact.js:23-28` interpolates user input into HTML email — escape it or send
  text-only. Also has no rate limiting, so it can be scripted to spam you
  (Cloudflare Turnstile, free, fixes this nicely post-migration).

### 2. Bundle size: three.js + recharts ship to every visitor — **big win, small effort**
*Files: `src/App.jsx:35-41`, `src/Silk.jsx`, `src/Dashboard.jsx:3-12`*

Everything is statically imported into one bundle, so a first-time visitor who only
looks at your landing page downloads **three.js + @react-three/fiber (~250 KB gzipped)
for one background effect, plus recharts (~140 KB gzipped) and all 1,481 lines of
Dashboard code they can't even access**. On mobile connections this is the difference
between a snappy and a sluggish first paint — and first paint is what a marketing
site is *for*.

Fix (no Cloudflare needed, works today):
```jsx
// App.jsx
const Dashboard = lazy(() => import('./Dashboard'));
const Silk = lazy(() => import('./Silk'));
// wrap usage in <Suspense fallback={null}>
```
`React.lazy` = "don't download this code until it's actually rendered." Vite
automatically splits these into separate files. **Effort: small.** Longer-term,
consider replacing Silk with a CSS gradient animation or a tiny hand-rolled WebGL
canvas and dropping three/fiber entirely (**medium**, bigger payoff).

### 3. The post-payment `setTimeout(2500)` race — *App.jsx:950-969*

After Stripe redirects back, the code waits 2.5 s and hopes the webhook has updated the
profile. If Stripe is slow, the user lands on the site still marked "free" and thinks
the payment failed. Better: poll the profile every 2 s for up to ~30 s (or subscribe to
the row with Supabase Realtime) and show a "confirming your payment…" state. **Effort:
small.**

### 4. Dead dependencies — *package.json*

Remove `ogl` (unused) and `@stripe/stripe-js` + `src/stripeConfig.js`'s
`stripePromise` (price IDs can live in a plain constants file or stay as env reads).
`resend` sits in the root `package.json` but is server-only — after migration it
belongs with the Worker, not the frontend (it never reaches the browser bundle today,
so this is hygiene, not bytes). Also delete `src/App.css`, `src/assets/react.svg`.
**Effort: trivial.**

### 5. Analytics refetches on every filter change — *src/Dashboard.jsx:409-429*

Switching platform refetches from Supabase even though the query doesn't filter by
platform server-side — the rows are filtered **client-side** at `:423-425` anyway.
Drop `selectedPlatform` from the `useEffect` dependency list and filter the
already-loaded rows. Also: the platform filter compares lowercase `r.posts?.platform`
correctly, but note `DashOverview` (`Dashboard.jsx:160-182`) runs two separate queries
where one (`select views, likes` over all of a user's history) will grow unbounded —
fine now, but at thousands of analytics rows you'll want a Postgres view or an
aggregate RPC. **Effort: small now, medium later.**

### 6. MagnetLines does layout work on every mouse move — *src/MagnetLines.jsx:23-36*

`getBoundingClientRect()` is called for all 77 spans on **every pointermove event**
(can be >100/sec). That forces the browser to recompute layout constantly while the
mouse moves on login/signup. Cache the rects once (recompute on resize/scroll) and
wrap the update in `requestAnimationFrame`. **Effort: small.**

### 7. Render-blocking Google Fonts `@import` — *src/index.css:18*

A CSS `@import` means the browser must download `index.css`, *then discover*, *then
download* the font CSS, serially — slowest possible way to load fonts.
`public/waitlist.html:8-10` already does it right (`<link rel="preconnect">` +
stylesheet link in the HTML head). Move the font loading into `index.html` the same
way. **Effort: trivial.**

### 8. Smaller items (honest assessment: these are minor)

- **Examples-page crash bug** (`App.jsx:812`, described in Phase 1) — fix is one prop.
- **Plan data duplicated** between PricingPage and AccountPage — extract one
  `plans.js` constant. Cosmetic, but prevents a future pricing mismatch.
- **Hand-rolled router**: fine at this size. If you add many more pages or need URL
  params (`/posts/:id`), adopt `react-router` then, not now.
- **Dashboard gating is client-side only** (`Dashboard.jsx:40`): a curious user can
  flip state in DevTools and *see* the dashboard UI — but RLS means they get no data
  and `trigger-automation` re-checks the subscription server-side. So this is
  acceptable; just never weaken those two server-side layers.
- **`waitlist.html` hardcodes the Supabase URL/anon key** (`:430-431`). The anon key
  is designed to be public, so this isn't a leak — just make sure the `waitlist`
  table's RLS allows INSERT only (no SELECT), or strangers could read your list.
- **What's already fine**: Vite config, ESLint setup, RLS schema design,
  `.gitignore` (node_modules and `.env` correctly excluded — verified, nothing
  committed), the Stripe webhook's signature verification and price-ID allowlisting
  (`api/create-checkout.js:18`), and image upload pathing per-user. Solid work.

---

## Phase 4 — Cloudflare migration plan

### The shape of the move

Today: Vercel serves `dist/` + runs `api/*.js` as Node serverless functions.
Target: **one Cloudflare Worker** that (a) serves the same `dist/` via **Workers
Static Assets** and (b) handles `/api/*` routes in the Worker code. One deploy, one
`wrangler.jsonc`, no separate services needed. Your data layer (Supabase) and
automation (n8n) **don't move at all** — they're independent hosted services.

> **Recommendation: do NOT migrate the database to D1.** Supabase here is not just a
> database — it's your auth system, RLS security layer, and file storage, and n8n
> writes into it from outside. D1 has none of that built in; replacing it means
> rebuilding login, permissions, and storage from scratch. Keep Supabase. This also
> answers the "provider-neutral" question: Supabase is already neutral.

### Step 1 — Static site on Workers Static Assets (effort: **small**)

New file `wrangler.jsonc` in the repo root:

```jsonc
{
  "name": "popfeed",
  "main": "worker/index.js",          // the API worker from Step 2
  "compatibility_date": "2026-06-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]    // API requests skip assets, hit the Worker
  }
}
```

- Build command stays `npm run build`; output is `./dist` (Vite default — confirmed,
  `vite.config.js` doesn't override it). **Trap check #1 (blank page from wrong output
  dir): you're safe as long as `assets.directory` says `./dist`.**
- `not_found_handling: "single-page-application"` replaces the `vercel.json` rewrite:
  any path that isn't a real file serves `index.html`.
- **`/waitlist.html` needs no special exclusion anymore.** On Vercel you had to carve
  it out of the rewrite (`vercel.json:2`); on Workers Static Assets, real files are
  always matched *before* the SPA fallback, so it just works. Delete `vercel.json`
  after the move.
- **Trap check #2 (case-sensitive imports):** I checked every import against the
  actual filenames (`Silk.jsx`, `ScrollVelocity.jsx`, `MagnetLines.jsx`,
  `Dashboard.jsx`, etc.) — all match exactly. You're safe.
- **Trap check #3 (committed node_modules):** verified not in git. Safe.
- Deploy: `npx wrangler deploy` (or connect the GitHub repo in the Cloudflare
  dashboard via Workers Builds for push-to-deploy like Vercel).

### Step 2 — Port `api/` to a Worker (effort: **medium**, the bulk of the work)

Vercel functions use Node's `(req, res)` style; Workers use the web-standard
`fetch(request) → Response` style. The logic transfers almost 1:1, but every
handler's "skin" changes. Recommended: one `worker/index.js` using **Hono** (a tiny
router made for Workers) with one route per old file.

| Old file | What changes | Effort |
|---|---|---|
| `api/create-checkout.js` | Mechanical rewrite: `req.body` → `await c.req.json()`, `res.status(...)` → `c.json(..., status)`, `req.headers.origin` → `c.req.header('origin')`. Stripe SDK works on Workers but must be constructed with `httpClient: Stripe.createFetchHttpClient()` (Workers have no Node `http`). Upgrade `stripe` from v14 to current while you're at it. | Small |
| `api/create-portal-session.js` | Same mechanical rewrite + **add the auth-token verification from Phase 3 item 1 during the port** — you're rewriting the file anyway. | Small |
| `api/stripe-webhook.js` | The `config = { api: { bodyParser: false } }` and `buffer()` helper (`:11-19`) are Vercel-isms — delete them. In a Worker the raw body is just `await request.text()`, and signature checking becomes `await stripe.webhooks.constructEventAsync(body, sig, secret)` (**must** be the async variant; the sync one uses Node crypto and throws on Workers). Then update the webhook URL in the Stripe dashboard to the new domain. | Small–medium (most "gotcha"-prone file — test with `stripe trigger checkout.session.completed`) |
| `api/contact.js` | Resend's SDK is fetch-based and runs on Workers natively. Mechanical rewrite only. Consider adding Cloudflare Turnstile here (free bot protection). | Small |
| `api/trigger-automation.js` | Mechanical rewrite; `@supabase/supabase-js` is fetch-based and Workers-compatible. Add auth verification here too. | Small |
| `api/package.json` | Goes away — dependencies merge into root `package.json` (`stripe`, `resend` move here conceptually; they're bundled into the Worker by wrangler). | Trivial |

Nothing in `api/` is long-running, stateful, or listener-based — every function is
request-in/response-out and fits the Workers model perfectly. The only "long" work
(content generation) already lives in n8n, which is the right place for it. The n8n
*call* stays a simple server-side `fetch` exactly as today; the OAuth flows for social
platforms (when you build them) should follow the same pattern — secrets and token
exchanges in the Worker or n8n, never in the browser.

You don't currently have any cron jobs or queue-shaped work, so **Cron Triggers and
Queues are not needed now**. When you build "post every morning automatically," that
scheduling brain most naturally lives in n8n (it has a Schedule node); use a Worker
Cron Trigger instead only if you want the schedule logic in your own code.

### Step 3 — Environment variables to recreate in Cloudflare

Build-time vars (`VITE_*`) must be available **where the build runs** (Workers Builds
settings, or your CI): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_STARTER_PRICE_ID`, `VITE_UNLIMITED_PRICE_ID`.

Runtime **secrets** (set with `npx wrangler secret put NAME`, never in
`wrangler.jsonc`): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (new value — Stripe
issues a fresh one when you add the new endpoint URL), `SUPABASE_SERVICE_ROLE_KEY`,
`RESEND_API_KEY`, `N8N_WEBHOOK_URL`, `STARTER_PRICE_ID`, `UNLIMITED_PRICE_ID`.
Plain `SUPABASE_URL` can be a non-secret `vars` entry. In Workers, env vars arrive as
a function parameter (`c.env.STRIPE_SECRET_KEY` in Hono), not `process.env` — so the
Supabase/Stripe clients must be created *inside* the handler, not at module top level
like `api/trigger-automation.js:3-6` does today.

There is **no `VERCEL_*` usage, no Vercel Analytics/Speed Insights, no Vercel Cron,
no Vercel image optimization** anywhere in this repo — I checked. Your Vercel
surface area is exactly: the `api/` runtime convention + `vercel.json`. That makes
this an unusually clean migration.

### Step 4 — Cutover checklist

1. Deploy the Worker, test everything on the `*.workers.dev` URL (except the Stripe
   webhook, which needs the real domain or `stripe listen --forward-to`).
2. Add your custom domain to the Worker (Cloudflare dashboard → Workers → Domains).
3. Update the Stripe webhook endpoint URL + new `STRIPE_WEBHOOK_SECRET`.
4. Point DNS at Cloudflare; keep Vercel running until you've confirmed checkout,
   webhook, contact form, automation trigger, login, and `/waitlist.html` all work.
5. Delete `vercel.json` and the Vercel project.

---

## Suggested order of operations

1. **Fix the API trust model** (Phase 3 #1, especially `create-portal-session`) —
   it's a live issue regardless of hosting, and you'll port these files anyway, so fix
   first, port second, and you only test twice instead of three times.
2. **Quick frontend wins on the current site**: lazy-load Dashboard + Silk, fix the
   Examples-page `user` bug, remove dead deps/files, move fonts to `<link>`.
   Low-risk, immediately measurable.
3. **The migration itself**: `wrangler.jsonc` + static assets first (verify the SPA
   and waitlist page on workers.dev), then port the five API routes, then the Stripe
   webhook cutover, then DNS.
4. **After migration**: Turnstile on the contact form, then resume product work
   (the real OAuth account-linking flow, which is your biggest unfinished feature).

## Open questions for you

1. **Domain**: which domain is production right now (popfeedmarketing.com appears in
   `api/contact.js:18`, popfeedmarketing.app in `waitlist.html:425`) — and is its DNS
   already on Cloudflare?
2. **Waitlist table RLS**: in your live Supabase, does the `waitlist` table have
   insert-only policies? (Two-minute check in the dashboard; important.) Also, should
   I add it to `supabase/schema.sql` so the file matches reality?
3. **Profiles table**: `schema.sql` references `profiles(id)` but never creates the
   table — was it created manually with a signup trigger? Worth capturing in the
   schema file too.
4. **Deploy style**: do you want push-to-deploy via Cloudflare Workers Builds
   (Vercel-like, recommended for you), or deploying manually with `wrangler deploy`?
5. **Stripe subscription lifecycle**: today only `checkout.session.completed` is
   handled — cancellations/failed renewals never downgrade anyone. Want me to add
   `customer.subscription.deleted/updated` handling while porting the webhook?
6. **Silk hero**: keep the three.js effect (and accept ~250 KB gzipped on first
   load even after lazy-loading) or replace it with a lightweight CSS/canvas version?
