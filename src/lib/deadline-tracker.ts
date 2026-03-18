/**
 * Legal Deadline Tracker — Core Business Logic
 *
 * Calculates statute of limitations deadlines by case type + state.
 * Uses DB data from `statute_of_limitations` table (migration 403).
 *
 * Urgency levels:
 *   - critical: <30 days remaining
 *   - warning:  <90 days remaining
 *   - caution:  <180 days remaining
 *   - safe:     >=180 days remaining
 *   - expired:  deadline has passed
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { getCachedData } from '@/lib/cache'
import { logger } from '@/lib/logger'

// ─── Types ──────────────────────────────────────────────────────────────────

export type UrgencyLevel = 'expired' | 'critical' | 'warning' | 'caution' | 'safe'

export interface SOLData {
  state_code: string
  specialty_slug: string
  years: number
  exceptions: string[]
  discovery_rule: boolean
  description: string
  source_url: string
}

export interface DeadlineResult {
  /** Standard deadline from incident date */
  deadline: string
  /** Days remaining until standard deadline (negative = expired) */
  daysRemaining: number
  /** Urgency classification */
  urgencyLevel: UrgencyLevel
  /** SOL period in years */
  years: number
  /** State-specific exceptions */
  exceptions: string[]
  /** Whether discovery rule applies */
  discoveryRule: boolean
  /** Discovery deadline (if applicable and discovery date provided) */
  discoveryDeadline?: string
  /** Days remaining for discovery deadline */
  discoveryDaysRemaining?: number
  /** Urgency for discovery deadline */
  discoveryUrgencyLevel?: UrgencyLevel
  /** Statute citation / description */
  description: string
  /** Link to source statute */
  sourceUrl: string
  /** Incident date used */
  incidentDate: string
  /** State code used */
  stateCode: string
  /** Specialty slug used */
  specialtySlug: string
}

// ─── Urgency Logic ──────────────────────────────────────────────────────────

export function getUrgencyLevel(daysRemaining: number): UrgencyLevel {
  if (daysRemaining < 0) return 'expired'
  if (daysRemaining < 30) return 'critical'
  if (daysRemaining < 90) return 'warning'
  if (daysRemaining < 180) return 'caution'
  return 'safe'
}

export function getUrgencyColor(level: UrgencyLevel): string {
  switch (level) {
    case 'expired': return 'text-gray-500'
    case 'critical': return 'text-red-600'
    case 'warning': return 'text-amber-600'
    case 'caution': return 'text-yellow-600'
    case 'safe': return 'text-green-600'
  }
}

export function getUrgencyBgColor(level: UrgencyLevel): string {
  switch (level) {
    case 'expired': return 'bg-gray-100 dark:bg-gray-800'
    case 'critical': return 'bg-red-50 dark:bg-red-950'
    case 'warning': return 'bg-amber-50 dark:bg-amber-950'
    case 'caution': return 'bg-yellow-50 dark:bg-yellow-950'
    case 'safe': return 'bg-green-50 dark:bg-green-950'
  }
}

export function getUrgencyLabel(level: UrgencyLevel): string {
  switch (level) {
    case 'expired': return 'Deadline Passed'
    case 'critical': return 'Critical — Act Now'
    case 'warning': return 'Warning — Time Is Running Out'
    case 'caution': return 'Caution — Plan Ahead'
    case 'safe': return 'Safe — You Have Time'
  }
}

// ─── Data Fetching ──────────────────────────────────────────────────────────

/**
 * Fetch SOL data for a given specialty + state from the DB with caching.
 * Cache TTL: 7 days (SOL data rarely changes).
 */
export async function getSOLData(
  specialtySlug: string,
  stateCode: string
): Promise<SOLData | null> {
  const cacheKey = `sol:${stateCode}:${specialtySlug}`

  return getCachedData<SOLData | null>(
    cacheKey,
    async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('statute_of_limitations')
        .select('state_code, specialty_slug, years, exceptions, discovery_rule, description, source_url')
        .eq('state_code', stateCode.toUpperCase())
        .eq('specialty_slug', specialtySlug)
        .single()

      if (error || !data) {
        logger.warn('SOL data not found', { specialtySlug, stateCode, error: error?.message })
        return null
      }

      return data as SOLData
    },
    604800 // 7 days
  )
}

/**
 * Get all available specialty slugs that have SOL data.
 */
export async function getAvailableSpecialties(): Promise<string[]> {
  return getCachedData<string[]>(
    'sol:specialties',
    async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('statute_of_limitations')
        .select('specialty_slug')

      if (error || !data) return []

      const set = new Set(data.map((r: { specialty_slug: string }) => r.specialty_slug))
      const slugs = Array.from(set)
      return slugs.sort()
    },
    604800
  )
}

// ─── Calculation ────────────────────────────────────────────────────────────

/**
 * Calculate the legal deadline given a specialty, state, and incident date.
 *
 * @param specialtySlug - Practice area slug (e.g., "personal-injury")
 * @param stateCode - Two-letter state code (e.g., "CA")
 * @param incidentDate - ISO date string (YYYY-MM-DD) of the incident
 * @param discoveryDate - Optional ISO date string of when injury was discovered
 * @returns DeadlineResult or null if no SOL data exists
 */
