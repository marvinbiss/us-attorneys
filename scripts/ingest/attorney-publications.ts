/**
 * Attorney Publications Ingestion Script
 * Sources: SSRN, Google Scholar, CSV import
 * Target table: attorney_publications (migration 429)
 *
 * Usage:
 *   npx tsx scripts/ingest/attorney-publications.ts --source csv --csv-path /path/to/file.csv [--dry-run] [--limit 100]
 *   npx tsx scripts/ingest/attorney-publications.ts --source ssrn --attorneys-from db [--dry-run] [--limit 50]
 *   npx tsx scripts/ingest/attorney-publications.ts --source scholar --attorneys-from file --attorneys-file names.txt [--dry-run] [--limit 20]
 */

import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse'
import * as fs from 'fs'

// ============================================================================
// CONFIG
// ============================================================================

const BATCH_SIZE = 250
const SSRN_DELAY_MS = 2000 // 1 req per 2s
const SCHOLAR_MIN_DELAY_MS = 3000
const SCHOLAR_MAX_DELAY_MS = 8000

const VALID_PUBLICATION_TYPES = [
  'article', 'book', 'book_chapter', 'law_review', 'blog_post',
  'speaking', 'testimony', 'amicus_brief', 'other',
] as const

type PublicationType = typeof VALID_PUBLICATION_TYPES[number]

// ============================================================================
// CLI ARGS
// ============================================================================

const args = process.argv.slice(2)

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx !== -1 ? args[idx + 1] : undefined
}

const SOURCE = getArg('source') as 'ssrn' | 'scholar' | 'csv' | undefined
const CSV_PATH = getArg('csv-path')
const ATTORNEYS_FROM = (getArg('attorneys-from') || 'db') as 'db' | 'file'
const ATTORNEYS_FILE = getArg('attorneys-file')
const DRY_RUN = args.includes('--dry-run')
const LIMIT = (() => {
  const idx = args.indexOf('--limit')
  return idx !== -1 ? parseInt(args[idx + 1], 10) : Infinity
})()

if (!SOURCE || !['ssrn', 'scholar', 'csv'].includes(SOURCE)) {
  console.error('Usage: --source ssrn|scholar|csv is required')
  console.error('  CSV:     --source csv --csv-path /path/to/file.csv')
  console.error('  SSRN:    --source ssrn --attorneys-from db|file [--attorneys-file names.txt]')
  console.error('  Scholar: --source scholar --attorneys-from db|file [--attorneys-file names.txt]')
  console.error('  Options: --dry-run --limit N')
  process.exit(1)
}

if (SOURCE === 'csv' && !CSV_PATH) {
  console.error('--csv-path is required when --source csv')
  process.exit(1)
}

if (ATTORNEYS_FROM === 'file' && !ATTORNEYS_FILE) {
  console.error('--attorneys-file is required when --attorneys-from file')
  process.exit(1)
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('Run: source .env.local && npx tsx scripts/ingest/attorney-publications.ts ...')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ============================================================================
// TYPES
// ============================================================================

interface CsvRow {
  bar_number: string
  bar_state: string
  title: string
  publication_type: string
  publisher: string
  published_date: string
  url: string
  doi: string
}

interface PublicationInsert {
  attorney_id: string
  title: string
  publication_type: PublicationType
  publisher: string | null
  published_date: string | null
  url: string | null
  doi: string | null
  specialty_id: string | null
  is_verified: boolean
}

interface AttorneyRecord {
  id: string
  name: string
  bar_number: string
  bar_state: string
}

interface SSRNPaper {
  title: string
  url: string
  doi: string | null
  publisher: string | null
  published_date: string | null
  abstract_type: 'law_review' | 'article'
}

interface ScholarResult {
  title: string
  url: string | null
  publisher: string | null
  published_date: string | null
  publication_type: PublicationType
}

// ============================================================================
// STATS
// ============================================================================

const stats = {
  processed: 0,
  inserted: 0,
  skipped: 0,
  errors: 0,
  duplicates: 0,
  captchaBlocked: false,
}

// ============================================================================
// HELPERS
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
  return sleep(ms)
}

