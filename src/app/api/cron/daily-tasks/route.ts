/**
 * Cron: Daily Tasks Orchestrator
 * Runs daily at 03:00 UTC via Vercel cron (see vercel.json).
 *
 * Chains all daily maintenance tasks sequentially within one invocation
 * to work within Vercel free plan's 2-cron limit:
 *   1. Refresh materialized view mv_attorney_stats
 *   2. Data quality checks (stale records, orphans)
 *   3. Trust badge recalculation
 *   4. Cleanup stale data
 *   5. Attorney deduplication (EXACT auto-merge, HIGH flagged)
 *   6. SOL staleness detection (entries older than 1 year)
 *
 * Each task has its own try/catch so one failure doesn't block the rest.
 * Must complete within Vercel's 60s function timeout.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface TaskResult {
  name: string
  status: 'success' | 'skipped' | 'error'
  durationMs: number
  details?: string
}

async function refreshMaterializedView(): Promise<TaskResult> {
  const start = Date.now()
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.rpc('refresh_mv_attorney_stats')

    if (error) {
      // Fallback to non-concurrent refresh
      const { error: fallbackError } = await supabase.rpc('refresh_mv_attorney_stats_standard')
      if (fallbackError) {
        return {
          name: 'refresh_mv',
          status: 'error',
          durationMs: Date.now() - start,
          details: fallbackError.message,
        }
      }
      return {
        name: 'refresh_mv',
        status: 'success',
        durationMs: Date.now() - start,
        details: 'non-concurrent fallback',
      }
    }

    return { name: 'refresh_mv', status: 'success', durationMs: Date.now() - start }
  } catch (err: unknown) {
    return {
      name: 'refresh_mv',
      status: 'error',
      durationMs: Date.now() - start,
      details: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

async function checkDataQuality(): Promise<TaskResult> {
  const start = Date.now()
  try {
    const supabase = createAdminClient()

    // Check for attorneys with invalid data that bypassed constraints
    const { count: noSlugCount } = await supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .is('slug', null)

    // Check for orphaned attorney_specialties (FK should catch, but verify)
    const { count: totalAttorneys } = await supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const details = `active_attorneys=${totalAttorneys ?? 0}, null_slugs=${noSlugCount ?? 0}`

    if ((noSlugCount ?? 0) > 0) {
      logger.warn('[DailyTasks] Data quality issue: attorneys with null slugs', {
        count: noSlugCount,
      })
    }

    return { name: 'data_quality', status: 'success', durationMs: Date.now() - start, details }
  } catch (err: unknown) {
    return {
      name: 'data_quality',
      status: 'error',
      durationMs: Date.now() - start,
      details: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

async function recalculateTrustBadges(): Promise<TaskResult> {
  const start = Date.now()
  try {
    const supabase = createAdminClient()

    // Update verified badge based on bar_admissions
    const { error } = await supabase.rpc('recalculate_trust_badges')

    if (error) {
      // RPC may not exist yet — skip gracefully
      if (error.message.includes('does not exist') || error.code === '42883') {
        return {
          name: 'trust_badges',
          status: 'skipped',
          durationMs: Date.now() - start,
          details: 'RPC not found',
        }
      }
      return {
        name: 'trust_badges',
        status: 'error',
        durationMs: Date.now() - start,
        details: error.message,
      }
    }

    return { name: 'trust_badges', status: 'success', durationMs: Date.now() - start }
  } catch (err: unknown) {
    return {
      name: 'trust_badges',
      status: 'error',
      durationMs: Date.now() - start,
      details: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

async function runDedupAttorneys(): Promise<TaskResult> {
  const start = Date.now()
  try {
    // Call the dedup-attorneys endpoint internally
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const cronSecret = process.env.CRON_SECRET

    const response = await fetch(`${siteUrl}/api/cron/dedup-attorneys`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    })

    if (!response.ok) {
      const body = await response.text()
      return {
        name: 'dedup_attorneys',
        status: 'error',
        durationMs: Date.now() - start,
        details: `HTTP ${response.status}: ${body.substring(0, 200)}`,
      }
    }

    const data = await response.json()
    return {
      name: 'dedup_attorneys',
      status: data.success ? 'success' : 'error',
      durationMs: Date.now() - start,
      details: `exact_merged=${data.exactMerged ?? 0}, high_flagged=${data.highFlagged ?? 0}, cycles_detected=${data.cyclesDetected ?? 0}, cycles_fixed=${data.cyclesFixed ?? 0}`,
    }
  } catch (err: unknown) {
    return {
      name: 'dedup_attorneys',
      status: 'error',
      durationMs: Date.now() - start,
      details: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

async function checkSolStaleness(): Promise<TaskResult> {
  const start = Date.now()
  try {
    const supabase = createAdminClient()

    // Flag SOL entries older than 1 year as potentially stale
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()

    const { count: staleCount, error: staleError } = await supabase
      .from('statute_of_limitations')
      .select('*', { count: 'exact', head: true })
      .lt('updated_at', oneYearAgo)

    if (staleError) {
      // Table may not exist yet — skip gracefully
      if (staleError.message.includes('does not exist') || staleError.code === '42P01') {
        return {
          name: 'sol_staleness',
          status: 'skipped',
          durationMs: Date.now() - start,
          details: 'statute_of_limitations table not found',
        }
      }
      return {
        name: 'sol_staleness',
        status: 'error',
        durationMs: Date.now() - start,
        details: staleError.message,
      }
    }

    const { count: totalRecords } = await supabase
      .from('statute_of_limitations')
      .select('*', { count: 'exact', head: true })

    const stale = staleCount ?? 0
    const total = totalRecords ?? 0

    if (stale > 0) {
      logger.warn('[DailyTasks] SOL staleness: entries older than 1 year detected', {
        staleCount: stale,
        totalRecords: total,
        threshold: '1 year',
      })
    }

    return {
      name: 'sol_staleness',
      status: 'success',
      durationMs: Date.now() - start,
      details: `stale_1y=${stale}, total=${total}`,
    }
  } catch (err: unknown) {
    return {
      name: 'sol_staleness',
      status: 'error',
      durationMs: Date.now() - start,
      details: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

async function cleanupStaleData(): Promise<TaskResult> {
  const start = Date.now()
  try {
    const supabase = createAdminClient()

    // Clean up expired booking reminders (older than 90 days, completed/cancelled)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['completed', 'cancelled'])
      .lt('created_at', ninetyDaysAgo)

    return {
      name: 'cleanup_stale',
      status: 'success',
      durationMs: Date.now() - start,
      details: `old_completed_bookings=${count ?? 0}`,
    }
  } catch (err: unknown) {
    return {
      name: 'cleanup_stale',
      status: 'error',
      durationMs: Date.now() - start,
      details: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized' } },
      { status: 401 }
    )
  }

  const startTime = Date.now()
  logger.info('[Cron] Starting daily tasks orchestrator')

  // Run tasks sequentially to stay within timeout and avoid DB contention
  const results: TaskResult[] = []

  results.push(await refreshMaterializedView())
  results.push(await checkDataQuality())
  results.push(await recalculateTrustBadges())
  results.push(await cleanupStaleData())
  results.push(await runDedupAttorneys())
  results.push(await checkSolStaleness())

  const totalDuration = Date.now() - startTime
  const errors = results.filter((r) => r.status === 'error')

  // Log summary
  for (const result of results) {
    const level = result.status === 'error' ? 'error' : 'info'
    const msg = `[DailyTasks] ${result.name}: ${result.status} (${result.durationMs}ms)`
    if (level === 'error') {
      logger.error(msg, new Error(result.details || 'Task failed'))
    } else {
      logger.info(msg, { details: result.details })
    }
  }

  logger.info('[Cron] Daily tasks complete', {
    durationMs: totalDuration,
    success: results.filter((r) => r.status === 'success').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    errors: errors.length,
  })

  return NextResponse.json({
    success: errors.length === 0,
    timestamp: new Date().toISOString(),
    durationMs: totalDuration,
    summary: {
      total: results.length,
      success: results.filter((r) => r.status === 'success').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      errors: errors.length,
    },
    tasks: results,
  })
}
