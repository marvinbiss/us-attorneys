/**
 * Trust Score Engine — transparent 1-10 score for attorneys.
 *
 * Unlike Avvo's opaque rating, every factor is verifiable and the
 * breakdown is shown publicly on attorney profiles.
 *
 * Weighted factors (total weight = 9.0):
 *   barVerified        2.0  — bar admission verified
 *   yearsExperience    1.5  — years since bar admission
 *   reviewScore        1.5  — average review rating
 *   reviewCount        1.0  — number of published reviews
 *   profileCompleteness 1.0 — has photo, bio, phone, email, website
 *   caseResults        1.0  — win rate / case history
 *   responsiveness     0.5  — response time to leads (future)
 *   peerEndorsements   0.5  — peer endorsements (future)
 */

import { createAdminClient } from '@/lib/supabase/admin'

// ── Weight configuration ────────────────────────────────────────────

export const WEIGHTS = {
  barVerified: 2.0,
  yearsExperience: 1.5,
  reviewScore: 1.5,
  reviewCount: 1.0,
  profileCompleteness: 1.0,
  caseResults: 1.0,
  responsiveness: 0.5,
  peerEndorsements: 0.5,
} as const

export type TrustFactor = keyof typeof WEIGHTS

export interface TrustScoreResult {
  score: number
  breakdown: Record<TrustFactor, number>
}

const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((sum, w) => sum + w, 0)

// ── Per-factor scorers (each returns 0-10) ──────────────────────────

function scoreBarVerified(barAdmissions: BarAdmissionRow[]): number {
  if (barAdmissions.length === 0) return 0
  const hasVerified = barAdmissions.some((ba) => ba.verified === true)
  if (hasVerified) return 10
  // Has bar admissions but none explicitly verified
  return 5
}

interface BarAdmissionRow {
  state: string
  bar_number: string | null
  status: string | null
  verified: boolean | null
  admitted_date: string | null
}

