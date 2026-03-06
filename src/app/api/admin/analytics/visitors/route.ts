/**
 * Admin Visitor Analytics API
 * GET /api/admin/analytics/visitors?range=7d|30d|90d|all
 *
 * Returns unique visitors, page views, top pages, and session journeys.
 * Separate from the artisan-focused /api/admin/analytics endpoint.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

interface PageViewEvent {
  visitor_id: string | null
  ip_hash: string | null
  session_id: string | null
  page_path: string | null
  metadata: Record<string, string> | null
  created_at: string
}

export async function GET(request: Request) {
  try {
    const authResult = await requirePermission('settings', 'read')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    const { searchParams } = new URL(request.url)
    const ALLOWED_RANGES = ['7d', '30d', '90d', 'all'] as const
    const rangeParam = searchParams.get('range')
    const range = ALLOWED_RANGES.includes(rangeParam as typeof ALLOWED_RANGES[number])
      ? rangeParam!
      : '30d'

    // Date filter
    const now = Date.now()
    let dateFilter: string | null = null
    if (range === '7d') dateFilter = new Date(now - 7 * 86400000).toISOString()
    else if (range === '30d') dateFilter = new Date(now - 30 * 86400000).toISOString()
    else if (range === '90d') dateFilter = new Date(now - 90 * 86400000).toISOString()

    // Previous period for trend calculation
    let prevStart: string | null = null
    let prevEnd: string | null = null
    if (range === '7d') {
      prevStart = new Date(now - 14 * 86400000).toISOString()
      prevEnd = new Date(now - 7 * 86400000).toISOString()
    } else if (range === '30d') {
      prevStart = new Date(now - 60 * 86400000).toISOString()
      prevEnd = new Date(now - 30 * 86400000).toISOString()
    } else if (range === '90d') {
      prevStart = new Date(now - 180 * 86400000).toISOString()
      prevEnd = new Date(now - 90 * 86400000).toISOString()
    }

    const supabase = createAdminClient()
    const AGGREGATION_LIMIT = 50000

    // Parallel queries: current page_views, previous page_views
    const [currentResult, prevResult] = await Promise.all([
      (() => {
        let q = supabase
          .from('analytics_events')
          .select('visitor_id, ip_hash, session_id, page_path, metadata, created_at')
          .eq('event_type', 'page_view')
          .order('created_at', { ascending: true })
          .limit(AGGREGATION_LIMIT)
        if (dateFilter) q = q.gte('created_at', dateFilter)
        return q
      })(),

      prevStart && prevEnd
        ? supabase
            .from('analytics_events')
            .select('visitor_id, ip_hash')
            .eq('event_type', 'page_view')
            .gte('created_at', prevStart)
            .lt('created_at', prevEnd)
            .limit(AGGREGATION_LIMIT)
        : Promise.resolve({ data: null, error: null }),
    ])

    if (currentResult.error) {
      logger.error('Visitor analytics query error', currentResult.error)
      return NextResponse.json(
        { success: false, error: { message: 'Erreur lors du chargement' } },
        { status: 500 }
      )
    }

    const events = (currentResult.data || []) as PageViewEvent[]
    const prevEvents = (prevResult.data || []) as Array<{ visitor_id: string | null; ip_hash: string | null }>

    // ── Unique visitors ────────────────────────────────────────

    const getVisitorKey = (e: { visitor_id: string | null; ip_hash: string | null; session_id?: string | null }) =>
      e.visitor_id || e.ip_hash || e.session_id || 'anonymous'

    const allVisitors = new Set(events.map(getVisitorKey))
    const prevVisitors = new Set(prevEvents.map(getVisitorKey))
    const uniqueVisitors = allVisitors.size
    const prevUniqueVisitors = prevVisitors.size

    // ── Daily breakdown ────────────────────────────────────────

    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 60
    const dailyVisitorsMap = new Map<string, Set<string>>()
    const dailyPageViewsMap = new Map<string, number>()

    // Initialize all days
    for (let i = days - 1; i >= 0; i--) {
      const dateStr = new Date(now - i * 86400000).toISOString().split('T')[0]
      dailyVisitorsMap.set(dateStr, new Set())
      dailyPageViewsMap.set(dateStr, 0)
    }

    for (const e of events) {
      const dateStr = e.created_at.split('T')[0]
      const visitorKey = getVisitorKey(e)
      dailyVisitorsMap.get(dateStr)?.add(visitorKey)
      dailyPageViewsMap.set(dateStr, (dailyPageViewsMap.get(dateStr) || 0) + 1)
    }

    const dailyChart = Array.from(dailyVisitorsMap.entries()).map(([date, visitors]) => ({
      date,
      visitors: visitors.size,
      pageViews: dailyPageViewsMap.get(date) || 0,
    }))

    // ── Weekly breakdown ───────────────────────────────────────

    const weeklyMap = new Map<string, { visitors: Set<string>; pageViews: number }>()
    for (const e of events) {
      const d = new Date(e.created_at)
      // ISO week start (Monday)
      const day = d.getDay()
      const monday = new Date(d)
      monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
      const weekKey = monday.toISOString().split('T')[0]
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, { visitors: new Set(), pageViews: 0 })
      }
      const week = weeklyMap.get(weekKey)!
      week.visitors.add(getVisitorKey(e))
      week.pageViews++
    }

    const weeklyChart = Array.from(weeklyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({
        week,
        visitors: data.visitors.size,
        pageViews: data.pageViews,
      }))

    // ── Top pages ──────────────────────────────────────────────

    const pageMap = new Map<string, { views: number; visitors: Set<string> }>()
    for (const e of events) {
      if (!e.page_path) continue
      if (!pageMap.has(e.page_path)) {
        pageMap.set(e.page_path, { views: 0, visitors: new Set() })
      }
      const entry = pageMap.get(e.page_path)!
      entry.views++
      entry.visitors.add(getVisitorKey(e))
    }

    const topPages = Array.from(pageMap.entries())
      .map(([path, data]) => ({
        path,
        views: data.views,
        uniqueVisitors: data.visitors.size,
      }))
      .sort((a, b) => b.views - a.views)

    // ── Sessions (pages per session + avg) ─────────────────────

    const sessionMap = new Map<string, { visitorId: string; pages: Array<{ path: string; time: string; title?: string }> }>()
    for (const e of events) {
      if (!e.session_id) continue
      if (!sessionMap.has(e.session_id)) {
        sessionMap.set(e.session_id, { visitorId: getVisitorKey(e), pages: [] })
      }
      const meta = e.metadata
      sessionMap.get(e.session_id)!.pages.push({
        path: e.page_path || '/',
        time: e.created_at,
        title: meta?.title,
      })
    }

    // Average pages per session
    const sessionSizes = Array.from(sessionMap.values()).map(s => s.pages.length)
    const avgPagesPerSession = sessionSizes.length > 0
      ? Math.round((sessionSizes.reduce((a, b) => a + b, 0) / sessionSizes.length) * 10) / 10
      : 0

    // Recent multi-page sessions (most interesting journeys)
    const recentSessions = Array.from(sessionMap.entries())
      .filter(([, s]) => s.pages.length >= 2)
      .sort(([, a], [, b]) => {
        const lastA = a.pages[a.pages.length - 1].time
        const lastB = b.pages[b.pages.length - 1].time
        return lastB.localeCompare(lastA)
      })
      .map(([sessionId, s]) => ({
        sessionId: sessionId.substring(0, 16),
        visitorId: s.visitorId.substring(0, 12),
        pages: s.pages,
        startTime: s.pages[0].time,
        pageCount: s.pages.length,
      }))

    // ── Trends ─────────────────────────────────────────────────

    const calcTrend = (current: number, previous: number): number | null => {
      if (previous === 0) return current > 0 ? 100 : null
      return Math.round(((current - previous) / previous) * 100)
    }

    // If we hit exactly the limit, data may be incomplete
    const truncated = events.length >= AGGREGATION_LIMIT

    return NextResponse.json({
      success: true,
      truncated,
      totals: {
        uniqueVisitors,
        totalPageViews: events.length,
        avgPagesPerSession,
        totalSessions: sessionMap.size,
      },
      trends: {
        visitors: calcTrend(uniqueVisitors, prevUniqueVisitors),
        pageViews: calcTrend(events.length, prevEvents.length),
      },
      dailyChart,
      weeklyChart,
      topPages,
      recentSessions,
    })
  } catch (error) {
    logger.error('Admin visitor analytics error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}
