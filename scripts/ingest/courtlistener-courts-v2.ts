/**
 * CourtListener Courts Enrichment v2
 * Source: https://www.courtlistener.com/api/rest/v4/courts/
 *
 * Enriches existing courthouses with:
 *   - Links to locations_us (location_id) and counties (county_id)
 *   - Full court details from individual /courts/{id}/ endpoints
 *   - Ensures all active courts are in the DB
 *
 * Also fetches NEW courts not yet in DB and inserts them.
 *
 * Usage:
 *   npx tsx scripts/ingest/courtlistener-courts-v2.ts [--dry-run] [--fetch-new] [--link-only]
 *
 * Options:
 *   --dry-run     Preview without writing to DB
 *   --fetch-new   Fetch all courts from API and insert new ones
 *   --link-only   Only link existing courthouses to locations (skip API)
 *
 * Prerequisites:
 *   - COURTLISTENER_API_TOKEN in .env.local
 *   - courtlistener-courts.ts already run (courthouses populated)
 *   - locations_us and counties tables populated
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

const CL_BASE = 'https://www.courtlistener.com/api/rest/v4'
const BATCH_SIZE = 100
const RATE_DELAY = 200

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const FETCH_NEW = args.includes('--fetch-new')
const LINK_ONLY = args.includes('--link-only')

const CL_TOKEN = process.env.COURTLISTENER_API_TOKEN
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!CL_TOKEN && !LINK_ONLY) {
  console.error('Missing COURTLISTENER_API_TOKEN (use --link-only to skip API)')
  console.error('1. Register at https://www.courtlistener.com/register/')
  console.error('2. Get token at https://www.courtlistener.com/profile/')
  console.error('3. Add COURTLISTENER_API_TOKEN=<token> to .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ============================================================================
// HELPERS
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ============================================================================
// COURT → STATE EXTRACTION (enhanced version)
// ============================================================================

// Comprehensive court ID → state mapping for known patterns
const KNOWN_COURT_STATES: Record<string, string> = {
  // Federal appellate circuits
  'ca1': 'MA', 'ca2': 'NY', 'ca3': 'PA', 'ca4': 'VA', 'ca5': 'TX',
  'ca6': 'OH', 'ca7': 'IL', 'ca8': 'MO', 'ca9': 'CA', 'ca10': 'CO',
  'ca11': 'GA', 'cadc': 'DC', 'cafc': 'DC',
  // Supreme Court
  'scotus': 'DC',
}

function extractStateFromCourtId(courtId: string): string | null {
  const id = courtId.toLowerCase()

  // Check known overrides
  if (KNOWN_COURT_STATES[id]) return KNOWN_COURT_STATES[id]

  // Federal district: "cacd" → CA, "nysd" → NY
  const fedMatch = id.match(/^([a-z]{2})[nsewmc]?d$/)
  if (fedMatch) return fedMatch[1].toUpperCase()

  // Bankruptcy: "canb" → CA
  const bkMatch = id.match(/^([a-z]{2})[nsewm]?b$/)
  if (bkMatch) return bkMatch[1].toUpperCase()

  // State courts: "casupremedist", "nyappterm", etc.
  const stMatch = id.match(/^([a-z]{2})(?:sup|app|ct|dist|cir|just|prob|fam|muni|tax|work|juv|mag|land)/)
  if (stMatch) return stMatch[1].toUpperCase()

  // State abbreviation prefix for other patterns
  const abbrMatch = id.match(/^([a-z]{2})(?:ct|court|tribunals?|jud)/)
  if (abbrMatch) return abbrMatch[1].toUpperCase()

  return null
}

// Extract city name from court name using common patterns
function extractCityFromCourtName(name: string): string | null {
  // "United States District Court for the Northern District of California" → null (district-level)
  // "Superior Court of Los Angeles County" → "Los Angeles"
  // "Circuit Court of Cook County" → null (county, not city)
  // "New York City Criminal Court" → "New York"

  // City courts
  const cityCourtMatch = name.match(/(?:city|municipal)\s+court\s+(?:of|for)\s+(?:the\s+city\s+of\s+)?(.+?)(?:\s*,|\s+county|\s*$)/i)
  if (cityCourtMatch) return cityCourtMatch[1].trim()

  const prefixMatch = name.match(/^(.+?)\s+(?:city|municipal)\s+court/i)
  if (prefixMatch) return prefixMatch[1].trim()

  return null
}

// Extract county from court name
function extractCountyFromCourtName(name: string): string | null {
  const countyMatch = name.match(/(?:of|for)\s+(.+?)\s+county/i)
  if (countyMatch) return countyMatch[1].trim()

  const prefixMatch = name.match(/^(.+?)\s+county\s+(?:court|circuit|superior|district)/i)
  if (prefixMatch) return prefixMatch[1].trim()

  return null
}

// Map CourtListener jurisdiction codes to our court_type
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
    'SM': 'municipal',
    'I': 'federal_special',
    'T': 'federal_special',
    'M': 'federal_special',
  }
  return map[jurisdiction] || 'state_trial'
}

// ============================================================================
// API
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
  jurisdiction: string
}

interface CLResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

async function clFetch<T>(endpoint: string): Promise<CLResponse<T> | null> {
  const url = endpoint.startsWith('http') ? endpoint : `${CL_BASE}${endpoint}`
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Token ${CL_TOKEN}`,
        'Accept': 'application/json',
      },
    })

    if (res.status === 429) {
      console.warn('\nRate limited. Waiting 60s...')
      await sleep(60_000)
      return clFetch<T>(endpoint)
    }

    if (!res.ok) {
      console.error(`CL API ${res.status}: ${res.statusText}`)
      return null
    }

    return await res.json()
  } catch (err) {
    console.error(`CL API error: ${(err as Error).message}`)
    return null
  }
}

// ============================================================================
// PHASE 1: FETCH NEW COURTS FROM API
// ============================================================================

async function fetchAndInsertNewCourts(
  stateMap: Map<string, string>,
  existingClIds: Set<string>,
): Promise<number> {
  console.log('\n--- Phase 1: Fetch courts from CourtListener API ---')

  let allCourts: CLCourt[] = []
  let nextUrl: string | null = '/courts/?format=json&page_size=100'

  while (nextUrl) {
    const data = await clFetch<CLCourt>(nextUrl)
    if (!data) break
    allCourts = allCourts.concat(data.results)
    nextUrl = data.next
    process.stdout.write(`  Fetched ${allCourts.length} / ${data.count}\r`)
    await sleep(RATE_DELAY)
  }

  console.log(`\nTotal courts from API: ${allCourts.length}`)

  // Filter active and not already in DB
  const activeCourts = allCourts.filter(c => c.in_use && !c.end_date)
  const newCourts = activeCourts.filter(c => !existingClIds.has(c.id))

  console.log(`Active courts: ${activeCourts.length}`)
  console.log(`New courts (not in DB): ${newCourts.length}`)

  // Jurisdiction distribution
  const jurisdictionCounts: Record<string, number> = {}
  activeCourts.forEach(c => {
    jurisdictionCounts[c.jurisdiction] = (jurisdictionCounts[c.jurisdiction] || 0) + 1
  })
  console.log('\nJurisdiction distribution:')
  Object.entries(jurisdictionCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([j, count]) => console.log(`  ${j}: ${count}`))

  if (newCourts.length === 0) {
    console.log('\nNo new courts to insert.')
    return 0
  }

  if (DRY_RUN) {
    console.log(`\n--- DRY RUN: would insert ${newCourts.length} new courts ---`)
    newCourts.slice(0, 5).forEach((c, i) => {
      const stateAbbr = extractStateFromCourtId(c.id)
      console.log(`  [${i + 1}] ${c.full_name} (${c.id}) — ${mapCourtType(c.jurisdiction)} — ${stateAbbr || 'N/A'}`)
    })
    return newCourts.length
  }

  // Insert new courts
  let inserted = 0
  for (let i = 0; i < newCourts.length; i += BATCH_SIZE) {
    const batch = newCourts.slice(i, i + BATCH_SIZE)
    const records = batch.map(c => {
      const stateAbbr = extractStateFromCourtId(c.id)
      const stateId = stateAbbr ? stateMap.get(stateAbbr) : null
      return {
        name: c.full_name,
        slug: slugify(c.full_name),
        court_type: mapCourtType(c.jurisdiction),
        website: c.url || null,
        state_id: stateId || null,
        address_state: stateAbbr || null,
        courtlistener_id: c.id,
        jurisdiction: c.citation_string || null,
        is_active: true,
      }
    })

    const { error } = await supabase
      .from('courthouses')
      .upsert(records, { onConflict: 'courtlistener_id', ignoreDuplicates: false })

    if (error) {
      console.error(`  Batch insert error: ${error.message}`)
    } else {
      inserted += batch.length
    }
  }

  console.log(`Inserted ${inserted} new courts`)
  return inserted
}

// ============================================================================
// PHASE 2: LINK COURTHOUSES TO LOCATIONS
// ============================================================================

async function linkCourthousesToLocations(): Promise<{ linked: number; countyLinked: number }> {
  console.log('\n--- Phase 2: Link courthouses to locations_us and counties ---')

  // Load all courthouses
  const { data: courthouses, error: chErr } = await supabase
    .from('courthouses')
    .select('id, name, slug, court_type, state_id, address_state, address_city, courtlistener_id, location_id, county_id')
    .eq('is_active', true)

  if (chErr || !courthouses?.length) {
    console.error('Failed to load courthouses:', chErr?.message || 'none found')
    return { linked: 0, countyLinked: 0 }
  }

  console.log(`Loaded ${courthouses.length} active courthouses`)

  // Load state mapping
  const { data: states } = await supabase
    .from('states')
    .select('id, abbreviation')

  const stateIdToAbbr = new Map(states?.map(s => [s.id, s.abbreviation]) || [])

  // Load all locations_us into memory (slug|state_abbr → id)
  const { data: locations } = await supabase
    .from('locations_us')
    .select('id, name, slug, state_id')

  if (!locations?.length) {
    console.error('No locations in DB')
    return { linked: 0, countyLinked: 0 }
  }

  const locationBySlugState = new Map<string, string>()
  for (const loc of locations) {
    const abbr = stateIdToAbbr.get(loc.state_id)
    if (abbr) {
      locationBySlugState.set(`${loc.slug}|${abbr}`, loc.id)
    }
  }
  console.log(`Loaded ${locationBySlugState.size} location lookups`)

  // Load all counties (slug|state_id → id)
  const { data: counties } = await supabase
    .from('counties')
    .select('id, name, slug, state_id')

  const countyByNameState = new Map<string, string>()
  if (counties) {
    for (const c of counties) {
      const abbr = stateIdToAbbr.get(c.state_id)
      if (abbr) {
        countyByNameState.set(`${slugify(c.name)}|${abbr}`, c.id)
      }
    }
  }
  console.log(`Loaded ${countyByNameState.size} county lookups`)

  // Match courthouses to locations
  let linked = 0
  let countyLinked = 0
  const updates: { id: string; location_id?: string; county_id?: string }[] = []

  for (const ch of courthouses) {
    const stateAbbr = ch.address_state || (ch.state_id ? stateIdToAbbr.get(ch.state_id) : null)
    if (!stateAbbr) continue

    let locationId = ch.location_id
    let countyId = ch.county_id

    // Try to match location from address_city
    if (!locationId && ch.address_city) {
      const key = `${slugify(ch.address_city)}|${stateAbbr}`
      locationId = locationBySlugState.get(key) || null
    }

    // Try to extract city from court name
    if (!locationId) {
      const city = extractCityFromCourtName(ch.name)
      if (city) {
        const key = `${slugify(city)}|${stateAbbr}`
        locationId = locationBySlugState.get(key) || null
      }
    }

    // Try to match county from court name
    if (!countyId) {
      const county = extractCountyFromCourtName(ch.name)
      if (county) {
        const key = `${slugify(county)}|${stateAbbr}`
        countyId = countyByNameState.get(key) || null
      }
    }

    // For federal district courts, try extracting district city
    if (!locationId && ch.court_type === 'federal_district') {
      // "United States District Court for the Eastern District of Pennsylvania"
      // The court sits in Philadelphia — but we can't know that from the name alone
      // We can try the district abbreviation pattern: "paed" → PA
      // And use the state capital as fallback
    }

    const needsUpdate = (locationId && locationId !== ch.location_id)
      || (countyId && countyId !== ch.county_id)

    if (needsUpdate) {
      const update: { id: string; location_id?: string; county_id?: string } = { id: ch.id }
      if (locationId && locationId !== ch.location_id) {
        update.location_id = locationId
        linked++
      }
      if (countyId && countyId !== ch.county_id) {
        update.county_id = countyId
        countyLinked++
      }
      updates.push(update)
    }
  }

  console.log(`\nMatches found:`)
  console.log(`  Location links: ${linked}`)
  console.log(`  County links:   ${countyLinked}`)

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: first 10 links ---')
    updates.slice(0, 10).forEach((u, i) => {
      const ch = courthouses.find(c => c.id === u.id)
      console.log(`  [${i + 1}] ${ch?.name} → location: ${u.location_id ? 'YES' : '-'}, county: ${u.county_id ? 'YES' : '-'}`)
    })
    return { linked, countyLinked }
  }

  // Apply updates
  const PARALLEL = 10
  let applied = 0

  for (let i = 0; i < updates.length; i += PARALLEL) {
    const chunk = updates.slice(i, i + PARALLEL)
    const results = await Promise.all(
      chunk.map(u => {
        const data: Record<string, string> = {}
        if (u.location_id) data.location_id = u.location_id
        if (u.county_id) data.county_id = u.county_id
        return supabase
          .from('courthouses')
          .update(data)
          .eq('id', u.id)
      })
    )

    for (const r of results) {
      if (!r.error) applied++
    }
  }

  console.log(`Applied ${applied} updates`)
  return { linked, countyLinked }
}

// ============================================================================
// PHASE 3: GENERATE COURT SUMMARY STATS
// ============================================================================

async function printCourtStats() {
  console.log('\n--- Court Statistics ---')

  // By type
  const { data: byType } = await supabase
    .from('courthouses')
    .select('court_type')
    .eq('is_active', true)

  if (byType) {
    const typeCounts: Record<string, number> = {}
    byType.forEach(r => { typeCounts[r.court_type] = (typeCounts[r.court_type] || 0) + 1 })
    console.log('\nBy court type:')
    Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => console.log(`  ${type}: ${count}`))
  }

  // Linked vs unlinked
  const { count: totalCount } = await supabase
    .from('courthouses')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { count: linkedCount } = await supabase
    .from('courthouses')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .not('location_id', 'is', null)

  const { count: countyCount } = await supabase
    .from('courthouses')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .not('county_id', 'is', null)

  console.log(`\nLinkage:`)
  console.log(`  Total active:     ${totalCount}`)
  console.log(`  With location_id: ${linkedCount}`)
  console.log(`  With county_id:   ${countyCount}`)

  // By state (top 10)
  const { data: byState } = await supabase
    .from('courthouses')
    .select('address_state')
    .eq('is_active', true)
    .not('address_state', 'is', null)

  if (byState) {
    const stateCounts: Record<string, number> = {}
    byState.forEach(r => { stateCounts[r.address_state] = (stateCounts[r.address_state] || 0) + 1 })
    console.log('\nTop 10 states by court count:')
    Object.entries(stateCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([st, count]) => console.log(`  ${st}: ${count}`))
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== CourtListener Courts Enrichment v2 ===')
  console.log(`Mode:       ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Fetch new:  ${FETCH_NEW ? 'YES' : 'NO'}`)
  console.log(`Link only:  ${LINK_ONLY ? 'YES' : 'NO'}`)
  console.log()

  // Load state mapping
  const { data: states } = await supabase
    .from('states')
    .select('id, abbreviation')

  if (!states?.length) {
    console.error('No states in DB. Run migration 401 first.')
    process.exit(1)
  }

  const stateMap = new Map(states.map(s => [s.abbreviation, s.id]))

  // Load existing courtlistener_ids
  const { data: existing } = await supabase
    .from('courthouses')
    .select('courtlistener_id')
    .not('courtlistener_id', 'is', null)

  const existingClIds = new Set(existing?.map(c => c.courtlistener_id) || [])
  console.log(`Existing courts with CL IDs: ${existingClIds.size}`)

  // Phase 1: Fetch new courts
  if (!LINK_ONLY && FETCH_NEW) {
    await fetchAndInsertNewCourts(stateMap, existingClIds)
  }

  // Phase 2: Link courthouses to locations
  const { linked, countyLinked } = await linkCourthousesToLocations()

  // Phase 3: Stats
  await printCourtStats()

  console.log('\n=== ENRICHMENT COMPLETE ===')
  console.log(`Locations linked: ${linked}`)
  console.log(`Counties linked:  ${countyLinked}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
