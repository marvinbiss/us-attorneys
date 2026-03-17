# CLAUDE.md -- US Attorneys

## Project

US Attorney directory. Next.js 14 App Router, TypeScript strict, Tailwind CSS, Supabase (auth + DB + storage), deployed on Vercel.

**Site in English** -- professional legal language is critical for credibility.

- **Domain**: us-attorneys.com
- **Repo**: us-attorneys (branch master)
- **Target**: 8M+ programmatic pages (75 practice areas x 41K ZIP codes x intents)

### Entity Mapping (from ServicesArtisans)
| French (old) | US (new) | DB Table |
|---|---|---|
| providers | attorneys | `attorneys` |
| services | specialties (practice areas) | `specialties` |
| communes | locations_us | `locations_us` |
| departements | states | `states` |
| SIRET/SIREN | Bar Number / EIN | `bar_admissions` |
| artisan | attorney | -- |

---

## Commands

```bash
npm run dev          # Development server
npm run build        # Next.js build (3,749+ pre-rendered pages) -- REQUIRED before push
npm run lint         # ESLint
npx vitest run       # Unit tests (~600 tests, 16 files)
npm run test         # Playwright tests (e2e)
```

### Before each deploy

1. **ALWAYS** run `npm run build` locally BEFORE commit/push
2. If the build breaks, fix it BEFORE pushing -- **never push a broken build to Vercel**
3. Run `npx vitest run` if logic/API files were modified

---

## Architecture

```
src/
+-- app/
|   +-- (auth)/           # /login, /register, /register-attorney, /forgot-password
|   +-- (public)/         # Public pages (practice-areas, blog, FAQ, contact, careers, pricing, quotes, reviews, emergency, cities, states, regions, issues, guides, questions, comparisons, barometer, glossary, standards, tools)
|   +-- (private)/        # /attorney-dashboard/*, /client-dashboard/*, /booking/*, /leave-review/*
|   +-- admin/            # /admin/login + /admin/(dashboard)/* (26+ pages)
|   +-- api/              # ~188 API routes
|       +-- admin/        # 50+ endpoints (users, providers, claims, cms, reviews, reports, bookings, quotes, subscriptions, payments, stats, audit, analytics, services, settings, algorithm, leads, messages, gdpr, dispatch, export, voice, prospection/*)
|       +-- attorney/     # claim, provider, profile, settings, stats, subscription, avatar, reviews, requests, quotes, leads, messages, team
|       +-- auth/         # signin, signup, oauth, logout, reset-password, me, 2fa
|       +-- client/       # profile, requests, reviews, messages, leads
|       +-- cron/         # 10 crons (reminders, review-requests, sitemap-health, indexnow-submit, prospection-process, calculate-trust-badges, recalculate-quality, voice-*)
|       +-- stripe/       # create-checkout, create-portal, webhook
|       +-- ...           # bookings, reviews, messages, portfolio, providers, notifications, quotes, gdpr, estimation, contact, newsletter, revalidate, indexnow, analytics, health, feed, sitemaps, vapi, v1/*
+-- components/           # 232 files
|   +-- admin/ (28)       # Dashboard, tables, modals, config panels
|   +-- attorney/ (26)    # Profile, leads, quotes, stats
|   +-- attorney-dashboard/ (12)
|   +-- chat/ (10)        # Messaging
|   +-- ui/ (31)          # Reusable UI components (shadcn-style)
|   +-- home/ (7)         # Homepage sections
|   +-- search/ (9)       # SearchBar, filters, results, autocomplete
|   +-- maps/ (10)        # Leaflet maps + marker clustering
|   +-- seo/ (7)          # JSON-LD, meta tags, breadcrumbs, LastUpdated
|   +-- estimation/ (7)   # Estimation form, calculator
|   +-- reviews/ (7)      # Display, ratings, form
|   +-- dashboard/ (12)   # Generic dashboard components
|   +-- ...               # forms, portfolio, providers, upload, compare, auth, header, booking, notifications, client
+-- hooks/ (19)           # useAuth, useToast, useFavorites, useGeolocation, useCompare, useDebounce, useAdminFetch, etc.
+-- lib/
|   +-- supabase/         # server.ts (RLS), admin.ts (service_role), client.ts (browser)
|   +-- supabase.ts       # 717 lines, main queries, SERVICE_TO_SPECIALTIES mapping
|   +-- cache.ts          # L1 memory + L2 Redis Upstash
|   +-- storage.ts        # Supabase Storage (portfolio bucket, thumbnails)
|   +-- admin-auth.ts     # requirePermission()
|   +-- logger.ts         # Structured logger (debug/info/warn/error)
|   +-- rate-limiter.ts   # Redis-based (prod), in-memory (dev)
|   +-- stripe-admin.ts   # Stripe SDK lazy init
|   +-- geography.ts      # Distance, city resolution
|   +-- services/         # email-service.ts (Resend), verification.service.ts
|   +-- seo/              # jsonld.ts, internal-links.ts, location-content.ts (274KB), indexnow.ts, blog-schema.ts
|   +-- data/             # Static data files
|       +-- trade-content.ts (311KB)    # Descriptions, costs, process per practice area
|       +-- problems.ts (88KB)          # ~500 common issues
|       +-- comparisons.ts (187KB)      # Service comparisons
|       +-- questions.ts (237KB)        # ~500 FAQs
|       +-- glossaire.ts (73KB)         # Technical terms
|       +-- calendrier-travaux.ts       # Seasonal timing
|       +-- authors.ts                  # E-E-A-T authors
|       +-- barometre.ts                # Price per service x region
+-- types/ (13 files)     # index.ts, database.ts (auto-gen), admin.ts, algorithm.ts, cms.ts, leads.ts, portfolio.ts, prospection.ts, voice-qualification.ts, branded.ts, legacy/
+-- test/                 # Vitest setup
__tests__/                # Tests (api/, components/, hooks/, lib/, services/, validations/)
scripts/                  # activate-providers, analyze-providers, aggregate-barometre, audit-all-mappings
scripts/ingest/           # Data ingestion pipeline (see below)
supabase/migrations/      # 87 migration SQL files (001-355)
android/                  # Capacitor app (WebView wrapper)
```

