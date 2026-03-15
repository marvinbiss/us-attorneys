/**
 * Admin Stats API - ServicesArtisans
 * Real platform statistics, trends, activity data, and chart series
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * Log errors from a batch of Promise.allSettled results.
 * Supabase queries never reject — they resolve with { data, error }.
 * We must check both rejection (unlikely) AND the Supabase error field.
 */
function logBatchErrors(label: string, results: PromiseSettledResult<{ error?: { message: string; code?: string } | null }>[]) {
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      logger.warn(`[admin-stats] ${label}[${i}] rejected`, { reason: String(r.reason) })
    } else if (r.value.error) {
      logger.warn(`[admin-stats] ${label}[${i}] query error`, {
        message: r.value.error.message,
        code: r.value.error.code,
      })
    }
  })
}

/** Safely extract count — returns 0 on rejection or Supabase error */
function safeCount(r: PromiseSettledResult<{ count: number | null; error?: unknown }>): number {
  if (r.status !== 'fulfilled') return 0
  if (r.value.error) return 0
  return r.value.count ?? 0
}

/** Safely extract data array — returns [] on rejection or Supabase error */
function safeData<T>(r: PromiseSettledResult<{ data: T[] | null; error?: unknown }>): T[] {
  if (r.status !== 'fulfilled') return []
  if (r.value.error) return []
  return r.value.data ?? []
}

/** Compute % change between two periods */
function trend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

/** Group timestamps by YYYY-MM-DD, return counts per day */
function countByDay(rows: { created_at: string }[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const r of rows) {
    const day = r.created_at.slice(0, 10)
    map[day] = (map[day] || 0) + 1
  }
  return map
}

