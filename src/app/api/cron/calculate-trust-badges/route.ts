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
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
    }

    logger.info('[Cron] Starting review metrics recalculation')

    let totalUpdated = 0
    let totalErrors = 0
    let totalSkipped = 0
    let offset = 0
    let hasMore = true

    while (hasMore) {
      // Fetch active providers with their current metrics (user_id needed to match attorney_id in reviews)
      const { data: providers, error } = await supabase
        .from('attorneys')
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

      // Batch-fetch all reviews for this batch of providers (eliminates N+1)
      const userIds = providers
        .map(p => p.user_id)
        .filter((id): id is string => !!id)

      const skippedInBatch = providers.filter(p => !p.user_id).length
      totalSkipped += skippedInBatch

      if (userIds.length === 0) {
        if (providers.length < BATCH_SIZE) {
          hasMore = false
        } else {
          offset += BATCH_SIZE
        }
        continue
      }

      // Single query instead of N queries
      const { data: allReviews, error: reviewError } = await supabase
        .from('reviews')
        .select('attorney_id, rating')
        .in('attorney_id', userIds)
        .eq('status', 'published')

      if (reviewError) {
        logger.error('[Cron] Error batch-fetching reviews:', reviewError)
        totalErrors++
      } else {
        // Group reviews by attorney_id
        const reviewsByAttorney = new Map<string, number[]>()
        for (const r of allReviews || []) {
          const existing = reviewsByAttorney.get(r.attorney_id) || []
          existing.push(r.rating || 0)
          reviewsByAttorney.set(r.attorney_id, existing)
        }

        // Prepare batch updates
        const updates: Promise<void>[] = []

        for (const provider of providers) {
          if (!provider.user_id) continue

          const ratings = reviewsByAttorney.get(provider.user_id) || []
          const reviewCount = ratings.length
          const ratingAverage = reviewCount > 0
            ? ratings.reduce((sum, r) => sum + r, 0) / reviewCount
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

          updates.push(
            Promise.resolve(
              supabase
                .from('attorneys')
                .update({ rating_average: roundedRating, review_count: reviewCount })
                .eq('id', provider.id)
            ).then(({ error: updateError }) => {
              if (updateError) {
                totalErrors++
                logger.error(`[Cron] Error updating provider ${provider.id}:`, updateError)
              } else {
                totalUpdated++
              }
            }).catch((err) => {
              totalErrors++
              logger.error(`[Cron] Error processing provider ${provider.id}:`, err)
            })
          )
        }

        // Execute updates in parallel (batch of 50 max)
        const CONCURRENT_UPDATES = 50
        for (let i = 0; i < updates.length; i += CONCURRENT_UPDATES) {
          await Promise.allSettled(updates.slice(i, i + CONCURRENT_UPDATES))
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

    // Refresh materialized view mv_provider_stats
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
      { success: false, error: { message: 'Error recalculating review metrics' } },
      { status: 500 }
    )
  }
}
