# RECAP COMPLET — EXPANSION MARCHE AMERICAIN
# ServicesArtisans → US Home Services Platform

**Date :** 6 mars 2026
**Contexte :** Etude de faisabilite pour dupliquer le modele ServicesArtisans sur le marche americain

---

## 1. FAISABILITE TECHNIQUE — FORK DU PROJET

### Verdict : ~90% du travail deja fait

Le projet ServicesArtisans (Next.js 14 + Supabase + Tailwind + TypeScript) est directement reutilisable via un **fork** (copie independante du code).

### Ce qui est reutilisable tel quel (~90%)

- Systeme d'authentification + gestion des roles
- Workflow devis / bookings
- Messaging entre clients et pros
- Reviews + moderation
- Dashboard admin complet
- Systeme de lead assignment
- Infrastructure SEO (sitemap, metadata, pages statiques)
- Integration Stripe
- Composants UI (Header, Footer, Hero, cartes, formulaires)

### Ce qui demande une adaptation (~10%)

| Element | Adaptation |
|---|---|
| Textes | Francais → Anglais (dans les composants) |
| Donnees geo | Communes/departements → ZIP codes/cities/states |
| Reglementation | SIRET/code NAF → EIN/license number |
| Devises | EUR → USD |
| Pages SEO | Recreaion pour villes/states US |

### Approche recommandee : Fork (pas i18n)

Un fork (copie independante) est preferable a l'internationalisation car :
- Les marches sont trop differents (reglementations, donnees geo, SEO)
- Chaque site peut evoluer independamment
- Pas de risque de casser le site FR
- Avancement rapide sans complexite i18n

---

## 2. SCHEMA DE BASE DE DONNEES

### 95% du schema reste identique

| Table | Changement |
|---|---|
| `providers` | `siret` → `ein` ou `license_number`, `address_department` → `state`, `code_naf` → supprime |
| `communes` | Remplacee par table `cities` (ZIP code, state, county, population) |
| `devis_requests` | `postal_code` reste, `city` reste — meme logique |
| `bookings` | Identique |
| `reviews` | Identique |
| `conversations` / `messages` | Identique |
| `profiles` | Identique |
| `services` | Memes services, noms en anglais (plombier → plumber) |
| `lead_assignments` | Identique |

---

## 3. STRUCTURE DES PAGES

### Meme architecture, contenu adapte

| Page FR | Page US | Changement |
|---|---|---|
| `/tarifs/` | `/pricing/` | Memes composants, texte EN, prix en $ |
| `/urgence/` | `/emergency/` | Meme logique |
| `/avis/` | `/reviews/` | Identique |
| `/devis/` | `/free-quote/` | Meme formulaire |
| `/guides/` | `/guides/` | Articles en anglais |
| `/dept x service` | `/state x service` | Departements → States |
| `/region x service` | Supprime ou `/area x service` | Pas de regions aux US |
| `/ville/[slug]` | `/city/[slug]` | Communes → US cities |

---

## 4. PAGES PROGRAMMATIQUES — ANALYSE RIGOUREUSE

### 4.1 Inventaire geographique US (sources federales)

| Entite | Nombre | Source |
|---|---|---|
| ZIP Codes actifs | 41,554 | USPS, fev. 2026 |
| Incorporated Places (villes) | 19,479 | U.S. Census Bureau, 2024 |
| Census Designated Places | ~9,800 | U.S. Census Bureau, 2020 |
| Counties & equivalents | 3,244 | U.S. Census Bureau |
| States + DC | 51 | — |
| Metropolitan Statistical Areas | 387 | OMB, 2023 |
| Neighborhoods | 30,000+ | Simplemaps / donnees academiques |

### 4.2 Catalogue de services recommande : 75 services

**Tier 1 — 20 services a fort volume :**
Plumber, Electrician, HVAC Technician, Roofer, Painter, Landscaper, Handyman, Pest Control, Locksmith, General Contractor, Carpet Cleaner, Maid/House Cleaner, Appliance Repair, Garage Door Repair, Tree Service, Fencing Contractor, Concrete/Masonry, Flooring Installer, Window Installation, Moving Service

