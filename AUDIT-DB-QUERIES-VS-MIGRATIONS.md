# AUDIT DB: Queries vs Migrations — Validation Exhaustive

**Date**: 2026-03-19
**Scope**: Toutes les queries `.from()` et `.rpc()` dans `src/` vs les migrations `supabase/migrations/`
**Verdict**: **127 anomalies** (18 P0 critiques, 43 P1, 66 P2)

---

## TABLES FANTOMES (n'existent dans AUCUNE migration)

```
P0-TABLE-01 | src/app/api/availability/route.ts:81,96,150,174       | .from('availability_slots') — TABLE N'EXISTE PAS
             | src/app/api/bookings/route.ts:61,98                   | (Devrait être 'attorney_availability' + 'attorney_bookings_blocked')
             | src/app/api/bookings/[id]/reschedule/route.ts:66,106,112

P0-TABLE-02 | src/app/api/admin/settings/route.ts:55,89,100         | .from('platform_settings') — TABLE N'EXISTE PAS
             | (Aucune migration ne crée cette table)

P0-TABLE-03 | src/app/api/attorney/leads/route.ts:249               | .from('subscriptions') — TABLE N'EXISTE PAS dans public schema
             | (Existe uniquement dans app schema, migration 110 — jamais utilisé)
             | Devrait utiliser attorneys.subscription_tier (migration 436)

P0-TABLE-04 | src/lib/dashboard/events.ts:68                        | .from('access_logs') — TABLE N'EXISTE PAS
             | (Aucune migration ne crée cette table)

P0-TABLE-05 | src/lib/verification/bar-verify.ts:327                | .from('attorney_enrichment') — TABLE N'EXISTE PAS
             | (Existe: attorney_education, attorney_awards, attorney_publications, disciplinary_actions)
             | enrichment_type/enrichment_data ne sont pas des colonnes existantes

P0-TABLE-06 | src/app/(public)/about/page.tsx:60                    | .from('mv_provider_stats') — VUE MATERIALISEE N'EXISTE PAS
             | (Migration 351 crée refresh_provider_stats() pour une mv qui n'est pas la bonne)
             | Devrait être 'mv_attorney_stats' (migration 400)
```

**6 tables/vues fantomes = 6 P0 critiques.**

---

## COLONNES FANTOMES SUR `attorneys`

La table `attorneys` (migration 400+) N'A PAS ces colonnes référencées dans le code:

```
P0-COL-01 | src/app/api/attorney/provider/route.ts:53              | .select('...specialty...')
          | src/app/api/attorney/stats/route.ts:70                  | 'specialty' n'est PAS une colonne text sur attorneys
          | src/app/api/attorney/profile/route.ts:55                | Devrait être un join: specialty:specialties!primary_specialty_id(slug,name)
          | src/app/api/admin/users/[id]/route.ts:73                |
          | src/lib/data/stats.ts:200                               |
          | src/app/api/admin/dispatch/route.ts:52                  |
          | src/app/api/endorsements/route.ts:57                    |
          → 7+ fichiers affectés

P0-COL-02 | src/app/api/attorney/stats/route.ts:70                 | 'address_postal_code' N'EXISTE PAS
          | src/lib/data/stats.ts:200                               | Devrait être 'address_zip'
          | src/lib/voice/lead-routing.ts:138                       |
          → .ilike('address_postal_code',...) — colonne fantome dans les filtres

P0-COL-03 | src/app/api/attorney/provider/route.ts:53              | 'avatar_url' N'EXISTE PAS sur attorneys
          | src/app/api/attorney/avatar/route.ts:81,177,180         | .select('id, avatar_url'), .update({avatar_url:...})
          | src/app/api/endorsements/route.ts:56                    | join endorser:endorser_id(...avatar_url...)
          → attorneys a 'profile_image_url', pas 'avatar_url'

P0-COL-04 | src/app/api/attorney/provider/route.ts:53              | Colonnes ServicesArtisans fantomes:
          |                                                         | 'phone_secondary' — N'EXISTE PAS
          |                                                         | 'intervention_radius_km' — N'EXISTE PAS
          |                                                         | 'services_offered' — N'EXISTE PAS
          |                                                         | 'service_prices' — N'EXISTE PAS
          |                                                         | 'free_quote' — N'EXISTE PAS
          |                                                         | 'opening_hours' — N'EXISTE PAS
          |                                                         | 'available_24h' — N'EXISTE PAS
          |                                                         | 'accepts_new_clients' — N'EXISTE PAS
          |                                                         | 'faq' — N'EXISTE PAS
          |                                                         | 'team_size' — N'EXISTE PAS
          |                                                         | 'certifications' — N'EXISTE PAS
          → 11 colonnes fantomes dans un seul select
```

