/**
 * Attorney Deduplication Script (P2.12)
 *
 * Finds duplicate attorneys across states by matching:
 *   1. Normalized name + same city
 *   2. Same bar_number across different bar_state entries
 *
 * Usage:
 *   npx tsx scripts/ingest/deduplicate-attorneys.ts [--dry-run] [--fix] [--limit 100]
 *
 * Modes:
 *   (default)   Report duplicates only
 *   --dry-run   Show what merges would happen (no DB writes)
 *   --fix       Merge duplicates: keep record with most data, add bar_admissions from the other
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

const BATCH_SIZE = 1000

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const FIX_MODE = args.includes('--fix')
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('Run: export $(grep -v "^#" .env.local | xargs)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ============================================================================
// TYPES
// ============================================================================

interface AttorneyRecord {
  id: string
  name: string
  slug: string
  first_name: string | null
  last_name: string | null
  bar_number: string | null
  bar_state: string | null
  bar_status: string | null
  bar_admission_date: string | null
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
  created_at: string
}

interface DuplicateGroup {
  reason: string
  normalizedKey: string
  attorneys: AttorneyRecord[]
}

// ============================================================================
// NAME NORMALIZATION
// ============================================================================

/** Suffixes to strip for matching purposes */
const SUFFIXES = [
  /,?\s+(jr\.?|sr\.?|iii|ii|iv|esq\.?|j\.?d\.?|ll\.?m\.?|ph\.?d\.?)$/i,
  /,?\s+(junior|senior|third|second|fourth)$/i,
]

function normalizeName(name: string): string {
  let n = name.toLowerCase().trim()

  // Remove suffixes
  for (const suffix of SUFFIXES) {
    n = n.replace(suffix, '')
  }

  // Normalize whitespace and punctuation
  n = n
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z\s]/g, '')       // keep only letters and spaces
    .replace(/\s+/g, ' ')           // collapse whitespace
    .trim()

  return n
}

// ============================================================================
// DATA QUALITY SCORE
// ============================================================================

/** Score an attorney record by how much data it has (higher = more data = keep) */
function dataScore(a: AttorneyRecord): number {
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
  return score
}

// ============================================================================
// FETCH ALL ATTORNEYS (paginated)
// ============================================================================

