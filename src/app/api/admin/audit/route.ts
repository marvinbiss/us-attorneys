import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { sanitizeSearchQuery } from '@/lib/sanitize'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// GET query params schema
const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  action: z.string().max(100).optional().default('all'),
  entityType: z.string().max(50).optional().default('all'),
  adminId: z.string().uuid().optional().or(z.literal('')),
  dateFrom: z.string().datetime().optional().or(z.literal('')),
  dateTo: z.string().datetime().optional().or(z.literal('')),
})

export const dynamic = 'force-dynamic'

// GET - List audit logs
export async function GET(request: NextRequest) {
  try {
    // Verify admin with audit:read permission
    const authResult = await requirePermission('audit', 'read')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    const supabase = createAdminClient()

    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
      action: searchParams.get('action') || 'all',
      entityType: searchParams.get('entityType') || 'all',
      adminId: searchParams.get('adminId') || '',
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || '',
    }
    const result = auditQuerySchema.safeParse(queryParams)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid parameters', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { page, limit, action, entityType, adminId, dateFrom, dateTo } = result.data

    const offset = (page - 1) * limit

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })

    // Filtres
    if (action !== 'all') {
      const sanitizedAction = sanitizeSearchQuery(action)
      if (sanitizedAction) {
        query = query.ilike('action', `%${sanitizedAction}%`)
      }
    }

    if (entityType !== 'all') {
      query = query.eq('resource_type', entityType)
    }

    if (adminId) {
      query = query.eq('user_id', adminId)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    const { data: logs, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.warn('Audit logs query failed, returning empty list', { code: error.code, message: error.message })
      return NextResponse.json({
        success: true,
        logs: [],
        total: 0,
        page,
        totalPages: 0,
      })
    }

    // Enrich logs with admin profile info (audit_logs.user_id -> profiles.id)
    const enrichedLogs = logs || []
    const userIds = Array.from(new Set(enrichedLogs.map(l => l.user_id).filter(Boolean)))
    const profilesMap = new Map<string, { email: string; full_name: string | null }>()

    if (userIds.length > 0) {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds)

        if (profiles) {
          profiles.forEach(p => profilesMap.set(p.id, { email: p.email, full_name: p.full_name }))
        }
      } catch {
        // profiles table may not exist, continue without enrichment
      }
    }

    const logsWithAdmin = enrichedLogs.map(log => ({
      ...log,
      admin: log.user_id ? profilesMap.get(log.user_id) || null : null,
    }))

    return NextResponse.json({
      success: true,
      logs: logsWithAdmin,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    logger.error('Admin audit logs error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
