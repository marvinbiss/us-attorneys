/**
 * Cron: Refresh Materialized View mv_attorney_stats
 * Runs daily at 03:00 UTC (see vercel.json)
 *
 * Dedicated endpoint for refreshing the mv_attorney_stats materialized view
 * that pre-aggregates attorney data with specialties and state info.
 * Tries CONCURRENTLY first (via RPC, requires unique index idx_mv_attorney_stats_id),
 * falls back to non-concurrent refresh if that fails.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const startTime = Date.now()

  try {
    // Verify cron secret (timing-safe comparison)
    if (!verifyCronSecret(request.headers.get('authorization'))) {
      logger.warn('[Cron] Unauthorized access attempt to refresh-mv')
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    logger.info('[Cron] Starting mv_attorney_stats refresh')

    const supabase = createAdminClient()
    let concurrent = true

    // Try CONCURRENTLY first via existing RPC (uses unique index idx_mv_attorney_stats_id)
    const { error: concurrentError } = await supabase.rpc('refresh_mv_attorney_stats')

    if (concurrentError) {
      logger.warn(
        '[Cron] Concurrent refresh failed, falling back to non-concurrent refresh:',
        { detail: concurrentError.message }
      )
      concurrent = false

      // Fallback: non-concurrent refresh via separate RPC
      const { error: standardError } = await supabase.rpc('refresh_mv_attorney_stats_standard')

      if (standardError) {
        const durationMs = Date.now() - startTime
        logger.error('[Cron] Non-concurrent MV refresh also failed:', standardError)
        return NextResponse.json(
          {
            success: false,
            error: { message: 'Failed to refresh materialized view' },
            details: standardError.message,
            duration_ms: durationMs,
          },
          { status: 500 }
        )
      }
    }

    const durationMs = Date.now() - startTime

    logger.info(
      `[Cron] mv_attorney_stats refreshed successfully (${concurrent ? 'concurrent' : 'standard'}) in ${durationMs}ms`
    )

    return NextResponse.json({
      success: true,
      message: 'Materialized view mv_attorney_stats refreshed',
      concurrent,
      duration_ms: durationMs,
      refreshed_at: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime
    logger.error('[Cron] Error in refresh-mv:', error)
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Error refreshing materialized view' },
        duration_ms: durationMs,
      },
      { status: 500 }
    )
  }
}
