/**
 * NY Open Data Attorney Ingestion Script
 * Source: https://data.ny.gov/Transparency/NYS-Attorney-Registrations/eqw2-r5nb
 * Records: ~429,438 attorneys
 * Cost: $0 (public dataset, no API key needed)
 *
 * Usage: npx tsx scripts/ingest/ny-attorneys.ts [--limit 1000] [--dry-run]
 */

import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse'
import { Readable } from 'stream'

// ============================================================================
// CONFIG
// ============================================================================

const NY_OPEN_DATA_CSV = 'https://data.ny.gov/api/views/eqw2-r5nb/rows.csv?accessType=DOWNLOAD'
const BATCH_SIZE = 500
const VALID_STATUSES = ['Currently registered', 'Delinquent', 'Retired']

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const LIMIT = (() => {
  const idx = args.indexOf('--limit')
  return idx !== -1 ? parseInt(args[idx + 1], 10) : Infinity
})()

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('Run: source .env.local && npx tsx scripts/ingest/ny-attorneys.ts')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ============================================================================
// TYPES
// ============================================================================

interface NYAttorneyRow {
  registration_number: string
  first_name: string
  middle_name: string
  last_name: string
  suffix: string
  company_name: string
  street_1: string
  street_2: string
  city: string
  state: string
  zip: string
  zip_plus_four: string
  country: string
  county: string
  phone_number: string
  year_admitted: string
  judicial_department_of_admission: string
  law_school: string
  status: string
  next_registration: string
}

interface AttorneyInsert {
  name: string
  slug: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  bar_number: string
  bar_state: string
  bar_status: string
  bar_admission_date: string | null
  law_school: string | null
  firm_name: string | null
  address_line1: string | null
  address_line2: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  address_county: string | null
  is_verified: boolean
  is_active: boolean
  noindex: boolean
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
  // Append bar number to ensure uniqueness
  return `${base}-ny-${barNumber}`
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

function mapStatus(nyStatus: string): string {
  const s = nyStatus.toLowerCase().trim()
  if (s.includes('currently registered')) return 'active'
  if (s.includes('delinquent')) return 'inactive'
  if (s.includes('retired')) return 'inactive'
  return 'inactive'
}

function isUsableRecord(row: NYAttorneyRow): boolean {
  // Must have name and registration number
  if (!row.last_name?.trim() || !row.registration_number?.trim()) return false
  // Must be in a useful status
  const status = row.status?.trim() || ''
  return VALID_STATUSES.some(s => status.toLowerCase().includes(s.toLowerCase()))
}

function transformRow(row: NYAttorneyRow): AttorneyInsert {
  const firstName = (row.first_name || '').trim()
  const lastName = (row.last_name || '').trim()
  const suffix = (row.suffix || '').trim()
  const fullName = [firstName, lastName, suffix].filter(Boolean).join(' ')
  const barNumber = row.registration_number.trim()

  return {
    name: fullName,
    slug: makeSlug(firstName, lastName, barNumber),
    first_name: firstName,
    last_name: lastName,
    email: null, // NY dataset doesn't include email
    phone: normalizePhone(row.phone_number),
    bar_number: barNumber,
    bar_state: 'NY',
    bar_status: mapStatus(row.status),
    bar_admission_date: row.year_admitted ? `${row.year_admitted}-01-01` : null,
    law_school: row.law_school?.trim() || null,
    firm_name: row.company_name?.trim() || null,
    address_line1: row.street_1?.trim() || null,
    address_line2: row.street_2?.trim() || null,
    address_city: row.city?.trim() || null,
    address_state: row.state?.trim() || null,
    address_zip: row.zip?.trim()?.substring(0, 5) || null,
    address_county: row.county?.trim() || null,
    is_verified: true, // Official state bar data
    is_active: mapStatus(row.status) === 'active',
    noindex: mapStatus(row.status) !== 'active',
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== NY Open Data Attorney Ingestion ===')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${LIMIT === Infinity ? 'ALL' : LIMIT}`)
  console.log()

  // 1. Resolve NY state_id
  const { data: nyState, error: stateErr } = await supabase
    .from('states')
    .select('id')
    .eq('abbreviation', 'NY')
    .single()

  if (stateErr || !nyState) {
    console.error('NY state not found in DB. Run migration 401 first.')
    process.exit(1)
  }
  console.log(`NY state_id: ${nyState.id}`)

  // 2. Download CSV
  console.log(`\nDownloading CSV from NY Open Data...`)
  const response = await fetch(NY_OPEN_DATA_CSV)
  if (!response.ok) {
    console.error(`HTTP ${response.status}: ${response.statusText}`)
    process.exit(1)
  }

  const csvText = await response.text()
  const sizeInMB = (Buffer.byteLength(csvText, 'utf8') / 1024 / 1024).toFixed(1)
  console.log(`Downloaded: ${sizeInMB} MB`)

  // 3. Parse CSV
  console.log('Parsing CSV...')
  const records: NYAttorneyRow[] = await new Promise((resolve, reject) => {
    const rows: NYAttorneyRow[] = []
    const parser = parse(csvText, {
      columns: (header: string[]) => header.map((h: string) =>
        h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      ),
      skip_empty_lines: true,
      trim: true,
    })
    parser.on('data', (row: NYAttorneyRow) => rows.push(row))
    parser.on('error', reject)
    parser.on('end', () => resolve(rows))
  })

  console.log(`Total rows parsed: ${records.length.toLocaleString()}`)

  // 4. Filter usable records
  const usable = records.filter(isUsableRecord).slice(0, LIMIT)
  console.log(`Usable records (after filter + limit): ${usable.length.toLocaleString()}`)

  const statusCounts: Record<string, number> = {}
  records.forEach(r => {
    const s = r.status?.trim() || 'EMPTY'
    statusCounts[s] = (statusCounts[s] || 0) + 1
  })
  console.log('\nStatus distribution:')
  Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => console.log(`  ${status}: ${count.toLocaleString()}`))

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: showing first 3 transformed records ---')
    usable.slice(0, 3).forEach((row, i) => {
      console.log(`\n[${i + 1}]`, JSON.stringify(transformRow(row), null, 2))
    })
    console.log('\nDry run complete. No data written.')
    return
  }

