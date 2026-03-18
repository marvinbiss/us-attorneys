/**
 * Cron: Data Retention Cleanup
 * Runs monthly on the 1st at 02:00 UTC (see vercel.json)
 *
 * Calls the retention_cleanup() PostgreSQL function which:
 *   - Deletes audit_logs older than 90 days
 *   - Deletes analytics_events older than 6 months
 *   - Deletes security_logs older than 90 days
 *   - Anonymizes GDPR-deleted user profiles after 30-day grace period
 *   - Cleans up old completed/cancelled deletion requests
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
      logger.warn('[Cron] Unauthorized access attempt to data-retention')
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    logger.info('[Cron] Starting data retention cleanup')

    const supabase = createAdminClient()

    const { data, error } = await supabase.rpc('retention_cleanup')

    if (error) {
      const durationMs = Date.now() - startTime
      logger.error('[Cron] Data retention cleanup failed:', error)
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Data retention cleanup failed' },
          details: error.message,
          duration_ms: durationMs,
        },
        { status: 500 }
      )
    }

    const durationMs = Date.now() - startTime

    logger.info('[Cron] Data retention cleanup completed', {
      results: data,
      duration_ms: durationMs,
    })

    return NextResponse.json({
      success: true,
      message: 'Data retention cleanup completed',
      results: data,
      duration_ms: durationMs,
      executed_at: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime
    logger.error('[Cron] Error in data-retention:', error)
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Error during data retention cleanup' },
        duration_ms: durationMs,
      },
      { status: 500 }
    )
  }
}
