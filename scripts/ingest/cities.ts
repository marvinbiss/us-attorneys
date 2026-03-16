/**
 * US Cities Ingestion Script
 * Source: US Census Bureau Gazetteer Places file (2024)
 * Records: ~30,000 incorporated places (cities, towns, CDPs)
 * Cost: $0 (public government dataset)
 *
 * Usage: npx tsx scripts/ingest/cities.ts [--dry-run] [--limit 1000]
 */

import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// ============================================================================
// CONFIG
// ============================================================================

const GAZETTEER_URLS = [
  'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_place_national.zip',
  'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_place_national.zip',
  'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2022_Gazetteer/2022_Gaz_place_national.zip',
  'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2020_Gazetteer/2020_Gaz_place_national.zip',
]

const BATCH_SIZE = 500
const MAJOR_CITY_POP = 50000 // 50K+ = major city

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
  auth: { autoRefreshToken: false, persistSession: false },
})

// ============================================================================
// TYPES
// ============================================================================

interface PlaceRecord {
  name: string
  stateAbbr: string
  stateFips: string
  placeFips: string
  population: number | null
  housingUnits: number | null
  latitude: number
  longitude: number
  landAreaSqMi: number
}

// ============================================================================
// STATE FIPS MAPPING
// ============================================================================

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

// Clean Census place names: remove suffixes like " city", " town", " CDP", " borough", etc.
function cleanPlaceName(name: string): string {
  return name
    .replace(/\s+(city|town|village|CDP|borough|municipality|plantation|reservation|comunidad|zona urbana|barrio|comunidad rural)$/i, '')
    .replace(/\s+\(balance\)$/i, '')
    .trim()
}

// ============================================================================
// DOWNLOAD & PARSE
// ============================================================================

