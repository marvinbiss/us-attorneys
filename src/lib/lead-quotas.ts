/**
 * Lead Quota System
 * Enforces tier-based lead limits per month.
 *
 * Tiers:
 *   - Free:    5 leads/month
 *   - Pro:     50 leads/month
 *   - Premium: unlimited
 *
 * Usage:
 *   const quota = await checkLeadQuota(attorneyId)
 *   if (!quota.allowed) return NextResponse.json({ error: 'Lead quota exceeded' }, { status: 429 })
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const LEAD_LIMITS: Record<string, number> = {
  free: 5,
  gratuit: 5,    // Legacy French value in DB CHECK constraint
  pro: 50,
  premium: -1,   // -1 = unlimited
}

export interface LeadQuotaResult {
  allowed: boolean
  remaining: number
  limit: number
  used: number
  tier: string
}

/**
 * Check whether an attorney can receive more leads this month.
 *
 * Reads the attorney's subscription tier from `profiles` (via `attorneys.user_id`)
 * and counts leads received this billing month from `lead_assignments`.
 */
export async function checkLeadQuota(attorneyId: string): Promise<LeadQuotaResult> {
  const supabase = createAdminClient()

  // 1. Get the attorney's user_id to look up subscription
  const { data: attorney, error: attError } = await supabase
    .from('attorneys')
    .select('user_id')
    .eq('id', attorneyId)
    .single()

  if (attError || !attorney) {
    logger.warn('checkLeadQuota: attorney not found', { attorneyId })
    // Fail-open: allow lead if attorney not found (unclaimed profile)
    return { allowed: true, remaining: LEAD_LIMITS.free, limit: LEAD_LIMITS.free, used: 0, tier: 'free' }
  }

  // 2. Get subscription tier from profiles
  let tier = 'free'
  if (attorney.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', attorney.user_id)
      .single()

    if (profile?.subscription_plan) {
      tier = profile.subscription_plan
    }
  }

  // 3. Determine limit for this tier
  const limit = LEAD_LIMITS[tier] ?? LEAD_LIMITS.free

  // Unlimited tier — skip counting
  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1, used: 0, tier }
  }

  // 4. Count leads assigned this calendar month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { count, error: countError } = await supabase
    .from('lead_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('attorney_id', attorneyId)
    .gte('assigned_at', monthStart)

  if (countError) {
    logger.error('checkLeadQuota: error counting leads', countError)
    // Fail-open on DB error to avoid blocking lead flow
    return { allowed: true, remaining: limit, limit, used: 0, tier }
  }

  const used = count ?? 0
  const remaining = Math.max(0, limit - used)
  const allowed = used < limit

  return { allowed, remaining, limit, used, tier }
}
