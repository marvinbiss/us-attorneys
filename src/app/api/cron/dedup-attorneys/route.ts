/**
 * Cron: Automated Attorney Deduplication
 *
 * Detects and resolves duplicate attorney records:
 *   - EXACT matches (same bar_number + bar_state): auto-merge into canonical record
 *   - HIGH matches (same normalized name + city + state): flag for manual review
 *
 * Called by the daily-tasks orchestrator (not directly via vercel.json cron).
 * Must complete within 60s.
 *
 * Post-merge validation includes cycle detection on canonical_attorney_id chains.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Maximum attorneys to process per run (stay within 60s timeout)
const BATCH_SIZE = 1000
const MAX_ATTORNEYS = 10000

// ============================================================================
// Types
// ============================================================================

interface AttorneyRow {
  id: string
  name: string
  bar_number: string | null
  bar_state: string | null
  email: string | null
  phone: string | null
  website: string | null
  law_school: string | null
  firm_name: string | null
  address_line1: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  description: string | null
  bio: string | null
  primary_specialty_id: string | null
  is_verified: boolean
  years_experience: number | null
  bar_status: string | null
  bar_admission_date: string | null
  canonical_attorney_id: string | null
  review_count: number | null
  created_at: string
}

type ConfidenceLevel = 'EXACT' | 'HIGH'

interface DuplicateGroup {
  confidence: ConfidenceLevel
  reason: string
  matchKey: string
  attorneys: AttorneyRow[]
}

interface DedupResult {
  exactMerged: number
  highFlagged: number
  cyclesDetected: number
  cyclesFixed: number
  errors: number
  durationMs: number
}

// ============================================================================
// Name normalization (matches scripts/ingest/dedup-attorneys.ts)
// ============================================================================

const SUFFIXES = [
  /,?\s+(jr\.?|sr\.?|iii|ii|iv|v|esq\.?|j\.?d\.?|ll\.?m\.?|ph\.?d\.?|m\.?d\.?)$/i,
  /,?\s+(junior|senior|third|second|fourth|fifth|esquire)$/i,
]

function normalizeName(name: string): string {
  let n = name.toLowerCase().trim()
  for (const suffix of SUFFIXES) {
    n = n.replace(suffix, '')
  }
  return n
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ============================================================================
// Data quality score (higher = more complete record = keep as canonical)
// ============================================================================

function dataScore(a: AttorneyRow): number {
  let score = 0
  if (a.email) score += 5
  if (a.phone) score += 5
  if (a.website) score += 3
  if (a.law_school) score += 3
  if (a.firm_name) score += 2
  if (a.address_line1) score += 3
  if (a.address_city) score += 2
  if (a.address_zip) score += 2
  if (a.description) score += 4
  if (a.bio) score += 4
  if (a.primary_specialty_id) score += 5
  if (a.is_verified) score += 5
  if (a.years_experience) score += 2
  if (a.bar_admission_date) score += 2
  if ((a.review_count ?? 0) > 0) score += 5
  // Longer bio/description = richer profile
  if (a.bio && a.bio.length > 200) score += 3
  if (a.description && a.description.length > 200) score += 3
  return score
}

// ============================================================================
// Fetch active, non-linked attorneys (paginated)
// ============================================================================

async function fetchAttorneys(
  supabase: ReturnType<typeof createAdminClient>
): Promise<AttorneyRow[]> {
  const allAttorneys: AttorneyRow[] = []
  let offset = 0

  // Full column set -- all verified to exist in migrations 400 + 419
  const fullCols = [
    'id',
    'name',
    'bar_number',
    'bar_state',
    'email',
    'phone',
    'website',
    'law_school',
    'firm_name',
    'address_line1',
    'address_city',
    'address_state',
    'address_zip',
    'description',
    'bio',
    'primary_specialty_id',
    'is_verified',
    'years_experience',
    'bar_status',
    'bar_admission_date',
    'canonical_attorney_id',
    'review_count',
    'created_at',
  ]

  // Minimal fallback if a column was dropped or renamed
  const minimalCols = [
    'id',
    'name',
    'bar_number',
    'bar_state',
    'email',
    'phone',
    'address_city',
    'address_state',
    'is_verified',
    'created_at',
  ]

  // Try full columns first; fall back to minimal set if the query fails
  // (e.g. a column was removed and migrations haven't been re-run)
  let selectCols = fullCols.join(', ')
  let usingFallback = false

  // Probe with a single-row query to validate column set
  try {
    const { error: probeErr } = await supabase.from('attorneys').select(selectCols).limit(1)

    if (probeErr) {
      logger.warn('[Dedup] Full column set failed, falling back to minimal', {
        error: probeErr.message,
      })
      selectCols = minimalCols.join(', ')
      usingFallback = true
    }
  } catch (probeEx) {
    logger.warn('[Dedup] Probe query threw, falling back to minimal columns', {
      error: probeEx instanceof Error ? probeEx.message : 'Unknown',
    })
    selectCols = minimalCols.join(', ')
    usingFallback = true
  }

  if (usingFallback) {
    logger.info('[Dedup] Using minimal column set for dedup query')
  }

  while (allAttorneys.length < MAX_ATTORNEYS) {
    try {
      const { data, error } = await supabase
        .from('attorneys')
        .select(selectCols)
        .eq('is_active', true)
        .is('canonical_attorney_id', null)
        .order('id', { ascending: true })
        .range(offset, offset + BATCH_SIZE - 1)

      if (error) {
        logger.error('[Dedup] Error fetching attorneys', { offset, error: error.message })
        break
      }

      if (!data || data.length === 0) break

      allAttorneys.push(...(data as unknown as AttorneyRow[]))
      offset += data.length
      if (data.length < BATCH_SIZE) break
    } catch (fetchErr) {
      logger.error('[Dedup] Exception fetching attorneys batch', {
        offset,
        error: fetchErr instanceof Error ? fetchErr.message : 'Unknown',
      })
      break
    }
  }

  return allAttorneys
}

// ============================================================================
// Find duplicate groups
// ============================================================================

function findDuplicates(attorneys: AttorneyRow[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = []
  const assignedIds = new Set<string>()

  // --- EXACT: same bar_number + bar_state ---
  const byBarKey = new Map<string, AttorneyRow[]>()
  for (const a of attorneys) {
    if (!a.bar_number || !a.bar_state) continue
    const key = `${a.bar_number.trim().toLowerCase()}|${a.bar_state.trim().toUpperCase()}`
    const list = byBarKey.get(key) || []
    list.push(a)
    byBarKey.set(key, list)
  }

  for (const [key, list] of Array.from(byBarKey.entries())) {
    if (list.length < 2) continue
    const available = list.filter((a) => !assignedIds.has(a.id))
    if (available.length < 2) continue
    for (const a of available) assignedIds.add(a.id)
    groups.push({
      confidence: 'EXACT',
      reason: 'bar_number+bar_state',
      matchKey: key,
      attorneys: available,
    })
  }

  // --- HIGH: same normalized name + city + state ---
  const byNameCityState = new Map<string, AttorneyRow[]>()
  for (const a of attorneys) {
    if (!a.address_city || !a.address_state || assignedIds.has(a.id)) continue
    const normalizedName = normalizeName(a.name)
    if (normalizedName.length < 4) continue
    const key = `${normalizedName}|${a.address_city.toLowerCase().trim()}|${a.address_state.trim().toUpperCase()}`
    const list = byNameCityState.get(key) || []
    list.push(a)
    byNameCityState.set(key, list)
  }

  for (const [key, list] of Array.from(byNameCityState.entries())) {
    if (list.length < 2) continue
    const available = list.filter((a) => !assignedIds.has(a.id))
    if (available.length < 2) continue
    for (const a of available) assignedIds.add(a.id)
    groups.push({
      confidence: 'HIGH',
      reason: 'name+city+state',
      matchKey: key,
      attorneys: available,
    })
  }

  return groups
}

// ============================================================================
// Merge EXACT duplicates: link to canonical record with most data
// ============================================================================

async function mergeExactDuplicates(
  supabase: ReturnType<typeof createAdminClient>,
  groups: DuplicateGroup[]
): Promise<{ merged: number; errors: number }> {
  let merged = 0
  let errors = 0

  for (const group of groups) {
    // Pick canonical: highest data score, then earliest created_at
    const sorted = [...group.attorneys].sort((a, b) => {
      const scoreDiff = dataScore(b) - dataScore(a)
      if (scoreDiff !== 0) return scoreDiff
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    const canonical = sorted[0]
    const duplicates = sorted.slice(1)

    try {
      for (const dup of duplicates) {
        // Set canonical_attorney_id on the duplicate
        const { error: linkErr } = await supabase
          .from('attorneys')
          .update({ canonical_attorney_id: canonical.id })
          .eq('id', dup.id)

        if (linkErr) {
          logger.error('[Dedup] Error linking duplicate', {
            dupId: dup.id,
            canonicalId: canonical.id,
            error: linkErr.message,
          })
          errors++
          continue
        }

        // Copy bar admission from duplicate to canonical
        if (dup.bar_number && dup.bar_state) {
          await supabase.from('bar_admissions').upsert(
            {
              attorney_id: canonical.id,
              state: dup.bar_state,
              bar_number: dup.bar_number,
              status: dup.bar_status || 'active',
              admission_date: dup.bar_admission_date || null,
              verified: dup.is_verified,
              source: 'deduplication',
            },
            { onConflict: 'attorney_id,state', ignoreDuplicates: true }
          )
        }

        // Fill missing fields on canonical from duplicate
        const fillFields: Record<string, unknown> = {}
        if (!canonical.email && dup.email) fillFields.email = dup.email
        if (!canonical.phone && dup.phone) fillFields.phone = dup.phone
        if (!canonical.website && dup.website) fillFields.website = dup.website
        if (!canonical.law_school && dup.law_school) fillFields.law_school = dup.law_school
        if (!canonical.description && dup.description) fillFields.description = dup.description
        if (!canonical.bio && dup.bio) fillFields.bio = dup.bio
        if (!canonical.primary_specialty_id && dup.primary_specialty_id) {
          fillFields.primary_specialty_id = dup.primary_specialty_id
        }

        if (Object.keys(fillFields).length > 0) {
          await supabase.from('attorneys').update(fillFields).eq('id', canonical.id)
        }
      }
      merged++
    } catch (err) {
      logger.error('[Dedup] Error processing EXACT group', {
        matchKey: group.matchKey,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      errors++
    }
  }

  return { merged, errors }
}

// ============================================================================
// Flag HIGH matches for manual review (insert into dedup_candidates log)
// ============================================================================

async function flagHighMatches(
  _supabase: ReturnType<typeof createAdminClient>,
  groups: DuplicateGroup[]
): Promise<number> {
  let flagged = 0

  for (const group of groups) {
    // Log as structured warning for admin review
    // We use the data_quality_logs approach: insert into a lightweight log
    // Since dedup_candidates table may not exist, we log via structured logging
    // and use the existing data-quality alerting pipeline
    const sorted = [...group.attorneys].sort((a, b) => dataScore(b) - dataScore(a))
    const canonical = sorted[0]
    const duplicates = sorted.slice(1)

    logger.warn('[Dedup] HIGH confidence duplicate candidate for manual review', {
      confidence: group.confidence,
      reason: group.reason,
      matchKey: group.matchKey,
      canonicalId: canonical.id,
      canonicalName: canonical.name,
      duplicateIds: duplicates.map((d) => d.id),
      duplicateNames: duplicates.map((d) => d.name),
    })
    flagged++
  }

  return flagged
}

// ============================================================================
// Cycle detection: ensure canonical_attorney_id chains don't form cycles
// ============================================================================

async function detectAndFixCycles(
  supabase: ReturnType<typeof createAdminClient>
): Promise<{ detected: number; fixed: number }> {
  let detected = 0
  let fixed = 0

  // Fetch all attorneys that have a canonical_attorney_id set
  const { data: linkedAttorneys, error } = await supabase
    .from('attorneys')
    .select('id, canonical_attorney_id')
    .not('canonical_attorney_id', 'is', null)
    .limit(MAX_ATTORNEYS)

  if (error || !linkedAttorneys) {
    logger.error('[Dedup] Error fetching linked attorneys for cycle detection', {
      error: error?.message,
    })
    return { detected: 0, fixed: 0 }
  }

  // Build adjacency map: id -> canonical_attorney_id
  const canonicalMap = new Map<string, string>()
  for (const a of linkedAttorneys) {
    if (a.canonical_attorney_id) {
      canonicalMap.set(a.id, a.canonical_attorney_id as string)
    }
  }

  // For each linked attorney, walk the chain and detect cycles using Floyd's
  // tortoise-and-hare or simple visited-set approach (chain depth is small)
  const cycleBreakIds: string[] = []

  for (const [startId] of Array.from(canonicalMap.entries())) {
    const visited = new Set<string>()
    let current: string | undefined = startId
    let depth = 0
    const maxDepth = 50 // safety limit

    while (current && depth < maxDepth) {
      if (visited.has(current)) {
        // Cycle detected! Break it at the current node
        detected++
        cycleBreakIds.push(current)
        logger.warn('[Dedup] Cycle detected in canonical_attorney_id chain', {
          cycleAt: current,
          chainStart: startId,
          chainDepth: depth,
        })
        break
      }
      visited.add(current)
      current = canonicalMap.get(current)
      depth++
    }
  }

  // Fix cycles by nullifying canonical_attorney_id on the cycle-breaking node
  const uniqueCycleIds = Array.from(new Set(cycleBreakIds))
  for (const id of uniqueCycleIds) {
    const { error: fixErr } = await supabase
      .from('attorneys')
      .update({ canonical_attorney_id: null })
      .eq('id', id)

    if (fixErr) {
      logger.error('[Dedup] Error breaking cycle', { id, error: fixErr.message })
    } else {
      fixed++
      // Also remove from map so subsequent checks don't re-detect
      canonicalMap.delete(id)
    }
  }

  return { detected, fixed }
}

// ============================================================================
// Main handler
// ============================================================================

export async function GET(request: Request) {
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized' } },
      { status: 401 }
    )
  }

  const startTime = Date.now()
  logger.info('[Cron] Starting automated attorney deduplication')

  try {
    const supabase = createAdminClient()

    // 1. Fetch active, non-linked attorneys
    const attorneys = await fetchAttorneys(supabase)
    logger.info('[Dedup] Loaded attorneys for dedup', { count: attorneys.length })

    if (attorneys.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No attorneys to deduplicate',
        durationMs: Date.now() - startTime,
      })
    }

    // 2. Find duplicate groups
    const groups = findDuplicates(attorneys)
    const exactGroups = groups.filter((g) => g.confidence === 'EXACT')
    const highGroups = groups.filter((g) => g.confidence === 'HIGH')

    logger.info('[Dedup] Duplicate groups found', {
      exact: exactGroups.length,
      high: highGroups.length,
    })

    // 3. Auto-merge EXACT matches
    const { merged: exactMerged, errors: mergeErrors } = await mergeExactDuplicates(
      supabase,
      exactGroups
    )

    // 4. Flag HIGH matches for manual review
    const highFlagged = await flagHighMatches(supabase, highGroups)

    // 5. Post-dedup validation: cycle detection
    const { detected: cyclesDetected, fixed: cyclesFixed } = await detectAndFixCycles(supabase)

    const result: DedupResult = {
      exactMerged,
      highFlagged,
      cyclesDetected,
      cyclesFixed,
      errors: mergeErrors,
      durationMs: Date.now() - startTime,
    }

    logger.info('[Cron] Attorney deduplication complete', {
      exactMerged: result.exactMerged,
      highFlagged: result.highFlagged,
      cyclesDetected: result.cyclesDetected,
      cyclesFixed: result.cyclesFixed,
      errors: result.errors,
      durationMs: result.durationMs,
    })

    return NextResponse.json({
      success: mergeErrors === 0,
      ...result,
    })
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime
    logger.error('[Cron] Error in dedup-attorneys', {
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs,
    })
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Error during attorney deduplication' },
        durationMs,
      },
      { status: 500 }
    )
  }
}
