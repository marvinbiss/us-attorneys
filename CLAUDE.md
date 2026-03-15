# CLAUDE.md — US Attorneys

## Project

US Attorney directory. Next.js 14 App Router, TypeScript strict, Tailwind CSS, Supabase (auth + DB + storage), deployed on Vercel.

**Site in English** — professional legal language is critical for credibility.

- **Domain**: us-attorneys.com
- **Repo**: us-attorneys (branch master)
- **Target**: 8M+ programmatic pages (75 practice areas × 41K ZIP codes × intents)

### Entity Mapping (from ServicesArtisans)
| French (old) | US (new) | DB Table |
|---|---|---|
| providers | attorneys | `attorneys` |
| services | specialties (practice areas) | `specialties` |
| communes | locations_us | `locations_us` |
| départements | states | `states` |
| SIRET/SIREN | Bar Number / EIN | `bar_admissions` |
| artisan | attorney | — |

---

## Commandes

```bash
npm run dev          # Serveur de développement
npm run build        # Build Next.js (3 749+ pages pré-rendues) — OBLIGATOIRE avant push
npm run lint         # ESLint
npx vitest run       # Tests unitaires (~600 tests, 16 fichiers)
npm run test         # Tests Playwright (e2e)
```

### Avant chaque deploy

1. **TOUJOURS** lancer `npm run build` en local AVANT de commit/push
2. Si le build casse → corriger AVANT de push — **jamais de build cassé sur Vercel**
3. Lancer `npx vitest run` si des fichiers de logique/API ont été modifiés

---

## Architecture

