import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// GET query params schema
const reportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(['all', 'pending', 'reviewed', 'dismissed']).optional().default('all'),
  targetType: z.enum(['all', 'user', 'provider', 'review', 'message']).optional().default('all'),
})

export const dynamic = 'force-dynamic'

// GET - Liste des signalements
export async function GET(request: NextRequest) {
  try {
    // Verify admin with reviews:read permission
    const authResult = await requirePermission('reviews', 'read')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    const supabase = createAdminClient()

    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      status: searchParams.get('status') || 'all',
      targetType: searchParams.get('targetType') || 'all',
    }
    const result = reportsQuerySchema.safeParse(queryParams)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid parameters', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { page, limit, status, targetType } = result.data

    const offset = (page - 1) * limit

    let query = supabase
      .from('user_reports')
      .select('*', { count: 'exact' })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (targetType !== 'all') {
      query = query.eq('target_type', targetType)
    }

    const { data: reports, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.warn('Reports query failed, returning empty list', { code: error.code, message: error.message })
      return NextResponse.json({
        success: true,
        reports: [],
        total: 0,
        page,
        totalPages: 0,
      })
    }

    return NextResponse.json({
      success: true,
      reports: reports || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    logger.error('Admin reports list error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
