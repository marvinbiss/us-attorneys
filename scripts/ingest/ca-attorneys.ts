/**
 * California State Bar Attorney Ingestion Script
 * Source: California State Bar Public Records
 * Records: ~190,000+ active attorneys (largest state bar in US)
 * Cost: $0 (public API)
 *
 * The California State Bar provides a public search API.
 * Unlike NY (CSV bulk download), CA requires paginated API queries.
 * We use their licensee search JSON endpoint.
 *
 * Usage: npx tsx scripts/ingest/ca-attorneys.ts [--dry-run] [--limit 1000]
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

// CalBar has a public search API that returns JSON
const CALBAR_API = 'https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch'
const CALBAR_DETAIL = 'https://apps.calbar.ca.gov/attorney/Licensee/Detail'
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

interface CABarMember {
  barNumber: string
  name: string
  firstName: string
  lastName: string
  middleName: string
  status: string // 'Active', 'Inactive', 'Not Eligible To Practice Law', etc.
  city: string
  state: string
  zip: string
  county: string
  phone: string
  fax: string
  email: string
  website: string
  admitDate: string
  lawSchool: string
  sections: string[]
  address1: string
  address2: string
  firmName: string
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
  return `${base}-ca-${barNumber}`
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

function mapStatus(caStatus: string): string {
  const s = (caStatus || '').toLowerCase()
  if (s.includes('active') && !s.includes('inactive')) return 'active'
  if (s.includes('inactive') || s.includes('not eligible') || s.includes('voluntar')) return 'inactive'
  if (s.includes('suspend')) return 'suspended'
  if (s.includes('disbar')) return 'disbarred'
  return 'inactive'
}

function parseDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (match) return `${match[3]}-${match[1]}-${match[2]}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  return null
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Strategy: CalBar search by bar number ranges.
 * CA bar numbers are sequential, roughly 10000 - 350000+.
 * We can query sequential ranges to get all attorneys.
 */
async function fetchCalBarByNumber(barNumber: number): Promise<CABarMember | null> {
  const url = `${CALBAR_DETAIL}/${barNumber}`

  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'USAttorneys-DataIngestion/1.0',
      },
    })

    if (!res.ok) return null

    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  } catch {
    return null
  }
}

/**
 * Alternative: Search by last name prefix for batch retrieval
 */
async function fetchCalBarSearch(lastName: string, page: number = 1): Promise<CABarMember[]> {
  const params = new URLSearchParams({
    lastName: lastName,
    firstName: '',
    barNumber: '',
    city: '',
    state: '',
    zip: '',
    freeText: '',
    pageNumber: String(page),
    pageSize: '100',
    sort: 'name',
  })

  const res = await fetch(`${CALBAR_API}?${params}`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'USAttorneys-DataIngestion/1.0',
    },
  })

  if (!res.ok) return []

  const text = await res.text()
  try {
    const data = JSON.parse(text)
    return Array.isArray(data) ? data : data.attorneys || data.results || data.licensees || []
  } catch {
    return []
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== California State Bar Attorney Ingestion ===')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${LIMIT === Infinity ? 'ALL' : LIMIT}`)
  console.log()

  // 1. Resolve CA state_id
  const { data: caState, error: stateErr } = await supabase
    .from('states')
    .select('id')
    .eq('abbreviation', 'CA')
    .single()

  if (stateErr || !caState) {
    console.error('CA state not found in DB. Run migration 401 first.')
    process.exit(1)
  }
  console.log(`CA state_id: ${caState.id}`)

  // 2. Crawl by last name prefix
  console.log('\nFetching attorneys from CalBar...')
  console.log('(CA is the largest bar — this may take a while)')
  const allAttorneys: CABarMember[] = []

  // Two-letter prefixes for finer granularity (CA has many attorneys per letter)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const prefixes: string[] = []
  for (const a of alphabet) {
    for (const b of alphabet) {
      prefixes.push(`${a}${b}`)
    }
  }

  let prefixIdx = 0
  for (const prefix of prefixes) {
    if (allAttorneys.length >= LIMIT) break
    prefixIdx++

    let page = 1
    while (true) {
      try {
        const members = await fetchCalBarSearch(prefix, page)
        if (!members.length) break

        allAttorneys.push(...members)

        if (members.length < 100) break
        if (allAttorneys.length >= LIMIT) break

        page++
        await sleep(250)
      } catch (err: any) {
        console.error(`  Error on ${prefix} page ${page}: ${err.message}`)
        await sleep(2000)
        break
      }
    }

    // Progress every 26 prefixes (~1 letter)
    if (prefixIdx % 26 === 0) {
      const letter = prefix[0]
      console.log(`  ${letter}*: ${allAttorneys.length.toLocaleString()} collected (${Math.round(prefixIdx / prefixes.length * 100)}%)`)
    }
  }

  console.log(`\nTotal collected: ${allAttorneys.length.toLocaleString()}`)

  if (allAttorneys.length === 0) {
    console.log('\nNo data from CalBar search API.')
    console.log('CalBar may block automated requests.')
    console.log('Alternatives:')
    console.log('  1. Use Playwright browser automation')
    console.log('  2. Request bulk data from CalBar directly')
    console.log('  3. Use CourtListener party data for CA attorneys')
    return
  }

  // 3. Filter
  const usable = allAttorneys
    .filter(m => m.barNumber && m.lastName && mapStatus(m.status) !== 'disbarred')
    .slice(0, LIMIT)

  console.log(`Usable records: ${usable.length.toLocaleString()}`)

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
      console.log(`    Status: ${m.status}, Admitted: ${m.admitDate}`)
      console.log(`    Firm: ${m.firmName || 'N/A'}, School: ${m.lawSchool || 'N/A'}`)
      console.log(`    Location: ${m.city}, ${m.state} ${m.zip}`)
    })
    console.log('\nDry run complete.')
    return
  }

  // 4. Upsert
  console.log(`\nInserting ${usable.length.toLocaleString()} attorneys...`)
  let inserted = 0
  let errors = 0

  for (let i = 0; i < usable.length; i += BATCH_SIZE) {
    const batch = usable.slice(i, i + BATCH_SIZE)

    const attorneys = batch.map(m => {
      const firstName = (m.firstName || '').trim()
      const lastName = (m.lastName || '').trim()
      const fullName = (m.name || `${firstName} ${lastName}`).trim()

      return {
        name: fullName,
        slug: makeSlug(firstName, lastName, m.barNumber),
        first_name: firstName,
        last_name: lastName,
        email: m.email?.trim() || null,
        phone: normalizePhone(m.phone),
        website: m.website?.trim() || null,
        bar_number: m.barNumber.trim(),
        bar_state: 'CA',
        bar_status: mapStatus(m.status),
        bar_admission_date: parseDate(m.admitDate),
        law_school: m.lawSchool?.trim() || null,
        firm_name: m.firmName?.trim() || null,
        address_line1: m.address1?.trim() || null,
        address_line2: m.address2?.trim() || null,
        address_city: m.city?.trim() || null,
        address_state: m.state?.trim() || null,
        address_zip: m.zip?.trim()?.substring(0, 5) || null,
        address_county: m.county?.trim() || null,
        state_id: caState.id,
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
      state: 'CA',
      bar_number: a.bar_number,
      status: 'active',
      admission_date: null,
      verified: true,
      source: 'calbar_api',
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
    .eq('bar_state', 'CA')

  console.log(`\nTotal CA attorneys in DB: ${count?.toLocaleString() || 'unknown'}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
