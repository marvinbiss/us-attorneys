/**
 * Ohio Supreme Court Attorney Ingestion Script
 * Source: Ohio Supreme Court Attorney Directory
 * Records: ~90,000+ active attorneys
 * Cost: $0 (public search)
 *
 * Usage: npx tsx scripts/ingest/oh-attorneys.ts [--dry-run] [--limit 1000]
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

const OH_BAR_API = 'https://www.supremecourt.ohio.gov/AttorneySearch/api/search'
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

interface OHAttorney {
  attorneyNumber: string
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
  phone: string
  email: string
  status: string
  admissionDate: string
  lawSchool: string
  county: string
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
  return `${base}-oh-${barNumber}`
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

function mapStatus(s: string): string {
  const lower = (s || '').toLowerCase()
  if (lower.includes('active') && !lower.includes('inactive')) return 'active'
  if (lower.includes('inactive') || lower.includes('retired')) return 'inactive'
  if (lower.includes('suspend')) return 'suspended'
  if (lower.includes('disbar')) return 'disbarred'
  return 'inactive'
}

function parseDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (match) return `${match[3]}-${match[1]}-${match[2]}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  if (/^\d{4}$/.test(dateStr)) return `${dateStr}-01-01`
  return null
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchOHBarPage(lastNamePrefix: string, page: number = 1): Promise<OHAttorney[]> {
  const body = JSON.stringify({
    lastName: lastNamePrefix,
    firstName: '',
    attorneyNumber: '',
    city: '',
    state: '',
    zip: '',
    firm: '',
    page: page,
    pageSize: 100,
  })

  const res = await fetch(OH_BAR_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'USAttorneys-DataIngestion/1.0',
    },
    body,
  })

  if (!res.ok) {
    throw new Error(`OH Bar API ${res.status}: ${res.statusText}`)
  }

  const text = await res.text()
  try {
    const data = JSON.parse(text)
    return Array.isArray(data) ? data : data.results || data.attorneys || []
  } catch {
    return []
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== Ohio Supreme Court Attorney Ingestion ===')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${LIMIT === Infinity ? 'ALL' : LIMIT}`)
  console.log()

  // 1. Resolve OH state_id
  const { data: ohState, error: stateErr } = await supabase
    .from('states')
    .select('id')
    .eq('abbreviation', 'OH')
    .single()

  if (stateErr || !ohState) {
    console.error('OH state not found in DB. Run migration 401 first.')
    process.exit(1)
  }
  console.log(`OH state_id: ${ohState.id}`)

  // 2. Crawl
  console.log('\nFetching attorneys from OH Supreme Court...')
  const allAttorneys: OHAttorney[] = []
  const prefixes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  for (const letter of prefixes) {
    if (allAttorneys.length >= LIMIT) break

    let page = 1
    while (true) {
      try {
        const members = await fetchOHBarPage(letter, page)
        if (!members.length) break

        allAttorneys.push(...members)
        process.stdout.write(`  ${letter}: page ${page}, collected ${allAttorneys.length}\r`)

        if (members.length < 100) break
        if (allAttorneys.length >= LIMIT) break

        page++
        await sleep(300)
      } catch (err: any) {
        console.error(`\n  Error on ${letter} page ${page}: ${err.message}`)
        await sleep(2000)
        break
      }
    }
    console.log(`  ${letter}: collected ${allAttorneys.length}`)
  }

  console.log(`\nTotal collected: ${allAttorneys.length.toLocaleString()}`)

  if (allAttorneys.length === 0) {
    console.log('\nNo data from OH Bar API. May need Playwright scraper.')
    return
  }

  const usable = allAttorneys
    .filter(m => m.attorneyNumber && m.lastName && mapStatus(m.status) !== 'disbarred')
    .slice(0, LIMIT)

  console.log(`Usable records: ${usable.length.toLocaleString()}`)

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: first 3 records ---')
    usable.slice(0, 3).forEach((m, i) => {
      console.log(`\n[${i + 1}] ${m.firstName} ${m.lastName} (#${m.attorneyNumber})`)
      console.log(`    Status: ${m.status}, Admitted: ${m.admissionDate}`)
      console.log(`    Location: ${m.city}, ${m.state} ${m.zipCode}`)
    })
    console.log('\nDry run complete.')
    return
  }

  // 3. Upsert
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
        slug: makeSlug(firstName, lastName, m.attorneyNumber),
        first_name: firstName,
        last_name: lastName,
        email: m.email?.trim() || null,
        phone: normalizePhone(m.phone),
        bar_number: m.attorneyNumber.trim(),
        bar_state: 'OH',
        bar_status: mapStatus(m.status),
        bar_admission_date: parseDate(m.admissionDate),
        law_school: m.lawSchool?.trim() || null,
        firm_name: m.firmName?.trim() || null,
        address_line1: m.address1?.trim() || null,
        address_line2: m.address2?.trim() || null,
        address_city: m.city?.trim() || null,
        address_state: m.state?.trim() || null,
        address_zip: m.zipCode?.trim()?.substring(0, 5) || null,
        address_county: m.county?.trim() || null,
        state_id: ohState.id,
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

  // 4. Bar admissions
  console.log('\nInserting bar admissions...')
  for (let i = 0; i < usable.length; i += BATCH_SIZE) {
    const batch = usable.slice(i, i + BATCH_SIZE)
    const slugs = batch.map(m =>
      makeSlug((m.firstName || '').trim(), (m.lastName || '').trim(), m.attorneyNumber.trim())
    )

    const { data: existing } = await supabase
      .from('attorneys')
      .select('id, slug, bar_number')
      .in('slug', slugs)

    if (!existing?.length) continue

    await supabase
      .from('bar_admissions')
      .upsert(
        existing.map(a => ({
          attorney_id: a.id,
          state: 'OH',
          bar_number: a.bar_number,
          status: 'active',
          admission_date: null,
          verified: true,
          source: 'oh_supreme_court',
        })),
        { onConflict: 'attorney_id,state', ignoreDuplicates: true }
      )
  }

  console.log('\n=== INGESTION COMPLETE ===')
  console.log(`Inserted: ${inserted.toLocaleString()}`)
  console.log(`Errors:   ${errors}`)

  const { count } = await supabase
    .from('attorneys')
    .select('*', { count: 'exact', head: true })
    .eq('bar_state', 'OH')

  console.log(`\nTotal OH attorneys in DB: ${count?.toLocaleString() || 'unknown'}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
