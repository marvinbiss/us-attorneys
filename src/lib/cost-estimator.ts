/**
 * Legal Cost Estimator — US Attorneys
 *
 * Computes cost ranges by practice area, state, and case complexity.
 * Uses data from:
 *  - src/lib/data/attorney-costs.ts (fee ranges, structures, regional adjustments)
 *  - src/lib/data/state-legal-data.ts (state avg hourly rates, attorney counts)
 *  - src/lib/data/attorney-content.ts (practice area price ranges)
 */

import {
  type FeeStructure,
  type CategoryFeeRange,
  CATEGORY_FEE_RANGES,
  FEE_STRUCTURES,
  GENERAL_COST_FACTORS,
  getCategoryForSpecialty,
  getFeeRangeForSpecialty,
  getRegionalAdjustment,
  getAdjustedFees,
  getStateCostTier,
} from '@/lib/data/attorney-costs'
import {
  STATE_NAMES,
  STATE_AVG_HOURLY_RATE,
  STATE_ATTORNEY_COUNTS,
  getStateAvgHourlyRate,
  getStateName,
} from '@/lib/data/state-legal-data'

// ── Types ────────────────────────────────────────────────────────────

export type Complexity = 'simple' | 'moderate' | 'complex'

export interface CostEstimate {
  practiceArea: string
  practiceAreaLabel: string
  stateCode: string
  stateName: string
  complexity: Complexity
  /** Total estimated cost range for this matter */
  totalLow: number
  totalHigh: number
  /** Hourly rate range (adjusted for state) */
  hourlyLow: number
  hourlyMid: number
  hourlyHigh: number
  /** Estimated hours for this complexity level */
  estimatedHoursLow: number
  estimatedHoursHigh: number
  /** Primary fee structure for this practice area */
  primaryFeeType: FeeStructure
  /** Flat fee range (if applicable) */
  flatFee: { low: number; high: number } | null
  /** Contingency percentage (if applicable) */
  contingency: { low: number; high: number } | null
  /** Retainer range (if applicable) */
  retainer: { low: number; high: number } | null
  /** State average hourly rate for comparison */
  stateAvgHourlyRate: number
  /** Regional cost tier */
  costTier: string
  costTierLabel: string
  /** Multiplier applied */
  regionMultiplier: number
  /** Cost factors specific to this practice area */
  costFactors: string[]
  /** General cost factors */
  generalFactors: typeof GENERAL_COST_FACTORS
  /** Cost breakdown for display (pie chart data) */
  breakdown: { name: string; value: number; color: string }[]
}

export interface FeeStructureDetail {
  type: FeeStructure
  label: string
  description: string
  commonUses: string[]
  typicalRange: string
  /** Whether this is the primary fee type for the practice area */
  isPrimary: boolean
  /** Adjusted range for this state (if applicable) */
  adjustedRange?: string
}

export interface StateComparison {
  stateCode: string
  stateName: string
  avgHourlyRate: number
  costTier: string
  /** Relative to national average (percentage) */
  relativeToNational: number
}

// ── Complexity multipliers ───────────────────────────────────────────

const COMPLEXITY_MULTIPLIERS: Record<Complexity, { hours: [number, number]; costFactor: number }> = {
  simple: { hours: [5, 20], costFactor: 0.6 },
  moderate: { hours: [20, 60], costFactor: 1.0 },
  complex: { hours: [60, 200], costFactor: 1.6 },
}

const COMPLEXITY_LABELS: Record<Complexity, string> = {
  simple: 'Simple',
  moderate: 'Moderate',
  complex: 'Complex',
}

// ── Core estimation function ─────────────────────────────────────────

