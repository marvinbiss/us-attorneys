/**
 * Admin Data Quality Dashboard API
 *
 * Returns comprehensive data quality metrics for the attorney database:
 * - Field coverage (email, phone, website)
 * - Distribution by state
 * - Enrichment coverage (education, awards, publications)
 * - Data freshness (average age, oldest record)
 * - Completeness score (weighted average of field fill rates)
 *
 * Auth: CRON_SECRET Bearer token OR admin session (requirePermission).
 * Cache: 5 minutes via getCachedData (L1 memory + L2 Redis).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/cron-auth'
import { requirePermission } from '@/lib/admin-auth'
import { getCachedData } from '@/lib/cache'

export const dynamic = 'force-dynamic'

// Cache TTL: 5 minutes (300 seconds)
const CACHE_TTL_SECONDS = 300
const CACHE_KEY = 'admin:data-quality:dashboard'

// Field weights for completeness score (must sum to 1.0)
const FIELD_WEIGHTS: Record<string, number> = {
  name: 0.20,
  bar_number: 0.15,
  email: 0.15,
  phone: 0.10,
  website: 0.05,
  address_city: 0.10,
  address_state: 0.10,
  primary_specialty: 0.10,
  firm_name: 0.05,
}

interface FieldCoverage {
  field: string
  total: number
  filled: number
  fillRate: number
  weight: number
}

interface StateCounts {
  state: string
  count: number
}

interface EnrichmentCoverage {
  table: string
  attorneysWithData: number
  totalRecords: number
  coveragePercent: number
}

interface DataFreshness {
  averageAgeDays: number
  oldestRecordDate: string | null
  newestRecordDate: string | null
  recordsOlderThan90Days: number
}

interface DataQualityResponse {
  success: true
  generatedAt: string
  cached: boolean
  summary: {
    totalAttorneys: number
    activeAttorneys: number
    completenessScore: number
  }
  fieldCoverage: FieldCoverage[]
  byState: StateCounts[]
  enrichment: EnrichmentCoverage[]
  freshness: DataFreshness
}

/**
 * Authenticate the request via CRON_SECRET or admin session.
 * Returns null if authorized, or a NextResponse error if not.
 */
async function authenticate(request: NextRequest): Promise<NextResponse | null> {
  // Path 1: CRON_SECRET bearer token (for automated monitoring)
  const authHeader = request.headers.get('authorization')
  if (authHeader && verifyCronSecret(authHeader)) {
    return null
  }

  // Path 2: Admin session with settings:read permission
  const authResult = await requirePermission('settings', 'read')
  if (!authResult.success) {
    return authResult.error!
  }

  return null
}

/**
 * Safely extract a count from a Supabase count query result.
 */
function safeCount(result: { count: number | null; error?: unknown }): number {
  if (result.error) return 0
  return result.count ?? 0
}

/**
 * Fetch all data quality metrics from the database.
 * This is the "fetcher" function passed to getCachedData.
 */