```
src/
├── app/
│   ├── (auth)/           # /connexion, /inscription, /inscription-artisan, /mot-de-passe-oublie
│   ├── (public)/         # Pages publiques (services, blog, FAQ, contact, carrières, tarifs, devis, avis, urgence, villes, departements, regions, problemes, guides, questions, comparaison, barometre, glossaire, normes, outils)
│   ├── (private)/        # /espace-artisan/*, /espace-client/*, /booking/*, /donner-avis/*
│   ├── admin/            # /admin/connexion + /admin/(dashboard)/* (26+ pages)
│   └── api/              # ~188 API routes
│       ├── admin/        # 50+ endpoints (users, providers, claims, cms, reviews, reports, bookings, quotes, subscriptions, payments, stats, audit, analytics, services, settings, algorithme, leads, messages, gdpr, dispatch, export, voice, prospection/*)
│       ├── artisan/      # claim, provider, profile, settings, stats, subscription, avatar, avis, demandes, devis, leads, messages, equipe
│       ├── auth/         # signin, signup, oauth, logout, reset-password, me, 2fa
│       ├── client/       # profile, demandes, avis, messages, leads
│       ├── cron/         # 10 crons (reminders, review-requests, sitemap-health, indexnow-submit, prospection-process, calculate-trust-badges, recalculate-quality, voice-*)
│       ├── stripe/       # create-checkout, create-portal, webhook
│       └── ...           # bookings, reviews, messages, portfolio, providers, notifications, quotes, gdpr, estimation, contact, newsletter, verify-siret, revalidate, indexnow, analytics, health, feed, sitemaps, vapi, v1/*
├── components/           # 232 fichiers
│   ├── admin/ (28)       # Dashboard, tables, modals, config panels
│   ├── artisan/ (26)     # Profile, leads, quotes, stats
│   ├── artisan-dashboard/ (12)
│   ├── chat/ (10)        # Messagerie
│   ├── ui/ (31)          # Composants UI réutilisables (shadcn-style)
│   ├── home/ (7)         # Sections homepage
│   ├── search/ (9)       # SearchBar, filters, results, autocomplete
│   ├── maps/ (10)        # Cartes Leaflet + marker clustering
│   ├── seo/ (7)          # JSON-LD, meta tags, breadcrumbs, LastUpdated
│   ├── estimation/ (7)   # Formulaire estimation, calculateur
│   ├── reviews/ (7)      # Display, ratings, form
│   ├── dashboard/ (12)   # Composants dashboard génériques
│   └── ...               # forms, portfolio, providers, upload, compare, auth, header, booking, notifications, client
├── hooks/ (19)           # useAuth, useToast, useFavorites, useGeolocation, useCompare, useDebounce, useAdminFetch, etc.
├── lib/
│   ├── supabase/         # server.ts (RLS), admin.ts (service_role), client.ts (browser)
│   ├── supabase.ts       # 717 lignes, queries principales, SERVICE_TO_SPECIALTIES mapping
│   ├── cache.ts          # L1 mémoire + L2 Redis Upstash
│   ├── storage.ts        # Supabase Storage (portfolio bucket, thumbnails)
│   ├── admin-auth.ts     # requirePermission()
│   ├── logger.ts         # Logger structuré (debug/info/warn/error)
│   ├── rate-limiter.ts   # Redis-based (prod), in-memory (dev)
│   ├── stripe-admin.ts   # Stripe SDK lazy init
│   ├── geography.ts      # Distance, city resolution
│   ├── insee-resolver.ts # SIREN → company name, E.164 phone
│   ├── services/         # email-service.ts (Resend), verification.service.ts
│   ├── seo/              # jsonld.ts, internal-links.ts, location-content.ts (274KB), indexnow.ts, blog-schema.ts
│   └── data/             # Données statiques volumineuses
│       ├── france.ts (1.2MB)     # 2 280 villes + 101 depts + 46 services
│       ├── insee-communes.json (2.1MB) # 36K communes
│       ├── trade-content.ts (311KB)    # Descriptions, coûts, process par métier
│       ├── problems.ts (88KB)          # ~500 problèmes
│       ├── comparisons.ts (187KB)      # Comparaisons services
│       ├── questions.ts (237KB)        # ~500 FAQs
│       ├── glossaire.ts (73KB)         # Termes techniques
│       ├── calendrier-travaux.ts       # Timing saisonnier
│       ├── authors.ts                  # Auteurs E-E-A-T
│       └── barometre.ts                # Prix par service × région
├── types/ (13 fichiers)  # index.ts, database.ts (auto-gen), admin.ts, algorithm.ts, cms.ts, leads.ts, portfolio.ts, prospection.ts, voice-qualification.ts, branded.ts, legacy/
└── test/                 # Setup Vitest
__tests__/                # Tests (api/, components/, hooks/, lib/, services/, validations/)
scripts/                  # activate-providers, analyze-providers, aggregate-barometre, audit-all-mappings
supabase/migrations/      # 87 fichiers de migration SQL (001-355)
android/                  # App Capacitor (wrapper WebView)
```

---

## Supabase Schema — CRITICAL Rules

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

75 practice areas organized by category in `specialties` table. Attorney → Specialty via `attorney_specialties` join table (replaces the old hardcoded `SPECIALTY_TO_PRACTICE_AREAS` dict).

---

## TypeScript