export async function GET() {
  try {
    const authResult = await requirePermission('settings', 'read')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    const supabase = createAdminClient()
    const now = new Date()
    const todayStart = now.toISOString().slice(0, 10) + 'T00:00:00.000Z'
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000).toISOString()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString()

    // ── Single batch: all 20 queries in parallel (no sequential batches) ─
    const [
      // Counts (0–3)
      totalUsersR, totalArtisansR, totalBookingsR, pendingReportsR,
      // Rating sample (4) — 200 rows is statistically sufficient for avg
      reviewsR,
      // Today (5–6)
      newUsersTodayR, newBookingsTodayR,
      // This month vs last month (7–10)
      usersThisMonthR, usersLastMonthR,
      bookingsThisMonthR, bookingsLastMonthR,
      // Revenue (11–12)
      revThisMonthR, revLastMonthR,
      // Active users (13)
      activeUsers7dR,
      // Activity feed (14–16)
      recentBookingsR, recentReviewsR, pendingReportsListR,
      // Chart: last 30 days (17–19) — capped at 5K rows each
      chartProfilesR, chartBookingsR, chartReviewsR,
      // Estimation leads (20–22)
      estimationTotalR, estimationTodayR, recentEstimationLeadsR,
    ] = await Promise.allSettled([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('attorneys').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('user_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('reviews').select('rating').eq('status', 'published').limit(200),
      // Today
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
      // This month vs last month
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', thisMonthStart),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', lastMonthStart).lt('created_at', thisMonthStart),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', thisMonthStart),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', lastMonthStart).lt('created_at', thisMonthStart),
      // Revenue: total_amount n'existe pas dans bookings — on compte les réservations payées
      // pour le calcul de tendance, mais le montant réel retourné sera 0.
      supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', thisMonthStart).eq('payment_status', 'paid'),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', lastMonthStart).lt('created_at', thisMonthStart).eq('payment_status', 'paid'),
      // Active users (profile updated in last 7 days)
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('updated_at', sevenDaysAgo),
      // Activity feed
      supabase.from('bookings').select('id, status, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('reviews').select('id, rating, client_name, status, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('user_reports').select('id, target_type, reason, description, status, created_at, reporter_id').eq('status', 'pending').order('created_at', { ascending: false }).limit(10),
      // Chart: last 30 days — reduced from 10K to 5K per table
      supabase.from('profiles').select('created_at').gte('created_at', thirtyDaysAgo).limit(5000),
      supabase.from('bookings').select('created_at').gte('created_at', thirtyDaysAgo).limit(5000),
      supabase.from('reviews').select('created_at').gte('created_at', thirtyDaysAgo).limit(5000),
      // Estimation leads (20–22)
      supabase.from('estimation_leads').select('id', { count: 'exact', head: true }),
      supabase.from('estimation_leads').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('estimation_leads').select('id, nom, telephone, metier, ville, source, created_at').order('created_at', { ascending: false }).limit(5),
    ])

    logBatchErrors('queries', [
      totalUsersR, totalArtisansR, totalBookingsR, pendingReportsR, reviewsR,
      newUsersTodayR, newBookingsTodayR,
      usersThisMonthR, usersLastMonthR,
      bookingsThisMonthR, bookingsLastMonthR,
      revThisMonthR, revLastMonthR,
      activeUsers7dR,
      recentBookingsR, recentReviewsR, pendingReportsListR,
      chartProfilesR, chartBookingsR, chartReviewsR,
      estimationTotalR, estimationTodayR, recentEstimationLeadsR,
    ])

    // ── Derived metrics ────────────────────────────────────────────────
    // Average rating from published reviews sample
    const ratings = safeData<{ rating: number }>(reviewsR as PromiseSettledResult<{ data: { rating: number }[] | null }>)
    const averageRating = ratings.length > 0
      ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
      : 0

    // Revenue: total_amount n'existe pas dans bookings.
    // On utilise le nombre de réservations payées pour la tendance; le montant retourné est 0.
    const revThisMonth = 0
    // Tendance basée sur le nombre de réservations payées (pas de montant disponible)
    const paidThisMonth = safeCount(revThisMonthR as PromiseSettledResult<{ count: number | null; error?: unknown }>)
    const paidLastMonth = safeCount(revLastMonthR as PromiseSettledResult<{ count: number | null; error?: unknown }>)

    // ── Build activity feed from real data ────────────────────────────
    type ActivityItem = { id: string; type: string; action: string; details: string; timestamp: string; status?: string }
    const activity: ActivityItem[] = []

    for (const b of safeData<{ id: string; status: string; created_at: string }>(
      recentBookingsR as PromiseSettledResult<{ data: { id: string; status: string; created_at: string }[] | null }>
    )) {
      activity.push({
        id: `b-${b.id}`,
        type: 'booking',
        action: 'Nouvelle réservation',
        details: 'Nouvelle réservation',
        timestamp: b.created_at,
        status: b.status,
      })
    }

    for (const r of safeData<{ id: string; rating: number; client_name: string | null; status: string; created_at: string }>(
      recentReviewsR as PromiseSettledResult<{ data: { id: string; rating: number; client_name: string | null; status: string; created_at: string }[] | null }>
    )) {
      activity.push({
        id: `r-${r.id}`,
        type: 'review',
        action: 'Nouvel avis',
        details: `${r.client_name || 'Anonyme'} — ${r.rating} étoile${r.rating > 1 ? 's' : ''}`,
        timestamp: r.created_at,
        status: r.status,
      })
    }

    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Pending reports (real)
    const pendingReports = safeData<{ id: string; target_type: string; reason: string; description: string | null; status: string; created_at: string; reporter_id: string | null }>(
      pendingReportsListR as PromiseSettledResult<{ data: { id: string; target_type: string; reason: string; description: string | null; status: string; created_at: string; reporter_id: string | null }[] | null }>
    )

    // ── Build 30-day chart series ─────────────────────────────────────
    const profilesByDay = countByDay(safeData<{ created_at: string }>(chartProfilesR as PromiseSettledResult<{ data: { created_at: string }[] | null }>))
    const bookingsByDay = countByDay(safeData<{ created_at: string }>(chartBookingsR as PromiseSettledResult<{ data: { created_at: string }[] | null }>))
    const reviewsByDay = countByDay(safeData<{ created_at: string }>(chartReviewsR as PromiseSettledResult<{ data: { created_at: string }[] | null }>))

    const chartData: { date: string; users: number; bookings: number; reviews: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86_400_000)
      const key = d.toISOString().slice(0, 10)
      chartData.push({
        date: key,
        users: profilesByDay[key] || 0,
        bookings: bookingsByDay[key] || 0,
        reviews: reviewsByDay[key] || 0,
      })
    }

    // ── Response ──────────────────────────────────────────────────────
    const response = NextResponse.json({
      success: true,
      stats: {
        totalUsers: safeCount(totalUsersR),
        totalArtisans: safeCount(totalArtisansR),
        totalBookings: safeCount(totalBookingsR),
        totalRevenue: Math.round(revThisMonth * 100), // cents
        pendingReports: safeCount(pendingReportsR),
        averageRating,
        newUsersToday: safeCount(newUsersTodayR),
        newBookingsToday: safeCount(newBookingsTodayR),
        activeUsers7d: safeCount(activeUsers7dR),
        trends: {
          users: trend(safeCount(usersThisMonthR), safeCount(usersLastMonthR)),
          bookings: trend(safeCount(bookingsThisMonthR), safeCount(bookingsLastMonthR)),
          revenue: trend(paidThisMonth, paidLastMonth),
        },
      },
      recentActivity: activity.slice(0, 10),
      pendingReports,
      chartData,
      estimationLeads: {
        total: safeCount(estimationTotalR),
        today: safeCount(estimationTodayR),
        recent: safeData<{ id: string; nom: string | null; telephone: string; metier: string; ville: string; source: string; created_at: string }>(
          recentEstimationLeadsR as PromiseSettledResult<{ data: { id: string; nom: string | null; telephone: string; metier: string; ville: string; source: string; created_at: string }[] | null }>
        ),
      },
    })

    response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Surrogate-Control', 'no-store')
    response.headers.set('Vercel-CDN-Cache-Control', 'no-store')
    return response
  } catch (error) {
    logger.error('Admin stats error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur lors de la récupération des statistiques' } },
      { status: 500 }
    )
  }
}
