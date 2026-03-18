import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { createApiHandler } from '@/lib/api/handler'
import { withTimeout } from '@/lib/api/timeout'
import { z } from 'zod'

// GET query params schema
const bookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(['all', 'pending', 'confirmed', 'completed', 'cancelled']).optional().default('all'),
  search: z.string().max(100).optional().default(''),
})

export const dynamic = 'force-dynamic'

// GET - List bookings
export const GET = createApiHandler(async ({ request }) => {
  // Verify admin with services:read permission
  const authResult = await requirePermission('services', 'read')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  const supabase = createAdminClient()

  const searchParams = new URL(request.url).searchParams
  const queryParams = {
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
    status: searchParams.get('status') || 'all',
    search: searchParams.get('search') || '',
  }
  const result = bookingsQuerySchema.safeParse(queryParams)
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid parameters', details: result.error.flatten() } },
      { status: 400 }
    )
  }
  const { page, limit, status, search } = result.data

  const offset = (page - 1) * limit

  let query = supabase
    .from('bookings')
    .select(`
      *,
      attorney:attorneys!attorney_id (
        id,
        name,
        email
      )
    `, { count: 'exact' })

  // Filter by status
  if (status !== 'all') {
    query = query.eq('status', status)
  }

  // Search: bookings has no free-text columns (client_email and service do not exist).
  // Status search is handled by the dedicated filter above.
  // The search parameter is accepted for UI compatibility but ignored at DB level.
  void search

  const { data: bookings, count, error } = await withTimeout(
    query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
  )

  if (error) {
    logger.warn('Bookings query failed, returning empty list', { code: error.code, message: error.message })
    return NextResponse.json({
      success: true,
      bookings: [],
      total: 0,
      page,
      totalPages: 0,
    })
  }

  return NextResponse.json({
    success: true,
    bookings: bookings || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  })
})
