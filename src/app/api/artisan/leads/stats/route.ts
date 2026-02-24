/**
 * GET /api/artisan/leads/stats — Lead-specific stats for artisan dashboard
 * Returns lead KPIs: counts, conversion, response time, monthly trend.
 */

import { NextResponse } from 'next/server'
import { requireArtisan } from '@/lib/auth/artisan-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { error: guardError, user, supabase } = await requireArtisan()
    if (guardError) return guardError

    const { data: provider } = await supabase
      .from('providers')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!provider) {
      return NextResponse.json({ success: false, error: { message: 'Aucun profil artisan' } }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const providerId = provider.id
    const now = new Date()

    // Fetch only the minimal fields needed for calculations (not all columns).
    // Limit to 1000 most recent assignments to avoid loading entire table into memory.
    // Stats are therefore computed on the last 1000 leads maximum.
    const { data: assignments, error: assignmentsError } = await adminClient
      .from('lead_assignments')
      .select('status, assigned_at, viewed_at')
      .eq('provider_id', providerId)
      .order('assigned_at', { ascending: false })
      .limit(1000)

    if (assignmentsError) {
      logger.error('Leads stats assignments error:', assignmentsError)
      return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
    }

    const all = assignments || []
    const total = all.length
    const pending = all.filter((a) => a.status === 'pending').length
    const viewed = all.filter((a) => a.status === 'viewed').length
    const declined = all.filter((a) => a.status === 'declined').length

    // Fetch only event_type and created_at for conversion stats
    // Both 'quoted' and 'accepted' are sourced from lead_events for consistency
    const { data: events, error: eventsError } = await adminClient
      .from('lead_events')
      .select('event_type, created_at')
      .eq('provider_id', providerId)

    if (eventsError) {
      logger.error('Leads stats events error:', eventsError)
      return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
    }

    const allEvents = events || []
    const quoted = allEvents.filter((e) => e.event_type === 'quoted').length
    const accepted = allEvents.filter((e) => e.event_type === 'accepted').length
    const completed = allEvents.filter((e) => e.event_type === 'completed').length

    const conversionRate = quoted > 0 ? Math.round((accepted / quoted) * 100) : 0

    // Average response time (minutes between assigned_at and viewed_at)
    const responseTimes = all
      .filter((a) => a.viewed_at)
      .map(
        (a) =>
          (new Date(a.viewed_at as string).getTime() - new Date(a.assigned_at).getTime()) /
          60000
      )
    const avgResponseMinutes =
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length)
        : 0

    // Monthly counts
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const thisMonth = all.filter((a) => new Date(a.assigned_at) >= thisMonthStart).length
    const lastMonth = all.filter(
      (a) =>
        new Date(a.assigned_at) >= lastMonthStart &&
        new Date(a.assigned_at) < thisMonthStart
    ).length
    const monthlyGrowth =
      lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0

    // Monthly trend (last 6 months)
    const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      const count = all.filter(
        (a) => new Date(a.assigned_at) >= d && new Date(a.assigned_at) < end
      ).length
      return {
        month: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        count,
      }
    })

    return NextResponse.json({
      stats: {
        total,
        pending,
        viewed,
        quoted,
        declined,
        accepted,
        completed,
        conversionRate,
        avgResponseMinutes,
        thisMonth,
        lastMonth,
        monthlyGrowth,
      },
      monthlyTrend,
    })
  } catch (error) {
    logger.error('Artisan leads stats GET error:', error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}
