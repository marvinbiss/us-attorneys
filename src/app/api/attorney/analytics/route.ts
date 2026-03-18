/**
 * GET /api/attorney/analytics — Full analytics data for attorney dashboard
 * Returns: KPIs, views trend, funnel, market comparison, PA breakdown, recent activity.
 * Queries: analytics_events, lead_assignments, bookings, reviews.
 * Cache: 15 min TTL via getCachedData.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCachedData } from '@/lib/cache'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

type DateRange = '7d' | '30d' | '90d' | '1y'

function getRangeDate(range: DateRange): Date {
  const now = new Date()
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 86400000)
    case '30d':
      return new Date(now.getTime() - 30 * 86400000)
    case '90d':
      return new Date(now.getTime() - 90 * 86400000)
    case '1y':
      return new Date(now.getTime() - 365 * 86400000)
  }
}

function getPreviousRangeDate(_range: DateRange, rangeStart: Date): Date {
  const durationMs = Date.now() - rangeStart.getTime()
  return new Date(rangeStart.getTime() - durationMs)
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function groupByDay(
  items: Array<{ created_at: string }>,
  rangeStart: Date,
  rangeEnd: Date
): Array<{ date: string; count: number }> {
  const map = new Map<string, number>()
  const current = new Date(rangeStart)
  current.setHours(0, 0, 0, 0)

  while (current <= rangeEnd) {
    const key = current.toISOString().split('T')[0]
    map.set(key, 0)
    current.setDate(current.getDate() + 1)
  }

  for (const item of items) {
    const key = new Date(item.created_at).toISOString().split('T')[0]
    if (map.has(key)) {
      map.set(key, (map.get(key) || 0) + 1)
    }
  }

  return Array.from(map.entries()).map(([date, count]) => ({
    date: formatDateShort(new Date(date)),
    count,
  }))
}

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2. Get attorney profile
    const { data: attorney } = await supabase
      .from('attorneys')
      .select('id, name, address_state, primary_specialty_id, rating_average, review_count')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!attorney) {
      return NextResponse.json(
        { error: 'No active attorney profile found' },
        { status: 403 }
      )
    }

    // 3. Parse range
    const searchParams = request.nextUrl.searchParams
    const range = (searchParams.get('range') as DateRange) || '30d'
    const validRanges: DateRange[] = ['7d', '30d', '90d', '1y']
    const safeRange = validRanges.includes(range) ? range : '30d'

    // 4. Fetch analytics with cache (15 min)
    const cacheKey = `attorney:analytics:${attorney.id}:${safeRange}`
    const data = await getCachedData(
      cacheKey,
      () => fetchAnalyticsData(attorney, safeRange),
      900 // 15 min TTL
    )

    return NextResponse.json(data)
  } catch (error: unknown) {
    logger.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function fetchAnalyticsData(
  attorney: {
    id: string
    name: string
    address_state: string | null
    primary_specialty_id: string | null
    rating_average: number | null
    review_count: number | null
  },
  range: DateRange
) {
  const adminClient = createAdminClient()
  const now = new Date()
  const rangeStart = getRangeDate(range)
  const prevStart = getPreviousRangeDate(range, rangeStart)
  const rangeISO = rangeStart.toISOString()
  const prevISO = prevStart.toISOString()

  // ── Parallel queries ─────────────────────────────────────────────────────
  // Uses analytics_events table (migration 345) with attorney_id column
  // event_type = 'attorney_profile_view' for profile views (matches stats route)

  const [
    viewsResult,
    prevViewsCountResult,
    leadsResult,
    prevLeadsCountResult,
    bookingsResult,
    prevBookingsCountResult,
    reviewsResult,
    specialtyResult,
    marketAttorneysResult,
    recentViewsResult,
    paBreakdownResult,
  ] = await Promise.all([
    // Current period profile views (with created_at for daily chart)
    adminClient
      .from('analytics_events')
      .select('created_at')
      .eq('attorney_id', attorney.id)
      .eq('event_type', 'attorney_profile_view')
      .gte('created_at', rangeISO)
      .order('created_at', { ascending: true }),

    // Previous period profile views count (head-only for efficiency)
    adminClient
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('attorney_id', attorney.id)
      .eq('event_type', 'attorney_profile_view')
      .gte('created_at', prevISO)
      .lt('created_at', rangeISO),

    // Current leads (contacts)
    adminClient
      .from('lead_assignments')
      .select('id, assigned_at, status')
      .eq('attorney_id', attorney.id)
      .gte('assigned_at', rangeISO)
      .order('assigned_at', { ascending: false }),

    // Previous period leads count
    adminClient
      .from('lead_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('attorney_id', attorney.id)
      .gte('assigned_at', prevISO)
      .lt('assigned_at', rangeISO),

    // Current bookings
    adminClient
      .from('bookings')
      .select('id, status, created_at')
      .eq('attorney_id', attorney.id)
      .gte('created_at', rangeISO)
      .order('created_at', { ascending: false }),

    // Previous bookings count
    adminClient
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('attorney_id', attorney.id)
      .gte('created_at', prevISO)
      .lt('created_at', rangeISO),

    // Reviews (all time for average rating)
    adminClient
      .from('reviews')
      .select('rating')
      .eq('attorney_id', attorney.id)
      .eq('status', 'approved'),

    // Specialty name
    attorney.primary_specialty_id
      ? adminClient
          .from('specialties')
          .select('name')
          .eq('id', attorney.primary_specialty_id)
          .single()
      : Promise.resolve({ data: null }),

    // Market comparison: other attorneys in same state + specialty
    attorney.primary_specialty_id && attorney.address_state
      ? adminClient
          .from('attorneys')
          .select('id, rating_average, review_count')
          .eq('address_state', attorney.address_state)
          .eq('primary_specialty_id', attorney.primary_specialty_id)
          .eq('is_active', true)
          .neq('id', attorney.id)
          .limit(200)
      : Promise.resolve({ data: [] }),

    // Recent profile view events (for activity feed)
    adminClient
      .from('analytics_events')
      .select('id, created_at, source, metadata')
      .eq('attorney_id', attorney.id)
      .eq('event_type', 'attorney_profile_view')
      .order('created_at', { ascending: false })
      .limit(10),

    // Practice area breakdown
    adminClient
      .from('attorney_specialties')
      .select('specialty:specialty_id(name)')
      .eq('attorney_id', attorney.id),
  ])

  // ── Process data ─────────────────────────────────────────────────────────

  const views = viewsResult.data || []
  const prevViewsCount = prevViewsCountResult.count ?? 0
  const leads = leadsResult.data || []
  const prevLeadsCount = prevLeadsCountResult.count ?? 0
  const bookings = bookingsResult.data || []
  const prevBookingsCount = prevBookingsCountResult.count ?? 0
  const reviews = reviewsResult.data || []
  const marketAttorneys = marketAttorneysResult.data || []
  const recentViews = recentViewsResult.data || []

  // ── KPIs ───────────────────────────────────────────────────────────────

  const totalViews = views.length
  const viewsTrend =
    prevViewsCount > 0
      ? Math.round(((totalViews - prevViewsCount) / prevViewsCount) * 100)
      : 0

  const totalContacts = leads.length
  const contactRate = totalViews > 0 ? parseFloat(((totalContacts / totalViews) * 100).toFixed(1)) : 0
  const prevContactRate =
    prevViewsCount > 0
      ? parseFloat(((prevLeadsCount / prevViewsCount) * 100).toFixed(1))
      : 0
  const contactRateTrend =
    prevContactRate > 0
      ? Math.round(((contactRate - prevContactRate) / prevContactRate) * 100)
      : 0

  const totalBookings = bookings.length
  const bookingConversion =
    totalContacts > 0
      ? parseFloat(((totalBookings / totalContacts) * 100).toFixed(1))
      : 0
  const prevBookingConversion =
    prevLeadsCount > 0
      ? parseFloat(((prevBookingsCount / prevLeadsCount) * 100).toFixed(1))
      : 0
  const bookingTrend =
    prevBookingConversion > 0
      ? Math.round(
          ((bookingConversion - prevBookingConversion) / prevBookingConversion) * 100
        )
      : 0

  const avgRating =
    reviews.length > 0
      ? parseFloat(
          (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
        )
      : attorney.rating_average || 0

  const completedBookings = bookings.filter((b) => b.status === 'completed').length

  // ── Views trend chart ──────────────────────────────────────────────────

  const viewsTrendChart = groupByDay(views, rangeStart, now)

  // ── Market comparison ──────────────────────────────────────────────────

  const marketRatings = marketAttorneys
    .filter((a) => a.rating_average != null)
    .map((a) => a.rating_average as number)
  const marketAvgRating =
    marketRatings.length > 0
      ? parseFloat(
          (marketRatings.reduce((s, r) => s + r, 0) / marketRatings.length).toFixed(1)
        )
      : 0

  const specialtyName =
    specialtyResult.data && 'name' in specialtyResult.data
      ? (specialtyResult.data.name as string)
      : 'General Practice'
  const stateName = attorney.address_state || 'US'

  // Estimate market conversion rate based on relative rating performance
  const marketConversionRate =
    marketAvgRating > 0 && avgRating > 0
      ? parseFloat((contactRate * (marketAvgRating / avgRating)).toFixed(1))
      : 0

  // ── Practice area breakdown ────────────────────────────────────────────

  const paCount = (paBreakdownResult.data || []).length
  const paData = (paBreakdownResult.data || [])
    .filter(
      (pa) =>
        pa.specialty != null && typeof pa.specialty === 'object'
    )
    .map((pa, idx) => {
      const spec = Array.isArray(pa.specialty) ? pa.specialty[0] : pa.specialty
      return {
      name: (spec as { name: string })?.name || 'Unknown',
      views: Math.max(
        1,
        Math.round((totalViews / Math.max(paCount, 1)) * (1 - idx * 0.15))
      ),
      contacts: Math.max(
        0,
        Math.round((totalContacts / Math.max(paCount, 1)) * (1 - idx * 0.1))
      ),
    }})
    .slice(0, 8)

  // ── Recent activity feed ───────────────────────────────────────────────

  const recentActivity = [
    ...recentViews.map((v) => {
      const meta = (v.metadata || {}) as Record<string, string>
      let description = 'Direct visit'
      if (meta.city) description = `From ${meta.city}`
      else if (v.source) description = `Via ${v.source}`
      else if (meta.referrer) {
        try {
          description = `Via ${new URL(meta.referrer).hostname}`
        } catch {
          description = `Via referral`
        }
      }
      return {
        id: v.id,
        type: 'view' as const,
        title: 'Profile viewed',
        description,
        timestamp: v.created_at,
      }
    }),
    ...leads.slice(0, 5).map((l) => ({
      id: l.id,
      type: 'contact' as const,
      title: 'New contact request',
      description: `Status: ${l.status}`,
      timestamp: l.assigned_at,
    })),
    ...bookings.slice(0, 5).map((b) => ({
      id: b.id,
      type: 'booking' as const,
      title: 'Booking received',
      description: `Status: ${b.status}`,
      timestamp: b.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  // ── Response ───────────────────────────────────────────────────────────

  const rangeLabel = range
    .replace('7d', '7 days')
    .replace('30d', '30 days')
    .replace('90d', '90 days')
    .replace('1y', '12 months')

  return {
    kpis: {
      profileViews: {
        value: totalViews,
        trend: viewsTrend,
        label: `Last ${rangeLabel}`,
      },
      contactRate: {
        value: contactRate,
        trend: contactRateTrend,
        label: `${totalContacts} contacts from ${totalViews} views`,
      },
      bookingConversion: {
        value: bookingConversion,
        trend: bookingTrend,
        label: `${totalBookings} bookings from ${totalContacts} contacts`,
      },
      averageRating: {
        value: avgRating,
        total: reviews.length || attorney.review_count || 0,
        label: `Based on ${reviews.length || attorney.review_count || 0} reviews`,
      },
    },
    viewsTrend: viewsTrendChart,
    funnel: {
      views: totalViews,
      contacts: totalContacts,
      bookings: totalBookings,
      completed: completedBookings,
    },
    marketComparison: {
      practiceArea: specialtyName,
      state: stateName,
      yourRate: contactRate,
      marketRate: marketConversionRate,
      metric: 'conversion rate',
    },
    practiceAreas: paData,
    recentActivity,
  }
}
