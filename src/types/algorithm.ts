/**
 * Types for algorithm configuration
 * Corresponds to the app.algorithm_config table
 */

export type MatchingStrategy = 'round_robin' | 'scored' | 'geographic'
export type SpecialtyMatchMode = 'exact' | 'fuzzy' | 'category'

export interface AlgorithmConfig {
  id: string

  // Distribution
  matching_strategy: MatchingStrategy
  max_attorneys_per_lead: number
  geo_radius_km: number
  require_same_department: boolean
  require_specialty_match: boolean
  specialty_match_mode: SpecialtyMatchMode

  // Scoring (weights 0-100)
  weight_rating: number
  weight_reviews: number
  weight_verified: number
  weight_proximity: number
  weight_data_quality: number

  // Quotas
  daily_lead_quota: number
  monthly_lead_quota: number
  cooldown_minutes: number

  // Expiration
  lead_expiry_hours: number
  quote_expiry_hours: number
  auto_reassign_hours: number

  // Filters
  min_rating: number
  require_verified_urgent: boolean
  exclude_inactive_days: number
  prefer_claimed: boolean

  // Urgency multipliers
  urgency_low_multiplier: number
  urgency_medium_multiplier: number
  urgency_high_multiplier: number
  urgency_emergency_multiplier: number

  // Metadata
  updated_at: string
  updated_by: string | null
}

export const DEFAULT_ALGORITHM_CONFIG: Omit<AlgorithmConfig, 'id' | 'updated_at' | 'updated_by'> = {
  matching_strategy: 'scored',
  max_attorneys_per_lead: 3,
  geo_radius_km: 50,
  require_same_department: false,
  require_specialty_match: true,
  specialty_match_mode: 'category',

  weight_rating: 30,
  weight_reviews: 15,
  weight_verified: 20,
  weight_proximity: 25,
  weight_data_quality: 10,

  daily_lead_quota: 0,
  monthly_lead_quota: 0,
  cooldown_minutes: 30,

  lead_expiry_hours: 48,
  quote_expiry_hours: 72,
  auto_reassign_hours: 24,

  min_rating: 0,
  require_verified_urgent: false,
  exclude_inactive_days: 90,
  prefer_claimed: true,

  urgency_low_multiplier: 1.00,
  urgency_medium_multiplier: 1.00,
  urgency_high_multiplier: 1.50,
  urgency_emergency_multiplier: 2.00,
}

export const MATCHING_STRATEGY_META: Record<MatchingStrategy, { label: string; description: string }> = {
  round_robin: {
    label: 'Round Robin',
    description: 'Fair distribution: each attorney receives leads in turn',
  },
  scored: {
    label: 'Score composite',
    description: 'Score-based ranking (rating, reviews, verification, proximity)',
  },
  geographic: {
    label: 'Geographic',
    description: 'Priority to geographic proximity between attorney and case',
  },
}

export const SPECIALTY_MATCH_META: Record<SpecialtyMatchMode, { label: string; description: string }> = {
  exact: {
    label: 'Exact',
    description: 'Service must match exactly',
  },
  fuzzy: {
    label: 'Fuzzy',
    description: 'Partial search in service categories',
  },
  category: {
    label: 'Category',
    description: 'Match by practice area category',
  },
}
