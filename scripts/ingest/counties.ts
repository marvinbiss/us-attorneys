/**
 * US Counties Ingestion Script
 * Source: Census Bureau FIPS codes + population data
 * Records: ~3,244 counties
 * Cost: $0 (public data)
 *
 * Uses Census Bureau county FIPS codes and population estimates.
 *
 * Usage: npx tsx scripts/ingest/counties.ts [--dry-run]
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

// Census Bureau API (free, no key needed for basic queries)
const CENSUS_API = 'https://api.census.gov/data/2022/acs/acs5'
const BATCH_SIZE = 500

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')

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
  '56': 'WY', '60': 'AS', '66': 'GU', '69': 'MP', '72': 'PR',
  '78': 'VI',
}

// Clean county name: remove " County", " Parish", " Borough", etc.
function cleanCountyName(name: string): string {
  return name
    .replace(/\s+(County|Parish|Borough|Census Area|Municipality|Municipio|city)$/i, '')
    .trim()
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== US Counties Ingestion ===')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log()

  // 1. Load state mapping
  const { data: states } = await supabase
    .from('states')
    .select('id, abbreviation, fips_code')

  if (!states?.length) {
    console.error('No states in DB. Run migration 401 first.')
    process.exit(1)
  }

  const stateByFips = new Map(states.map(s => [s.fips_code.trim(), { id: s.id, abbr: s.abbreviation }]))
  const stateByAbbr = new Map(states.map(s => [s.abbreviation, s.id]))
  console.log(`Loaded ${stateByFips.size} states`)

  // 2. Fetch counties from Census Bureau API
  // GET variables: NAME (county name), B01001_001E (total population)
  // For: county:* in state:*
  console.log('\nFetching counties from Census Bureau API...')

  const url = `${CENSUS_API}?get=NAME,B01001_001E&for=county:*&in=state:*`
  const res = await fetch(url)

  if (!res.ok) {
    console.error(`Census API ${res.status}: ${res.statusText}`)
    console.error('Trying alternate source...')

    // Fallback: use a simpler Census endpoint
    const altUrl = 'https://api.census.gov/data/2020/dec/pl?get=NAME,P1_001N&for=county:*&in=state:*'
    const altRes = await fetch(altUrl)
    if (!altRes.ok) {
      console.error(`Alternate Census API also failed: ${altRes.status}`)
      process.exit(1)
    }
    const altData: string[][] = await altRes.json()
    return processCountyData(altData, stateByFips, stateByAbbr)
  }

  const data: string[][] = await res.json()
  return processCountyData(data, stateByFips, stateByAbbr)
}

async function processCountyData(
  data: string[][],
  stateByFips: Map<string, { id: string, abbr: string }>,
  _stateByAbbr: Map<string, string>,
) {
  // First row is headers: ["NAME", "B01001_001E", "state", "county"]
  const headers = data[0]
  const rows = data.slice(1)

  console.log(`Total county records: ${rows.length.toLocaleString()}`)

  // Find column indices
  const nameIdx = headers.indexOf('NAME')
  const popIdx = headers.findIndex(h => h.startsWith('B01001_001') || h === 'P1_001N')
  const stateIdx = headers.indexOf('state')
  const countyIdx = headers.indexOf('county')

  // 3. Transform
  const counties = rows
    .map(row => {
      const fullName = row[nameIdx] // e.g., "Los Angeles County, California"
      const population = parseInt(row[popIdx], 10) || null
      const stateFips = row[stateIdx]
      const countyFips = row[countyIdx]
      const fips = `${stateFips}${countyFips}` // 5-digit FIPS

      const stateInfo = stateByFips.get(stateFips)
      if (!stateInfo) return null

      // Extract county name (before comma)
      const countyName = cleanCountyName(fullName.split(',')[0].trim())

      return {
        name: countyName,
        slug: slugify(countyName),
        state_id: stateInfo.id,
        fips_code: fips,
        population,
        county_seat: null, // Would need another data source
      }
    })
    .filter(Boolean)

  console.log(`Valid counties: ${counties.length.toLocaleString()}`)

  // State distribution
  const perState: Record<string, number> = {}
  rows.forEach(row => {
    const stateFips = row[3] // state column
    const stateInfo = stateByFips.get(stateFips)
    const abbr = stateInfo?.abbr || stateFips
    perState[abbr] = (perState[abbr] || 0) + 1
  })
  console.log('\nTop 10 states by county count:')
  Object.entries(perState)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([st, c]) => console.log(`  ${st}: ${c}`))

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: first 5 counties ---')
    counties.slice(0, 5).forEach((c: any, i: number) => {
      console.log(`\n[${i + 1}] ${c.name}`)
      console.log(`    FIPS: ${c.fips_code}, Pop: ${c.population?.toLocaleString() || 'N/A'}`)
      console.log(`    Slug: ${c.slug}`)
    })
    console.log('\nDry run complete.')
    return
  }

  // 4. Upsert
  console.log(`\nInserting ${counties.length.toLocaleString()} counties...`)
  let inserted = 0
  let errors = 0

  for (let i = 0; i < counties.length; i += BATCH_SIZE) {
    const batch = counties.slice(i, i + BATCH_SIZE)

    const { error } = await supabase
      .from('counties')
      .upsert(batch, { onConflict: 'fips_code', ignoreDuplicates: false })

    if (error) {
      console.error(`Batch error:`, error.message)
      errors += batch.length
    } else {
      inserted += batch.length
    }

    if ((i / BATCH_SIZE) % 10 === 0 || i + BATCH_SIZE >= counties.length) {
      const pct = Math.min(100, Math.round(((i + batch.length) / counties.length) * 100))
      process.stdout.write(`  ${pct}% — ${inserted.toLocaleString()} inserted\r`)
    }
  }

  console.log('\n\n=== INGESTION COMPLETE ===')
  console.log(`Inserted: ${inserted.toLocaleString()}`)
  console.log(`Errors:   ${errors}`)

  const { count } = await supabase
    .from('counties')
    .select('*', { count: 'exact', head: true })

  console.log(`Total counties in DB: ${count?.toLocaleString() || 'unknown'}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
