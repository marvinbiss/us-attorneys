/**
 * LEGACY TYPES — DO NOT USE IN NEW CODE
 *
 * These fields were dropped from the database in v2 schema cleanup
 * (100_v2_schema_cleanup.sql). They are undefined at runtime.
 *
 * They exist solely to keep pre-v2 components compiling until their
 * dedicated PRs migrate them. Each PR that cleans a component should
 * remove its LegacyAttorney/LegacyProvider usage.
 *
 * @deprecated — will be deleted when all components are on v2 types.
 */

import type { Provider } from '@/types'
import type { Artisan } from '@/components/attorney/types'

// ── Provider legacy fields ──────────────────────────────────────────

/** @deprecated — is_premium, trust_badge, trust_score dropped in v2 */
export interface LegacyProviderFields {
  is_premium?: boolean
  trust_badge?: string
  trust_score?: number
}

/** @deprecated */
export type LegacyProvider = Provider & LegacyProviderFields

// ── Attorney legacy fields ──────────────────────────────────────────

/** @deprecated — all fields below dropped in v2 */
export interface LegacyAttorneyFields {
  is_premium?: boolean
  hourly_rate?: number
  response_time?: string
  response_rate?: number
  intervention_zone?: string
  intervention_zones?: string[]
  bookings_this_week?: number
  annual_revenue?: number
}

/** @deprecated */
export type LegacyAttorney = Artisan & LegacyAttorneyFields
