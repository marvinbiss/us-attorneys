/**
 * Attorney Billing Portal API
 * GET: Returns full billing portal data — subscription info, usage stats,
 *      Stripe invoices, and payment methods.
 *
 * Merges Stripe API data with local DB data (leads count, profile views).
 */

import { NextResponse } from 'next/server'
import { createApiHandler } from '@/lib/api/handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMonthlyBillingReport } from '@/lib/billing/cpa-model'
import { checkLeadQuota } from '@/lib/lead-quotas'
import { stripe, PLANS } from '@/lib/stripe/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export const GET = createApiHandler(async ({ user, attorney }) => {
  const attorneyId = attorney!.attorney_id
  const userId = user!.id
  const admin = createAdminClient()

  // 1. Fetch local data in parallel
  const [report, quota, profileResult, statsResult] = await Promise.all([
    getMonthlyBillingReport(attorneyId),
    checkLeadQuota(attorneyId),
    admin
      .from('profiles')
      .select('stripe_customer_id, subscription_plan, created_at')
      .eq('id', userId)
      .single(),
    admin
      .from('attorneys')
      .select('claimed_at, created_at, is_verified, review_count, rating_average')
      .eq('id', attorneyId)
      .single(),
  ])

  const profile = profileResult.data
  const attorney_data = statsResult.data
  const stripeCustomerId = profile?.stripe_customer_id
  const currentPlan = profile?.subscription_plan || 'free'

  // 2. Fetch profile views this month from analytics (if table exists)
  let profileViews = 0
  try {
    const now = new Date()
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
    // analytics_events uses provider_id (legacy column name)
    const { count } = await admin
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('provider_id', attorneyId)
      .eq('event_type', 'profile_view')
      .gte('created_at', monthStart)
    profileViews = count ?? 0
  } catch {
    // analytics_events table may not exist or column name differs — gracefully ignore
  }

  // 3. Fetch Stripe data if customer exists
  let subscription: {
    id: string
    status: string
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    trialStart: string | null
    trialEnd: string | null
    planName: string
    planPrice: number
    interval: string | null
  } | null = null

  let invoices: Array<{
    id: string
    number: string | null
    amount: number
    currency: string
    status: string | null
    pdfUrl: string | null
    description: string | null
    created: string
  }> = []

  let paymentMethod: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  } | null = null

  if (stripeCustomerId) {
    try {
      // Fetch subscription, invoices, and payment methods in parallel
      const [subsResult, invoicesResult, pmResult] = await Promise.all([
        stripe.subscriptions.list({
          customer: stripeCustomerId,
          limit: 1,
          expand: ['data.default_payment_method'],
        }),
        stripe.invoices.list({
          customer: stripeCustomerId,
          limit: 12,
        }),
        stripe.customers.listPaymentMethods(stripeCustomerId, {
          type: 'card',
          limit: 1,
        }),
      ])

      // Parse subscription
      if (subsResult.data.length > 0) {
        const sub = subsResult.data[0]
        const priceItem = sub.items.data[0]
        const amount = priceItem?.price.unit_amount ?? 0

        subscription = {
          id: sub.id,
          status: sub.status,
          currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          trialStart: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
          trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          planName: getPlanNameFromPrice(priceItem?.price.id ?? ''),
          planPrice: amount / 100,
          interval: priceItem?.price.recurring?.interval ?? null,
        }
      }

      // Parse invoices
      invoices = invoicesResult.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        amount: inv.amount_paid / 100,
        currency: inv.currency,
        status: inv.status as string | null,
        pdfUrl: inv.invoice_pdf ?? null,
        description: inv.lines.data[0]?.description ?? null,
        created: new Date(inv.created * 1000).toISOString(),
      }))

      // Parse payment method
      if (pmResult.data.length > 0) {
        const card = pmResult.data[0].card
        if (card) {
          paymentMethod = {
            brand: card.brand,
            last4: card.last4,
            expMonth: card.exp_month,
            expYear: card.exp_year,
          }
        }
      }
    } catch (error) {
      logger.error('Failed to fetch Stripe data for billing portal', error)
      // Continue with null Stripe data — page still works with local data
    }
  }

  // 4. Build response
  return NextResponse.json({
    success: true,
    data: {
      // Current plan info
      plan: {
        id: currentPlan,
        name: PLANS[currentPlan as keyof typeof PLANS]?.name ?? 'Free',
        price: PLANS[currentPlan as keyof typeof PLANS]?.price ?? 0,
        features: PLANS[currentPlan as keyof typeof PLANS]?.features ?? [],
      },
      subscription,

      // Usage stats
      usage: {
        leadsUsed: quota.used,
        leadsLimit: quota.limit,
        leadsRemaining: quota.remaining,
        profileViews,
        totalCostUsd: report.totalCostUsd,
        breakdown: report.breakdown,
      },

      // Stripe data
      invoices,
      paymentMethod,

      // Attorney metadata
      memberSince: attorney_data?.claimed_at ?? attorney_data?.created_at ?? profile?.created_at,
      isVerified: attorney_data?.is_verified ?? false,
    },
  }, {
    headers: {
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  })
}, { requireAttorney: true })

/**
 * Map a Stripe price ID back to a plan name.
 */
function getPlanNameFromPrice(priceId: string): string {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) return plan.name
    if (key === 'free') continue
  }
  return 'Pro' // fallback
}
