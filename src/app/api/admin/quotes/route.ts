import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { sanitizeSearchQuery, isValidUuid } from '@/lib/sanitize'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { createApiHandler } from '@/lib/api/handler'

// GET query params schema
const quotesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z
    .enum(['all', 'pending', 'sent', 'accepted', 'refused', 'completed'])
    .optional()
    .default('all'),
  search: z.string().max(100).optional().default(''),
})

export const dynamic = 'force-dynamic'

// GET - List consultation requests

export const GET = createApiHandler(async ({ request }) => {
  // Verify admin with services:read permission
  const authResult = await requirePermission('services', 'read')
  if (!authResult.success || !authResult.admin) {
    return authResult.error as NextResponse
  }

  const supabase = createAdminClient()

  const searchParams = new URL(request.url).searchParams
  const queryParams = {
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
    status: searchParams.get('status') || 'all',
    search: searchParams.get('search') || '',
  }
  const result = quotesQuerySchema.safeParse(queryParams)
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid parameters', details: result.error.flatten() } },
      { status: 400 }
    )
  }
  const { page, limit, status, search } = result.data

  const offset = (page - 1) * limit

  let query = supabase
    .from('quote_requests')
    .select(
      'id, client_id, service_name, postal_code, city, description, budget, urgency, client_name, client_email, client_phone, status, created_at',
      { count: 'exact' }
    )

  // Filter by status — CHECK values: pending/sent/accepted/refused/completed
  if (status !== 'all') {
    query = query.eq('status', status)
  }

  // Search on service_name, description, client_name, client_email or postal_code
  if (search) {
    const sanitized = sanitizeSearchQuery(search)
    if (sanitized) {
      query = query.or(
        `service_name.ilike.%${sanitized}%,description.ilike.%${sanitized}%,client_name.ilike.%${sanitized}%,client_email.ilike.%${sanitized}%,postal_code.ilike.%${sanitized}%,city.ilike.%${sanitized}%`
      )
    }
  }

  const {
    data: consultationRequests,
    count,
    error,
  } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  if (error) {
    logger.warn('Quote requests query failed, returning empty list', {
      code: error.code,
      message: error.message,
    })
    return NextResponse.json({
      success: true,
      requests: [],
      assignments: {},
      total: 0,
      page,
      totalPages: 0,
    })
  }

  // Fetch lead_assignments for these requests to show which attorney(s) received each request
  const requestIds = (consultationRequests || []).map((d) => d.id)
  const assignmentsByLead: Record<
    string,
    Array<{
      id: string
      status: string
      assigned_at: string
      provider_name: string
      attorney_id: string
    }>
  > = {}

  if (requestIds.length > 0) {
    const { data: assignments } = await supabase
      .from('lead_assignments')
      .select('id, lead_id, status, assigned_at, attorney_id, attorney:attorneys(id, name)')
      .in('lead_id', requestIds)
      .order('position', { ascending: true })

    if (assignments) {
      for (const a of assignments) {
        // Supabase embedded join: attorney resolves to single object at runtime
        const provider = (Array.isArray(a.attorney) ? a.attorney[0] : a.attorney) as {
          id: string
          name: string
        } | null
        const entry = {
          id: a.id,
          status: a.status,
          assigned_at: a.assigned_at,
          attorney_id: a.attorney_id,
          provider_name: provider?.name || 'Unknown',
        }
        if (!assignmentsByLead[a.lead_id]) {
          assignmentsByLead[a.lead_id] = []
        }
        assignmentsByLead[a.lead_id].push(entry)
      }
    }
  }

  return NextResponse.json({
    success: true,
    requests: consultationRequests || [],
    assignments: assignmentsByLead,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  })
})

// DELETE - Delete a quote request
export const DELETE = createApiHandler(async ({ request }) => {
  const authResult = await requirePermission('services', 'delete')
  if (!authResult.success || !authResult.admin) {
    return authResult.error as NextResponse
  }

  const body = await request.json()
  const id = body?.id

  if (!id || !isValidUuid(id)) {
    return NextResponse.json({ success: false, error: { message: 'Invalid ID' } }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Delete related lead_assignments first (FK-free polymorphic link)
  await supabase.from('lead_assignments').delete().eq('lead_id', id)

  // Delete the consultation request

  const { error } = await supabase.from('quote_requests').delete().eq('id', id)

  if (error) {
    logger.error('Quote request delete error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error during deletion' } },
      { status: 500 }
    )
  }

  await logAdminAction(authResult.admin.id, 'devis_request_deleted', 'devis_request', id)

  return NextResponse.json({ success: true })
})
