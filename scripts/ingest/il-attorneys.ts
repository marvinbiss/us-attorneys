/**
 * Illinois ARDC Attorney Ingestion Script
 * Source: Illinois Attorney Registration & Disciplinary Commission (ARDC)
 * Records: ~95,000+ active attorneys
 * Cost: $0 (public search)
 *
 * ARDC provides a public lawyer search at https://www.iardc.org/lawyersearch.asp
 * Their API returns JSON when queried with appropriate headers.
 *
 * Usage: npx tsx scripts/ingest/il-attorneys.ts [--dry-run] [--limit 1000]
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

const ARDC_SEARCH = 'https://www.iardc.org/lawyersearch/SearchResults'
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

interface ILAttorney {
  ardc_number: string
  first_name: string
  middle_name: string
  last_name: string
  suffix: string
  firm_name: string
  address1: string
  address2: string
  city: string
  state: string
  zip: string
  phone: string
  email: string
  status: string
  date_admitted: string
  law_school: string
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

function makeSlug(first: string, last: string, ardcNumber: string): string {
  const base = slugify(`${first} ${last}`)
  return `${base}-il-${ardcNumber}`
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

function mapStatus(s: string): string {
  const lower = (s || '').toLowerCase().trim()
  if (lower.includes('active') || lower.includes('authorized')) return 'active'
  if (lower.includes('inactive') || lower.includes('retired') || lower.includes('voluntar')) return 'inactive'
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

async function fetchARDCPage(lastNamePrefix: string, page: number = 1): Promise<ILAttorney[]> {
  const body = new URLSearchParams({
    lastName: lastNamePrefix,
    firstName: '',
    middleName: '',
    ardcNumber: '',
    city: '',
    state: '',
    zip: '',
    firm: '',
    page: String(page),
    pageSize: '100',
  })

  const res = await fetch(ARDC_SEARCH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': 'USAttorneys-DataIngestion/1.0',
    },
    body: body.toString(),
  })

  if (!res.ok) {
    throw new Error(`ARDC API ${res.status}: ${res.statusText}`)
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
  console.log('=== Illinois ARDC Attorney Ingestion ===')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${LIMIT === Infinity ? 'ALL' : LIMIT}`)
  console.log()

  // 1. Resolve IL state_id
  const { data: ilState, error: stateErr } = await supabase
    .from('states')
    .select('id')
    .eq('abbreviation', 'IL')
    .single()

  if (stateErr || !ilState) {
    console.error('IL state not found in DB. Run migration 401 first.')
    process.exit(1)
  }
  console.log(`IL state_id: ${ilState.id}`)

  // 2. Crawl by last name prefix
  console.log('\nFetching attorneys from ARDC...')
  const allAttorneys: ILAttorney[] = []
  const prefixes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  for (const letter of prefixes) {
    if (allAttorneys.length >= LIMIT) break

    let page = 1
    while (true) {
      try {
        const members = await fetchARDCPage(letter, page)
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
    console.log('\nNo data from ARDC search API.')
    console.log('The ARDC may require browser-based access.')
    console.log('Consider: Playwright scraper or CourtListener party data.')
    return
  }

  // 3. Filter
  const usable = allAttorneys
    .filter(m => m.ardc_number && m.last_name && mapStatus(m.status) !== 'disbarred')
    .slice(0, LIMIT)

  console.log(`Usable records: ${usable.length.toLocaleString()}`)

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: first 3 records ---')
    usable.slice(0, 3).forEach((m, i) => {
      console.log(`\n[${i + 1}] ${m.first_name} ${m.last_name} (ARDC #${m.ardc_number})`)
      console.log(`    Status: ${m.status}, Admitted: ${m.date_admitted}`)
      console.log(`    Firm: ${m.firm_name || 'N/A'}, School: ${m.law_school || 'N/A'}`)
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
      const firstName = (m.first_name || '').trim()
      const lastName = (m.last_name || '').trim()
      const suffix = (m.suffix || '').trim()
      const fullName = [firstName, lastName, suffix].filter(Boolean).join(' ')

      return {
        name: fullName,
        slug: makeSlug(firstName, lastName, m.ardc_number),
        first_name: firstName,
        last_name: lastName,
        email: m.email?.trim() || null,
        phone: normalizePhone(m.phone),
        bar_number: m.ardc_number.trim(),
        bar_state: 'IL',
        bar_status: mapStatus(m.status),
        bar_admission_date: parseDate(m.date_admitted),
        law_school: m.law_school?.trim() || null,
        firm_name: m.firm_name?.trim() || null,
        address_line1: m.address1?.trim() || null,
        address_line2: m.address2?.trim() || null,
        address_city: m.city?.trim() || null,
        address_state: m.state?.trim() || null,
        address_zip: m.zip?.trim()?.substring(0, 5) || null,
        address_county: m.county?.trim() || null,
        state_id: ilState.id,
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
      makeSlug((m.first_name || '').trim(), (m.last_name || '').trim(), m.ardc_number.trim())
    )

    const { data: existingAttorneys } = await supabase
      .from('attorneys')
      .select('id, slug, bar_number')
      .in('slug', slugs)

    if (!existingAttorneys?.length) continue

    const barAdmissions = existingAttorneys.map(a => ({
      attorney_id: a.id,
      state: 'IL',
      bar_number: a.bar_number,
      status: 'active',
      admission_date: null,
      verified: true,
      source: 'il_ardc',
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
    .eq('bar_state', 'IL')

  console.log(`\nTotal IL attorneys in DB: ${count?.toLocaleString() || 'unknown'}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