export function estimateLegalCost(
  practiceAreaSlug: string,
  stateCode: string,
  complexity: Complexity = 'moderate',
): CostEstimate {
  const adjusted = getAdjustedFees(practiceAreaSlug, stateCode)
  const category = adjusted.category
  const adjustment = adjusted.adjustment
  const complexityConfig = COMPLEXITY_MULTIPLIERS[complexity]
  const stateAvg = getStateAvgHourlyRate(stateCode)
  const stateName = getStateName(stateCode)

  // Calculate estimated hours
  const estimatedHoursLow = complexityConfig.hours[0]
  const estimatedHoursHigh = complexityConfig.hours[1]

  // Calculate total cost range
  let totalLow: number
  let totalHigh: number

  if (category.primaryFeeType === 'contingency' && adjusted.contingency) {
    // For contingency cases, estimate based on typical settlement
    totalLow = 0 // No upfront cost
    totalHigh = 0 // Contingency — attorney paid from settlement
  } else if (category.primaryFeeType === 'flat_fee' && adjusted.flatFee) {
    totalLow = Math.round(adjusted.flatFee.low * complexityConfig.costFactor)
    totalHigh = Math.round(adjusted.flatFee.high * complexityConfig.costFactor)
  } else {
    // Hourly-based estimate
    totalLow = Math.round(adjusted.hourly.low * estimatedHoursLow * complexityConfig.costFactor)
    totalHigh = Math.round(adjusted.hourly.high * estimatedHoursHigh * complexityConfig.costFactor)
  }

  // Ensure minimums
  if (totalLow < 0) totalLow = 0
  if (totalHigh < totalLow) totalHigh = totalLow

  // Build breakdown data for pie chart
  const breakdown = buildBreakdown(totalLow, totalHigh, category.primaryFeeType)

  return {
    practiceArea: practiceAreaSlug,
    practiceAreaLabel: category.label,
    stateCode: stateCode.toUpperCase(),
    stateName,
    complexity,
    totalLow,
    totalHigh,
    hourlyLow: adjusted.hourly.low,
    hourlyMid: adjusted.hourly.mid,
    hourlyHigh: adjusted.hourly.high,
    estimatedHoursLow,
    estimatedHoursHigh,
    primaryFeeType: category.primaryFeeType,
    flatFee: adjusted.flatFee,
    contingency: adjusted.contingency,
    retainer: adjusted.retainer,
    stateAvgHourlyRate: stateAvg,
    costTier: adjustment.tier,
    costTierLabel: adjustment.label,
    regionMultiplier: adjustment.multiplier,
    costFactors: category.costFactors,
    generalFactors: GENERAL_COST_FACTORS,
    breakdown,
  }
}

// ── Fee structures for a practice area ───────────────────────────────

export function getFeeStructuresForPA(
  practiceAreaSlug: string,
  stateCode?: string,
): FeeStructureDetail[] {
  const category = getFeeRangeForSpecialty(practiceAreaSlug)
  const adjustment = stateCode ? getRegionalAdjustment(stateCode) : null
  const m = adjustment?.multiplier ?? 1.0

  const structures: FeeStructureDetail[] = []

  // Always include the primary fee type first
  const primaryInfo = FEE_STRUCTURES[category.primaryFeeType]
  structures.push({
    ...primaryInfo,
    isPrimary: true,
    adjustedRange: getAdjustedRangeLabel(category, category.primaryFeeType, m),
  })

  // Add other applicable fee types
  const otherTypes: FeeStructure[] = ['hourly', 'flat_fee', 'contingency', 'retainer']
  for (const type of otherTypes) {
    if (type === category.primaryFeeType) continue
    if (!isApplicable(category, type)) continue

    const info = FEE_STRUCTURES[type]
    structures.push({
      ...info,
      isPrimary: false,
      adjustedRange: getAdjustedRangeLabel(category, type, m),
    })
  }

  return structures
}

// ── State average for comparison ─────────────────────────────────────

export function getStateAverageComparison(
  _practiceAreaSlug: string,
  stateCode: string,
): StateComparison[] {
  const currentState = stateCode.toUpperCase()
  const nationalAvg = calculateNationalAverage()

  // Get comparison states (current + neighbors + extremes)
  const comparisonStates = getComparisonStates(currentState)

  return comparisonStates.map((code) => {
    const rate = getStateAvgHourlyRate(code)
    const tier = getStateCostTier(code)
    return {
      stateCode: code,
      stateName: getStateName(code),
      avgHourlyRate: rate,
      costTier: tier,
      relativeToNational: Math.round(((rate - nationalAvg) / nationalAvg) * 100),
    }
  })
}