**Tier 2 — 30 services a volume moyen :**
Gutter Cleaning, Pressure Washing, Drywall Repair, Deck Building, Foundation Repair, Siding Installation, Insulation, Septic Service, Pool Service, Chimney Sweep, Waterproofing, Mold Remediation, Fire/Water Damage Restoration, Home Inspector, Interior Designer, Kitchen Remodeling, Bathroom Remodeling, Basement Finishing, Window Cleaning, Irrigation/Sprinkler, Snow Removal, Paving/Asphalt, Cabinet Maker, Countertop Installation, Home Security Installation, Solar Panel Installation, Welding, Glass & Mirror, Stucco Contractor, Demolition

**Tier 3 — 25 services niche :**
Epoxy Flooring, Home Staging, Hardwood Floor Refinishing, Tile Installation, Brick & Stone Veneer, Fence Staining, Hot Tub Installation, Home Theater Installation, Smart Home Setup, Generator Installation, EV Charger Installation, Radon Mitigation, Asbestos Removal, Lead Paint Removal, Duct Cleaning, Fireplace Installation, Elevator/Stairlift, Accessibility Modifications, Awning Installation, Mosquito Control, Wildlife Removal, Junk Removal, Closet Organization, Shower Door Installation, Artificial Turf Installation

### 4.3 Trois scenarios de pages

| Scenario | Pages | Multiplicateur vs France (2M) |
|---|---|---|
| **Conservateur** (ZIP + villes + counties + states) | **5,834,025** | **2.9x** |
| **Modere** (+ CDPs + neighborhoods) | **8,444,025** | **4.2x** |
| **Agressif** (+ variations long-tail) | **13,091,925** | **6.5x** |

### 4.4 Detail du calcul — Scenario conservateur (5.8M)

| Croisement | Calcul | Pages |
|---|---|---|
| ZIP code x 75 services | 41,554 x 75 | 3,116,550 |
| City x 75 services | 19,479 x 75 | 1,460,925 |
| County x 75 services | 3,244 x 75 | 243,300 |
| State x 75 services | 51 x 75 | 3,825 |
| MSA x 75 services | 387 x 75 | 29,025 |
| Pages contenu (pricing, guides, etc.) | — | 980,400 |
| **TOTAL** | | **5,834,025** |

### 4.5 Detail du calcul — Scenario modere (8.4M) — RECOMMANDE

Conservateur + :

| Croisement | Calcul | Pages |
|---|---|---|
| CDP x 75 services | 9,800 x 75 | 735,000 |
| Neighborhood x 75 services | 25,000 x 75 | 1,875,000 |
| **TOTAL** | | **8,444,025** |

### 4.6 Detail du calcul — Scenario agressif (13.1M)

Modere + variations long-tail :

| Variation | Pages supplementaires |
|---|---|
| "emergency [service] [city]" | 486,975 |
| "affordable [service] [city]" | 375,000 |
| "licensed [service] [city]" | 375,000 |
| "24 hour [service] [city]" | 200,000 |
| "[service] cost [city]" | 1,460,925 |
| "[service] [city] reviews" | 750,000 |
| Unincorporated communities x service | 1,000,000 |
| **TOTAL** | **13,091,925** |

### 4.7 Pourquoi le plan modere est recommande

- **Pas le conservateur** : laisse les neighborhoods (recherches hyperlocales les plus rentables) sur la table
- **Pas l'agressif au lancement** : variations long-tail risquent le thin content / penalite Google si pas de contenu reellement unique
- **Le modere** : couverture quasi totale, chaque type de page repond a une intention differente (pas de cannibalisation), techniquement faisable avec ISR
- L'agressif devient pertinent en Phase 2 quand on a des donnees reelles (prix, avis, temps de reponse) pour alimenter les pages

---

## 5. MARCHE DES ARTISANS / PROFESSIONALS

### 5.1 Nombre de professionnels par metier (BLS, 2024)

| Metier | Employes aux USA |
|---|---|
| Landscapers / Grounds Maintenance | 1,300,000 |
| Electricians | 818,700 |
| Plumbers, Pipefitters | 504,500 |
| HVAC Technicians | ~470,000 |
| General Contractors | ~400,000 |
| Painters | ~350,000 |
| Carpenters | ~350,000 |
| Pest Control | ~170,000 |
| Roofers | 166,700 |
| Locksmiths | ~30,000 |
| Autres metiers (30+ categories) | ~1,500,000+ |
| **TOTAL** | **~6,100,000** |

