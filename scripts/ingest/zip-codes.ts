/**
 * US ZIP Codes Ingestion Script
 * Source: US Census Bureau Gazetteer ZCTA file (2023)
 * https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_zcta_national.txt
 *
 * Records: ~33,000 ZCTAs with lat/lng
 * Cost: $0 (public government dataset)
 *
 * Downloads ZIP code tabulation areas with coordinates from Census Bureau,
 * derives state from ZIP prefix ranges, and upserts into zip_codes + locations_us tables.
 *
 * Usage: npx tsx scripts/ingest/zip-codes.ts [--dry-run] [--limit 1000]
 */

import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import { mkdtempSync, readFileSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// ============================================================================
// CONFIG
// ============================================================================

// Census Bureau Gazetteer — .zip archive containing tab-separated .txt
// Try multiple years in case one is unavailable
const GAZETTEER_URLS = [
  'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_zcta_national.zip',
  'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_zcta_national.zip',
  'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2022_Gazetteer/2022_Gaz_zcta_national.zip',
  'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2020_Gazetteer/2020_Gaz_zcta_national.zip',
]

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
  auth: { autoRefreshToken: false, persistSession: false },
})

// ============================================================================
// TYPES
// ============================================================================

interface ZctaRecord {
  zip: string        // 5-digit ZCTA (GEOID)
  state: string      // 2-letter state abbreviation (derived from ZIP prefix)
  latitude: number   // INTPTLAT
  longitude: number  // INTPTLONG
  alandSqmi: number  // Land area in square miles
}

// ============================================================================
// ZIP PREFIX -> STATE MAPPING (from src/lib/geography.ts)
// Duplicated here so the script is self-contained (no TS path aliases in scripts)
// ============================================================================

function getStateFromZip(zipCode: string): string | null {
  const zip = parseInt(zipCode?.substring(0, 3) || '0', 10)
  if (zip >= 5 && zip <= 5) return 'NY'     // 005xx = NY (Holtsville)
  if (zip >= 6 && zip <= 9) return 'PR'     // 006-009 = Puerto Rico
  if (zip >= 10 && zip <= 69) return 'MA'   // 010-069 = MA/CT/etc — simplified
  // More precise ranges:
  if (zip >= 10 && zip <= 27) return 'MA'
  if (zip >= 28 && zip <= 29) return 'RI'
  if (zip >= 30 && zip <= 38) return 'NH'
  if (zip >= 39 && zip <= 49) return 'ME'
  if (zip >= 50 && zip <= 54) return 'VT'
  if (zip >= 55 && zip <= 59) return 'MA'
  if (zip >= 60 && zip <= 69) return 'CT'
  if (zip >= 70 && zip <= 89) return 'NJ'
  if (zip >= 90 && zip <= 99) return 'AE'   // Military (APO/FPO)
  if (zip >= 100 && zip <= 149) return 'NY'
  if (zip >= 150 && zip <= 196) return 'PA'
  if (zip >= 197 && zip <= 199) return 'DE'
  if (zip >= 200 && zip <= 205) return 'DC'
  if (zip >= 206 && zip <= 219) return 'MD'
  if (zip >= 220 && zip <= 246) return 'VA'
  if (zip >= 247 && zip <= 268) return 'WV'
  if (zip >= 270 && zip <= 289) return 'NC'
  if (zip >= 290 && zip <= 299) return 'SC'
  if (zip >= 300 && zip <= 319) return 'GA'
  if (zip >= 320 && zip <= 349) return 'FL'
  if (zip >= 350 && zip <= 369) return 'AL'
  if (zip >= 370 && zip <= 385) return 'TN'
  if (zip >= 386 && zip <= 397) return 'MS'
  if (zip >= 398 && zip <= 399) return 'GA'
  if (zip >= 400 && zip <= 427) return 'KY'
  if (zip >= 430 && zip <= 458) return 'OH'
  if (zip >= 460 && zip <= 479) return 'IN'
  if (zip >= 480 && zip <= 499) return 'MI'
  if (zip >= 500 && zip <= 528) return 'IA'
  if (zip >= 530 && zip <= 549) return 'WI'
  if (zip >= 550 && zip <= 567) return 'MN'
  if (zip >= 570 && zip <= 577) return 'SD'
  if (zip >= 580 && zip <= 588) return 'ND'
  if (zip >= 590 && zip <= 599) return 'MT'
  if (zip >= 600 && zip <= 629) return 'IL'
  if (zip >= 630 && zip <= 658) return 'MO'
  if (zip >= 660 && zip <= 679) return 'KS'
  if (zip >= 680 && zip <= 693) return 'NE'
  if (zip >= 700 && zip <= 714) return 'LA'
  if (zip >= 716 && zip <= 729) return 'AR'
  if (zip >= 730 && zip <= 749) return 'OK'
  if (zip >= 750 && zip <= 799) return 'TX'
  if (zip >= 800 && zip <= 816) return 'CO'
  if (zip >= 820 && zip <= 831) return 'WY'
  if (zip >= 832 && zip <= 838) return 'ID'
  if (zip >= 840 && zip <= 847) return 'UT'
  if (zip >= 850 && zip <= 865) return 'AZ'
  if (zip >= 870 && zip <= 884) return 'NM'
  if (zip >= 889 && zip <= 898) return 'NV'
  if (zip >= 900 && zip <= 966) return 'CA'
  if (zip >= 967 && zip <= 968) return 'HI'
  if (zip >= 970 && zip <= 979) return 'OR'
  if (zip >= 980 && zip <= 994) return 'WA'
  if (zip >= 995 && zip <= 999) return 'AK'
  return null
}

