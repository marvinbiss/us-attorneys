/**
 * Lead Billing — CPA (Cost Per Acquisition) tracking
 *
 * Tracks charges when leads are dispatched to attorneys.
 * Charges are recorded as pending and later billed via Stripe invoices.
 *
 * Server-side only — uses createAdminClient() (service_role, bypasses RLS).
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Lead prices in USD by lead type */
export const LEAD_PRICES = {
  standard: 25,
  premium: 50,
  exclusive: 100,
} as const

export type LeadType = keyof typeof LEAD_PRICES

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Record a pending charge when a lead is dispatched to an attorney.
 * Amount is determined by lead type (standard/premium/exclusive).
 *
 * @returns The created charge ID, or null on failure
 */
export async function trackLeadCharge(
  attorneyId: string,
  leadId: string,
  leadType: LeadType = 'standard',
): Promise<string | null> {
  const admin = createAdminClient()
  const amountCents = LEAD_PRICES[leadType] * 100

  const { data, error } = await admin
    .from('lead_charges')
    .insert({
      attorney_id: attorneyId,
      lead_id: leadId,
      lead_type: leadType,
      amount_cents: amountCents,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    logger.error('Failed to track lead charge', {
      attorneyId,
      leadId,
      leadType,
      error: error.message,
    })
    return null
  }

  logger.info('Lead charge recorded', {
    chargeId: data.id,
    attorneyId,
    leadId,
    leadType,
    amountCents,
  })

  return data.id
}

/**
 * Get total charges for an attorney in the current calendar month.
 *
 * @returns Object with total cents, charge count, and breakdown by type
 */
export async function getMonthlyLeadCharges(attorneyId: string): Promise<{
  totalCents: number
  totalUsd: number
  chargeCount: number
  byType: Record<LeadType, { count: number; totalCents: number }>
}> {
  const admin = createAdminClient()

  // First day of current month at midnight UTC
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  const { data: charges, error } = await admin
    .from('lead_charges')
    .select('id, lead_type, amount_cents, status')
    .eq('attorney_id', attorneyId)
    .gte('created_at', monthStart.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to fetch monthly lead charges', {
      attorneyId,
      error: error.message,
    })
    return {
      totalCents: 0,
      totalUsd: 0,
      chargeCount: 0,
      byType: {
        standard: { count: 0, totalCents: 0 },
        premium: { count: 0, totalCents: 0 },
        exclusive: { count: 0, totalCents: 0 },
      },
    }
  }

  const byType: Record<LeadType, { count: number; totalCents: number }> = {
    standard: { count: 0, totalCents: 0 },
    premium: { count: 0, totalCents: 0 },
    exclusive: { count: 0, totalCents: 0 },
  }

  let totalCents = 0

  for (const charge of charges || []) {
    const type = (charge.lead_type as LeadType) || 'standard'
    if (byType[type]) {
      byType[type].count += 1
      byType[type].totalCents += charge.amount_cents
    }
    totalCents += charge.amount_cents
  }

  return {
    totalCents,
    totalUsd: totalCents / 100,
    chargeCount: (charges || []).length,
    byType,
  }
}

/**
 * Mark charges as billed (linked to a Stripe invoice).
 * Called after monthly invoice is created.
 */
export async function markChargesBilled(
  chargeIds: string[],
  stripeInvoiceId: string,
): Promise<void> {
  if (chargeIds.length === 0) return

  const admin = createAdminClient()

  const { error } = await admin
    .from('lead_charges')
    .update({
      status: 'billed',
      stripe_invoice_id: stripeInvoiceId,
      billed_at: new Date().toISOString(),
    })
    .in('id', chargeIds)

  if (error) {
    logger.error('Failed to mark charges as billed', {
      chargeIds,
      stripeInvoiceId,
      error: error.message,
    })
  }
}