function normalizePublicationType(raw: string): PublicationType | null {
  const lower = raw.toLowerCase().trim()
  // Direct matches
  if (VALID_PUBLICATION_TYPES.includes(lower as PublicationType)) {
    return lower as PublicationType
  }
  // Common aliases
  const aliases: Record<string, PublicationType> = {
    'journal article': 'article',
    'journal': 'article',
    'paper': 'article',
    'research paper': 'article',
    'working paper': 'article',
    'review': 'law_review',
    'law review article': 'law_review',
    'legal review': 'law_review',
    'chapter': 'book_chapter',
    'blog': 'blog_post',
    'post': 'blog_post',
    'speech': 'speaking',
    'presentation': 'speaking',
    'lecture': 'speaking',
    'panel': 'speaking',
    'webinar': 'speaking',
    'congressional testimony': 'testimony',
    'expert testimony': 'testimony',
    'amicus': 'amicus_brief',
    'brief': 'amicus_brief',
  }
  return aliases[lower] || null
}

function parseDate(dateStr: string | null | undefined): string | null {
  if (!dateStr?.trim()) return null
  const trimmed = dateStr.trim()

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  // YYYY-MM
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`
  // YYYY
  if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01`
  // MM/DD/YYYY
  const mdyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mdyMatch) {
    const [, m, d, y] = mdyMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  return null
}

// Rotating user agents for Scholar scraping
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
]

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

// ============================================================================
// ATTORNEY LOADING
// ============================================================================

async function loadAttorneysFromDb(limit: number): Promise<AttorneyRecord[]> {
  console.log('Loading attorneys from database...')
  const { data, error } = await supabase
    .from('attorneys')
    .select('id, name, bar_number, bar_state')
    .eq('is_active', true)
    .not('bar_number', 'is', null)
    .order('name')
    .limit(limit)

  if (error) {
    console.error('Failed to load attorneys from DB:', error.message)
    process.exit(1)
  }

  console.log(`Loaded ${data.length} attorneys from DB`)
  return data as AttorneyRecord[]
}

function loadAttorneysFromFile(filePath: string, limit: number): string[] {
  console.log(`Loading attorney names from ${filePath}...`)
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    process.exit(1)
  }

  const names = fs.readFileSync(filePath, 'utf-8')
    .split('\n')
    .map(n => n.trim())
    .filter(Boolean)
    .slice(0, limit)

  console.log(`Loaded ${names.length} attorney names from file`)
  return names
}

async function lookupAttorneyByBarNumber(
  barNumber: string,
  barState: string
): Promise<AttorneyRecord | null> {
  const { data } = await supabase
    .from('attorneys')
    .select('id, name, bar_number, bar_state')
    .eq('bar_number', barNumber.trim())
    .eq('bar_state', barState.trim().toUpperCase())
    .single()

  return data as AttorneyRecord | null
}

async function searchAttorneyByName(name: string): Promise<AttorneyRecord | null> {
  // Use ilike for fuzzy name matching — returns first match
  const { data } = await supabase
    .from('attorneys')
    .select('id, name, bar_number, bar_state')
    .ilike('name', `%${name}%`)
    .limit(1)
    .single()

  return data as AttorneyRecord | null
}

// ============================================================================
// SOURCE: CSV IMPORT
// ============================================================================

