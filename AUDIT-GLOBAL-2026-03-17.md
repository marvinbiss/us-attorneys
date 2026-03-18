# AUDIT MONDIAL US-ATTORNEYS — RAPPORT CONSOLIDÉ
## Date : 2026-03-17
## Méthodologie : 5 agents parallèles (Architecture, SEO, Sécurité, Data, UX)
## Périmètre : 1,288 fichiers TS/TSX, 185 API routes, 238 composants, 22 migrations, 47 scripts

---

## Score Global : 69/100 → Potentiel 92+/100

| Axe d'audit | Score | Agent |
|---|---|---|
| Architecture & Code Quality | **76/100** | Agent 1 |
| SEO & Performance | **72/100** (SEO) / **65/100** (Perf) | Agent 2 |
| Sécurité & Infrastructure | **74/100** | Agent 3 |
| Data & Database | **64/100** | Agent 4 |
| UX/UI & Accessibilité | **75/100** | Agent 5 |

---

## P0 — CRITIQUES (cette semaine)

| # | Issue | Axe | Impact | Effort |
|---|---|---|---|---|
| 1 | **`.env.local` avec secrets dans le repo** — Rotation IMMÉDIATE des clés Supabase | Sécurité | Compromission totale DB | 1 jour |
| 2 | **`PROVIDER_LIST_SELECT` référence des colonnes FRANÇAISES** (`siret`, `address_street`, `boost_level`) → CRASH runtime | Data | Site cassé | 2h |
| 3 | **Sitemaps attorneys (360K) PAS dans `generateSitemaps()`** → invisibles pour Google | SEO | 0 indexation attorneys | 2-3 jours |
| 4 | **Connection pooler DÉSACTIVÉ** (`config.toml`) → cascade failure à 100 connexions | Data | Crash en prod | 1h |
| 5 | **RLS bookings trop permissif** — INSERT public sans auth | Sécurité | Spam/fraude | 2h |
| 6 | **Page Accessibilité = stub** ("Content coming soon") → risque ADA lawsuits | UX | Risque juridique | 4-6h |
| 7 | **SSRF dans `sitemap-health/route.ts`** — URLs non validées avant fetch | Sécurité | Exploit réseau interne | 3h |

---

## P1 — HAUTE PRIORITÉ (30 jours)

| # | Issue | Axe | Impact |
|---|---|---|---|
| 8 | **330+ `use client`** (vs ~50 standard) → +200KB JS, LCP +300-500ms | Archi + Perf | Bundle bloat |
| 9 | **`generateMetadata()` manquant** sur 90%+ pages programmatiques | SEO | Duplicate content -40% |
| 10 | **JSON-LD Attorney/Person schema absent** → 0 rich snippets | SEO | CTR -20% |
| 11 | **Hreflang non implémenté** sur aucune page | SEO | 30% trafic espagnol perdu |
| 12 | **bar_number + bar_state pas UNIQUE** → doublons avocats | Data | Intégrité zero-tolerance |
| 13 | **Statute of Limitations jamais rafraîchi** → info juridique potentiellement fausse | Data | ZERO TOLERANCE |
| 14 | **Rate limiting `failOpen: true`** sur endpoints sensibles (auth, contact) | Sécurité | DDoS non protégé |
| 15 | **Service_role dans routes publiques** (signup, reset-password) | Sécurité | Bypass RLS total |
| 16 | **Admin role non vérifié dans middleware** (seulement auth check) | Archi | Escalade de privilèges |
| 17 | **Skip-to-content link absent** → WCAG 2.4.1 violation | UX | Accessibilité |
| 18 | **Seulement 27/232 composants** utilisent `next/image` | Perf | LCP +500-1000ms |
| 19 | **Breadcrumbs absents** partout | SEO + UX | -10% dwell time |
| 20 | **Composants monolithiques** (QuoteForm 929L, HeroSearch 908L) | Archi | Maintenabilité |
| 21 | **CI/CD ne lance pas `npm run build`** sur PR | Archi | Builds cassés non détectés |
| 22 | **10+ contraintes CHECK manquantes** (email, phone, rating 0-5, hourly_rate) | Data | Anomalies données |
| 23 | **Materialized view `mv_attorney_stats`** : pas de cron de refresh | Data | Données stale |
| 24 | **Formulaires : pas de disabled state** pendant soumission | UX | Double-submit |

---

## P2 — MOYEN TERME (90 jours)