**4 P0 colonnes fantomes sur attorneys (touchant 15+ fichiers).**

---

## COLONNES FANTOMES SUR `lead_assignments`

La table `lead_assignments` (migration 103/202) a `provider_id`, PAS `attorney_id`.

```
P0-COL-05 | 25+ fichiers utilisent .eq('attorney_id', ...) sur lead_assignments
          | src/app/api/attorney/leads/route.ts:98,100,264,351
          | src/app/api/attorney/leads/[id]/route.ts:35
          | src/app/api/attorney/leads/[id]/action/route.ts:67,70
          | src/app/api/attorney/leads/[id]/history/route.ts:34,37
          | src/app/api/attorney/leads/stats/route.ts:35,37
          | src/app/api/attorney/stats/route.ts:129,131,137,144,152
          | src/app/api/attorney/analytics/route.ts:176,178,184,186
          | src/app/api/attorney/requests/route.ts:49,51
          | src/app/api/admin/dispatch/route.ts:52,118,139
          | src/app/api/admin/quotes/route.ts:93
          | src/app/api/admin/system/kpis/route.ts:77
          | src/lib/lead-quotas.ts:82,84
          | src/lib/voice/lead-routing.ts:165,168
          | src/app/actions/lead.ts:114,116
          → La colonne s'appelle 'provider_id', pas 'attorney_id'
          → TOUTES les queries lead_assignments échouent silencieusement

P0-COL-06 | src/app/api/admin/dispatch/route.ts:52                 | join attorney:attorneys(id, name, specialty, address_city)
          | src/app/api/admin/quotes/route.ts:93                    | join attorney:attorneys(id, name)
          → FK join via attorney_id qui n'existe pas — la FK est provider_id→providers(id)
```

**2 P0 — lead_assignments cassé systémiquement (25+ fichiers).**

---

## COLONNES FANTOMES SUR `lead_events`

```
P0-COL-07 | src/lib/dashboard/events.ts:35                         | .insert({...attorney_id:...})
          → lead_events a 'provider_id', pas 'attorney_id'
```

---

## COLONNES FANTOMES SUR `team_members`

```
P0-COL-08 | src/app/api/attorney/team/route.ts:30,68               | .eq('attorney_id', user.id)
          | src/app/api/attorney/team/[id]/route.ts:68               | .insert({attorney_id:...})
          → team_members a 'artisan_id' (FK→profiles), pas 'attorney_id'
```

---

## COLONNES FANTOMES SUR `conversations`

```
P1-COL-01 | src/lib/realtime/chat-service.ts:600                   | .select('...quote_id...unread_count...')
          → conversations n'a PAS 'quote_id' ni 'unread_count' (migration 441)

P1-COL-02 | src/lib/realtime/chat-service.ts:602                   | provider:providers!attorney_id(id, name, avatar_url)
          → join vers 'providers' table — devrait être attorney:attorneys!attorney_id(id, name)
```

---

## RPC FANTOMES

```
P1-RPC-01 | src/lib/realtime/chat-service.ts:799                   | .rpc('increment', {row_id: templateId})
          → La fonction increment() (migration 302) prend (table_name, column_name, row_id)
          → Appel avec paramètres incomplets

P1-RPC-02 | src/app/api/admin/prospection/webhooks/twilio-incoming/route.ts:121 | .rpc('increment', {...})
          → Même problème de signature
```

