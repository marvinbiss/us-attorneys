/**
 * Admin Lead Matching API — US Attorneys
 *
 * GET:  View lead matching stats (match rate, avg response time, conversion by source)
 * POST: Manually reassign a lead to a different attorney
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { reassignLead } from '@/lib/matching'
import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/errors/types'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// GET: Lead matching statistics
// ---------------------------------------------------------------------------

export async function GET() {
  const auth = await requirePermission('providers', 'read')
  if (!auth.success || !auth.admin) return auth.error!

  try {
    const supabase = createAdminClient()

    // --- Fetch aggregate stats from attorney_lead_assignments ---
    const { data: assignments, error: assignError } = await supabase
      .from('attorney_lead_assignments')
      .select('id, status, score, response_time_seconds, assigned_at')

    if (assignError) {
      logger.error('Failed to fetch lead assignments for stats', assignError)
      return NextResponse.json(
        createErrorResponse(ErrorCode.DATABASE_ERROR, 'Failed to fetch stats'),
        { status: 500 }
      )
    }

    const allAssignments = assignments || []
    const total = allAssignments.length

    // Status breakdown
    const statusCounts: Record<string, number> = {
      pending: 0,
      accepted: 0,
      declined: 0,
      expired: 0,
      completed: 0,
    }
    for (const a of allAssignments) {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1
    }

    // Average response time (only for assignments that have been responded to)
    const respondedAssignments = allAssignments.filter(
      (a) => a.response_time_seconds != null && a.response_time_seconds > 0
    )
    const avgResponseTimeSeconds =
      respondedAssignments.length > 0
        ? Math.round(
            respondedAssignments.reduce((sum, a) => sum + (a.response_time_seconds || 0), 0) /
              respondedAssignments.length
          )
        : null

    // Average match score
    const avgScore =
      total > 0
        ? Math.round(
            (allAssignments.reduce((sum, a) => sum + (Number(a.score) || 0), 0) / total) * 100
          ) / 100
        : 0

    // Match rate: bookings that got matched vs total bookings with matching_status set
    const { count: totalBookingsWithMatching } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .not('matching_status', 'is', null)

    const { count: matchedBookings } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('matching_status', 'assigned')

    const matchRate =
      totalBookingsWithMatching && totalBookingsWithMatching > 0
        ? Math.round(((matchedBookings || 0) / totalBookingsWithMatching) * 10000) / 100
        : 0

    // Manual review count
    const { count: manualReviewCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('matching_status', 'manual_review')

    // Conversion rate (accepted / total assignments)
    const conversionRate =
      total > 0
        ? Math.round(((statusCounts.accepted + statusCounts.completed) / total) * 10000) / 100
        : 0

    // Decline rate
    const declineRate =
      total > 0 ? Math.round((statusCounts.declined / total) * 10000) / 100 : 0

    // Assignments per day (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentAssignments = allAssignments.filter(
      (a) => new Date(a.assigned_at) >= thirtyDaysAgo
    )
    const assignmentsPerDay = Math.round((recentAssignments.length / 30) * 100) / 100

    // Top subscription tiers by assignment count
    const { data: tierData } = await supabase
      .from('attorney_lead_assignments')
      .select('attorney_id, attorneys!inner(subscription_tier)')

    const tierCounts: Record<string, number> = { free: 0, pro: 0, premium: 0 }
    if (tierData) {
      for (const row of tierData) {
        const tier = ((row as unknown as { attorneys: { subscription_tier: string }[] }).attorneys?.[0]?.subscription_tier) || 'free'
        tierCounts[tier] = (tierCounts[tier] || 0) + 1
      }
    }

    return NextResponse.json(
      createSuccessResponse({
        overview: {
          totalAssignments: total,
          matchRate,
          conversionRate,
          declineRate,
          avgScore,
          avgResponseTimeSeconds,
          avgResponseTimeFormatted: avgResponseTimeSeconds
            ? formatDuration(avgResponseTimeSeconds)
            : 'N/A',
          assignmentsPerDay,
          manualReviewPending: manualReviewCount || 0,
        },
        statusBreakdown: statusCounts,
        bySubscriptionTier: tierCounts,
        period: {
          from: thirtyDaysAgo.toISOString(),
          to: new Date().toISOString(),
          recentAssignments: recentAssignments.length,
        },
      })
    )
  } catch (error) {
    logger.error('Admin lead matching stats error', error)
    return NextResponse.json(
      createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to compute lead matching stats'),
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// POST: Manually reassign a lead
// ---------------------------------------------------------------------------

const reassignSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  attorneyId: z.string().uuid('Invalid attorney ID'),
})

export async function POST(request: NextRequest) {
  const auth = await requirePermission('providers', 'write')
  if (!auth.success || !auth.admin) return auth.error!

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Invalid JSON body'),
        { status: 400 }
      )
    }

    const validation = reassignSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Invalid request data', {
          errors: validation.error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        }),
        { status: 400 }
      )
    }

    const { bookingId, attorneyId } = validation.data

    const result = await reassignLead(bookingId, attorneyId, auth.admin.id)

    if (!result.success) {
      return NextResponse.json(
        createErrorResponse(ErrorCode.INTERNAL_ERROR, result.error || 'Reassignment failed'),
        { status: 422 }
      )
    }

    return NextResponse.json(
      createSuccessResponse({
        bookingId,
        attorneyId,
        message: 'Lead successfully reassigned',
      })
    )
  } catch (error) {
    logger.error('Admin lead reassignment error', error)
    return NextResponse.json(
      createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to reassign lead'),
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}