---

## Supabase Schema -- CRITICAL Rules

**NEVER write Supabase queries without verifying columns/tables exist in migrations.**

- Check columns in `supabase/migrations/` before any `.select('col')` or `.eq('col', val)`
- TypeScript **CANNOT** detect incorrect column names inside `.select('col')` strings
- Check FK before joins: use `attorney:attorney_id(id, name)` (column name), not `attorney:attorneys(id, name)` (assumed table name)

### Core Tables (Migration 400+)

| Table | Key Columns | Notes |
|-------|------------|-------|
| `attorneys` | id, name, slug, bar_number, bar_state, courtlistener_id, win_rate, settlement_avg, cases_handled, rating_average, review_count, address_city, address_state, address_zip, primary_specialty_id, user_id, firm_name, is_verified, is_active, geo | Main listing table |
| `specialties` | id, name, slug, category, is_active, parent_id | 75 US practice areas |
| `attorney_specialties` | attorney_id, specialty_id, is_primary, years_experience | Many-to-many |
| `states` | id, name, slug, abbreviation, fips_code, bar_association_url | 50 states + DC + territories |
| `counties` | id, name, slug, state_id, fips_code | ~3,244 counties |
| `locations_us` | id, name, slug, state_id, county_id, population, latitude, longitude, geo | Cities |
| `zip_codes` | id, code, location_id, state_id, latitude, longitude, geo | 41K+ ZIP codes (separate table) |
| `courthouses` | id, name, slug, court_type, state_id, county_id, courtlistener_id, pacer_court_id | Federal + state courts |
| `attorney_courthouses` | attorney_id, courthouse_id | Many-to-many |
| `attorney_claims` | id, attorney_id, user_id, bar_number_provided, bar_state_provided, status | Bar verification flow |
| `case_results` | id, attorney_id, case_type, outcome, amount, court_id | Win rate / settlement source |
| `bar_admissions` | attorney_id, state, bar_number, status, verified | Multi-state bar admissions |
| `profiles` | id, email, full_name, is_admin, role, user_type | `user_type` = 'client' or 'attorney' |
| `reviews` | attorney_id, client_id, rating, comment, status | |
| `leads` | specialty_id, location, contact info, status | Lead matching |

