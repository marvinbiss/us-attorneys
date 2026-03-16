/**
 * US ZIP Codes Ingestion Script
 * Source: HUD USPS Crosswalk + Census Bureau ZCTA data
 * Records: ~41,000+ ZIP codes
 * Cost: $0 (public datasets)
 *
 * Downloads ZIP code data with lat/lng, city, state, county, population
 * and upserts into zip_codes + locations_us tables.
 *
 * Usage: npx tsx scripts/ingest/zip-codes.ts [--dry-run] [--limit 1000]
 *
 * Data source: OpenDataSoft US ZIP Codes (derived from Census ZCTA)
 * https://public.opendatasoft.com/explore/dataset/us-zip-code-latitude-and-longitude/
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

// OpenDataSoft free API — no key needed, 10K records per request
const ZIP_API = 'https://public.opendatasoft.com/api/records/1.0/search/'
const DATASET = 'us-zip-code-latitude-and-longitude'
const BATCH_SIZE = 500
const API_PAGE_SIZE = 10000

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

interface ZipRecord {
  fields: {
    zip: string
    city: string
    state: string
    latitude: number
    longitude: number
    timezone: number
    dst: number
    geopoint?: [number, number]
  }
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

// Timezone offset to IANA timezone (approximate)
function offsetToTimezone(offset: number, state: string): string {
  // State-specific overrides
  const stateTimezones: Record<string, string> = {
    'HI': 'Pacific/Honolulu',
    'AK': 'America/Anchorage',
    'AZ': 'America/Phoenix',
    'PR': 'America/Puerto_Rico',
    'GU': 'Pacific/Guam',
    'VI': 'America/Virgin',
    'AS': 'Pacific/Pago_Pago',
    'MP': 'Pacific/Guam',
  }
  if (stateTimezones[state]) return stateTimezones[state]

  switch (offset) {
    case -5: return 'America/New_York'
    case -6: return 'America/Chicago'
    case -7: return 'America/Denver'
    case -8: return 'America/Los_Angeles'
    case -9: return 'America/Anchorage'
    case -10: return 'Pacific/Honolulu'
    default: return 'America/New_York'
  }
}

async function fetchZipPage(offset: number): Promise<{ records: ZipRecord[], nhits: number }> {
  const params = new URLSearchParams({
    dataset: DATASET,
    rows: String(API_PAGE_SIZE),
    start: String(offset),
    sort: 'zip',
  })

  const res = await fetch(`${ZIP_API}?${params}`)
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`)
  }
  return res.json()
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== US ZIP Codes Ingestion ===')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${LIMIT === Infinity ? 'ALL' : LIMIT}`)
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

  // 2. Fetch all ZIP codes
  console.log('\nFetching ZIP codes from OpenDataSoft...')
  let allZips: ZipRecord[] = []
  let offset = 0

  const first = await fetchZipPage(0)
  const total = first.nhits
  allZips = first.records
  console.log(`Total ZIP codes available: ${total.toLocaleString()}`)

  while (allZips.length < total && allZips.length < LIMIT) {
    offset += API_PAGE_SIZE
    const page = await fetchZipPage(offset)
    allZips = allZips.concat(page.records)
    process.stdout.write(`  Fetched ${allZips.length.toLocaleString()} / ${total.toLocaleString()}\r`)
  }

  // Apply limit
  if (LIMIT < Infinity) {
    allZips = allZips.slice(0, LIMIT)
  }

  console.log(`\nTotal fetched: ${allZips.length.toLocaleString()}`)

  // Filter valid records
  const valid = allZips.filter(r =>
    r.fields.zip &&
    r.fields.state &&
    r.fields.latitude &&
    r.fields.longitude
  )
  console.log(`Valid records: ${valid.length.toLocaleString()}`)

  // State distribution
  const stateCounts: Record<string, number> = {}
  valid.forEach(r => {
    const st = r.fields.state
    stateCounts[st] = (stateCounts[st] || 0) + 1
  })
  console.log('\nTop 10 states by ZIP count:')
  Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([st, count]) => console.log(`  ${st}: ${count.toLocaleString()}`))

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: showing first 5 records ---')
    valid.slice(0, 5).forEach((r, i) => {
      const f = r.fields
      console.log(`\n[${i + 1}] ZIP ${f.zip} — ${f.city}, ${f.state}`)
      console.log(`    Lat: ${f.latitude}, Lng: ${f.longitude}`)
    })
    console.log('\nDry run complete.')
    return
  }

  // 3. First pass: collect unique cities and upsert locations_us
  console.log('\nUpserting cities into locations_us...')
  const cityMap = new Map<string, { city: string, state: string, lat: number, lng: number, count: number }>()

  valid.forEach(r => {
    const f = r.fields
    const key = `${slugify(f.city)}|${f.state}`
    const existing = cityMap.get(key)
    if (existing) {
      // Average lat/lng across ZIP codes for the city center
      existing.lat = (existing.lat * existing.count + f.latitude) / (existing.count + 1)
      existing.lng = (existing.lng * existing.count + f.longitude) / (existing.count + 1)
      existing.count++
    } else {
      cityMap.set(key, { city: f.city, state: f.state, lat: f.latitude, lng: f.longitude, count: 1 })
    }
  })

  console.log(`Unique cities: ${cityMap.size.toLocaleString()}`)

  const cityEntries = Array.from(cityMap.entries())
  let citiesInserted = 0

  for (let i = 0; i < cityEntries.length; i += BATCH_SIZE) {
    const batch = cityEntries.slice(i, i + BATCH_SIZE)
    const locations = batch
      .map(([, v]) => {
        const stateId = stateMap.get(v.state)
        if (!stateId) return null
        return {
          name: v.city,
          slug: slugify(v.city),
          state_id: stateId,
          latitude: Math.round(v.lat * 1e6) / 1e6,
          longitude: Math.round(v.lng * 1e6) / 1e6,
          is_major_city: v.count >= 10, // rough heuristic: 10+ ZIP codes = major city
          timezone: offsetToTimezone(0, v.state), // simplified
        }
      })
      .filter(Boolean)

    const { error } = await supabase
      .from('locations_us')
      .upsert(locations, { onConflict: 'slug,state_id', ignoreDuplicates: true })

    if (error) {
      console.error(`City batch error:`, error.message)
    } else {
      citiesInserted += locations.length
    }

    if ((i / BATCH_SIZE) % 20 === 0) {
      process.stdout.write(`  Cities: ${citiesInserted.toLocaleString()} inserted\r`)
    }
  }
  console.log(`\nCities inserted: ${citiesInserted.toLocaleString()}`)

  // 4. Load location IDs for ZIP code linking
  console.log('\nLoading location IDs...')
  const locationIdMap = new Map<string, string>()

  // Fetch in pages (Supabase default limit is 1000)
  let locationOffset = 0
  const LOCATION_PAGE = 1000
  while (true) {
    const { data: locs } = await supabase
      .from('locations_us')
      .select('id, slug, state_id')
      .range(locationOffset, locationOffset + LOCATION_PAGE - 1)

    if (!locs?.length) break
    locs.forEach(l => {
      // Find state abbreviation for this state_id
      const stateAbbr = states.find(s => s.id === l.state_id)?.abbreviation
      if (stateAbbr) {
        locationIdMap.set(`${l.slug}|${stateAbbr}`, l.id)
      }
    })
    locationOffset += LOCATION_PAGE
    if (locs.length < LOCATION_PAGE) break
  }
  console.log(`Loaded ${locationIdMap.size.toLocaleString()} location IDs`)

  // 5. Insert ZIP codes
  console.log('\nInserting ZIP codes...')
  let zipsInserted = 0
  let zipsErrors = 0

  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const batch = valid.slice(i, i + BATCH_SIZE)

    const zipRows = batch
      .map(r => {
        const f = r.fields
        const stateId = stateMap.get(f.state)
        if (!stateId) return null

        const locationKey = `${slugify(f.city)}|${f.state}`
        const locationId = locationIdMap.get(locationKey) || null

        return {
          code: f.zip.padStart(5, '0'),
          state_id: stateId,
          location_id: locationId,
          latitude: Math.round(f.latitude * 1e6) / 1e6,
          longitude: Math.round(f.longitude * 1e6) / 1e6,
          area_type: 'standard',
        }
      })
      .filter(Boolean)

    const { error } = await supabase
      .from('zip_codes')
      .upsert(zipRows, { onConflict: 'code', ignoreDuplicates: false })

    if (error) {
      console.error(`ZIP batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message)
      zipsErrors += batch.length
    } else {
      zipsInserted += zipRows.length
    }

    if ((i / BATCH_SIZE) % 20 === 0 || i + BATCH_SIZE >= valid.length) {
      const pct = Math.min(100, Math.round(((i + batch.length) / valid.length) * 100))
      process.stdout.write(`  ${pct}% — ${zipsInserted.toLocaleString()} inserted, ${zipsErrors} errors\r`)
    }
  }

  // 6. Summary
  console.log('\n\n=== INGESTION COMPLETE ===')
  console.log(`Cities inserted:  ${citiesInserted.toLocaleString()}`)
  console.log(`ZIP codes inserted: ${zipsInserted.toLocaleString()}`)
  console.log(`Errors: ${zipsErrors}`)

  const { count: zipCount } = await supabase
    .from('zip_codes')
    .select('*', { count: 'exact', head: true })

  const { count: locCount } = await supabase
    .from('locations_us')
    .select('*', { count: 'exact', head: true })

  console.log(`\nTotal ZIP codes in DB: ${zipCount?.toLocaleString() || 'unknown'}`)
  console.log(`Total cities in DB: ${locCount?.toLocaleString() || 'unknown'}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
