/**
 * Attorney Billing API
 * GET: Current month billing summary for the authenticated attorney
 *
 * Returns lead count, total cost, breakdown by type, and quota remaining.
 * Uses RLS-aware client for auth, admin client for billing data.
 */

import { NextResponse } from 'next/server'
import { createApiHandler } from '@/lib/api/handler'
import { getMonthlyBillingReport } from '@/lib/billing/cpa-model'
import { checkLeadQuota } from '@/lib/lead-quotas'

export const dynamic = 'force-dynamic'

export const GET = createApiHandler(async ({ attorney }) => {
  const attorneyId = attorney!.attorney_id

  // Fetch billing report and quota in parallel
  const [report, quota] = await Promise.all([
    getMonthlyBillingReport(attorneyId),
    checkLeadQuota(attorneyId),
  ])

  return NextResponse.json({
    success: true,
    data: {
      month: report.month,
      tier: report.tier,
      totalLeads: report.totalLeads,
      totalCostUsd: report.totalCostUsd,
      totalCostCents: report.totalCostCents,
      quotaLimit: report.quotaLimit,
      quotaUsed: quota.used,
      quotaRemaining: quota.remaining,
      breakdown: report.breakdown,
    },
  }, {
    headers: {
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  })
}, { requireAttorney: true })
