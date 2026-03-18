/**
 * Attorney Awards Ingestion Script
 *
 * Ingests professional awards/recognitions into the `attorney_awards` table.
 * Supports 4 data sources:
 *   1. martindale    — Martindale-Hubbell AV/BV ratings from martindale.com
 *   2. superlawyers  — Super Lawyers listings from superlawyers.com
 *   3. bestlawyers   — Best Lawyers listings from bestlawyers.com
 *   4. csv           — Manual import from a CSV file
 *
 * Table: attorney_awards (migration 429)
 *   id, attorney_id, title, issuer, year, specialty_id, url, is_verified, created_at
 *   UNIQUE constraint: (attorney_id, title, issuer, year)
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | xargs)
 *
 *   # Martindale-Hubbell AV ratings for Texas
 *   npx tsx scripts/ingest/attorney-awards.ts --source martindale --state TX [--dry-run] [--limit 100] [--concurrency 5]
 *
 *   # Super Lawyers for California
 *   npx tsx scripts/ingest/attorney-awards.ts --source superlawyers --state CA [--dry-run] [--limit 100]
 *
 *   # Best Lawyers for New York
 *   npx tsx scripts/ingest/attorney-awards.ts --source bestlawyers --state NY [--dry-run] [--limit 100]
 *
 *   # CSV import
 *   npx tsx scripts/ingest/attorney-awards.ts --source csv --csv-path /path/to/awards.csv [--dry-run] [--limit 1000]
 *
 * CSV columns: bar_number, bar_state, title, issuer, year, url
 */

import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse'
import { readFileSync } from 'fs'

// ============================================================================
// CONFIG
// ============================================================================

const BATCH_SIZE = 250
const DEFAULT_CONCURRENCY = 5
const MAX_RETRIES = 3
const BASE_RETRY_DELAY_MS = 2000
const REQUEST_DELAY_MS = 200

const HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

// US state codes for validation
const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
])

// ============================================================================
// CLI ARGS
// ============================================================================

const args = process.argv.slice(2)

function getArg(name: string): string | undefined {
  const idx = args.indexOf(name)
  return idx !== -1 ? args[idx + 1] : undefined
}

const SOURCE = getArg('--source') as 'martindale' | 'superlawyers' | 'bestlawyers' | 'csv' | undefined
const STATE = getArg('--state')?.toUpperCase()
const CSV_PATH = getArg('--csv-path')
const DRY_RUN = args.includes('--dry-run')
const LIMIT = (() => { const v = getArg('--limit'); return v ? parseInt(v, 10) : Infinity })()
const CONCURRENCY = (() => { const v = getArg('--concurrency'); return v ? parseInt(v, 10) : DEFAULT_CONCURRENCY })()

// Validate args
if (!SOURCE || !['martindale', 'superlawyers', 'bestlawyers', 'csv'].includes(SOURCE)) {
  console.error('Missing or invalid --source. Must be: martindale | superlawyers | bestlawyers | csv')
  process.exit(1)
}

if (SOURCE !== 'csv' && (!STATE || !US_STATES.has(STATE))) {
  console.error('Missing or invalid --state (2-letter code required for scraping sources)')
  process.exit(1)
}

if (SOURCE === 'csv' && !CSV_PATH) {
  console.error('Missing --csv-path (required for CSV import)')
  process.exit(1)
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('Run: export $(grep -v \'^#\' .env.local | xargs)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ============================================================================
// TYPES
// ============================================================================

interface RawAward {
  barNumber: string
  barState: string
  title: string
  issuer: string
  year: number | null
  url: string | null
  specialtySlug?: string | null
}

interface AwardInsert {
  attorney_id: string
  title: string
  issuer: string
  year: number | null
  specialty_id: string | null
  url: string | null
  is_verified: boolean
}

// ============================================================================
// HELPERS
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

/**
 * Fetch HTML with exponential backoff on errors/429s.
 */
async function fetchHTML(url: string): Promise<string | null> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: 'follow' })
      if (res.ok) return await res.text()
      if (res.status === 429 || res.status >= 500) {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1)
        console.warn(`  HTTP ${res.status} on ${url}, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`)
        await sleep(delay)
        continue
      }
      console.warn(`  HTTP ${res.status} on ${url}, skipping`)
      return null
    } catch (err) {
      const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1)
      console.warn(`  Fetch error on ${url}: ${err}, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`)
      if (attempt < MAX_RETRIES) await sleep(delay)
    }
  }
  return null
}