async function ingestFromCsv(csvPath: string): Promise<void> {
  console.log(`\nReading CSV from ${csvPath}...`)

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`)
    process.exit(1)
  }

  const csvText = fs.readFileSync(csvPath, 'utf-8')
  const records: CsvRow[] = await new Promise((resolve, reject) => {
    const rows: CsvRow[] = []
    const parser = parse(csvText, {
      columns: (header: string[]) => header.map((h: string) =>
        h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      ),
      skip_empty_lines: true,
      trim: true,
    })
    parser.on('data', (row: CsvRow) => rows.push(row))
    parser.on('error', reject)
    parser.on('end', () => resolve(rows))
  })

  console.log(`Parsed ${records.length} CSV rows`)

  const usable = records.slice(0, LIMIT)
  console.log(`Processing ${usable.length} rows (after limit)`)

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: showing first 3 rows ---')
    for (const row of usable.slice(0, 3)) {
      const attorney = await lookupAttorneyByBarNumber(row.bar_number, row.bar_state)
      const pubType = normalizePublicationType(row.publication_type)
      console.log({
        bar: `${row.bar_state}#${row.bar_number}`,
        attorney_found: !!attorney,
        attorney_name: attorney?.name || 'NOT FOUND',
        title: row.title,
        publication_type: pubType || `INVALID(${row.publication_type})`,
        published_date: parseDate(row.published_date),
      })
    }
    console.log('\nDry run complete. No data written.')
    return
  }

  // Build publications batch, resolving attorney_id via bar_number + bar_state
  const publications: PublicationInsert[] = []
  const missingAttorneys: string[] = []
  const invalidTypes: string[] = []

  for (let i = 0; i < usable.length; i++) {
    const row = usable[i]
    stats.processed++

    // Validate publication_type
    const pubType = normalizePublicationType(row.publication_type)
    if (!pubType) {
      invalidTypes.push(`Row ${i + 1}: "${row.publication_type}"`)
      stats.skipped++
      continue
    }

    // Look up attorney
    const attorney = await lookupAttorneyByBarNumber(row.bar_number, row.bar_state)
    if (!attorney) {
      missingAttorneys.push(`${row.bar_state}#${row.bar_number}`)
      stats.skipped++
      continue
    }

    publications.push({
      attorney_id: attorney.id,
      title: row.title.trim(),
      publication_type: pubType,
      publisher: row.publisher?.trim() || null,
      published_date: parseDate(row.published_date),
      url: row.url?.trim() || null,
      doi: row.doi?.trim() || null,
      specialty_id: null,
      is_verified: false,
    })

    // Progress logging every 100 rows
    if (stats.processed % 100 === 0) {
      console.log(`  Processed ${stats.processed}/${usable.length} rows...`)
    }
  }

  if (missingAttorneys.length > 0) {
    console.log(`\nWarning: ${missingAttorneys.length} attorneys not found in DB`)
    if (missingAttorneys.length <= 10) {
      missingAttorneys.forEach(a => console.log(`  - ${a}`))
    } else {
      missingAttorneys.slice(0, 5).forEach(a => console.log(`  - ${a}`))
      console.log(`  ... and ${missingAttorneys.length - 5} more`)
    }
  }

  if (invalidTypes.length > 0) {
    console.log(`\nWarning: ${invalidTypes.length} invalid publication types`)
    invalidTypes.slice(0, 5).forEach(t => console.log(`  - ${t}`))
  }

  // Batch upsert
  await batchUpsertPublications(publications)
}

// ============================================================================
// SOURCE: SSRN
// ============================================================================

// TODO: SSRN HTML structure may change — adjust selectors as needed.
// The SSRN search URL and response parsing are scaffolded but will require
// testing against the live site and adjusting CSS selectors / response format.

async function fetchSSRNPapers(attorneyName: string): Promise<SSRNPaper[]> {
  const query = encodeURIComponent(attorneyName)
  const url = `https://papers.ssrn.com/sol3/results.cfm?txtKey_Words=${query}&npage=1&stype=author`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    if (!response.ok) {
      console.warn(`  SSRN HTTP ${response.status} for "${attorneyName}"`)
      return []
    }

    const html = await response.text()

    // TODO: Parse SSRN search results HTML.
    // SSRN returns results in a table-like structure. Key elements to extract:
    //   - Paper title: look for <a> tags with class containing "title" or within result rows
    //   - Paper URL: the href of the title link (e.g., https://papers.ssrn.com/sol3/papers.cfm?abstract_id=XXXXXXX)
    //   - DOI: may appear in metadata or need a secondary fetch to the paper page
    //   - Date: usually displayed as "Posted: YYYY-MM-DD" or similar
    //   - Type: SSRN papers are typically 'article' or 'law_review'
    //
    // Recommended approach:
    //   1. Use a lightweight HTML parser (e.g., cheerio) to extract result rows
    //   2. For each row, extract title, URL, date
    //   3. Optionally fetch individual paper pages for DOI extraction
    //
    // Example (pseudo-code with cheerio):
    //   const $ = cheerio.load(html)
    //   $('.result-item').each((_, el) => {
    //     const title = $(el).find('.title a').text().trim()
    //     const paperUrl = $(el).find('.title a').attr('href')
    //     const dateText = $(el).find('.date').text().trim()
    //     papers.push({ title, url: paperUrl, doi: null, publisher: 'SSRN', published_date: parseDate(dateText), abstract_type: 'article' })
    //   })

    // Placeholder: detect if we got results at all
    const hasResults = html.includes('abstract_id=')
    if (!hasResults) {
      return []
    }

    console.warn(`  SSRN: Found results page for "${attorneyName}" — HTML parsing TODO`)
    return []
  } catch (err) {
    console.error(`  SSRN fetch error for "${attorneyName}":`, (err as Error).message)
    return []
  }
}

