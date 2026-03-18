/**
 * Attorney Assigned Leads API
 * GET:   Fetch leads assigned to the authenticated attorney via lead_assignments
 * PATCH: Update lead status (quick actions from pipeline view)
 *
 * Subscription-tier access control:
 *   - Free:    see first 5 leads fully, blurred contact info for rest
 *   - Pro:     full access, 200 leads/month
 *   - Premium: full access, 500 leads/month
 */

import { NextRequest } from 'next/server'
import { requireAttorney } from '@/lib/auth/attorney-guard'
import { apiSuccess, apiError } from '@/lib/api/handler'
import { logger } from '@/lib/logger'
import { withTimeout, isTimeoutError } from '@/lib/api/timeout'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

// ─── Subscription tier config ───────────────────────────────────────────────

const TIER_LIMITS: Record<string, { monthlyLeads: number; fullAccess: boolean }> = {
  free: { monthlyLeads: 50, fullAccess: false },
  pro: { monthlyLeads: 200, fullAccess: true },
  premium: { monthlyLeads: 500, fullAccess: true },
}

const FREE_VISIBLE_LEADS = 5

// ─── Validation schemas ─────────────────────────────────────────────────────

const leadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  status: z.string().max(50).default('all'),
  practiceArea: z.string().max(200).optional(),
  priority: z.string().max(50).optional(),
  dateFrom: z.string().max(30).optional(),
  dateTo: z.string().max(30).optional(),
  sortBy: z.enum(['newest', 'priority', 'response_deadline']).default('newest'),
  search: z.string().max(200).optional(),
})

const patchSchema = z.object({
  assignmentId: z.string().uuid(),
  status: z.enum(['pending', 'viewed', 'quoted', 'declined', 'accepted', 'won', 'lost']),
  note: z.string().max(1000).optional(),
})

export const dynamic = 'force-dynamic'

// ─── GET: Fetch leads with filters & tier-based access ──────────────────────

export async function GET(request: NextRequest) {
  try {
    const { error: guardError, user, supabase } = await requireAttorney()
    if (guardError) return guardError

    // Get provider linked to this user
    const { data: provider } = await withTimeout(
      supabase
        .from('attorneys')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()
    )

    if (!provider) {
      return apiError('AUTHORIZATION_ERROR', 'No attorney profile found', 403)
    }

    // Parse and validate query params
    const { searchParams } = request.nextUrl
    const parsed = leadsQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      practiceArea: searchParams.get('practiceArea') ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    })

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid data', 400)
    }

    const { page, pageSize, status, practiceArea, priority, dateFrom, dateTo, sortBy, search } = parsed.data
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Count query (head: true returns only count, no rows)
    let countQuery = supabase
      .from('lead_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('attorney_id', provider.id)

    if (status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }
    if (dateFrom) {
      countQuery = countQuery.gte('assigned_at', dateFrom)
    }
    if (dateTo) {
      countQuery = countQuery.lte('assigned_at', dateTo)
    }

    const { count, error: countError } = await withTimeout(countQuery)

    if (countError) {
      logger.error('Error counting leads:', countError)
      return apiError('DATABASE_ERROR', 'Error counting leads', 500)
    }

    const totalItems = count ?? 0
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

    // Data query with pagination
    // Table 'devis_requests' = consultation requests (legacy French name)
    let dataQuery = supabase
      .from('lead_assignments')
      .select(`
        id,
        status,
        score,
        assigned_at,
        viewed_at,
        responded_at,
        lead:devis_requests (
          id,
          service_name,
          city,
          postal_code,
          description,
          urgency,
          client_name,
          client_phone,
          client_email,
          created_at,
          status
        )
      `)
      .eq('attorney_id', provider.id)

    if (status !== 'all') {
      dataQuery = dataQuery.eq('status', status)
    }
    if (dateFrom) {
      dataQuery = dataQuery.gte('assigned_at', dateFrom)
    }
    if (dateTo) {
      dataQuery = dataQuery.lte('assigned_at', dateTo)
    }

    // Sort order
    switch (sortBy) {
      case 'priority':
        dataQuery = dataQuery.order('score', { ascending: false, nullsFirst: false })
        break
      case 'response_deadline':
        dataQuery = dataQuery.order('assigned_at', { ascending: true })
        break
      case 'newest':
      default:
        dataQuery = dataQuery.order('assigned_at', { ascending: false })
        break
    }

    dataQuery = dataQuery.range(from, to)

    const { data: assignments, error: assignError } = await withTimeout(dataQuery)

    if (assignError) {
      logger.error('Error fetching assigned leads:', assignError)
      return apiError('DATABASE_ERROR', 'Error retrieving leads', 500)
    }

    // Post-fetch filtering for nested lead fields
    let leadList = assignments || []

    // Supabase embedded join: `lead` (devis_requests FK) resolves to a single object at runtime
    type LeadJoin = { id: string; service_name?: string; urgency?: string; client_name?: string; city?: string; postal_code?: string }
    const unwrapLead = (lead: unknown): LeadJoin | null =>
      Array.isArray(lead) ? (lead[0] ?? null) : (lead as LeadJoin | null)

    if (practiceArea) {
      const pa = practiceArea.toLowerCase()
      leadList = leadList.filter((a) => {
        const lead = unwrapLead(a.lead)
        return lead && (lead.service_name || '').toLowerCase().includes(pa)
      })
    }

    if (priority) {
      leadList = leadList.filter((a) => {
        const lead = unwrapLead(a.lead)
        return lead && lead.urgency === priority
      })
    }

    if (search) {
      const q = search.toLowerCase()
      leadList = leadList.filter((a) => {
        const lead = unwrapLead(a.lead)
        if (!lead) return false
        return (
          (lead.service_name || '').toLowerCase().includes(q) ||
          (lead.client_name || '').toLowerCase().includes(q) ||
          (lead.city || '').toLowerCase().includes(q) ||
          (lead.postal_code || '').includes(q)
        )
      })
    }

    // Fetch quotes for these leads so attorney can see sent quote info
    const requestIds = leadList
      .filter((a) => a.lead && a.status === 'quoted')
      .map((a) => unwrapLead(a.lead)!.id)

    const quotesMap: Record<string, { id: string; amount: number; description: string; valid_until: string; status: string; created_at: string }> = {}
    if (requestIds.length > 0) {
      const { data: quotes } = await supabase
        .from('quotes')
        .select('id, request_id, amount, description, valid_until, status, created_at')
        .eq('attorney_id', provider.id)
        .in('request_id', requestIds)

      if (quotes) {
        for (const q of quotes) {
          quotesMap[q.request_id] = {
            id: q.id,
            amount: q.amount,
            description: q.description,
            valid_until: q.valid_until,
            status: q.status,
            created_at: q.created_at,
          }
        }
      }
    }

    // Get subscription tier
    const adminClient = createAdminClient()
    const { data: subscription } = await adminClient
      .from('subscriptions')
      .select('plan')
      .eq('attorney_id', provider.id)
      .eq('status', 'active')
      .single()

    const plan = (subscription?.plan as string) || 'free'
    const tierConfig = TIER_LIMITS[plan] || TIER_LIMITS.free

    // Count leads this month for usage meter
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { count: monthlyCount } = await supabase
      .from('lead_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('attorney_id', provider.id)
      .gte('assigned_at', monthStart)

    // Attach quote data + apply tier-based blur
    const enrichedLeads = leadList.map((a, index) => {
      const lead = unwrapLead(a.lead)
      const requestId = lead ? lead.id : null
      const quote = requestId ? quotesMap[requestId] ?? null : null

      // Free tier: blur contact info after first N leads
      if (!tierConfig.fullAccess && index >= FREE_VISIBLE_LEADS && a.lead) {
        const blurredLead = typeof a.lead === 'object' && a.lead !== null
          ? { ...(a.lead as unknown as Record<string, unknown>), client_phone: '***-***-****', client_email: null, _blurred: true }
          : a.lead
        return { ...a, lead: blurredLead, quote }
      }

      return { ...a, quote }
    })

    return apiSuccess({
      leads: enrichedLeads,
      count: totalItems,
      pagination: {
        page,
        pageSize,
        totalPages,
        totalItems,
      },
      meta: {
        plan,
        monthlyUsed: monthlyCount ?? 0,
        monthlyLimit: tierConfig.monthlyLeads,
        fullAccess: tierConfig.fullAccess,
      },
    })
  } catch (error: unknown) {
    if (isTimeoutError(error)) {
      logger.error('Attorney leads GET timeout:', error)
      return apiError('GATEWAY_TIMEOUT', 'The request timed out. Please try again.', 504)
    }
    logger.error('Attorney leads GET error:', error)
    return apiError('INTERNAL_ERROR', 'Server error', 500)
  }
}

