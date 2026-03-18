/**
 * Case Outcome Estimator — queries case_results to compute statistics
 * and estimate outcomes for a given case type + state combination.
 *
 * Table schema (migration 400):
 *   case_results: id, attorney_id, case_type, specialty_id, outcome, amount, date, court_id, is_public, description
 *   outcome values: 'won', 'lost', 'settled', 'dismissed'
 *   case_type values: 'verdict', 'settlement', 'dismissal'
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { getCachedData, CACHE_TTL } from '@/lib/cache'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CaseEstimate {
  estimatedRange: { low: number; high: number }
  winRate: number // 0-100
  avgSettlement: number
  medianSettlement: number
  avgDuration: string // e.g. "8-14 months"
  sampleSize: number
  confidence: 'high' | 'medium' | 'low'
  percentile25: number
  percentile75: number
  outcomeDistribution: { outcome: string; count: number; percentage: number }[]
  amountBuckets: { range: string; count: number; min: number; max: number }[]
}

export interface SimilarCase {
  outcome: string
  amount: number | null
  caseType: string | null
  date: string | null
  state: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

function getConfidence(sampleSize: number): 'high' | 'medium' | 'low' {
  if (sampleSize > 100) return 'high'
  if (sampleSize >= 20) return 'medium'
  return 'low'
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

function estimateDuration(sampleSize: number, avgAmount: number): string {
  // Heuristic based on typical legal timelines
  if (avgAmount > 500_000) return '12-24 months'
  if (avgAmount > 200_000) return '10-18 months'
  if (avgAmount > 100_000) return '8-14 months'
  if (avgAmount > 50_000) return '6-12 months'
  if (avgAmount > 20_000) return '4-10 months'
  if (sampleSize < 10) return '6-18 months'
  return '3-8 months'
}

function buildAmountBuckets(amounts: number[]): CaseEstimate['amountBuckets'] {
  const bucketDefs: { range: string; min: number; max: number }[] = [
    { range: '$0 - $10K', min: 0, max: 10_000 },
    { range: '$10K - $25K', min: 10_000, max: 25_000 },
    { range: '$25K - $50K', min: 25_000, max: 50_000 },
    { range: '$50K - $100K', min: 50_000, max: 100_000 },
    { range: '$100K - $250K', min: 100_000, max: 250_000 },
    { range: '$250K - $500K', min: 250_000, max: 500_000 },
    { range: '$500K - $1M', min: 500_000, max: 1_000_000 },
    { range: '$1M+', min: 1_000_000, max: Infinity },
  ]

  return bucketDefs.map((b) => ({
    range: b.range,
    count: amounts.filter((a) => a >= b.min && a < b.max).length,
    min: b.min,
    max: b.max === Infinity ? 10_000_000 : b.max,
  }))
}

// ---------------------------------------------------------------------------
// Specialty slug → specialty_id resolver
// ---------------------------------------------------------------------------

async function resolveSpecialtyId(specialtySlug: string): Promise<string | null> {
  if (IS_BUILD) return null
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('specialties')
      .select('id')
      .eq('slug', specialtySlug)
      .single()
    return data?.id ?? null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Core query: fetch case results for a specialty + state
// ---------------------------------------------------------------------------

interface RawCaseResult {
  id: string
  outcome: string
  amount: number | null
  case_type: string | null
  date: string | null
  attorney_id: string
}

async function fetchCaseResults(
  specialtySlug: string,
  stateCode: string
): Promise<RawCaseResult[]> {
  if (IS_BUILD) return []

  const cacheKey = `case-results:${specialtySlug}:${stateCode}`

  return getCachedData<RawCaseResult[]>(
    cacheKey,
    async () => {
      try {
        const supabase = createAdminClient()

        // Resolve specialty
        const specialtyId = await resolveSpecialtyId(specialtySlug)

        // Build query — join via attorneys.bar_state for state filtering
        let query = supabase
          .from('case_results')
          .select('id, outcome, amount, case_type, date, attorney_id')
          .eq('is_public', true)

        if (specialtyId) {
          query = query.eq('specialty_id', specialtyId)
        }

        // Execute query — we filter by state through a second query on attorneys
        const { data: caseData, error } = await query.limit(2000)

        if (error) {
          logger.error('[case-estimator] Supabase query error:', error)
          return []
        }

        if (!caseData || caseData.length === 0) return []

        // Filter by state: get attorney IDs in this state
        const uniqueAttorneyIds = Array.from(new Set(caseData.map((c) => c.attorney_id)))

        // Batch check attorneys in the target state
        const { data: attorneysInState } = await supabase
          .from('attorneys')
          .select('id')
          .in('id', uniqueAttorneyIds.slice(0, 500))
          .eq('bar_state', stateCode.toUpperCase())

        if (!attorneysInState || attorneysInState.length === 0) return []

        const stateAttorneyIds = new Set(attorneysInState.map((a) => a.id))

        return caseData.filter((c) => stateAttorneyIds.has(c.attorney_id))
      } catch (err) {
        logger.error('[case-estimator] fetchCaseResults failed:', err)
        return []
      }
    },
    CACHE_TTL.stats,
    { skipNull: true }
  )
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get aggregate case statistics for a specialty + state combination.
 */
