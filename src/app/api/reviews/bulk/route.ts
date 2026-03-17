import { NextResponse } from 'next/server'
import { createApiHandler, jsonResponse } from '@/lib/api/handler'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const bulkModerateSchema = z.object({
  review_ids: z.array(z.string().uuid()).min(1).max(50),
  action: z.enum(['approve', 'reject']),
})

// PATCH /api/reviews/bulk - Bulk moderate reviews (Admin only)
export const PATCH = createApiHandler<z.infer<typeof bulkModerateSchema>>(
  async ({ user, body }) => {
    const supabase = await createClient()

    // Admin role check: only admins can bulk moderate reviews
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user!.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        { success: false, error: { message: 'Access reserved for administrators' } },
        { status: 403 }
      )
    }

    const { review_ids, action } = body

    const updates = {
      moderation_status: action === 'approve' ? 'approved' : 'rejected',
      is_visible: action === 'approve',
      moderated_at: new Date().toISOString(),
      moderated_by: user!.id,
    }

    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .in('id', review_ids)
      .select('id')

    if (error) throw error

    return jsonResponse({
      moderated: data?.length || 0,
    })
  },
  { requireAuth: true, bodySchema: bulkModerateSchema }
)
