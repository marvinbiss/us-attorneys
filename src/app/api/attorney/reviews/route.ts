/**
 * Attorney Reviews API
 * GET: Fetch reviews for the attorney
 * POST: Reply to a review
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiHandler } from '@/lib/api/handler'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// POST request schema (reply to review)
const replyToReviewSchema = z.object({
  review_id: z.string().uuid(),
  response: z.string().min(1).max(2000),
})

export const dynamic = 'force-dynamic'

export const GET = createApiHandler(async ({ user }) => {
  const supabase = await createClient()

  // Fetch reviews for this attorney — explicit columns only (no fraud/scoring fields)
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('id, attorney_id, rating, comment, artisan_response, artisan_responded_at, client_name, booking_id, created_at, updated_at')
    .eq('attorney_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (reviewsError) {
    throw reviewsError
  }

  // Calculate stats
  const totalReviews = reviews?.length || 0
  const averageRating = totalReviews > 0
    ? reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0

  // Distribution by rating
  const distribution = [5, 4, 3, 2, 1].map(note => ({
    note,
    count: reviews?.filter(r => r.rating === note).length || 0,
  }))

  const stats = {
    moyenne: Math.round(averageRating * 10) / 10,
    total: totalReviews,
    distribution,
  }

  // Format reviews for frontend
  const formattedReviews = reviews?.map(r => ({
    id: r.id,
    client: r.client_name || 'Client',
    date: r.created_at,
    rating: r.rating,
    comment: r.comment,
    response: r.artisan_response,
    artisan_responded_at: r.artisan_responded_at,
    has_response: r.artisan_response !== null,
  })) || []

  return NextResponse.json({
    reviews: formattedReviews,
    stats,
  })
}, { requireAttorney: true })

export const POST = createApiHandler(async ({ request, user }) => {
  const supabase = await createClient()

  const body = await request.json()
  const result = replyToReviewSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation error', details: result.error.flatten() },
      { status: 400 }
    )
  }
  const { review_id, response } = result.data

  // Verify the review belongs to this attorney and has no existing response
  const { data: review } = await supabase
    .from('reviews')
    .select('attorney_id, artisan_response')
    .eq('id', review_id)
    .single()

  if (!review || review.attorney_id !== user!.id) {
    return NextResponse.json(
      { error: 'Review not found or unauthorized' },
      { status: 403 }
    )
  }

  // Guard against double-response
  if (review.artisan_response !== null) {
    return NextResponse.json(
      { error: 'A response already exists for this review' },
      { status: 409 }
    )
  }

  // Update with response
  const { error: updateError } = await supabase
    .from('reviews')
    .update({ artisan_response: response, artisan_responded_at: new Date().toISOString() })
    .eq('id', review_id)

  if (updateError) {
    logger.error('Error updating review:', updateError)
    return NextResponse.json(
      { error: 'Error submitting response' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Response recorded',
  })
}, { requireAttorney: true })