async function ingestFromSSRN(): Promise<void> {
  console.log('\n=== SSRN Ingestion Mode ===')
  console.log('NOTE: SSRN HTML parsing is scaffolded — requires selector tuning against live site.')

  let attorneys: AttorneyRecord[] = []

  if (ATTORNEYS_FROM === 'db') {
    attorneys = await loadAttorneysFromDb(LIMIT)
  } else {
    const names = loadAttorneysFromFile(ATTORNEYS_FILE!, LIMIT)
    // Resolve names to attorney records
    for (const name of names) {
      const attorney = await searchAttorneyByName(name)
      if (attorney) {
        attorneys.push(attorney)
      } else {
        console.warn(`  Attorney not found in DB: "${name}"`)
        stats.skipped++
      }
    }
  }

  console.log(`Will search SSRN for ${attorneys.length} attorneys`)

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: showing first 3 attorney searches ---')
    for (const attorney of attorneys.slice(0, 3)) {
      console.log(`  Would search SSRN for: "${attorney.name}" (${attorney.bar_state}#${attorney.bar_number})`)
      const papers = await fetchSSRNPapers(attorney.name)
      console.log(`  Results: ${papers.length} papers found`)
      await sleep(SSRN_DELAY_MS)
    }
    console.log('\nDry run complete. No data written.')
    return
  }

  const allPublications: PublicationInsert[] = []

  for (let i = 0; i < attorneys.length; i++) {
    const attorney = attorneys[i]
    stats.processed++

    console.log(`  [${i + 1}/${attorneys.length}] Searching SSRN for "${attorney.name}"...`)

    const papers = await fetchSSRNPapers(attorney.name)

    for (const paper of papers) {
      allPublications.push({
        attorney_id: attorney.id,
        title: paper.title,
        publication_type: paper.abstract_type,
        publisher: paper.publisher || 'SSRN',
        published_date: paper.published_date,
        url: paper.url,
        doi: paper.doi,
        specialty_id: null,
        is_verified: false,
      })
    }

    // Rate limit
    if (i < attorneys.length - 1) {
      await sleep(SSRN_DELAY_MS)
    }

    // Progress every 25 attorneys
    if ((i + 1) % 25 === 0) {
      console.log(`  Progress: ${i + 1}/${attorneys.length} attorneys, ${allPublications.length} papers found`)
    }
  }

  if (allPublications.length > 0) {
    await batchUpsertPublications(allPublications)
  } else {
    console.log('\nNo publications found to insert.')
  }
}

// ============================================================================
// SOURCE: GOOGLE SCHOLAR
// ============================================================================

// TODO: Google Scholar is aggressive about blocking scrapers.
// In production, this WILL require:
//   - Proxy rotation (residential proxies recommended)
//   - CAPTCHA solving service integration (e.g., 2Captcha, Anti-Captcha)
//   - Session management with cookie persistence
//   - Consider using the Scholarly Python library as an alternative
//
// The current implementation uses rotating user agents and random delays,
// but will likely be blocked after 20-50 requests from a single IP.

function detectScholarBlock(html: string): boolean {
  const blockIndicators = [
    'unusual traffic',
    'captcha',
    'CAPTCHA',
    'automated requests',
    'sorry/image',
    'recaptcha',
    'not a robot',
    '/sorry/',
  ]
  return blockIndicators.some(indicator => html.includes(indicator))
}