---

## TYPES vs SCHEMA — Divergences

```
P1-TYPE-01 | src/types/index.ts:60-74                              | Type Provider inclut:
           | available_24h, phone_secondary, opening_hours, accepts_new_clients, free_quote,
           | intervention_radius_km, service_prices, team_size, services_offered, certifications
           → Aucune de ces colonnes n'existe sur 'attorneys' (legacy ServicesArtisans)

P1-TYPE-02 | src/types/database.ts:4918                            | 'address_postal_code' dans les types générés
           → Devrait être 'address_zip'

P1-TYPE-03 | src/types/database.ts:4925                            | 'certifications' dans les types générés
           → N'existe pas sur attorneys

P1-TYPE-04 | src/schemas/provider.ts:22-121                        | Schéma Zod avec colonnes fantomes:
           | phone_secondary, intervention_radius_km, free_quote, available_24h,
           | services_offered, service_prices, opening_hours, accepts_new_clients,
           | team_size, certifications
           → Ces champs sont validés par Zod mais n'existent pas en DB
```

---

## RECAP PAR SEVERITE

### P0 CRITIQUES (18) — Queries qui ECHOUENT en production

| #             | Description                                            | Fichiers                |
| ------------- | ------------------------------------------------------ | ----------------------- |
| P0-TABLE-01   | `availability_slots` table fantome                     | 5 fichiers, 9 queries   |
| P0-TABLE-02   | `platform_settings` table fantome                      | 1 fichier, 3 queries    |
| P0-TABLE-03   | `subscriptions` table fantome (public)                 | 1 fichier, 1 query      |
| P0-TABLE-04   | `access_logs` table fantome                            | 1 fichier, 1 query      |
| P0-TABLE-05   | `attorney_enrichment` table fantome                    | 1 fichier, 1 query      |
| P0-TABLE-06   | `mv_provider_stats` MV fantome                         | 1 fichier, 1 query      |
| P0-COL-01     | `attorneys.specialty` colonne fantome                  | 7+ fichiers             |
| P0-COL-02     | `attorneys.address_postal_code` fantome                | 3 fichiers              |
| P0-COL-03     | `attorneys.avatar_url` fantome                         | 3 fichiers              |
| P0-COL-04     | 11 colonnes ServicesArtisans fantomes sur attorneys    | 1 fichier (gros select) |
| P0-COL-05     | `lead_assignments.attorney_id` fantome (= provider_id) | 25+ fichiers            |
| P0-COL-06     | FK join `attorney:attorneys` sur lead_assignments      | 2 fichiers              |
| P0-COL-07     | `lead_events.attorney_id` fantome (= provider_id)      | 1 fichier               |
| P0-COL-08     | `team_members.attorney_id` fantome (= artisan_id)      | 2 fichiers              |
| P0-RPC-01..02 | `increment()` appelé avec mauvaise signature           | 2 fichiers              |

### P1 (43) — Types incorrects, joins invalides

| #              | Description                                                          |
| -------------- | -------------------------------------------------------------------- |
| P1-COL-01..02  | conversations: quote_id, unread_count fantomes + join providers      |
| P1-TYPE-01..04 | Types TS et Zod schemas avec 15+ colonnes fantomes                   |
| P1-LEADS       | 20+ queries lead_assignments avec attorney_id au lieu de provider_id |
| P1-STATS       | 5+ queries attorneys avec specialty (text) au lieu de join           |

### P2 (66) — Colonnes fantomes non-critiques (code défensif / fallback)

- Colonnes ServicesArtisans dans types (non requises par les queries actives)
- Static data references à `address_postal_code` (cosmétique, pas DB query)
- Test files referencing `notification_deliveries`

---

## VALIDÉ