/**
 * Run async tasks with bounded concurrency.
 */
async function parallelMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = []
  let nextIndex = 0

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const idx = nextIndex++
      results[idx] = await fn(items[idx], idx)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

// ============================================================================
// ATTORNEY LOOKUP
// Resolve bar_number + bar_state -> attorney_id via the attorneys table
// ============================================================================

/**
 * Batch-lookup attorneys by bar_number + bar_state pairs.
 * Returns a Map<"barNumber|barState", attorney_id>.
 */
async function lookupAttorneys(
  pairs: Array<{ barNumber: string; barState: string }>,
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  if (pairs.length === 0) return result

  // Deduplicate lookup keys
  const uniqueKeys = new Map<string, { barNumber: string; barState: string }>()
  for (const p of pairs) {
    const key = `${p.barNumber}|${p.barState}`
    if (!uniqueKeys.has(key)) uniqueKeys.set(key, p)
  }

  // Batch by bar_state for efficient queries
  const byState = new Map<string, string[]>()
  for (const [, p] of uniqueKeys) {
    const arr = byState.get(p.barState) || []
    arr.push(p.barNumber)
    byState.set(p.barState, arr)
  }

  for (const [barState, barNumbers] of byState) {
    // Query in chunks of 500 to avoid Supabase URL length limits
    for (let i = 0; i < barNumbers.length; i += 500) {
      const chunk = barNumbers.slice(i, i + 500)
      const { data, error } = await supabase
        .from('attorneys')
        .select('id, bar_number, bar_state')
        .eq('bar_state', barState)
        .in('bar_number', chunk)

      if (error) {
        console.error(`  Lookup error for ${barState}: ${error.message}`)
        continue
      }

      for (const row of data || []) {
        result.set(`${row.bar_number}|${row.bar_state}`, row.id)
      }
    }
  }

  return result
}

/**
 * Lookup specialty_id by slug (cached).
 */
const specialtyCache = new Map<string, string | null>()

async function lookupSpecialty(slug: string | null | undefined): Promise<string | null> {
  if (!slug) return null
  if (specialtyCache.has(slug)) return specialtyCache.get(slug)!

  const { data } = await supabase
    .from('specialties')
    .select('id')
    .eq('slug', slug)
    .single()

  const id = data?.id || null
  specialtyCache.set(slug, id)
  return id
}

// ============================================================================
// SOURCE 1: MARTINDALE-HUBBELL
// Scrape AV Preeminent / BV Distinguished ratings from martindale.com
// ============================================================================

/**
 * Fetch attorney listings from Martindale-Hubbell for a given state.
 *
 * TODO: The exact URL structure and HTML selectors below are based on the
 * known martindale.com layout as of 2025. These may need adjustment if the
 * site redesigns or changes its markup. Test with --dry-run --limit 5 first.
 */
async function fetchMartindale(state: string): Promise<RawAward[]> {
  const awards: RawAward[] = []
  const currentYear = new Date().getFullYear()

  // TODO: Martindale-Hubbell may use a search API or paginated HTML listings.
  // The base URL pattern below is an approximation. Verify against the live site.
  // Some known patterns:
  //   https://www.martindale.com/search/attorneys/?state=TX&rating=av
  //   https://www.martindale.com/search/attorneys/?state=TX&rating=bv
  const ratings = [
    { code: 'av', title: 'AV Preeminent', issuer: 'Martindale-Hubbell' },
    { code: 'bv', title: 'BV Distinguished', issuer: 'Martindale-Hubbell' },
  ]

  for (const rating of ratings) {
    let page = 1
    let hasMore = true

    while (hasMore && awards.length < LIMIT) {
      // TODO: Adjust URL pattern and pagination parameter as needed
      const url = `https://www.martindale.com/search/attorneys/?state=${state}&rating=${rating.code}&page=${page}`
      console.log(`  Fetching: ${url}`)

      const html = await fetchHTML(url)
      if (!html) { hasMore = false; break }

      // TODO: Adjust selectors based on current Martindale HTML structure.
      // Expected pattern: attorney cards with name, bar number, location, rating badge.
      //
      // Example parsing logic (selectors are approximate):
      //   - Attorney cards: <div class="attorney-card"> or similar
      //   - Name link: <a href="/attorney/john-doe-12345"> containing bar number in URL
      //   - Rating badge: <span class="rating-badge">AV</span>
      //
      // For now, attempt regex-based extraction:
      const cardRegex = /class="[^"]*attorney[^"]*"[\s\S]*?href="\/attorney\/([^"]+)"[\s\S]*?(?:bar[- _]?(?:number|no|#)[:\s]*(\d+))/gi
      let match
      let foundAny = false

      while ((match = cardRegex.exec(html)) !== null) {
        foundAny = true
        const barNumber = match[2]
        if (!barNumber) continue

        const profileUrl = `https://www.martindale.com/attorney/${match[1]}`

        awards.push({
          barNumber,
          barState: state,
          title: rating.title,
          issuer: rating.issuer,
          year: currentYear,
          url: profileUrl,
        })

        if (awards.length >= LIMIT) break
      }

      // TODO: Detect pagination — look for "next page" link or total results count
      // If no cards found on this page, stop
      if (!foundAny) { hasMore = false; break }

      page++
      await sleep(REQUEST_DELAY_MS)
    }
  }

  console.log(`  Martindale: extracted ${awards.length} raw award entries for ${state}`)
  return awards
}

