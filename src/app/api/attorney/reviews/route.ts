/**
 * Artisan Reviews API
 * GET: Fetch reviews for the artisan
 * POST: Reply to a review
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { requireArtisan } from '@/lib/auth/artisan-guard'
import { z } from 'zod'

// POST request schema (reply to review)
const replyToReviewSchema = z.object({
  review_id: z.string().uuid(),
  response: z.string().min(1).max(2000),
})

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { error: guardError, user, supabase } = await requireArtisan()
    if (guardError) return guardError

    // Fetch reviews for this artisan — explicit columns only (no fraud/scoring fields)
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id, attorney_id, rating, comment, artisan_response, artisan_responded_at, client_name, booking_id, created_at, updated_at')
      .eq('attorney_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(200)

    if (reviewsError) {
      logger.error('Error fetching reviews:', reviewsError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des avis' },
        { status: 500 }
      )
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
      note: r.rating,
      commentaire: r.comment,
      reponse: r.artisan_response,
      artisan_responded_at: r.artisan_responded_at,
      repondu: r.artisan_response !== null,
    })) || []

    return NextResponse.json({
      avis: formattedReviews,
      stats,
    })
  } catch (error) {
    logger.error('Reviews GET error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { error: guardError, user, supabase } = await requireArtisan()
    if (guardError) return guardError

    const body = await request.json()
    const result = replyToReviewSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten() },
        { status: 400 }
      )
    }
    const { review_id, response } = result.data

    // Verify the review belongs to this artisan and has no existing response
    const { data: review } = await supabase
      .from('reviews')
      .select('attorney_id, artisan_response')
      .eq('id', review_id)
      .single()

    if (!review || review.attorney_id !== user!.id) {
      return NextResponse.json(
        { error: 'Avis non trouvé ou non autorisé' },
        { status: 403 }
      )
    }

    // Guard against double-response
    if (review.artisan_response !== null) {
      return NextResponse.json(
        { error: 'Une réponse existe déjà pour cet avis' },
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
        { error: 'Erreur lors de la réponse' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Réponse enregistrée',
    })
  } catch (error) {
    logger.error('Reviews POST error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
