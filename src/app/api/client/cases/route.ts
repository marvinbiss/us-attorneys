/**
 * Client Cases API
 * GET: List client's cases from bookings + lead_assignments with attorney info, status, last activity
 */

import { createClient } from '@/lib/supabase/server'
import { createApiHandler, apiSuccess, apiError } from '@/lib/api/handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { withTimeout } from '@/lib/api/timeout'
import { z } from 'zod'

const casesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  status: z.string().max(50).default('all'),
})

export const dynamic = 'force-dynamic'

export type CaseStatus = 'pending' | 'active' | 'in_progress' | 'resolved' | 'completed' | 'cancelled'

const STATUS_LABELS: Record<CaseStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

interface CaseItem {
  id: string
  type: 'lead' | 'booking'
  attorney_name: string | null
  attorney_id: string | null
  attorney_slug: string | null
  practice_area: string | null
  status: CaseStatus
  status_label: string
  description: string
  city: string | null
  created_at: string
  last_activity: string
  next_deadline: string | null
  event_count: number
}

function deriveLeadCaseStatus(events: Array<{ event_type: string }>): CaseStatus {
  if (events.length === 0) return 'pending'
  const types = new Set(events.map(e => e.event_type))
  if (types.has('completed')) return 'completed'
  if (types.has('accepted')) return 'in_progress'
  if (types.has('quoted')) return 'active'
  if (types.has('dispatched') || types.has('viewed')) return 'active'
  if (types.has('expired') || types.has('refused')) return 'cancelled'
  return 'pending'
}

function deriveBookingCaseStatus(bookingStatus: string): CaseStatus {
  switch (bookingStatus) {
    case 'confirmed': return 'active'
    case 'completed': return 'completed'
    case 'cancelled': return 'cancelled'
    case 'no_show': return 'cancelled'
    default: return 'pending'
  }
}