async function fetchScholarResults(attorneyName: string): Promise<ScholarResult[]> {
  const query = encodeURIComponent(`author:"${attorneyName}" law`)
  const url = `https://scholar.google.com/scholar?q=${query}&hl=en&as_sdt=0,5`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'max-age=0',
      },
      redirect: 'follow',
    })

    if (response.status === 429) {
      console.error('  BLOCKED: Google Scholar returned 429 (Too Many Requests)')
      stats.captchaBlocked = true
      return []
    }

    if (!response.ok) {
      console.warn(`  Scholar HTTP ${response.status} for "${attorneyName}"`)
      return []
    }

    const html = await response.text()

    // Check for CAPTCHA / block page
    if (detectScholarBlock(html)) {
      console.error('  BLOCKED: Google Scholar CAPTCHA/block page detected')
      console.error('  Aborting Scholar scraping — consider using proxies.')
      stats.captchaBlocked = true
      return []
    }

    // TODO: Parse Google Scholar results HTML.
    // Scholar results are in div.gs_r elements. Key elements:
    //   - Title: <h3 class="gs_rt"><a href="...">Title</a></h3>
    //   - Snippet: <div class="gs_rs">...</div>
    //   - Meta: <div class="gs_a">Authors - Publisher, Year - source</div>
    //   - Links: <div class="gs_fl"> contains "Cited by", "Related articles", etc.
    //
    // Recommended approach:
    //   1. Use cheerio to parse the HTML
    //   2. For each .gs_r result:
    //      - Extract title from .gs_rt a
    //      - Extract URL from .gs_rt a[href]
    //      - Parse .gs_a for publisher and year
    //      - Determine publication_type from metadata:
    //        * If publisher contains "law review" or "journal" -> 'law_review'
    //        * If "[BOOK]" marker present -> 'book'
    //        * If "[CITATION]" marker -> 'article'
    //        * Default -> 'article'
    //
    // Example (pseudo-code with cheerio):
    //   const $ = cheerio.load(html)
    //   $('.gs_r .gs_ri').each((_, el) => {
    //     const title = $(el).find('.gs_rt a').text().trim()
    //     const url = $(el).find('.gs_rt a').attr('href')
    //     const meta = $(el).find('.gs_a').text() // "J Smith, R Jones - Harvard Law Review, 2023 - jstor.org"
    //     const yearMatch = meta.match(/(\d{4})/)
    //     const year = yearMatch ? yearMatch[1] : null
    //     const publisherMatch = meta.match(/- (.+?),\s*\d{4}/)
    //     const publisher = publisherMatch ? publisherMatch[1].trim() : null
    //     results.push({ title, url, publisher, published_date: year ? `${year}-01-01` : null, publication_type: 'article' })
    //   })

    const hasResults = html.includes('gs_rt')
    if (!hasResults) {
      return []
    }

    console.warn(`  Scholar: Found results page for "${attorneyName}" — HTML parsing TODO`)
    return []
  } catch (err) {
    console.error(`  Scholar fetch error for "${attorneyName}":`, (err as Error).message)
    return []
  }
}

