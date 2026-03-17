/**
 * GET /api/admin/system/kpis — System dashboard KPIs
 * Platform health, quality metrics, funnel, monitoring.
 */

import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Verify admin with settings:read permission (system KPIs)
    const auth = await requirePermission('settings', 'read')
    if (!auth.success || !auth.admin) return auth.error!

    const adminClient = createAdminClient()
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // --- Batch 1: All independent count queries in parallel ---
    const [
      totalLeadsRes, leadsTodayRes, leadsWeekRes, leadsMonthRes,
      totalEventsRes, eventsTodayRes,
      totalAssignmentsRes, assignPendingRes, assignViewedRes, assignQuotedRes, assignDeclinedRes,
      totalProvidersRes, activeProvidersRes,
    ] = await Promise.all([
      // legacy table name 'devis_requests' = consultation requests
      adminClient.from('devis_requests').select('id', { count: 'exact', head: true }),
      adminClient.from('devis_requests').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
      adminClient.from('devis_requests').select('id', { count: 'exact', head: true }).gte('created_at', weekStart.toISOString()),
      adminClient.from('devis_requests').select('id', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()),
      adminClient.from('lead_events').select('id', { count: 'exact', head: true }),
      adminClient.from('lead_events').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
      adminClient.from('lead_assignments').select('id', { count: 'exact', head: true }),
      adminClient.from('lead_assignments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      adminClient.from('lead_assignments').select('id', { count: 'exact', head: true }).eq('status', 'viewed'),
      adminClient.from('lead_assignments').select('id', { count: 'exact', head: true }).eq('status', 'quoted'),
      adminClient.from('lead_assignments').select('id', { count: 'exact', head: true }).eq('status', 'declined'),
      adminClient.from('attorneys').select('id', { count: 'exact', head: true }),
      adminClient.from('attorneys').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ])

    const totalLeads = totalLeadsRes.count
    const leadsToday = leadsTodayRes.count
    const leadsWeek = leadsWeekRes.count
    const leadsMonth = leadsMonthRes.count
    const totalEvents = totalEventsRes.count
    const eventsToday = eventsTodayRes.count
    const totalAssignments = totalAssignmentsRes.count
    const assignPending = assignPendingRes.count
    const assignViewed = assignViewedRes.count
    const assignQuoted = assignQuotedRes.count
    const assignDeclined = assignDeclinedRes.count
    const totalProviders = totalProvidersRes.count
    const activeProviders = activeProvidersRes.count

    // --- Daily trend (last 14 days) - compute before Batch 2 so we can use dailyTrend[0].date ---
    const dailyTrend = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(todayStart)
      d.setDate(d.getDate() - (13 - i))
      return {
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      }
    })

    // --- Batch 2: All independent data queries in parallel ---
    const [
      provWithLeadsRes, allAssignmentsRes, expiredCountRes, eventTypeCountsRes,
      recentLeadsRes, allLeadServicesRes, allLeadCitiesRes,
    ] = await Promise.all([
      adminClient.from('lead_assignments').select('attorney_id'),
      adminClient.from('lead_assignments').select('status, assigned_at, viewed_at'),
      adminClient.from('lead_events').select('id', { count: 'exact', head: true }).eq('event_type', 'expired'),
      adminClient.from('lead_events').select('event_type'),
      adminClient.from('devis_requests').select('created_at').gte('created_at', dailyTrend[0].date), // legacy table name 'devis_requests' = consultation requests
      adminClient.from('devis_requests').select('service_name'),
      adminClient.from('devis_requests').select('city'),
    ])

    // --- Providers with leads ---
    const uniqueProvWithLeads = new Set((provWithLeadsRes.data || []).map((p) => p.attorney_id)).size

    // --- Quality ---
    const allA = allAssignmentsRes.data || []
    const responseTimes = allA
      .filter((a) => a.viewed_at)
      .map((a) => (new Date(a.viewed_at!).getTime() - new Date(a.assigned_at).getTime()) / 60000)
    const avgResponseMinutes = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length)
      : 0

    const totalA = allA.length || 1
    const conversionRate = Math.round(((assignQuoted || 0) / totalA) * 100)
    const declineRate = Math.round(((assignDeclined || 0) / totalA) * 100)

    const expiredCount = expiredCountRes.count
    const expiredRate = (totalLeads || 0) > 0
      ? Math.round(((expiredCount || 0) / (totalLeads || 1)) * 100)
      : 0

    // --- Funnel ---
    const etCounts: Record<string, number> = {}
    for (const e of eventTypeCountsRes.data || []) {
      etCounts[e.event_type] = (etCounts[e.event_type] || 0) + 1
    }

    const funnelStages = ['created', 'dispatched', 'viewed', 'quoted', 'accepted', 'completed']
    const totalBase = etCounts['created'] || totalLeads || 1
    const funnel = funnelStages.map((stage) => ({
      stage,
      count: etCounts[stage] || 0,
      rate: Math.round(((etCounts[stage] || 0) / totalBase) * 100),
    }))

    // --- Daily trend data ---
    const leadsByDay: Record<string, number> = {}
    for (const l of recentLeadsRes.data || []) {
      const day = new Date(l.created_at).toISOString().split('T')[0]
      leadsByDay[day] = (leadsByDay[day] || 0) + 1
    }

    const dailyLeads = dailyTrend.map((d) => ({
      ...d,
      count: leadsByDay[d.date] || 0,
    }))

    // --- Top services ---
    const specialtyCounts: Record<string, number> = {}
    for (const l of allLeadServicesRes.data || []) {
      if (l.service_name) {
        specialtyCounts[l.service_name] = (specialtyCounts[l.service_name] || 0) + 1
      }
    }

    const topServices = Object.entries(specialtyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([service, count]) => ({ service, count }))

    // --- Top cities ---
    const cityCounts: Record<string, number> = {}
    for (const l of allLeadCitiesRes.data || []) {
      if (l.city) {
        cityCounts[l.city] = (cityCounts[l.city] || 0) + 1
      }
    }

    const topCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }))

    return NextResponse.json({
      leads: {
        total: totalLeads || 0,
        today: leadsToday || 0,
        thisWeek: leadsWeek || 0,
        thisMonth: leadsMonth || 0,
      },
      events: {
        total: totalEvents || 0,
        today: eventsToday || 0,
      },
      assignments: {
        total: totalAssignments || 0,
        pending: assignPending || 0,
        viewed: assignViewed || 0,
        quoted: assignQuoted || 0,
        declined: assignDeclined || 0,
      },
      providers: {
        total: totalProviders || 0,
        active: activeProviders || 0,
        withLeads: uniqueProvWithLeads,
      },
      quality: {
        avgResponseMinutes,
        conversionRate,
        declineRate,
        expiredRate,
      },
      funnel,
      dailyLeads,
      topServices,
      topCities,
    })
  } catch (error) {
    logger.error('System KPIs GET error', error)
    return NextResponse.json({
      leads: { total: 0, today: 0, thisWeek: 0, thisMonth: 0 },
      events: { total: 0, today: 0 },
      assignments: { total: 0, pending: 0, viewed: 0, quoted: 0, declined: 0 },
      providers: { total: 0, active: 0, withLeads: 0 },
      quality: { avgResponseMinutes: 0, conversionRate: 0, declineRate: 0, expiredRate: 0 },
      funnel: [],
      dailyLeads: [],
      topServices: [],
      topCities: [],
    })
  }
}
