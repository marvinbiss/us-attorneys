import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const bulkModerateSchema = z.object({
  review_ids: z.array(z.string().uuid()).min(1).max(50),
  action: z.enum(['approve', 'reject']),
})

// PATCH /api/reviews/bulk - Bulk moderate reviews (Admin only)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    // Admin role check: only admins can bulk moderate reviews
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        { success: false, error: { message: 'Access reserved for administrators' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = bulkModerateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data' } },
        { status: 400 }
      )
    }

    const { review_ids, action } = parsed.data

    const updates = {
      moderation_status: action === 'approve' ? 'approved' : 'rejected',
      is_visible: action === 'approve',
      moderated_at: new Date().toISOString(),
      moderated_by: user.id,
    }

    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .in('id', review_ids)
      .select('id')

    if (error) throw error

    return NextResponse.json({
      success: true,
      moderated: data?.length || 0,
    })
  } catch (error) {
    logger.error('Bulk moderate reviews error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