function scoreYearsExperience(barAdmissions: BarAdmissionRow[]): number {
  if (barAdmissions.length === 0) return 0

  const now = new Date()
  let maxYears = 0
  for (const ba of barAdmissions) {
    if (ba.admitted_date) {
      const admitted = new Date(ba.admitted_date)
      const years = (now.getTime() - admitted.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      if (years > maxYears) maxYears = years
    }
  }

  if (maxYears <= 0) return 0
  if (maxYears >= 20) return 10
  if (maxYears >= 10) return 8
  if (maxYears >= 5) return 6
  if (maxYears >= 2) return 4
  return 2
}

interface AttorneyRow {
  rating_average: number | null
  review_count: number | null
  phone: string | null
  email: string | null
  website: string | null
  bio: string | null
  description: string | null
  // Portfolio presence checked separately
}

function scoreReviewScore(attorney: AttorneyRow): number {
  const avg = attorney.rating_average
  if (!avg || avg <= 0) return 0
  // Scale 1-5 rating to 0-10
  return Math.min(10, Math.max(0, (avg - 1) * 2.5))
}

function scoreReviewCount(attorney: AttorneyRow): number {
  const count = attorney.review_count ?? 0
  if (count === 0) return 0
  if (count >= 50) return 10
  if (count >= 20) return 8
  if (count >= 10) return 6
  if (count >= 5) return 4
  if (count >= 1) return 2
  return 0
}

function scoreProfileCompleteness(
  attorney: AttorneyRow,
  hasPortfolio: boolean,
): number {
  // 5 completeness signals, 2 points each
  let score = 0
  if (hasPortfolio) score += 2                                         // has photo/portfolio
  if (attorney.bio || attorney.description) score += 2                 // has bio
  if (attorney.phone) score += 2                                       // has phone
  if (attorney.email) score += 2                                       // has email
  if (attorney.website) score += 2                                     // has website
  return score
}

interface CaseResultRow {
  outcome: string | null
  amount: number | null
}

function scoreCaseResults(caseResults: CaseResultRow[]): number {
  if (caseResults.length === 0) return 0

  const total = caseResults.length
  const wins = caseResults.filter(
    (cr) => cr.outcome === 'won' || cr.outcome === 'settled',
  ).length
  const winRate = wins / total

  // More cases + higher win rate = better score
  let score = winRate * 8 // max 8 from win rate
  if (total >= 20) score += 2
  else if (total >= 10) score += 1.5
  else if (total >= 5) score += 1

  return Math.min(10, score)
}

// responsiveness is future — return 0 for now
function scoreResponsiveness(): number {
  return 0
}

function scorePeerEndorsements(endorsementCount: number): number {
  if (endorsementCount === 0) return 0
  if (endorsementCount >= 20) return 10
  if (endorsementCount >= 10) return 8
  if (endorsementCount >= 5) return 6
  if (endorsementCount >= 3) return 4
  if (endorsementCount >= 1) return 2
  return 0
}

// ── Main calculation ────────────────────────────────────────────────

export async function calculateTrustScore(
  attorneyId: string,
): Promise<TrustScoreResult> {
  const supabase = createAdminClient()

  // Parallel data fetches
  const [attorneyRes, barRes, caseRes, portfolioRes, endorsementRes] = await Promise.all([
    supabase
      .from('attorneys')
      .select('rating_average, review_count, phone, email, website, bio, description, endorsement_count')
      .eq('id', attorneyId)
      .single(),
    supabase
      .from('bar_admissions')
      .select('state, bar_number, status, verified, admitted_date')
      .eq('attorney_id', attorneyId),
    supabase
      .from('case_results')
      .select('outcome, amount')
      .eq('attorney_id', attorneyId),
    // Check for portfolio images (existence only)
    supabase
      .from('attorneys')
      .select('id')
      .eq('id', attorneyId)
      .not('avatar_url', 'is', null)
      .maybeSingle(),
    // Count peer endorsements
    supabase
      .from('peer_endorsements')
      .select('*', { count: 'exact', head: true })
      .eq('endorsed_id', attorneyId),
  ])

  const attorney: AttorneyRow = attorneyRes.data ?? {
    rating_average: null,
    review_count: null,
    phone: null,
    email: null,
    website: null,
    bio: null,
    description: null,
  }
  const barAdmissions: BarAdmissionRow[] = (barRes.data ?? []) as BarAdmissionRow[]
  const caseResults: CaseResultRow[] = (caseRes.data ?? []) as CaseResultRow[]
  const hasPortfolio = !!portfolioRes.data
  const endorsementCount = endorsementRes.count ?? 0

  // Compute each factor (0-10)
  const breakdown: Record<TrustFactor, number> = {
    barVerified: scoreBarVerified(barAdmissions),
    yearsExperience: scoreYearsExperience(barAdmissions),
    reviewScore: scoreReviewScore(attorney),
    reviewCount: scoreReviewCount(attorney),
    profileCompleteness: scoreProfileCompleteness(attorney, hasPortfolio),
    caseResults: scoreCaseResults(caseResults),
    responsiveness: scoreResponsiveness(),
    peerEndorsements: scorePeerEndorsements(endorsementCount),
  }

  // Weighted average
  let weightedSum = 0
  for (const [factor, value] of Object.entries(breakdown)) {
    weightedSum += value * WEIGHTS[factor as TrustFactor]
  }
  const rawScore = weightedSum / TOTAL_WEIGHT

  // Round to 1 decimal, clamp 0-10
  const score = Math.round(Math.min(10, Math.max(0, rawScore)) * 10) / 10

  return { score, breakdown }
}

// ── Persist to DB ───────────────────────────────────────────────────

export async function calculateAndPersistTrustScore(
  attorneyId: string,
): Promise<TrustScoreResult> {
  const result = await calculateTrustScore(attorneyId)
  const supabase = createAdminClient()

  await supabase
    .from('attorneys')
    .update({
      trust_score: result.score,
      trust_score_breakdown: result.breakdown,
      trust_score_updated_at: new Date().toISOString(),
    })
    .eq('id', attorneyId)

  return result
}

// ── Factor labels (for UI display) ──────────────────────────────────

export const FACTOR_LABELS: Record<TrustFactor, string> = {
  barVerified: 'Bar Admission Verified',
  yearsExperience: 'Years of Experience',
  reviewScore: 'Client Rating',
  reviewCount: 'Number of Reviews',
  profileCompleteness: 'Profile Completeness',
  caseResults: 'Case Results',
  responsiveness: 'Responsiveness',
  peerEndorsements: 'Peer Endorsements',
}

export const FACTOR_DESCRIPTIONS: Record<TrustFactor, string> = {
  barVerified: 'Verified against official state bar records',
  yearsExperience: 'Based on bar admission date',
  reviewScore: 'Average client review rating',
  reviewCount: 'Total number of published client reviews',
  profileCompleteness: 'Photo, bio, phone, email, and website',
  caseResults: 'Win rate and case volume from court records',
  responsiveness: 'Average response time to client inquiries',
  peerEndorsements: 'Endorsements from other licensed attorneys',
}