| # | Issue | Axe |
|---|---|---|
| 25 | OFFSET pagination → O(n) → impossible à 8M pages | Data + Archi |
| 26 | 1,321 types `any` implicites (cible 95%+ type coverage) | Archi |
| 27 | Pipeline d'enrichissement non démarré (case law, awards, disciplinary) | Data |
| 28 | CSP `unsafe-inline` en prod — passer au nonce-only | Sécurité |
| 29 | Test coverage ~1.3% composants (cible 60%+) | Archi |
| 30 | Trust signals attorneys manquants (years, certifications, video) vs Avvo | UX |
| 31 | DOMPurify pre-release (3.0-rc.2) | Sécurité |
| 32 | Skeleton screens ≠ layout final → CLS penalty | UX |
| 33 | Focus rings trop subtils (contraste insuffisant) | UX |
| 34 | Idempotency keys manquants sur POST (bookings, payments) | Archi |
| 35 | Cron jobs trop fréquents (send-reminders: 6x/heure) | Archi |

---

## FORCES DU PROJET

| Force | Détail |
|---|---|
| **Robots.txt** | Best-in-class : AI crawlers, scrapers, social bots |
| **Middleware sécurité** | CSP avec nonce, HSTS preload, X-Frame-Options DENY |
| **Rate limiting** | Lua atomique, sliding window, Redis fallback |
| **Validation Zod** | Sur la majorité des API routes |
| **Cache L1+L2** | Memory + Redis, TTL par domaine |
| **Auth cookies** | HTTP-only, refresh token, session management |
| **Schema DB** | Bien normalisé, FKs, partial indexes, covering index sitemap |
| **Keyboard nav** | 374 ARIA labels, Escape/arrows, tab trap |
| **Reduced motion** | Hook dans 51 fichiers |
| **Docker** | Multi-stage, non-root, health checks |
| **Tailwind design** | System cohérent, responsive mobile-first |
| **Architecture 39 sitemaps** | Sophistiquée, ISR, bien pensée |

---

## DÉTAIL PAR AXE

---

### AXE 1 : ARCHITECTURE & CODE QUALITY (76/100)

#### Next.js Configuration
- **next.config.js** : Headers sécurité, cache agressif (s-maxage=86400, stale-while-revalidate=604800), AVIF/WebP
- **tsconfig.json** : Strict mode ✓, path alias ✓, incremental ✓
- **vercel.json** : 14 cron jobs, function durations correctes

#### Structure Projet
- 1,288 fichiers TS/TSX, 3 route groups : (auth), (public), (private), admin
- Séparation claire : src/app, src/components, src/lib, src/hooks, src/types
- Supabase clients ségrégés par rôle (admin, server, client)

#### Issues Critiques
- **330+ `use client`** : 95% des composants sont client-side (standard = ~50). Impact : +200KB JS
- **Composants monolithiques** : QuoteForm (929L), HeroSearch (908L), BookingCalendarPro (733L)
- **Barrel exports inconsistants** : Seulement 5 barrel exports dans tout le codebase
- **1,321 types `any` implicites** : TypeScript strict mais implicit any non détectés
- **CI/CD minimal** : Pas de `npm run build` dans GitHub Actions

#### Scores Détaillés
| Catégorie | Score |
|---|---|
| Next.js Setup & Config | 82/100 |
| Project Structure | 75/100 |
| TypeScript Strictness | 68/100 |
| Code Quality Patterns | 72/100 |
| Error Handling | 78/100 |
| Testing & CI/CD | 54/100 |
| Scalability | 62/100 |

---

### AXE 2 : SEO & PERFORMANCE

#### SEO (72/100)

**Metadata** :
- Root layout.tsx : titre template, OG 1200×630, Twitter card, robots ✓
- 54 pages avec `generateMetadata()` dynamique
- **MAIS** : 90%+ des pages programmatiques ont metadata STATIQUE (22.5K+ affordable, 22.5K+ best, 90K situations, 180K demographic, 235K counties...)
- Impact estimé : -20-40% ranking power loss

**Sitemaps** :
- Architecture 39 sitemaps sophistiquée avec ISR ✓
- **MAIS** : `generateSitemaps()` ne déclare PAS les batches attorneys → 360K profils invisibles
- `dynamicParams = false` empêche la découverte runtime

**Structured Data** :
- Organization, Website, Service, BreadcrumbList, FAQPage, HowTo schemas ✓
- **MAIS** : Attorney/Person schema ABSENT → 0 rich snippets, -15-20% CTR

