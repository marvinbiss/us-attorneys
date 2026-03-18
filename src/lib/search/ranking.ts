/**
 * Subscription-based search result ranking.
 *
 * Re-ranks search results so that paid attorneys appear higher:
 *   - Free (boost_level 0): no boost — organic ranking only
 *   - Pro  (boost_level 1): 2x relevance multiplier
 *   - Premium (boost_level 2+): 5x relevance multiplier + pinned to top 3
 *
 * The boost is multiplicative with the organic relevance score (position index).
 * Premium attorneys are always pinned above organic results.
 */

import type { SubscriptionTier } from '@/lib/billing/cpa-model'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RankableResult {
  id: string
  boost_level?: number | null
  is_featured?: boolean | null
  rating_average?: number | null
  review_count?: number | null
}

export interface BoostFactors {
  /** Multiplier for Pro tier (default 2) */
  proMultiplier?: number
  /** Multiplier for Premium tier (default 5) */
  premiumMultiplier?: number
  /** Max pinned positions for Premium (default 3) */
  premiumPinnedSlots?: number
}

const DEFAULT_BOOST: Required<BoostFactors> = {
  proMultiplier: 2,
  premiumMultiplier: 5,
  premiumPinnedSlots: 3,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive subscription tier from the `boost_level` column in the DB. */
export function getSubscriptionTier(boostLevel: number | null | undefined): SubscriptionTier {
  if (!boostLevel || boostLevel <= 0) return 'free'
  if (boostLevel === 1) return 'pro'
  return 'premium'
}

// ---------------------------------------------------------------------------
// Core ranking function
// ---------------------------------------------------------------------------

/**
 * Re-rank an array of search results by applying subscription boost.
 *
 * Each result gets an internal score = `baseRelevance * tierMultiplier`.
 * `baseRelevance` is derived from the original position (higher = better).
 * Premium attorneys are then pinned to the first N positions.
 *
 * The input array order represents the DB-level relevance ranking (position 0 = most relevant).
 */
export function applySubscriptionBoost<T extends RankableResult>(
  results: T[],
  boostFactors?: BoostFactors,
): T[] {
  if (results.length === 0) return results

  const factors = { ...DEFAULT_BOOST, ...boostFactors }
  const total = results.length

  // 1. Score each result
  const scored = results.map((result, index) => {
    const tier = getSubscriptionTier(result.boost_level)
    // Base relevance: higher for earlier positions (linear decay)
    const baseRelevance = total - index

    let multiplier = 1
    if (tier === 'pro') multiplier = factors.proMultiplier
    if (tier === 'premium') multiplier = factors.premiumMultiplier

    return {
      result,
      tier,
      score: baseRelevance * multiplier,
    }
  })

  // 2. Separate premium (pinned) from the rest
  const premiumResults = scored.filter((s) => s.tier === 'premium')
  const nonPremiumResults = scored.filter((s) => s.tier !== 'premium')

  // Sort premium by score (best first), take top N for pinning
  premiumResults.sort((a, b) => b.score - a.score)
  const pinned = premiumResults.slice(0, factors.premiumPinnedSlots)
  const overflow = premiumResults.slice(factors.premiumPinnedSlots)

  // 3. Merge overflow back into non-premium and sort by score
  const remaining = [...nonPremiumResults, ...overflow]
  remaining.sort((a, b) => b.score - a.score)

  // 4. Final order: pinned premium first, then rest sorted by score
  return [...pinned, ...remaining].map((s) => s.result)
}