### DB Features

- **RLS** enabled on all tables
- **PostGIS**: `GEOGRAPHY(POINT)` for geolocation (attorneys, locations, courthouses, zip_codes)
- **Full-text search**: `search_vector` (tsvector) on attorneys (English config)
- **Materialized View**: `mv_attorney_stats` (refreshed via cron)
- **Key indexes**: `idx_attorneys_sitemap` (covering), `idx_attorneys_geo` (GIST), `idx_attorneys_search` (GIN)

### Specialty Mapping

75 practice areas organized by category in `specialties` table. Attorney -> Specialty via `attorney_specialties` join table (replaces the old hardcoded `SPECIALTY_TO_PRACTICE_AREAS` dict).

---

## TypeScript

- **Strict mode** enabled: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- Always clean up unused imports after refactoring -- the build will fail otherwise
- Always check prop/interface types of existing components before using them (read the file first)
- Path alias: `@/*` -> `./src/*`

---

## Code Conventions

- **No over-engineering**: minimal solution that works
- **Fonts**: Inter (body) + Plus Jakarta Sans (headings) via `next/font/google`
- **Icons**: `lucide-react` (v0.294)
- **Validation**: `zod` (v4.3) for all API schemas
- **State management**: `swr` (v2.4) for client data fetching
- **Animations**: `framer-motion` (v12.29)
- **Maps**: Leaflet + React Leaflet + marker clustering
- **Rich editor**: Tiptap (full suite: color, image, link, table, alignment)
- **Charts**: Recharts (v3.7)
- **Toasts**: Sonner (v2.0)
- **Admin auth**: `requirePermission('resource', 'read'|'write')` from `@/lib/admin-auth`
- **Admin DB**: `createAdminClient()` from `@/lib/supabase/admin` to bypass RLS (service_role)
- **Client DB**: `createClient()` from `@/lib/supabase/server` (respects RLS)
- **Logger**: `logger.info/warn/error()` from `@/lib/logger` -- do not use `console.log` in production
- **Cache**: `getCachedData(key, fetcher, ttl)` from `@/lib/cache` -- L1 memory + L2 Redis
- **Storage**: `@/lib/storage` -- Supabase `portfolio` bucket, auto thumbnails, images max 10MB, videos max 100MB
- **Email**: Resend API via `@/lib/services/email-service` (5 templates: welcome, booking, review request, password reset, welcomeAttorney)
- **Rate limiting**: `@/lib/rate-limiter` -- Redis (prod), in-memory (dev)

---

## Auth

- **OAuth Google** enabled (Supabase provider)
- **Flow**: `signInWithOAuth()` -> callback `/auth/callback` -> create profile on first login -> smart redirect (`/attorney-dashboard` or `/client-dashboard` based on `user_type`)
- **Middleware**: protects `/client-dashboard`, `/attorney-dashboard` -- redirects to `/login` if not authenticated

---

## Attorney Profile Claim Flow

1. Public attorney page -> "Claim this profile" button (if unclaimed)
2. Attorney enters their Bar Number + State
3. API verifies bar number vs state bar records -> creates `attorney_claims` with status `pending`
4. Admin reviews in `/admin/attorneys` -> approves or rejects
5. If approved: `attorneys.user_id` assigned, `profiles.user_type` -> 'attorney'

---

## Tests

- **Framework**: Vitest with jsdom
- **Config**: `vitest.config.ts`
- **Files**: `src/**/*.test.{ts,tsx}` and `__tests__/**/*.test.{ts,tsx}`
- **Setup**: `src/test/setup.ts`
- Isolated tests (no real Supabase dependencies -- schemas replicated locally)

