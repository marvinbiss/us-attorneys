/**
 * CPA (Cost Per Acquisition) Billing Model
 *
 * Defines tier-based pricing for leads with location multipliers.
 * Integrates with lead-billing.ts for charge tracking and lead-quotas.ts for limits.
 *
 * Pricing tiers:
 *   FREE    — 5 leads/month, $0 per lead (trial)
 *   PRO     — 50 leads/month, $25 standard / $50 premium / $75 voice / $100 exclusive
 *   PREMIUM — unlimited, $20 standard / $40 premium / $60 voice / $80 exclusive (volume discount)
 *
 * Location multiplier: 1.5x for top metro areas (NYC, LA, Chicago, etc.)
 *
 * Server-side only — uses createAdminClient() (service_role, bypasses RLS).
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import type { LeadType } from './lead-billing'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SubscriptionTier = 'free' | 'pro' | 'premium'

export interface TierPricing {
  /** Monthly lead limit (-1 = unlimited) */
  limit: number
  /** Price in USD per lead type */
  prices: Record<LeadType, number>
}

export interface LeadCostResult {
  /** Base price before multiplier (USD) */
  basePrice: number
  /** Location multiplier applied */
  locationMultiplier: number
  /** Final price in USD */
  finalPrice: number
  /** Final price in cents */
  finalCents: number
  /** Tier used for pricing */
  tier: SubscriptionTier
  /** Lead type */
  leadType: LeadType
}

export interface MonthlyBillingReport {
  attorneyId: string
  month: string // YYYY-MM
  tier: SubscriptionTier
  totalLeads: number
  totalCostUsd: number
  totalCostCents: number
  quotaLimit: number
  quotaRemaining: number
  breakdown: Record<LeadType, { count: number; totalCents: number; totalUsd: number }>
}

// ---------------------------------------------------------------------------
// Pricing configuration
// ---------------------------------------------------------------------------

export const CPA_TIERS: Record<SubscriptionTier, TierPricing> = {
  free: {
    limit: 5,
    prices: { standard: 0, premium: 0, voice: 0, exclusive: 0 },
  },
  pro: {
    limit: 50,
    prices: { standard: 25, premium: 50, voice: 75, exclusive: 100 },
  },
  premium: {
    limit: -1,
    prices: { standard: 20, premium: 40, voice: 60, exclusive: 80 },
  },
}

/**
 * Top metro areas that command a 1.5x location multiplier.
 * Uses lowercase city names for case-insensitive matching.
 */
const METRO_PREMIUM_CITIES = new Set([
  'new york',
  'los angeles',
  'chicago',
  'houston',
  'phoenix',
  'philadelphia',
  'san antonio',
  'san diego',
  'dallas',
  'san jose',
  'san francisco',
  'seattle',
  'denver',
  'washington',
  'boston',
  'miami',
  'atlanta',
])

const METRO_MULTIPLIER = 1.5
const DEFAULT_MULTIPLIER = 1.0

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Get the location-based pricing multiplier.
 * Metro areas (NYC, LA, Chicago, etc.) = 1.5x, all others = 1.0x.
 */
export function getLocationMultiplier(city?: string | null): number {
  if (!city) return DEFAULT_MULTIPLIER
  return METRO_PREMIUM_CITIES.has(city.toLowerCase().trim())
    ? METRO_MULTIPLIER
    : DEFAULT_MULTIPLIER
}

/**
 * Calculate the cost of a lead based on subscription tier and lead type.
 *
 * @param tier - Attorney's subscription tier (free/pro/premium)
 * @param leadType - Type of lead (standard/premium/voice/exclusive)
 * @param location - Optional city name for metro multiplier
 * @returns Cost breakdown with base price, multiplier, and final amount
 */