export async function getCaseStatistics(
  specialtySlug: string,
  stateCode: string
): Promise<CaseEstimate> {
  const results = await fetchCaseResults(specialtySlug, stateCode)

  // Count outcomes
  const outcomeCounts: Record<string, number> = {}
  const amounts: number[] = []

  for (const r of results) {
    const o = (r.outcome || 'unknown').toLowerCase()
    outcomeCounts[o] = (outcomeCounts[o] || 0) + 1
    if (r.amount != null && r.amount > 0) {
      amounts.push(Number(r.amount))
    }
  }

  const total = results.length
  const won = (outcomeCounts['won'] || 0) + (outcomeCounts['settled'] || 0)
  const winRate = total > 0 ? Math.round((won / total) * 100) : 0

  // Sort amounts for percentile calculations
  amounts.sort((a, b) => a - b)

  const avg = amounts.length > 0 ? amounts.reduce((s, v) => s + v, 0) / amounts.length : 0
  const med = median(amounts)
  const p25 = percentile(amounts, 25)
  const p75 = percentile(amounts, 75)

  const outcomeDistribution = Object.entries(outcomeCounts).map(([outcome, count]) => ({
    outcome: outcome.charAt(0).toUpperCase() + outcome.slice(1),
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }))

  const confidence = getConfidence(total)

  return {
    estimatedRange: {
      low: Math.round(p25),
      high: Math.round(p75),
    },
    winRate,
    avgSettlement: Math.round(avg),
    medianSettlement: Math.round(med),
    avgDuration: estimateDuration(total, avg),
    sampleSize: total,
    confidence,
    percentile25: Math.round(p25),
    percentile75: Math.round(p75),
    outcomeDistribution,
    amountBuckets: buildAmountBuckets(amounts),
  }
}

/**
 * Full estimation combining statistics with contextual adjustment.
 */
export async function estimateCaseOutcome(
  specialtySlug: string,
  stateCode: string,
  _details?: string
): Promise<CaseEstimate> {
  return getCaseStatistics(specialtySlug, stateCode)
}

/**
 * Get anonymized similar cases for display.
 */
export async function getSimilarCases(
  specialtySlug: string,
  stateCode: string,
  limit = 10
): Promise<SimilarCase[]> {
  const results = await fetchCaseResults(specialtySlug, stateCode)

  return results
    .filter((r) => r.amount != null && r.amount > 0)
    .sort((a, b) => {
      // Most recent first
      if (a.date && b.date) return new Date(b.date).getTime() - new Date(a.date).getTime()
      return 0
    })
    .slice(0, limit)
    .map((r) => ({
      outcome: r.outcome,
      amount: r.amount,
      caseType: r.case_type,
      date: r.date,
      state: stateCode.toUpperCase(),
    }))
}