// ── Helper functions ─────────────────────────────────────────────────

function buildBreakdown(
  totalLow: number,
  totalHigh: number,
  primaryFeeType: FeeStructure,
): { name: string; value: number; color: string }[] {
  const mid = Math.round((totalLow + totalHigh) / 2) || 5000 // fallback for contingency

  if (primaryFeeType === 'contingency') {
    return [
      { name: 'Attorney Fee (33-40%)', value: 35, color: '#3B82F6' },
      { name: 'Court Filing Fees', value: 5, color: '#10B981' },
      { name: 'Expert Witnesses', value: 15, color: '#F59E0B' },
      { name: 'Medical Records', value: 10, color: '#EF4444' },
      { name: 'Depositions', value: 10, color: '#8B5CF6' },
      { name: 'Settlement to Client', value: 25, color: '#6366F1' },
    ]
  }

  return [
    { name: 'Attorney Fees', value: Math.round(mid * 0.65), color: '#3B82F6' },
    { name: 'Court Costs', value: Math.round(mid * 0.10), color: '#10B981' },
    { name: 'Filing Fees', value: Math.round(mid * 0.05), color: '#F59E0B' },
    { name: 'Expert Witnesses', value: Math.round(mid * 0.10), color: '#EF4444' },
    { name: 'Administrative', value: Math.round(mid * 0.05), color: '#8B5CF6' },
    { name: 'Other Expenses', value: Math.round(mid * 0.05), color: '#6366F1' },
  ]
}

function isApplicable(category: CategoryFeeRange, type: FeeStructure): boolean {
  switch (type) {
    case 'hourly': return true // Always applicable
    case 'flat_fee': return category.flatFeeLow != null
    case 'contingency': return category.contingencyLow != null
    case 'retainer': return category.retainerLow != null
    default: return false
  }
}

function getAdjustedRangeLabel(
  category: CategoryFeeRange,
  type: FeeStructure,
  multiplier: number,
): string {
  switch (type) {
    case 'hourly':
      return `$${Math.round(category.hourlyLow * multiplier)}-$${Math.round(category.hourlyHigh * multiplier)}/hr`
    case 'flat_fee':
      if (category.flatFeeLow == null) return ''
      return `$${Math.round(category.flatFeeLow * multiplier).toLocaleString()}-$${Math.round(category.flatFeeHigh! * multiplier).toLocaleString()}`
    case 'contingency':
      if (category.contingencyLow == null) return ''
      return `${category.contingencyLow}%-${category.contingencyHigh}% of settlement`
    case 'retainer':
      if (category.retainerLow == null) return ''
      return `$${Math.round(category.retainerLow * multiplier).toLocaleString()}-$${Math.round(category.retainerHigh! * multiplier).toLocaleString()}`
    default: return ''
  }
}

function calculateNationalAverage(): number {
  const rates = Object.values(STATE_AVG_HOURLY_RATE)
  return Math.round(rates.reduce((sum, r) => sum + r, 0) / rates.length)
}

function getComparisonStates(currentState: string): string[] {
  // Always include the current state, plus high/medium/low comparisons
  const states = new Set<string>([currentState])

  // Add some notable comparison states
  const notable = ['CA', 'NY', 'TX', 'FL', 'IL', 'DC']
  for (const s of notable) {
    if (s !== currentState) states.add(s)
    if (states.size >= 8) break
  }

  // Add a low-cost state if not present
  const lowCost = ['MS', 'AR', 'WV', 'AL']
  for (const s of lowCost) {
    if (!states.has(s)) { states.add(s); break }
  }

  return Array.from(states).slice(0, 8)
}

// ── Exports for convenience ──────────────────────────────────────────

export {
  COMPLEXITY_LABELS,
  COMPLEXITY_MULTIPLIERS,
  CATEGORY_FEE_RANGES,
  FEE_STRUCTURES,
  GENERAL_COST_FACTORS,
  STATE_NAMES,
  STATE_AVG_HOURLY_RATE,
  STATE_ATTORNEY_COUNTS,
  getCategoryForSpecialty,
}
