/**
 * Client Leads API — read-only
 * GET: Fetch client's consultation requests (devis_requests) with status derived from lead_events
 * Table 'devis_requests' = consultation requests (legacy French name)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiHandler } from '@/lib/api/handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { withTimeout } from '@/lib/api/timeout'
import { z } from 'zod'

const clientLeadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  status: z.string().max(50).default('all'),
})

export const dynamic = 'force-dynamic'

type DerivedStatus = 'pending' | 'in_progress' | 'quotes_received' | 'accepted' | 'completed' | 'expired' | 'declined'

function deriveStatus(events: Array<{ event_type: string }>): DerivedStatus {
  if (events.length === 0) return 'pending'

  // Check for terminal states first (scan all events)
  const types = new Set(events.map(e => e.event_type))
  if (types.has('completed')) return 'completed'
  if (types.has('expired')) return 'expired'
  if (types.has('accepted')) return 'accepted'
  if (types.has('refused')) return 'declined'
  if (types.has('quoted')) return 'quotes_received'
  if (types.has('dispatched') || types.has('viewed') || types.has('declined') || types.has('reassigned')) return 'in_progress'
  return 'pending'
}

const STATUS_LABELS: Record<DerivedStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  quotes_received: 'Consultation(s) received',
  accepted: 'Accepted',
  completed: 'Completed',
  expired: 'Expired',
  declined: 'Declined',
}

export const GET = createApiHandler(async ({ request, user }) => {
  const supabase = await createClient()

  // Parse and validate pagination from query params
  const url = new URL(request.url)
  const parsed = clientLeadsQuerySchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    pageSize: url.searchParams.get('pageSize') ?? undefined,
    status: url.searchParams.get('status') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { message: 'Invalid data' } }, { status: 400 })
  }

  const { page, pageSize } = parsed.data
  const statusFilter = parsed.data.status

  // Fetch all consultation requests for this client
  // Table 'devis_requests' = consultation requests (legacy French name)
  const { data: clientRequests, error: clientRequestsError } = await withTimeout(
    supabase
      .from('devis_requests')
      .select('id, service_name, city, postal_code, description, budget, urgency, status, client_name, created_at')
      .eq('client_id', user!.id)
      .order('created_at', { ascending: false })
  )

  if (clientRequestsError) {
    logger.error('Client leads fetch error:', clientRequestsError)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }

  if (!clientRequests || clientRequests.length === 0) {
    return NextResponse.json({
      leads: [],
      stats: { total: 0, pending: 0, in_progress: 0, quotes_received: 0, completed: 0 },
      pagination: { page: 1, pageSize, totalPages: 0, totalItems: 0 },
    })
  }

  // Fetch lead_events for all of this client's leads (admin client — RLS is admin-only)
  const adminClient = createAdminClient()
  const leadIds = clientRequests.map(d => d.id)
  const { data: allEvents, error: eventsError } = await withTimeout(
    adminClient
      .from('lead_events')
      .select('lead_id, event_type, created_at')
      .in('lead_id', leadIds)
      .order('created_at', { ascending: false })
  )

  if (eventsError) {
    logger.error('Client lead_events fetch error:', eventsError)
    // Non-blocking: fall back to consultation request status
  }

  // Group events by lead_id
  const eventsByLead: Record<string, Array<{ event_type: string; created_at: string }>> = {}
  for (const event of allEvents || []) {
    if (!eventsByLead[event.lead_id]) eventsByLead[event.lead_id] = []
    eventsByLead[event.lead_id].push(event)
  }

  // Build enriched leads with derived status + last activity
  const enrichedLeads = clientRequests.map(d => {
    const events = eventsByLead[d.id] || []
    const derivedStatus = deriveStatus(events)
    const lastActivity = events.length > 0 ? events[0].created_at : d.created_at

    return {
      id: d.id,
      service_name: d.service_name,
      city: d.city,
      postal_code: d.postal_code,
      description: d.description,
      budget: d.budget,
      urgency: d.urgency,
      created_at: d.created_at,
      derived_status: derivedStatus,
      derived_status_label: STATUS_LABELS[derivedStatus],
      last_activity: lastActivity,
      event_count: events.length,
    }
  })

  // Sort by last activity (most recent first)
  enrichedLeads.sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime())

  // Filter by derived status if requested
  const filtered = statusFilter === 'all'
    ? enrichedLeads
    : enrichedLeads.filter(l => l.derived_status === statusFilter)

  // Stats (before filtering)
  const stats = {
    total: enrichedLeads.length,
    pending: enrichedLeads.filter(l => l.derived_status === 'pending').length,
    in_progress: enrichedLeads.filter(l => l.derived_status === 'in_progress').length,
    quotes_received: enrichedLeads.filter(l => l.derived_status === 'quotes_received').length,
    completed: enrichedLeads.filter(l => l.derived_status === 'completed' || l.derived_status === 'accepted').length,
  }

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return NextResponse.json({
    leads: paginated,
    stats,
    pagination: { page, pageSize, totalPages, totalItems: filtered.length },
  })
}, { requireAuth: true })
