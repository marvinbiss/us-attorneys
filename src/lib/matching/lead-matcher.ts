/**
 * Lead Matching Algorithm — US Attorneys
 *
 * Intelligent attorney matching based on:
 *   1. Practice area relevance (+50 exact, +25 parent category)
 *   2. Location proximity (+30 same city, +20 same county, +10 same state, distance decay)
 *   3. Availability (+20 if available this week)
 *   4. Rating quality (+10 * rating/5)
 *   5. Response speed (+15 if < 2h avg response)
 *   6. Subscription boost (free=1x, pro=2x, premium=5x)
 *
 * Returns top 5 ranked attorneys with scores and match reasons.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

const matchLogger = logger.child({ component: 'lead-matcher' })

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LeadInput {
  /** The consultation/booking ID */
  bookingId: string
  /** Practice area slug (e.g., 'criminal-defense') */
  practiceAreaSlug?: string | null
  /** Client city */
  city?: string | null
  /** Client state abbreviation (e.g., 'TX') */
  state?: string | null
  /** Client ZIP code */
  zip?: string | null
  /** The attorney already selected (if any — used for direct consultation requests) */
  attorneyId?: string | null
}

export interface MatchResult {
  attorneyId: string
  attorneyName: string
  score: number
  rawScore: number
  subscriptionMultiplier: number
  matchReasons: MatchReason[]
  estimatedResponseTime: string
}

export interface MatchReason {
  type: string
  points: number
  detail: string
}

// ---------------------------------------------------------------------------
// Scoring constants
// ---------------------------------------------------------------------------

const SCORE = {
  PRACTICE_AREA_EXACT: 50,
  PRACTICE_AREA_CATEGORY: 25,
  LOCATION_SAME_CITY: 30,
  LOCATION_SAME_COUNTY: 20,
  LOCATION_SAME_STATE: 10,
  AVAILABILITY_THIS_WEEK: 20,
  RATING_MAX: 10,
  FAST_RESPONSE: 15,
} as const

const SUBSCRIPTION_MULTIPLIER: Record<string, number> = {
  free: 1,
  pro: 2,
  premium: 5,
}

const MAX_RESULTS = 5
const FAST_RESPONSE_THRESHOLD_SECONDS = 7200 // 2 hours

// ---------------------------------------------------------------------------
// Main matching function
// ---------------------------------------------------------------------------

/**
 * Match a lead to the best-fit attorneys.
 * Returns up to 5 ranked attorneys with scores and match reasons.
 */