---

## SEO

Full SEO domination plan in `SEO-DOMINATION-PLAN.md` at project root.
- Target: 8M+ pages via 75 practice areas x 41K ZIP codes x intents
- Read this file before any SEO work

### Sitemap

Architecture: sitemaps (static + dynamic attorney sitemaps + image + news).

| File | Role |
|------|------|
| `src/app/sitemap.ts` | Static sitemaps via `generateSitemaps()` |
| `src/app/api/sitemap-index/route.ts` | Index `/sitemap.xml` (Next.js 14.2 workaround) |
| `src/app/api/sitemap-attorneys/route.ts` | Dynamic attorney sitemaps (DB, `maxDuration=60`) |
| `src/app/robots.ts` | Dynamic robots.txt |

**Rewrites** (`next.config.js`):
- `/sitemap.xml` -> `/api/sitemap-index`
- `/sitemap/attorneys-:id.xml` -> `/api/sitemap-attorneys?id=:id`

**Noindex strategy**: All public pages use **fail-open** (`attorneyCount = 1` default). If DB is down or during build, pages stay indexed. ISR corrects with real value.

**Migration 400**: Covering index `idx_attorneys_sitemap` -- serves attorney sitemap query entirely from index (zero heap fetch).

### IndexNow

- Key: `55e191c6b56d89e07bbf8fcba3552fcd` (verification file in `/public/`)
- `POST /api/indexnow` -- URL submission to Bing/Yandex
- Daily cron `/api/cron/indexnow-submit` -- submits ~212 strategic URLs

### Monitoring

- Daily cron `/api/cron/sitemap-health` -- checks all 39 sitemaps (HTTP 200 + valid XML)
- Structured logs visible in Vercel -> Logs tab

### Critical SEO Rules

- **Never** put a noindex page in the sitemap (contradiction)
- **Never** use conditional canonical -- always self-referencing
- **Always** use `escapeXml()` on dynamic data in XML sitemaps
- **Always** set `stale-while-revalidate=86400` on sitemap cache headers
- **Geo hub pages** (cities, states, regions): **always indexed** -- rich content even with 0 attorneys
- Pages with intentional noindex: `/accessibility`, `/careers`, `/terms`, `/privacy`, `/legal`, `/partners`, `/press`, `/favorites`, `/sitemap-page`

---

## Data Layer

### Static data (src/lib/data/)
- `trade-content.ts` (311KB): descriptions, benefits, costs, process per practice area (+ helpers `slugifyTask()`, `parseTask()`, `getTasksForService()`)
- `problems.ts` + `problems-extra.ts`: ~500 common issues
- `questions.ts` (237KB): ~500 FAQs
- `comparisons.ts` (187KB): service comparisons
- `glossaire.ts` (73KB): technical terms
- `barometre.ts`: price per service x region x complexity
- `authors.ts`: E-E-A-T authors (6 profiles)

### Fetching patterns
- **Build**: flag `IS_BUILD` -> skip DB, use static fallback data
- **ISR**: `revalidate = 86400` (24h) on all programmatic pages
- **Fail-open**: `attorneyCount = 1` default -> ISR corrects with real value
- **Retry**: exponential backoff (2 retries, 800ms base), timeout 8s
- **CDN**: `s-maxage=86400, stale-while-revalidate=604800` (middleware + next.config)

### Cache (src/lib/cache.ts)
- **L1**: per-Lambda-invocation memory (~1h TTL)
- **L2**: shared Redis Upstash, prefix `sa:cache:`
- **TTLs**: services=24h, attorneys=1h, locations=7d, CMS=1h

---

## Third-party Integrations

