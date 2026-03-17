/**
 * Cron: Data Refresh
 * Runs daily at 3:00 AM UTC (see vercel.json).
 *
 * Lightweight maintenance tasks:
 * 1. Check for stale attorney records (not updated in 90+ days) and flag them
 * 2. Refresh materialized views (mv_attorney_stats)
 * 3. Recalculate attorney counts per location
 * 4. Log stats (total records, stale count, refreshed count)
 *
 * Does NOT run full ingestion — just maintenance.
 * Must complete within Vercel's 60s function timeout.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

const STALE_THRESHOLD_DAYS = 90

interface StepResult {
  step: string
  success: boolean
  error?: string
  durationMs: number
  detail?: Record<string, unknown>
}

export async function GET(request: Request) {
  try {
    if (!verifyCronSecret(request.headers.get('authorization'))) {
      logger.warn('[Cron] Unauthorized access attempt to data-refresh')
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    logger.info('[Cron] Starting data refresh')
    const startTime = Date.now()
    const results: StepResult[] = []
    const supabase = createAdminClient()

    // ── Step 1: Flag stale attorney records (not updated in 90+ days) ──
    const staleStart = Date.now()
    try {
      const staleDate = new Date()
      staleDate.setDate(staleDate.getDate() - STALE_THRESHOLD_DAYS)
      const staleDateStr = staleDate.toISOString()

      // Count stale records
      const { count: staleCount, error: staleCountErr } = await supabase
        .from('attorneys')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .lt('updated_at', staleDateStr)

      if (staleCountErr) {
        throw new Error(`Count stale: ${staleCountErr.message}`)
      }

      const staleTotal = staleCount || 0

      if (staleTotal > 0) {
        logger.warn(`[Cron] ${staleTotal} stale attorney records (not updated in ${STALE_THRESHOLD_DAYS}+ days)`)
      }

      results.push({
        step: 'flag_stale_records',
        success: true,
        durationMs: Date.now() - staleStart,
        detail: {
          staleCount: staleTotal,
          thresholdDays: STALE_THRESHOLD_DAYS,
          cutoffDate: staleDateStr,
        },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      logger.error('[Cron] Error flagging stale records:', err)
      results.push({
        step: 'flag_stale_records',
        success: false,
        error: msg,
        durationMs: Date.now() - staleStart,
      })
    }

    // ── Step 2: Refresh mv_attorney_stats materialized view ──
    const mvStart = Date.now()
    const { error: mvError } = await supabase.rpc('refresh_mv_attorney_stats')

    if (mvError) {
      logger.warn(`[Cron] refresh_mv_attorney_stats RPC failed: ${mvError.message}`)
      results.push({
        step: 'refresh_mv_attorney_stats',
        success: false,
        error: mvError.message,
        durationMs: Date.now() - mvStart,
      })
    } else {
      results.push({
        step: 'refresh_mv_attorney_stats',
        success: true,
        durationMs: Date.now() - mvStart,
      })
    }

    // ── Step 3: Recalculate attorney counts per state ──
    const countsStart = Date.now()
    try {
      // Get active attorney counts grouped by state
      const { data: stateCounts, error: stateErr } = await supabase
        .from('attorneys')
        .select('address_state')
        .eq('is_active', true)
        .not('address_state', 'is', null)

      if (stateErr) {
        throw new Error(`State counts: ${stateErr.message}`)
      }

      // Aggregate counts per state in memory (lightweight)
      const stateMap: Record<string, number> = {}
      if (stateCounts) {
        for (const row of stateCounts) {
          const st = row.address_state as string
          if (st) {
            stateMap[st] = (stateMap[st] || 0) + 1
          }
        }
      }

      const statesWithAttorneys = Object.keys(stateMap).length
      const topStates = Object.entries(stateMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([state, count]) => ({ state, count }))

      logger.info(`[Cron] Attorney distribution: ${statesWithAttorneys} states covered`, {
        topStates: JSON.stringify(topStates),
      })

      results.push({
        step: 'attorney_counts_per_state',
        success: true,
        durationMs: Date.now() - countsStart,
        detail: {
          statesWithAttorneys,
          topStates,
          totalMapped: stateCounts?.length || 0,
        },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      logger.error('[Cron] Error calculating attorney counts:', err)
      results.push({
        step: 'attorney_counts_per_state',
        success: false,
        error: msg,
        durationMs: Date.now() - countsStart,
      })
    }

    // ── Step 4: Log overall stats ──
    const statsStart = Date.now()
    const [
      { count: totalAttorneys, error: countErr },
      { count: withSpecialty },
      { count: withCensus },
    ] = await Promise.all([
      supabase
        .from('attorneys')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('attorney_specialties')
        .select('attorney_id', { count: 'exact', head: true }),
      supabase
        .from('locations_us')
        .select('*', { count: 'exact', head: true })
        .not('census_data', 'is', null),
    ])

    if (countErr) {
      results.push({
        step: 'overall_stats',
        success: false,
        error: countErr.message,
        durationMs: Date.now() - statsStart,
      })
    } else {
      results.push({
        step: 'overall_stats',
        success: true,
        durationMs: Date.now() - statsStart,
        detail: {
          totalActiveAttorneys: totalAttorneys || 0,
          attorneysWithSpecialty: withSpecialty || 0,
          locationsWithCensus: withCensus || 0,
        },
      })
      logger.info(`[Cron] Total active attorneys: ${totalAttorneys?.toLocaleString() || 'unknown'}`)
    }

    // ── Summary ──
    const totalDuration = Date.now() - startTime
    const succeeded = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    logger.info('[Cron] Data refresh complete', {
      durationMs: totalDuration,
      succeeded,
      failed,
    })

    return NextResponse.json({
      success: failed === 0,
      message: 'Data refresh complete',
      durationMs: totalDuration,
      stats: {
        totalActiveAttorneys: totalAttorneys || 0,
        attorneysWithSpecialty: withSpecialty || 0,
        locationsWithCensus: withCensus || 0,
      },
      steps: results,
    })
  } catch (error) {
    logger.error('[Cron] Error in data-refresh:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error during data refresh' } },
      { status: 500 }
    )
  }
}