  // 5. Transform & upsert in batches
  console.log(`\nInserting ${usable.length.toLocaleString()} attorneys in batches of ${BATCH_SIZE}...`)

  let inserted = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < usable.length; i += BATCH_SIZE) {
    const batch = usable.slice(i, i + BATCH_SIZE)
    const attorneys = batch.map(row => {
      const a = transformRow(row)
      return {
        ...a,
        state_id: nyState.id,
      }
    })

    const { error } = await supabase
      .from('attorneys')
      .upsert(attorneys, {
        onConflict: 'slug',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message)
      errors += batch.length
    } else {
      inserted += batch.length
    }

    // Progress
    if ((i / BATCH_SIZE) % 20 === 0 || i + BATCH_SIZE >= usable.length) {
      const pct = Math.min(100, Math.round(((i + batch.length) / usable.length) * 100))
      console.log(`  ${pct}% — ${inserted.toLocaleString()} inserted, ${errors} errors`)
    }
  }

  // 6. Also insert into bar_admissions for cross-state tracking
  console.log('\nInserting bar admissions...')

  for (let i = 0; i < usable.length; i += BATCH_SIZE) {
    const batch = usable.slice(i, i + BATCH_SIZE)

    // Look up attorney IDs by slug
    const slugs = batch.map(row => {
      const firstName = (row.first_name || '').trim()
      const lastName = (row.last_name || '').trim()
      return makeSlug(firstName, lastName, row.registration_number.trim())
    })

    const { data: existingAttorneys } = await supabase
      .from('attorneys')
      .select('id, slug, bar_number')
      .in('slug', slugs)

    if (!existingAttorneys?.length) continue

    const barAdmissions = existingAttorneys.map(a => ({
      attorney_id: a.id,
      state: 'NY',
      bar_number: a.bar_number,
      status: 'active',
      admission_date: null,
      verified: true,
      source: 'ny_open_data',
    }))

    await supabase
      .from('bar_admissions')
      .upsert(barAdmissions, {
        onConflict: 'attorney_id,state',
        ignoreDuplicates: true,
      })
  }

  // 7. Summary
  console.log('\n=== INGESTION COMPLETE ===')
  console.log(`Inserted: ${inserted.toLocaleString()}`)
  console.log(`Errors:   ${errors}`)
  console.log(`Skipped:  ${skipped}`)

  // Verify count
  const { count } = await supabase
    .from('attorneys')
    .select('*', { count: 'exact', head: true })
    .eq('bar_state', 'NY')

  console.log(`\nTotal NY attorneys in DB: ${count?.toLocaleString() || 'unknown'}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