async function fetchDataQualityMetrics(): Promise<DataQualityResponse> {
  const supabase = createAdminClient()
  const now = new Date()

  // ── 1. Total & active attorney counts ──
  const [totalResult, activeResult] = await Promise.all([
    supabase.from('attorneys').select('*', { count: 'exact', head: true }),
    supabase.from('attorneys').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const totalAttorneys = safeCount(totalResult)
  const activeAttorneys = safeCount(activeResult)

  // ── 2. Field coverage (on active attorneys) ──
  const fieldQueries = await Promise.all([
    // name filled
    supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('name', 'is', null)
      .neq('name', ''),
    // bar_number filled
    supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('bar_number', 'is', null),
    // email filled
    supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('email', 'is', null)
      .neq('email', ''),
    // phone filled
    supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('phone', 'is', null)
      .neq('phone', ''),
    // website filled
    supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('website', 'is', null)
      .neq('website', ''),
    // address_city filled
    supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('address_city', 'is', null)
      .neq('address_city', ''),
    // address_state filled
    supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('address_state', 'is', null),
    // primary_specialty_id filled
    supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('primary_specialty_id', 'is', null),
    // firm_name filled
    supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('firm_name', 'is', null)
      .neq('firm_name', ''),
  ])

  const fieldNames = Object.keys(FIELD_WEIGHTS)
  const fieldCoverage: FieldCoverage[] = fieldNames.map((field, i) => {
    const filled = safeCount(fieldQueries[i])
    return {
      field,
      total: activeAttorneys,
      filled,
      fillRate: activeAttorneys > 0 ? Math.round((filled / activeAttorneys) * 10000) / 100 : 0,
      weight: FIELD_WEIGHTS[field],
    }
  })

  // Weighted completeness score
  const completenessScore = activeAttorneys > 0
    ? Math.round(
        fieldCoverage.reduce((sum, f) => sum + (f.filled / activeAttorneys) * f.weight, 0) * 10000
      ) / 100
    : 0

  // ── 3. Attorneys by state ──
  const { data: stateData, error: stateError } = await supabase
    .from('attorneys')
    .select('address_state')
    .eq('is_active', true)
    .not('address_state', 'is', null)

  const stateMap = new Map<string, number>()
  if (!stateError && stateData) {
    for (const row of stateData) {
      const st = row.address_state as string
      stateMap.set(st, (stateMap.get(st) || 0) + 1)
    }
  }

  const byState: StateCounts[] = Array.from(stateMap.entries())
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)

  // ── 4. Enrichment coverage ──
  // For each enrichment table, count distinct attorney_ids
  const enrichmentTables = [
    'attorney_education',
    'attorney_awards',
    'attorney_publications',
    'disciplinary_actions',
  ] as const

  const enrichmentResults = await Promise.allSettled(
    enrichmentTables.map(async (table) => {
      // Total records in the enrichment table
      const { count: totalRecords } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      // Distinct attorney_ids: fetch all attorney_ids and dedupe in memory
      // (Supabase JS client doesn't support COUNT(DISTINCT ...))
      const { data: rows } = await supabase
        .from(table)
        .select('attorney_id')

      const distinctAttorneys = rows ? new Set(rows.map((r) => r.attorney_id)).size : 0

      return {
        table,
        attorneysWithData: distinctAttorneys,
        totalRecords: totalRecords ?? 0,
        coveragePercent:
          activeAttorneys > 0
            ? Math.round((distinctAttorneys / activeAttorneys) * 10000) / 100
            : 0,
      }
    })
  )

  const enrichment: EnrichmentCoverage[] = enrichmentResults.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    logger.warn(`[data-quality] Enrichment query failed for ${enrichmentTables[i]}`, {
      error: String(r.reason),
    })
    return {
      table: enrichmentTables[i],
      attorneysWithData: 0,
      totalRecords: 0,
      coveragePercent: 0,
    }
  })

  // ── 5. Data freshness ──
  // Average updated_at age, oldest record, newest record
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86_400_000).toISOString()

  const [oldestResult, newestResult, staleResult] = await Promise.all([
    supabase
      .from('attorneys')
      .select('updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: true })
      .limit(1)
      .single(),
    supabase
      .from('attorneys')
      .select('updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .lt('updated_at', ninetyDaysAgo),
  ])

  const oldestDate = oldestResult.data?.updated_at as string | null
  const newestDate = newestResult.data?.updated_at as string | null

  // Approximate average age: midpoint between oldest and newest
  // (True average would require fetching all updated_at values or a DB function)
  let averageAgeDays = 0
  if (oldestDate && newestDate) {
    const oldestMs = new Date(oldestDate).getTime()
    const newestMs = new Date(newestDate).getTime()
    const midpointMs = (oldestMs + newestMs) / 2
    averageAgeDays = Math.round((now.getTime() - midpointMs) / 86_400_000)
  }

  const freshness: DataFreshness = {
    averageAgeDays,
    oldestRecordDate: oldestDate,
    newestRecordDate: newestDate,
    recordsOlderThan90Days: safeCount(staleResult),
  }

  return {
    success: true,
    generatedAt: now.toISOString(),
    cached: false,
    summary: {
      totalAttorneys,
      activeAttorneys,
      completenessScore,
    },
    fieldCoverage,
    byState,
    enrichment,
    freshness,
  }
}

export async function GET(request: NextRequest) {
  try {
    // ── Auth ──
    const authError = await authenticate(request)
    if (authError) return authError

    // ── Fetch with cache (5 min TTL) ──
    const metrics = await getCachedData<DataQualityResponse>(
      CACHE_KEY,
      fetchDataQualityMetrics,
      CACHE_TTL_SECONDS,
      { skipNull: true }
    )

    // Mark as cached if it was served from cache (generatedAt would be in the past)
    const ageMs = Date.now() - new Date(metrics.generatedAt).getTime()
    const wasCached = ageMs > 2000 // If data is >2s old, it was cached

    return NextResponse.json(
      { ...metrics, cached: wasCached },
      {
        status: 200,
        headers: {
          'Cache-Control': `private, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=60`,
        },
      }
    )
  } catch (error: unknown) {
    logger.error('[admin/data-quality] Unhandled error', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to compute data quality metrics' },
      },
      { status: 500 }
    )
  }
}
