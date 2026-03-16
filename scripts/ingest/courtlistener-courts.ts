/**
 * CourtListener Courts & Judges Ingestion Script
 * Source: https://www.courtlistener.com/api/rest/v4/
 * Cost: $0 (free API, 5000 req/hour authenticated)
 *
 * Ingests: All US courts (federal + state) into courthouses table
 *
 * Usage: npx tsx scripts/ingest/courtlistener-courts.ts [--dry-run]
 *
 * Prerequisites:
 *   1. Create free account at https://www.courtlistener.com/register/
 *   2. Get API token at https://www.courtlistener.com/profile/
 *   3. Set COURTLISTENER_API_TOKEN in .env.local
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

const CL_BASE = 'https://www.courtlistener.com/api/rest/v4'
const BATCH_SIZE = 100

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')

const CL_TOKEN = process.env.COURTLISTENER_API_TOKEN
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!CL_TOKEN) {
  console.error('Missing COURTLISTENER_API_TOKEN')
  console.error('1. Register at https://www.courtlistener.com/register/')
  console.error('2. Get token at https://www.courtlistener.com/profile/')
  console.error('3. Add COURTLISTENER_API_TOKEN=<token> to .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ============================================================================
// TYPES
// ============================================================================

interface CLCourt {
  id: string
  resource_uri: string
  date_modified: string
  in_use: boolean
  has_opinion_scraper: boolean
  has_oral_argument_scraper: boolean
  position: number
  citation_string: string
  short_name: string
  full_name: string
  url: string
  start_date: string
  end_date: string | null
  jurisdiction: string // 'F' (federal), 'FB' (bankruptcy), 'FBP', 'FS' (special), 'S' (state), 'SA' (state appellate), 'SS' (state supreme), 'ST' (state trial), etc.
}

interface CLResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
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

function mapCourtType(jurisdiction: string): string {
  const map: Record<string, string> = {
    'F': 'federal_district',
    'FB': 'bankruptcy',
    'FBP': 'bankruptcy',
    'FS': 'federal_special',
    'FD': 'federal_district',
    'C': 'federal_appellate',
    'S': 'state_supreme',
    'SA': 'state_appellate',
    'SS': 'state_supreme',
    'ST': 'state_trial',
    'SAG': 'state_trial',
    'SM': 'state_trial',
    'I': 'international',
    'T': 'tribal',
    'M': 'military',
  }
  return map[jurisdiction] || 'state_trial'
}

// Map CourtListener court IDs to state abbreviations (known patterns)
function extractStateFromCourt(court: CLCourt): string | null {
  const id = court.id.toLowerCase()

  // Federal district courts: e.g., "cacd" = CA Central District
  const federalDistrictMatch = id.match(/^([a-z]{2})[nsewm]?d$/)
  if (federalDistrictMatch) {
    return federalDistrictMatch[1].toUpperCase()
  }

  // State courts: often start with state abbreviation
  const stateCourtMatch = id.match(/^([a-z]{2})(?:sup|app|ct|dist|cir|just|prob|fam)/)
  if (stateCourtMatch) {
    return stateCourtMatch[1].toUpperCase()
  }

  // Bankruptcy: e.g., "canb" = CA Northern Bankruptcy
  const bankruptcyMatch = id.match(/^([a-z]{2})[nsewm]?b$/)
  if (bankruptcyMatch) {
    return bankruptcyMatch[1].toUpperCase()
  }

  return null
}

async function clFetch<T>(endpoint: string): Promise<CLResponse<T>> {
  const url = endpoint.startsWith('http') ? endpoint : `${CL_BASE}${endpoint}`
  const res = await fetch(url, {
    headers: {
      'Authorization': `Token ${CL_TOKEN}`,
      'Accept': 'application/json',
    },
  })
  if (!res.ok) {
    throw new Error(`CL API ${res.status}: ${res.statusText} — ${url}`)
  }
  return res.json()
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== CourtListener Courts Ingestion ===')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log()

  // 1. Load state mapping
  const { data: states } = await supabase
    .from('states')
    .select('id, abbreviation')

  if (!states?.length) {
    console.error('No states in DB. Run migration 401 first.')
    process.exit(1)
  }

  const stateMap = new Map(states.map(s => [s.abbreviation, s.id]))
  console.log(`Loaded ${stateMap.size} states`)

  // 2. Fetch all courts from CourtListener
  console.log('\nFetching courts from CourtListener...')
  let allCourts: CLCourt[] = []
  let nextUrl: string | null = '/courts/?format=json&page_size=100'

  while (nextUrl) {
    const data: CLResponse<CLCourt> = await clFetch<CLCourt>(nextUrl)
    allCourts = allCourts.concat(data.results)
    nextUrl = data.next
    process.stdout.write(`  Fetched ${allCourts.length} / ${data.count}\r`)
  }

  console.log(`\nTotal courts: ${allCourts.length}`)

  // 3. Filter and transform
  const activeCourts = allCourts.filter(c => c.in_use && !c.end_date)
  console.log(`Active courts: ${activeCourts.length}`)

  // Jurisdiction distribution
  const jurisdictionCounts: Record<string, number> = {}
  activeCourts.forEach(c => {
    jurisdictionCounts[c.jurisdiction] = (jurisdictionCounts[c.jurisdiction] || 0) + 1
  })
  console.log('\nJurisdiction distribution:')
  Object.entries(jurisdictionCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([j, count]) => console.log(`  ${j}: ${count}`))

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: showing first 5 courts ---')
    activeCourts.slice(0, 5).forEach((c, i) => {
      const stateAbbr = extractStateFromCourt(c)
      console.log(`\n[${i + 1}] ${c.full_name}`)
      console.log(`    ID: ${c.id}, Type: ${mapCourtType(c.jurisdiction)}, State: ${stateAbbr || 'N/A'}`)
      console.log(`    URL: ${c.url}`)
    })
    console.log('\nDry run complete.')
    return
  }

  // 4. Insert into courthouses
  console.log('\nInserting courthouses...')
  let inserted = 0
  let errors = 0

  for (let i = 0; i < activeCourts.length; i += BATCH_SIZE) {
    const batch = activeCourts.slice(i, i + BATCH_SIZE)

    const courthouses = batch.map(c => {
      const stateAbbr = extractStateFromCourt(c)
      const stateId = stateAbbr ? stateMap.get(stateAbbr) : null

      return {
        name: c.full_name,
        slug: slugify(c.full_name),
        court_type: mapCourtType(c.jurisdiction),
        website: c.url || null,
        state_id: stateId || null,
        courtlistener_id: c.id,
        is_active: true,
        jurisdiction: c.citation_string || null,
      }
    })

    const { error } = await supabase
      .from('courthouses')
      .upsert(courthouses, {
        onConflict: 'courtlistener_id',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error(`Batch error:`, error.message)
      errors += batch.length
    } else {
      inserted += batch.length
    }
  }

  console.log('\n=== INGESTION COMPLETE ===')
  console.log(`Inserted: ${inserted}`)
  console.log(`Errors:   ${errors}`)

  const { count } = await supabase
    .from('courthouses')
    .select('*', { count: 'exact', head: true })

  console.log(`Total courthouses in DB: ${count}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