// ─── PATCH: Update lead status (quick actions from pipeline) ────────────────

export async function PATCH(request: NextRequest) {
  try {
    const rl = await rateLimit(request, RATE_LIMITS.apiWrite)
    if (!rl.success) {
      return apiError('RATE_LIMIT', 'Too many requests', 429)
    }

    const { error: guardError, user, supabase } = await requireAttorney()
    if (guardError) return guardError

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)

    if (!parsed.success) {
      const messages = parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
      return apiError('VALIDATION_ERROR', messages.join(', '), 400)
    }

    const { assignmentId, status: newStatus, note } = parsed.data

    // Get attorney profile
    const { data: provider } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!provider) {
      return apiError('AUTHORIZATION_ERROR', 'No attorney profile found', 403)
    }

    const adminClient = createAdminClient()

    // Verify assignment belongs to this attorney
    const { data: existing } = await adminClient
      .from('lead_assignments')
      .select('id, status, lead_id')
      .eq('id', assignmentId)
      .eq('attorney_id', provider.id)
      .single()

    if (!existing) {
      return apiError('NOT_FOUND', 'Lead assignment not found', 404)
    }

    // Build update payload
    const updateData: Record<string, unknown> = { status: newStatus }

    if (newStatus === 'viewed' && existing.status === 'pending') {
      updateData.viewed_at = new Date().toISOString()
    }
    if (['quoted', 'declined', 'accepted', 'won', 'lost'].includes(newStatus)) {
      updateData.responded_at = new Date().toISOString()
    }

    const { error: updateError } = await adminClient
      .from('lead_assignments')
      .update(updateData)
      .eq('id', assignmentId)

    if (updateError) {
      logger.error('Lead status update error:', updateError)
      return apiError('DATABASE_ERROR', 'Failed to update lead status', 500)
    }

    // Log event (non-blocking)
    try {
      await adminClient.from('lead_events').insert({
        lead_id: existing.lead_id,
        attorney_id: provider.id,
        actor_id: user.id,
        event_type: newStatus,
        metadata: note ? { note } : {},
      })
    } catch (eventError: unknown) {
      logger.warn('Lead event logging failed:', { error: String(eventError) })
    }

    return apiSuccess({
      assignment: { id: assignmentId, status: newStatus },
    })
  } catch (error: unknown) {
    logger.error('PATCH /api/attorney/leads error:', error)
    return apiError('INTERNAL_ERROR', 'Server error', 500)
  }
}