export const GET = createApiHandler(async ({ request, user }) => {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const url = new URL(request.url)
  const parsed = casesQuerySchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    pageSize: url.searchParams.get('pageSize') ?? undefined,
    status: url.searchParams.get('status') ?? undefined,
  })

  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400)
  }

  const { page, pageSize, status: statusFilter } = parsed.data
  const cases: CaseItem[] = []

  // 1. Fetch leads (devis_requests) for this client
  try {
    const { data: leads, error: leadsError } = await withTimeout(
      supabase
        .from('devis_requests')
        .select('id, service_name, city, postal_code, description, urgency, created_at')
        .eq('client_id', user!.id)
        .order('created_at', { ascending: false })
    )

    if (leadsError) {
      logger.error('Client cases: leads fetch error', leadsError)
    }

    if (leads && leads.length > 0) {
      const leadIds = leads.map(l => l.id)

      // Fetch events for all leads
      const { data: allEvents } = await withTimeout(
        adminClient
          .from('lead_events')
          .select('lead_id, event_type, created_at, metadata')
          .in('lead_id', leadIds)
          .order('created_at', { ascending: false })
      )

      // Fetch lead_assignments to get attorney info
      const { data: assignments } = await withTimeout(
        adminClient
          .from('lead_assignments')
          .select('lead_id, attorney_id, status, assigned_at')
          .in('lead_id', leadIds)
      )

      // Get attorney details for assigned leads
      const attorneyIds = Array.from(new Set((assignments || []).map(a => a.attorney_id).filter(Boolean)))
      let attorneyMap: Record<string, { name: string; slug: string; specialty_name: string | null }> = {}

      if (attorneyIds.length > 0) {
        const { data: attorneys } = await withTimeout(
          adminClient
            .from('attorneys')
            .select('id, name, slug, primary_specialty_id')
            .in('id', attorneyIds)
        )

        if (attorneys) {
          const specialtyIds = attorneys.map(a => a.primary_specialty_id).filter(Boolean)
          let specialtyMap: Record<string, string> = {}

          if (specialtyIds.length > 0) {
            const { data: specialties } = await withTimeout(
              adminClient
                .from('specialties')
                .select('id, name')
                .in('id', specialtyIds)
            )
            if (specialties) {
              specialtyMap = Object.fromEntries(specialties.map(s => [s.id, s.name]))
            }
          }

          attorneyMap = Object.fromEntries(
            attorneys.map(a => [
              a.id,
              {
                name: a.name,
                slug: a.slug,
                specialty_name: a.primary_specialty_id ? specialtyMap[a.primary_specialty_id] || null : null,
              },
            ])
          )
        }
      }

      // Group events by lead
      const eventsByLead: Record<string, Array<{ event_type: string; created_at: string }>> = {}
      for (const event of allEvents || []) {
        if (!eventsByLead[event.lead_id]) eventsByLead[event.lead_id] = []
        eventsByLead[event.lead_id].push(event)
      }

      // Map assignments by lead
      const assignmentsByLead: Record<string, { lead_id: string; attorney_id: string; status: string; assigned_at: string }> = {}
      for (const assignment of assignments || []) {
        // Keep the most relevant assignment (quoted > viewed > pending)
        const existing = assignmentsByLead[assignment.lead_id]
        if (!existing || assignment.status === 'quoted' || (assignment.status === 'viewed' && existing.status === 'pending')) {
          assignmentsByLead[assignment.lead_id] = assignment
        }
      }

      for (const lead of leads) {
        const events = eventsByLead[lead.id] || []
        const status = deriveLeadCaseStatus(events)
        const assignment = assignmentsByLead[lead.id]
        const attorney = assignment ? attorneyMap[assignment.attorney_id] : undefined

        cases.push({
          id: lead.id,
          type: 'lead',
          attorney_name: attorney?.name || null,
          attorney_id: assignment?.attorney_id || null,
          attorney_slug: attorney?.slug || null,
          practice_area: attorney?.specialty_name || lead.service_name,
          status,
          status_label: STATUS_LABELS[status],
          description: lead.description,
          city: lead.city,
          created_at: lead.created_at,
          last_activity: events.length > 0 ? events[0].created_at : lead.created_at,
          next_deadline: null,
          event_count: events.length,
        })
      }
    }
  } catch (err) {
    logger.error('Client cases: leads processing error', err as Error)
  }

  // 2. Fetch bookings for this client
  try {
    const { data: bookings, error: bookingsError } = await withTimeout(
      adminClient
        .from('bookings')
        .select('id, attorney_id, specialty_id, scheduled_at, status, notes, created_at, duration_minutes')
        .eq('client_id', user!.id)
        .order('created_at', { ascending: false })
    )

    if (bookingsError) {
      logger.error('Client cases: bookings fetch error', bookingsError)
    }

    if (bookings && bookings.length > 0) {
      const bookingAttorneyIds = Array.from(new Set(bookings.map(b => b.attorney_id).filter(Boolean)))
      let bookingAttorneyMap: Record<string, { name: string; slug: string }> = {}

      if (bookingAttorneyIds.length > 0) {
        const { data: attorneys } = await withTimeout(
          adminClient
            .from('attorneys')
            .select('id, name, slug')
            .in('id', bookingAttorneyIds)
        )
        if (attorneys) {
          bookingAttorneyMap = Object.fromEntries(attorneys.map(a => [a.id, { name: a.name, slug: a.slug }]))
        }
      }

      // Get specialty names
      const specIds = Array.from(new Set(bookings.map(b => b.specialty_id).filter(Boolean)))
      let specMap: Record<string, string> = {}
      if (specIds.length > 0) {
        const { data: specs } = await withTimeout(
          adminClient.from('specialties').select('id, name').in('id', specIds)
        )
        if (specs) specMap = Object.fromEntries(specs.map(s => [s.id, s.name]))
      }

      for (const booking of bookings) {
        const attorney = booking.attorney_id ? bookingAttorneyMap[booking.attorney_id] : undefined
        const status = deriveBookingCaseStatus(booking.status)

        cases.push({
          id: booking.id,
          type: 'booking',
          attorney_name: attorney?.name || null,
          attorney_id: booking.attorney_id || null,
          attorney_slug: attorney?.slug || null,
          practice_area: booking.specialty_id ? specMap[booking.specialty_id] || 'Consultation' : 'Video Consultation',
          status,
          status_label: STATUS_LABELS[status],
          description: booking.notes || 'Video consultation',
          city: null,
          created_at: booking.created_at,
          last_activity: booking.scheduled_at || booking.created_at,
          next_deadline: booking.status === 'confirmed' ? booking.scheduled_at : null,
          event_count: 0,
        })
      }
    }
  } catch (err) {
    logger.error('Client cases: bookings processing error', err as Error)
  }

  // Sort all cases by last_activity desc
  cases.sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime())

  // Filter by status
  const filtered = statusFilter === 'all'
    ? cases
    : cases.filter(c => c.status === statusFilter)

  // Stats (before filtering)
  const stats = {
    total: cases.length,
    active: cases.filter(c => c.status === 'active' || c.status === 'in_progress').length,
    pending: cases.filter(c => c.status === 'pending').length,
    completed: cases.filter(c => c.status === 'completed' || c.status === 'resolved').length,
    cancelled: cases.filter(c => c.status === 'cancelled').length,
  }

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return apiSuccess({
    cases: paginated,
    stats,
    pagination: { page, pageSize, totalPages, totalItems: filtered.length },
  })
}, { requireAuth: true })
