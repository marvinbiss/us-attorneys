import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

// PATCH request schema — maps to reviews.status column
const moderateReviewSchema = z.object({
  moderation_status: z.enum(['pending', 'approved', 'rejected']),
  is_visible: z.boolean().optional(),
})

// Map frontend moderation_status to DB status column
function toDbStatus(moderationStatus: string): string {
  if (moderationStatus === 'approved') return 'published'
  if (moderationStatus === 'rejected') return 'hidden'
  return 'pending_review'
}

export const dynamic = 'force-dynamic'

// PATCH - Moderate review
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin with reviews:write permission
    const authResult = await requirePermission('reviews', 'write')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    if (!isValidUuid(params.id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const result = moderateReviewSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Validation error', details: result.error.flatten() } },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('reviews')
      .update({
        status: toDbStatus(result.data.moderation_status),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      logger.error('Review moderation failed', { code: error.code, message: error.message })
      return NextResponse.json(
        { success: false, error: { message: 'Unable to moderate the review' } },
        { status: 500 }
      )
    }

    // Log the moderation action
    await logAdminAction(
      authResult.admin.id,
      `review.${result.data.moderation_status}`,
      'review',
      params.id,
      { moderation_status: result.data.moderation_status, is_visible: result.data.is_visible }
    )

    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('Admin review moderation error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
