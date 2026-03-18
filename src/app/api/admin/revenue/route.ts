import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Plan prices in cents
const PLAN_PRICES: Record<string, number> = {
  pro: 9900,      // $99/month
  premium: 19900, // $199/month
}

interface MonthlyBucket {
  month: string // YYYY-MM
  pro: number
  premium: number
  free: number
  cancelled: number
  newTrials: number
  converted: number
}

export async function GET() {
  try {
    // Verify admin with payments:read permission
    const authResult = await requirePermission('payments', 'read')
    if (!authResult.success || !authResult.admin) {
      return authResult.error!
    }

    const supabase = createAdminClient()

    // ── 1. Fetch all attorneys with subscription info ──────────────
    // Note: subscription_status lives on profiles, not attorneys.
    // attorneys has: subscription_tier, stripe_subscription_id, subscription_started_at, subscription_ends_at
    const { data: attorneys, error: attError } = await supabase
      .from('attorneys')
      .select('id, name, slug, subscription_tier, stripe_subscription_id, stripe_customer_id, subscription_started_at, subscription_ends_at, created_at, is_active')

    if (attError) {
      logger.warn('Revenue API: attorneys query failed', { error: attError.message })
    }

    const allAttorneys = attorneys || []

    // Derive subscription status from available columns:
    // - has stripe_subscription_id + tier != free -> active subscriber
    // - subscription_ends_at in the past -> cancelled
    // - subscription_ends_at in the future -> active
    const now = new Date()
    const enriched = allAttorneys.map(a => {
      let status: 'active' | 'canceled' | 'trialing' | 'free' = 'free'
      if (a.subscription_tier === 'pro' || a.subscription_tier === 'premium') {
        if (a.subscription_ends_at && new Date(a.subscription_ends_at) < now) {
          status = 'canceled'
        } else if (a.subscription_started_at && (now.getTime() - new Date(a.subscription_started_at).getTime()) < 14 * 24 * 60 * 60 * 1000) {
          status = 'trialing'
        } else {
          status = 'active'
        }
      }
      return { ...a, derived_status: status }
    })

    // ── 2. Count subscribers by tier ──────────────────────────────
    const activeAttorneys = enriched.filter(a => a.is_active !== false)
    const activePro = activeAttorneys.filter(a => a.subscription_tier === 'pro' && a.derived_status === 'active')
    const activePremium = activeAttorneys.filter(a => a.subscription_tier === 'premium' && a.derived_status === 'active')
    const activeFree = activeAttorneys.filter(a => !a.subscription_tier || a.subscription_tier === 'free')
    const trialing = activeAttorneys.filter(a => a.derived_status === 'trialing')
    const cancelledAll = enriched.filter(a => a.derived_status === 'canceled')

    // ── 3. Compute MRR ───────────────────────────────────────────
    const mrrCents = (activePro.length * PLAN_PRICES.pro) + (activePremium.length * PLAN_PRICES.premium)
    const mrr = mrrCents / 100
    const totalSubscribers = activePro.length + activePremium.length
    const arr = mrr * 12

    // ── 4. Compute ARPU & LTV ────────────────────────────────────
    const arpu = totalSubscribers > 0 ? mrr / totalSubscribers : 0

    // Monthly churn: cancelled this month / active at start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const cancelledThisMonth = enriched.filter(a => {
      if (a.derived_status !== 'canceled') return false
      // Use subscription_ends_at as proxy for cancellation date
      if (!a.subscription_ends_at) return false
      return new Date(a.subscription_ends_at) >= startOfMonth
    }).length

    const activeStartOfMonth = totalSubscribers + cancelledThisMonth
    const churnRate = activeStartOfMonth > 0
      ? (cancelledThisMonth / activeStartOfMonth) * 100
      : 0

    // LTV = ARPU / monthly churn rate (as decimal)
    const churnDecimal = churnRate / 100
    const ltv = churnDecimal > 0 ? arpu / churnDecimal : arpu * 24 // fallback: 24 months if no churn

    // ── 5. Build 12-month MRR trend ─────────────────────────────
    const months: MonthlyBucket[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months.push({
        month: monthKey,
        pro: 0,
        premium: 0,
        free: 0,
        cancelled: 0,
        newTrials: 0,
        converted: 0,
      })
    }

    // Distribute attorneys into monthly buckets based on created_at
    for (const att of enriched) {
      const created = new Date(att.created_at)
      const createdKey = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`
      const bucket = months.find(m => m.month === createdKey)
      if (!bucket) continue

      if (att.subscription_tier === 'pro') bucket.pro++
      else if (att.subscription_tier === 'premium') bucket.premium++
      else bucket.free++

      if (att.derived_status === 'canceled') bucket.cancelled++
      if (att.derived_status === 'trialing') bucket.newTrials++
      if ((att.subscription_tier === 'pro' || att.subscription_tier === 'premium') &&
          att.derived_status === 'active') {
        bucket.converted++
      }
    }

    // Build cumulative MRR data
    let cumulativePro = 0
    let cumulativePremium = 0
    let cumulativeFree = 0

    const mrrTrend = months.map(m => {
      cumulativePro += m.pro
      cumulativePremium += m.premium
      cumulativeFree += m.free

      return {
        month: m.month,
        mrr: ((cumulativePro * PLAN_PRICES.pro) + (cumulativePremium * PLAN_PRICES.premium)) / 100,
        pro: cumulativePro,
        premium: cumulativePremium,
        free: cumulativeFree,
        subscribers: cumulativePro + cumulativePremium,
      }
    })

    // ── 6. Subscriber growth chart data ─────────────────────────
    const subscriberGrowth = months.map(m => ({
      month: m.month,
      free: m.free,
      pro: m.pro,
      premium: m.premium,
    }))

    // ── 7. Churn analysis per month ─────────────────────────────
    const churnAnalysis = months.map(m => {
      const totalActive = m.pro + m.premium
      const rate = totalActive > 0 ? (m.cancelled / (totalActive + m.cancelled)) * 100 : 0
      return {
        month: m.month,
        cancelled: m.cancelled,
        churnRate: Math.round(rate * 100) / 100,
      }
    })

    // ── 8. Revenue by plan (pie chart) ──────────────────────────
    const revenueByPlan = [
      {
        name: 'Pro ($99/mo)',
        value: (activePro.length * PLAN_PRICES.pro) / 100,
        count: activePro.length,
        color: '#6366f1',
      },
      {
        name: 'Premium ($199/mo)',
        value: (activePremium.length * PLAN_PRICES.premium) / 100,
        count: activePremium.length,
        color: '#8b5cf6',
      },
    ]

    // ── 9. Top attorneys by revenue ─────────────────────────────
    const paidAttorneys = enriched
      .filter(a => a.subscription_tier === 'pro' || a.subscription_tier === 'premium')
      .map(a => {
        const monthlyRate = PLAN_PRICES[a.subscription_tier as string] || 0
        const startDate = a.subscription_started_at ? new Date(a.subscription_started_at) : new Date(a.created_at)
        const monthsActive = Math.max(1,
          (now.getFullYear() - startDate.getFullYear()) * 12 +
          (now.getMonth() - startDate.getMonth())
        )
        const totalPaid = (monthlyRate * monthsActive) / 100

        return {
          id: a.id,
          name: a.name || 'Unknown',
          slug: a.slug,
          plan: a.subscription_tier,
          status: a.derived_status,
          tenure: monthsActive,
          totalPaid: Math.round(totalPaid * 100) / 100,
          monthlyRate: monthlyRate / 100,
        }
      })
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 20)

    // ── 10. Trial conversion funnel ─────────────────────────────
    const totalTrials = enriched.filter(a =>
      a.derived_status === 'trialing' ||
      (a.subscription_tier && a.subscription_tier !== 'free')
    ).length

    const trialConverted = enriched.filter(a =>
      (a.subscription_tier === 'pro' || a.subscription_tier === 'premium') &&
      a.derived_status === 'active'
    ).length

    const trialChurned = enriched.filter(a =>
      a.derived_status === 'canceled'
    ).length

    const trialFunnel = {
      started: totalTrials,
      converted: trialConverted,
      churned: trialChurned,
      conversionRate: totalTrials > 0 ? Math.round((trialConverted / totalTrials) * 10000) / 100 : 0,
    }

    // ── 11. Cohort retention (signup month -> still active) ─────
    const cohorts: Array<{
      cohort: string
      total: number
      retained: number[]
    }> = []

    // Last 6 months of cohorts
    for (let i = 5; i >= 0; i--) {
      const cohortDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const cohortKey = `${cohortDate.getFullYear()}-${String(cohortDate.getMonth() + 1).padStart(2, '0')}`

      const cohortMembers = enriched.filter(a => {
        const created = new Date(a.created_at)
        return (
          created.getFullYear() === cohortDate.getFullYear() &&
          created.getMonth() === cohortDate.getMonth() &&
          (a.subscription_tier === 'pro' || a.subscription_tier === 'premium')
        )
      })

      const retained: number[] = []
      for (let m = 0; m <= i; m++) {
        // For simplicity, check if still active
        const activeInMonth = cohortMembers.filter(a =>
          a.derived_status === 'active' || a.derived_status === 'trialing'
        ).length
        // Approximate: all active members are retained
        retained.push(cohortMembers.length > 0
          ? Math.round((activeInMonth / cohortMembers.length) * 100)
          : 0
        )
      }

      cohorts.push({
        cohort: cohortKey,
        total: cohortMembers.length,
        retained,
      })
    }

    // ── 12. MRR trends for sparkline ────────────────────────────
    const previousMrr = mrrTrend.length >= 2 ? mrrTrend[mrrTrend.length - 2].mrr : 0
    const mrrGrowth = previousMrr > 0 ? ((mrr - previousMrr) / previousMrr) * 100 : 0

    // ── 13. Try to enrich with Stripe data if available ─────────
    let stripeRevenue = null
    try {
      const { getRevenueStats } = await import('@/lib/stripe-admin')
      const stats = await getRevenueStats(30)
      stripeRevenue = {
        last30Days: stats.netRevenue / 100,
        charges: stats.chargesCount,
        refunds: stats.refundsCount,
        totalRefunded: stats.totalRefunded / 100,
      }
    } catch {
      logger.info('Revenue API: Stripe not available, using DB-only metrics')
    }

    return NextResponse.json({
      success: true,
      kpis: {
        mrr,
        arr,
        totalSubscribers,
        activePro: activePro.length,
        activePremium: activePremium.length,
        activeFree: activeFree.length,
        trialing: trialing.length,
        totalCancelled: cancelledAll.length,
        churnRate: Math.round(churnRate * 100) / 100,
        arpu: Math.round(arpu * 100) / 100,
        ltv: Math.round(ltv * 100) / 100,
        mrrGrowth: Math.round(mrrGrowth * 100) / 100,
      },
      mrrTrend,
      subscriberGrowth,
      churnAnalysis,
      revenueByPlan,
      topAttorneys: paidAttorneys,
      trialFunnel,
      cohorts,
      stripeRevenue,
      mrrSparkline: mrrTrend.map(m => m.mrr),
    })
  } catch (error) {
    logger.error('Revenue API error', error as Error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
