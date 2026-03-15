/**
 * API pour les statistiques publiques du site
 * Retourne les compteurs d'artisans, avis Google, note moyenne, etc.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cities } from '@/lib/data/usa'
import { logger } from '@/lib/logger'

export const revalidate = 60 // Cache for 1 minute (ISR)

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Get REAL stats from actual reviews table (NOT from providers table which had fake data)
    const [
      { count: attorneyCount },
      { data: realReviews }
    ] = await Promise.all([
      // Count active artisans
      supabase
        .from('attorneys')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),

      // Get ALL reviews (only exclude synthetic/fake ones)
      supabase
        .from('reviews')
        .select('rating, source')
        // Only exclude reviews explicitly marked as synthetic
        // Include reviews with NULL or empty source (they are real)
        .or('source.is.null,source.eq.,source.neq.synthetic')
    ])

    // Calculate total REAL reviews and average rating
    let totalReviews = 0
    let totalRating = 0

    if (realReviews && realReviews.length > 0) {
      totalReviews = realReviews.length
      totalRating = realReviews.reduce((sum, r) => sum + (r.rating || 0), 0)
    }

    const averageRating = totalReviews > 0
      ? Math.round((totalRating / totalReviews) * 10) / 10
      : 0 // Return 0 if no real reviews, NOT a fake fallback value

    return NextResponse.json({
      attorneyCount: attorneyCount || 0,
      reviewCount: totalReviews,
      averageRating: averageRating,
      cityCount: cities.length,
      updatedAt: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })

  } catch (error) {
    logger.error('Error fetching public stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