// State-based timezone (approximate)
function getTimezoneForState(state: string): string {
  const tz: Record<string, string> = {
    HI: 'Pacific/Honolulu',
    AK: 'America/Anchorage',
    WA: 'America/Los_Angeles',
    OR: 'America/Los_Angeles',
    CA: 'America/Los_Angeles',
    NV: 'America/Los_Angeles',
    AZ: 'America/Phoenix',
    UT: 'America/Denver',
    MT: 'America/Denver',
    WY: 'America/Denver',
    CO: 'America/Denver',
    NM: 'America/Denver',
    ID: 'America/Boise',
    ND: 'America/Chicago',
    SD: 'America/Chicago',
    NE: 'America/Chicago',
    KS: 'America/Chicago',
    OK: 'America/Chicago',
    TX: 'America/Chicago',
    MN: 'America/Chicago',
    IA: 'America/Chicago',
    MO: 'America/Chicago',
    AR: 'America/Chicago',
    LA: 'America/Chicago',
    WI: 'America/Chicago',
    IL: 'America/Chicago',
    MS: 'America/Chicago',
    AL: 'America/Chicago',
    TN: 'America/Chicago',
    MI: 'America/Detroit',
    IN: 'America/Indiana/Indianapolis',
    OH: 'America/New_York',
    KY: 'America/New_York',
    WV: 'America/New_York',
    VA: 'America/New_York',
    NC: 'America/New_York',
    SC: 'America/New_York',
    GA: 'America/New_York',
    FL: 'America/New_York',
    PA: 'America/New_York',
    NY: 'America/New_York',
    NJ: 'America/New_York',
    CT: 'America/New_York',
    RI: 'America/New_York',
    MA: 'America/New_York',
    VT: 'America/New_York',
    NH: 'America/New_York',
    ME: 'America/New_York',
    MD: 'America/New_York',
    DE: 'America/New_York',
    DC: 'America/New_York',
    PR: 'America/Puerto_Rico',
    VI: 'America/Virgin',
    GU: 'Pacific/Guam',
    AS: 'Pacific/Pago_Pago',
    MP: 'Pacific/Guam',
  }
  return tz[state] || 'America/New_York'
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

function parseGazetteerLines(lines: string[]): ZctaRecord[] {
  const header = lines[0]
  console.log(`Header: ${header?.trim()}`)

  const records: ZctaRecord[] = []
  let skipped = 0

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = line.split('\t').map(p => p.trim())

    // GEOID | ALAND | AWATER | ALAND_SQMI | AWATER_SQMI | INTPTLAT | INTPTLONG
    const geoid = parts[0]
    const alandSqmi = parseFloat(parts[3])
    const lat = parseFloat(parts[5])
    const lng = parseFloat(parts[6])

    if (!geoid || isNaN(lat) || isNaN(lng)) {
      skipped++
      continue
    }

    const zip = geoid.padStart(5, '0')
    const state = getStateFromZip(zip)

    if (!state) {
      skipped++
      continue
    }

    records.push({ zip, state, latitude: lat, longitude: lng, alandSqmi: isNaN(alandSqmi) ? 0 : alandSqmi })

    if (LIMIT < Infinity && records.length >= LIMIT) break
  }

  console.log(`Parsed ${records.length.toLocaleString()} records (${skipped} skipped)`)
  return records
}

