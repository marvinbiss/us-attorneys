/**
 * Admin Analytics API — World-class analytics endpoint
 * GET /api/admin/analytics?range=7d|30d|90d|all&search=...&feedPage=1
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { createApiHandler } from '@/lib/api/handler'

export const dynamic = 'force-dynamic'

const FEED_PER_PAGE = 50
const BATCH_SIZE = 1000 // Supabase PostgREST max-rows default

/**
 * Fetch all rows from a query by paginating in batches of BATCH_SIZE.
 * Supabase caps each request at 1000 rows (PostgREST max-rows).
 */
async function fetchAllBatched<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const all: T[] = []
  let offset = 0
  while (true) {
    const { data, error } = await buildQuery(offset, offset + BATCH_SIZE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < BATCH_SIZE) break // last page
    offset += BATCH_SIZE
  }
  return all
}

export const GET = createApiHandler(async ({ request }) => {
  const authResult = await requirePermission('settings', 'read')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || '30d'
  const search = searchParams.get('search')?.trim().toLowerCase() || ''
  const feedPage = Math.max(1, parseInt(searchParams.get('feedPage') || '1', 10) || 1)

  // Date filter
  let dateFilter: string | null = null
  const now = Date.now()
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

  // Fetch all events by paginating in batches (Supabase caps at 1000 rows per request)
  const feedOffset = (feedPage - 1) * FEED_PER_PAGE

  const [events, prevEvents, recentResult, countResult] = await Promise.all([
    // Current period events with provider info (exclude page_view)
    fetchAllBatched((from, to) => {
      let q = supabase
        .from('analytics_events')
        .select('attorney_id, event_type, created_at, source, attorneys!inner(name, address_city, slug, stable_id, primary_specialty_id)')
        .neq('event_type', 'page_view')
        .order('created_at', { ascending: false })
        .range(from, to)
      if (dateFilter) q = q.gte('created_at', dateFilter)
      return q
    }),

    // Previous period for trends (exclude page_view)
    prevStart && prevEnd
      ? fetchAllBatched((from, to) =>
          supabase
            .from('analytics_events')
            .select('event_type')
            .neq('event_type', 'page_view')
            .gte('created_at', prevStart!)
            .lt('created_at', prevEnd!)
            .range(from, to)
        )
      : Promise.resolve([]),

    // Paginated activity feed (exclude page_view)
    (() => {
      let q = supabase
        .from('analytics_events')
        .select('id, attorney_id, event_type, source, created_at, metadata, attorneys!inner(name, address_city, slug, stable_id, primary_specialty_id)')
        .neq('event_type', 'page_view')
        .order('created_at', { ascending: false })
        .range(feedOffset, feedOffset + FEED_PER_PAGE - 1)
      if (dateFilter) q = q.gte('created_at', dateFilter)
      return q
    })(),

    // Total count of events for feed pagination
    (() => {
      let q = supabase
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .neq('event_type', 'page_view')
      if (dateFilter) q = q.gte('created_at', dateFilter)
      return q
    })(),
  ])

  // Current totals
  const totals = {
    views: events.filter(e => e.event_type === 'attorney_profile_view').length,
    reveals: events.filter(e => e.event_type === 'phone_reveal').length,
    clicks: events.filter(e => e.event_type === 'phone_click').length,
  }

  // Previous totals for trends
  const prevTotals = {
    views: prevEvents.filter(e => e.event_type === 'attorney_profile_view').length,
    reveals: prevEvents.filter(e => e.event_type === 'phone_reveal').length,
    clicks: prevEvents.filter(e => e.event_type === 'phone_click').length,
  }

  const calcTrend = (current: number, previous: number): number | null => {
    if (previous === 0) return current > 0 ? 100 : null
    return Math.round(((current - previous) / previous) * 100)
  }

  const trends = {
    views: calcTrend(totals.views, prevTotals.views),
    reveals: calcTrend(totals.reveals, prevTotals.reveals),
    clicks: calcTrend(totals.clicks, prevTotals.clicks),
  }

  // Daily chart data (last N days)
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 60
  const chartData: { date: string; views: number; reveals: number; clicks: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000)
    const dateStr = d.toISOString().split('T')[0]
    chartData.push({
      date: dateStr,
      views: events.filter(e => e.event_type === 'attorney_profile_view' && e.created_at.startsWith(dateStr)).length,
      reveals: events.filter(e => e.event_type === 'phone_reveal' && e.created_at.startsWith(dateStr)).length,
      clicks: events.filter(e => e.event_type === 'phone_click' && e.created_at.startsWith(dateStr)).length,
    })
  }

  // Per-provider aggregation
  type ProviderInfo = { name: string; address_city: string; slug: string; stable_id: string; specialty: string }
  const providerMap = new Map<string, {
    id: string
    name: string
    city: string
    specialty: string
    slug: string
    stableId: string
    views: number
    reveals: number
    clicks: number
    lastActivity: string
  }>()

  for (const event of events) {
    if (!event.attorney_id) continue

    if (!providerMap.has(event.attorney_id)) {
      // Supabase embedded join: attorneys resolves to single object at runtime
      const p = (Array.isArray((event as Record<string, unknown>).attorneys)
        ? ((event as Record<string, unknown>).attorneys as ProviderInfo[])[0]
        : (event as Record<string, unknown>).attorneys) as ProviderInfo | undefined
      providerMap.set(event.attorney_id, {
        id: event.attorney_id,
        name: p?.name || 'Unknown',
        city: p?.address_city || '',
        specialty: p?.specialty || '',
        slug: p?.slug || '',
        stableId: p?.stable_id || '',
        views: 0,
        reveals: 0,
        clicks: 0,
        lastActivity: event.created_at,
      })
    }

    const entry = providerMap.get(event.attorney_id)!
    if (event.event_type === 'attorney_profile_view') entry.views++
    else if (event.event_type === 'phone_reveal') entry.reveals++
    else if (event.event_type === 'phone_click') entry.clicks++

    if (event.created_at > entry.lastActivity) {
      entry.lastActivity = event.created_at
    }
  }

  let providers = Array.from(providerMap.values())
    .sort((a, b) => (b.views + b.reveals + b.clicks) - (a.views + a.reveals + a.clicks))

  // Search filter
  if (search) {
    providers = providers.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.city.toLowerCase().includes(search) ||
      p.specialty.toLowerCase().includes(search)
    )
  }

  // Recent activity feed
  const recentEvents = (recentResult.data || []).map(e => {
    // Supabase embedded join: attorneys resolves to single object at runtime
    const p = (Array.isArray((e as Record<string, unknown>).attorneys)
      ? ((e as Record<string, unknown>).attorneys as ProviderInfo[])[0]
      : (e as Record<string, unknown>).attorneys) as ProviderInfo | undefined
    const meta = e.metadata as Record<string, string> | null
    return {
      id: e.id,
      type: e.event_type,
      source: e.source,
      date: e.created_at,
      attorneyName: p?.name || 'Unknown',
      providerCity: p?.address_city || '',
      attorneySlug: p?.slug || '',
      providerStableId: p?.stable_id || '',
      providerSpecialty: p?.specialty || '',
      url: meta?.url || '',
    }
  })

  return NextResponse.json({
    success: true,
    totals,
    trends,
    chartData,
    providers,
    recentEvents,
    eventTotal: countResult.count || 0,
    feedPage,
    feedPerPage: FEED_PER_PAGE,
  })
})
