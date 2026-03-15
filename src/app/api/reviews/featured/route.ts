/**
 * API to retrieve featured reviews (for the homepage)
 * Returns the best recent reviews with at least 4 stars
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const revalidate = 3600 // Cache for 1 hour (ISR)

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Fetch top-rated recent reviews with attorney info (only published reviews)
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        client_name,
        created_at,
        artisan:profiles!attorney_id (
          id,
          full_name
        )
      `)
      .eq('status', 'published')
      .gte('rating', 4)
      .not('comment', 'is', null)
      .order('created_at', { ascending: false })
      .limit(6)

    if (error) {
      logger.error('Error fetching featured reviews:', error)
      return NextResponse.json({ reviews: [] })
    }

    // Transform reviews to include attorney info
    const transformedReviews = (reviews || [])
      .filter(r => r.comment && r.comment.length > 20) // Only reviews with actual content
      .map(review => {
        // Attorney can be null, single object, or array depending on the relation
        const artisan = Array.isArray(review.artisan) ? review.artisan[0] : review.artisan
        return {
          id: review.id,
          author_name: review.client_name || 'Client',
          rating: review.rating,
          comment: review.comment,
          artisan_name: artisan?.full_name || null,
          created_at: review.created_at
        }
      })

    return NextResponse.json({
      reviews: transformedReviews
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })

  } catch (error) {
    logger.error('Error fetching featured reviews:', error)
    return NextResponse.json(
      { reviews: [] },
      { status: 200 } // Return empty array instead of error
    )
  }
}