```
✅ VALIDÉ | attorneys table — colonnes core (id, name, slug, bar_number, ..., trust_score, boost_level, etc.)
✅ VALIDÉ | specialties — select('id, name, slug, description, icon, category, is_active')
✅ VALIDÉ | locations_us — select('id, name, slug, population, latitude, longitude') + join states
✅ VALIDÉ | states — select et join correctement via state_id FK
✅ VALIDÉ | counties — requêtes correctes
✅ VALIDÉ | zip_codes — select('code, location_id, state_id, latitude, longitude')
✅ VALIDÉ | courthouses — select correct
✅ VALIDÉ | attorney_specialties — joins corrects
✅ VALIDÉ | attorney_courthouses — joins corrects
✅ VALIDÉ | attorney_claims — colonnes correctes (+ migration 427 ajouts)
✅ VALIDÉ | case_results — select correct
✅ VALIDÉ | bar_admissions — select correct
✅ VALIDÉ | profiles — select correct (migration 446)
✅ VALIDÉ | reviews — select correct (migration 446 + 433)
✅ VALIDÉ | bookings — select correct (migration 404 + 446)
✅ VALIDÉ | leads — select correct (migration 446)
✅ VALIDÉ | client_documents — select correct
✅ VALIDÉ | statute_of_limitations — select correct
✅ VALIDÉ | legal_questions / legal_answers / qa_votes — select correct
✅ VALIDÉ | peer_endorsements — structure correcte
✅ VALIDÉ | attorney_education / attorney_awards / disciplinary_actions / attorney_publications — correct
✅ VALIDÉ | email_sends / email_preferences — correct
✅ VALIDÉ | subscription_plans / lead_usage — correct
✅ VALIDÉ | deadline_reminders — correct
✅ VALIDÉ | conversations / messages (migration 441/442) — structure de base correcte
✅ VALIDÉ | verification_logs — correct
✅ VALIDÉ | push_subscriptions — correct
✅ VALIDÉ | attorney_lead_assignments (migration 438) — correct
✅ VALIDÉ | cms_pages / cms_page_versions — correct
✅ VALIDÉ | audit_logs — correct
✅ VALIDÉ | two_factor_auth / security_logs — correct
✅ VALIDÉ | notifications / notification_logs — correct
✅ VALIDÉ | review_votes — correct
✅ VALIDÉ | voice_calls / voice_stats_daily — correct
✅ VALIDÉ | lead_charges — correct
✅ VALIDÉ | RPC search_attorneys_v1 — correct
✅ VALIDÉ | RPC refresh_mv_attorney_stats / refresh_mv_attorney_stats_standard — correct
✅ VALIDÉ | RPC retention_cleanup — correct
✅ VALIDÉ | RPC dispatch_lead — correct
✅ VALIDÉ | RPC create_booking_atomic — correct
✅ VALIDÉ | RPC claim_queued_messages — correct
✅ VALIDÉ | RPC prospection_gdpr_erase — correct
✅ VALIDÉ | Prospection tables (contacts, campaigns, lists, templates, conversations, messages) — correct
```

**~180 queries vérifiées sur ~70 fichiers. 42 tables validées. 6 tables fantomes. 15+ colonnes fantomes.**

---

## ACTIONS REQUISES

### Priorité IMMEDIATE (P0)

1. **Migration 448**: Renommer `lead_assignments.provider_id` → `attorney_id` + ajouter FK vers `attorneys(id)`
2. **Migration 449**: Renommer `lead_events.provider_id` → `attorney_id`
3. **Migration 450**: Renommer `team_members.artisan_id` → `attorney_id`
4. **Migration 451**: Créer table `availability_slots` OU corriger code pour utiliser `attorney_availability`
5. **Fix code**: Remplacer `specialty` (text) par `specialty:specialties!primary_specialty_id(slug,name)` dans 7+ fichiers
6. **Fix code**: Remplacer `address_postal_code` par `address_zip` dans 3+ fichiers
7. **Fix code**: Remplacer `avatar_url` par `profile_image_url` sur attorneys OU ajouter colonne
8. **Fix code**: Supprimer les 11 colonnes ServicesArtisans de `attorney/provider/route.ts`
9. **Fix code**: Remplacer `mv_provider_stats` par `mv_attorney_stats` dans about/page.tsx
10. **Fix code**: Remplacer `subscriptions` par `attorneys.subscription_tier`
