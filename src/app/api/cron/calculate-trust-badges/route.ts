/**
 * Cron: Recalculate Review Metrics
 * Runs daily at 02:00 UTC (see vercel.json)
 *
 * Recalculates rating_average and review_count for all active providers.
 * The trigger on reviews (migration 014) handles real-time updates,
 * but this daily job ensures consistency and catches any missed updates.
 *
 * NOTE: trust_badge and trust_score columns were DROPPED in v2
 * (100_v2_schema_cleanup.sql). This cron now only updates:
 *   - rating_average (from reviews table)
 *   - review_count   (from reviews table)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const BATCH_SIZE = 200

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('[Cron] Unauthorized access attempt to calculate-trust-badges')
      return NextResponse.json({ success: false, error: { message: 'Non autorisé' } }, { status: 401 })
    }

    logger.info('[Cron] Starting review metrics recalculation')

    let totalUpdated = 0
    let totalErrors = 0
    let totalSkipped = 0
    let offset = 0
    let hasMore = true

    while (hasMore) {
      // Fetch active providers with their current metrics (user_id needed to match artisan_id in reviews)
      const { data: providers, error } = await supabase
        .from('providers')
        .select('id, user_id, rating_average, review_count')
        .eq('is_active', true)
        .range(offset, offset + BATCH_SIZE - 1)
        .order('id')

      if (error) {
        logger.error('[Cron] Error fetching providers:', error)
        totalErrors++
        break
      }

      if (!providers || providers.length === 0) {
        hasMore = false
        break
      }

      for (const provider of providers) {
        try {
          // Calculate review metrics for this provider
          // reviews.artisan_id references profiles.id = providers.user_id
          if (!provider.user_id) {
            totalSkipped++
            continue
          }
          const { data: reviewStats, error: reviewError } = await supabase
            .from('reviews')
            .select('rating')
            .eq('artisan_id', provider.user_id)
            .eq('status', 'published')

          if (reviewError) {
            totalErrors++
            continue
          }

          const reviews = reviewStats || []
          const reviewCount = reviews.length
          const ratingAverage =
            reviewCount > 0
              ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount
              : 0

          const roundedRating = Math.round(ratingAverage * 100) / 100

          // Skip update if nothing changed
          if (
            provider.rating_average === roundedRating &&
            provider.review_count === reviewCount
          ) {
            totalSkipped++
            continue
          }

          // Update provider with only the columns that exist
          const { error: updateError } = await supabase
            .from('providers')
            .update({
              rating_average: roundedRating,
              review_count: reviewCount,
            })
            .eq('id', provider.id)

          if (updateError) {
            totalErrors++
            logger.error(
              `[Cron] Error updating review metrics for provider ${provider.id}:`,
              updateError
            )
          } else {
            totalUpdated++
          }
        } catch (providerError) {
          totalErrors++
          logger.error(
            `[Cron] Error processing provider ${provider.id}:`,
            providerError
          )
        }
      }

      if (providers.length < BATCH_SIZE) {
        hasMore = false
      } else {
        offset += BATCH_SIZE
      }
    }

    logger.info(
      `[Cron] Review metrics recalculation complete: ${totalUpdated} updated, ${totalSkipped} skipped, ${totalErrors} errors`
    )

    // Refresh de la vue matérialisée mv_provider_stats
    let mvRefreshed = false
    try {
      const { error: mvError } = await supabase.rpc('refresh_provider_stats')
      if (mvError) {
        logger.error('[Cron] Failed to refresh mv_provider_stats:', mvError)
      } else {
        mvRefreshed = true
        logger.info('[Cron] mv_provider_stats refreshed successfully')
      }
    } catch (mvErr) {
      logger.error('[Cron] Exception refreshing mv_provider_stats:', mvErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Review metrics recalculated',
      updated: totalUpdated,
      skipped: totalSkipped,
      errors: totalErrors,
      mvRefreshed,
    })
  } catch (error) {
    logger.error('[Cron] Error in calculate-trust-badges:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur lors du recalcul des métriques d\'avis' } },
      { status: 500 }
    )
  }
}