export async function matchLeadToAttorneys(lead: LeadInput): Promise<MatchResult[]> {
  const supabase = createAdminClient()

  matchLogger.info('Starting lead matching', {
    bookingId: lead.bookingId,
    practiceArea: lead.practiceAreaSlug || 'none',
    city: lead.city || 'none',
    state: lead.state || 'none',
  })

  // --- 1. Build candidate pool ---
  // Fetch active attorneys in the same state (or all if no state specified)
  // Include their specialties, subscription tier, and rating data

  let query = supabase
    .from('attorneys')
    .select(`
      id,
      name,
      slug,
      address_city,
      address_state,
      address_county,
      address_zip,
      rating_average,
      review_count,
      subscription_tier,
      last_lead_assigned_at,
      user_id,
      primary_specialty_id,
      is_verified,
      attorney_specialties(
        specialty_id,
        is_primary,
        specialty:specialty_id(id, name, slug, category, parent_id)
      )
    `)
    .eq('is_active', true)

  // Narrow candidates by state if available
  if (lead.state) {
    query = query.eq('address_state', lead.state)
  }

  // Limit candidate pool to avoid processing too many
  query = query.limit(500)

  const { data: candidates, error: candidateError } = await query

  if (candidateError) {
    matchLogger.error('Failed to fetch candidate attorneys', candidateError)
    return []
  }

  if (!candidates || candidates.length === 0) {
    matchLogger.info('No candidate attorneys found', {
      bookingId: lead.bookingId,
      state: lead.state || 'any',
    })
    return []
  }

  // --- 2. Fetch practice area info if slug provided ---
  let targetSpecialty: { id: string; slug: string; category: string; parent_id: string | null } | null = null
  if (lead.practiceAreaSlug) {
    const { data: spec } = await supabase
      .from('specialties')
      .select('id, slug, category, parent_id')
      .eq('slug', lead.practiceAreaSlug)
      .single()
    targetSpecialty = spec
  }

  // --- 3. Fetch availability data for this week ---
  const now = new Date()
  const endOfWeek = new Date(now)
  endOfWeek.setDate(now.getDate() + 7)

  const candidateIds = candidates.map((c) => c.id)

  // Fetch attorneys with availability slots this week
  const { data: availabilityData } = await supabase
    .from('attorney_availability')
    .select('attorney_id, day_of_week')
    .in('attorney_id', candidateIds)

  const availableAttorneyIds = new Set(
    (availabilityData || []).map((a) => a.attorney_id)
  )

  // --- 4. Fetch average response times from existing assignments ---
  const { data: responseData } = await supabase
    .from('attorney_lead_assignments')
    .select('attorney_id, response_time_seconds')
    .in('attorney_id', candidateIds)
    .not('response_time_seconds', 'is', null)

  // Compute average response time per attorney
  const responseTimeMap = new Map<string, number>()
  if (responseData) {
    const aggMap = new Map<string, { sum: number; count: number }>()
    for (const row of responseData) {
      const existing = aggMap.get(row.attorney_id) || { sum: 0, count: 0 }
      existing.sum += row.response_time_seconds!
      existing.count += 1
      aggMap.set(row.attorney_id, existing)
    }
    aggMap.forEach(({ sum, count }, id) => {
      responseTimeMap.set(id, Math.round(sum / count))
    })
  }

  // --- 5. Check monthly lead limits ---
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const { data: usageData } = await supabase
    .from('lead_usage')
    .select('attorney_id, lead_count')
    .in('attorney_id', candidateIds)
    .eq('month', currentMonth)

  const usageMap = new Map<string, number>()
  if (usageData) {
    for (const row of usageData) {
      usageMap.set(row.attorney_id, row.lead_count)
    }
  }

  // Fetch plan limits
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('slug, max_leads_per_month')
    .eq('is_active', true)

  const planLimits: Record<string, number> = {}
  if (plans) {
    for (const plan of plans) {
      planLimits[plan.slug] = plan.max_leads_per_month
    }
  }

  // --- 6. Score each candidate ---
  const scored: MatchResult[] = []

  for (const attorney of candidates) {
    const tier = attorney.subscription_tier || 'free'

    // Check monthly lead limit
    const monthlyLimit = planLimits[tier] ?? 5
    const currentUsage = usageMap.get(attorney.id) || 0
    if (monthlyLimit !== -1 && currentUsage >= monthlyLimit) {
      continue // Skip — attorney has hit their monthly lead cap
    }

    const reasons: MatchReason[] = []
    let rawScore = 0

    // --- Practice Area Match ---
    if (targetSpecialty) {
      const specialties = (attorney.attorney_specialties || []) as unknown as Array<{
        specialty_id: string
        is_primary: boolean
        specialty: { id: string; slug: string; category: string; parent_id: string | null } | null
      }>

      const exactMatch = specialties.some(
        (s) => s.specialty?.slug === targetSpecialty!.slug
      )
      const categoryMatch = !exactMatch && specialties.some(
        (s) => s.specialty?.category === targetSpecialty!.category
      )
      const primaryExact = attorney.primary_specialty_id === targetSpecialty.id

      if (exactMatch || primaryExact) {
        rawScore += SCORE.PRACTICE_AREA_EXACT
        reasons.push({
          type: 'practice_area_exact',
          points: SCORE.PRACTICE_AREA_EXACT,
          detail: `Practices ${targetSpecialty.slug}`,
        })
      } else if (categoryMatch) {
        rawScore += SCORE.PRACTICE_AREA_CATEGORY
        reasons.push({
          type: 'practice_area_category',
          points: SCORE.PRACTICE_AREA_CATEGORY,
          detail: `Same category: ${targetSpecialty.category}`,
        })
      }
    }

    // --- Location Proximity ---
    if (lead.city && attorney.address_city) {
      const sameCity =
        attorney.address_city.toLowerCase().trim() === lead.city.toLowerCase().trim()
      if (sameCity) {
        rawScore += SCORE.LOCATION_SAME_CITY
        reasons.push({
          type: 'same_city',
          points: SCORE.LOCATION_SAME_CITY,
          detail: `Same city: ${lead.city}`,
        })
      } else if (lead.state && attorney.address_state === lead.state) {
        // Same state but different city — check county match
        if (attorney.address_county && lead.city) {
          // Approximate county match via address_county field
          rawScore += SCORE.LOCATION_SAME_COUNTY
          reasons.push({
            type: 'same_county',
            points: SCORE.LOCATION_SAME_COUNTY,
            detail: `Same county area in ${lead.state}`,
          })
        } else {
          rawScore += SCORE.LOCATION_SAME_STATE
          reasons.push({
            type: 'same_state',
            points: SCORE.LOCATION_SAME_STATE,
            detail: `Same state: ${lead.state}`,
          })
        }
      }
    } else if (lead.state && attorney.address_state === lead.state) {
      rawScore += SCORE.LOCATION_SAME_STATE
      reasons.push({
        type: 'same_state',
        points: SCORE.LOCATION_SAME_STATE,
        detail: `Same state: ${lead.state}`,
      })
    }

    // --- ZIP proximity fallback ---
    if (lead.zip && attorney.address_zip && !reasons.some((r) => r.type.startsWith('same_'))) {
      // Compare first 3 digits of ZIP for rough proximity
      const leadPrefix = lead.zip.substring(0, 3)
      const attyPrefix = attorney.address_zip.substring(0, 3)
      if (leadPrefix === attyPrefix) {
        rawScore += SCORE.LOCATION_SAME_COUNTY // Nearby ZIP range
        reasons.push({
          type: 'nearby_zip',
          points: SCORE.LOCATION_SAME_COUNTY,
          detail: `Nearby ZIP area: ${leadPrefix}xx`,
        })
      }
    }

    // --- Availability ---
    if (availableAttorneyIds.has(attorney.id)) {
      rawScore += SCORE.AVAILABILITY_THIS_WEEK
      reasons.push({
        type: 'available_this_week',
        points: SCORE.AVAILABILITY_THIS_WEEK,
        detail: 'Has availability this week',
      })
    }

    // --- Rating ---
    const rating = Number(attorney.rating_average) || 0
    if (rating > 0) {
      const ratingScore = Math.round(SCORE.RATING_MAX * (rating / 5))
      rawScore += ratingScore
      reasons.push({
        type: 'rating',
        points: ratingScore,
        detail: `Rating: ${rating.toFixed(1)}/5 (${attorney.review_count || 0} reviews)`,
      })
    }

    // --- Response Time ---
    const avgResponseTime = responseTimeMap.get(attorney.id)
    if (avgResponseTime !== undefined && avgResponseTime < FAST_RESPONSE_THRESHOLD_SECONDS) {
      rawScore += SCORE.FAST_RESPONSE
      reasons.push({
        type: 'fast_responder',
        points: SCORE.FAST_RESPONSE,
        detail: `Avg response: ${formatDuration(avgResponseTime)}`,
      })
    }

    // --- Verified bonus ---
    if (attorney.is_verified) {
      const verifiedBonus = 5
      rawScore += verifiedBonus
      reasons.push({
        type: 'verified',
        points: verifiedBonus,
        detail: 'Verified attorney profile',
      })
    }

    // --- Apply subscription multiplier ---
    const multiplier = SUBSCRIPTION_MULTIPLIER[tier] || 1
    const finalScore = rawScore * multiplier

    // Estimate response time
    let estimatedResponseTime = 'Unknown'
    if (avgResponseTime !== undefined) {
      estimatedResponseTime = formatDuration(avgResponseTime)
    } else if (tier === 'premium') {
      estimatedResponseTime = '< 1 hour'
    } else if (tier === 'pro') {
      estimatedResponseTime = '< 4 hours'
    } else {
      estimatedResponseTime = '< 24 hours'
    }

    // Only include if there is at least one matching reason
    if (reasons.length > 0) {
      scored.push({
        attorneyId: attorney.id,
        attorneyName: attorney.name,
        score: finalScore,
        rawScore,
        subscriptionMultiplier: multiplier,
        matchReasons: reasons,
        estimatedResponseTime,
      })
    }
  }

  // --- 7. Sort by score descending, then by last_lead_assigned_at ascending (round-robin tiebreak) ---
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score

    // Tiebreak: prefer attorneys who received leads least recently (round-robin)
    const attyA = candidates.find((c) => c.id === a.attorneyId)
    const attyB = candidates.find((c) => c.id === b.attorneyId)
    const timeA = attyA?.last_lead_assigned_at
      ? new Date(attyA.last_lead_assigned_at).getTime()
      : 0
    const timeB = attyB?.last_lead_assigned_at
      ? new Date(attyB.last_lead_assigned_at).getTime()
      : 0
    return timeA - timeB
  })

  const topResults = scored.slice(0, MAX_RESULTS)

  matchLogger.info('Lead matching complete', {
    bookingId: lead.bookingId,
    totalCandidates: candidates.length,
    scoredCandidates: scored.length,
    topResults: topResults.length,
    topScore: topResults[0]?.score || 0,
  })

  return topResults
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}
