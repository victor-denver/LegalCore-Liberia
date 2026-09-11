# LegalCore backend (Supabase)

> **Principle:** the law is free, forever, for everyone — signed-out reading is never gated.
> Accounts add sync + personalisation. Revenue comes from *professional workflow* features,
> and we decide which ones to build from real demand signals collected here.

## Architecture in one picture

```
Browser (Vite + React) ── publishable key ──▶ Supabase
  │                                              ├─ Auth: Google OAuth (public) · email+password / magic link (admins)
  │  useAuth ─────────── profiles ──────────────┤    role (user|admin) · country_code · profession · plan
  │  useStore ────────── saved_documents, brief_items, watchlist, corrections   (per-user, RLS)
  │  FeedbackWidget ──── feedback                                               (user → admin)
  │  RequestLawButton ── document_requests                                      (zero-result search → content roadmap)
  │  PlansPage ───────── feature_interest                                       ("I'd pay for this" → Pro roadmap)
  │  analytics.ts ────── events  ──▶ insights_* views                           (what/where/who → Insights tab)
  │  useAppConfig ────── app_config                                             (announcement, nudge, paywall switch)
  └─ /admin ──────────── all of the above, admin-only via RLS
```

Everything is enforced by **Row Level Security in Postgres**, not by the UI. The publishable
key is safe in the browser for exactly that reason. Never expose the secret/service-role key.

## Setup — do these in order

### 1. Environment (done)
`.env.local` already contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

### 2. Database
Dashboard → **SQL Editor** → New query → run each file, in order:

1. `supabase/migrations/0001_auth_and_library.sql` — auth, roles, personal library
2. `supabase/migrations/0002_product_platform.sql` — preferences, feedback, requests, analytics, config

### 3. Sign-in today: email + password for everyone

The login page is one plain form (sign in / create account / forgot password). It never
hints at roles — admins log in the same way and simply see an **Admin** link afterwards.
Google is wired up but hidden until `google_login_enabled` is switched on in **/admin → Config**
after completing the steps below.

### 3b. Google sign-in (optional, later)
1. [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) → **Create credentials → OAuth client ID → Web application**
   - Authorised JavaScript origins: `http://localhost:5173` and `https://legalcoreafrica.amaratechit.com`
   - Authorised redirect URI: `https://tmwxbdhoulgrxabmutbh.supabase.co/auth/v1/callback`
2. Supabase → **Authentication → Sign In / Providers → Google** → enable, paste Client ID + Secret
3. Supabase → **Authentication → URL Configuration**
   - Site URL: `https://legalcoreafrica.amaratechit.com`
   - Redirect URLs: `http://localhost:5173/**` and `https://legalcoreafrica.amaratechit.com/**`
4. Wherever the live site is built/hosted, set the same two environment variables as `.env.local`
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) and redeploy — Vite bakes them in at build time.

### 4. First admin
1. **Authentication → Users → Add user** → email + strong password (≥ 12 chars)
2. SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@amaratech.com';
   ```
   (Profile rows are created automatically; if it's missing, have them sign in once first.)
3. Sign in at `/login` → you land on `/admin`. Promote further admins from the **Users** tab.

Recommended hardening (Authentication → Settings): min password 12, leaked-password check,
TOTP MFA for admins, and switch **off** "Allow new users to sign up" for the *email* provider
if only Google should be self-serve (Google sign-ups are unaffected).

## What the product does with it

| Surface | Purpose | Table |
|---|---|---|
| **Onboarding** (2 questions after first sign-in) | Country → default jurisdiction everywhere; profession → tailored Plans page & future features | `profiles.country_code / profession` |
| **Header flag** | Changing country while signed in saves to the account and follows the user to other devices | `profiles.country_code` |
| **Login nudge** | After N document reads (configurable), a dismissible invite — never a wall | `app_config.nudge_after_views` |
| **Feedback** (bottom-left button, user menu) | Bug / idea / missing law / praise + rating → admin triage with statuses & notes | `feedback` |
| **Request this law** (zero-result search) | Users tell you which instruments to digitise next, per country | `document_requests` |
| **/plans** | Free vs Pro roadmap; signed-in users vote "I'd pay for this" — you build in demand order | `feature_interest` |
| **Analytics** | Searches (incl. zero-result), doc reads/exports, AI questions, sign-ins, country — no IP, no cookies, no third party | `events` → `insights_*` |
| **Announcement bar** | Ship news to every visitor without a deploy | `app_config.announcement` |
| **Pro gating switch** | Single flag to turn on paid gating when Pro ships; safe to leave off | `app_config.paywall_enabled`, `profiles.plan` |

## Admin console (`/admin`)

- **Insights** — 30-day sessions, top searches, **zero-result searches** (build these), most-read docs,
  **activity by country** (launch next), **Pro-feature votes** (sell this).
- **Feedback** — triage: new → seen → planned → done/closed, internal notes.
- **Law requests** — grouped by country; open → sourcing → added.
- **Corrections** — user-reported errors on documents.
- **Launch alerts** — people waiting for a country to go live (your launch email list).
- **Users** — role, country, profession, organisation, last seen.
- **Config** — announcement bar, nudge threshold, Pro gating switch.

## Monetisation path (when you're ready)

1. Watch **Insights → Pro-feature votes** and **Feedback → ideas** for 4–8 weeks.
2. Build the top-voted feature; set its `status` to `beta` in `src/data/plans.ts`.
3. Add Stripe (Supabase has a first-party wrapper) and set `profiles.plan = 'pro'` on payment via webhook.
4. Flip `paywall_enabled` in **Config**. Founding voters get the promised launch pricing.

Free reading stays free throughout — that is the moat and the distribution.