| Service | Usage | Config |
|---------|-------|--------|
| **Stripe** | Payments, subscriptions, billing portal | STRIPE_SECRET_KEY, webhooks |
| **Resend** | Transactional emails (5 templates) | RESEND_API_KEY |
| **Twilio** | SMS notifications | via prospection webhooks |
| **Vapi** | Voice lead qualification | VAPI_API_KEY |
| **ElevenLabs** | Voice synthesis | |
| **Google Calendar** | Attorney calendar | GOOGLE_CLIENT_ID/SECRET |
| **IndexNow** | URL submission to Bing/Yandex | INDEXNOW_API_KEY |
| **Sentry** | Error monitoring | |
| **Google Analytics** | Tracking (lazyOnload) | |

---

## Environment

Required variables (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_EMAILS` (comma-separated list)
- `CRON_SECRET` / `REVALIDATE_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRO_PRICE_ID` / `STRIPE_PREMIUM_PRICE_ID`
- `RESEND_API_KEY` / `RESEND_WEBHOOK_SECRET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `UNSUBSCRIBE_SECRET`
- `INDEXNOW_API_KEY` / `VAPI_API_KEY` / `VAPI_WEBHOOK_SECRET`

---

## Performance -- Critical Rules

- **NEVER** use `force-dynamic` on public pages (use ISR with `revalidate`)
- **NEVER** let `generateStaticParams()` return `[]` in a child segment of a parent with static params -> return at least 1 seed param
- **Third-party scripts**: `strategy="lazyOnload"` (GTM, GA, Meta Pixel, Google Ads)
- **Images**: always `next/image` with lazy loading (never raw `<img>`)
- **Middleware**: skip `updateSession()` for public pages
- **Supabase queries**: wrapped with `next: { revalidate: N }` to avoid dynamic SSR
- **330 'use client' files**: many could be server components (future refactoring)

---

## Data Ingestion Pipeline

### Proven Strategy: Prefix Search + Auto-Subdivision

For scraping state bar "Find a Lawyer" pages, **always use this approach before paying for data**:

1. **3-letter last name prefixes** (AAA-ZZZ = 17,576 combos) → each returns ≤25 results
2. **If prefix hits the cap** → auto-subdivide with 4th letter (26 sub-queries)
3. **Run concurrently** (20-30 parallel) → discovery completes in ~12-15 min
4. **Fetch detail pages** concurrently for bar numbers + extra data

This avoids fighting pagination (ColdFusion sessions, AJAX tokens) and avoids paying for PIA/FOIA requests.

**Proven**: TX Bar — 130K attorneys discovered for $0 in ~2h (vs $200-500 PIA + 4 week wait).

### Ingestion Scripts

| Script | Source | Records | Method |
|--------|--------|---------|--------|
| `ny-attorneys.ts` | NY Open Data CSV | ~334K | Direct download (free) |
| `ca-attorneys-{af,gl,mr,sz}.ts` | CalBar HTML | ~190K | HTML scraping (4 parallel) |
| `tx-attorneys-opengovus.ts` | Texas Bar search | ~130K | Prefix search + detail fetch |
| `fl-attorneys.ts` | FL Bar Excel | ~108K | Email request (free) |
| `il-attorneys-prod.ts` | ARDC directory | ~97K | ASP.NET MvcGrid + antiforgery |
| `oh-attorneys.ts` | OH Supreme Court | ~37K | Blocked (use PIA request) |
| `uspto-attorneys.ts` | USPTO FY25 Roster | ~52K | Direct ZIP download (free) |
| `link-attorneys-fast.ts` | — | — | Link attorneys → cities by address |
| `run-all.ts` | — | — | Master orchestrator |

### Running Ingestion

```bash
# Load env vars first (required for all scripts)
export $(grep -v '^#' .env.local | xargs)

# Run individual script
npx tsx scripts/ingest/ny-attorneys.ts [--dry-run] [--limit 1000]

# Run all in sequence
npx tsx scripts/ingest/run-all.ts [--from 4] [--step 5]
```

### Key Rules
- **Always test with `--limit 50 --dry-run` first**
- `address_state` is CHAR(2) — never insert full state names
- `bar_number + bar_state` is the unique constraint for upserts
- USPTO roster URL changes yearly: update to latest FY roster in `ROSTER_URLS`