async function fetchAllAttorneys(): Promise<AttorneyRecord[]> {
  const allAttorneys: AttorneyRecord[] = []
  let offset = 0
  let hasMore = true

  const selectCols = [
    'id', 'name', 'slug', 'first_name', 'last_name',
    'bar_number', 'bar_state', 'bar_status', 'bar_admission_date',
    'email', 'phone', 'website', 'law_school', 'firm_name',
    'address_line1', 'address_city', 'address_state', 'address_zip',
    'description', 'bio', 'primary_specialty_id',
    'is_verified', 'years_experience', 'created_at',
  ].join(', ')

  while (hasMore) {
    const { data, error } = await supabase
      .from('attorneys')
      .select(selectCols)
      .eq('is_active', true)
      .order('id', { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1)

    if (error) {
      console.error(`Error fetching attorneys at offset ${offset}:`, error.message)
      break
    }

    if (!data || data.length === 0) {
      hasMore = false
    } else {
      allAttorneys.push(...(data as AttorneyRecord[]))
      offset += data.length
      if (data.length < BATCH_SIZE) hasMore = false

      if (offset % 5000 === 0) {
        process.stdout.write(`\r  Loading attorneys: ${allAttorneys.length.toLocaleString()}...`)
      }
    }

    if (LIMIT > 0 && allAttorneys.length >= LIMIT) {
      allAttorneys.splice(LIMIT)
      hasMore = false
    }
  }

  console.log(`\r  Loaded ${allAttorneys.length.toLocaleString()} attorneys`)
  return allAttorneys
}

// ============================================================================
// FIND DUPLICATES
// ============================================================================

function findDuplicates(attorneys: AttorneyRecord[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = []
  const seen = new Set<string>()

  // Strategy 1: Same normalized name + same city (across different bar_state)
  console.log('\n--- Strategy 1: Same name + same city, different bar_state ---')
  const byNameCity = new Map<string, AttorneyRecord[]>()

  for (const a of attorneys) {
    if (!a.address_city || !a.bar_state) continue
    const normalizedName = normalizeName(a.name)
    if (normalizedName.length < 4) continue // skip very short names

    const key = `${normalizedName}|${a.address_city.toLowerCase().trim()}`
    const list = byNameCity.get(key) || []
    list.push(a)
    byNameCity.set(key, list)
  }

  for (const [key, list] of byNameCity.entries()) {
    // Only keep groups where there are different bar_states
    const barStates = new Set(list.map(a => a.bar_state))
    if (barStates.size < 2) continue
    if (list.length < 2) continue

    const ids = list.map(a => a.id).sort().join(',')
    if (seen.has(ids)) continue
    seen.add(ids)

    groups.push({
      reason: 'name+city',
      normalizedKey: key,
      attorneys: list,
    })
  }

  console.log(`  Found ${groups.length} duplicate groups by name+city`)

  // Strategy 2: Same bar_number across different bar_state
  console.log('\n--- Strategy 2: Same bar_number, different bar_state ---')
  const byBarNumber = new Map<string, AttorneyRecord[]>()
  let strategy2Count = 0

  for (const a of attorneys) {
    if (!a.bar_number || !a.bar_state) continue
    // Normalize bar number (remove leading zeros, spaces)
    const normalizedBar = a.bar_number.trim().replace(/^0+/, '').toLowerCase()
    if (normalizedBar.length < 3) continue // skip very short bar numbers (likely false matches)

    const list = byBarNumber.get(normalizedBar) || []
    list.push(a)
    byBarNumber.set(normalizedBar, list)
  }

  for (const [barNum, list] of byBarNumber.entries()) {
    const barStates = new Set(list.map(a => a.bar_state))
    if (barStates.size < 2) continue
    if (list.length < 2) continue

    // Additional check: names should be similar (to avoid false positive on common numbers)
    const nameGroups = new Map<string, AttorneyRecord[]>()
    for (const a of list) {
      const norm = normalizeName(a.name)
      // Group by first 3 chars of normalized name (loose fuzzy match)
      const nameKey = norm.substring(0, Math.min(8, norm.length))
      const ng = nameGroups.get(nameKey) || []
      ng.push(a)
      nameGroups.set(nameKey, ng)
    }

    for (const [_nameKey, nameList] of nameGroups.entries()) {
      if (nameList.length < 2) continue

      const ids = nameList.map(a => a.id).sort().join(',')
      if (seen.has(ids)) continue
      seen.add(ids)

      groups.push({
        reason: 'bar_number',
        normalizedKey: `bar:${barNum}`,
        attorneys: nameList,
      })
      strategy2Count++
    }
  }

  console.log(`  Found ${strategy2Count} duplicate groups by bar_number`)

  return groups
}

// ============================================================================
// MERGE DUPLICATES
// ============================================================================

async function mergeDuplicates(groups: DuplicateGroup[]): Promise<{ merged: number; errors: number }> {
  let merged = 0
  let errors = 0

  for (const group of groups) {
    // Sort by data score desc — keep the one with the most data
    const sorted = [...group.attorneys].sort((a, b) => dataScore(b) - dataScore(a))
    const primary = sorted[0]
    const duplicates = sorted.slice(1)

    if (DRY_RUN) {
      console.log(`\n  [WOULD MERGE] ${group.reason}: "${group.normalizedKey}"`)
      console.log(`    Keep:  ${primary.name} (${primary.bar_state}, score=${dataScore(primary)}, id=${primary.id})`)
      for (const dup of duplicates) {
        console.log(`    Merge: ${dup.name} (${dup.bar_state}, score=${dataScore(dup)}, id=${dup.id})`)
      }
      merged++
      continue
    }

    if (!FIX_MODE) continue

    try {
      // 1. Add bar_admissions from duplicates to primary
      for (const dup of duplicates) {
        if (dup.bar_number && dup.bar_state) {
          const { error: barErr } = await supabase
            .from('bar_admissions')
            .upsert(
              {
                attorney_id: primary.id,
                state: dup.bar_state,
                bar_number: dup.bar_number,
                status: dup.bar_status || 'active',
                admission_date: dup.bar_admission_date || null,
                verified: dup.is_verified,
                source: 'deduplication',
              },
              { onConflict: 'attorney_id,state', ignoreDuplicates: true }
            )

          if (barErr) {
            console.error(`  Error adding bar admission for ${dup.id}:`, barErr.message)
          }
        }

        // 2. Fill in missing fields on primary from duplicate
        const fillFields: Partial<Record<keyof AttorneyRecord, unknown>> = {}
        if (!primary.email && dup.email) fillFields.email = dup.email
        if (!primary.phone && dup.phone) fillFields.phone = dup.phone
        if (!primary.website && dup.website) fillFields.website = dup.website
        if (!primary.law_school && dup.law_school) fillFields.law_school = dup.law_school
        if (!primary.description && dup.description) fillFields.description = dup.description
        if (!primary.bio && dup.bio) fillFields.bio = dup.bio
        if (!primary.primary_specialty_id && dup.primary_specialty_id) {
          fillFields.primary_specialty_id = dup.primary_specialty_id
        }

        if (Object.keys(fillFields).length > 0) {
          const { error: updateErr } = await supabase
            .from('attorneys')
            .update(fillFields)
            .eq('id', primary.id)

          if (updateErr) {
            console.error(`  Error enriching primary ${primary.id}:`, updateErr.message)
          }
        }

        // 3. Deactivate the duplicate (soft delete)
        const { error: deactivateErr } = await supabase
          .from('attorneys')
          .update({ is_active: false, noindex: true })
          .eq('id', dup.id)

        if (deactivateErr) {
          console.error(`  Error deactivating duplicate ${dup.id}:`, deactivateErr.message)
          errors++
        }
      }

      merged++

      if (merged % 50 === 0) {
        process.stdout.write(`\r  Merged: ${merged}/${groups.length}`)
      }
    } catch (err) {
      console.error(`  Error merging group "${group.normalizedKey}":`, err)
      errors++
    }
  }

  return { merged, errors }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== Attorney Deduplication (P2.12) ===')
  console.log(`Mode:  ${FIX_MODE ? 'FIX (will merge)' : DRY_RUN ? 'DRY RUN' : 'REPORT ONLY'}`)
  console.log(`Limit: ${LIMIT || 'all'}`)
  console.log()

  // 1. Load all attorneys
  const attorneys = await fetchAllAttorneys()
  if (attorneys.length === 0) {
    console.log('No attorneys found in DB.')
    return
  }

  // 2. Find duplicates
  const groups = findDuplicates(attorneys)

  if (groups.length === 0) {
    console.log('\nNo duplicates found.')
    return
  }

  // 3. Report
  console.log(`\n=== DUPLICATE GROUPS: ${groups.length} ===`)

  const byReason = new Map<string, number>()
  for (const g of groups) {
    byReason.set(g.reason, (byReason.get(g.reason) || 0) + 1)
  }
  for (const [reason, count] of byReason) {
    console.log(`  ${reason}: ${count} groups`)
  }

  const totalDuplicateRecords = groups.reduce(
    (sum, g) => sum + g.attorneys.length - 1, // subtract 1 for the primary
    0
  )
  console.log(`  Total records to merge/deactivate: ${totalDuplicateRecords}`)

  // Show first 10 groups as sample
  console.log('\n--- Sample duplicate groups (first 10) ---')
  for (const group of groups.slice(0, 10)) {
    console.log(`\n  [${group.reason}] "${group.normalizedKey}"`)
    for (const a of group.attorneys) {
      console.log(
        `    ${a.name} | ${a.bar_state} #${a.bar_number || 'N/A'} | ${a.address_city || '?'} | score=${dataScore(a)}`
      )
    }
  }

  // 4. Merge if --fix or --dry-run
  if (FIX_MODE || DRY_RUN) {
    console.log(`\n\n=== ${DRY_RUN ? 'DRY RUN' : 'MERGING'} ===`)
    const { merged, errors } = await mergeDuplicates(groups)
    console.log(`\n\n=== MERGE ${DRY_RUN ? '(DRY RUN) ' : ''}COMPLETE ===`)
    console.log(`  Groups processed: ${merged}`)
    console.log(`  Errors: ${errors}`)
  } else {
    console.log('\nRun with --dry-run to preview merges, or --fix to apply them.')
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