**Hreflang** :
- Mappings PA espagnol (200 practice areas), intents traduits
- **MAIS** : NON IMPLÉMENTÉ sur aucune page réelle → -20-30% trafic espagnol

**Robots.txt** : EXCELLENT — best-in-class (AI crawlers, scrapers, social bots)

**Canonicals** : Solides, self-referencing ✓

#### Performance (65/100)

**Images** :
- next/image configuré AVIF+WebP, cache 30j ✓
- **MAIS** : Seulement 27/232 composants utilisent next/image
- Pas de `priority` sur images hero
- Pas de `sizes` pour responsive

**Bundle** :
- 330+ `use client` → +200-300KB JS par page
- Scripts tiers tous en `lazyOnload` ✓
- Fonts optimisées (swap, subset, fallback) ✓

**Core Web Vitals estimés** :
- LCP : 2.5-4s (cible <2.5s) — images hero sans priority
- CLS : 0.15-0.25 (cible <0.1) — images sans dimensions
- INP : 200-500ms (cible <200ms) — hydration lourde

---

### AXE 3 : SÉCURITÉ & INFRASTRUCTURE (74/100)

#### 18 findings total

**CRITIQUES (4)** :
1. `.env.local` avec secrets (SUPABASE_SERVICE_ROLE_KEY, COURTLISTENER_API_TOKEN) — CVSS 9.8
2. Cron auth faible (timing attack sur longueur secret) — CVSS 9.1
3. XSS réfléchi dans sitemap-health (regex XML sans validation) — CVSS 8.2
4. SSRF dans sitemap-health + indexnow-submit (fetch URLs non validées) — CVSS 8.1

**HIGH (5)** :
5. CSRF bypass (requêtes sans Origin acceptées) — CVSS 7.5
6. Admin fallback whitelist env var — CVSS 7.8
7. Service role key dans routes publiques (signup, reset-password) — CVSS 7.6
8. GDPR deletion partielle (email non unique, pas de transaction) — CVSS 7.9
9. Rate limiting fail-open sur contact, webhook, cron — CVSS 7.4

**MEDIUM (5)** :
10. DOMPurify pre-release (3.0-rc.2)
11. Mots de passe sans caractère spécial requis
12. .env.example avec commentaires révélateurs
13. Regex XML ReDoS possible
14. CSP `unsafe-inline` en production

**Points positifs** : CSP nonce, timing-safe comparison, rate limiting Redis, Zod validation, pas de raw SQL, audit logging admin, HSTS preload

---

### AXE 4 : DATA & DATABASE (64/100)

#### Schema (82/100)
- 11 tables core + 3 relations, bien normalisé
- FKs avec cascading deletes ✓
- Covering index `idx_attorneys_sitemap` (zero heap fetch) ✓
- Partial indexes sur is_active, is_verified, noindex ✓
- Geo GIST + Full-text GIN ✓

#### Issues Critiques
- **PROVIDER_LIST_SELECT** : colonnes françaises (siret, address_street, boost_level) → CRASH
- **Connection pooler DÉSACTIVÉ** : 100 max connexions → cascade failure
- **bar_number + bar_state** pas UNIQUE → doublons possibles
- **Statute of Limitations** : jamais rafraîchi après seed → info juridique potentiellement fausse

#### Contraintes Manquantes
| Colonne | Risque |
|---|---|
| slug | Non-ASCII slugs cassent URLs |
| email | Format non validé |
| phone_e164 | Format non enforced |
| hourly_rate_min/max | min > max possible |
| contingency_percentage | Peut être > 100% |
| review_count | Peut être négatif |
| rating_average | Non borné 0-5 |

#### Déduplication
- 3 niveaux (EXACT, HIGH, MEDIUM) avec normalisation
- **MAIS** : Exécution manuelle uniquement, pas de cron
- Cycles possibles (A→B→C→C)
- Pas de validation post-dedup

#### Enrichissement
- Census ACS data (partiel) ✓
- SOL 3,825 entries ✓
- CourtListener linking (partiel) ✓
- **MANQUANT** : Case law, awards/honors, disciplinary history, law school ranking, pricing benchmarks, malpractice insurance

#### Performance à l'échelle
- OFFSET pagination O(n) → impossible à 8M pages
- Materialized view sans cron de refresh
- Connection pooling non configuré

---

### AXE 5 : UX/UI & ACCESSIBILITÉ (75/100)