- **Strict mode** activé : `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- Toujours nettoyer les imports inutilisés après chaque refactoring — le build échouera sinon
- Toujours vérifier les types des props/interfaces des composants existants avant de les utiliser (lire le fichier d'abord)
- Path alias : `@/*` → `./src/*`

---

## Conventions de code

- **Pas d'over-engineering** : solution minimale qui fonctionne
- **Polices** : Inter (body) + Plus Jakarta Sans (headings) via `next/font/google`
- **Icônes** : `lucide-react` (v0.294)
- **Validation** : `zod` (v4.3) pour tous les schemas d'API
- **State management** : `swr` (v2.4) pour le data fetching client
- **Animations** : `framer-motion` (v12.29)
- **Cartes** : Leaflet + React Leaflet + marker clustering
- **Éditeur riche** : Tiptap (suite complète : couleur, image, lien, table, alignement)
- **Charts** : Recharts (v3.7)
- **Toasts** : Sonner (v2.0)
- **Admin auth** : `requirePermission('resource', 'read'|'write')` de `@/lib/admin-auth`
- **Admin DB** : `createAdminClient()` de `@/lib/supabase/admin` pour bypass RLS (service_role)
- **Client DB** : `createClient()` de `@/lib/supabase/server` (respecte RLS)
- **Logger** : `logger.info/warn/error()` de `@/lib/logger` — ne pas utiliser `console.log` en production
- **Cache** : `getCachedData(key, fetcher, ttl)` de `@/lib/cache` — L1 mémoire + L2 Redis
- **Storage** : `@/lib/storage` — bucket Supabase `portfolio`, thumbnails auto, images max 10MB, vidéos max 100MB
- **Email** : Resend API via `@/lib/services/email-service` (5 templates : welcome, booking, review request, password reset, welcomeArtisan)
- **Rate limiting** : `@/lib/rate-limiter` — Redis (prod), in-memory (dev)

---

## Auth

- **OAuth Google** enabled (Supabase provider)
- **Flow**: `signInWithOAuth()` → callback `/auth/callback` → create profile on first login → smart redirect (`/attorney-dashboard` or `/client-dashboard` based on `user_type`)
- **Middleware**: protects `/client-dashboard`, `/attorney-dashboard` — redirects to `/login` if not authenticated

---

## Attorney Profile Claim Flow

1. Public attorney page → "Claim this profile" button (if unclaimed)
2. Attorney enters their Bar Number + State
3. API verifies bar number vs state bar records → creates `attorney_claims` with status `pending`
4. Admin reviews in `/admin/attorneys` → approves or rejects
5. If approved: `attorneys.user_id` assigned, `profiles.user_type` → 'attorney'

---

## Tests

- **Framework** : Vitest avec jsdom
- **Config** : `vitest.config.ts`
- **Fichiers** : `src/**/*.test.{ts,tsx}` et `__tests__/**/*.test.{ts,tsx}`
- **Setup** : `src/test/setup.ts`
- Tests isolés (pas de dépendances Supabase réelles — schemas répliqués localement)

---

## SEO

Full SEO domination plan in `SEO-DOMINATION-PLAN.md` at project root.
- Target: 8M+ pages via 75 practice areas × 41K ZIP codes × intents
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
- `/sitemap.xml` → `/api/sitemap-index`
- `/sitemap/attorneys-:id.xml` → `/api/sitemap-attorneys?id=:id`

**Noindex strategy**: All public pages use **fail-open** (`attorneyCount = 1` default). If DB is down or during build, pages stay indexed. ISR corrects with real value.

**Migration 400**: Covering index `idx_attorneys_sitemap` — serves attorney sitemap query entirely from index (zero heap fetch).

### IndexNow

- Clé : `55e191c6b56d89e07bbf8fcba3552fcd` (fichier de vérification dans `/public/`)
- `POST /api/indexnow` — soumission d'URLs à Bing/Yandex
- Cron quotidien `/api/cron/indexnow-submit` — soumet ~212 URLs stratégiques

### Monitoring

- Cron quotidien `/api/cron/sitemap-health` — vérifie les 39 sitemaps (HTTP 200 + XML valide)
- Logs structurés visibles dans Vercel → onglet Logs

### Règles SEO critiques

- **Jamais** mettre une page noindex dans le sitemap (contradiction)
- **Jamais** de canonical conditionnel — toujours self-referencing
- **Toujours** `escapeXml()` sur les données dynamiques dans les sitemaps XML
- **Toujours** `stale-while-revalidate=86400` sur les cache headers des sitemaps
- **Hub pages géo** (villes, départements, régions) : **toujours indexées** — contenu riche même avec 0 providers
- Pages avec noindex intentionnel : `/accessibilite`, `/carrieres`, `/cgv`, `/confidentialite`, `/mentions-legales`, `/partenaires`, `/presse`, `/mes-favoris`, `/plan-du-site`

---

## Data Layer

### Données statiques (src/lib/data/)
- `france.ts` (1.2MB) : 2 280 villes + 101 départements + 46 services — fallback pendant le build
- `insee-communes.json` (2.1MB) : 36K communes officielles INSEE
- `trade-content.ts` (311KB) : descriptions, bénéfices, coûts, process par métier (+ helpers `slugifyTask()`, `parseTask()`, `getTasksForService()`)
- `problems.ts` + `problems-extra.ts` : ~500 problèmes courants
- `questions.ts` (237KB) : ~500 FAQs
- `comparisons.ts` (187KB) : comparaisons entre services
- `glossaire.ts` (73KB) : termes techniques
- `barometre.ts` : prix par service × région × complexité
- `authors.ts` : auteurs E-E-A-T (6 profils)

### Patterns de fetching
- **Build** : flag `IS_BUILD` → skip DB, fallback sur `france.ts`
- **ISR** : `revalidate = 86400` (24h) sur toutes les pages programmatiques
- **Fail-open** : `providerCount = 1` par défaut → ISR corrige avec la vraie valeur
- **Retry** : exponential backoff (2 retries, 800ms base), timeout 8s
- **CDN** : `s-maxage=86400, stale-while-revalidate=604800` (middleware + next.config)

### Cache (src/lib/cache.ts)
- **L1** : mémoire par invocation Lambda (~1h TTL)
- **L2** : Redis Upstash partagé, prefix `sa:cache:`
- **TTLs** : services=24h, artisans=1h, locations=7d, CMS=1h

---

## Intégrations tierces

| Service | Usage | Config |
|---------|-------|--------|
| **Stripe** | Paiements, abonnements, portail facturation | STRIPE_SECRET_KEY, webhooks |
| **Resend** | Emails transactionnels (5 templates) | RESEND_API_KEY |
| **Twilio** | SMS notifications | via prospection webhooks |
| **Vapi** | Qualification vocale leads | VAPI_API_KEY |
| **ElevenLabs** | Synthèse vocale | |
| **Google Calendar** | Calendrier artisan | GOOGLE_CLIENT_ID/SECRET |
| **INSEE / Pappers** | Validation SIRET/SIREN | INSEE_CONSUMER_KEY, PAPPERS_API_KEY |
| **IndexNow** | Soumission URLs Bing/Yandex | INDEXNOW_API_KEY |
| **Sentry** | Error monitoring | |
| **Google Analytics** | Tracking (lazyOnload) | |

---

## Environnement

Variables requises (voir `.env.example`) :
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_EMAILS` (liste séparée par virgules)
- `CRON_SECRET` / `REVALIDATE_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRO_PRICE_ID` / `STRIPE_PREMIUM_PRICE_ID`
- `RESEND_API_KEY` / `RESEND_WEBHOOK_SECRET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `UNSUBSCRIBE_SECRET`
- `INSEE_CONSUMER_KEY` / `INSEE_CONSUMER_SECRET` / `PAPPERS_API_KEY`
- `INDEXNOW_API_KEY` / `VAPI_API_KEY` / `VAPI_WEBHOOK_SECRET`

---

## Performance — Règles critiques

- **JAMAIS** de `force-dynamic` sur les pages publiques (utiliser ISR avec `revalidate`)
- **JAMAIS** `generateStaticParams()` retournant `[]` dans un segment enfant d'un parent avec des params statiques → retourner au moins 1 param seed
- **Scripts tiers** : `strategy="lazyOnload"` (GTM, GA, Meta Pixel, Google Ads)
- **Images** : toujours `next/image` avec lazy loading (jamais `<img>` brut)
- **Middleware** : skip `updateSession()` pour les pages publiques
- **Supabase queries** : wrappées avec `next: { revalidate: N }` pour éviter le SSR dynamique
- **330 fichiers 'use client'** : beaucoup pourraient être server components (refactoring futur)
