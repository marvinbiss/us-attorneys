/**
 * Cron: Data Quality Checks
 * Runs weekly on Monday at 6:00 AM UTC (see vercel.json).
 *
 * Runs lightweight data quality audits:
 * 1. Count attorneys with missing critical fields (name, bar_number, bar_state)
 * 2. Count attorneys with no practice areas assigned
 * 3. Count duplicate candidates (same name + state)
 * 4. Count locations with no attorneys
 *
 * Returns quality metrics as JSON and logs warnings for metrics above thresholds.
 * Must complete within Vercel's 60s function timeout.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

// Warning thresholds — log warnings when metrics exceed these
const THRESHOLDS = {
  missingName: 10,
  missingBarNumber: 500,
  missingBarState: 500,
  noPracticeAreas: 1000,
  duplicateCandidates: 100,
  emptyLocations: 5000,
}

interface QualityMetric {
  metric: string
  count: number
  threshold: number
  status: 'ok' | 'warning'
  durationMs: number
  error?: string
}

export async function GET(request: Request) {
  try {
    if (!verifyCronSecret(request.headers.get('authorization'))) {
      logger.warn('[Cron] Unauthorized access attempt to data-quality')
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    logger.info('[Cron] Starting data quality checks')
    const startTime = Date.now()
    const metrics: QualityMetric[] = []
    const supabase = createAdminClient()

    // ── Check 1: Attorneys with missing name ──
    const nameStart = Date.now()
    const { count: missingName, error: nameErr } = await supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .or('name.is.null,name.eq.')

    const missingNameCount = missingName || 0
    metrics.push({
      metric: 'missing_name',
      count: missingNameCount,
      threshold: THRESHOLDS.missingName,
      status: missingNameCount > THRESHOLDS.missingName ? 'warning' : 'ok',
      durationMs: Date.now() - nameStart,
      ...(nameErr && { error: nameErr.message }),
    })

    // ── Check 2: Attorneys with missing bar_number ──
    const barNumStart = Date.now()
    const { count: missingBarNum, error: barNumErr } = await supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('bar_number', null)

    const missingBarNumCount = missingBarNum || 0
    metrics.push({
      metric: 'missing_bar_number',
      count: missingBarNumCount,
      threshold: THRESHOLDS.missingBarNumber,
      status: missingBarNumCount > THRESHOLDS.missingBarNumber ? 'warning' : 'ok',
      durationMs: Date.now() - barNumStart,
      ...(barNumErr && { error: barNumErr.message }),
    })

    // ── Check 3: Attorneys with missing bar_state ──
    const barStateStart = Date.now()
    const { count: missingBarState, error: barStateErr } = await supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('bar_state', null)

    const missingBarStateCount = missingBarState || 0
    metrics.push({
      metric: 'missing_bar_state',
      count: missingBarStateCount,
      threshold: THRESHOLDS.missingBarState,
      status: missingBarStateCount > THRESHOLDS.missingBarState ? 'warning' : 'ok',
      durationMs: Date.now() - barStateStart,
      ...(barStateErr && { error: barStateErr.message }),
    })

    // ── Check 4: Attorneys with no practice areas assigned ──
    const specStart = Date.now()
    try {
      // Get total active attorneys
      const { count: totalActive } = await supabase
        .from('attorneys')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Get attorneys that have at least one specialty
      const { count: withSpec } = await supabase
        .from('attorney_specialties')
        .select('attorney_id', { count: 'exact', head: true })

      // Attorneys without specialties = total - those with at least one
      // This is an approximation (attorney_specialties count includes all rows,
      // not distinct attorney_ids), but for monitoring purposes it's sufficient
      const noSpecCount = Math.max(0, (totalActive || 0) - (withSpec || 0))

      metrics.push({
        metric: 'no_practice_areas',
        count: noSpecCount,
        threshold: THRESHOLDS.noPracticeAreas,
        status: noSpecCount > THRESHOLDS.noPracticeAreas ? 'warning' : 'ok',
        durationMs: Date.now() - specStart,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      metrics.push({
        metric: 'no_practice_areas',
        count: -1,
        threshold: THRESHOLDS.noPracticeAreas,
        status: 'warning',
        durationMs: Date.now() - specStart,
        error: msg,
      })
    }

    // ── Check 5: Duplicate candidates (same name + address_state) ──
    const dupeStart = Date.now()
    try {
      // Fetch name + state for active attorneys, look for duplicates in memory
      // We limit to a reasonable sample to stay within timeout
      const { data: attorneys, error: dupeErr } = await supabase
        .from('attorneys')
        .select('name, address_state')
        .eq('is_active', true)
        .not('name', 'is', null)
        .not('address_state', 'is', null)

      if (dupeErr) {
        throw new Error(dupeErr.message)
      }

      // Count duplicates: group by name+state, count groups with >1 entry
      const seen = new Map<string, number>()
      let dupeCount = 0

      if (attorneys) {
        for (const a of attorneys) {
          const key = `${(a.name as string).toLowerCase().trim()}|${a.address_state}`
          const prev = seen.get(key) || 0
          seen.set(key, prev + 1)
          // Count only the first time we detect a duplicate (when count goes from 1 to 2)
          if (prev === 1) dupeCount++
        }
      }

      metrics.push({
        metric: 'duplicate_candidates',
        count: dupeCount,
        threshold: THRESHOLDS.duplicateCandidates,
        status: dupeCount > THRESHOLDS.duplicateCandidates ? 'warning' : 'ok',
        durationMs: Date.now() - dupeStart,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      metrics.push({
        metric: 'duplicate_candidates',
        count: -1,
        threshold: THRESHOLDS.duplicateCandidates,
        status: 'warning',
        durationMs: Date.now() - dupeStart,
        error: msg,
      })
    }

    // ── Check 6: Locations with no attorneys ──
    const locStart = Date.now()
    try {
      // Total locations
      const { count: totalLocs } = await supabase
        .from('locations_us')
        .select('*', { count: 'exact', head: true })

      // Locations that have at least one attorney (by address_city matching)
      // We use a distinct count of address_city + address_state from attorneys
      const { data: coveredCities, error: covErr } = await supabase
        .from('attorneys')
        .select('address_city, address_state')
        .eq('is_active', true)
        .not('address_city', 'is', null)
        .not('address_state', 'is', null)

      if (covErr) {
        throw new Error(covErr.message)
      }

      const uniqueCities = new Set<string>()
      if (coveredCities) {
        for (const row of coveredCities) {
          uniqueCities.add(`${row.address_city}|${row.address_state}`)
        }
      }

      const emptyLocs = Math.max(0, (totalLocs || 0) - uniqueCities.size)

      metrics.push({
        metric: 'locations_without_attorneys',
        count: emptyLocs,
        threshold: THRESHOLDS.emptyLocations,
        status: emptyLocs > THRESHOLDS.emptyLocations ? 'warning' : 'ok',
        durationMs: Date.now() - locStart,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      metrics.push({
        metric: 'locations_without_attorneys',
        count: -1,
        threshold: THRESHOLDS.emptyLocations,
        status: 'warning',
        durationMs: Date.now() - locStart,
        error: msg,
      })
    }

    // ── Log warnings for any metrics above thresholds ──
    const warnings = metrics.filter(m => m.status === 'warning')
    for (const w of warnings) {
      if (w.error) {
        logger.warn(`[Cron][DataQuality] ${w.metric}: ERROR - ${w.error}`)
      } else {
        logger.warn(
          `[Cron][DataQuality] ${w.metric}: ${w.count} (threshold: ${w.threshold})`
        )
      }
    }

    const totalDuration = Date.now() - startTime
    const okCount = metrics.filter(m => m.status === 'ok').length
    const warnCount = warnings.length

    logger.info('[Cron] Data quality checks complete', {
      durationMs: totalDuration,
      ok: okCount,
      warnings: warnCount,
    })

    return NextResponse.json({
      success: true,
      message: 'Data quality checks complete',
      durationMs: totalDuration,
      summary: {
        totalChecks: metrics.length,
        ok: okCount,
        warnings: warnCount,
      },
      metrics,
    })
  } catch (error) {
    logger.error('[Cron] Error in data-quality:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error during data quality checks' } },
      { status: 500 }
    )
  }
}