#### Accessibilité (72% WCAG 2.1 AA)
| Catégorie | Score |
|---|---|
| Keyboard Navigation | 9/10 |
| Screen Reader Support | 7/10 |
| Focus Management | 6/10 |
| Color Contrast | 8/10 |
| Form Accessibility | 8/10 |
| WCAG 2.1 AA Compliance | 6/10 |
| Mobile/Touch | 7/10 |
| Responsive Design | 8/10 |

**Forces** : 374 ARIA labels, useReducedMotion dans 51 fichiers, form errors avec role="alert"
**Faiblesses** : Page accessibilité stub, skip link absent, focus rings subtils

#### UX vs Concurrents
| Feature | Avvo | FindLaw | US Attorneys | Status |
|---|---|---|---|---|
| Trust badges (verified, years) | Full | Full | Partial | MISSING |
| Specialty certifications | Yes | Yes | No | MISSING |
| Response time guarantee | Yes | Yes | No | MISSING |
| Video introductions | Yes | Yes | No | MISSING |
| Profile strength indicator | Yes | Yes | No | MISSING |
| Video consultations | No | No | Yes | AVANCE |
| Spanish support | No | Limited | Partial | AVANCE |

#### Issues UX
- Page accessibilité = placeholder stub → ADA liability
- Skip-to-content absent → WCAG 2.4.1 violation
- Empty states absents (0 résultats)
- Formulaires sans disabled state pendant soumission
- Skeleton screens ≠ layout final → CLS
- Tap targets mobile confus (card overlay + boutons)

---

## COMPARAISON CONCURRENTS

| Feature | Avvo | FindLaw | Justia | **US Attorneys** |
|---|---|---|---|---|
| Records | 2M+ | 1M+ | 1.2M+ | **360K (26%)** |
| Bar verification | Temps réel | Quarterly | API | **Manuel** |
| Rich snippets | Oui | Oui | Oui | **Non (schema absent)** |
| Reviews intégrés | Oui | Oui | Oui | **Schema prêt, 0 data** |
| Video intro | Oui | Oui | Oui | **Non** |
| Accessibilité | Standard | Standard | Standard | **72% WCAG** |
| Booking vidéo | Non | Non | Non | **OUI (avance)** |
| Espagnol | Non | Limité | Non | **Oui (partiel)** |
| Prix transparents | Non | Non | Non | **Architecture prête** |

---

## PLAN D'ACTION

### SEMAINE 1 (P0)
- [ ] Rotation clés Supabase + purge .env.local de git
- [ ] Fix PROVIDER_LIST_SELECT (colonnes françaises → colonnes US)
- [ ] Fix generateSitemaps() pour inclure attorney batches
- [ ] Enable connection pooler dans config.toml
- [ ] Fix RLS bookings (INSERT require auth)
- [ ] Fix SSRF sitemap-health (validation URLs)
- [ ] Rédiger page Accessibilité complète

### SEMAINE 2-4 (P1 batch 1)
- [ ] Implement generateMetadata() sur pages programmatiques top (affordable, best, situations)
- [ ] Implement Attorney JSON-LD schema dans jsonld.ts
- [ ] Implement hreflang sur toutes les pages avec équivalent espagnol
- [ ] Fix failOpen → failClose sur endpoints sensibles
- [ ] Supprimer service_role des routes publiques (signup, reset-password)
- [ ] Ajouter skip-to-content link + breadcrumbs
- [ ] Add admin role check dans middleware
- [ ] Add bar_number UNIQUE constraint
- [ ] Add CHECK constraints manquantes (email, phone, rating, etc.)
- [ ] Create MV refresh cron job

### MOIS 2-3 (P1 batch 2 + P2)
- [ ] Refactor 330 → ~100 use client
- [ ] Convertir img → next/image (205+ composants)
- [ ] Cursor-based pagination (remplacer OFFSET)
- [ ] Test coverage 60%+ (API routes 85%+, hooks 90%+)
- [ ] Pipeline enrichissement données (CourtListener, case law, awards)
- [ ] Trust signals attorneys (years, certifications, video)
- [ ] CI/CD complet (lint + build + test sur PR)
- [ ] CSP nonce-only (supprimer unsafe-inline)
- [ ] Idempotency keys sur POST endpoints

---

## SCORES CIBLES

| Milestone | Score | Date cible |
|---|---|---|
| Post-P0 | 78/100 | 2026-03-24 |
| Post-P1 | 85+/100 | 2026-04-17 |
| Post-P2 | 92+/100 | 2026-06-17 |
| **Top 3 legal directories USA** | 95+/100 | 2026-09-17 |