async function ingestFromScholar(): Promise<void> {
  console.log('\n=== Google Scholar Ingestion Mode ===')
  console.log('WARNING: Scholar scraping is aggressive about blocking. Watch for CAPTCHA detection.')
  console.log('NOTE: HTML parsing is scaffolded — requires selector tuning against live site.')

  let attorneys: AttorneyRecord[] = []

  if (ATTORNEYS_FROM === 'db') {
    attorneys = await loadAttorneysFromDb(LIMIT)
  } else {
    const names = loadAttorneysFromFile(ATTORNEYS_FILE!, LIMIT)
    for (const name of names) {
      const attorney = await searchAttorneyByName(name)
      if (attorney) {
        attorneys.push(attorney)
      } else {
        console.warn(`  Attorney not found in DB: "${name}"`)
        stats.skipped++
      }
    }
  }

  console.log(`Will search Scholar for ${attorneys.length} attorneys`)

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: showing first 3 attorney searches ---')
    for (const attorney of attorneys.slice(0, 3)) {
      console.log(`  Would search Scholar for: "${attorney.name}" (${attorney.bar_state}#${attorney.bar_number})`)
      const results = await fetchScholarResults(attorney.name)
      console.log(`  Results: ${results.length} publications found`)
      if (stats.captchaBlocked) {
        console.error('\n  CAPTCHA detected during dry run — aborting.')
        break
      }
      await randomDelay(SCHOLAR_MIN_DELAY_MS, SCHOLAR_MAX_DELAY_MS)
    }
    console.log('\nDry run complete. No data written.')
    return
  }

  const allPublications: PublicationInsert[] = []

  for (let i = 0; i < attorneys.length; i++) {
    // Abort if blocked
    if (stats.captchaBlocked) {
      console.error(`\nAborting: CAPTCHA/block detected after ${i} attorneys.`)
      console.error('Consider retrying with proxy rotation.')
      break
    }

    const attorney = attorneys[i]
    stats.processed++

    console.log(`  [${i + 1}/${attorneys.length}] Searching Scholar for "${attorney.name}"...`)

    const results = await fetchScholarResults(attorney.name)

    for (const result of results) {
      allPublications.push({
        attorney_id: attorney.id,
        title: result.title,
        publication_type: result.publication_type,
        publisher: result.publisher,
        published_date: result.published_date,
        url: result.url,
        doi: null, // Scholar doesn't reliably expose DOIs in search results
        specialty_id: null,
        is_verified: false,
      })
    }

    // Rate limit with random jitter
    if (i < attorneys.length - 1) {
      await randomDelay(SCHOLAR_MIN_DELAY_MS, SCHOLAR_MAX_DELAY_MS)
    }

    // Progress every 10 attorneys (Scholar is slow)
    if ((i + 1) % 10 === 0) {
      console.log(`  Progress: ${i + 1}/${attorneys.length} attorneys, ${allPublications.length} publications found`)
    }
  }

  if (allPublications.length > 0) {
    await batchUpsertPublications(allPublications)
  } else {
    console.log('\nNo publications found to insert.')
  }
}

// ============================================================================
// BATCH UPSERT
// ============================================================================

async function batchUpsertPublications(publications: PublicationInsert[]): Promise<void> {
  console.log(`\nUpserting ${publications.length} publications in batches of ${BATCH_SIZE}...`)

  for (let i = 0; i < publications.length; i += BATCH_SIZE) {
    const batch = publications.slice(i, i + BATCH_SIZE)

    const { error } = await supabase
      .from('attorney_publications')
      .upsert(batch, {
        onConflict: 'attorney_id,title,publisher',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message)
      stats.errors += batch.length
    } else {
      stats.inserted += batch.length
    }

    // Progress
    const pct = Math.min(100, Math.round(((i + batch.length) / publications.length) * 100))
    if (pct % 20 === 0 || i + BATCH_SIZE >= publications.length) {
      console.log(`  ${pct}% — ${stats.inserted} inserted, ${stats.errors} errors`)
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== Attorney Publications Ingestion ===')
  console.log(`Source: ${SOURCE}`)
  console.log(`Mode:   ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit:  ${LIMIT === Infinity ? 'ALL' : LIMIT}`)
  if (SOURCE !== 'csv') {
    console.log(`Attorneys from: ${ATTORNEYS_FROM}`)
  }
  console.log()

  switch (SOURCE) {
    case 'csv':
      await ingestFromCsv(CSV_PATH!)
      break
    case 'ssrn':
      await ingestFromSSRN()
      break
    case 'scholar':
      await ingestFromScholar()
      break
  }

  // Summary
  console.log('\n=== INGESTION SUMMARY ===')
  console.log(`Source:     ${SOURCE}`)
  console.log(`Processed:  ${stats.processed}`)
  console.log(`Inserted:   ${stats.inserted}`)
  console.log(`Skipped:    ${stats.skipped}`)
  console.log(`Errors:     ${stats.errors}`)
  if (stats.captchaBlocked) {
    console.log(`WARNING:    Scholar CAPTCHA/block was triggered`)
  }

  // Verify count in DB
  if (!DRY_RUN && stats.inserted > 0) {
    const { count } = await supabase
      .from('attorney_publications')
      .select('*', { count: 'exact', head: true })

    console.log(`\nTotal publications in DB: ${count?.toLocaleString() || 'unknown'}`)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
