import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { createApiHandler } from '@/lib/api/handler'

// GET query params schema
const reviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  filter: z.enum(['pending', 'flagged', 'approved', 'rejected', 'all']).optional().default('pending'),
})

export const dynamic = 'force-dynamic'

export const GET = createApiHandler(async ({ request }) => {
  // Verify admin with reviews:read permission
  const authResult = await requirePermission('reviews', 'read')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  const supabase = createAdminClient()

  const searchParams = new URL(request.url).searchParams
  const queryParams = {
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
    filter: searchParams.get('filter') || 'pending',
  }
  const result = reviewsQuerySchema.safeParse(queryParams)
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid parameters', details: result.error.flatten() } },
      { status: 400 }
    )
  }
  const { page, limit, filter } = result.data

  const offset = (page - 1) * limit

  let query = supabase
    .from('reviews')
    .select(`
      *,
      attorney:profiles!attorney_id(id, full_name)
    `, { count: 'exact' })

  // Apply filters — reviews.status: 'published' | 'pending_review' | 'hidden' | 'flagged'
  if (filter === 'pending') {
    query = query.eq('status', 'pending_review')
  } else if (filter === 'flagged') {
    query = query.eq('status', 'flagged')
  } else if (filter === 'approved') {
    query = query.eq('status', 'published')
  } else if (filter === 'rejected') {
    query = query.eq('status', 'hidden')
  }

  const { data: reviews, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    logger.warn('Reviews query failed, returning empty list', { code: error.code, message: error.message })
    return NextResponse.json({
      success: true,
      reviews: [],
      total: 0,
      page,
      totalPages: 0,
    })
  }

  // Transform data — map schema columns to frontend fields
  const transformedReviews = (reviews || []).map((review) => ({
    id: review.id,
    author_name: review.client_name || 'Anonymous',
    author_email: review.client_email || '',
    provider_name: review.attorney?.full_name || 'Unknown',
    attorney_id: review.attorney_id,
    rating: review.rating,
    comment: review.comment,
    response: review.attorney_response,
    moderation_status: review.status === 'published' ? 'approved'
      : review.status === 'hidden' ? 'rejected'
      : review.status === 'pending_review' || review.status === 'flagged' ? 'pending'
      : 'pending',
    is_visible: review.status === 'published',
    is_flagged: review.status === 'flagged',
    created_at: review.created_at,
  }))

  return NextResponse.json({
    success: true,
    reviews: transformedReviews,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  })
})