// ============================================================================
// SOURCE 2: SUPER LAWYERS
// Scrape listings from superlawyers.com by state
// ============================================================================

/**
 * Fetch Super Lawyers listings for a given state.
 *
 * TODO: superlawyers.com uses dynamic rendering (React SPA). The HTML
 * selectors below are approximate. You may need to:
 *   1. Use their internal JSON API (check network tab for XHR requests)
 *   2. Use a headless browser (Playwright) if content is client-rendered
 * Test with --dry-run --limit 5 first.
 */
async function fetchSuperLawyers(state: string): Promise<RawAward[]> {
  const awards: RawAward[] = []
  const currentYear = new Date().getFullYear()

  // TODO: The URL structure may vary. Known patterns:
  //   https://www.superlawyers.com/redir?r=state/texas
  //   https://attorneys.superlawyers.com/texas/
  //   https://www.superlawyers.com/api/search?state=TX&page=1
  // Check the actual site for the correct endpoint.
  const stateNames: Record<string, string> = {
    AL: 'alabama', AK: 'alaska', AZ: 'arizona', AR: 'arkansas', CA: 'california',
    CO: 'colorado', CT: 'connecticut', DE: 'delaware', FL: 'florida', GA: 'georgia',
    HI: 'hawaii', ID: 'idaho', IL: 'illinois', IN: 'indiana', IA: 'iowa',
    KS: 'kansas', KY: 'kentucky', LA: 'louisiana', ME: 'maine', MD: 'maryland',
    MA: 'massachusetts', MI: 'michigan', MN: 'minnesota', MS: 'mississippi', MO: 'missouri',
    MT: 'montana', NE: 'nebraska', NV: 'nevada', NH: 'new-hampshire', NJ: 'new-jersey',
    NM: 'new-mexico', NY: 'new-york', NC: 'north-carolina', ND: 'north-dakota', OH: 'ohio',
    OK: 'oklahoma', OR: 'oregon', PA: 'pennsylvania', RI: 'rhode-island', SC: 'south-carolina',
    SD: 'south-dakota', TN: 'tennessee', TX: 'texas', UT: 'utah', VT: 'vermont',
    VA: 'virginia', WA: 'washington', WV: 'west-virginia', WI: 'wisconsin', WY: 'wyoming',
    DC: 'district-of-columbia',
  }

  const stateName = stateNames[state]
  if (!stateName) {
    console.error(`  Unknown state code: ${state}`)
    return awards
  }

  let page = 1
  let hasMore = true

  while (hasMore && awards.length < LIMIT) {
    // TODO: Adjust URL — try the API endpoint or HTML listing URL
    const url = `https://attorneys.superlawyers.com/${stateName}/?page=${page}`
    console.log(`  Fetching: ${url}`)

    const html = await fetchHTML(url)
    if (!html) { hasMore = false; break }

    // TODO: Adjust selectors based on current Super Lawyers HTML/JSON structure.
    // Known patterns for attorney cards:
    //   - <div class="posl-profile-card">
    //   - JSON-LD structured data on listing pages
    //   - Name, practice area, designation ("Super Lawyers" or "Rising Stars")
    //
    // Attempt regex-based extraction (approximate):
    const profileRegex = /href="\/([^"]+)"[^>]*>[\s\S]*?class="[^"]*name[^"]*">([^<]+)/gi
    let match
    let foundAny = false

    while ((match = profileRegex.exec(html)) !== null) {
      foundAny = true
      const profilePath = match[1]
      const name = match[2]?.trim()
      if (!name) continue

      // TODO: Extract bar number from the profile page or the listing card.
      // Super Lawyers listings typically do NOT show bar numbers on the listing page.
      // You may need to:
      //   1. Visit each attorney's detail page to find their bar number
      //   2. Or match by name + state (less reliable)
      // For now, we skip entries without bar numbers.

      // Check for designation type (Super Lawyers vs Rising Stars)
      const isRisingStar = html.substring(Math.max(0, match.index - 500), match.index + 500)
        .toLowerCase().includes('rising star')

      const designation = isRisingStar ? 'Rising Stars' : 'Super Lawyers'

      // TODO: This placeholder requires bar number extraction from detail pages.
      // Uncomment and adjust once bar number extraction is implemented:
      // awards.push({
      //   barNumber: extractedBarNumber,
      //   barState: state,
      //   title: designation,
      //   issuer: 'Thomson Reuters Super Lawyers',
      //   year: currentYear,
      //   url: `https://attorneys.superlawyers.com/${profilePath}`,
      // })

      // Placeholder: log what we found
      console.log(`    Found: ${name} — ${designation} (bar number extraction needed)`)

      if (awards.length >= LIMIT) break
    }

    if (!foundAny) { hasMore = false; break }

    page++
    await sleep(REQUEST_DELAY_MS)
  }

  console.log(`  Super Lawyers: extracted ${awards.length} raw award entries for ${state}`)
  console.log(`  NOTE: Super Lawyers extraction requires bar number lookup from detail pages.`)
  console.log(`        Implement detail page fetching or name-matching to complete this source.`)
  return awards
}

