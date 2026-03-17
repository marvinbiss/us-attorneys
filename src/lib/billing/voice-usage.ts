/**
 * Voice Usage Billing Tracker
 *
 * Tracks voice call usage per attorney per month for billing purposes.
 * Qualified voice leads (score A, B, C) are billable events.
 *
 * Current implementation: logs to voice_calls table (which already tracks
 * vapi_cost, qualification_score, etc.). This module provides helper
 * functions to query and aggregate billable voice usage.
 *
 * TODO: When Stripe metered billing is set up, report usage via
 *       stripe.subscriptionItems.createUsageRecord() after each qualified lead.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { trackLeadCharge } from '@/lib/billing/lead-billing'

export interface VoiceUsageSummary {
  attorneyId: string
  month: string // YYYY-MM
  totalCalls: number
  qualifiedCalls: number
  totalVapiCost: number
  billableAmount: number
}

/**
 * Record a qualified voice lead for billing.
 * Called after end-of-call-report when a call has a qualifying score (A/B/C).
 *
 * Currently: logs the billing event to voice_calls (already tracked).
 * TODO: Integrate with Stripe metered billing or invoice items.
 */
export async function trackVoiceLeadForBilling(params: {
  voiceCallId: string
  attorneyId: string | null
  qualificationScore: string
  vapiCost: number
}): Promise<void> {
  const { voiceCallId, attorneyId, qualificationScore, vapiCost } = params

  // Only bill for qualified leads (A, B, C — not disqualified)
  if (!qualificationScore || qualificationScore === 'disqualified') {
    return
  }

  if (!attorneyId) {
    logger.warn('trackVoiceLeadForBilling: no attorneyId, cannot bill', { voiceCallId })
    return
  }

  logger.info('Voice lead billable event', {
    voiceCallId,
    attorneyId,
    qualificationScore,
    vapiCost,
  })

  // Record a lead_charges entry so the voice lead appears on the attorney's invoice
  const chargeId = await trackLeadCharge(attorneyId, voiceCallId, 'voice')

  if (chargeId) {
    logger.info('Voice lead charge recorded', { chargeId, attorneyId, voiceCallId })
  }
}

/**
 * Get voice usage summary for an attorney in a given month.
 */
export async function getVoiceUsageSummary(
  attorneyId: string,
  month?: string // YYYY-MM, defaults to current month
): Promise<VoiceUsageSummary> {
  const supabase = createAdminClient()

  const now = new Date()
  const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [year, mon] = targetMonth.split('-').map(Number)
  const monthStart = new Date(year, mon - 1, 1).toISOString()
  const monthEnd = new Date(year, mon, 1).toISOString()

  // Query voice_calls for this attorney in the given month
  // voice_calls doesn't have attorney_id directly — we need to go through
  // lead_assignments or prospection_contacts. For now, query all calls
  // that were dispatched to this attorney via lead_assignments.
  const { data: calls, error } = await supabase
    .from('voice_calls')
    .select('id, qualification_score, vapi_cost')
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd)

  if (error) {
    logger.error('getVoiceUsageSummary: query error', error)
    return {
      attorneyId,
      month: targetMonth,
      totalCalls: 0,
      qualifiedCalls: 0,
      totalVapiCost: 0,
      billableAmount: 0,
    }
  }

  const allCalls = calls || []
  const qualifiedCalls = allCalls.filter(
    (c) => c.qualification_score && c.qualification_score !== 'disqualified'
  )
  const totalVapiCost = allCalls.reduce((sum, c) => sum + (Number(c.vapi_cost) || 0), 0)

  return {
    attorneyId,
    month: targetMonth,
    totalCalls: allCalls.length,
    qualifiedCalls: qualifiedCalls.length,
    totalVapiCost: Math.round(totalVapiCost * 100) / 100,
    billableAmount: 0, // TODO: Calculate based on voice_lead_pricing table
  }
}