export function calculateLeadCost(
  tier: SubscriptionTier,
  leadType: LeadType,
  location?: string | null,
): LeadCostResult {
  const tierConfig = CPA_TIERS[tier] || CPA_TIERS.free
  const basePrice = tierConfig.prices[leadType] ?? 0
  const locationMultiplier = getLocationMultiplier(location)
  const finalPrice = Math.round(basePrice * locationMultiplier * 100) / 100
  const finalCents = Math.round(finalPrice * 100)

  return {
    basePrice,
    locationMultiplier,
    finalPrice,
    finalCents,
    tier,
    leadType,
  }
}

/**
 * Resolve an attorney's subscription tier from the DB.
 * Falls back to 'free' if not found.
 */
export async function getAttorneyTier(attorneyId: string): Promise<SubscriptionTier> {
  const admin = createAdminClient()

  const { data: attorney } = await admin
    .from('attorneys')
    .select('user_id')
    .eq('id', attorneyId)
    .single()

  if (!attorney?.user_id) return 'free'

  const { data: profile } = await admin
    .from('profiles')
    .select('subscription_plan')
    .eq('id', attorney.user_id)
    .single()

  const plan = profile?.subscription_plan?.toLowerCase() || 'free'

  // Map legacy/alternate names to canonical tiers
  if (plan === 'premium') return 'premium'
  if (plan === 'pro') return 'pro'
  return 'free'
}

/**
 * Generate a monthly billing report for an attorney.
 *
 * @param attorneyId - The attorney's UUID
 * @param month - Optional YYYY-MM string (defaults to current month)
 * @returns Detailed billing report with totals and breakdown by lead type
 */
export async function getMonthlyBillingReport(
  attorneyId: string,
  month?: string,
): Promise<MonthlyBillingReport> {
  const admin = createAdminClient()
  const now = new Date()
  const targetMonth = month || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const [year, mon] = targetMonth.split('-').map(Number)
  const monthStart = new Date(Date.UTC(year, mon - 1, 1)).toISOString()
  const monthEnd = new Date(Date.UTC(year, mon, 1)).toISOString()

  // Fetch tier and charges in parallel
  const [tier, chargesResult] = await Promise.all([
    getAttorneyTier(attorneyId),
    admin
      .from('lead_charges')
      .select('id, lead_type, amount_cents, status')
      .eq('attorney_id', attorneyId)
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd)
      .order('created_at', { ascending: false }),
  ])

  if (chargesResult.error) {
    logger.error('getMonthlyBillingReport: query error', {
      attorneyId,
      error: chargesResult.error.message,
    })
  }

  const charges = chargesResult.data || []
  const tierConfig = CPA_TIERS[tier]

  // Build breakdown
  const breakdown: Record<LeadType, { count: number; totalCents: number; totalUsd: number }> = {
    standard: { count: 0, totalCents: 0, totalUsd: 0 },
    premium: { count: 0, totalCents: 0, totalUsd: 0 },
    voice: { count: 0, totalCents: 0, totalUsd: 0 },
    exclusive: { count: 0, totalCents: 0, totalUsd: 0 },
  }

  let totalCostCents = 0

  for (const charge of charges) {
    const type = (charge.lead_type as LeadType) || 'standard'
    if (breakdown[type]) {
      breakdown[type].count += 1
      breakdown[type].totalCents += charge.amount_cents
      breakdown[type].totalUsd += charge.amount_cents / 100
    }
    totalCostCents += charge.amount_cents
  }

  // Round USD values
  for (const type of Object.keys(breakdown) as LeadType[]) {
    breakdown[type].totalUsd = Math.round(breakdown[type].totalUsd * 100) / 100
  }

  const totalLeads = charges.length
  const quotaLimit = tierConfig.limit
  const quotaRemaining = quotaLimit === -1 ? -1 : Math.max(0, quotaLimit - totalLeads)

  return {
    attorneyId,
    month: targetMonth,
    tier,
    totalLeads,
    totalCostUsd: Math.round(totalCostCents) / 100,
    totalCostCents,
    quotaLimit,
    quotaRemaining,
    breakdown,
  }
}