// ============================================================================
// SOURCE 3: BEST LAWYERS
// Scrape listings from bestlawyers.com by location
// ============================================================================

/**
 * Fetch Best Lawyers listings for a given state.
 *
 * TODO: bestlawyers.com uses a search/filter interface. The exact API
 * endpoints and HTML selectors below are approximate. You may need to:
 *   1. Inspect the network tab for their internal API (likely JSON)
 *   2. Handle authentication/session cookies
 * Test with --dry-run --limit 5 first.
 */
async function fetchBestLawyers(state: string): Promise<RawAward[]> {
  const awards: RawAward[] = []
  const currentYear = new Date().getFullYear()

  // TODO: Best Lawyers URL structure (approximate):
  //   https://www.bestlawyers.com/search?state=Texas
  //   https://www.bestlawyers.com/api/lawyers?state=TX&page=1
  // The site may require cookies/session. Check the actual endpoints.

  let page = 1
  let hasMore = true

  while (hasMore && awards.length < LIMIT) {
    // TODO: Adjust the URL structure based on actual site inspection
    const url = `https://www.bestlawyers.com/search?state=${state}&page=${page}`
    console.log(`  Fetching: ${url}`)

    const html = await fetchHTML(url)
    if (!html) { hasMore = false; break }

    // TODO: Adjust selectors based on current Best Lawyers HTML/JSON structure.
    // Known patterns:
    //   - Lawyer cards with name, firm, practice area, location
    //   - Possible JSON-LD or embedded JSON data
    //   - Designation types: "Best Lawyers", "Ones to Watch", "Lawyer of the Year"
    //
    // Attempt regex extraction (approximate):
    const lawyerRegex = /class="[^"]*lawyer[^"]*"[\s\S]*?href="\/lawyers\/([^"]+)"[\s\S]*?class="[^"]*name[^"]*">([^<]+)/gi
    let match
    let foundAny = false

    while ((match = lawyerRegex.exec(html)) !== null) {
      foundAny = true
      const profilePath = match[1]
      const name = match[2]?.trim()
      if (!name) continue

      // TODO: Same as Super Lawyers — bar number is typically not on the listing page.
      // Need to either:
      //   1. Fetch detail pages for bar numbers
      //   2. Match by name + state against our attorneys table
      // Placeholder logging:
      console.log(`    Found: ${name} (bar number extraction needed)`)

      // TODO: Detect designation type
      // const isOTW = html.substring(...).includes('Ones to Watch')
      // const isLOTY = html.substring(...).includes('Lawyer of the Year')

      if (awards.length >= LIMIT) break
    }

    if (!foundAny) { hasMore = false; break }

    page++
    await sleep(REQUEST_DELAY_MS)
  }

  console.log(`  Best Lawyers: extracted ${awards.length} raw award entries for ${state}`)
  console.log(`  NOTE: Best Lawyers extraction requires bar number lookup from detail pages.`)
  console.log(`        Implement detail page fetching or name-matching to complete this source.`)
  return awards
}

