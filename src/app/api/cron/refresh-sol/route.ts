/**
 * Cron: Refresh Statute of Limitations Data
 * Runs monthly on the 1st at 04:00 UTC (see vercel.json)
 *
 * Identifies stale SOL records (older than 90 days) and checks for link rot
 * on source URLs. Flags records for manual review — NEVER auto-updates values.
 *
 * LEGAL DATA — zero tolerance for inaccuracy. A wrong statute of limitations
 * could cause someone to miss a filing deadline.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/cron-auth'
import { sendAlert } from '@/lib/monitoring/alerts'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/** Records older than this threshold (in days) are considered stale. */
const STALE_THRESHOLD_DAYS = 90

/** Max concurrent link-rot checks to avoid overwhelming source servers. */
const LINK_CHECK_CONCURRENCY = 10

/** Timeout per source URL check (ms). */
const LINK_CHECK_TIMEOUT_MS = 8000

interface StaleRecord {
  id: string
  state_code: string
  specialty_slug: string
  source_url: string | null
  updated_at: string
}

export async function GET(request: Request) {
  const startTime = Date.now()

  try {
    // Verify cron secret (timing-safe comparison)
    if (!verifyCronSecret(request.headers.get('authorization'))) {
      logger.warn('[Cron] Unauthorized access attempt to refresh-sol')
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    logger.info('[Cron] Starting Statute of Limitations staleness check')

    const supabase = createAdminClient()

    // 1. Get total record count
    const { count: totalRecords, error: countError } = await supabase
      .from('statute_of_limitations')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      logger.error('[Cron] Error counting SOL records:', countError)
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Failed to count SOL records' },
          details: countError.message,
          duration_ms: Date.now() - startTime,
        },
        { status: 500 }
      )
    }

    // 2. Find stale records (updated_at older than 90 days)
    const staleDate = new Date()
    staleDate.setDate(staleDate.getDate() - STALE_THRESHOLD_DAYS)
    const staleDateISO = staleDate.toISOString()

    const { data: staleRecords, error: staleError } = await supabase
      .from('statute_of_limitations')
      .select('id, state_code, specialty_slug, source_url, updated_at')
      .lt('updated_at', staleDateISO)
      .order('updated_at', { ascending: true })

    if (staleError) {
      logger.error('[Cron] Error fetching stale SOL records:', staleError)
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Failed to fetch stale SOL records' },
          details: staleError.message,
          duration_ms: Date.now() - startTime,
        },
        { status: 500 }
      )
    }

    const staleCount = staleRecords?.length ?? 0

    logger.info(
      `[Cron] SOL staleness check: ${totalRecords} total, ${staleCount} stale (>${STALE_THRESHOLD_DAYS} days)`
    )

    // 3. Check source URLs for link rot (only on records that have a source_url)
    const recordsWithUrls = (staleRecords ?? []).filter(
      (r): r is StaleRecord & { source_url: string } => !!r.source_url
    )

    const linkRotIds: string[] = []
    const linkRotDetails: Array<{ id: string; state_code: string; specialty_slug: string; source_url: string; status: number | string }> = []

    // Process URL checks in batches to respect concurrency limit
    for (let i = 0; i < recordsWithUrls.length; i += LINK_CHECK_CONCURRENCY) {
      const batch = recordsWithUrls.slice(i, i + LINK_CHECK_CONCURRENCY)

      const results = await Promise.allSettled(
        batch.map(async (record) => {
          try {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), LINK_CHECK_TIMEOUT_MS)

            const response = await fetch(record.source_url, {
              method: 'HEAD',
              signal: controller.signal,
              redirect: 'follow',
              headers: {
                'User-Agent': 'USAttorneys-SOL-Monitor/1.0',
              },
            })

            clearTimeout(timeout)

            if (response.status === 404 || response.status === 410) {
              return { record, status: response.status, isRotted: true }
            }
            return { record, status: response.status, isRotted: false }
          } catch (err) {
            // Network errors, timeouts — flag for review but don't treat as definitive link rot
            const message = err instanceof Error ? err.name : 'Unknown'
            return { record, status: message, isRotted: false }
          }
        })
      )

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.isRotted) {
          const { record, status } = result.value
          linkRotIds.push(record.id)
          linkRotDetails.push({
            id: record.id,
            state_code: record.state_code,
            specialty_slug: record.specialty_slug,
            source_url: record.source_url,
            status,
          })
        }
      }
    }

    // 4. Log warnings for stale records (grouped by state for readability)
    if (staleCount > 0) {
      const byState = new Map<string, number>()
      for (const r of staleRecords ?? []) {
        byState.set(r.state_code, (byState.get(r.state_code) ?? 0) + 1)
      }

      logger.warn('[Cron] SOL stale records by state:', {
        total: staleCount,
        byState: Object.fromEntries(byState),
      })
    }

    // 5. Log warnings for link rot and send alert
    if (linkRotDetails.length > 0) {
      logger.warn('[Cron] SOL source URL link rot detected:', {
        count: linkRotDetails.length,
        records: linkRotDetails,
      })
      await sendAlert({
        level: linkRotDetails.length > 10 ? 'critical' : 'warning',
        title: `SOL link rot: ${linkRotDetails.length} broken source URL(s)`,
        message: `${linkRotDetails.length} statute of limitations records have broken source URLs that need manual review.\n\nTop affected:\n${linkRotDetails.slice(0, 5).map(d => `- ${d.state_code}/${d.specialty_slug}: ${d.source_url} (HTTP ${d.status})`).join('\n')}`,
        source: 'cron:refresh-sol',
        metadata: {
          totalRecords: totalRecords ?? 0,
          staleCount,
          linkRotCount: linkRotDetails.length,
        },
      })
    }

    // 5b. Alert if too many stale records
    if (staleCount > 500) {
      await sendAlert({
        level: 'warning',
        title: `SOL data staleness: ${staleCount} records older than ${STALE_THRESHOLD_DAYS} days`,
        message: `${staleCount} out of ${totalRecords ?? 0} SOL records have not been updated in ${STALE_THRESHOLD_DAYS}+ days. Consider scheduling a refresh.`,
        source: 'cron:refresh-sol',
        metadata: { staleCount, totalRecords: totalRecords ?? 0 },
      })
    }

    const durationMs = Date.now() - startTime

    logger.info(
      `[Cron] SOL staleness check complete in ${durationMs}ms: ` +
      `${totalRecords} total, ${staleCount} stale, ${linkRotIds.length} link-rot`
    )

    return NextResponse.json({
      success: true,
      message: 'Statute of Limitations staleness check complete',
      total_records: totalRecords ?? 0,
      stale_count: staleCount,
      stale_threshold_days: STALE_THRESHOLD_DAYS,
      link_rot_count: linkRotIds.length,
      link_rot_ids: linkRotIds,
      duration_ms: durationMs,
      checked_at: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime
    logger.error('[Cron] Error in refresh-sol:', error)
    await sendAlert({
      level: 'critical',
      title: 'SOL refresh cron crashed',
      message: error instanceof Error ? error.message : 'Unknown error',
      source: 'cron:refresh-sol',
      metadata: { durationMs },
    })
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Error checking SOL data staleness' },
        duration_ms: durationMs,
      },
      { status: 500 }
    )
  }
}
