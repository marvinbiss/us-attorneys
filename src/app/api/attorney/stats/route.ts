/**
 * Attorney Stats API - US Attorneys
 * GET: Fetch dashboard statistics for attorney
 * Queries REAL data from lead_assignments, reviews, analytics_events, lead_events.
 * No dependency on bookings/availability_slots (those tables are not used in prod).
 */

import { NextResponse } from 'next/server'
import { requireAttorney } from '@/lib/auth/attorney-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const querySchema = z.object({
  period: z.enum(['week', 'month', 'year']).default('month'),
})

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Period = 'week' | 'month' | 'year'

/** Returns { currentStart, previousStart } ISO strings for the given period. */
function periodDates(period: Period): { currentStart: string; previousStart: string } {
  const now = new Date()
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365
  const currentStart = new Date(now.getTime() - days * 86_400_000)
  const previousStart = new Date(currentStart.getTime() - days * 86_400_000)
  return {
    currentStart: currentStart.toISOString(),
    previousStart: previousStart.toISOString(),
  }
}

/** Compute percentage change between two values. */
function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const startTime = Date.now()
  try {
    const { searchParams } = new URL(request.url)

    const validation = querySchema.safeParse({
      period: searchParams.get('period') || 'month',
    })
    const period: Period = validation.success ? validation.data.period : 'month'
    const { currentStart, previousStart } = periodDates(period)

    // Auth
    const { error: guardError, user, supabase } = await requireAttorney()
    if (guardError) return guardError

    // Get profile + provider in parallel
    const [{ data: profile }, { data: provider }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('id', user.id)
        .single(),
      supabase
        .from('attorneys')
        .select('id, stable_id, slug, specialty, address_city, address_postal_code, is_verified, name, description, phone, email')
        .eq('user_id', user.id)
        .single(),
    ])

    if (!provider) {
      return NextResponse.json(
        { error: 'No attorney profile found', provider: null },
        { status: 404 }
      )
    }

    const attorneyId = provider.id
    const adminClient = createAdminClient()
    const nilUuid = '00000000-0000-0000-0000-000000000000'

    // -----------------------------------------------------------------------
    // Wave 1 — All independent queries in parallel
    // -----------------------------------------------------------------------
    const [
      // Lead assignments: total
      totalLeadsResult,
      // Lead assignments: current period
      curLeadsResult,
      // Lead assignments: previous period
      prevLeadsResult,
      // All lead assignments (last 1000) for monthly trend + top services
      recentAssignmentsResult,
      // Reviews: all (for average rating)
      allReviewsResult,
      // Reviews: current period count
      curReviewsResult,
      // Reviews: previous period count
      prevReviewsResult,
      // Lead events: quoted (= quote sent)
      quotedEventsResult,
      // Lead events: quoted in current period
      curQuotedResult,
      // Lead events: quoted in previous period
      prevQuotedResult,
      // Analytics: profile views current
      curProfileViewsResult,
      // Analytics: profile views previous
      prevProfileViewsResult,
      // Analytics: phone reveals current
      curPhoneRevealsResult,
      // Analytics: phone reveals previous
      prevPhoneRevealsResult,
      // Analytics: phone clicks current
      curPhoneClicksResult,
      // Analytics: phone clicks previous
      prevPhoneClicksResult,
      // Conversations for unread messages
      conversationsResult,
      // Portfolio count
      portfolioCountResult,
    ] = await Promise.all([
      // Total leads
      adminClient
        .from('lead_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('attorney_id', attorneyId),

      // Leads in current period
      adminClient
        .from('lead_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('attorney_id', attorneyId)
        .gte('assigned_at', currentStart),

      // Leads in previous period
      adminClient
        .from('lead_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('attorney_id', attorneyId)
        .gte('assigned_at', previousStart)
        .lt('assigned_at', currentStart),

      // Recent assignments with lead details for monthly trend + top services
      adminClient
        .from('lead_assignments')
        .select('assigned_at, lead_id')
        .eq('attorney_id', attorneyId)
        .order('assigned_at', { ascending: false })
        .limit(1000),

      // All reviews for average rating
      supabase
        .from('reviews')
        .select('id, rating')
        .eq('attorney_id', user.id),

      // Reviews in current period
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('attorney_id', user.id)
        .gte('created_at', currentStart),

      // Reviews in previous period
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('attorney_id', user.id)
        .gte('created_at', previousStart)
        .lt('created_at', currentStart),

      // Total quoted events (= quote sent)
      adminClient
        .from('lead_events')
        .select('id', { count: 'exact', head: true })
        .eq('attorney_id', attorneyId)
        .eq('event_type', 'quoted'),

      // Quoted in current period
      adminClient
        .from('lead_events')
        .select('id', { count: 'exact', head: true })
        .eq('attorney_id', attorneyId)
        .eq('event_type', 'quoted')
        .gte('created_at', currentStart),

      // Quoted in previous period
      adminClient
        .from('lead_events')
        .select('id', { count: 'exact', head: true })
        .eq('attorney_id', attorneyId)
        .eq('event_type', 'quoted')
        .gte('created_at', previousStart)
        .lt('created_at', currentStart),

      // Profile views current
      adminClient
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('attorney_id', attorneyId)
        .eq('event_type', 'attorney_profile_view')
        .gte('created_at', currentStart),

      // Profile views previous
      adminClient
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('attorney_id', attorneyId)
        .eq('event_type', 'attorney_profile_view')
        .gte('created_at', previousStart)
        .lt('created_at', currentStart),

      // Phone reveals current
      adminClient
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('attorney_id', attorneyId)
        .eq('event_type', 'phone_reveal')
        .gte('created_at', currentStart),

      // Phone reveals previous
      adminClient
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('attorney_id', attorneyId)
        .eq('event_type', 'phone_reveal')
        .gte('created_at', previousStart)
        .lt('created_at', currentStart),

      // Phone clicks current
      adminClient
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('attorney_id', attorneyId)
        .eq('event_type', 'phone_click')
        .gte('created_at', currentStart),

      // Phone clicks previous
      adminClient
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('attorney_id', attorneyId)
        .eq('event_type', 'phone_click')
        .gte('created_at', previousStart)
        .lt('created_at', currentStart),

      // Conversations (for unread messages)
      supabase
        .from('conversations')
        .select('id')
        .eq('attorney_id', attorneyId),

      // Portfolio items count
      supabase
        .from('portfolio_items')
        .select('id', { count: 'exact', head: true })
        .eq('attorney_id', user.id),
    ])

    // -----------------------------------------------------------------------
    // Compute values
    // -----------------------------------------------------------------------
    const totalLeads = totalLeadsResult.count ?? 0
    const curLeads = curLeadsResult.count ?? 0
    const prevLeads = prevLeadsResult.count ?? 0

    const reviews = allReviewsResult.data ?? []
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : 0
    const curReviews = curReviewsResult.count ?? 0
    const prevReviews = prevReviewsResult.count ?? 0

    const totalQuoted = quotedEventsResult.count ?? 0
    const curQuoted = curQuotedResult.count ?? 0
    const prevQuoted = prevQuotedResult.count ?? 0

    const curProfileViews = curProfileViewsResult.count ?? 0
    const prevProfileViews = prevProfileViewsResult.count ?? 0
    const curPhoneReveals = curPhoneRevealsResult.count ?? 0
    const prevPhoneReveals = prevPhoneRevealsResult.count ?? 0
    const curPhoneClicks = curPhoneClicksResult.count ?? 0
    const prevPhoneClicks = prevPhoneClicksResult.count ?? 0

    // -----------------------------------------------------------------------
    // Monthly trend (last 6 months from lead_assignments)
    // -----------------------------------------------------------------------
    const assignments = recentAssignmentsResult.data ?? []
    const now = new Date()
    const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      const count = assignments.filter(
        (a) => new Date(a.assigned_at) >= d && new Date(a.assigned_at) < end
      ).length
      return {
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        count,
      }
    })

    // -----------------------------------------------------------------------
    // Top services (from devis_requests linked via lead_assignments)
    // -----------------------------------------------------------------------
    const leadIds = assignments.map(a => a.lead_id).filter(Boolean)
    let topServices: { name: string; count: number }[] = []

    if (leadIds.length > 0) {
      // Query in batches of 100 to avoid URL length limits
      const batchSize = 100
      const uniqueLeadIds = Array.from(new Set(leadIds))
      const serviceMap = new Map<string, number>()

      for (let i = 0; i < uniqueLeadIds.length; i += batchSize) {
        const batch = uniqueLeadIds.slice(i, i + batchSize)
        const { data: devisData } = await adminClient
          .from('devis_requests')
          .select('service_name')
          .in('id', batch)

        if (devisData) {
          for (const d of devisData) {
            const name = d.service_name || 'Not specified'
            serviceMap.set(name, (serviceMap.get(name) || 0) + 1)
          }
        }
      }

      topServices = Array.from(serviceMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    }

    // -----------------------------------------------------------------------
    // Wave 2 — Dependent queries (unread messages, recent demandes)
    // -----------------------------------------------------------------------
    const convIds = (conversationsResult.data ?? []).map((c: { id: string }) => c.id)
    const recentLeadIds = assignments.slice(0, 5).map(a => a.lead_id).filter(Boolean)

    const [unreadResult, recentDemandesResult] = await Promise.all([
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', convIds.length > 0 ? convIds : [nilUuid])
        .eq('sender_type', 'client')
        .is('read_at', null),

      recentLeadIds.length > 0
        ? supabase
            .from('devis_requests')
            .select('id, service_name, postal_code, city, status, client_name, created_at')
            .in('id', recentLeadIds)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
    ])

    const portfolioPhotoCount = portfolioCountResult.count ?? 0

    // -----------------------------------------------------------------------
    // Assemble response
    // -----------------------------------------------------------------------
    /** Format percentage change as "+12%" string (for dashboard backward compat). */
    const fmtChange = (current: number, previous: number): string => {
      const pct = pctChange(current, previous)
      return `${pct >= 0 ? '+' : ''}${pct}%`
    }

    const stats = {
      // Statistics page fields (flat numbers)
      totalLeads,
      totalLeadsChange: pctChange(curLeads, prevLeads),
      quotesSent: totalQuoted,
      quotesSentChange: pctChange(curQuoted, prevQuoted),
      averageRating,
      totalReviews,
      totalReviewsChange: pctChange(curReviews, prevReviews),
      profileViewsCount: curProfileViews,
      profileViewsChangeNum: pctChange(curProfileViews, prevProfileViews),
      phoneRevealsCount: curPhoneReveals,
      phoneRevealsChangeNum: pctChange(curPhoneReveals, prevPhoneReveals),
      phoneClicksCount: curPhoneClicks,
      phoneClicksChangeNum: pctChange(curPhoneClicks, prevPhoneClicks),
      monthlyTrend,
      topServices,

      // Dashboard backward-compat fields ({value, change} format)
      profileViews: {
        value: curProfileViews,
        change: fmtChange(curProfileViews, prevProfileViews),
      },
      phoneReveals: {
        value: curPhoneReveals,
        change: fmtChange(curPhoneReveals, prevPhoneReveals),
      },
      phoneClicks: {
        value: curPhoneClicks,
        change: fmtChange(curPhoneClicks, prevPhoneClicks),
      },
      demandesRecues: {
        value: totalLeads,
        change: fmtChange(curLeads, prevLeads),
      },
      unreadMessages: unreadResult.count ?? 0,
      portfolioPhotoCount,
    }

    return NextResponse.json({
      stats,
      profile: profile || null,
      provider,
      recentDemandes: recentDemandesResult.data || [],
    }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Server-Timing': `db;dur=${Date.now() - startTime}`,
      },
    })
  } catch (error) {
    logger.error('Stats GET error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