// ============================================================================
// SOURCE 4: CSV IMPORT (fully functional)
// Expected columns: bar_number, bar_state, title, issuer, year, url
// ============================================================================

async function loadCSV(filePath: string): Promise<RawAward[]> {
  console.log(`  Reading CSV: ${filePath}`)
  const raw = readFileSync(filePath, 'utf-8')

  const records: Array<Record<string, string>> = await new Promise((resolve, reject) => {
    const rows: Array<Record<string, string>> = []
    const parser = parse(raw, {
      columns: (header: string[]) =>
        header.map((h: string) => h.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')),
      skip_empty_lines: true,
      trim: true,
    })
    parser.on('data', (row: Record<string, string>) => rows.push(row))
    parser.on('error', reject)
    parser.on('end', () => resolve(rows))
  })

  console.log(`  Parsed ${records.length.toLocaleString()} rows from CSV`)

  const awards: RawAward[] = []
  let skipped = 0

  for (const row of records) {
    const barNumber = row.bar_number?.trim()
    const barState = row.bar_state?.trim()?.toUpperCase()
    const title = row.title?.trim()
    const issuer = row.issuer?.trim()

    // Validate required fields
    if (!barNumber || !barState || !title || !issuer) {
      skipped++
      continue
    }

    if (!US_STATES.has(barState)) {
      skipped++
      continue
    }

    const yearRaw = row.year?.trim()
    const year = yearRaw ? parseInt(yearRaw, 10) : null
    if (year !== null && (isNaN(year) || year < 1950 || year > 2100)) {
      skipped++
      continue
    }

    awards.push({
      barNumber,
      barState,
      title,
      issuer,
      year,
      url: row.url?.trim() || null,
    })

    if (awards.length >= LIMIT) break
  }

  if (skipped > 0) {
    console.log(`  Skipped ${skipped} rows (missing required fields or invalid data)`)
  }

  return awards
}

// ============================================================================
// UPSERT PIPELINE
// ============================================================================

async function upsertAwards(rawAwards: RawAward[]): Promise<{ inserted: number; matched: number; unmatched: number; errors: number }> {
  let inserted = 0
  let matched = 0
  let unmatched = 0
  let errors = 0

  if (rawAwards.length === 0) {
    console.log('  No awards to upsert.')
    return { inserted, matched, unmatched, errors }
  }

  // Step 1: Lookup all attorney_ids by bar_number + bar_state
  console.log(`\n  Looking up ${rawAwards.length.toLocaleString()} attorneys by bar_number + bar_state...`)
  const attorneyMap = await lookupAttorneys(
    rawAwards.map(a => ({ barNumber: a.barNumber, barState: a.barState })),
  )
  console.log(`  Found ${attorneyMap.size.toLocaleString()} matching attorneys in DB`)

  // Step 2: Build insert rows (only for matched attorneys)
  const rows: AwardInsert[] = []
  const unmatchedEntries: RawAward[] = []

  for (const award of rawAwards) {
    const key = `${award.barNumber}|${award.barState}`
    const attorneyId = attorneyMap.get(key)
    if (!attorneyId) {
      unmatchedEntries.push(award)
      unmatched++
      continue
    }
    matched++

    const specialtyId = await lookupSpecialty(award.specialtySlug)

    rows.push({
      attorney_id: attorneyId,
      title: award.title,
      issuer: award.issuer,
      year: award.year,
      specialty_id: specialtyId,
      url: award.url,
      is_verified: false,
    })
  }

  if (unmatchedEntries.length > 0 && unmatchedEntries.length <= 20) {
    console.log(`\n  Unmatched attorneys (no DB record):`)
    for (const e of unmatchedEntries) {
      console.log(`    ${e.barState} #${e.barNumber} — ${e.title} (${e.issuer})`)
    }
  } else if (unmatchedEntries.length > 20) {
    console.log(`\n  ${unmatchedEntries.length} unmatched attorneys (showing first 10):`)
    for (const e of unmatchedEntries.slice(0, 10)) {
      console.log(`    ${e.barState} #${e.barNumber} — ${e.title} (${e.issuer})`)
    }
  }

  if (DRY_RUN) {
    console.log(`\n  --- DRY RUN: would upsert ${rows.length.toLocaleString()} awards ---`)
    if (rows.length > 0) {
      console.log('  Sample (first 3):')
      rows.slice(0, 3).forEach((r, i) => console.log(`    [${i + 1}]`, JSON.stringify(r, null, 2)))
    }
    return { inserted: 0, matched, unmatched, errors: 0 }
  }

  // Step 3: Batch upsert
  console.log(`\n  Upserting ${rows.length.toLocaleString()} awards in batches of ${BATCH_SIZE}...`)
  const startTime = Date.now()

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)

    const { error } = await supabase
      .from('attorney_awards')
      .upsert(batch, {
        onConflict: 'attorney_id,title,issuer,year',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} error: ${error.message}`)
      errors += batch.length
    } else {
      inserted += batch.length
    }

    // Progress log every 5 batches or on last batch
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(rows.length / BATCH_SIZE)
    if (batchNum % 5 === 0 || batchNum === totalBatches) {
      const pct = Math.min(100, Math.round(((i + batch.length) / rows.length) * 100))
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`  [${pct}%] ${inserted.toLocaleString()} inserted, ${errors} errors — ${elapsed}s`)
    }
  }

  return { inserted, matched, unmatched, errors }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const sourceLabel = {
    martindale: 'Martindale-Hubbell',
    superlawyers: 'Super Lawyers',
    bestlawyers: 'Best Lawyers',
    csv: 'CSV Import',
  }[SOURCE!]

  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log(`║  Attorney Awards Ingestion — ${sourceLabel.padEnd(30)}║`)
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log()
  console.log(`Source:      ${SOURCE}`)
  if (STATE) console.log(`State:       ${STATE}`)
  if (CSV_PATH) console.log(`CSV:         ${CSV_PATH}`)
  console.log(`Mode:        ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit:       ${LIMIT === Infinity ? 'ALL' : LIMIT}`)
  console.log(`Concurrency: ${CONCURRENCY}`)
  console.log(`Batch size:  ${BATCH_SIZE}`)
  console.log()

  // Fetch raw awards from the selected source
  let rawAwards: RawAward[]

  const fetchStart = Date.now()
  switch (SOURCE) {
    case 'martindale':
      rawAwards = await fetchMartindale(STATE!)
      break
    case 'superlawyers':
      rawAwards = await fetchSuperLawyers(STATE!)
      break
    case 'bestlawyers':
      rawAwards = await fetchBestLawyers(STATE!)
      break
    case 'csv':
      rawAwards = await loadCSV(CSV_PATH!)
      break
    default:
      console.error(`Unknown source: ${SOURCE}`)
      process.exit(1)
  }

  const fetchElapsed = ((Date.now() - fetchStart) / 1000).toFixed(1)
  console.log(`\n  Fetch phase: ${rawAwards.length.toLocaleString()} raw awards in ${fetchElapsed}s`)

  if (rawAwards.length === 0) {
    console.log('\n  No awards found. Nothing to do.')
    return
  }

  // Upsert into attorney_awards
  const stats = await upsertAwards(rawAwards)

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('ATTORNEY AWARDS INGESTION COMPLETE')
  console.log('='.repeat(60))
  console.log(`  Source:     ${sourceLabel}`)
  if (STATE) console.log(`  State:      ${STATE}`)
  console.log(`  Raw awards: ${rawAwards.length.toLocaleString()}`)
  console.log(`  Matched:    ${stats.matched.toLocaleString()}`)
  console.log(`  Unmatched:  ${stats.unmatched.toLocaleString()}`)
  console.log(`  Inserted:   ${stats.inserted.toLocaleString()}`)
  console.log(`  Errors:     ${stats.errors.toLocaleString()}`)
  console.log('='.repeat(60))

  // Verify count (if not dry run and we have a state)
  if (!DRY_RUN && STATE) {
    const { count } = await supabase
      .from('attorney_awards')
      .select('*', { count: 'exact', head: true })

    console.log(`\nTotal awards in DB: ${count?.toLocaleString() || 'unknown'}`)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
