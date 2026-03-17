/**
 * GET /api/admin/journal — Immutable admin action journal
 * Reads from audit_logs (immutable, append-only)
 */

import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { createApiHandler } from '@/lib/api/handler'

const journalQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  action: z.string().max(100).nullable().default(null),
  user_id: z.string().uuid().nullable().default(null),
})

export const dynamic = 'force-dynamic'

export const GET = createApiHandler(async ({ request }) => {
  // Verify admin with audit:read permission
  const auth = await requirePermission('audit', 'read')
  if (!auth.success || !auth.admin) return auth.error!

  const supabase = createAdminClient()
  const url = new URL(request.url)

  const parsed = journalQuerySchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    action: url.searchParams.get('action') || null,
    user_id: url.searchParams.get('user_id') || null,
  })

  if (!parsed.success) {
    return NextResponse.json({ logs: [], total: 0, page: 1, pageSize: 50 })
  }

  const page = parsed.data.page
  const limit = 50
  const offset = (page - 1) * limit
  const actionFilter = parsed.data.action
  const userFilter = parsed.data.user_id

  let query = supabase
    .from('audit_logs')
    .select('id, action, user_id, resource_type, resource_id, new_value, metadata, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (actionFilter) {
    query = query.eq('action', actionFilter)
  }
  if (userFilter) {
    query = query.eq('user_id', userFilter)
  }

  const { data: logs, error } = await query

  if (error) {
    logger.warn('Journal query failed, returning empty list', { code: error.code, message: error.message })
    return NextResponse.json({
      logs: [],
      total: 0,
      page,
      pageSize: limit,
    })
  }

  let totalCount = 0
  try {
    const { count } = await supabase
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
    totalCount = count || 0
  } catch { /* use 0 */ }

  return NextResponse.json({
    logs: logs || [],
    total: totalCount || 0,
    page,
    pageSize: limit,
  })
})
