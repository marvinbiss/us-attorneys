import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { requireArtisan } from '@/lib/auth/artisan-guard'
import { z } from 'zod'

// POST request schema
const reviewResponseSchema = z.object({
  response: z.string().min(10, 'Response must contain at least 10 characters').max(2000),
})

export const dynamic = 'force-dynamic'

// POST - Respond to a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error: guardError, user, supabase } = await requireArtisan()
    if (guardError) return guardError

    const body = await request.json()
    const result = reviewResponseSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Validation error', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { response } = result.data

    // Check review belongs to this attorney and has no response yet
    // reviews.attorney_id → profiles.id, which equals user.id directly
    const { data: review } = await supabase
      .from('reviews')
      .select('id, attorney_id, artisan_response')
      .eq('id', id)
      .eq('attorney_id', user!.id)
      .single()

    if (!review) {
      return NextResponse.json(
        { success: false, error: { message: 'Review not found' } },
        { status: 404 }
      )
    }

    if (review.artisan_response) {
      return NextResponse.json(
        { success: false, error: { message: 'This review already has a response' } },
        { status: 400 }
      )
    }

    // Update review with response
    const { error: updateError } = await supabase
      .from('reviews')
      .update({
        artisan_response: response.trim(),
        artisan_responded_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Review response error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