async function fetchPlacesData(): Promise<PlaceRecord[]> {
  console.log('Downloading Places Gazetteer from Census Bureau...')

  let zipBuffer: Buffer | null = null

  for (const url of GAZETTEER_URLS) {
    console.log(`  Trying: ${url}`)
    try {
      const res = await fetch(url)
      if (res.ok) {
        zipBuffer = Buffer.from(await res.arrayBuffer())
        console.log(`  ✓ Downloaded ${(zipBuffer.length / 1024 / 1024).toFixed(1)} MB`)
        break
      }
      console.log(`  ✗ HTTP ${res.status}`)
    } catch (err: any) {
      console.log(`  ✗ ${err.message}`)
    }
  }

  if (!zipBuffer) {
    throw new Error('All Census Bureau Places Gazetteer URLs failed')
  }

  // Extract ZIP
  const tmpDir = mkdtempSync(join(tmpdir(), 'places-'))
  const zipPath = join(tmpDir, 'places.zip')
  writeFileSync(zipPath, zipBuffer)

  try {
    const AdmZip = require('adm-zip')
    const zip = new AdmZip(zipBuffer)
    zip.extractAllTo(tmpDir, true)
  } catch {
    try {
      execSync(`unzip -o "${zipPath}" -d "${tmpDir}" 2>/dev/null || python3 -c "import zipfile; zipfile.ZipFile('${zipPath.replace(/\\/g, '/')}').extractall('${tmpDir.replace(/\\/g, '/')}')"`, { stdio: 'pipe' })
    } catch {
      throw new Error('Cannot extract Places Gazetteer archive')
    }
  }

  // Find .txt file
  const files = readdirSync(tmpDir)
  const txtFile = files.find(f => f.endsWith('.txt') && f.toLowerCase().includes('place'))
  if (!txtFile) {
    throw new Error(`No place .txt file found. Files: ${files.join(', ')}`)
  }

  const text = readFileSync(join(tmpDir, txtFile), 'utf-8')
  try { rmSync(tmpDir, { recursive: true }) } catch { /* ignore */ }

  // Parse tab-separated file
  // Header: USPS	GEOID	ANSICODE	NAME	FUNCSTAT	ALAND	AWATER	ALAND_SQMI	AWATER_SQMI	INTPTLAT	INTPTLONG
  // Or:     USPS	GEOID	NAME	POP	HU	ALAND	AWATER	ALAND_SQMI	AWATER_SQMI	INTPTLAT	INTPTLONG
  const lines = text.split('\n')
  const header = lines[0].trim()
  console.log(`Header: ${header}`)

  const cols = header.split('\t').map(h => h.trim().toUpperCase())
  const uspsIdx = cols.indexOf('USPS')
  const geoidIdx = cols.indexOf('GEOID')
  const nameIdx = cols.indexOf('NAME')
  const popIdx = cols.findIndex(c => c === 'POP' || c === 'POPULATION')
  const huIdx = cols.findIndex(c => c === 'HU' || c === 'HOUSING_UNITS')
  const alandSqmiIdx = cols.indexOf('ALAND_SQMI')
  const latIdx = cols.indexOf('INTPTLAT')
  const lngIdx = cols.indexOf('INTPTLONG')

  if (nameIdx === -1 || latIdx === -1 || lngIdx === -1) {
    throw new Error(`Cannot parse header. Columns found: ${cols.join(', ')}`)
  }

  const records: PlaceRecord[] = []
  let skipped = 0

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = line.split('\t').map(p => p.trim())

    const name = parts[nameIdx]
    const lat = parseFloat(parts[latIdx])
    const lng = parseFloat(parts[lngIdx])

    if (!name || isNaN(lat) || isNaN(lng)) {
      skipped++
      continue
    }

    // Get state from USPS column or GEOID prefix
    let stateAbbr = ''
    let stateFips = ''

    if (uspsIdx !== -1 && parts[uspsIdx]) {
      stateAbbr = parts[uspsIdx].trim()
    }

    if (geoidIdx !== -1 && parts[geoidIdx]) {
      stateFips = parts[geoidIdx].substring(0, 2)
      if (!stateAbbr) {
        stateAbbr = FIPS_TO_STATE[stateFips] || ''
      }
    }

    if (!stateAbbr) {
      skipped++
      continue
    }

    const population = popIdx !== -1 ? parseInt(parts[popIdx], 10) || null : null
    const housingUnits = huIdx !== -1 ? parseInt(parts[huIdx], 10) || null : null
    const landAreaSqMi = alandSqmiIdx !== -1 ? parseFloat(parts[alandSqmiIdx]) || 0 : 0
    const placeFips = geoidIdx !== -1 ? parts[geoidIdx] : ''

    records.push({
      name: cleanPlaceName(name),
      stateAbbr,
      stateFips,
      placeFips,
      population,
      housingUnits,
      latitude: lat,
      longitude: lng,
      landAreaSqMi,
    })

    if (LIMIT < Infinity && records.length >= LIMIT) break
  }

  console.log(`Parsed ${records.length.toLocaleString()} places (${skipped} skipped)`)
  return records
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== US Cities Ingestion ===')
  console.log('Source: US Census Bureau Gazetteer Places 2024')
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

  // 2. Fetch places
  const places = await fetchPlacesData()

  // Filter to states we have in DB
  const withState = places.filter(p => stateMap.has(p.stateAbbr))
  console.log(`\nPlaces with valid state: ${withState.length.toLocaleString()}`)

  // Deduplicate: same slug + same state → keep the one with highest population
  // This prevents "ON CONFLICT DO UPDATE cannot affect row a second time" errors
  const deduped = new Map<string, typeof withState[0]>()
  let dupeCount = 0
  for (const p of withState) {
    const key = `${slugify(p.name)}|${p.stateAbbr}`
    const existing = deduped.get(key)
    if (existing) {
      dupeCount++
      // Keep the one with higher population
      if ((p.population || 0) > (existing.population || 0)) {
        deduped.set(key, p)
      }
    } else {
      deduped.set(key, p)
    }
  }
  const valid = Array.from(deduped.values())
  console.log(`After dedup: ${valid.length.toLocaleString()} unique (${dupeCount} duplicates removed)`)

  // Stats
  const stateCounts: Record<string, number> = {}
  valid.forEach(p => {
    stateCounts[p.stateAbbr] = (stateCounts[p.stateAbbr] || 0) + 1
  })
  console.log('\nTop 10 states by city count:')
  Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([st, c]) => console.log(`  ${st}: ${c.toLocaleString()}`))

  const majorCities = valid.filter(p => p.population && p.population >= MAJOR_CITY_POP)
  console.log(`\nMajor cities (50K+ pop): ${majorCities.length}`)

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: first 10 places ---')
    valid.slice(0, 10).forEach((p, i) => {
      console.log(`[${i + 1}] ${p.name}, ${p.stateAbbr} | Pop: ${p.population?.toLocaleString() || 'N/A'} | ${p.latitude}, ${p.longitude}`)
    })
    console.log(`\n--- Top 10 major cities ---`)
    majorCities
      .sort((a, b) => (b.population || 0) - (a.population || 0))
      .slice(0, 10)
      .forEach((p, i) => {
        console.log(`[${i + 1}] ${p.name}, ${p.stateAbbr} — ${p.population?.toLocaleString()}`)
      })
    console.log('\nDry run complete.')
    return
  }

  // 3. Upsert into locations_us
  console.log(`\nInserting ${valid.length.toLocaleString()} cities...`)
  let inserted = 0
  let errors = 0

  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const batch = valid.slice(i, i + BATCH_SIZE)

    const locations = batch
      .map(p => {
        const stateId = stateMap.get(p.stateAbbr)
        if (!stateId) return null

        return {
          name: p.name,
          slug: slugify(p.name),
          state_id: stateId,
          population: p.population,
          latitude: Math.round(p.latitude * 1e6) / 1e6,
          longitude: Math.round(p.longitude * 1e6) / 1e6,
          is_major_city: (p.population || 0) >= MAJOR_CITY_POP,
        }
      })
      .filter(Boolean)

    const { error } = await supabase
      .from('locations_us')
      .upsert(locations, { onConflict: 'slug,state_id', ignoreDuplicates: false })

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message)
      errors += batch.length
    } else {
      inserted += locations.length
    }

    if ((i / BATCH_SIZE) % 10 === 0 || i + BATCH_SIZE >= valid.length) {
      const pct = Math.min(100, Math.round(((i + batch.length) / valid.length) * 100))
      process.stdout.write(`  ${pct}% — ${inserted.toLocaleString()} inserted, ${errors} errors\r`)
    }
  }

  console.log('\n')

  // 4. Summary
  console.log('=== INGESTION COMPLETE ===')
  console.log(`Inserted: ${inserted.toLocaleString()}`)
  console.log(`Errors:   ${errors}`)

  const { count } = await supabase
    .from('locations_us')
    .select('*', { count: 'exact', head: true })

  console.log(`Total cities in DB: ${count?.toLocaleString() || 'unknown'}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
