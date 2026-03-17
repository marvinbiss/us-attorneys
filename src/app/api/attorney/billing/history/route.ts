/**
 * Attorney Billing History API
 * GET: Billing history for the last 6 months, grouped by month
 *
 * Returns per-month totals and breakdown by lead type.
 */

import { NextResponse } from 'next/server'
import { createApiHandler } from '@/lib/api/handler'
import { getMonthlyBillingReport } from '@/lib/billing/cpa-model'

export const dynamic = 'force-dynamic'

export const GET = createApiHandler(async ({ attorney }) => {
  const attorneyId = attorney!.attorney_id

  // Generate month strings for the last 6 months (current month first)
  const now = new Date()
  const months: string[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`)
  }

  // Fetch all 6 months in parallel
  const reports = await Promise.all(
    months.map((month) => getMonthlyBillingReport(attorneyId, month))
  )

  return NextResponse.json({
    success: true,
    data: {
      months: reports.map((r) => ({
        month: r.month,
        tier: r.tier,
        totalLeads: r.totalLeads,
        totalCostUsd: r.totalCostUsd,
        totalCostCents: r.totalCostCents,
        breakdown: r.breakdown,
      })),
    },
  }, {
    headers: {
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  })
}, { requireAttorney: true })
