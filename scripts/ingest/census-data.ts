/**
 * Census Bureau ACS Data Enrichment Script
 * Source: https://api.census.gov/data (free, no API key required)
 * Dataset: American Community Survey 5-Year Estimates (2022)
 *
 * For each city in locations_us, fetches:
 *   - B01003_001E: Total population
 *   - B19013_001E: Median household income
 *   - B23025_005E / B23025_003E: Unemployment rate
 *   - B16001_002E: Spanish speakers (proxy for Hispanic population)
 *   - B01002_001E: Median age
 *
 * Stores in locations_us.census_data (JSONB)
 *
 * Usage:
 *   npx tsx scripts/ingest/census-data.ts [--dry-run] [--limit 50] [--state XX]
 *
 * Prerequisites:
 *   - Migration 403 applied (census_data JSONB column)
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

const ACS_BASE = 'https://api.census.gov/data/2022/acs/acs5'
const ACS_FALLBACK = 'https://api.census.gov/data/2021/acs/acs5'
const UPDATE_BATCH = 100
const RATE_DELAY = 250 // ms between Census API calls

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const FILE_MODE = args.includes('--file') // Save to JSON file if column doesn't exist
const FROM_FILE = args.includes('--from-file') // Load from staging file into DB
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0
const stateIdx = args.indexOf('--state')
const STATE_FILTER = stateIdx !== -1 ? args[stateIdx + 1].toUpperCase() : null

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

// State FIPS to abbreviation
const FIPS_TO_STATE: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
  '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
  '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
  '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
  '56': 'WY',
}

const STATE_TO_FIPS: Record<string, string> = Object.fromEntries(
  Object.entries(FIPS_TO_STATE).map(([k, v]) => [v, k])
)

// ============================================================================
// TYPES
// ============================================================================

interface CensusData {
  population: number | null
  median_household_income: number | null
  unemployment_rate: number | null
  spanish_speakers: number | null
  median_age: number | null
  acs_year: number
}

interface PlaceCensus {
  placeName: string
  placeSlug: string
  stateFips: string
  stateAbbr: string
  data: CensusData
}

// ============================================================================
// CENSUS API
// ============================================================================

const VARIABLES = [
  'NAME',
  'B01003_001E', // Total population
  'B19013_001E', // Median household income
  'B23025_003E', // Civilian labor force
  'B23025_005E', // Unemployed
  'B16001_002E', // Spanish speakers (5+ years)
  'B01002_001E', // Median age
].join(',')

async function fetchStatePlaces(stateFips: string, year: number = 2022): Promise<PlaceCensus[]> {
  const baseUrl = year === 2022 ? ACS_BASE : ACS_FALLBACK
  const url = `${baseUrl}?get=${VARIABLES}&for=place:*&in=state:${stateFips}`

  const res = await fetch(url)
  if (!res.ok) {
    if (year === 2022) {
      console.warn(`  ACS 2022 failed for state ${stateFips}, trying 2021...`)
      return fetchStatePlaces(stateFips, 2021)
    }
    console.error(`  Census API ${res.status} for state ${stateFips}: ${res.statusText}`)
    return []
  }

  const rows: string[][] = await res.json()
  if (rows.length < 2) return []

  const headers = rows[0]
  const nameIdx = headers.indexOf('NAME')
  const popIdx = headers.indexOf('B01003_001E')
  const incomeIdx = headers.indexOf('B19013_001E')
  const laborIdx = headers.indexOf('B23025_003E')
  const unemplIdx = headers.indexOf('B23025_005E')
  const spanishIdx = headers.indexOf('B16001_002E')
  const ageIdx = headers.indexOf('B01002_001E')

  const stateAbbr = FIPS_TO_STATE[stateFips] || 'XX'

  return rows.slice(1).map(row => {
    const rawName = row[nameIdx] // "New York city, New York"
    const placeName = rawName.split(',')[0]
      .replace(/\s+(city|town|village|CDP|borough|municipality)$/i, '')
      .trim()

    const pop = parseInt(row[popIdx], 10)
    const income = parseInt(row[incomeIdx], 10)
    const labor = parseInt(row[laborIdx], 10)
    const unempl = parseInt(row[unemplIdx], 10)
    const spanish = parseInt(row[spanishIdx], 10)
    const age = parseFloat(row[ageIdx])

    const unemploymentRate = labor > 0 && !isNaN(unempl) && !isNaN(labor)
      ? Math.round((unempl / labor) * 10000) / 100
      : null

    return {
      placeName,
      placeSlug: slugify(placeName),
      stateFips,
      stateAbbr,
      data: {
        population: isNaN(pop) || pop < 0 ? null : pop,
        median_household_income: isNaN(income) || income < 0 ? null : income,
        unemployment_rate: unemploymentRate,
        spanish_speakers: isNaN(spanish) || spanish < 0 ? null : spanish,
        median_age: isNaN(age) || age < 0 ? null : age,
        acs_year: year,
      },
    }
  }).filter(p => p.data.population !== null && p.data.population > 0)
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== Census Bureau ACS Data Enrichment ===')
  console.log(`Mode:   ${DRY_RUN ? 'DRY RUN' : FILE_MODE ? 'FILE (staging)' : 'LIVE'}`)
  console.log(`Limit:  ${LIMIT || 'all'}`)
  if (STATE_FILTER) console.log(`State:  ${STATE_FILTER}`)
  console.log()

  // 0a. --from-file mode: load staging file into DB
  if (FROM_FILE) {
    const fs = require('fs')
    const fromPath = require('path').join(__dirname, '../../data/census-staging.json')
    if (!fs.existsSync(fromPath)) {
      console.error('Staging file not found:', fromPath)
      console.error('Run census-data.ts first (without --from-file) to fetch Census data.')
      process.exit(1)
    }

    // Verify column exists
    const { error: checkErr } = await supabase.from('locations_us').select('census_data').limit(1)
    if (checkErr && checkErr.message.includes('census_data')) {
      console.error('census_data column still does not exist. Apply migration 403 first.')
      process.exit(1)
    }

    const updates: { id: string; census_data: CensusData }[] = JSON.parse(fs.readFileSync(fromPath, 'utf-8'))
    console.log(`Loading ${updates.length.toLocaleString()} records from staging file...`)

    let loaded = 0, errors = 0
    const PARALLEL = 10
    for (let i = 0; i < updates.length; i += PARALLEL) {
      const chunk = updates.slice(i, i + PARALLEL)
      const results = await Promise.all(
        chunk.map(u =>
          supabase.from('locations_us').update({ census_data: u.census_data }).eq('id', u.id)
        )
      )
      for (const r of results) {
        if (r.error) errors++
        else loaded++
      }
      if ((i + PARALLEL) % 500 === 0 || i + PARALLEL >= updates.length) {
        process.stdout.write(`\r  Progress: ${Math.min(i + PARALLEL, updates.length).toLocaleString()}/${updates.length.toLocaleString()} (errors: ${errors})`)
      }
    }

    console.log(`\n\n=== LOAD FROM FILE COMPLETE ===`)
    console.log(`Loaded:  ${loaded.toLocaleString()}`)
    console.log(`Errors:  ${errors}`)

    const { count } = await supabase
      .from('locations_us')
      .select('*', { count: 'exact', head: true })
      .not('census_data', 'is', null)
    console.log(`Total cities with census_data: ${count?.toLocaleString() || 'unknown'}`)
    return
  }

  // 0. Detect if census_data column exists
  let columnExists = true
  if (!DRY_RUN) {
    const { error: colErr } = await supabase
      .from('locations_us')
      .select('census_data')
      .limit(1)
    if (colErr && colErr.message.includes('census_data')) {
      columnExists = false
      if (!FILE_MODE) {
        console.warn('WARNING: census_data column does not exist on locations_us.')
        console.warn('Switching to FILE mode — will save matched data to data/census-staging.json')
        console.warn('Apply migration 403 then re-run without --file to load from staging.\n')
      }
    }
  }

  const useFile = !columnExists || FILE_MODE
  const stagingPath = require('path').join(__dirname, '../../data/census-staging.json')
  const allFileUpdates: { id: string; census_data: CensusData }[] = []

  // 1. Load state mapping from DB
  const { data: states } = await supabase
    .from('states')
    .select('id, abbreviation, fips_code')

  if (!states?.length) {
    console.error('No states in DB. Run migration 401 first.')
    process.exit(1)
  }

  const stateIdMap = new Map(states.map(s => [s.abbreviation, s.id]))
  console.log(`Loaded ${stateIdMap.size} states`)

  // 2. Load cities from DB (to match Census places)
  let cityQuery = supabase
    .from('locations_us')
    .select('id, name, slug, state_id, population')
    .order('population', { ascending: false, nullsFirst: false })

  if (LIMIT > 0) {
    cityQuery = cityQuery.limit(LIMIT)
  }

  const { data: cities, error: cityErr } = await cityQuery

  if (cityErr || !cities?.length) {
    console.error('Failed to load cities:', cityErr?.message || 'no cities')
    process.exit(1)
  }

  console.log(`Loaded ${cities.length.toLocaleString()} cities from DB`)

  // Build state_id → abbreviation reverse map
  const stateIdToAbbr = new Map(states.map(s => [s.id, s.abbreviation]))

  // Group cities by state
  const citiesByState = new Map<string, typeof cities>()
  for (const city of cities) {
    const abbr = stateIdToAbbr.get(city.state_id)
    if (!abbr) continue
    if (STATE_FILTER && abbr !== STATE_FILTER) continue
    const list = citiesByState.get(abbr) || []
    list.push(city)
    citiesByState.set(abbr, list)
  }

  console.log(`Processing ${citiesByState.size} states`)

  // 3. Fetch Census data per state and match to cities
  let totalMatched = 0
  let totalUnmatched = 0
  let totalUpdated = 0
  let totalErrors = 0
  const statesProcessed: string[] = []

  const stateAbbrList = Array.from(citiesByState.keys()).sort()

  for (const stateAbbr of stateAbbrList) {
    const fips = STATE_TO_FIPS[stateAbbr]
    if (!fips) {
      console.warn(`No FIPS for ${stateAbbr}, skipping`)
      continue
    }

    process.stdout.write(`\n[${statesProcessed.length + 1}/${stateAbbrList.length}] ${stateAbbr}: fetching Census data...`)
    await sleep(RATE_DELAY)

    const censusPlaces = await fetchStatePlaces(fips)
    if (censusPlaces.length === 0) {
      console.log(` no data`)
      continue
    }

    console.log(` ${censusPlaces.length} places`)

    // Build Census lookup by slug
    const censusBySlug = new Map<string, PlaceCensus>()
    for (const p of censusPlaces) {
      // Store by slug; if duplicate, keep the one with larger population
      const existing = censusBySlug.get(p.placeSlug)
      if (!existing || (p.data.population || 0) > (existing.data.population || 0)) {
        censusBySlug.set(p.placeSlug, p)
      }
    }

    // Match our cities
    const stateCities = citiesByState.get(stateAbbr) || []
    const updates: { id: string; census_data: CensusData }[] = []

    for (const city of stateCities) {
      const match = censusBySlug.get(city.slug)
        || censusBySlug.get(slugify(city.name))

      if (match) {
        updates.push({ id: city.id, census_data: match.data })
        totalMatched++
      } else {
        totalUnmatched++
      }
    }

    if (updates.length === 0) {
      process.stdout.write(`  matched: 0/${stateCities.length}`)
      continue
    }

    process.stdout.write(`  matched: ${updates.length}/${stateCities.length}`)

    if (DRY_RUN) {
      // Show first 3 matches
      updates.slice(0, 3).forEach(u => {
        const city = stateCities.find(c => c.id === u.id)
        console.log(`    ${city?.name}: pop=${u.census_data.population}, income=$${u.census_data.median_household_income}, age=${u.census_data.median_age}`)
      })
      continue
    }

    if (useFile) {
      // Save to staging array (will write to file at end)
      allFileUpdates.push(...updates)
      totalUpdated += updates.length
      statesProcessed.push(stateAbbr)
      process.stdout.write(` → staged: ${updates.length}`)
      continue
    }

    // Batch update
    for (let i = 0; i < updates.length; i += UPDATE_BATCH) {
      const batch = updates.slice(i, i + UPDATE_BATCH)

      // Supabase doesn't support bulk updates with different values per row
      // So we update one by one (but in parallel batches of 10)
      const PARALLEL = 10
      for (let j = 0; j < batch.length; j += PARALLEL) {
        const chunk = batch.slice(j, j + PARALLEL)
        const results = await Promise.all(
          chunk.map(u =>
            supabase
              .from('locations_us')
              .update({ census_data: u.census_data })
              .eq('id', u.id)
          )
        )

        for (const r of results) {
          if (r.error) {
            totalErrors++
          } else {
            totalUpdated++
          }
        }
      }
    }

    statesProcessed.push(stateAbbr)
    process.stdout.write(` → updated: ${updates.length}`)
  }

  // 3.5. Write staging file if in file mode
  if (useFile && allFileUpdates.length > 0) {
    const fs = require('fs')
    const dir = require('path').dirname(stagingPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(stagingPath, JSON.stringify(allFileUpdates, null, 0))
    console.log(`\n\nStaging file written: ${stagingPath}`)
    console.log(`  Records: ${allFileUpdates.length.toLocaleString()}`)
    console.log(`  Size: ${(fs.statSync(stagingPath).size / 1024 / 1024).toFixed(1)} MB`)
  }

  // 4. Summary
  console.log('\n\n=== INGESTION COMPLETE ===')
  console.log(`States processed: ${statesProcessed.length}`)
  console.log(`Cities matched:   ${totalMatched.toLocaleString()}`)
  console.log(`Cities unmatched: ${totalUnmatched.toLocaleString()}`)
  console.log(`DB ${useFile ? 'staged' : 'updates'}:       ${totalUpdated.toLocaleString()}`)
  console.log(`Errors:           ${totalErrors}`)

  if (!DRY_RUN && !useFile) {
    // Count how many have census_data
    const { count } = await supabase
      .from('locations_us')
      .select('*', { count: 'exact', head: true })
      .not('census_data', 'is', null)

    console.log(`\nTotal cities with census_data: ${count?.toLocaleString() || 'unknown'}`)
  }

  if (useFile) {
    console.log(`\nNEXT STEPS:`)
    console.log(`  1. Apply migration 403 in Supabase SQL Editor:`)
    console.log(`     ALTER TABLE locations_us ADD COLUMN IF NOT EXISTS census_data JSONB;`)
    console.log(`  2. Re-run: npx tsx scripts/ingest/census-data.ts --from-file`)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