/**
 * Downloads and parses the Census Bureau Gazetteer ZIP archive.
 * The archive contains a tab-separated .txt file.
 * Format: GEOID\tALAND\tAWATER\tALAND_SQMI\tAWATER_SQMI\tINTPTLAT\tINTPTLONG
 */
async function fetchGazetteerData(): Promise<ZctaRecord[]> {
  console.log(`Downloading Gazetteer file from Census Bureau...`)

  // Try each URL until one works
  let zipBuffer: Buffer | null = null
  let usedUrl = ''

  for (const url of GAZETTEER_URLS) {
    console.log(`  Trying: ${url}`)
    try {
      const res = await fetch(url)
      if (res.ok) {
        zipBuffer = Buffer.from(await res.arrayBuffer())
        usedUrl = url
        console.log(`  ✓ Downloaded ${(zipBuffer.length / 1024 / 1024).toFixed(1)} MB`)
        break
      }
      console.log(`  ✗ HTTP ${res.status}`)
    } catch (err: any) {
      console.log(`  ✗ ${err.message}`)
    }
  }

  if (!zipBuffer) {
    throw new Error('All Census Bureau Gazetteer URLs failed')
  }

  // Extract ZIP archive using system unzip
  const tmpDir = mkdtempSync(join(tmpdir(), 'zcta-'))
  const zipPath = join(tmpDir, 'gazetteer.zip')
  require('fs').writeFileSync(zipPath, zipBuffer)

  try {
    // Use unzip or python to extract (cross-platform)
    try {
      execSync(`unzip -o "${zipPath}" -d "${tmpDir}" 2>/dev/null || python3 -c "import zipfile; zipfile.ZipFile('${zipPath.replace(/\\/g, '/')}').extractall('${tmpDir.replace(/\\/g, '/')}')" 2>/dev/null || python -c "import zipfile; zipfile.ZipFile('${zipPath.replace(/\\/g, '/')}').extractall('${tmpDir.replace(/\\/g, '/')}')"`, { stdio: 'pipe' })
    } catch {
      // Node.js fallback: use built-in zlib for .zip (single file)
      const AdmZip = require('adm-zip')
      const zip = new AdmZip(zipBuffer)
      zip.extractAllTo(tmpDir, true)
    }
  } catch {
    // Last resort: try reading as plain text (some years serve .txt directly)
    console.log('  Trying as plain text...')
    const text = zipBuffer.toString('utf-8')
    if (text.includes('GEOID') || text.includes('INTPTLAT')) {
      const lines = text.split('\n')
      return parseGazetteerLines(lines)
    }
    throw new Error('Cannot extract Gazetteer archive')
  }

  // Find the .txt file in extracted directory
  const files = require('fs').readdirSync(tmpDir) as string[]
  const txtFile = files.find((f: string) => f.endsWith('.txt') && f.includes('zcta'))
  if (!txtFile) {
    throw new Error(`No ZCTA .txt file found in archive. Files: ${files.join(', ')}`)
  }

  const text = readFileSync(join(tmpDir, txtFile), 'utf-8')

  // Cleanup
  try { rmSync(tmpDir, { recursive: true }) } catch { /* ignore */ }

  const lines = text.split('\n')
  return parseGazetteerLines(lines)
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== US ZIP Codes Ingestion ===')
  console.log('Source: US Census Bureau Gazetteer 2023 ZCTA')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${LIMIT === Infinity ? 'ALL' : LIMIT}`)
  console.log()

  // 1. Load state mapping from DB
  const { data: states } = await supabase
    .from('states')
    .select('id, abbreviation')

  if (!states?.length) {
    console.error('No states in DB. Run migration 401 first.')
    process.exit(1)
  }

  const stateMap = new Map(states.map(s => [s.abbreviation, s.id]))
  console.log(`Loaded ${stateMap.size} states from DB`)

  // 2. Fetch all ZCTA records from Census Bureau
  const allZips = await fetchGazetteerData()
  console.log(`\nTotal fetched: ${allZips.length.toLocaleString()}`)

  // Filter to only states we have in DB
  const valid = allZips.filter(r => stateMap.has(r.state))
  console.log(`Valid records (state in DB): ${valid.length.toLocaleString()}`)

  // State distribution
  const stateCounts: Record<string, number> = {}
  valid.forEach(r => {
    stateCounts[r.state] = (stateCounts[r.state] || 0) + 1
  })
  console.log('\nTop 10 states by ZIP count:')
  Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([st, count]) => console.log(`  ${st}: ${count.toLocaleString()}`))

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: showing first 10 records ---')
    valid.slice(0, 10).forEach((r, i) => {
      console.log(
        `[${i + 1}] ZIP ${r.zip} — ${r.state} | Lat: ${r.latitude}, Lng: ${r.longitude} | Area: ${r.alandSqmi} sq mi`
      )
    })
    console.log('\nDry run complete.')
    return
  }

  // 3. Upsert ZIP codes into zip_codes table
  console.log('\nInserting ZIP codes...')
  let zipsInserted = 0
  let zipsErrors = 0

  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const batch = valid.slice(i, i + BATCH_SIZE)

    const zipRows = batch
      .map(r => {
        const stateId = stateMap.get(r.state)
        if (!stateId) return null

        return {
          code: r.zip,
          state_id: stateId,
          location_id: null, // Will be linked later when locations_us is populated
          latitude: Math.round(r.latitude * 1e6) / 1e6,
          longitude: Math.round(r.longitude * 1e6) / 1e6,
          area_type: r.alandSqmi > 0 ? 'standard' : 'po-box',
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
      process.stdout.write(
        `  ${pct}% — ${zipsInserted.toLocaleString()} inserted, ${zipsErrors} errors\r`
      )
    }
  }

  console.log()

  // 4. Try to link ZIP codes to existing locations_us records
  // (locations_us may already be populated from another source)
  console.log('\nLinking ZIP codes to existing locations...')
  const locationIdMap = new Map<string, string>()

  let locationOffset = 0
  const LOCATION_PAGE = 1000
  while (true) {
    const { data: locs } = await supabase
      .from('locations_us')
      .select('id, slug, state_id')
      .range(locationOffset, locationOffset + LOCATION_PAGE - 1)

    if (!locs?.length) break
    locs.forEach(l => {
      const stateAbbr = states.find(s => s.id === l.state_id)?.abbreviation
      if (stateAbbr) {
        locationIdMap.set(`${l.slug}|${stateAbbr}`, l.id)
      }
    })
    locationOffset += LOCATION_PAGE
    if (locs.length < LOCATION_PAGE) break
  }

  if (locationIdMap.size > 0) {
    console.log(`Found ${locationIdMap.size.toLocaleString()} existing locations`)
    console.log('(ZIP-to-location linking requires city data — run a city ingestion script to populate locations_us)')
  } else {
    console.log('No existing locations found in locations_us table.')
    console.log('To link ZIP codes to cities, populate locations_us first, then re-run this script.')
  }

  // 5. Summary
  console.log('\n=== INGESTION COMPLETE ===')
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
