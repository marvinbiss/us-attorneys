/**
 * Multi-State Attorney Deduplication Script
 *
 * Detects and links duplicate attorney records across states using
 * canonical_attorney_id. Does NOT delete or deactivate — just links.
 *
 * Matching criteria (ranked by confidence):
 *   a. EXACT: same normalized name + same email           → very high confidence
 *   b. HIGH:  same normalized name + same phone           → high confidence
 *   c. MEDIUM: same normalized name + same city + overlapping practice areas
 *
 * Only HIGH+ confidence matches are applied by default.
 * Use --include-medium to also apply MEDIUM matches.
 *
 * Usage:
 *   npx tsx scripts/ingest/dedup-attorneys.ts --dry-run
 *   npx tsx scripts/ingest/dedup-attorneys.ts --dry-run --include-medium
 *   npx tsx scripts/ingest/dedup-attorneys.ts --apply [--limit 5000] [--state TX]
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

const BATCH_SIZE = 1000

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const APPLY = args.includes('--apply')
const INCLUDE_MEDIUM = args.includes('--include-medium')
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0
const stateIdx = args.indexOf('--state')
const STATE_FILTER = stateIdx !== -1 ? args[stateIdx + 1]?.toUpperCase() : null

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('Run: export $(grep -v "^#" .env.local | xargs)')
  process.exit(1)
}

if (!DRY_RUN && !APPLY) {
  console.error('Must specify --dry-run or --apply')
  console.error('Usage: npx tsx scripts/ingest/dedup-attorneys.ts --dry-run')
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
  canonical_attorney_id: string | null
  created_at: string
}

type ConfidenceLevel = 'EXACT' | 'HIGH' | 'MEDIUM'

interface DuplicateGroup {
  confidence: ConfidenceLevel
  reason: string
  matchKey: string
  attorneys: AttorneyRecord[]
}

// ============================================================================
// NAME NORMALIZATION
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
  n = n
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z\s]/g, '')       // keep only letters and spaces
    .replace(/\s+/g, ' ')           // collapse whitespace
    .trim()
  return n
}

function normalizePhone(phone: string): string {
  // Strip everything except digits
  const digits = phone.replace(/\D/g, '')
  // Remove leading 1 (US country code) if 11 digits
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.substring(1)
  }
  return digits
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

// ============================================================================
// DATA QUALITY SCORE
// ============================================================================

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
    'is_verified', 'years_experience', 'canonical_attorney_id', 'created_at',
  ].join(', ')

  while (hasMore) {
    let query = supabase
      .from('attorneys')
      .select(selectCols)
      .eq('is_active', true)
      .is('canonical_attorney_id', null) // skip already-linked duplicates
      .order('id', { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1)

    if (STATE_FILTER) {
      query = query.eq('bar_state', STATE_FILTER)
    }

    const { data, error } = await query

    if (error) {
      console.error(`Error fetching attorneys at offset ${offset}:`, error.message)
      break
    }

    if (!data || data.length === 0) {
      hasMore = false
    } else {
      allAttorneys.push(...(data as unknown as AttorneyRecord[]))
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

  console.log(`\r  Loaded ${allAttorneys.length.toLocaleString()} active, non-linked attorneys`)
  return allAttorneys
}

// ============================================================================
// FIND DUPLICATES
// ============================================================================

function findDuplicates(attorneys: AttorneyRecord[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = []
  // Track which attorney IDs are already in a group to avoid overlapping groups
  const assignedIds = new Set<string>()

  // ------------------------------------------------------------------
  // Strategy A: EXACT — same normalized name + same email
  // ------------------------------------------------------------------
  console.log('\n--- Strategy A: Same name + same email (EXACT) ---')
  const byNameEmail = new Map<string, AttorneyRecord[]>()

  for (const a of attorneys) {
    if (!a.email) continue
    const normalizedName = normalizeName(a.name)
    if (normalizedName.length < 4) continue

    const key = `${normalizedName}|${normalizeEmail(a.email)}`
    const list = byNameEmail.get(key) || []
    list.push(a)
    byNameEmail.set(key, list)
  }

  let exactCount = 0
  for (const [key, list] of Array.from(byNameEmail.entries())) {
    if (list.length < 2) continue
    // Filter out already-assigned
    const available = list.filter(a => !assignedIds.has(a.id))
    if (available.length < 2) continue

    for (const a of available) assignedIds.add(a.id)
    groups.push({
      confidence: 'EXACT',
      reason: 'name+email',
      matchKey: key,
      attorneys: available,
    })
    exactCount++
  }
  console.log(`  Found ${exactCount} duplicate groups`)

  // ------------------------------------------------------------------
  // Strategy B: HIGH — same normalized name + same phone
  // ------------------------------------------------------------------
  console.log('\n--- Strategy B: Same name + same phone (HIGH) ---')
  const byNamePhone = new Map<string, AttorneyRecord[]>()

  for (const a of attorneys) {
    if (!a.phone || assignedIds.has(a.id)) continue
    const normalizedName = normalizeName(a.name)
    if (normalizedName.length < 4) continue

    const normalizedPhoneVal = normalizePhone(a.phone)
    if (normalizedPhoneVal.length < 7) continue // skip invalid phones

    const key = `${normalizedName}|${normalizedPhoneVal}`
    const list = byNamePhone.get(key) || []
    list.push(a)
    byNamePhone.set(key, list)
  }

  let highCount = 0
  for (const [key, list] of Array.from(byNamePhone.entries())) {
    if (list.length < 2) continue
    const available = list.filter(a => !assignedIds.has(a.id))
    if (available.length < 2) continue

    for (const a of available) assignedIds.add(a.id)
    groups.push({
      confidence: 'HIGH',
      reason: 'name+phone',
      matchKey: key,
      attorneys: available,
    })
    highCount++
  }
  console.log(`  Found ${highCount} duplicate groups`)

  // ------------------------------------------------------------------
  // Strategy C: MEDIUM — same name + same city + overlapping practice areas
  // ------------------------------------------------------------------
  console.log('\n--- Strategy C: Same name + same city + same specialty (MEDIUM) ---')
  const byNameCitySpecialty = new Map<string, AttorneyRecord[]>()

  for (const a of attorneys) {
    if (!a.address_city || !a.primary_specialty_id || assignedIds.has(a.id)) continue
    const normalizedName = normalizeName(a.name)
    if (normalizedName.length < 4) continue

    const key = `${normalizedName}|${a.address_city.toLowerCase().trim()}|${a.primary_specialty_id}`
    const list = byNameCitySpecialty.get(key) || []
    list.push(a)
    byNameCitySpecialty.set(key, list)
  }

  let mediumCount = 0
  for (const [key, list] of Array.from(byNameCitySpecialty.entries())) {
    if (list.length < 2) continue
    // For MEDIUM, require different bar_state to confirm multi-state
    const barStates = new Set(list.filter(a => a.bar_state).map(a => a.bar_state))
    if (barStates.size < 2) continue

    const available = list.filter(a => !assignedIds.has(a.id))
    if (available.length < 2) continue

    for (const a of available) assignedIds.add(a.id)
    groups.push({
      confidence: 'MEDIUM',
      reason: 'name+city+specialty',
      matchKey: key,
      attorneys: available,
    })
    mediumCount++
  }
  console.log(`  Found ${mediumCount} duplicate groups`)

  return groups
}

// ============================================================================
// LINK DUPLICATES
// ============================================================================

async function linkDuplicates(groups: DuplicateGroup[]): Promise<{
  linked: number
  barAdmissionsAdded: number
  skipped: number
  errors: number
}> {
  let linked = 0
  let barAdmissionsAdded = 0
  let skipped = 0
  let errors = 0

  // Filter by confidence
  const eligible = groups.filter(g => {
    if (g.confidence === 'EXACT' || g.confidence === 'HIGH') return true
    if (g.confidence === 'MEDIUM' && INCLUDE_MEDIUM) return true
    return false
  })

  const skippedMedium = groups.length - eligible.length
  if (skippedMedium > 0) {
    console.log(`  Skipping ${skippedMedium} MEDIUM-confidence groups (use --include-medium to include)`)
  }

  for (const group of eligible) {
    // Pick canonical: highest data score, then earliest created_at as tiebreaker
    const sorted = [...group.attorneys].sort((a, b) => {
      const scoreDiff = dataScore(b) - dataScore(a)
      if (scoreDiff !== 0) return scoreDiff
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    const canonical = sorted[0]
    const duplicates = sorted.slice(1)

    if (DRY_RUN) {
      console.log(`\n  [${group.confidence}] ${group.reason}: "${group.matchKey}"`)
      console.log(`    Canonical: ${canonical.name} (${canonical.bar_state}, score=${dataScore(canonical)}, id=${canonical.id.substring(0, 8)})`)
      for (const dup of duplicates) {
        console.log(`    Duplicate: ${dup.name} (${dup.bar_state}, score=${dataScore(dup)}, id=${dup.id.substring(0, 8)})`)
      }
      linked++
      continue
    }

    if (!APPLY) {
      skipped++
      continue
    }

    try {
      for (const dup of duplicates) {
        // 1. Set canonical_attorney_id on the duplicate
        const { error: linkErr } = await supabase
          .from('attorneys')
          .update({ canonical_attorney_id: canonical.id })
          .eq('id', dup.id)

        if (linkErr) {
          console.error(`  Error linking ${dup.id} -> ${canonical.id}:`, linkErr.message)
          errors++
          continue
        }

        // 2. Copy bar_admissions from duplicate to canonical
        if (dup.bar_number && dup.bar_state) {
          const { error: barErr } = await supabase
            .from('bar_admissions')
            .upsert(
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

          if (barErr) {
            console.error(`  Error adding bar admission for ${dup.id}:`, barErr.message)
          } else {
            barAdmissionsAdded++
          }
        }

        // 3. Also ensure canonical's own bar admission is recorded
        if (canonical.bar_number && canonical.bar_state) {
          await supabase
            .from('bar_admissions')
            .upsert(
              {
                attorney_id: canonical.id,
                state: canonical.bar_state,
                bar_number: canonical.bar_number,
                status: canonical.bar_status || 'active',
                admission_date: canonical.bar_admission_date || null,
                verified: canonical.is_verified,
                source: 'deduplication',
              },
              { onConflict: 'attorney_id,state', ignoreDuplicates: true }
            )
        }

        // 4. Fill missing fields on canonical from duplicate
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
          const { error: updateErr } = await supabase
            .from('attorneys')
            .update(fillFields)
            .eq('id', canonical.id)

          if (updateErr) {
            console.error(`  Error enriching canonical ${canonical.id}:`, updateErr.message)
          }
        }
      }

      linked++

      if (linked % 50 === 0) {
        process.stdout.write(`\r  Linked: ${linked}/${eligible.length}`)
      }
    } catch (err) {
      console.error(`  Error processing group "${group.matchKey}":`, err)
      errors++
    }
  }

  return { linked, barAdmissionsAdded, skipped, errors }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== Multi-State Attorney Deduplication ===')
  console.log(`Mode:     ${APPLY ? 'APPLY (will link duplicates)' : 'DRY RUN (report only)'}`)
  console.log(`Medium:   ${INCLUDE_MEDIUM ? 'INCLUDED' : 'EXCLUDED (use --include-medium)'}`)
  console.log(`State:    ${STATE_FILTER || 'all'}`)
  console.log(`Limit:    ${LIMIT || 'all'}`)
  console.log()

  // 1. Load attorneys
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

  // 3. Report summary
  console.log(`\n=== DUPLICATE GROUPS: ${groups.length} ===`)

  const byConfidence = new Map<ConfidenceLevel, number>()
  for (const g of groups) {
    byConfidence.set(g.confidence, (byConfidence.get(g.confidence) || 0) + 1)
  }
  for (const [confidence, count] of Array.from(byConfidence.entries())) {
    console.log(`  ${confidence}: ${count} groups`)
  }

  const totalDuplicateRecords = groups.reduce(
    (sum, g) => sum + g.attorneys.length - 1,
    0
  )
  console.log(`  Total duplicate records to link: ${totalDuplicateRecords}`)

  // Show sample groups
  console.log('\n--- Sample duplicate groups (first 15) ---')
  for (const group of groups.slice(0, 15)) {
    console.log(`\n  [${group.confidence}] ${group.reason}: "${group.matchKey}"`)
    for (const a of group.attorneys) {
      console.log(
        `    ${a.name} | ${a.bar_state} #${a.bar_number || 'N/A'} | ${a.address_city || '?'} | email=${a.email || 'N/A'} | score=${dataScore(a)}`
      )
    }
  }

  // 4. Link
  if (DRY_RUN || APPLY) {
    console.log(`\n\n=== ${DRY_RUN ? 'DRY RUN' : 'LINKING DUPLICATES'} ===`)
    const stats = await linkDuplicates(groups)
    console.log(`\n\n=== ${DRY_RUN ? 'DRY RUN ' : ''}COMPLETE ===`)
    console.log(`  Groups processed:     ${stats.linked}`)
    console.log(`  Bar admissions added:  ${stats.barAdmissionsAdded}`)
    console.log(`  Skipped:              ${stats.skipped}`)
    console.log(`  Errors:               ${stats.errors}`)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
