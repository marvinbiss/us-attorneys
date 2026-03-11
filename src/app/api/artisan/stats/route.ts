/**
 * Artisan Stats API - ServicesArtisans
 * GET: Fetch dashboard statistics for artisan
 * OPTIMIZED: Parallelized queries, real period comparisons, correct stat mappings
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

/** Format a percentage change as "+12%", "-5%", or "+0%". */
function fmtChange(current: number, previous: number): string {
  if (previous === 0) {
    const pct = current > 0 ? 100 : 0
    return `${pct >= 0 ? '+' : ''}${pct}%`
  }
  const pct = Math.round(((current - previous) / previous) * 100)
  return `${pct >= 0 ? '+' : ''}${pct}%`
}

/** Count analytics events for a provider in a date range (uses admin client). */
async function countAnalyticsInRange(
  adminClient: ReturnType<typeof createAdminClient>,
  providerId: string,
  eventType: string,
  gte: string,
  lt?: string,
): Promise<number> {
  let query = adminClient
    .from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .eq('provider_id', providerId)
    .eq('event_type', eventType)
    .gte('created_at', gte)
  if (lt) {
    query = query.lt('created_at', lt)
  }
  const { count } = await query
  return count ?? 0
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const startTime = Date.now()
  try {
    const { searchParams } = new URL(request.url)

    // Validate query params
    const validation = querySchema.safeParse({
      period: searchParams.get('period') || 'month',
    })

    const period: Period = validation.success ? validation.data.period : 'month'
    const { currentStart, previousStart } = periodDates(period)

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifie' },
        { status: 401 }
      )
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil introuvable' },
        { status: 404 }
      )
    }

    // Try optimized RPC first (single query for all stats)
    const { data: rpcStats, error: rpcError } = await supabase.rpc('get_artisan_dashboard_stats', {
      p_artisan_id: user.id,
      p_period: period,
    })

    // Fallback to legacy queries if RPC not available
    if (rpcError) {
      logger.warn('RPC not available, using fallback queries', { error: rpcError.message })
      return await getLegacyStats(supabase, user, profile, period, startTime)
    }

    // -----------------------------------------------------------------------
    // Provider record (needed for scoped queries)
    // -----------------------------------------------------------------------
    const { data: providerForUnread } = await supabase
      .from('providers')
      .select('id, stable_id, slug, specialty, address_city, address_postal_code, is_verified, name, description, phone, email')
      .eq('user_id', user.id)
      .single()

    const providerId = providerForUnread?.id

    // -----------------------------------------------------------------------
    // Wave 1 — All independent queries in parallel
    // -----------------------------------------------------------------------
    const adminClient = createAdminClient()
    const nilUuid = '00000000-0000-0000-0000-000000000000'

    const [
      conversationsResult,
      leadAssignmentsCountResult,
      curLeadAssignmentsResult,
      prevLeadAssignmentsResult,
      recentAssignmentsResult,
      reviewsResult,
      curPositiveReviewsResult,
      prevPositiveReviewsResult,
      portfolioCountResult,
      // Analytics: current period (3 event types)
      curProfileViews,
      curPhoneReveals,
      curPhoneClicks,
      // Analytics: previous period (3 event types)
      prevProfileViews,
      prevPhoneReveals,
      prevPhoneClicks,
    ] = await Promise.all([
      // Conversations for this provider
      providerId
        ? supabase
            .from('conversations')
            .select('id')
            .eq('provider_id', providerId)
        : Promise.resolve({ data: [] as { id: string }[] }),

      // Total lead_assignments count for demandesRecues
      providerId
        ? supabase
            .from('lead_assignments')
            .select('id', { count: 'exact', head: true })
            .eq('provider_id', providerId)
        : Promise.resolve({ count: 0 }),

      // Lead assignments in current period (for change %)
      providerId
        ? supabase
            .from('lead_assignments')
            .select('id', { count: 'exact', head: true })
            .eq('provider_id', providerId)
            .gte('assigned_at', currentStart)
        : Promise.resolve({ count: 0 }),

      // Lead assignments in previous period (for change %)
      providerId
        ? supabase
            .from('lead_assignments')
            .select('id', { count: 'exact', head: true })
            .eq('provider_id', providerId)
            .gte('assigned_at', previousStart)
            .lt('assigned_at', currentStart)
        : Promise.resolve({ count: 0 }),

      // Recent 5 lead_assignments for the dashboard list
      providerId
        ? supabase
            .from('lead_assignments')
            .select('lead_id')
            .eq('provider_id', providerId)
            .order('assigned_at', { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] as { lead_id: string }[] }),

      // Reviews (positive = rating >= 4) for clientsSatisfaits
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('artisan_id', user.id)
        .gte('rating', 4),

      // Positive reviews in current period (for change %)
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('artisan_id', user.id)
        .gte('rating', 4)
        .gte('created_at', currentStart),

      // Positive reviews in previous period (for change %)
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('artisan_id', user.id)
        .gte('rating', 4)
        .gte('created_at', previousStart)
        .lt('created_at', currentStart),

      // Portfolio items count
      supabase
        .from('portfolio_items')
        .select('id', { count: 'exact', head: true })
        .eq('artisan_id', user.id),

      // Analytics current period
      providerId
        ? countAnalyticsInRange(adminClient, providerId, 'artisan_profile_view', currentStart)
        : Promise.resolve(0),
      providerId
        ? countAnalyticsInRange(adminClient, providerId, 'phone_reveal', currentStart)
        : Promise.resolve(0),
      providerId
        ? countAnalyticsInRange(adminClient, providerId, 'phone_click', currentStart)
        : Promise.resolve(0),

      // Analytics previous period
      providerId
        ? countAnalyticsInRange(adminClient, providerId, 'artisan_profile_view', previousStart, currentStart)
        : Promise.resolve(0),
      providerId
        ? countAnalyticsInRange(adminClient, providerId, 'phone_reveal', previousStart, currentStart)
        : Promise.resolve(0),
      providerId
        ? countAnalyticsInRange(adminClient, providerId, 'phone_click', previousStart, currentStart)
        : Promise.resolve(0),
    ])

    // -----------------------------------------------------------------------
    // Wave 2 — Dependent queries (need results from wave 1)
    // -----------------------------------------------------------------------
    const convIds = (conversationsResult.data ?? []).map(c => c.id)
    const recentLeadIds = (recentAssignmentsResult.data ?? []).map((a: { lead_id: string }) => a.lead_id)

    const [unreadResult, recentDemandesResult] = await Promise.all([
      // Unread client messages in provider conversations
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', convIds.length > 0 ? convIds : [nilUuid])
        .eq('sender_type', 'client')
        .is('read_at', null),

      // Devis request details for the recent leads
      recentLeadIds.length > 0
        ? supabase
            .from('devis_requests')
            .select('id, service_name, postal_code, city, status, client_name, created_at')
            .in('id', recentLeadIds)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
    ])

    // -----------------------------------------------------------------------
    // Assemble response
    // -----------------------------------------------------------------------
    const demandesRecuesCount = ('count' in leadAssignmentsCountResult
      ? leadAssignmentsCountResult.count : 0) ?? 0
    const curLeadAssignments = ('count' in curLeadAssignmentsResult
      ? curLeadAssignmentsResult.count : 0) ?? 0
    const prevLeadAssignments = ('count' in prevLeadAssignmentsResult
      ? prevLeadAssignmentsResult.count : 0) ?? 0
    const clientsSatisfaitsCount = ('count' in reviewsResult ? reviewsResult.count : 0) ?? 0
    const curPositiveReviews = ('count' in curPositiveReviewsResult
      ? curPositiveReviewsResult.count : 0) ?? 0
    const prevPositiveReviews = ('count' in prevPositiveReviewsResult
      ? prevPositiveReviewsResult.count : 0) ?? 0
    const portfolioPhotoCount = ('count' in portfolioCountResult ? portfolioCountResult.count : 0) ?? 0

    // Current analytics values
    const curPV = typeof curProfileViews === 'number' ? curProfileViews : 0
    const curPR = typeof curPhoneReveals === 'number' ? curPhoneReveals : 0
    const curPC = typeof curPhoneClicks === 'number' ? curPhoneClicks : 0
    const prevPV = typeof prevProfileViews === 'number' ? prevProfileViews : 0
    const prevPR = typeof prevPhoneReveals === 'number' ? prevPhoneReveals : 0
    const prevPC = typeof prevPhoneClicks === 'number' ? prevPhoneClicks : 0

    // RPC-based period comparisons
    const periodBookings = rpcStats?.periodBookings || 0
    const lastPeriodBookings = rpcStats?.lastPeriodBookings || 0
    const periodRevenue = rpcStats?.periodRevenue || 0
    const lastPeriodRevenue = rpcStats?.lastPeriodRevenue || 0

    const bookingsChange = lastPeriodBookings > 0
      ? ((periodBookings - lastPeriodBookings) / lastPeriodBookings) * 100
      : periodBookings > 0 ? 100 : 0

    const revenueChange = lastPeriodRevenue > 0
      ? ((periodRevenue - lastPeriodRevenue) / lastPeriodRevenue) * 100
      : periodRevenue > 0 ? 100 : 0

    // Transform bookingsByDay to include day names
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    const bookingsByDayMap = new Map(
      (rpcStats?.bookingsByDay || []).map((d: { day: number; count: number }) => [d.day, d.count])
    )
    const bookingsByDay = dayNames.map((day, index) => ({
      day,
      count: bookingsByDayMap.get(index) || 0,
    }))

    const stats = {
      profileViews: {
        value: curPV,
        change: fmtChange(curPV, prevPV),
      },
      phoneReveals: {
        value: curPR,
        change: fmtChange(curPR, prevPR),
      },
      phoneClicks: {
        value: curPC,
        change: fmtChange(curPC, prevPC),
      },
      demandesRecues: {
        value: demandesRecuesCount,
        change: fmtChange(curLeadAssignments, prevLeadAssignments),
      },
      devisEnvoyes: {
        // TODO: Wire to actual devis sent table when available
        value: 0,
        change: '+0%',
      },
      clientsSatisfaits: {
        value: clientsSatisfaitsCount,
        change: fmtChange(curPositiveReviews, prevPositiveReviews),
      },
      averageRating: rpcStats?.averageRating || 0,
      totalReviews: rpcStats?.totalReviews || 0,
      unreadMessages: unreadResult.count ?? 0,
      portfolioPhotoCount,

      // Enhanced stats
      totalBookings: rpcStats?.totalBookings || 0,
      totalBookingsChange: Math.round(bookingsChange),
      monthlyRevenue: periodRevenue,
      monthlyRevenueChange: Math.round(revenueChange),
      upcomingBookings: rpcStats?.upcomingBookings || 0,
      fillRate: rpcStats?.fillRate || 0,
      cancelRate: rpcStats?.cancelRate || 0,
      bookingsByDay,
      bookingsByMonth: rpcStats?.bookingsByMonth || [],
      topServices: rpcStats?.topServices || [],
    }

    return NextResponse.json({
      stats,
      profile,
      provider: providerForUnread || null,
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
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// Legacy fallback (RPC unavailable)
// ---------------------------------------------------------------------------

async function getLegacyStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string },
  profile: Record<string, unknown>,
  period: Period,
  startTime: number,
) {
  const { currentStart, previousStart } = periodDates(period)
  const adminClient = createAdminClient()
  const nilUuid = '00000000-0000-0000-0000-000000000000'

  // Provider record
  const { data: legacyProvider } = await supabase
    .from('providers')
    .select('id, stable_id, slug, specialty, address_city, address_postal_code, is_verified, name, description, phone, email')
    .eq('user_id', user.id)
    .single()

  const providerId = legacyProvider?.id

  // -----------------------------------------------------------------------
  // Wave 1 — All independent queries
  // -----------------------------------------------------------------------
  const [
    conversationsResult,
    leadAssignmentsCountResult,
    curLeadAssignmentsResult,
    prevLeadAssignmentsResult,
    recentAssignmentsResult,
    reviewsResult,
    positiveReviewsResult,
    curPositiveReviewsResult,
    prevPositiveReviewsResult,
    portfolioCountResult,
    curProfileViews,
    curPhoneReveals,
    curPhoneClicks,
    prevProfileViews,
    prevPhoneReveals,
    prevPhoneClicks,
  ] = await Promise.all([
    // Conversations
    providerId
      ? supabase.from('conversations').select('id').eq('provider_id', providerId)
      : Promise.resolve({ data: [] as { id: string }[] }),

    // Lead assignments count (demandesRecues)
    providerId
      ? supabase
          .from('lead_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('provider_id', providerId)
      : Promise.resolve({ count: 0 }),

    // Lead assignments in current period (for change %)
    providerId
      ? supabase
          .from('lead_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('provider_id', providerId)
          .gte('assigned_at', currentStart)
      : Promise.resolve({ count: 0 }),

    // Lead assignments in previous period (for change %)
    providerId
      ? supabase
          .from('lead_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('provider_id', providerId)
          .gte('assigned_at', previousStart)
          .lt('assigned_at', currentStart)
      : Promise.resolve({ count: 0 }),

    // Recent 5 assignments
    providerId
      ? supabase
          .from('lead_assignments')
          .select('lead_id')
          .eq('provider_id', providerId)
          .order('assigned_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] as { lead_id: string }[] }),

    // All reviews (for average rating)
    supabase
      .from('reviews')
      .select('id, rating')
      .eq('artisan_id', user.id),

    // Positive reviews (clientsSatisfaits)
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('artisan_id', user.id)
      .gte('rating', 4),

    // Positive reviews in current period (for change %)
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('artisan_id', user.id)
      .gte('rating', 4)
      .gte('created_at', currentStart),

    // Positive reviews in previous period (for change %)
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('artisan_id', user.id)
      .gte('rating', 4)
      .gte('created_at', previousStart)
      .lt('created_at', currentStart),

    // Portfolio count
    supabase
      .from('portfolio_items')
      .select('id', { count: 'exact', head: true })
      .eq('artisan_id', user.id),

    // Analytics current period
    providerId
      ? countAnalyticsInRange(adminClient, providerId, 'artisan_profile_view', currentStart)
      : Promise.resolve(0),
    providerId
      ? countAnalyticsInRange(adminClient, providerId, 'phone_reveal', currentStart)
      : Promise.resolve(0),
    providerId
      ? countAnalyticsInRange(adminClient, providerId, 'phone_click', currentStart)
      : Promise.resolve(0),

    // Analytics previous period
    providerId
      ? countAnalyticsInRange(adminClient, providerId, 'artisan_profile_view', previousStart, currentStart)
      : Promise.resolve(0),
    providerId
      ? countAnalyticsInRange(adminClient, providerId, 'phone_reveal', previousStart, currentStart)
      : Promise.resolve(0),
    providerId
      ? countAnalyticsInRange(adminClient, providerId, 'phone_click', previousStart, currentStart)
      : Promise.resolve(0),
  ])

  // -----------------------------------------------------------------------
  // Wave 2 — Dependent queries
  // -----------------------------------------------------------------------
  const convIds = (conversationsResult.data ?? []).map(c => c.id)
  const recentLeadIds = (recentAssignmentsResult.data ?? []).map((a: { lead_id: string }) => a.lead_id)

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

  // -----------------------------------------------------------------------
  // Compute stats
  // -----------------------------------------------------------------------
  const demandesRecuesCount = ('count' in leadAssignmentsCountResult
    ? leadAssignmentsCountResult.count : 0) ?? 0
  const legacyCurLeadAssignments = ('count' in curLeadAssignmentsResult
    ? curLeadAssignmentsResult.count : 0) ?? 0
  const legacyPrevLeadAssignments = ('count' in prevLeadAssignmentsResult
    ? prevLeadAssignmentsResult.count : 0) ?? 0
  const clientsSatisfaitsCount = ('count' in positiveReviewsResult
    ? positiveReviewsResult.count : 0) ?? 0
  const curPositiveReviews = ('count' in curPositiveReviewsResult
    ? curPositiveReviewsResult.count : 0) ?? 0
  const prevPositiveReviews = ('count' in prevPositiveReviewsResult
    ? prevPositiveReviewsResult.count : 0) ?? 0
  const portfolioPhotoCount = ('count' in portfolioCountResult
    ? portfolioCountResult.count : 0) ?? 0

  const reviews = reviewsResult.data ?? []
  const reviewCount = reviews.length
  const averageRating = reviewCount > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0

  const curPV = typeof curProfileViews === 'number' ? curProfileViews : 0
  const curPR = typeof curPhoneReveals === 'number' ? curPhoneReveals : 0
  const curPC = typeof curPhoneClicks === 'number' ? curPhoneClicks : 0
  const prevPV = typeof prevProfileViews === 'number' ? prevProfileViews : 0
  const prevPR = typeof prevPhoneReveals === 'number' ? prevPhoneReveals : 0
  const prevPC = typeof prevPhoneClicks === 'number' ? prevPhoneClicks : 0

  const stats = {
    profileViews: {
      value: curPV,
      change: fmtChange(curPV, prevPV),
    },
    phoneReveals: {
      value: curPR,
      change: fmtChange(curPR, prevPR),
    },
    phoneClicks: {
      value: curPC,
      change: fmtChange(curPC, prevPC),
    },
    demandesRecues: {
      value: demandesRecuesCount,
      change: fmtChange(legacyCurLeadAssignments, legacyPrevLeadAssignments),
    },
    devisEnvoyes: {
      // TODO: Wire to actual devis sent table when available
      value: 0,
      change: '+0%',
    },
    clientsSatisfaits: {
      value: clientsSatisfaitsCount,
      change: fmtChange(curPositiveReviews, prevPositiveReviews),
    },
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: reviewCount,
    unreadMessages: unreadResult.count ?? 0,
    portfolioPhotoCount,

    // Empty enhanced stats for backward compatibility
    totalBookings: 0,
    totalBookingsChange: 0,
    monthlyRevenue: 0,
    monthlyRevenueChange: 0,
    upcomingBookings: 0,
    fillRate: 0,
    cancelRate: 0,
    bookingsByDay: [
      { day: 'Dim', count: 0 },
      { day: 'Lun', count: 0 },
      { day: 'Mar', count: 0 },
      { day: 'Mer', count: 0 },
      { day: 'Jeu', count: 0 },
      { day: 'Ven', count: 0 },
      { day: 'Sam', count: 0 },
    ],
    bookingsByMonth: [],
    topServices: [],
  }

  return NextResponse.json({
    stats,
    profile,
    provider: legacyProvider || null,
    recentDemandes: recentDemandesResult.data || [],
  }, {
    headers: {
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Server-Timing': `db;dur=${Date.now() - startTime}`,
    },
  })
}
