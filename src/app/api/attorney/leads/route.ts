/**
 * Attorney Assigned Leads API
 * GET: Fetch leads assigned to the authenticated attorney via lead_assignments
 */

import { NextRequest } from 'next/server'
import { requireAttorney } from '@/lib/auth/attorney-guard'
import { apiSuccess, apiError } from '@/lib/api/handler'
import { logger } from '@/lib/logger'
import { withTimeout, isTimeoutError } from '@/lib/api/timeout'
import { z } from 'zod'

const leadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  status: z.string().max(50).default('all'),
})

export const dynamic = 'force-dynamic'

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

    // Parse and validate pagination & filter params
    const { searchParams } = request.nextUrl
    const parsed = leadsQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    })

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid data', 400)
    }

    const { page, pageSize, status } = parsed.data
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
        assigned_at,
        viewed_at,
        lead:devis_requests (
          id,
          service_name,
          city,
          postal_code,
          description,
          urgency,
          client_name,
          client_phone,
          created_at,
          status
        )
      `)
      .eq('attorney_id', provider.id)
      .order('assigned_at', { ascending: false })
      .range(from, to)

    if (status !== 'all') {
      dataQuery = dataQuery.eq('status', status)
    }

    const { data: assignments, error: assignError } = await withTimeout(dataQuery)

    if (assignError) {
      logger.error('Error fetching assigned leads:', assignError)
      return apiError('DATABASE_ERROR', 'Error retrieving leads', 500)
    }

    // Fetch quotes for these leads so attorney can see sent quote info
    const leadList = assignments || []

    // Supabase embedded join: `lead` (devis_requests FK) resolves to a single object at runtime
    type LeadJoin = { id: string }
    const unwrapLead = (lead: unknown): LeadJoin | null =>
      Array.isArray(lead) ? (lead[0] ?? null) : (lead as LeadJoin | null)

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

    // Attach quote data to each assignment
    const enrichedLeads = leadList.map((a) => {
      const lead = unwrapLead(a.lead)
      const requestId = lead ? lead.id : null
      const quote = requestId ? quotesMap[requestId] ?? null : null
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