export async function calculateDeadline(
  specialtySlug: string,
  stateCode: string,
  incidentDate: string,
  discoveryDate?: string
): Promise<DeadlineResult | null> {
  const sol = await getSOLData(specialtySlug, stateCode)
  if (!sol) return null

  const incident = new Date(incidentDate)
  if (isNaN(incident.getTime())) {
    logger.warn('Invalid incident date', { incidentDate })
    return null
  }

  // Calculate standard deadline: incident date + SOL years
  const deadline = addYears(incident, sol.years)
  const now = new Date()
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const urgencyLevel = getUrgencyLevel(daysRemaining)

  const result: DeadlineResult = {
    deadline: deadline.toISOString().split('T')[0],
    daysRemaining,
    urgencyLevel,
    years: sol.years,
    exceptions: sol.exceptions || [],
    discoveryRule: sol.discovery_rule,
    description: sol.description || '',
    sourceUrl: sol.source_url || '',
    incidentDate,
    stateCode: stateCode.toUpperCase(),
    specialtySlug,
  }

  // If discovery rule applies and a discovery date is provided,
  // calculate alternative deadline from discovery date
  if (sol.discovery_rule && discoveryDate) {
    const discovery = new Date(discoveryDate)
    if (!isNaN(discovery.getTime())) {
      const discoveryDeadline = addYears(discovery, sol.years)
      const discoveryDaysRemaining = Math.ceil(
        (discoveryDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      result.discoveryDeadline = discoveryDeadline.toISOString().split('T')[0]
      result.discoveryDaysRemaining = discoveryDaysRemaining
      result.discoveryUrgencyLevel = getUrgencyLevel(discoveryDaysRemaining)
    }
  }

  return result
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Add fractional years to a date (handles .5 years = 6 months, etc.)
 */
function addYears(date: Date, years: number): Date {
  const result = new Date(date)
  const wholeYears = Math.floor(years)
  const fractionalMonths = Math.round((years - wholeYears) * 12)
  result.setFullYear(result.getFullYear() + wholeYears)
  result.setMonth(result.getMonth() + fractionalMonths)
  return result
}

// ─── Specialty Display Data ─────────────────────────────────────────────────

export const TRACKER_SPECIALTIES: { slug: string; label: string; category: string }[] = [
  // Personal Injury
  { slug: 'personal-injury', label: 'Personal Injury', category: 'Personal Injury' },
  { slug: 'car-accidents', label: 'Car Accidents', category: 'Personal Injury' },
  { slug: 'truck-accidents', label: 'Truck Accidents', category: 'Personal Injury' },
  { slug: 'motorcycle-accidents', label: 'Motorcycle Accidents', category: 'Personal Injury' },
  { slug: 'slip-and-fall', label: 'Slip and Fall', category: 'Personal Injury' },
  { slug: 'nursing-home-abuse', label: 'Nursing Home Abuse', category: 'Personal Injury' },
  // Medical
  { slug: 'medical-malpractice', label: 'Medical Malpractice', category: 'Medical' },
  // Death
  { slug: 'wrongful-death', label: 'Wrongful Death', category: 'Wrongful Death' },
  // Product
  { slug: 'product-liability', label: 'Product Liability', category: 'Product Liability' },
  // Contract / Business
  { slug: 'contract-law', label: 'Contract Disputes', category: 'Business' },
  { slug: 'business-law', label: 'Business Law', category: 'Business' },
  { slug: 'business-litigation', label: 'Business Litigation', category: 'Business' },
  // Fraud
  { slug: 'white-collar-crime', label: 'White Collar Crime / Fraud', category: 'Fraud' },
  { slug: 'consumer-protection', label: 'Consumer Protection', category: 'Fraud' },
  { slug: 'insurance-law', label: 'Insurance Disputes', category: 'Fraud' },
  // Property
  { slug: 'real-estate-law', label: 'Real Estate Law', category: 'Property' },
  { slug: 'landlord-tenant', label: 'Landlord-Tenant', category: 'Property' },
  { slug: 'construction-law', label: 'Construction Law', category: 'Property' },
  // Employment
  { slug: 'employment-law', label: 'Employment Law', category: 'Employment' },
  { slug: 'wrongful-termination', label: 'Wrongful Termination', category: 'Employment' },
  { slug: 'workplace-discrimination', label: 'Workplace Discrimination', category: 'Employment' },
  { slug: 'sexual-harassment', label: 'Sexual Harassment', category: 'Employment' },
  { slug: 'wage-hour-claims', label: 'Wage & Hour Claims', category: 'Employment' },
  // Workers Comp
  { slug: 'workers-compensation', label: 'Workers\' Compensation', category: 'Workers\' Comp' },
  // Family
  { slug: 'divorce', label: 'Divorce', category: 'Family Law' },
  { slug: 'child-custody', label: 'Child Custody', category: 'Family Law' },
  { slug: 'child-support', label: 'Child Support', category: 'Family Law' },
  { slug: 'domestic-violence', label: 'Domestic Violence', category: 'Family Law' },
]

export const US_STATES: { code: string; name: string }[] = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
]
