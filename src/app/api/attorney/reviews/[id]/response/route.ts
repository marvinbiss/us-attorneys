import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiHandler } from '@/lib/api/handler'
import { z } from 'zod'

// POST request schema
const reviewResponseSchema = z.object({
  response: z.string().min(10, 'Response must contain at least 10 characters').max(2000),
})

// POST - Respond to a review
export const POST = createApiHandler(async ({ request, user, params }) => {
  const id = params?.id
  if (!id) {
    return NextResponse.json(
      { success: false, error: { message: 'Missing review ID' } },
      { status: 400 }
    )
  }

  const supabase = await createClient()

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
}, { requireAttorney: true })
