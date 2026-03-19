/**
 * Client Lead Detail API — read-only
 * GET: Fetch singthe consultation_request with quotes + event timeline + stats
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiHandler } from '@/lib/api/handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const CLIENT_SAFE_EVENT_LABELS: Record<string, string> = {
  created: 'Request created',
  dispatched: 'Attorneys contacted',
  viewed: 'Attorney interested',
  quoted: 'Consultation received',
  declined: 'Attorney unavailable',
  accepted: 'Consultation accepted',
  refused: 'Consultation declined',
  completed: 'Case completed',
  expired: 'Request expired',
  reassigned: 'New attorney contacted',
}

export const GET = createApiHandler(
  async ({ user, params }) => {
    const id = params?.id
    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing lead ID' } },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch the consultation request — RLS ensures client_id = auth.uid()

    const { data: lead, error: leadError } = await supabase
      .from('quote_requests')
      .select(
        'id, service_name, city, postal_code, description, budget, urgency, status, client_name, client_email, client_phone, created_at'
      )
      .eq('id', id)
      .eq('client_id', user?.id ?? '')
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { success: false, error: { message: 'Request not found' } },
        { status: 404 }
      )
    }

    // Use admin client for tables restricted by RLS to providers only
    const adminClient = createAdminClient()

    // Fetch quotes for this lead — join provider info
    const { data: quotesRaw, error: quotesError } = await adminClient
      .from('quotes')
      .select(
        `
      id,
      amount,
      description,
      valid_until,
      status,
      created_at,
      attorney_id,
      attorney:attorneys!attorney_id(id, name, primary_specialty_id, address_city, rating_average)
    `
      )
      .eq('request_id', id)
      .order('created_at', { ascending: true })

    if (quotesError) {
      logger.error('Client lead detail quotes error:', quotesError)
    }

    // Fetch events for this lead (admin client — RLS is admin-only on lead_events)
    const { data: events, error: eventsError } = await adminClient
      .from('lead_events')
      .select('id, event_type, metadata, created_at')
      .eq('lead_id', id)
      .order('created_at', { ascending: true })

    if (eventsError) {
      logger.error('Client lead detail events error:', eventsError)
    }

    // Fetch lead_assignments stats — how many attorneys have seen this lead
    const { data: assignments, error: assignmentsError } = await adminClient
      .from('lead_assignments')
      .select('id, status')
      .eq('lead_id', id)

    if (assignmentsError) {
      logger.error('Client lead detail assignments error:', assignmentsError)
    }

    // Sanitize events for client view:
    // - Use client-friendly labels
    // - Strip attorney_id, actor_id
    // - Expose only safe metadata (amounts, no internal IDs)
    const clientEvents = (events || []).map((e) => ({
      id: e.id,
      event_type: e.event_type,
      label: CLIENT_SAFE_EVENT_LABELS[e.event_type] || e.event_type,
      metadata: sanitizeMetadata(e.event_type, e.metadata),
      created_at: e.created_at,
    }))

    // Build quotes list — strip attorney_id from client response
    const quotes = (quotesRaw || []).map((q) => {
      // Supabase returns the join as an array or object depending on FK cardinality
      const providerRaw = Array.isArray(q.attorney) ? q.attorney[0] : q.attorney
      return {
        id: q.id,
        amount: q.amount,
        description: q.description,
        valid_until: q.valid_until,
        status: q.status,
        created_at: q.created_at,
        provider: providerRaw
          ? {
              name: providerRaw.name as string,
              specialty: providerRaw.primary_specialty_id as string | null,
              city: providerRaw.address_city as string | null,
              rating_average: providerRaw.rating_average as number | null,
            }
          : null,
      }
    })

    const allAssignments = assignments || []
    const attorneysViewed = allAssignments.filter((a) =>
      ['viewed', 'quoted', 'declined'].includes(a.status)
    ).length

    const stats = {
      attorneys_notified: allAssignments.length,
      attorneys_viewed: attorneysViewed,
      quotes_count: quotes.length,
    }

    // Legacy field kept for backward compatibility with existing page
    const quotesCount = quotes.length

    return NextResponse.json({
      lead,
      quotes,
      events: clientEvents,
      stats,
      quotesCount,
    })
  },
  { requireAuth: true }
)

function sanitizeMetadata(
  eventType: string,
  metadata: Record<string, unknown>
): Record<string, unknown> {
  // Only expose client-safe metadata
  if (eventType === 'quoted' && metadata.amount) {
    return { amount: metadata.amount }
  }
  if (eventType === 'declined' && metadata.reason) {
    return { reason: metadata.reason }
  }
  return {}
}
