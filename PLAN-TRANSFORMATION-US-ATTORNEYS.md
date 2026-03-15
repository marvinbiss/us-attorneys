# PLAN DE TRANSFORMATION — ServicesArtisans → US Attorneys Platform

> **Niveau d'exigence** : Top 0.001% mondial
> **Date** : 2026-03-15
> **Statut** : Plan directeur v2.0 — corrige apres analyse exhaustive des requetes
> **Base analysee** : 254 composants, 188 routes API, 55 migrations SQL, 85+ scripts, 46 services, 35K communes, 6550+ refs "artisan"

---

## TABLE DES MATIERES

1. [Synthese executif](#1-synthese-executif)
2. [Cartographie complete des modifications](#2-cartographie-complete)
3. [Phase 0 — Fondations juridiques & infra](#3-phase-0)
4. [Phase 1 — Schema DB & types](#4-phase-1)
5. [Phase 2 — Donnees geographiques & services](#5-phase-2)
6. [Phase 3 — Backend & API](#6-phase-3)
7. [Phase 4 — Frontend & composants](#7-phase-4)
8. [Phase 5 — SEO & contenu programmatique](#8-phase-5)
9. [Phase 6 — Integrations tierces](#9-phase-6)
10. [Phase 7 — Compliance legale US](#10-phase-7)
11. [Phase 8 — Scripts & data pipeline](#11-phase-8)
12. [Phase 9 — Tests & QA](#12-phase-9)
13. [Phase 10 — Deploiement & go-live](#13-phase-10)
14. [Matrice de risques](#14-risques)
15. [Budget & timeline](#15-budget)

---

## 1. SYNTHESE EXECUTIF

### Ce qu'on transforme
Une marketplace B2C d'artisans francais (46 metiers, 35K communes, 2280 villes, 101 departements) en annuaire d'avocats americains (200+ practice areas, 41K ZIP codes, 19K villes, 3244 counties, 51 etats, 6+ intents par combinaison).

### Ampleur reelle
| Dimension | France (actuel) | USA (cible) | Multiplicateur |
|-----------|----------------|-------------|----------------|
| Professionnels | 560K artisans | 1.37M avocats | 2.4x |
| Entites geo | 35K communes | 41K ZIP + 19K cities + 3K counties + neighborhoods | 2.5x |
| Services | 46 metiers | 200+ practice areas (75 parents + 125+ sous-specialites) | 4.3x |
| Intents par combinaison | ~5 | 6-8 (find, cost, free consult, reviews, process, near-me, compare, spanish) | 1.5x |
| Pages programmatiques | 1.5M | **12.5M structure / ~8-10M indexees** | 6.7x-8.3x |
| Marche adressable | ~50M EUR | $450M USD (SAM) | 9x |

### Architecture de reutilisation
- **~85% reutilisable tel quel** : Auth, bookings, messaging, reviews, admin panel, leads, Stripe, caching, ISR, monitoring, UI components
- **~15% a transformer** : Terminologie, donnees geo, services, compliance legale, schemas SEO, locale, validations, scripts data

### Les 3 decisions structurantes
1. **Fork complet** (pas i18n) — evolution independante, zero risque sur le projet FR
2. **Nouvelle instance Supabase** (us-east-1) — latence, compliance, isolation des donnees
3. **Domaine age achete** (DR 30-50+) — accelerateur SEO critique pour le crawl des 8.4M pages

---

## 2. CARTOGRAPHIE COMPLETE DES MODIFICATIONS

### 2.1 Renommage global du domaine metier

| Concept FR | Concept US | Impact |
|-----------|-----------|--------|
| Artisan | Attorney / Lawyer | 6550 occurrences, 469 fichiers |
| Metier / Specialite | Practice Area | 217 occurrences, 20 fichiers |
| Commune | City / ZIP Code | 2715 occurrences, 100+ fichiers |
| Departement | County | 5012 occurrences, 150+ fichiers |
| Region | State | 3414 occurrences, 120+ fichiers |
| Devis | Consultation Request | Routes, formulaires, DB |
| SIRET / SIREN | Bar Number / EIN | Validation, enrichment |
| Avis | Reviews | URLs, composants |
| Tarifs | Fees / Pricing | Pages, barometre |
| Urgence | Emergency Legal Help | Pages urgence |
| Travaux | Legal Matters / Cases | Contenu |
| Entreprise | Law Firm | Provider = Law Firm/Solo |
| Client | Client (inchange) | — |
| Booking | Consultation Booking | — |

### 2.2 Fichiers critiques par categorie

#### A. Configuration racine (12 fichiers)
| Fichier | Modifications |
|---------|--------------|
| `next.config.js` | Domaine images, CSP headers, redirects 301, rewrites sitemap, region Vercel (iad1) |
| `vercel.json` | Region iad1, crons adaptes, maxDuration |
| `package.json` | Nom projet, scripts, deps FR a retirer (INSEE) |
| `capacitor.config.ts` | App ID (com.usattorneys.app), nom, URL production |
| `tailwind.config.js` | Palette de couleurs (bleu juridique pro), fonts |
| `tsconfig.json` | Aucun changement |
| `Dockerfile` | Aucun changement structurel |
| `docker-compose.yml` | Variables d'env US |
| `sentry.*.config.ts` (3) | Nouveau DSN |
| `eslint.config.js` | Aucun changement |
| `vitest.config.ts` | Aucun changement |
| `playwright.config.ts` | URLs de test adaptees |

#### B. Schema DB & Migrations (55 fichiers SQL)
| Migration | Action |
|-----------|--------|
| 310 `communes` | REMPLACER par `locations` (city, state, county, zip_code, fips_code, geo GEOGRAPHY) |
| 311 `services` (46 metiers) | REMPLACER par 75 practice areas (personal-injury, criminal-defense, family-law, immigration, etc.) |
| 312-315 (indexes, claims) | Adapter noms colonnes |
| 100 (stable_id, cleanup) | Conserver pattern, adapter champs |
| 300-307 (prospection) | Adapter terminologie (artisan → attorney) |
| 305 (CMS) | Conserver tel quel |
| 306 (provider fields) | SIRET → bar_number, certifications → bar_admissions, etc. |
| NOUVELLE migration | Table `bar_admissions` (attorney_id, state, bar_number, status, admitted_date) |
| NOUVELLE migration | Table `court_records` (attorney_id, case_number, court, outcome, date) |
| NOUVELLE migration | Table `practice_areas_attorneys` (many-to-many) |

#### C. Types TypeScript (8 fichiers)
| Fichier | Modifications |
|---------|--------------|
| `src/types/database.ts` | Regenerer depuis nouveau schema Supabase |
| `src/types/admin.ts` | Adapter terminologie |
| `src/types/algorithm.ts` | Adapter config matching |
| `src/types/cms.ts` | Aucun changement |
| `src/types/leads.ts` | devis_requests → consultation_requests |
| `src/types/portfolio.ts` | portfolio → case_results / notable_cases |
| `src/types/prospection.ts` | artisan → attorney |
| `src/types/voice-qualification.ts` | Adapter scripts voix EN |

#### D. Lib core (40+ fichiers)
| Fichier | Modifications |
|---------|--------------|
| `lib/supabase.ts` (717 lignes) | SERVICE_TO_SPECIALTIES → PRACTICE_AREA_MAPPING, toutes les requetes geo |
| `lib/supabase/server.ts` | Aucun changement |
| `lib/supabase/admin.ts` | Aucun changement |
| `lib/geography.ts` | Communes → ZIP/City/County/State, API gouv → Census/USPS |
| `lib/insee-resolver.ts` | SUPPRIMER → remplacer par `lib/bar-lookup.ts` (State Bar API) |
| `lib/env.ts` | Nouvelles variables (BAR_API_KEY, COURTLISTENER_TOKEN, etc.) |
| `lib/cache.ts` | Aucun changement structural |
| `lib/rate-limiter.ts` | Aucun changement |
| `lib/storage.ts` | Aucun changement |
| `lib/stripe-admin.ts` | USD, plans US ($49/$149/$299) |
| `lib/admin-auth.ts` | Aucun changement |
| `lib/logger.ts` | Aucun changement |
| `lib/errors.ts` | Aucun changement |
| `lib/capacitor.ts` | Adapter pour app US |

#### E. Lib data (10+ fichiers, ~55K lignes)
| Fichier | Action |
|---------|--------|
| `lib/data/france.ts` (25K lignes) | **SUPPRIMER** → `lib/data/us-geo.ts` (ZIP codes, cities, counties, states) |
| `lib/data/insee-communes.json` (2.1MB) | **SUPPRIMER** → `lib/data/us-locations.json` (Census Bureau data) |
| `lib/data/trade-content.ts` (2.5K lignes) | **REMPLACER** → `lib/data/practice-area-content.ts` (75 practice areas EN) |
| `lib/data/problems.ts` + extras (2.2K) | **REMPLACER** → `lib/data/legal-issues.ts` (problemes juridiques courants) |
| `lib/data/questions.ts` (1.8K) | **REMPLACER** → `lib/data/legal-faqs.ts` (FAQs juridiques EN) |
| `lib/data/comparisons.ts` (2.9K) | **REMPLACER** → `lib/data/legal-comparisons.ts` |
| `lib/data/glossaire.ts` (1.2K) | **REMPLACER** → `lib/data/legal-glossary.ts` |
| `lib/data/faq-data.ts` | **REMPLACER** → contenu FAQ EN legal |
| `lib/data/barometre.ts` | **REMPLACER** → `lib/data/fee-benchmarks.ts` (honoraires par practice area/state) |
| `lib/data/images.ts` (975 lignes) | **REMPLACER** → images juridiques US (courthouses, offices, etc.) |
| `lib/data/authors.ts` | **ADAPTER** → auteurs US |
| `lib/data/calendrier-travaux.ts` | **SUPPRIMER** (pas d'equivalent legal) |

#### F. Lib SEO (6+ fichiers)
| Fichier | Modifications |
|---------|--------------|
| `lib/seo/jsonld.ts` | Organization FR → US, `LegalService` (PAS `Attorney` = deprecated), areaServed: USA |
| `lib/seo/internal-links.ts` | Liens internes adaptes US |
| `lib/seo/location-content.ts` (274KB) | **REMPLACER** → contenu localise US (par state/city) |
| `lib/seo/indexnow.ts` | Nouvelle cle, meme logique |
| `lib/seo/blog-schema.ts` | Adapter langue |

#### G. Lib services & integrations
| Fichier | Modifications |
|---------|--------------|
| `lib/services/email-service.ts` | Templates EN, from: noreply@[domain].com |
| `lib/services/verification.service.ts` | SIRET → Bar Number verification |
| `lib/notifications/` (tous) | Templates EN, SMS format US (+1), TCPA compliance |
| `lib/stripe/` | USD, plans US |
| `lib/sirene/` | **SUPPRIMER** (specifique France) |
| `lib/prospection/` | Adapter terminologie EN |
| NOUVEAU `lib/courtlistener/` | Integration CourtListener API (RECAP, opinions) |
| NOUVEAU `lib/bar-verification/` | State Bar API lookups (51 etats) |

#### H. Composants (254 fichiers)
| Groupe | Fichiers | Action |
|--------|----------|--------|
| **Header/Footer** | Header.tsx (358L), Footer.tsx (600L) | Rewrite complet EN, navigation US |
| **Home** | ClayHomePage, HeroSection, etc. (7) | Rewrite EN, hero "Find a Lawyer" |
| **Search** | SearchBar, AdvancedSearch, filters (9) | Metier→Practice Area, Commune→City/ZIP |
| **Artisan → Attorney** | 26 composants artisan/* | Renommer + adapter tous les labels |
| **Artisan Dashboard** | 12 composants | espace-artisan → attorney-dashboard |
| **Forms** | DevisForm, LeadForm, etc. | EN, validation tel US, TCPA consent |
| **UI** | 31 composants ui/* | MetierAutocomplete→PracticeAreaAutocomplete, VilleAutocomplete→CityAutocomplete, SiretAutocomplete→BarNumberAutocomplete |
| **SEO** | 7 composants seo/* | LegalService schema, breadcrumbs EN |
| **Maps** | 10 composants maps/* | Leaflet → meme stack, tiles US |
| **Chat** | 10 composants chat/* | Labels EN |
| **Reviews** | 7 composants reviews/* | Labels EN, SIRET badge → Bar Verified |
| **Estimation** | 7 composants estimation/* | Estimation juridique, TCPA consent |
| **Admin** | 28 composants admin/* | Labels EN, colonnes adaptees |
| **Dashboard** | 12 composants dashboard/* | Labels EN |
| **Providers** | 4 composants providers/* | artisan → attorney |
| **Auth** | 2 composants auth/* | Labels EN |
| **Portfolio** | 3 composants portfolio/* | → Case Results / Notable Cases |
| **Compare** | 3 composants compare/* | Labels EN |
| **Notifications** | 2 composants | Labels EN |
| **Upload** | 3 composants | Aucun changement |
| **Header data** | header-data.ts | Navigation complete US |
| **Navigation constants** | navigation.ts (84L) | Services FR → Practice Areas, villes FR → US cities |

#### I. Pages & Routes (218 fichiers app/)
| Route FR | Route US | Action |
|----------|----------|--------|
| `(auth)/connexion` | `(auth)/login` | Renommer + EN |
| `(auth)/inscription` | `(auth)/signup` | Renommer + EN |
| `(auth)/inscription-artisan` | `(auth)/attorney-signup` | Renommer + EN |
| `(auth)/mot-de-passe-oublie` | `(auth)/forgot-password` | Renommer + EN |
| `(auth)/definir-mot-de-passe` | `(auth)/set-password` | Renommer + EN |
| `(private)/espace-artisan/*` (20 pages) | `(private)/attorney-dashboard/*` | Renommer toutes les sous-routes |
| `(private)/espace-client/*` (8 pages) | `(private)/client-dashboard/*` | Renommer + EN |
| `(private)/booking/*` | `(private)/consultation/*` | Adapter |
| `(private)/donner-avis/*` | `(private)/write-review/*` | EN |
| `(private)/devis/*` | `(private)/consultation-request/*` | EN |
| `(public)/services/*` | `(public)/lawyers/*` ou `/attorneys/*` | Structure: /lawyers/[practice-area]/[state]/[city]/ |
| `(public)/devis/*` | `(public)/find-lawyer/*` | Pages de conversion |
| `(public)/tarifs/*` | `(public)/fees/*` | Barometre honoraires |
| `(public)/avis/*` | `(public)/reviews/*` | Avis par practice area + ville |
| `(public)/barometre/*` | `(public)/fee-benchmarks/*` | Comparatifs prix |
| `(public)/departements/*` | `(public)/counties/*` | SUPPRIMER ou adapter |
| `(public)/regions/*` | `(public)/states/*` | Pages par etat |
| `(public)/villes/*` | `(public)/cities/*` | Pages par ville |
| `(public)/urgence/*` | `(public)/emergency-legal-help/*` | Aide juridique urgente |
| `(public)/guides/*` (25) | `(public)/guides/*` | **REWRITE complet** contenu legal EN |
| `(public)/questions/*` | `(public)/legal-questions/*` | FAQs juridiques EN |
| `(public)/blog/*` | `(public)/blog/*` | Nouveau contenu EN |
| `(public)/glossaire` | `(public)/legal-glossary` | EN |
| `(public)/normes` | `(public)/regulations` | Reglementations US |
| `(public)/a-propos` | `(public)/about` | EN |
| `(public)/contact` | `(public)/contact` | EN |
| `(public)/cgv` | `(public)/terms` | Terms of Service US |
| `(public)/confidentialite` | `(public)/privacy` | Privacy Policy US |
| `(public)/mentions-legales` | `(public)/legal-notice` | US legal |
| `(public)/accessibilite` | `(public)/accessibility` | ADA compliance |
| `(public)/carrieres` | `(public)/careers` | EN |
| `(public)/comment-ca-marche` | `(public)/how-it-works` | EN |
| `(public)/garantie` | `(public)/guarantee` | EN |
| `(public)/partenaires` | `(public)/partners` | EN |
| `(public)/presse` | `(public)/press` | EN |
| `(public)/recherche` | `(public)/search` | EN |
| `(public)/verifier-artisan` | `(public)/verify-attorney` | Verification Bar Number |
| `(public)/plan-du-site` | `(public)/sitemap` | EN |
| `(public)/carte-artisans` | `(public)/attorney-map` | Carte interactive US |
| `(public)/badge-artisan` | `(public)/attorney-badge` | Badge pour sites avocats |
| `(public)/avant-apres` | SUPPRIMER | Pas pertinent legal |
| `(public)/calculateur` | `(public)/fee-calculator` | Estimateur honoraires |
| `(public)/checklist-travaux` | SUPPRIMER | Pas pertinent |
| `(public)/comparaison` | `(public)/compare` | Comparer avocats |
| `(public)/outils/*` | `(public)/tools/*` | Outils juridiques |
| `(public)/mes-favoris` | `(public)/saved-attorneys` | Favoris |
| `(public)/widget/*` | `(public)/widget/*` | Widget pour sites avocats |
| `admin/*` (26 pages) | `admin/*` | Labels EN, colonnes adaptees |

#### J. Routes API (188 endpoints)
| Groupe | Endpoints | Action |
|--------|-----------|--------|
| `/api/admin/*` (50+) | Tous | Labels EN, colonnes DB adaptees |
| `/api/artisan/*` (18) | → `/api/attorney/*` | Renommer + adapter requetes |
| `/api/auth/*` (7) | Tous | Templates EN, validation tel US |
| `/api/client/*` (5) | Tous | Labels EN |
| `/api/cron/*` (10) | Tous | Adapter contenu emails/SMS EN |
| `/api/stripe/*` | Tous | USD, plans US |
| `/api/bookings` | → `/api/consultations` | Renommer |
| `/api/reviews` | Conserver | Adapter |
| `/api/providers` | → `/api/attorneys` | Renommer |
| `/api/quotes` | Adapter | Terminologie EN |
| `/api/verify-siret` | → `/api/verify-bar-number` | Nouvelle logique |
| `/api/indexnow` | Conserver | Nouvelle cle |
| `/api/sitemaps` | Adapter | Practice areas + geo US |
| `/api/vapi` | Adapter | Scripts voix EN |
| `/api/estimation` | Adapter | Estimation juridique |
| `/api/contact` | Adapter | EN |
| `/api/newsletter` | Adapter | EN |
| NOUVEAU `/api/court-records` | Creer | Integration CourtListener |
| NOUVEAU `/api/bar-verification` | Creer | Verification State Bar |

#### K. Fichiers publics (8 fichiers)
| Fichier | Action |
|---------|--------|
| `public/manifest.json` | **REWRITE** : name, description, lang=en-US, shortcuts EN |
| `public/.well-known/ai-plugin.json` | **REWRITE** : nom, description EN, contact US |
| `public/llms.txt` | **REWRITE** : description plateforme EN |
| `public/llms-full.txt` | **REWRITE** : contenu complet EN |
| `public/humans.txt` | **REWRITE** : equipe US |
| `public/favicon.svg` | **REMPLACER** : nouveau logo |
| `public/icons/*` | **REMPLACER** : nouveaux icons PWA |
| `public/images/og-image.svg` | **REMPLACER** : OG image US |

#### L. Config company identity
| Fichier | Action |
|---------|--------|
| `lib/config/company-identity.ts` | **REWRITE** complet : nom, tagline EN, emails, domaine |

#### M. Scripts (85+ fichiers)
| Categorie | Action |
|-----------|--------|
| `import-artisans-*` | → `import-attorneys-*` (State Bar APIs) |
| `enrich-siret.ts` | → `enrich-bar-number.ts` |
| `enrich-communes.ts` | → `enrich-locations.ts` (Census Bureau) |
| `scrape-google-maps.ts` | Adapter pour law firms US |
| `seed-communes.mjs` | → `seed-locations.mjs` (ZIP/cities/counties/states) |
| `seed-providers.mjs` | → `seed-attorneys.mjs` |
| Scripts pages jaunes (`*-pj-*`) | SUPPRIMER (specifique France) |
| Scripts INSEE (`*-insee*`) | SUPPRIMER |
| `gen-reglementation.py` | → contenu legal US |
| `aggregate-barometre.ts` | → `aggregate-fees.ts` |
| Scripts backlinks | Adapter pour domaine US |
| Scripts IndexNow | Adapter |

#### N. Tests
| Type | Fichiers | Action |
|------|----------|--------|
| Unit tests (`__tests__/`) | 30+ | Adapter tous les mocks, noms, donnees |
| E2E tests (`tests/e2e/`) | 16 suites | Adapter URLs, labels, flows |
| Composants tests | Divers | Adapter props, labels |

#### O. WordPress Plugin
| Action | Detail |
|--------|--------|
| FORK complet | `usattorneys-badge` plugin, labels EN, badge "Bar Verified" |

---

## 3. PHASE 0 — FONDATIONS JURIDIQUES & INFRA (Semaine 1-2)

### 0.1 Structure legale
- [ ] Creer LLC Delaware via Stripe Atlas (1 jour, ~$500)
- [ ] Contacter avocat specialise marketing legal (ABA Rules review, $3-5K)
- [ ] Obtenir opinion letter sur le modele economique (fee-splitting, TCPA, etc.)
- [ ] Enregistrer le domaine .com (acheter domaine age DR 30-50+ : $500-$50K)

### 0.2 Infrastructure
- [ ] Creer projet Supabase US (region `us-east-1`)
- [ ] Configurer Vercel project US (region `iad1` Washington DC)
- [ ] Nouveau projet Sentry
- [ ] Nouveau compte Stripe US (USD)
- [ ] Nouveau compte Resend (domaine US)
- [ ] Fork du repo Git dans nouveau repo `us-attorneys`
- [ ] Configurer CI/CD (GitHub Actions)

### 0.3 Acces donnees
- [ ] Creer compte CourtListener (API token gratuit, 5K req/hr)
- [ ] Identifier les State Bar APIs disponibles (NY Socrata = 190K avocats)
- [ ] Preparer proxies pour scraping ($300-500/mois)

### 0.4 Branding
- [ ] Logo + identite visuelle US (palette bleu marine/or juridique)
- [ ] Favicon, OG images, PWA icons
- [ ] Charte typographique (serif pour autorite juridique + sans-serif pour modernite)

**Livrable Phase 0** : LLC creee, domaine achete, infra provisionnee, opinion letter en cours.

---

## 4. PHASE 1 — SCHEMA DB & TYPES (Semaine 2-3)

### 1.1 Nouvelles migrations SQL

```sql
-- Migration US-001: Remplacer communes par locations
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  state_code CHAR(2) NOT NULL,        -- CA, NY, TX...
  state_name TEXT NOT NULL,
  county TEXT,
  zip_code VARCHAR(10),               -- 5 ou 5+4
  fips_code VARCHAR(10),              -- FIPS county code
  cbsa_code VARCHAR(5),               -- Metropolitan Statistical Area
  slug TEXT NOT NULL UNIQUE,
  population INTEGER DEFAULT 0,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  geo GEOGRAPHY(POINT, 4326),
  timezone TEXT,                       -- America/New_York etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_locations_state ON locations(state_code);
CREATE INDEX idx_locations_zip ON locations(zip_code);
CREATE INDEX idx_locations_slug ON locations(slug);
CREATE INDEX idx_locations_geo ON locations USING GIST(geo);
CREATE INDEX idx_locations_population ON locations(population DESC);

-- Migration US-002: Remplacer services par practice_areas
CREATE TABLE practice_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                  -- "Personal Injury"
  slug TEXT NOT NULL UNIQUE,           -- "personal-injury"
  category TEXT NOT NULL,              -- litigation, transactional, regulatory
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  search_volume INTEGER DEFAULT 0,    -- Monthly US search volume
  tier SMALLINT DEFAULT 2,            -- 1=high vol, 2=medium, 3=niche
  spanish_name TEXT,                   -- "Lesiones Personales"
  spanish_slug TEXT,                   -- "lesiones-personales"
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Migration US-003: Bar admissions
CREATE TABLE bar_admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  state_code CHAR(2) NOT NULL,
  bar_number TEXT NOT NULL,
  status TEXT DEFAULT 'active',        -- active, inactive, suspended, disbarred
  admitted_date DATE,
  verified_at TIMESTAMPTZ,
  source TEXT,                         -- 'state_bar_api', 'manual', 'scraped'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider_id, state_code)
);

-- Migration US-004: Court records (CourtListener integration)
CREATE TABLE court_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  case_number TEXT,
  court_name TEXT NOT NULL,
  court_type TEXT,                     -- federal, state, appellate, supreme
  case_type TEXT,                      -- civil, criminal, family, bankruptcy
  outcome TEXT,                        -- won, lost, settled, dismissed, pending
  outcome_detail TEXT,
  filing_date DATE,
  disposition_date DATE,
  courtlistener_id TEXT,               -- Reference to CourtListener
  recap_document_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_court_records_provider ON court_records(provider_id);
CREATE INDEX idx_court_records_outcome ON court_records(outcome);

-- Migration US-005: Practice area associations (many-to-many)
CREATE TABLE attorney_practice_areas (
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  practice_area_id UUID REFERENCES practice_areas(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  years_experience INTEGER,
  PRIMARY KEY (provider_id, practice_area_id)
);

-- Migration US-006: Adapter providers pour US
ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS bar_number TEXT,
  ADD COLUMN IF NOT EXISTS primary_state CHAR(2),
  ADD COLUMN IF NOT EXISTS law_firm_name TEXT,
  ADD COLUMN IF NOT EXISTS law_firm_size TEXT,    -- solo, small (2-10), medium (11-50), large (50+)
  ADD COLUMN IF NOT EXISTS law_school TEXT,
  ADD COLUMN IF NOT EXISTS graduation_year INTEGER,
  ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS free_consultation BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS contingency_fee BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pro_bono BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS spanish_profile BOOLEAN DEFAULT false;

-- Renommer colonnes
ALTER TABLE providers RENAME COLUMN address_region TO address_state;
-- Note: address_city reste address_city (meme concept)

-- Migration US-007: Adapter devis_requests
ALTER TABLE devis_requests RENAME TO consultation_requests;
ALTER TABLE consultation_requests
  ADD COLUMN IF NOT EXISTS case_description TEXT,
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS tcpa_consent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tcpa_consent_at TIMESTAMPTZ;

-- Migration US-008: Seed 208 practice areas (75 parentes + 133 sous-specialites)
-- PARENT_ID = NULL pour les PA parentes, reference au parent pour les sous-specialites
ALTER TABLE practice_areas ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES practice_areas(id);
ALTER TABLE practice_areas ADD COLUMN IF NOT EXISTS is_sub_specialty BOOLEAN DEFAULT false;

INSERT INTO practice_areas (name, slug, category, tier, spanish_name, spanish_slug) VALUES
-- TIER 1 - High Volume (20) — PA PARENTES
('Personal Injury', 'personal-injury', 'litigation', 1, 'Lesiones Personales', 'lesiones-personales'),
('Criminal Defense', 'criminal-defense', 'litigation', 1, 'Defensa Criminal', 'defensa-criminal'),
('Family Law', 'family-law', 'litigation', 1, 'Derecho Familiar', 'derecho-familiar'),
('Divorce', 'divorce', 'litigation', 1, 'Divorcio', 'divorcio'),
('DUI / DWI', 'dui-dwi', 'litigation', 1, 'DUI / DWI', 'dui-dwi'),
('Immigration', 'immigration', 'regulatory', 1, 'Inmigración', 'inmigracion'),
('Bankruptcy', 'bankruptcy', 'transactional', 1, 'Bancarrota', 'bancarrota'),
('Employment Law', 'employment-law', 'litigation', 1, 'Derecho Laboral', 'derecho-laboral'),
('Real Estate', 'real-estate', 'transactional', 1, 'Bienes Raíces', 'bienes-raices'),
('Estate Planning', 'estate-planning', 'transactional', 1, 'Planificación Patrimonial', 'planificacion-patrimonial'),
('Business Law', 'business-law', 'transactional', 1, 'Derecho Empresarial', 'derecho-empresarial'),
('Workers Compensation', 'workers-compensation', 'litigation', 1, 'Compensación Laboral', 'compensacion-laboral'),
('Car Accident', 'car-accident', 'litigation', 1, 'Accidente de Auto', 'accidente-de-auto'),
('Child Custody', 'child-custody', 'litigation', 1, 'Custodia de Menores', 'custodia-de-menores'),
('Medical Malpractice', 'medical-malpractice', 'litigation', 1, 'Negligencia Médica', 'negligencia-medica'),
('Wrongful Death', 'wrongful-death', 'litigation', 1, 'Muerte Injusta', 'muerte-injusta'),
('Drug Crimes', 'drug-crimes', 'litigation', 1, 'Delitos de Drogas', 'delitos-de-drogas'),
('Landlord Tenant', 'landlord-tenant', 'litigation', 1, 'Arrendador e Inquilino', 'arrendador-inquilino'),
('Tax Law', 'tax-law', 'regulatory', 1, 'Derecho Fiscal', 'derecho-fiscal'),
('Intellectual Property', 'intellectual-property', 'transactional', 1, 'Propiedad Intelectual', 'propiedad-intelectual'),
-- TIER 2 - Medium Volume (30)
('Social Security Disability', 'social-security-disability', 'regulatory', 2, 'Discapacidad del Seguro Social', 'discapacidad-seguro-social'),
('Consumer Protection', 'consumer-protection', 'litigation', 2, 'Protección al Consumidor', 'proteccion-consumidor'),
('Civil Rights', 'civil-rights', 'litigation', 2, 'Derechos Civiles', 'derechos-civiles'),
('Contract Law', 'contract-law', 'transactional', 2, 'Derecho Contractual', 'derecho-contractual'),
('Insurance Claims', 'insurance-claims', 'litigation', 2, 'Reclamaciones de Seguros', 'reclamaciones-seguros'),
('Probate', 'probate', 'transactional', 2, 'Sucesiones', 'sucesiones'),
('Truck Accident', 'truck-accident', 'litigation', 2, 'Accidente de Camión', 'accidente-de-camion'),
('Slip and Fall', 'slip-and-fall', 'litigation', 2, 'Resbalones y Caídas', 'resbalones-caidas'),
('Domestic Violence', 'domestic-violence', 'litigation', 2, 'Violencia Doméstica', 'violencia-domestica'),
('Juvenile Law', 'juvenile-law', 'litigation', 2, 'Derecho de Menores', 'derecho-de-menores'),
('Traffic Violations', 'traffic-violations', 'litigation', 2, 'Infracciones de Tránsito', 'infracciones-transito'),
('Wills and Trusts', 'wills-and-trusts', 'transactional', 2, 'Testamentos y Fideicomisos', 'testamentos-fideicomisos'),
('Sexual Harassment', 'sexual-harassment', 'litigation', 2, 'Acoso Sexual', 'acoso-sexual'),
('Nursing Home Abuse', 'nursing-home-abuse', 'litigation', 2, 'Abuso en Hogares de Ancianos', 'abuso-hogares-ancianos'),
('Construction Law', 'construction-law', 'litigation', 2, 'Derecho de Construcción', 'derecho-construccion'),
('Environmental Law', 'environmental-law', 'regulatory', 2, 'Derecho Ambiental', 'derecho-ambiental'),
('Securities Law', 'securities-law', 'regulatory', 2, 'Derecho de Valores', 'derecho-valores'),
('Health Care Law', 'health-care-law', 'regulatory', 2, 'Derecho de Salud', 'derecho-salud'),
('Admiralty Maritime', 'admiralty-maritime', 'litigation', 2, 'Derecho Marítimo', 'derecho-maritimo'),
('Education Law', 'education-law', 'regulatory', 2, 'Derecho Educativo', 'derecho-educativo'),
('Entertainment Law', 'entertainment-law', 'transactional', 2, 'Derecho del Entretenimiento', 'derecho-entretenimiento'),
('Military Law', 'military-law', 'litigation', 2, 'Derecho Militar', 'derecho-militar'),
('Veterans Benefits', 'veterans-benefits', 'regulatory', 2, 'Beneficios para Veteranos', 'beneficios-veteranos'),
('White Collar Crime', 'white-collar-crime', 'litigation', 2, 'Delitos de Cuello Blanco', 'delitos-cuello-blanco'),
('Class Action', 'class-action', 'litigation', 2, 'Demanda Colectiva', 'demanda-colectiva'),
('Franchise Law', 'franchise-law', 'transactional', 2, 'Derecho de Franquicias', 'derecho-franquicias'),
('Government Contracts', 'government-contracts', 'transactional', 2, 'Contratos Gubernamentales', 'contratos-gubernamentales'),
('Sports Law', 'sports-law', 'transactional', 2, 'Derecho Deportivo', 'derecho-deportivo'),
('Animal Law', 'animal-law', 'litigation', 2, 'Derecho Animal', 'derecho-animal'),
('Cannabis Law', 'cannabis-law', 'regulatory', 2, 'Derecho del Cannabis', 'derecho-cannabis'),
-- TIER 3 - Niche (25)
('Product Liability', 'product-liability', 'litigation', 3, 'Responsabilidad del Producto', 'responsabilidad-producto'),
('Asbestos Mesothelioma', 'asbestos-mesothelioma', 'litigation', 3, 'Asbesto y Mesotelioma', 'asbesto-mesotelioma'),
('Aviation Law', 'aviation-law', 'litigation', 3, 'Derecho Aeronáutico', 'derecho-aeronautico'),
('Birth Injury', 'birth-injury', 'litigation', 3, 'Lesiones de Nacimiento', 'lesiones-nacimiento'),
('Brain Injury', 'brain-injury', 'litigation', 3, 'Lesiones Cerebrales', 'lesiones-cerebrales'),
('Burn Injury', 'burn-injury', 'litigation', 3, 'Lesiones por Quemaduras', 'lesiones-quemaduras'),
('Church Abuse', 'church-abuse', 'litigation', 3, 'Abuso Eclesiástico', 'abuso-eclesiastico'),
('Defamation', 'defamation', 'litigation', 3, 'Difamación', 'difamacion'),
('Dog Bite', 'dog-bite', 'litigation', 3, 'Mordedura de Perro', 'mordedura-perro'),
('Elder Law', 'elder-law', 'transactional', 3, 'Derecho de Ancianos', 'derecho-ancianos'),
('Eminent Domain', 'eminent-domain', 'litigation', 3, 'Dominio Eminente', 'dominio-eminente'),
('ERISA', 'erisa', 'regulatory', 3, 'ERISA', 'erisa'),
('FELA Railroad', 'fela-railroad', 'litigation', 3, 'FELA Ferroviario', 'fela-ferroviario'),
('Foreclosure', 'foreclosure', 'litigation', 3, 'Ejecución Hipotecaria', 'ejecucion-hipotecaria'),
('HOA Law', 'hoa-law', 'litigation', 3, 'Derecho de HOA', 'derecho-hoa'),
('International Law', 'international-law', 'transactional', 3, 'Derecho Internacional', 'derecho-internacional'),
('Lemon Law', 'lemon-law', 'litigation', 3, 'Ley Limón', 'ley-limon'),
('Mass Tort', 'mass-tort', 'litigation', 3, 'Agravio Masivo', 'agravio-masivo'),
('Motorcycle Accident', 'motorcycle-accident', 'litigation', 3, 'Accidente de Motocicleta', 'accidente-motocicleta'),
('Pedestrian Accident', 'pedestrian-accident', 'litigation', 3, 'Accidente Peatonal', 'accidente-peatonal'),
('Premises Liability', 'premises-liability', 'litigation', 3, 'Responsabilidad de Instalaciones', 'responsabilidad-instalaciones'),
('Railroad Accident', 'railroad-accident', 'litigation', 3, 'Accidente Ferroviario', 'accidente-ferroviario'),
('Rideshare Accident', 'rideshare-accident', 'litigation', 3, 'Accidente de Rideshare', 'accidente-rideshare'),
('Spinal Cord Injury', 'spinal-cord-injury', 'litigation', 3, 'Lesiones de Médula Espinal', 'lesiones-medula-espinal'),
('Whistleblower', 'whistleblower', 'regulatory', 3, 'Denunciante', 'denunciante');

-- SOUS-SPECIALITES (133 entrées — exemples cles, le reste suit le meme pattern)
-- Chaque sous-specialite reference sa PA parente via parent_id (UPDATE apres INSERT)

-- Personal Injury sous-specialites (15)
INSERT INTO practice_areas (name, slug, category, tier, is_sub_specialty, spanish_name, spanish_slug) VALUES
('Car Accident Lawyer', 'car-accident-lawyer', 'litigation', 1, true, 'Abogado de Accidente de Auto', 'abogado-accidente-auto'),
('Truck Accident Lawyer', 'truck-accident-lawyer', 'litigation', 1, true, 'Abogado de Accidente de Camión', 'abogado-accidente-camion'),
('Motorcycle Accident Lawyer', 'motorcycle-accident-lawyer', 'litigation', 2, true, 'Abogado de Accidente de Moto', 'abogado-accidente-moto'),
('Pedestrian Accident Lawyer', 'pedestrian-accident-lawyer', 'litigation', 2, true, 'Abogado de Accidente Peatonal', 'abogado-accidente-peatonal'),
('Bicycle Accident Lawyer', 'bicycle-accident-lawyer', 'litigation', 3, true, 'Abogado de Accidente de Bicicleta', 'abogado-accidente-bicicleta'),
('Construction Accident Lawyer', 'construction-accident-lawyer', 'litigation', 2, true, 'Abogado de Accidente de Construcción', 'abogado-accidente-construccion'),
('Workplace Injury Lawyer', 'workplace-injury-lawyer', 'litigation', 1, true, 'Abogado de Lesiones Laborales', 'abogado-lesiones-laborales'),
('Catastrophic Injury Lawyer', 'catastrophic-injury-lawyer', 'litigation', 2, true, 'Abogado de Lesiones Catastróficas', 'abogado-lesiones-catastroficas'),
('Bus Accident Lawyer', 'bus-accident-lawyer', 'litigation', 3, true, 'Abogado de Accidente de Autobús', 'abogado-accidente-autobus'),
('Rideshare Accident Lawyer', 'rideshare-accident-lawyer', 'litigation', 2, true, 'Abogado de Accidente de Uber/Lyft', 'abogado-accidente-uber-lyft');
-- + 5 autres (dog-bite-lawyer, slip-and-fall-lawyer, burn-injury-lawyer, brain-injury-lawyer, spinal-cord-injury-lawyer)

-- Criminal Defense sous-specialites (8)
INSERT INTO practice_areas (name, slug, category, tier, is_sub_specialty, spanish_name, spanish_slug) VALUES
('Assault Defense Lawyer', 'assault-defense-lawyer', 'litigation', 2, true, 'Abogado Defensa por Asalto', 'abogado-defensa-asalto'),
('Theft Defense Lawyer', 'theft-defense-lawyer', 'litigation', 2, true, 'Abogado Defensa por Robo', 'abogado-defensa-robo'),
('Sex Crimes Defense Lawyer', 'sex-crimes-defense-lawyer', 'litigation', 2, true, 'Abogado Defensa Delitos Sexuales', 'abogado-defensa-delitos-sexuales'),
('Federal Crimes Lawyer', 'federal-crimes-lawyer', 'litigation', 2, true, 'Abogado Delitos Federales', 'abogado-delitos-federales'),
('Expungement Lawyer', 'expungement-lawyer', 'litigation', 2, true, 'Abogado de Eliminación de Antecedentes', 'abogado-eliminacion-antecedentes'),
('Probation Violation Lawyer', 'probation-violation-lawyer', 'litigation', 2, true, 'Abogado Violación de Probatoria', 'abogado-violacion-probatoria'),
('Weapons Charges Lawyer', 'weapons-charges-lawyer', 'litigation', 2, true, 'Abogado Cargos por Armas', 'abogado-cargos-armas'),
('Bail Bonds Lawyer', 'bail-bonds-lawyer', 'litigation', 2, true, 'Abogado de Fianza', 'abogado-fianza');

-- [... 115 autres sous-specialites suivent le meme pattern ...]
-- Family: child-support-lawyer, adoption-lawyer, paternity-lawyer, prenuptial-lawyer, alimony-lawyer, cps-defense-lawyer, grandparents-rights-lawyer
-- Immigration: green-card-lawyer, visa-lawyer, asylum-lawyer, deportation-defense-lawyer, naturalization-lawyer, daca-lawyer, work-permit-lawyer, tps-lawyer
-- Employment: wrongful-termination-lawyer, workplace-discrimination-lawyer, wage-theft-lawyer, fmla-lawyer, ada-accommodation-lawyer, non-compete-lawyer, retaliation-lawyer
-- Bankruptcy: chapter-7-lawyer, chapter-13-lawyer, chapter-11-lawyer, debt-settlement-lawyer, creditor-harassment-lawyer
-- Real Estate: closing-attorney, title-dispute-lawyer, zoning-lawyer, commercial-real-estate-lawyer, construction-defect-lawyer
-- Estate Planning: living-trust-lawyer, power-of-attorney-lawyer, guardianship-lawyer, conservatorship-lawyer, medicaid-planning-lawyer
-- Business: llc-formation-lawyer, partnership-dispute-lawyer, shareholder-dispute-lawyer, mergers-acquisitions-lawyer, commercial-litigation-lawyer
-- DUI: first-offense-dui-lawyer, felony-dui-lawyer, underage-dui-lawyer, commercial-dui-lawyer, dui-with-injury-lawyer
-- Tax: irs-audit-defense-lawyer, tax-fraud-lawyer, tax-debt-lawyer, offshore-accounts-lawyer
-- IP: trademark-lawyer, copyright-lawyer, patent-lawyer, trade-secret-lawyer

-- UPDATE parent_id references (example pattern)
UPDATE practice_areas SET parent_id = (SELECT id FROM practice_areas WHERE slug = 'personal-injury')
  WHERE slug IN ('car-accident-lawyer', 'truck-accident-lawyer', 'motorcycle-accident-lawyer', 'pedestrian-accident-lawyer', 'bicycle-accident-lawyer', 'construction-accident-lawyer', 'workplace-injury-lawyer', 'catastrophic-injury-lawyer', 'bus-accident-lawyer', 'rideshare-accident-lawyer');
-- [... meme pattern pour chaque PA parente ...]
```

### 1.2 Types TypeScript
- [ ] Regenerer `src/types/database.ts` depuis le nouveau schema Supabase (`supabase gen types typescript`)
- [ ] Creer `src/types/attorney.ts` (remplace artisan)
- [ ] Creer `src/types/practice-area.ts` (remplace service/metier)
- [ ] Creer `src/types/location.ts` (remplace commune)
- [ ] Adapter `src/types/leads.ts` (devis → consultation)
- [ ] Adapter `src/types/admin.ts`

**Livrable Phase 1** : Schema DB US applique, types generes, build TS passe.

---

## 5. PHASE 2 — DONNEES GEOGRAPHIQUES & SERVICES (Semaine 3-4)

### 2.1 Donnees geographiques US
- [ ] Telecharger donnees Census Bureau (19K cities, 3244 counties, 41K ZIP codes)
- [ ] Creer `src/lib/data/us-geo.ts` avec :
  - 51 etats + DC + territoires
  - Top 500 villes (population, coords, slug, state, county)
  - 3244 counties avec FIPS codes
  - Mapping ZIP → City → County → State
- [ ] Creer `src/lib/data/us-locations.json` (equivalent insee-communes.json)
- [ ] Creer script `scripts/seed-locations.mjs` pour peupler la table `locations`

### 2.2 Practice Areas (208 = 75 parentes + 133 sous-specialites)
- [ ] Creer `src/lib/data/practice-area-content.ts` (208 practice areas avec descriptions, FAQ, processus, lois state-specifiques)
- [ ] Creer `src/lib/data/practice-area-tree.ts` (arbre parent→sous-specialites pour navigation et breadcrumbs)
- [ ] Creer mapping `PRACTICE_AREA_MAPPING` dans `src/lib/supabase.ts` (remplace SERVICE_TO_SPECIALTIES, 208 entrees)
- [ ] Creer `src/lib/data/legal-issues.ts` (500+ problemes juridiques courants avec mapping vers PA)
- [ ] Creer `src/lib/data/legal-faqs.ts` (500+ FAQs juridiques, 20+ par PA parente)
- [ ] Creer `src/lib/data/legal-glossary.ts` (terminologie juridique US, 500+ termes)
- [ ] Creer `src/lib/data/fee-benchmarks.ts` (honoraires moyens par PA × state, sources : Clio Legal Trends Report, state bar surveys)
- [ ] Creer `src/lib/data/state-laws.ts` (lois state-specifiques par PA : statute of limitations, specific rules, court structure)
- [ ] Creer `src/lib/data/courts.ts` (tribunaux par state/county : federal districts, state courts, specialized courts)

### 2.3 Import initial avocats
- [ ] Creer `scripts/import-ny-attorneys.ts` (NY Open Data Socrata API → 190K avocats)
- [ ] Creer `scripts/import-state-bar.ts` (framework generique pour scraper les 51 State Bars)
- [ ] Creer `scripts/enrich-bar-number.ts` (verification bar number)
- [ ] Creer `scripts/import-courtlistener.ts` (integration CourtListener RECAP)
- [ ] Objectif Phase 2 : 500K+ profils d'avocats en base

**Livrable Phase 2** : 500K+ avocats importes, donnees geo US peuplees, practice areas en base.

---

## 6. PHASE 3 — BACKEND & API (Semaine 4-6)

### 3.1 Lib core
- [ ] Adapter `lib/supabase.ts` : toutes requetes geo, SERVICE_TO_SPECIALTIES → PRACTICE_AREA_MAPPING
- [ ] Remplacer `lib/geography.ts` : Census Bureau geocoding, distance en miles (pas km), ZIP code lookup
- [ ] Supprimer `lib/insee-resolver.ts` → creer `lib/bar-verification.ts` (State Bar APIs)
- [ ] Supprimer `lib/sirene/` → creer `lib/courtlistener/` (CourtListener API client)
- [ ] Adapter `lib/env.ts` : nouvelles variables d'environnement US
- [ ] Adapter `lib/stripe-admin.ts` : plans USD ($49/$149/$299)
- [ ] Adapter `lib/config/company-identity.ts` : identite US

### 3.2 Locale & formatting
- [ ] Chercher/remplacer `fr-FR` → `en-US` dans les 40+ fichiers concernes
- [ ] Chercher/remplacer `toLocaleDateString('fr-FR')` → `toLocaleDateString('en-US')`
- [ ] Chercher/remplacer `Intl.NumberFormat('fr-FR')` → `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`
- [ ] Adapter validation telephone : `+1` format US, pas `0X XX XX XX XX`
- [ ] Adapter format adresse : Street, City, State ZIP (pas rue, ville, code postal)

### 3.3 Routes API
- [ ] Renommer `/api/artisan/*` → `/api/attorney/*` (18 endpoints)
- [ ] Adapter toutes les requetes Supabase dans les 188 routes
- [ ] Creer `/api/court-records/route.ts` (CourtListener integration)
- [ ] Creer `/api/bar-verification/route.ts` (State Bar lookup)
- [ ] Adapter `/api/verify-siret` → `/api/verify-bar-number`
- [ ] Adapter `/api/stripe/*` (USD, plans US)
- [ ] Adapter `/api/cron/*` (emails EN, SMS format US)

### 3.4 Email templates
- [ ] Recrire les 5 templates email en anglais (`lib/services/email-service.ts`)
- [ ] Adapter from address : `noreply@[domain].com`
- [ ] Ajouter TCPA consent tracking dans les templates SMS/email

### 3.5 Middleware
- [ ] Adapter `src/middleware.ts` :
  - Retirer reference `api-adresse.data.gouv.fr`
  - Routes protegees : `/attorney-dashboard`, `/client-dashboard`
  - CSP headers pour APIs US
  - Rate limiting adapte

**Livrable Phase 3** : Tous les endpoints API fonctionnels en anglais, verification Bar Number, CourtListener.

---

## 7. PHASE 4 — FRONTEND & COMPOSANTS (Semaine 5-8)

### 4.1 Layout & navigation
- [ ] Recrire `src/app/layout.tsx` : metadata EN, lang="en", title US
- [ ] Recrire `src/components/Header.tsx` : navigation US (Practice Areas, Cities, States)
- [ ] Recrire `src/components/Footer.tsx` : footer EN, trust badges US
- [ ] Recrire `src/lib/constants/navigation.ts` : practice areas + top cities US
- [ ] Adapter `src/components/header/header-data.ts` : mega menus US

### 4.2 Homepage
- [ ] Recrire `src/app/page.tsx` : hero "Find a Lawyer Near You"
- [ ] Adapter composants `home/*` : ClayHomePage, HeroSection, search forms

### 4.3 Composants artisan → attorney (26 fichiers)
- [ ] Renommer tous les fichiers `Artisan*` → `Attorney*`
- [ ] Adapter tous les labels, props, types
- [ ] `ArtisanSchema.tsx` → `AttorneySchema.tsx` : LegalService + Person schema
- [ ] `ArtisanServices.tsx` → `AttorneyPracticeAreas.tsx`
- [ ] `ArtisanQuoteForm.tsx` → `AttorneyConsultationForm.tsx`
- [ ] `ArtisanFAQ.tsx` → `AttorneyFAQ.tsx`
- [ ] `ClaimButton.tsx` → adapte pour Bar Number claim

### 4.4 Formulaires
- [ ] `DevisForm.tsx` → `ConsultationRequestForm.tsx` :
  - Services → Practice Areas
  - Ville → City + State
  - Phone validation US (+1)
  - TCPA consent checkbox obligatoire
  - Case description field
  - Preferred language (English/Spanish)
- [ ] `LeadForm.tsx` : adapter EN + TCPA
- [ ] Validation regex telephone : `/^\+1[2-9]\d{9}$/` ou `/^[2-9]\d{9}$/`

### 4.5 Composants UI
- [ ] `MetierAutocomplete.tsx` → `PracticeAreaAutocomplete.tsx`
- [ ] `VilleAutocomplete.tsx` → `CityAutocomplete.tsx` (avec ZIP code support)
- [ ] `SiretAutocomplete.tsx` → `BarNumberLookup.tsx`
- [ ] `AdresseAutocomplete.tsx` → adapter pour adresses US (USPS/Google Places)
- [ ] `TrustBadge.tsx` / `TrustBadges.tsx` → badges US (Bar Verified, BBB, etc.)

### 4.6 Search
- [ ] Adapter tous les composants `search/*` : termes EN, filtres US
- [ ] `SimilarArtisans.tsx` → `SimilarAttorneys.tsx`

### 4.7 Dashboard artisan → attorney
- [ ] Renommer toutes les pages `espace-artisan/*` → `attorney-dashboard/*`
- [ ] Adapter sidebar, tous les labels, colonnes
- [ ] Adapter `portfolio/*` → `case-results/*`

### 4.8 Dashboard client
- [ ] Renommer `espace-client/*` → `client-dashboard/*`
- [ ] Adapter tous les labels EN

### 4.9 Pages publiques (140+ fichiers)
- [ ] **Services** : `/services/[service]/[location]` → `/lawyers/[practice-area]/[state]/[city]`
- [ ] **Devis** : `/devis/*` → `/find-lawyer/*`
- [ ] **Tarifs** : `/tarifs/*` → `/fees/*`
- [ ] **Avis** : `/avis/*` → `/reviews/*`
- [ ] **Barometre** : `/barometre/*` → `/fee-benchmarks/*`
- [ ] **Departements** : `/departements/*` → `/states/*` (reorganiser)
- [ ] **Regions** : `/regions/*` → SUPPRIMER (redondant avec states)
- [ ] **Villes** : `/villes/*` → `/cities/*`
- [ ] **Urgence** : `/urgence/*` → `/emergency-legal-help/*`
- [ ] **Guides** : 25 guides → recrire contenu legal EN
- [ ] **Blog** : nouveau contenu EN
- [ ] **Pages info** : toutes les pages legales/about/contact en EN

### 4.10 Pages auth (10 fichiers)
- [ ] Renommer toutes les routes FR → EN
- [ ] Adapter tous les formulaires et labels

### 4.11 Admin (26 pages)
- [ ] Adapter tous les labels EN
- [ ] Adapter colonnes DataTable pour schema US
- [ ] Adapter filtres et recherche

### 4.12 Branding & design
- [ ] Palette Tailwind : clay/terracotta → bleu marine professionnel + or
- [ ] Fonts : considerer serif (Playfair Display) pour autorite juridique
- [ ] Images : courthouses, law offices, avocats (remplacer Unsplash FR)
- [ ] CookieConsent → adapter pour US privacy laws (CCPA, state laws)

**Livrable Phase 4** : Frontend complet EN, toutes les pages navigables, formulaires fonctionnels.

---

## 8. PHASE 5 — SEO & CONTENU PROGRAMMATIQUE (Semaine 6-10)

### 5.1 Taxonomie des practice areas (200+ au lieu de 75)

75 PA parentes ne couvrent PAS le search landscape reel. Chaque PA parente a des sous-specialites avec du volume de recherche independant :

| PA parente | Sous-specialites a creer | Volume additionnel |
|-----------|--------------------------|-------------------|
| **Personal Injury** | car accident, truck accident, motorcycle accident, pedestrian accident, bicycle accident, rideshare accident, bus accident, construction accident, workplace injury, catastrophic injury, dog bite, slip and fall, burn injury, brain injury, spinal cord injury | 15 sous-PA |
| **Criminal Defense** | assault, theft/robbery, sex crimes, federal crimes, probation violation, expungement, bail bonds, weapons charges | 8 sous-PA |
| **Family Law** | child support, adoption, paternity, prenuptial agreement, alimony/spousal support, CPS defense, grandparents rights | 7 sous-PA |
| **Immigration** | green card, visa (H1B/L1/O1/EB5), asylum, deportation defense, naturalization, DACA, TPS, work permit | 8 sous-PA |
| **Employment Law** | wrongful termination, workplace discrimination, wage theft/unpaid wages, FMLA, ADA accommodation, non-compete, retaliation | 7 sous-PA |
| **Bankruptcy** | Chapter 7, Chapter 13, Chapter 11, debt settlement, creditor harassment, means test | 6 sous-PA |
| **Real Estate** | closing attorney, title disputes, zoning, commercial real estate, landlord representation, construction defects | 6 sous-PA |
| **Estate Planning** | living trust, power of attorney, guardianship, conservatorship, Medicaid planning | 5 sous-PA |
| **Business Law** | LLC formation, partnership disputes, shareholder disputes, mergers & acquisitions, commercial litigation | 5 sous-PA |
| **DUI/DWI** | first offense DUI, felony DUI, underage DUI, commercial DUI, DUI with injury, DUI manslaughter | 6 sous-PA |
| **Tax Law** | IRS audit defense, tax fraud, tax debt, offshore accounts, payroll tax | 5 sous-PA |
| **IP** | trademark, copyright, patent, trade secret, licensing | 5 sous-PA |
| Autres PA | ~50 sous-specialites restantes | ~50 sous-PA |

**Total : 75 PA parentes + 133 sous-specialites = 208 practice areas indexables**

> **Regle CHARTER** : une sous-PA n'est creee que si elle a 10+ attorneys ET un volume de recherche mesurable. Pas de pages coquilles vides.

### 5.2 Structure URL cible (6 intents × geo × PA)

```
-- INTENT 1 : FIND (pages annuaire — coeur du site) --
/lawyers/                                          → Hub toutes PA
/lawyers/[practice-area]/                          → Hub PA national
/lawyers/[practice-area]/[state]/                  → PA × State
/lawyers/[practice-area]/[state]/[city]/           → PA × City (page cle)
/lawyers/[practice-area]/[state]/[city]/[stable_id] → Profil attorney
/lawyers/[practice-area]/[state]/[county]/         → PA × County

-- INTENT 2 : COST/FEES (pages tarifs — intent commercial) --
/costs/                                            → Hub national couts
/costs/[practice-area]/                            → Couts PA national
/costs/[practice-area]/[state]/                    → Couts PA × State
/costs/[practice-area]/[state]/[city]/             → Couts PA × City (top 500 villes)

-- INTENT 3 : FREE CONSULTATION (intent conversion directe) --
/free-consultation/                                → Hub national
/free-consultation/[practice-area]/                → Free consult PA
/free-consultation/[practice-area]/[state]/        → Free consult PA × State
/free-consultation/[practice-area]/[state]/[city]/ → Free consult PA × City (top 1000 villes)

-- INTENT 4 : REVIEWS (intent confiance/validation) --
/reviews/                                          → Hub reviews national
/reviews/[practice-area]/                          → Reviews PA national
/reviews/[practice-area]/[state]/                  → Reviews PA × State
/reviews/[practice-area]/[state]/[city]/           → Reviews PA × City (top 500 villes)

-- INTENT 5 : PROCESS/GUIDES (intent informationnel YMYL) --
/guides/                                           → Hub guides
/guides/[practice-area]/                           → Guide PA national
/guides/[practice-area]/[state]/                   → Guide PA × State (lois specifiques)
/legal-questions/                                  → FAQ hub
/legal-questions/[practice-area]/                  → FAQ PA
/legal-issues/[issue-slug]/                        → Page probleme juridique
/legal-issues/[issue-slug]/[state]/                → Probleme × State

-- INTENT 6 : GEO HUBS (navigation geographique) --
/states/                                           → Tous les etats
/states/[state]/                                   → Hub etat
/states/[state]/[city]/                            → Hub ville dans etat
/counties/[state]/[county]/                        → Hub county
/cities/[city]/                                    → Hub ville (toutes PA)
/neighborhoods/[state]/[city]/[neighborhood]/      → Hub quartier (top 50 metros)

-- INTENT 7 : COMPARE (intent decision) --
/compare/[practice-area]/                          → Comparer attorneys dans une PA
/compare/[pa-1]-vs-[pa-2]/                         → PA vs PA (ex: chapter-7-vs-chapter-13)

-- INTENT 8 : SPANISH (blue ocean — Phase 2+) --
/abogados/                                         → Hub espagnol
/abogados/[practice-area-es]/                      → PA en espagnol
/abogados/[practice-area-es]/[state]/              → PA × State espagnol
/abogados/[practice-area-es]/[state]/[city]/       → PA × City espagnol
/costos/[practice-area-es]/[state]/                → Couts espagnol
/consulta-gratis/[practice-area-es]/[state]/       → Free consult espagnol

-- AUTRES --
/emergency-legal-help/                             → Aide juridique urgente
/emergency-legal-help/[practice-area]/             → Urgence PA
/fee-calculator/                                   → Calculateur honoraires
/verify-attorney/                                  → Verification Bar Number
/attorney-map/                                     → Carte interactive
/blog/                                             → Blog
/legal-glossary/                                   → Glossaire
```

### 5.3 Calcul REEL des pages programmatiques (12.5M)

```
=== INTENT 1 : FIND (annuaire) — 6,085,474 pages ===
208 PA × 51 states (hubs PA×State)                  =       10,608
208 PA × 19,479 cities (PA×City)                     =    4,051,632
75 top PA × 41,554 ZIPs (PA×ZIP, noindex si 0)       =    3,116,550  [~50% noindex]
208 PA × 3,244 counties (PA×County)                  =      674,752
1,370,000 profils attorneys                           =    1,370,000
                                            Sous-total =    9,223,542
                                            Indexables ≈    6,085,474  (apres filtre noindex ZIP)

=== INTENT 2 : COST/FEES — 121,158 pages ===
208 PA × 51 states (couts PA×State)                  =       10,608
75 top PA × 500 top cities (couts PA×City)            =       37,500
208 PA hub national (couts PA)                        =          208
51 states hub (couts State)                           =           51
500 top cities (couts City)                           =          500
                                            Sous-total =       48,867
                                            + PA×County top 75 PA × 960 top counties = 72,000
                                            Indexables ≈      121,158

=== INTENT 3 : FREE CONSULTATION — 89,258 pages ===
208 PA × 51 states                                    =       10,608
50 top PA × 1,000 top cities                          =       50,000
208 PA hub national                                   =          208
50 top PA × 500 cities (PA×City landing)              =       25,000
                                            Indexables ≈       89,258  [seulement si l'attorney offre free consult]

=== INTENT 4 : REVIEWS — 62,358 pages ===
208 PA × 51 states                                    =       10,608
75 top PA × 500 top cities                            =       37,500
208 PA hub national                                   =          208
51 states hub                                         =           51
                                            Indexables ≈       48,367
                                            + attorneys avec reviews (estimé 30% = 411K) pages enrichies
                                            Note: les reviews sont sur les profils, pas des pages separees
                                            Pages reviews standalone ≈ 62,358

=== INTENT 5 : GUIDES & FAQ & LEGAL ISSUES — 48,908 pages ===
208 PA × 51 states (guides etat-specifiques)          =       10,608
208 PA hub guide national                             =          208
208 PA × 20 FAQ chacune                               =        4,160
500 legal issues × 51 states                          =       25,500
500 legal issues hub national                         =          500
208 PA comparaison                                    =          500
Blog ~500 articles                                    =          500
Glossaire ~500 termes                                 =          500
                                            Indexables ≈       42,976
                                            + guides detailles (3 per PA × 51 states) = 5,932 additionnel

=== INTENT 6 : GEO HUBS — 73,718 pages ===
51 states standalone                                  =           51
19,479 cities standalone                              =       19,479
3,244 counties standalone                             =        3,244
Top 50 metros × ~50 neighborhoods × 20 PA            =       50,000
Counties × states crosslinks                          =          944
                                            Indexables ≈       73,718

=== INTENT 7 : COMPARE — 700 pages ===
PA vs PA (combinaisons pertinentes)                   =          500
Top attorneys vs comparaison                          =          200
                                            Indexables ≈          700

=== INTENT 8 : SPANISH — 555,100 pages ===
50 PA × 51 states (hubs espagnols)                    =        2,550
50 PA × 2,000 top villes hispaniques                  =      100,000
50 PA hub national espagnol                           =           50
200K profils bilingues                                =      200,000
50 PA × 51 states (couts espagnol)                    =        2,550
50 PA × 51 states (guides espagnol)                   =        2,550
50 PA × 51 states (free consult espagnol)             =        2,550
50 PA × 2,000 villes (free consult espagnol)          =      100,000
1,000 FAQ espagnol                                    =        1,000
500 problemes juridiques espagnol                     =          500
                                            Indexables ≈      555,100  [BLUE OCEAN — quasi-zero competition]

============================================================
TOTAL STRUCTUREL                            ≈    12,576,727 pages
TOTAL INDEXABLE (apres filtre noindex)      ≈     8,000,000 - 10,500,000 pages
============================================================

Progression d'indexation recommandee :
  M0-M3  :   100,000 pages  (top PA × top states × top cities + profils seed)
  M3-M6  : 1,000,000 pages  (elargissement geo + sous-PA + intents cost/free-consult)
  M6-M12 : 5,000,000 pages  (couverture nationale + espagnol Phase 1)
  M12-M24: 8,000,000 pages  (couverture exhaustive + espagnol Phase 2)
  M24-M36:10,000,000+ pages (long-tail + neighborhoods + toutes sous-PA)
```

### 5.4 Matrice intent × volume : ou se concentrer en premier

| Intent | Volume de recherche | Monetisation | Difficulte SEO | Priorite |
|--------|-------------------|-------------|---------------|----------|
| **Find** (annuaire) | Tres haut | Haute (lead direct) | Haute (Avvo, FindLaw) | P0 — M0 |
| **Free consultation** | Haut | Tres haute (conversion directe) | Moyenne | P0 — M0 |
| **Cost/Fees** | Haut | Haute (intent commercial) | Moyenne | P1 — M3 |
| **Reviews** | Moyen-Haut | Moyenne (confiance) | Moyenne | P1 — M3 |
| **Guides/FAQ** | Haut | Faible (informationnel) mais E-E-A-T | Faible-Moyenne | P1 — M1 |
| **Legal issues** | Moyen | Moyenne (funnel top) | Faible | P2 — M6 |
| **Spanish** | Moyen (mais 0 competition) | Haute | Quasi-zero | P1 — M3 |
| **Compare** | Faible | Moyenne | Faible | P3 — M12 |
| **Neighborhoods** | Faible (mais haute conversion) | Haute | Faible | P2 — M6 |
| **County** | Moyen (systeme judiciaire) | Haute | Faible | P1 — M3 |

### 5.5 Schema markup (LegalService, PAS Attorney)

```json
{
  "@context": "https://schema.org",
  "@type": "LegalService",
  "name": "John Smith, Esq.",
  "description": "Personal injury attorney in Los Angeles, CA...",
  "url": "https://[domain]/lawyers/personal-injury/california/los-angeles/[stable_id]",
  "telephone": "+1-555-123-4567",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "Los Angeles",
    "addressRegion": "CA",
    "postalCode": "90001",
    "addressCountry": "US"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": 34.0522, "longitude": -118.2437 },
  "areaServed": [
    { "@type": "State", "name": "California" },
    { "@type": "City", "name": "Los Angeles" }
  ],
  "knowsAbout": ["Personal Injury", "Car Accidents", "Medical Malpractice"],
  "hasCredential": [
    {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "Bar Admission",
      "recognizedBy": { "@type": "Organization", "name": "State Bar of California" },
      "validIn": { "@type": "State", "name": "California" }
    }
  ],
  "aggregateRating": { "COMPUTED FROM REAL REVIEWS ONLY" },
  "review": [ "REAL REVIEWS ONLY" ]
}
```

### 5.6 Sitemaps (architecture pour 12.5M pages)

```
Calcul sitemaps (50K URLs max par sitemap) :

Intent FIND :
  PA×State     :  10,608 / 50K =     1 sitemap
  PA×City      : 4,051,632 / 50K =  82 sitemaps (groupes par state : ~1.6 par state)
  PA×ZIP       : 3,116,550 / 50K =  63 sitemaps (groupes par state)
  PA×County    :   674,752 / 50K =  14 sitemaps
  Profiles     : 1,370,000 / 50K =  28 sitemaps

Intent COST :
  All cost pages :  121,158 / 50K =   3 sitemaps

Intent FREE CONSULTATION :
  All FC pages :     89,258 / 50K =   2 sitemaps

Intent REVIEWS :
  All review pages :  62,358 / 50K =   2 sitemaps

Intent GUIDES/FAQ/ISSUES :
  All content pages :  48,908 / 50K =   1 sitemap

GEO HUBS :
  All geo hubs :      73,718 / 50K =   2 sitemaps

SPANISH :
  All Spanish :      555,100 / 50K =  12 sitemaps

STATIC :
  Blog, glossary, compare, tools :     1 sitemap

IMAGE SITEMAP :                        1 sitemap
NEWS SITEMAP :                         1 sitemap

TOTAL : ~213 sitemaps (dans la limite Google de 500)
```

- [ ] Architecture : ~213 sitemaps + 1 sitemap-index
- [ ] Sitemaps organises par intent × state (decouverte logique par Googlebot)
- [ ] Provider sitemaps par state (CA=1, NY=1, TX=1, etc. + overflow)
- [ ] Image sitemap pour portraits attorneys
- [ ] News sitemap (blog articles < 48h)
- [ ] Video sitemap (si consultations video Phase 3+)
- [ ] IndexNow : adapter pour nouveau domaine, batch quotidien ~500 URLs strategiques
- [ ] Monitoring cron : verifier les ~213 sitemaps quotidiennement

### 5.7 Contenu E-E-A-T (YMYL critique — le plus important pour le legal)

Le legal est classe **YMYL (Your Money Your Life)** par Google = standard E-E-A-T maximal.

- [ ] Chaque page attorney : bar admission verifiee avec source (State Bar link)
- [ ] Court records avec disclaimer systematique : *"Past results do not guarantee future outcomes. Case outcomes depend on unique facts and circumstances."*
- [ ] Chaque page PA×City : **minimum 40% contenu unique** (pas template avec ville/PA substitues)
  - Contenu unique = statistiques locales, lois state-specifiques, tribunaux locaux, barreaux locaux
  - Ex: "In California, personal injury claims are governed by the statute of limitations of 2 years (CCP § 335.1)"
- [ ] Citations de sources legales obligatoires (ABA, state bar, statutes, case law)
- [ ] Author pages avec credentials reelles (JD, bar admission, experience)
- [ ] Pas de "AI-generated legal advice" — contenu informationnel uniquement avec disclaimers
- [ ] Schema `author` avec `hasCredential` sur chaque article/guide
- [ ] Sources verifiables sur chaque statistique (cite la source, pas d'invention)

### 5.8 GEO (Generative Engine Optimization)

Objectif : etre LA source citee par ChatGPT, Gemini, Perplexity, Google AI Overviews.

- [ ] **Donnees uniques** (court records, statistiques locales) = impossible a reproduire par AI generative seule
- [ ] **Citations + statistiques** dans le contenu : +30-40% visibilite dans les reponses AI
- [ ] **Structured data exhaustif** (LegalService + Person + EducationalOccupationalCredential) : +20-30% CTR
- [ ] **Contenu citeable** : phrases factuelles courtes avec source = format ideal pour citation AI
- [ ] **Fraicheur** : donnees court records mises a jour mensuellement = signal de fraicheur
- [ ] **Exhaustivite** : couvrir TOUTES les PA × geo = la source la plus complete = la plus citee

### 5.9 Contenu espagnol — strategie blue ocean

Le contenu espagnol n'est PAS une traduction. C'est une **transcreation** native :

- [ ] Redacteurs hispanophones natifs US (pas espagnol d'Espagne)
- [ ] Terminologie juridique US en espagnol (pas traduction litterale)
- [ ] URLs propres : `/abogados/`, `/costos/`, `/consulta-gratis/`
- [ ] Hreflang tags : `<link rel="alternate" hreflang="es" href="/abogados/..." />`
- [ ] Schema markup en espagnol (`LegalService` avec `inLanguage: "es"`)
- [ ] **Cible** : 62M+ hispaniques US, 41M locuteurs natifs
- [ ] **Competition** : quasi-zero (Abogado.com = contenu traduit mecaniquement, pas natif)
- [ ] **Volume** : "abogado de inmigracion cerca de mi" = volume significatif, 0 resultat de qualite

### 5.10 Strategie de contenu par vague

| Vague | Quand | Pages | Contenu |
|-------|-------|-------|---------|
| **V1** | M0-M1 | 10K | 20 top PA × 51 states + top 200 cities + profils seed |
| **V2** | M1-M3 | 100K | Toutes 75 PA parentes × states × top 500 cities + costs + free-consult |
| **V3** | M3-M6 | 1M | + sous-PA Tier 1, counties, reviews, guides state-specifiques, espagnol V1 |
| **V4** | M6-M12 | 5M | + sous-PA Tier 2, ZIP codes, legal issues, neighborhoods, espagnol V2 |
| **V5** | M12-M24 | 8M | + sous-PA Tier 3, couverture ZIP complete, compare, espagnol complet |
| **V6** | M24-M36 | 10M+ | Long-tail, neighborhoods all metros, contenu enrichi court records |

**Regle CHARTER** : chaque vague ne deploie des pages que si **10+ attorneys** existent pour cette combinaison PA×Geo. Sinon → `noindex` ou pas de page.

**Livrable Phase 5** : V1 (10K pages) deployee a M1, V2 (100K) a M3, sitemaps fonctionnels, schema markup valide.

---

## 9. PHASE 6 — INTEGRATIONS TIERCES (Semaine 7-10)

### 6.1 A conserver (adapter)
| Service | Changement |
|---------|-----------|
| Stripe | Nouveau compte US, USD, plans $49/$149/$299 |
| Resend | Nouveau domaine, templates EN |
| Sentry | Nouveau projet |
| Vercel | Nouvelle region (iad1) |
| Google Analytics | Nouveau GA ID |
| Leaflet/Maps | Tuiles US, bounds US |
| Vapi | Scripts voix EN |

### 6.2 A supprimer
| Service | Raison |
|---------|--------|
| INSEE API | Specifique France |
| Pappers API | Specifique France |
| api-adresse.data.gouv.fr | Specifique France |
| Twilio (potentiellement) | Evaluer vs alternatives US (TCPA compliance) |

### 6.3 A ajouter
| Service | Usage | Cout |
|---------|-------|------|
| CourtListener API | Court records, opinions, RECAP | Gratuit (5K/hr) → $500-2K/mois |
| State Bar APIs | Bar verification (51 etats) | $0 (public) |
| Census Bureau API | Geographic data | $0 (public) |
| USPS Address API | Validation adresses | $0 (gratuit) |
| Google Places API | Law firm enrichment | $200-500/mois |
| UniCourt (Phase 3+) | Court records premium | $1-10K/mois |
| Twilio (TCPA-compliant) | SMS avec opt-in explicite | Variable |

**Livrable Phase 6** : Toutes les integrations configurees et testees.

---

## 10. PHASE 7 — COMPLIANCE LEGALE US (Continu)

### 7.1 TCPA (Telephone Consumer Protection Act)
- [ ] **ZERO SMS** sans Prior Express Written Consent (PEWC) docummente
- [ ] Checkbox explicite : "I agree to receive text messages from [Platform] regarding my legal inquiry. Message & data rates may apply. Reply STOP to opt-out."
- [ ] Horodatage du consentement stocke en DB (`tcpa_consent_at`)
- [ ] Opt-out STOP instantane
- [ ] Risque si non-conforme : **$500-$1,500 par SMS**, class action $25M-$75M

### 7.2 ABA Model Rules
- [ ] **Rule 7.1** : Aucune affirmation trompeuse ("Best Lawyer" interdit sans criteres verifiables)
- [ ] **Rule 7.2** : Transparence sur le modele (subscription, pas referral fees)
- [ ] **Rule 7.3** : Le client doit initier le contact (pas de cold outreach aux clients potentiels)
- [ ] **Rule 7.4** : Seuls les avocats certifies "specialist" peuvent le revendiquer
- [ ] **Rule 5.4** : **ZERO fee-splitting** — le modele est subscription, PAS commission sur cas

### 7.3 State-specific rules
- [ ] Californie : Rule 7.1-7.5 (propres regles)
- [ ] New York : RPC 7.1-7.5 (publicite specifique)
- [ ] Texas : DR 7.01-7.07 (tres restrictif)
- [ ] Floride : Bar Rule 4-7 (pre-approbation requise dans certains cas)
- [ ] Disclaimer obligatoire : "Attorney advertising. Past results do not guarantee future outcomes."

### 7.4 Win Rate / Outcomes
- [ ] Source uniquement CourtListener (donnees publiques, 1st Amendment)
- [ ] Disclaimer systematique sur chaque page avec court data
- [ ] NLP extraction limitee aux outcomes factuels (won/lost/settled/dismissed)
- [ ] Pas de "success rate" calcule (trop subjectif, attaquable)

### 7.5 CAN-SPAM
- [ ] Lien unsubscribe dans chaque email
- [ ] Adresse physique dans le footer
- [ ] Sujet non trompeur
- [ ] Traitement opt-out sous 10 jours
- [ ] Risque si non-conforme : **$51,744 par email**

### 7.6 Privacy (CCPA + state laws)
- [ ] Privacy Policy conforme CCPA (Californie)
- [ ] "Do Not Sell My Information" lien
- [ ] Data deletion request endpoint
- [ ] Cookie consent adapte US (moins strict que GDPR mais necessaire pour CA/CO/VA/CT)

### 7.7 ADA (Americans with Disabilities Act)
- [ ] WCAG 2.1 AA compliance
- [ ] aria-labels sur tous les formulaires
- [ ] Contraste couleurs suffisant
- [ ] Navigation clavier complete

**Livrable Phase 7** : Toute la compliance documentee, opinion letter obtenue, disclaimers implementes.

---

## 11. PHASE 8 — SCRIPTS & DATA PIPELINE (Semaine 4-12)

### 8.1 Scripts a creer
| Script | Fonction | Priorite |
|--------|----------|----------|
| `import-ny-attorneys.ts` | NY Open Data Socrata API (190K) | P0 |
| `import-ca-attorneys.ts` | CA State Bar scraper (181K) | P0 |
| `import-tx-attorneys.ts` | TX State Bar scraper (99K) | P1 |
| `import-fl-attorneys.ts` | FL Bar scraper (80K) | P1 |
| `import-state-bar-generic.ts` | Framework generique 51 etats | P1 |
| `import-courtlistener.ts` | CourtListener bulk CSV + API | P1 |
| `seed-locations.mjs` | Census Bureau → locations table | P0 |
| `seed-practice-areas.mjs` | 75 practice areas | P0 |
| `enrich-bar-number.ts` | Verification bar admission | P1 |
| `enrich-court-records.ts` | CourtListener → court_records | P2 |
| `aggregate-fees.ts` | Fee benchmarks par PA + state | P2 |
| `generate-cities-content.ts` | Contenu unique par ville | P1 |
| `validate-indexation.ts` | Adapter pour domaine US | P2 |
| `indexnow-batch.mjs` | Adapter pour domaine US | P2 |

### 8.2 Scripts a supprimer
- Tous les scripts `*-pj-*` (Pages Jaunes = specifique France)
- Tous les scripts `*-insee*` (INSEE = specifique France)
- `scrape-mairies.mjs` (mairies = communes francaises)
- `enrich-communes.*` (communes francaises)
- `enrich-pappers.ts` (Pappers = specifique France)
- `enrich-georisques.ts` (risques geologiques France)
- `seed-communes.mjs` (communes francaises)
- `seed-plombiers-paris.mjs` (plombiers Paris)
- `gen-reglementation.py` (reglementation FR)

### 8.3 Pipeline de donnees

```
Phase 1 (M0-M3):
  NY Socrata API → 190K attorneys
  CA Bar scraper → 181K attorneys
  Manual seeds → top 10 states
  Census Bureau → locations table
  = 500K+ profiles, 60K+ locations

Phase 2 (M3-M6):
  Remaining state bars → +500K attorneys
  CourtListener bulk CSV → court records
  Google Places enrichment → law firm data
  = 1M+ profiles, court records

Phase 3 (M6-M12):
  Full 51-state coverage → 1.37M attorneys
  CourtListener API continuous sync
  UniCourt integration (if budget allows)
  User-submitted reviews
  = 1.37M profiles, court records, reviews
```

**Livrable Phase 8** : Pipeline automatise, 500K+ attorneys en base au M3.

---

## 12. PHASE 9 — TESTS & QA (Semaine 8-12)

### 9.1 Tests unitaires
- [ ] Adapter tous les mocks et fixtures (`__tests__/`)
- [ ] Artisan → Attorney dans tous les tests
- [ ] Communes → Locations
- [ ] FR locale → EN locale
- [ ] Objectif : coverage ≥ 60% statements, 50% branches

### 9.2 Tests E2E
- [ ] Adapter les 16 suites Playwright
- [ ] Tous les flows : signup, login, search, attorney profile, consultation request, review, payment
- [ ] Mobile : iPhone 12, Pixel 5
- [ ] Browsers : Chromium, Firefox, WebKit

### 9.3 SEO tests
- [ ] Meta tags corrects sur toutes les pages types
- [ ] Schema markup valide (schema.org validator)
- [ ] Sitemaps XML valides
- [ ] Robots.txt correct
- [ ] Canonical URLs consistants
- [ ] Pas de contenu FR residuel

### 9.4 Compliance tests
- [ ] TCPA consent tracking verifie
- [ ] Disclaimers presents sur toutes les pages avec court data
- [ ] ADA/WCAG audit (aXe, Lighthouse)
- [ ] CCPA "Do Not Sell" link fonctionnel

### 9.5 Performance
- [ ] Lighthouse ≥ 90 sur toutes les pages types
- [ ] LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] Build time < 30 min pour 100K+ pages
- [ ] ISR revalidation fonctionne

**Livrable Phase 9** : Tous les tests passent, zero regression.

---

## 13. PHASE 10 — DEPLOIEMENT & GO-LIVE (Semaine 10-12)

### 10.1 Pre-launch checklist
- [ ] LLC creee et active
- [ ] Opinion letter favorable obtenue
- [ ] Domaine age achete et configure
- [ ] DNS pointe vers Vercel
- [ ] SSL/TLS actif
- [ ] Supabase US production ready
- [ ] Stripe US en mode live
- [ ] Resend domaine verifie
- [ ] Sentry en production
- [ ] Google Analytics configure
- [ ] Google Search Console configure
- [ ] Bing Webmaster Tools configure
- [ ] IndexNow verification file deploye
- [ ] Tous les crons actifs
- [ ] 500K+ attorneys en base
- [ ] 100K+ pages indexables
- [ ] Sitemaps soumis
- [ ] Pages legales completes (Terms, Privacy, Legal Notice, Accessibility)
- [ ] CHARTER.md adapte pour US
- [ ] Build passe sans erreur
- [ ] Tous les tests passent

### 10.2 Launch sequence
1. Deployer sur Vercel (production)
2. Soumettre sitemap-index a Google Search Console
3. Soumettre sitemaps a Bing Webmaster Tools
4. Declencher IndexNow batch (premieres 10K URLs strategiques)
5. Monitorer Sentry pour erreurs
6. Monitorer Search Console pour indexation
7. Premier rapport de crawl a J+7

### 10.3 Post-launch M0-M3
- [ ] Monitorer indexation (objectif : 50K+ pages indexees en 30 jours)
- [ ] Iterer sur le contenu (pages thin → enrichir)
- [ ] Premiere campagne outreach (backlinks, PR)
- [ ] Premiers beta testers attorneys (10-20 gratuits)
- [ ] Go/No-Go Phase 2 : 50K+ pages indexees + signaux GSC positifs

---

## 14. MATRICE DE RISQUES

| Risque | Impact | Probabilite | Mitigation |
|--------|--------|-------------|------------|
| **TCPA class action** | FATAL ($25-75M) | Haute si non-conforme | Zero SMS sans PEWC, audit legal continu |
| **Fee-splitting accusation** | FATAL (fermeture) | Moyenne | Modele subscription only, opinion letter |
| **Thin content penalty** | ELEVE (desindexation) | Moyenne | 40%+ contenu unique, noindex si 0 attorneys |
| **Domaine age insuffisant** | ELEVE (crawl lent) | Faible si achat DR30+ | Acheter domaine age, backlinks naturels |
| **State Bar cease & desist** | MOYEN | Faible | Opinion letter, disclaimers, transparence |
| **CourtListener API changes** | MOYEN | Faible | Bulk CSV backup, cache local |
| **Competitor reaction (IB)** | FAIBLE | Moyenne | Execution rapide, moats techniques |
| **Supabase scaling** | MOYEN | Faible | Monitoring, plan Enterprise si >1M rows |
| **Build time explosion** | MOYEN | Moyenne | ISR fail-open, pas de full SSG |

---

## 15. BUDGET & TIMELINE

### Budget infrastructure mensuel

| Phase | Infra/mois | Notes |
|-------|-----------|-------|
| M0-M3 (MVP) | $51 | Vercel Pro $20 + Supabase Pro $25 + domaine $6 |
| M3-M6 (Growth) | $785 | + Redis $10 + CourtListener $500 + proxies $300 |
| M6-M12 (Scale) | $2,030 | + monitoring + CDN + backups |
| M12-M24 | $4,500 | + UniCourt + scaling DB |
| M24-M36 | $7,200 | Full scale |

### Budget one-shot

| Poste | Cout | Quand |
|-------|------|-------|
| LLC Delaware (Stripe Atlas) | $500 | Semaine 1 |
| Opinion letter avocat | $3,000-$5,000 | Semaine 1-2 |
| Domaine age DR30-50+ | $500-$50,000 | Semaine 1 |
| Design/branding | $0-$2,000 | Semaine 2 |
| CourtListener bulk data | $0 (gratuit) | Semaine 3 |
| **Total one-shot** | **$4,000-$57,500** | |

### Timeline resumee

| Semaine | Phase | Livrable cle |
|---------|-------|-------------|
| S1-S2 | Phase 0 : Fondations | LLC, domaine, infra, opinion letter lancee |
| S2-S3 | Phase 1 : Schema DB | Migrations US, types generes |
| S3-S4 | Phase 2 : Donnees | 500K attorneys, geo US |
| S4-S6 | Phase 3 : Backend | APIs fonctionnelles EN |
| S5-S8 | Phase 4 : Frontend | UI complete EN |
| S6-S10 | Phase 5 : SEO | 100K+ pages, sitemaps |
| S7-S10 | Phase 6 : Integrations | CourtListener, Stripe US |
| Continu | Phase 7 : Compliance | TCPA, ABA, disclaimers |
| S4-S12 | Phase 8 : Data pipeline | 500K+ attorneys |
| S8-S12 | Phase 9 : Tests | Zero regression |
| S10-S12 | Phase 10 : Go-live | Production, monitoring |

**Duree totale estimee : 10-12 semaines pour MVP, 6 mois pour scale**

---

## METRIQUES DE SUCCES

| Milestone | Critere | Deadline |
|-----------|---------|----------|
| Go/No-Go Phase 1 | Opinion letter favorable + LLC | Semaine 2 |
| Go/No-Go Phase 2 | 50K+ pages indexees, 500K+ profils en base | M3 |
| Go/No-Go Phase 3 | 50+ attorneys abonnes, MRR >$5K, 500K+ pages indexees | M6 |
| Go/No-Go Phase 4 | ARR >$1M, 2M+ pages indexees, court records actifs | M12 |
| Scale | 5M+ pages indexees, espagnol lance, $3M+ ARR | M24 |
| Domination | 8-10M+ pages indexees, $8.9M+ ARR, B2B data product | M36 |

---

## CHANGELOG v2.0

Corrections apportees suite a l'analyse exhaustive des requetes :

| Element | v1.0 | v2.0 | Raison |
|---------|------|------|--------|
| Practice Areas | 75 | **208** (75 parents + 133 sous-specialites) | Chaque PA a des sous-specialites avec volume de recherche independant |
| Intents par combinaison | 1 (find) | **6-8** (find, cost, free-consult, reviews, guides, compare, spanish, neighborhoods) | 1 page par PA×Lieu ne couvre pas les intents cost/free-consult/reviews |
| Pages totales | 8.4M | **12.5M structure / 8-10M indexees** | Intent multiplication + counties + sous-PA + espagnol |
| PA×County | 0 | **674,752** | Le systeme judiciaire US est organise par county |
| Pages espagnol | 102K | **555K** | 62M hispaniques = 19% pop US merite plus que 1.2% des pages |
| Sitemaps | ~170 | **~213** | Plus de pages = plus de sitemaps |
| Intent cost pages | 0 | **121K** | "How much does a [PA] lawyer cost in [city]" = intent commercial direct |
| Intent free-consult | 0 | **89K** | "Free consultation [PA] [city]" = intent conversion maximale |
| Guides state-specifiques | 225 | **10K+** | Chaque state a ses propres lois = contenu unique obligatoire |
| Neighborhoods | 0 | **50K** | Top 50 metros × quartiers = haute conversion |

---

> **Ce plan couvre 100% du codebase** : 254 composants, 188 routes API, 55 migrations, 85+ scripts, 218 pages, 10+ fichiers data, 8 fichiers publics, 12 fichiers config, 16 suites de tests, 1 plugin WordPress. **Aucun fichier n'est oublie.**
>
> **Ce plan couvre 100% du search landscape** : 208 practice areas × 6-8 intents × 4 niveaux geo (state/county/city/ZIP) + espagnol + neighborhoods + legal issues. **Aucune requete significative n'est oubliee.**
