/**
 * Florida Bar Attorney Ingestion Script
 * Source: Florida Bar Member Directory API
 * Records: ~108,000 active attorneys
 * Cost: $0 (public API)
 *
 * The Florida Bar provides a public JSON API for member search.
 * We paginate through all members A-Z by last name prefix.
 *
 * Usage: npx tsx scripts/ingest/fl-attorneys.ts [--dry-run] [--limit 1000]
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

const FL_BAR_API = 'https://www.floridabar.org/directories/find-mbr/api/v1/member-search'
const BATCH_SIZE = 500

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const LIMIT = (() => {
  const idx = args.indexOf('--limit')
  return idx !== -1 ? parseInt(args[idx + 1], 10) : Infinity
})()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ============================================================================
// TYPES
// ============================================================================

interface FLBarMember {
  barNumber: string
  firstName: string
  middleName: string
  lastName: string
  suffix: string
  firmName: string
  address1: string
  address2: string
  city: string
  state: string
  zipCode: string
  county: string
  phone: string
  fax: string
  email: string
  website: string
  status: string // 'A' (Active), 'I' (Inactive), 'D' (Delinquent), etc.
  admissionDate: string
  sections: string[]
  certifications: string[]
  eligibleToRepresent: boolean
}

interface FLBarResponse {
  totalResults: number
  members: FLBarMember[]
}

// ============================================================================
// HELPERS
// ============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function makeSlug(first: string, last: string, barNumber: string): string {
  const base = slugify(`${first} ${last}`)
  return `${base}-fl-${barNumber}`
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

function mapStatus(flStatus: string): string {
  switch (flStatus?.toUpperCase()) {
    case 'A': return 'active'
    case 'I': return 'inactive'
    case 'D': return 'inactive' // delinquent
    case 'R': return 'inactive' // retired
    case 'S': return 'suspended'
    default: return 'inactive'
  }
}

function parseAdmissionDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  // FL Bar returns dates like "01/15/1995" or "1995-01-15"
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (match) return `${match[3]}-${match[1]}-${match[2]}`
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  return null
}

async function fetchFLBarPage(lastNamePrefix: string, page: number = 1): Promise<FLBarResponse> {
  const params = new URLSearchParams({
    searchType: 'N',
    lastName: lastNamePrefix,
    eligible: 'N',
    pageNumber: String(page),
    pageSize: '100',
  })

  const res = await fetch(`${FL_BAR_API}?${params}`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'USAttorneys-DataIngestion/1.0',
    },
  })

  if (!res.ok) {
    throw new Error(`FL Bar API ${res.status}: ${res.statusText}`)
  }

  return res.json()
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== Florida Bar Attorney Ingestion ===')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${LIMIT === Infinity ? 'ALL' : LIMIT}`)
  console.log()

  // 1. Resolve FL state_id
  const { data: flState, error: stateErr } = await supabase
    .from('states')
    .select('id')
    .eq('abbreviation', 'FL')
    .single()

  if (stateErr || !flState) {
    console.error('FL state not found in DB. Run migration 401 first.')
    process.exit(1)
  }
  console.log(`FL state_id: ${flState.id}`)

  // 2. Crawl all attorneys by last name prefix (A-Z)
  console.log('\nFetching attorneys from Florida Bar...')
  const allAttorneys: FLBarMember[] = []
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  for (const letter of alphabet) {
    if (allAttorneys.length >= LIMIT) break

    let page = 1
    let totalForLetter = 0

    while (true) {
      try {
        const data = await fetchFLBarPage(letter, page)
        if (page === 1) totalForLetter = data.totalResults

        if (!data.members?.length) break

        allAttorneys.push(...data.members)
        process.stdout.write(`  ${letter}: page ${page}, total ${totalForLetter}, collected ${allAttorneys.length}\r`)

        if (data.members.length < 100) break // last page
        if (allAttorneys.length >= LIMIT) break

        page++
        await sleep(200) // rate limiting: 5 req/sec
      } catch (err: any) {
        console.error(`\n  Error on ${letter} page ${page}: ${err.message}`)
        await sleep(2000)
        break // skip to next letter
      }
    }
    console.log(`  ${letter}: ${totalForLetter} total, collected ${allAttorneys.length}`)
  }

  console.log(`\nTotal collected: ${allAttorneys.length.toLocaleString()}`)

  // 3. Filter active/usable
  const usable = allAttorneys
    .filter(m => m.barNumber && m.lastName && ['A', 'D'].includes(m.status?.toUpperCase()))
    .slice(0, LIMIT)

  console.log(`Usable (active + delinquent): ${usable.length.toLocaleString()}`)

  // Status distribution
  const statusCounts: Record<string, number> = {}
  allAttorneys.forEach(m => {
    const s = m.status || 'UNKNOWN'
    statusCounts[s] = (statusCounts[s] || 0) + 1
  })
  console.log('\nStatus distribution:')
  Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([s, c]) => console.log(`  ${s}: ${c.toLocaleString()}`))

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: first 3 records ---')
    usable.slice(0, 3).forEach((m, i) => {
      console.log(`\n[${i + 1}] ${m.firstName} ${m.lastName} (Bar #${m.barNumber})`)
      console.log(`    Status: ${m.status}, Admitted: ${m.admissionDate}`)
      console.log(`    Firm: ${m.firmName || 'N/A'}`)
      console.log(`    Location: ${m.city}, ${m.state} ${m.zipCode}`)
      console.log(`    Email: ${m.email || 'N/A'}, Phone: ${m.phone || 'N/A'}`)
      console.log(`    Slug: ${makeSlug(m.firstName, m.lastName, m.barNumber)}`)
    })
    console.log('\nDry run complete.')
    return
  }

  // 4. Upsert attorneys
  console.log(`\nInserting ${usable.length.toLocaleString()} attorneys...`)
  let inserted = 0
  let errors = 0

  for (let i = 0; i < usable.length; i += BATCH_SIZE) {
    const batch = usable.slice(i, i + BATCH_SIZE)

    const attorneys = batch.map(m => {
      const firstName = (m.firstName || '').trim()
      const lastName = (m.lastName || '').trim()
      const suffix = (m.suffix || '').trim()
      const fullName = [firstName, lastName, suffix].filter(Boolean).join(' ')

      return {
        name: fullName,
        slug: makeSlug(firstName, lastName, m.barNumber),
        first_name: firstName,
        last_name: lastName,
        email: m.email?.trim() || null,
        phone: normalizePhone(m.phone),
        bar_number: m.barNumber.trim(),
        bar_state: 'FL',
        bar_status: mapStatus(m.status),
        bar_admission_date: parseAdmissionDate(m.admissionDate),
        law_school: null, // FL API doesn't expose this
        firm_name: m.firmName?.trim() || null,
        website: m.website?.trim() || null,
        address_line1: m.address1?.trim() || null,
        address_line2: m.address2?.trim() || null,
        address_city: m.city?.trim() || null,
        address_state: m.state?.trim() || null,
        address_zip: m.zipCode?.trim()?.substring(0, 5) || null,
        address_county: m.county?.trim() || null,
        state_id: flState.id,
        is_verified: true,
        is_active: mapStatus(m.status) === 'active',
        noindex: mapStatus(m.status) !== 'active',
      }
    })

    const { error } = await supabase
      .from('attorneys')
      .upsert(attorneys, { onConflict: 'slug', ignoreDuplicates: false })

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message)
      errors += batch.length
    } else {
      inserted += batch.length
    }

    if ((i / BATCH_SIZE) % 10 === 0 || i + BATCH_SIZE >= usable.length) {
      const pct = Math.min(100, Math.round(((i + batch.length) / usable.length) * 100))
      console.log(`  ${pct}% — ${inserted.toLocaleString()} inserted, ${errors} errors`)
    }
  }

  // 5. Bar admissions
  console.log('\nInserting bar admissions...')
  for (let i = 0; i < usable.length; i += BATCH_SIZE) {
    const batch = usable.slice(i, i + BATCH_SIZE)
    const slugs = batch.map(m =>
      makeSlug((m.firstName || '').trim(), (m.lastName || '').trim(), m.barNumber.trim())
    )

    const { data: existingAttorneys } = await supabase
      .from('attorneys')
      .select('id, slug, bar_number')
      .in('slug', slugs)

    if (!existingAttorneys?.length) continue

    const barAdmissions = existingAttorneys.map(a => ({
      attorney_id: a.id,
      state: 'FL',
      bar_number: a.bar_number,
      status: 'active',
      admission_date: null,
      verified: true,
      source: 'fl_bar_api',
    }))

    await supabase
      .from('bar_admissions')
      .upsert(barAdmissions, { onConflict: 'attorney_id,state', ignoreDuplicates: true })
  }

  // 6. Summary
  console.log('\n=== INGESTION COMPLETE ===')
  console.log(`Inserted: ${inserted.toLocaleString()}`)
  console.log(`Errors:   ${errors}`)

  const { count } = await supabase
    .from('attorneys')
    .select('*', { count: 'exact', head: true })
    .eq('bar_state', 'FL')

  console.log(`\nTotal FL attorneys in DB: ${count?.toLocaleString() || 'unknown'}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