Projection 2028 : **7,200,000 professionnels**

### 5.2 Comparaison France vs USA

| | France | USA |
|---|---|---|
| Artisans / pros | ~550,000 | **6,100,000** (11x) |
| Population | 67M | **335M** (5x) |
| Marche home services | ~45 Mds EUR | **$842 Mds USD** (18.7x) |
| Recherches "near me" /mois | ~500K | **~3,000K+** (6x) |
| Providers dans la DB actuelle | ~180,000 | Cible : 2-5M |

### 5.3 Plan d'acquisition des providers

| Phase | Providers | Methode |
|---|---|---|
| Lancement | 500K - 1M | Scraping registres publics (licences d'etat, EIN) |
| 6 mois | 1M - 2M | Claims + inscriptions organiques |
| 12 mois | 2M - 3M | Croissance organique + partenariats |
| Maturite | 5M+ | Auto-inscriptions, referral |

---

## 6. STRATEGIE DE DEPLOIEMENT EN 5 PHASES

### Phase 1 — MVP (Mois 1-2)
- 50 states x 75 services = 3,825 pages
- 3,244 counties x 75 services = 243,300 pages
- Top 1,000 cities x 75 services = 75,000 pages
- Pages /pricing/, /emergency/, /free-quote/
- **Total : ~325,000 pages**

### Phase 2 — Scale cities (Mois 3-4)
- 19,479 cities x 75 services = 1,460,925 pages
- Pages reviews par ville
- **Total cumule : ~2,500,000 pages**

### Phase 3 — ZIP codes (Mois 5-6)
- 41,554 ZIP codes x 75 services = 3,116,550 pages
- **Total cumule : ~5,800,000 pages**

### Phase 4 — Hyperlocal (Mois 7-9)
- Neighborhoods x services = 1,875,000 pages
- CDPs x services = 735,000 pages
- **Total cumule : ~8,400,000 pages**

### Phase 5 — Long-tail (Mois 10-12, optionnel)
- Variations "emergency", "affordable", "cost", "reviews"
- **Total cumule : ~13,000,000 pages**

---

## 7. FAISABILITE TECHNIQUE

### Infrastructure

| Element | Solution |
|---|---|
| Rendu des pages | ISR (Incremental Static Regeneration) — pre-build top 100K pages, reste a la demande |
| Hosting | Vercel (meme stack que FR) |
| Base de donnees | Supabase (nouveau projet, meme schema) |
| Donnees geo | USPS ZIP DB ($100/an) + Census Places (gratuit) + Simplemaps ($99) |
| Sitemaps | Sitemaps indexes fragmentes (max 50K URLs/sitemap = 120-260 sitemaps) |

### Cout donnees geographiques : < $500

---

## 8. TOTAL REEL DE PAGES — AVEC FICHES PROVIDERS

### 8.1 Les fiches providers changent l'echelle

Les pages programmatiques (geo x service) ne representent qu'une partie du volume total. Chaque provider a sa propre fiche individuelle avec du contenu naturellement unique (nom, specialite, bio, avis, photos, licence, tarifs).

### 8.2 Acquisition de providers — volume de fiches

| Phase | Providers | Fiches individuelles |
|---|---|---|
| Lancement (scraping registres publics) | 500K - 1M | 500,000 - 1,000,000 pages |
| 6 mois | 1M - 2M | 1,000,000 - 2,000,000 pages |
| 12 mois | 2M - 3M | 2,000,000 - 3,000,000 pages |
| Maturite | 5M+ | 5,000,000+ pages |

### 8.3 Total reel par scenario (pages programmatiques + fiches)

| Scenario | Pages programmatiques | Fiches providers | **TOTAL** |
|---|---|---|---|
| **Conservateur (lancement)** | 5,834,025 | 1,000,000 | **~6,800,000** |
| **Modere (lancement)** | 8,444,025 | 1,000,000 | **~9,400,000** |
| **Modere (maturite)** | 8,444,025 | 5,000,000 | **~13,400,000** |
| **Agressif (maturite)** | 13,091,925 | 5,000,000 | **~18,000,000** |

### 8.4 Comparaison avec Angi (leader du marche)

| | Angi (actuel) | **Nous (lancement)** | **Nous (maturite)** |
|---|---|---|---|
| Pages indexees | 2.1M | **9.4M** | **13.4M - 18M** |
| Ratio vs Angi | 1x | **4.5x** | **6.4x - 8.6x** |

### 8.5 Pourquoi les fiches providers sont un avantage SEO majeur

- **Contenu naturellement unique** — chaque fiche est differente (vs pages geo x service qui peuvent se ressembler)
- **Google adore les fiches business** — c'est exactement comme ca que Yelp domine le SEO avec ses millions de fiches
- **Rich snippets** — schema markup LocalBusiness/HomeAndConstructionBusiness pour chaque fiche
- **Long-tail automatique** — "John Smith Plumber Dallas TX" = requete naturelle
- **Source de scraping au lancement** : registres publics de licences d'etat → 500K-1M de fiches des le jour 1

---

## 9. ANALYSE DE LA CONCURRENCE

### 9.1 Les principaux acteurs

| Plateforme | Revenue | Valorisation | Pages indexees | Modele |
|---|---|---|---|---|
| **Angi** (Angie's List + HomeAdvisor) | ~$1.03 Mds (2025, -13% YoY) | Cote NASDAQ | 2.1M pages | Lead gen + abonnement |
| **Thumbtack** | ~$400M (2024) | $3.2 Mds (prive) | 300K+ pros actifs | Marketplace pay-per-lead |
| **Yelp** | ~$1.3 Mds | Cote NYSE | Dizaines de millions (toutes categories) | Avis + pub locale |
| **Houzz** | Non divulgue | ~$4 Mds (2017) | Focus design/renovation | Marketplace + e-commerce |
| **Porch** | Non divulgue | Cote (via SPAC) | 3M+ pros listes | Lead gen, $360/an |
| **Bark** | Non divulgue | UK-based, expansion US | Multi-categories | Pay-per-lead |

### 9.2 Angi en declin — fenetre d'opportunite

- Revenue en baisse de **13% en 2025** ($1.03 Mds vs $1.19 Mds en 2024)
- Prevision 2026 : seulement **+1% a +3%** de croissance
- Chute de **79%** du Network Revenue (Q4 2025)
- Restructurations massives en cours
- Le leader historique est affaibli — **c'est le moment ideal pour attaquer**

### 9.3 Strategie SEO d'Angi

- 500+ categories de services
- Pages programmatiques `[service] + [city/state]`
- Formules automatisees pour titles/descriptions
- **Mais seulement 2.1M pages indexees** — nous visons 4.5x a 8.6x ce volume

### 9.4 Nos avantages competitifs

1. **Densite de pages 4x+ superieure** a Angi — couverture ZIP codes + neighborhoods qu'ils ne font pas
2. **Angi est en declin** — fenetre d'opportunite pour prendre du trafic organique
3. **Cout d'entree faible** (~$1,000) vs les milliards investis par les concurrents
4. **Stack moderne** (Next.js ISR) vs plateformes legacy
5. **Pas de dependance aux leads payants** — trafic organique pur
6. **Fiches providers = contenu unique a grande echelle**

### 9.5 Nos faiblesses vs eux

1. Zero notoriete de marque aux USA
2. Pas d'avis utilisateurs au lancement (Yelp en a des millions)
3. Pas de base de providers etablie (Angi a 6M d'utilisateurs)
4. Risque thin content si les pages programmatiques ne sont pas suffisamment differenciees

---

## 10. STRATEGIE D'ACQUISITION DE DOMAINE

### 10.1 Pourquoi acheter un domaine avec backlinks existants

Sur le marche US, le SEO programmatique seul ne suffit pas — il faut de l'autorite de domaine (DA/DR) pour que Google indexe et rank 9.4M pages. Un domaine neuf = sandbox Google de 6-12 mois.

| Domaine neuf | Domaine avec historique |
|---|---|
| DA 0, sandbox Google 6-12 mois | DA 30-60+, indexation rapide |
| 0 backlinks, 0 trust | Des milliers de backlinks existants |
| Google ignore les 9.4M pages | Google crawle et indexe agressivement |
| Resultats dans 12-18 mois | Resultats dans 2-4 mois |

### 10.2 Criteres de selection du domaine

| Critere | Minimum | Ideal |
|---|---|---|
| DR (Ahrefs) / DA (Moz) | 30+ | 50+ |
| Backlinks | 5,000+ | 50,000+ |
| Referring domains | 500+ | 2,000+ |
| Niche | Home services / construction / local services | Exact match |
| Historique | Pas de penalite Google, pas de spam | Clean sur Wayback Machine |
| Extension | .com obligatoire | — |
| Trafic residuel | Bonus | — |

### 10.3 Types de domaines a cibler (par ordre de preference)

1. **Ancien concurrent mort** — site home services US qui a ferme mais garde ses backlinks
2. **Blog/magazine home improvement** abandonne — contenu pertinent, bons liens
3. **Annuaire local** qui a ferme — exact meme niche
4. **Site d'avis/comparaison** home services defunt

### 10.4 Plateformes d'achat

**Plateformes specialisees (recommandees) :**

| Plateforme | Specialite | Prix typiques |
|---|---|---|
| [SpamZilla](https://www.spamzilla.io/) | Filtrage avance (Ahrefs, Moz, Majestic), 350K domaines/jour | $10 - $5,000+ |
| [Odys Global](https://odys.global/) | Domaines premium verifies manuellement, invite-only | $500 - $50,000+ |
| [SEO.Domains](https://seo.domains/) | Domaines verifies spam-free par niche | $200 - $10,000+ |
| [Domain Coasters](https://domaincoasters.com/) | Prefere des agences SEO, filtres par business type | Variable |
| [SerpDomains](https://serp.domains/) | Domaines ages avec autorite | $300 - $20,000+ |
| [ExpiredDomains.net](https://www.expireddomains.net/) | Liste gratuite mise a jour quotidiennement, 677 TLDs | Gratuit (puis achat via registrar) |

**Encheres classiques :**

| Plateforme | Note |
|---|---|
| [Sedo](https://sedo.com/) | 2,000+ domaines/jour, a partir de $79 |
| [GoDaddy Auctions](https://auctions.godaddy.com/) | Le plus gros volume, qualite variable |
| [Dynadot](https://www.dynadot.com/market/auction) | Filtrable par backlinks, age, TLD |
| [Name.com Aftermarket](https://www.name.com/aftermarket) | Domaines avec SEO authority existante |

### 10.5 Budget recommande

| Budget | Strategie |
|---|---|
| $500 - $2,000 | ExpiredDomains.net + SpamZilla — .com niche home services avec DR 30-40 |
| $2,000 - $10,000 | Odys ou SEO.Domains — domaine verifie, clean, DR 40-55 |
| $10,000 - $50,000 | Domaine premium exact-match type `homeservicespro.com` avec DR 50+ |

### 10.6 Checklist avant achat

1. **Wayback Machine** — verifier que le site n'etait pas du spam/casino/adult
2. **Ahrefs/Moz** — verifier le profil de backlinks (pas de PBN, pas de liens toxiques)
3. **Google "site:domain.com"** — verifier s'il reste des pages indexees
4. **Google Safe Browsing** — pas de malware flagge
5. **Archive.org** — le contenu historique doit etre coherent avec home services
6. **Penalite manuelle** — impossible a verifier avant achat, mais l'historique Wayback donne des indices

### 10.7 Scenario ideal

Un ancien annuaire ou site de lead gen home services US qui a ferme en 2023-2024, avec :
- DR 40+
- 1,000+ referring domains
- Backlinks de sites .gov, .edu, medias locaux
- Historique clean sur 5+ ans
- Nom de domaine brandable en .com

**Ce genre de domaine + 9.4M pages = indexation rapide + ranking quasi immediat sur le long-tail.**

### 10.8 Domaines identifies — Startups home services fermees

| Entreprise | Statut | Domaine | Interet |
|---|---|---|---|
| **SERVIZ** | Ferme (site down) | serviz.com | Avait leve $12.5M, backlinks de BusinessWire, LA Business Journal, TrustPilot |
| **Redbeacon** | Absorbe par Home Depot | redbeacon.com | Redirige vers Home Depot — probablement pas dispo |
| **ServiceMagic** | Redirige vers HomeAdvisor | servicemagic.com | Detenu par Angi/IAC — pas dispo |
| **EasyKnock** | Ferme dec. 2024 | easyknock.com | Immobilier, pas home services — hors niche |

**Note :** Les gros domaines niche home services sont soit encore actifs, soit detenus par Angi/IAC. Les vrais domaines interessants se trouvent dans les bases SpamZilla/DomCop qu'il faut filtrer manuellement.

### 10.9 Plan d'action concret pour trouver le bon domaine

**Etape 1 — Outils gratuits (jour 1)**

1. Aller sur [ExpiredDomains.net](https://www.expireddomains.net/) (gratuit)
2. Filtrer : `.com` uniquement, contenant les mots-cles :
   - `homeservice`, `homepro`, `findpro`, `hirecontractor`, `localrepair`
   - `proconnect`, `fixhome`, `homefix`, `repairpro`, `handypro`
   - `contractornear`, `servicepro`, `homehelp`, `prolocal`
3. Trier par Backlinks (BL) decroissant
4. Verifier sur [web.archive.org](https://web.archive.org/) que le contenu etait clean

**Etape 2 — Outils payants (~$50/mois)**

1. [SpamZilla](https://www.spamzilla.io/) — $37/mois
   - Filtre : keyword "home service" OR "contractor" OR "repair"
   - DR > 30, Referring Domains > 500, .com only
   - Categorie Majestic : "Home" ou "Business"

2. [DomCop](https://www.domcop.com/domains/topical-trust-flow-category/87-Home) — categorie **"Home"** deja disponible
   - Filtre par Topical Trust Flow = Home
   - DR > 30, pas de spam flag

**Etape 3 — Verification avant achat**

```
1. Wayback Machine — contenu historique clean (pas spam/casino/adult)
2. Ahrefs (essai gratuit) — profil backlinks sain (pas de PBN, pas de liens toxiques)
3. Google "site:domain.com" — pages encore indexees ?
4. Google Safe Browsing — pas flagge malware
5. Pas de penalite visible (pas de chute brutale de trafic dans Ahrefs)
```

**Etape 4 — Alternatives si rien de parfait en "home services"**

Chercher un domaine **adjacent** avec forte autorite :
- Blog **bricolage / DIY** ferme
- Magazine **immobilier** local defunt
- Annuaire **local business** generaliste ferme
- Site **d'avis consommateurs** abandonne

L'important c'est le **DR + backlinks clean**, pas forcement le nom exact. On peut rebrandir n'importe quel domaine.

---

## 11. RISQUES

| Risque | Impact | Mitigation |
|---|---|---|
| Thin content / penalite Google | CRITIQUE | Templates varies, donnees locales uniques |
| Cannibalisation ZIP vs City | MODERE | Schema markup distinct, intent matching |
| Concurrence (Angi, Thumbtack, HomeAdvisor) | ELEVE | Densite de pages locales + contenu unique |
| Qualite des donnees providers | ELEVE | Scraping initial + programme de claims |
| Cout infrastructure 13M pages | FAIBLE | ISR + CDN cache = cout marginal quasi nul |

---

## 12. DECISIONS BUSINESS A PRENDRE

Avant de lancer le developpement :

1. **Acheter un domaine avec backlinks** (voir section 10 — budget $500 a $50,000)
2. **Quels metiers cibler en premier** (plumber, electrician, HVAC = top 3 volume)
3. **Quelles villes/states cibler au lancement** (California, Texas, Florida = top 3 population)
4. **Structure juridique** aux US (LLC, business entity)
5. **Budget initial** (domaine + hosting + donnees geo = ~$1,500-$5,000 pour demarrer, domaine inclus)

---

## 13. SOURCES

- [USPS ZIP Code Facts](https://facts.usps.com/42000-zip-codes/)
- [U.S. Census Bureau — City and Town Population Totals 2020-2024](https://www.census.gov/data/tables/time-series/demo/popest/2020s-total-cities-and-towns.html)
- [County (United States) — Wikipedia](https://en.wikipedia.org/wiki/County_(United_States))
- [Metropolitan Statistical Area — Wikipedia](https://en.wikipedia.org/wiki/Metropolitan_statistical_area)
- [Simplemaps US Neighborhoods Database](https://simplemaps.com/data/us-neighborhoods)
- [US Home Service Market — Mordor Intelligence](https://www.mordorintelligence.com/industry-reports/us-home-service-market)
- [US Home Services Market — Expert Market Research](https://www.expertmarketresearch.com/reports/united-states-home-services-market)
- [KPMG Home Services Industry Update Fall 2025](https://corporatefinance.kpmg.com/us/en/insights/2025/home-services-industry-update-fall.html)
- [Home Services Google Usage Statistics — Hook Agency](https://hookagency.com/blog/home-services-google-usage-statistics/)
- [BLS — Electricians](https://www.bls.gov/ooh/construction-and-extraction/electricians.htm)
- [BLS — Plumbers](https://www.bls.gov/ooh/construction-and-extraction/plumbers-pipefitters-and-steamfitters.htm)
- [BLS — Grounds Maintenance Workers](https://www.bls.gov/ooh/building-and-grounds-cleaning/grounds-maintenance-workers.htm)
- [BLS — Roofers](https://www.bls.gov/ooh/construction-and-extraction/roofers.htm)
- [How Many Home Services Professionals in the US — Valve+Meter](https://valveandmeter.com/blog/marketing/how-many-home-services-professionals-us/)
- [Nature — City-Defined Neighborhood Boundaries in the US](https://www.nature.com/articles/s41597-025-05329-6)

---

### Sources concurrence (ajoutees le 6 mars 2026)

- [How Angi Uses Near Me SEO To Dominate the $506B Home Services Industry](https://foundationinc.co/lab/angi-near-me-seo-strategy)
- [Angi Q4 2025 Financial Results: Revenue Down 10.1%](https://www.indexbox.io/blog/angi-q4-2025-earnings-revenue-and-profit-miss-analyst-estimates/)
- [Angi outlines low single-digit revenue growth for 2026](https://seekingalpha.com/news/4550492-angi-outlines-low-single-digit-revenue-growth-for-2026-as-ai-integration-and-brand-spend-ramp)
- [Thumbtack hit $400M revenue in 2024](https://getlatka.com/companies/thumbtack.com)
- [Thumbtack Secures $275M at $3.2B Valuation](https://press.thumbtack.com/announcements/thumbtack-secures-275-million-investment-at-3-2-billion-valuation/)
- [Home Services Industry Trends 2026 — ServiceTitan](https://www.servicetitan.com/blog/home-services-industry-trends)

### Sources acquisition de domaine (ajoutees le 6 mars 2026)

- [SpamZilla — Buy Expired Domains](https://www.spamzilla.io/)
- [Odys Global — Buy Premium Expired Domains](https://odys.global/)
- [SEO.Domains Marketplace](https://seo.domains/)
- [Domain Coasters — Expired Domains for SEO](https://domaincoasters.com/)
- [ExpiredDomains.net](https://www.expireddomains.net/)
- [Sedo — Expiring Domain Auctions](https://sedo.com/)
- [How to Buy Expired Domains 2026](https://www.demandsage.com/buy-expired-domains/)

### Sources domaines identifies (ajoutees le 6 mars 2026)

- [SERVIZ — Wikipedia](https://en.wikipedia.org/wiki/SERVIZ)
- [SERVIZ raises $12.5M — Built In LA](https://www.builtinla.com/2014/12/16/serviz-raises-125m-disrupt-home-services-20-new-cities)
- [ServiceMagic Rebrands As HomeAdvisor — Domain Investing](https://domaininvesting.com/service-magic-rebrands-as-home-advisor/)
- [DomCop — Expired Domains Home Niche](https://www.domcop.com/domains/topical-trust-flow-category/87-Home)

*Document genere le 6 mars 2026 — Recap complet de l'etude d'expansion US (mis a jour avec analyse concurrentielle, fiches providers, strategie acquisition domaine et plan d'action concret)*
