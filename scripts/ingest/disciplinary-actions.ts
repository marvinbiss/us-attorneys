/**
 * Disciplinary Actions — Multi-State Bar Discipline Ingestion
 *
 * ============================================================================
 * LEGAL DATA: ZERO TOLERANCE FOR INACCURACY
 * Always verify source_url points to official state bar discipline board.
 * Never fabricate or assume disciplinary records.
 * source_url is NOT NULL in the DB — every record MUST have an official link.
 * ============================================================================
 *
 * Supported modes:
 *   1. --state CA  — Scrape California State Bar discipline tab
 *   2. --state NY  — Scrape New York court attorney discipline
 *   3. --state TX  — Scrape Texas Bar grievance/discipline
 *   4. --state FL  — Scrape Florida Bar discipline directory
 *   5. --csv-path /path/to/file.csv — Generic CSV import (any state)
 *
 * CSV format (header row required):
 *   bar_number, bar_state, action_type, effective_date, end_date,
 *   description, docket_number, source_url, is_public
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | xargs)
 *   npx tsx scripts/ingest/disciplinary-actions.ts --state CA [--dry-run] [--limit 50]
 *   npx tsx scripts/ingest/disciplinary-actions.ts --csv-path ./data/fl-discipline.csv [--dry-run]
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// ============================================================================
// LEGAL DATA WARNING — READ BEFORE MODIFYING
// ============================================================================
// This script handles attorney disciplinary records, which are:
//   - Legally sensitive public records
//   - Subject to defamation liability if inaccurate
//   - Required to have verifiable source_url (NOT NULL constraint in DB)
//
// RULES:
//   1. NEVER fabricate or assume disciplinary records
//   2. ALWAYS verify source_url points to official state bar discipline board
//   3. When in doubt, SKIP the record — better no data than wrong data
//   4. Log every skipped record with reason for audit trail
// ============================================================================

// ============================================================================
// CONFIG
// ============================================================================

const BATCH_SIZE = 250
const DEFAULT_CONCURRENCY = 10
const DELAY_MS = 300
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5000

const HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

// Valid action_type values per migration 429 CHECK constraint
const VALID_ACTION_TYPES = [
  'private_reprimand', 'public_reprimand', 'suspension', 'disbarment',
  'probation', 'censure', 'reinstatement', 'resignation', 'other',
] as const

type ActionType = typeof VALID_ACTION_TYPES[number]

// State-specific discipline board URLs (official sources only)
const DISCIPLINE_SOURCES: Record<string, { searchUrl: string; baseUrl: string }> = {
  CA: {
    searchUrl: 'https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch',
    baseUrl: 'https://members.calbar.ca.gov/fal/Licensee/Detail/',
  },
  NY: {
    searchUrl: 'https://iapps.courts.state.ny.us/attorneyservices/search',
    baseUrl: 'https://nycourts.gov/attorneys/discipline',
  },
  TX: {
    searchUrl: 'https://www.texasbar.com/AM/Template.cfm?Section=Grievance_Info_and_Disciplinary_Actions',
    baseUrl: 'https://www.texasbar.com/AM/Template.cfm?Section=Grievance_Info_and_Disciplinary_Actions',
  },
  FL: {
    searchUrl: 'https://www.floridabar.org/directories/discipline/',
    baseUrl: 'https://www.floridabar.org/directories/discipline/',
  },
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const LIMIT = (() => { const i = args.indexOf('--limit'); return i !== -1 ? parseInt(args[i + 1], 10) : Infinity })()
const STATE = (() => { const i = args.indexOf('--state'); return i !== -1 ? args[i + 1]?.toUpperCase() : null })()
const CSV_PATH = (() => { const i = args.indexOf('--csv-path'); return i !== -1 ? args[i + 1] : null })()
const CONCURRENCY = (() => { const i = args.indexOf('--concurrency'); return i !== -1 ? parseInt(args[i + 1], 10) : DEFAULT_CONCURRENCY })()

if (!STATE && !CSV_PATH) {
  console.error('Usage: npx tsx scripts/ingest/disciplinary-actions.ts --state XX [--dry-run] [--limit N]')
  console.error('       npx tsx scripts/ingest/disciplinary-actions.ts --csv-path /path/to/file.csv [--dry-run] [--limit N]')
  console.error('')
  console.error('Supported states: CA, NY, TX, FL')
  console.error('CSV columns: bar_number, bar_state, action_type, effective_date, end_date, description, docket_number, source_url, is_public')
  process.exit(1)
}

if (STATE && !DISCIPLINE_SOURCES[STATE] && !CSV_PATH) {
  console.error(`State ${STATE} is not yet supported for scraping.`)
  console.error('Supported: CA, NY, TX, FL')
  console.error('For other states, use --csv-path with a pre-prepared CSV file.')
  process.exit(1)
}

// ============================================================================
// SUPABASE
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars. Run: export $(grep -v \'^#\' .env.local | xargs)')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } })

// ============================================================================
// TYPES
// ============================================================================

interface RawDisciplinaryRecord {
  bar_number: string
  bar_state: string // CHAR(2)
  action_type: string
  effective_date: string | null
  end_date: string | null
  description: string | null
  docket_number: string | null
  source_url: string
  is_public: boolean
}

interface DisciplinaryRow {
  attorney_id: string
  state: string
  action_type: ActionType
  effective_date: string | null
  end_date: string | null
  description: string | null
  docket_number: string | null
  source_url: string
  is_public: boolean
}

// ============================================================================
// HELPERS
// ============================================================================

function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)) }

function parseDate(raw: string | null | undefined): string | null {
  if (!raw || raw.trim() === '') return null
  const s = raw.trim()

  // ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // US format: MM/DD/YYYY
  const usMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (usMatch) return `${usMatch[3]}-${usMatch[1].padStart(2, '0')}-${usMatch[2].padStart(2, '0')}`

  // US format: MM-DD-YYYY
  const usDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (usDash) return `${usDash[3]}-${usDash[1].padStart(2, '0')}-${usDash[2].padStart(2, '0')}`

  // Month name: "January 15, 2024"
  const months: Record<string, string> = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  }
  const longMatch = s.match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/i)
  if (longMatch && months[longMatch[1].toLowerCase()]) {
    return `${longMatch[3]}-${months[longMatch[1].toLowerCase()]}-${longMatch[2].padStart(2, '0')}`
  }

  console.warn(`  [WARN] Could not parse date: "${raw}" — skipping date field`)
  return null
}

/**
 * Normalize state-specific discipline terminology to our enum.
 *
 * LEGAL DATA: Zero tolerance for inaccuracy.
 * If the action_type cannot be confidently mapped, return 'other' — never guess.
 */
function normalizeActionType(raw: string): ActionType {
  const s = raw.toLowerCase().trim()

  // Direct matches
  if (VALID_ACTION_TYPES.includes(s as ActionType)) return s as ActionType

  // Disbarment variants
  if (s.includes('disbar')) return 'disbarment'
  if (s === 'disbarred') return 'disbarment'

  // Suspension variants
  if (s.includes('suspend') || s.includes('suspension')) return 'suspension'
  if (s === 'interim suspension') return 'suspension'
  if (s === 'temporary suspension') return 'suspension'
  if (s === 'emergency suspension') return 'suspension'

  // Reprimand variants
  if (s.includes('public reprimand') || s.includes('public censure')) return 'public_reprimand'
  if (s.includes('private reprimand') || s.includes('private admonition')) return 'private_reprimand'
  if (s === 'reprimand' || s === 'admonishment' || s === 'admonition') return 'public_reprimand'
  if (s === 'grievance referral' || s.includes('public admonition')) return 'public_reprimand'

  // Probation
  if (s.includes('probat')) return 'probation'
  if (s === 'probated suspension') return 'probation'

  // Censure
  if (s.includes('censure')) return 'censure'

  // Reinstatement
  if (s.includes('reinstat')) return 'reinstatement'

  // Resignation
  if (s.includes('resign') || s.includes('surrend') || s === 'voluntary surrender') return 'resignation'
  if (s === 'revocation on consent') return 'resignation'

  // Texas-specific
  if (s === 'fully disability suspension') return 'suspension'
  if (s === 'compulsory discipline') return 'other'

  // California-specific
  if (s === 'reproval') return 'public_reprimand'
  if (s === 'inactive enrollment') return 'suspension'

  // Florida-specific
  if (s === 'public discipline') return 'public_reprimand'

  // New York-specific
  if (s === 'censured') return 'censure'
  if (s === 'struck from roll') return 'disbarment'

  // Catch-all: log and return 'other'
  console.warn(`  [WARN] Unknown action_type: "${raw}" — mapped to 'other'`)
  return 'other'
}

async function fetchHTML(url: string, opts?: RequestInit): Promise<string | null> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const fetchOpts: RequestInit = { headers: HEADERS, redirect: 'follow', ...opts }
      const res = await fetch(url, fetchOpts)
      if (res.ok) return await res.text()
      if (res.status === 429) { await sleep(RETRY_DELAY_MS * attempt * 2); continue }
      console.warn(`  [WARN] HTTP ${res.status} for ${url}`)
      return null
    } catch (err) {
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt)
    }
  }
  return null
}

// ============================================================================
// ATTORNEY LOOKUP — Match bar_number + bar_state to attorney_id
// ============================================================================

/**
 * Look up attorney_id from bar_admissions table.
 * Returns a Map<"bar_number|bar_state", attorney_id> for batch matching.
 *
 * LEGAL DATA: Only exact matches. Never fuzzy-match disciplinary records.
 */
async function lookupAttorneyIds(records: RawDisciplinaryRecord[]): Promise<Map<string, string>> {
  const result = new Map<string, string>()

  // Deduplicate lookups
  const uniqueKeys = new Map<string, { bar_number: string; bar_state: string }>()
  for (const r of records) {
    const key = `${r.bar_number}|${r.bar_state}`
    if (!uniqueKeys.has(key)) {
      uniqueKeys.set(key, { bar_number: r.bar_number, bar_state: r.bar_state })
    }
  }

  // Batch lookup in chunks (Supabase .in() max ~300 items)
  const entries = [...uniqueKeys.values()]
  for (let i = 0; i < entries.length; i += 200) {
    const batch = entries.slice(i, i + 200)

    // First try bar_admissions table (multi-state bar records)
    const barNumbers = batch.map(e => e.bar_number)
    const { data: admissions } = await supabase
      .from('bar_admissions')
      .select('attorney_id, bar_number, state')
      .in('bar_number', barNumbers)

    if (admissions) {
      for (const adm of admissions) {
        const matchingBatch = batch.find(b => b.bar_number === adm.bar_number && b.bar_state === adm.state)
        if (matchingBatch) {
          result.set(`${adm.bar_number}|${adm.state}`, adm.attorney_id)
        }
      }
    }

    // Fallback: try attorneys.bar_number + attorneys.bar_state for unmatched
    const unmatched = batch.filter(b => !result.has(`${b.bar_number}|${b.bar_state}`))
    if (unmatched.length > 0) {
      const unmatchedNums = unmatched.map(u => u.bar_number)
      const { data: attorneys } = await supabase
        .from('attorneys')
        .select('id, bar_number, bar_state')
        .in('bar_number', unmatchedNums)

      if (attorneys) {
        for (const att of attorneys) {
          const matchingUnmatched = unmatched.find(u => u.bar_number === att.bar_number && u.bar_state === att.bar_state)
          if (matchingUnmatched) {
            result.set(`${att.bar_number}|${att.bar_state}`, att.id)
          }
        }
      }
    }
  }

  return result
}

// ============================================================================
// CSV IMPORT — Generic bulk import from any state
// ============================================================================

/**
 * Parse a CSV file into RawDisciplinaryRecord[].
 *
 * Required columns: bar_number, bar_state, action_type, source_url
 * Optional columns: effective_date, end_date, description, docket_number, is_public
 *
 * LEGAL DATA: Skips rows without source_url — zero tolerance for unsourced records.
 */
function parseCSV(filePath: string): RawDisciplinaryRecord[] {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  if (lines.length < 2) {
    console.error('CSV file must have a header row and at least one data row.')
    process.exit(1)
  }

  const headerLine = lines[0]
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))

  // Validate required columns
  const required = ['bar_number', 'bar_state', 'action_type', 'source_url']
  for (const col of required) {
    if (!headers.includes(col)) {
      console.error(`CSV missing required column: ${col}`)
      console.error(`Found columns: ${headers.join(', ')}`)
      process.exit(1)
    }
  }

  const records: RawDisciplinaryRecord[] = []
  let skipped = 0

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length !== headers.length) {
      console.warn(`  [WARN] Line ${i + 1}: expected ${headers.length} columns, got ${values.length} — skipping`)
      skipped++
      continue
    }

    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j].trim().replace(/^["']|["']$/g, '')
    }

    // LEGAL DATA: Skip records without source_url
    if (!row.source_url || row.source_url.trim() === '') {
      console.warn(`  [WARN] Line ${i + 1}: missing source_url — SKIPPING (zero tolerance for unsourced discipline data)`)
      skipped++
      continue
    }

    // LEGAL DATA: Skip records without bar_number
    if (!row.bar_number || row.bar_number.trim() === '') {
      console.warn(`  [WARN] Line ${i + 1}: missing bar_number — SKIPPING`)
      skipped++
      continue
    }

    const barState = (row.bar_state || '').toUpperCase().trim()
    if (!/^[A-Z]{2}$/.test(barState)) {
      console.warn(`  [WARN] Line ${i + 1}: invalid bar_state "${row.bar_state}" — SKIPPING`)
      skipped++
      continue
    }

    records.push({
      bar_number: row.bar_number.trim(),
      bar_state: barState,
      action_type: row.action_type.trim(),
      effective_date: row.effective_date || null,
      end_date: row.end_date || null,
      description: row.description || null,
      docket_number: row.docket_number || null,
      source_url: row.source_url.trim(),
      is_public: row.is_public ? row.is_public.toLowerCase() !== 'false' : true,
    })
  }

  if (skipped > 0) {
    console.log(`  CSV: ${skipped} rows skipped (see warnings above)`)
  }

  return records
}

/**
 * Simple CSV line parser that handles quoted fields with commas.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"' && (i === 0 || line[i - 1] !== '\\')) {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

// ============================================================================
// STATE SCRAPERS — HTTP fetch structure with HTML parsing scaffolding
// ============================================================================

/**
 * California State Bar discipline scraper.
 *
 * Source: members.calbar.ca.gov — discipline tab on attorney profiles
 * Method: Query CalBar attorney search API, then fetch discipline details.
 *
 * TODO: Selectors may need updating if CalBar changes their HTML structure.
 *       Last verified: 2026-03 (scaffolding only — selectors need real testing)
 *
 * LEGAL DATA: Only scrape from official CalBar discipline page.
 */
async function scrapeCA(): Promise<RawDisciplinaryRecord[]> {
  console.log('  [CA] Scraping California State Bar discipline records...')
  console.log('  [CA] Source: members.calbar.ca.gov')

  const records: RawDisciplinaryRecord[] = []

  // TODO: Implement CalBar discipline search pagination
  // The CalBar search at apps.calbar.ca.gov/attorney/LicenseeSearch returns JSON
  // for discipline status. For each attorney with discipline status != "No":
  //
  // 1. Search with disciplineOnly=true parameter
  //    GET https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch?FreeText=&SoundsLike=false&ResultType=0&StatusFlags=3
  //
  // 2. For each result, fetch detail page:
  //    GET https://members.calbar.ca.gov/fal/Licensee/Detail/{barNumber}
  //
  // 3. Parse the "Discipline" section of the profile page:
  //    - Look for section header matching /Disciplin/i
  //    - Extract action type, effective date, description
  //    - Build source_url as: https://members.calbar.ca.gov/fal/Licensee/Detail/{barNumber}#discipline
  //
  // TODO: Implement HTML parsing for CalBar discipline section
  // Expected selectors (verify against live site):
  //   - Discipline entries: div.discipline-entry or table.discipline-history tr
  //   - Action type: td.action-type or span containing "Suspended", "Disbarred", etc.
  //   - Effective date: td.effective-date
  //   - Description: td.description or div.discipline-description

  console.log('  [CA] TODO: CalBar discipline scraper not yet implemented — use --csv-path for bulk import')
  console.log('  [CA] Manual process: Download discipline data from members.calbar.ca.gov, format as CSV, import with --csv-path')

  return records
}

/**
 * New York Court Attorney Discipline scraper.
 *
 * Source: nycourts.gov/attorneys/discipline
 * Method: Search the NY attorney discipline database.
 *
 * TODO: Selectors may need updating if NY Courts changes their HTML structure.
 *       Last verified: 2026-03 (scaffolding only — selectors need real testing)
 *
 * LEGAL DATA: Only scrape from official NY Courts discipline page.
 */
async function scrapeNY(): Promise<RawDisciplinaryRecord[]> {
  console.log('  [NY] Scraping New York Court attorney discipline records...')
  console.log('  [NY] Source: nycourts.gov/attorneys/discipline')

  const records: RawDisciplinaryRecord[] = []

  // TODO: Implement NY discipline search
  // NY Courts uses iapps.courts.state.ny.us for attorney services
  //
  // 1. Search disciplined attorneys:
  //    POST https://iapps.courts.state.ny.us/attorneyservices/wicket/page
  //    (Wicket-based UI — may need session/token handling)
  //
  // 2. For each disciplined attorney:
  //    - Extract registration number (bar_number)
  //    - Extract discipline order details
  //    - source_url: link to the specific discipline order
  //
  // TODO: Implement HTML parsing for NY discipline results
  // Expected selectors (verify against live site):
  //   - Search results table: table.dataTable or div.searchResults
  //   - Attorney name + registration: td containing registration number
  //   - Discipline action: column with action type (Censured, Suspended, Disbarred, etc.)
  //   - Date: column with effective date
  //
  // Note: NY uses "Censured" instead of "Censure", "Struck from roll" for disbarment.
  //       normalizeActionType() handles these mappings.

  console.log('  [NY] TODO: NY Courts discipline scraper not yet implemented — use --csv-path for bulk import')
  console.log('  [NY] Manual process: Download from nycourts.gov/attorneys/discipline, format as CSV')

  return records
}

/**
 * Texas Bar Grievance & Disciplinary Actions scraper.
 *
 * Source: texasbar.com — Grievance Info & Disciplinary Actions section
 * Method: Search TX Bar discipline database.
 *
 * TODO: Selectors may need updating if TX Bar changes their HTML structure.
 *       Last verified: 2026-03 (scaffolding only — selectors need real testing)
 *
 * LEGAL DATA: Only scrape from official Texas Bar discipline page.
 */
async function scrapeTX(): Promise<RawDisciplinaryRecord[]> {
  console.log('  [TX] Scraping Texas Bar disciplinary actions...')
  console.log('  [TX] Source: texasbar.com — Grievance Info & Disciplinary Actions')

  const records: RawDisciplinaryRecord[] = []

  // TODO: Implement TX Bar discipline search
  // TX Bar publishes discipline actions through their ColdFusion-based system.
  //
  // 1. Discipline search page:
  //    GET https://www.texasbar.com/AM/Template.cfm?Section=Grievance_Info_and_Disciplinary_Actions
  //
  // 2. Search by last name or bar number:
  //    POST with form data (ColdFusion form submission)
  //    May use the same prefix search strategy as tx-attorneys-opengovus.ts
  //
  // 3. Parse discipline results:
  //    - Extract bar card number, attorney name
  //    - Extract sanction type, effective date, docket number
  //    - source_url: direct link to the discipline record
  //
  // TODO: Implement HTML parsing for TX discipline results
  // Expected selectors (verify against live site):
  //   - Results table: table containing discipline rows
  //   - Bar number: column or link containing bar card number
  //   - Sanction type: "Suspension", "Disbarment", "Public Reprimand", etc.
  //   - Effective date: date column
  //   - Docket number: case/docket reference
  //
  // Note: TX uses "Probated Suspension", "Fully Disability Suspension",
  //       "Compulsory Discipline" — normalizeActionType() handles these.

  console.log('  [TX] TODO: TX Bar discipline scraper not yet implemented — use --csv-path for bulk import')
  console.log('  [TX] Manual process: Download from texasbar.com discipline section, format as CSV')

  return records
}

/**
 * Florida Bar Discipline Directory scraper.
 *
 * Source: floridabar.org/directories/discipline
 * Method: Search FL Bar discipline directory.
 *
 * TODO: Selectors may need updating if FL Bar changes their HTML structure.
 *       Last verified: 2026-03 (scaffolding only — selectors need real testing)
 *
 * LEGAL DATA: Only scrape from official Florida Bar discipline page.
 */
async function scrapeFL(): Promise<RawDisciplinaryRecord[]> {
  console.log('  [FL] Scraping Florida Bar discipline directory...')
  console.log('  [FL] Source: floridabar.org/directories/discipline')

  const records: RawDisciplinaryRecord[] = []

  // TODO: Implement FL Bar discipline search
  // FL Bar provides a public discipline directory with search.
  //
  // 1. Discipline directory:
  //    GET https://www.floridabar.org/directories/discipline/
  //
  // 2. Search by name or bar number:
  //    The directory supports filtering — check if it uses API calls or form POSTs
  //
  // 3. Parse discipline results:
  //    - Extract Florida Bar number, attorney name
  //    - Extract discipline type, effective date, case number
  //    - source_url: direct link to the FL Bar discipline entry
  //
  // TODO: Implement HTML parsing for FL discipline results
  // Expected selectors (verify against live site):
  //   - Results container: div.discipline-results or similar
  //   - Attorney info: name and bar number fields
  //   - Discipline type: "Public Discipline", "Suspension", "Disbarment"
  //   - Date: effective date of discipline
  //   - Case number: FL Bar case reference
  //
  // Note: FL uses "Public Discipline" as a catch-all —
  //       normalizeActionType() maps it to 'public_reprimand'.

  console.log('  [FL] TODO: FL Bar discipline scraper not yet implemented — use --csv-path for bulk import')
  console.log('  [FL] Manual process: Download from floridabar.org/directories/discipline, format as CSV')

  return records
}

// ============================================================================
// UPSERT — Batch insert/update disciplinary actions
// ============================================================================

interface UpsertStats {
  attempted: number
  upserted: number
  skippedNoAttorney: number
  skippedNoSource: number
  errors: number
}

/**
 * Process raw records: resolve attorney_ids, validate, and upsert.
 *
 * LEGAL DATA: Every record MUST have a valid source_url and matched attorney_id.
 * Records that cannot be matched are logged and skipped — never force-inserted.
 */
async function processAndUpsert(records: RawDisciplinaryRecord[]): Promise<UpsertStats> {
  const stats: UpsertStats = { attempted: 0, upserted: 0, skippedNoAttorney: 0, skippedNoSource: 0, errors: 0 }

  if (records.length === 0) {
    console.log('  No records to process.')
    return stats
  }

  // Apply limit
  const limited = records.slice(0, LIMIT)
  console.log(`\n  Processing ${limited.length.toLocaleString()} records (limit: ${LIMIT === Infinity ? 'ALL' : LIMIT})...`)

  // Step 1: Resolve attorney_ids
  console.log('  Resolving attorney IDs via bar_admissions + attorneys tables...')
  const attorneyMap = await lookupAttorneyIds(limited)
  console.log(`  Matched ${attorneyMap.size.toLocaleString()} / ${limited.length.toLocaleString()} records to attorneys`)

  // Step 2: Build validated rows
  const rows: DisciplinaryRow[] = []
  for (const rec of limited) {
    stats.attempted++

    // LEGAL DATA: Skip records without source_url
    if (!rec.source_url || rec.source_url.trim() === '') {
      stats.skippedNoSource++
      continue
    }

    const key = `${rec.bar_number}|${rec.bar_state}`
    const attorneyId = attorneyMap.get(key)
    if (!attorneyId) {
      stats.skippedNoAttorney++
      continue
    }

    rows.push({
      attorney_id: attorneyId,
      state: rec.bar_state,
      action_type: normalizeActionType(rec.action_type),
      effective_date: parseDate(rec.effective_date),
      end_date: parseDate(rec.end_date),
      description: rec.description?.trim() || null,
      docket_number: rec.docket_number?.trim() || null,
      source_url: rec.source_url.trim(),
      is_public: rec.is_public,
    })
  }

  console.log(`  Validated: ${rows.length.toLocaleString()} rows ready for upsert`)
  console.log(`  Skipped (no attorney match): ${stats.skippedNoAttorney.toLocaleString()}`)
  console.log(`  Skipped (no source_url): ${stats.skippedNoSource.toLocaleString()}`)

  if (DRY_RUN) {
    console.log('\n  [DRY RUN] Would upsert the following sample:')
    for (const row of rows.slice(0, 5)) {
      console.log(`    ${row.state} | ${row.action_type} | ${row.effective_date || 'N/A'} | ${row.source_url.substring(0, 60)}...`)
    }
    stats.upserted = rows.length
    return stats
  }

  // Step 3: Batch upsert
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('disciplinary_actions')
      .upsert(batch, {
        onConflict: 'attorney_id,state,docket_number',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error(`  [ERROR] Batch ${Math.floor(i / BATCH_SIZE) + 1} upsert failed: ${error.message}`)
      // Fallback: try individual inserts for this batch
      for (const row of batch) {
        const { error: singleErr } = await supabase
          .from('disciplinary_actions')
          .upsert(row, { onConflict: 'attorney_id,state,docket_number', ignoreDuplicates: false })
        if (singleErr) {
          stats.errors++
        } else {
          stats.upserted++
        }
      }
    } else {
      stats.upserted += batch.length
    }

    if ((i + BATCH_SIZE) % 1000 === 0 || i + BATCH_SIZE >= rows.length) {
      console.log(`  [${Math.min(i + BATCH_SIZE, rows.length).toLocaleString()}/${rows.length.toLocaleString()}] upserted: ${stats.upserted.toLocaleString()} | errors: ${stats.errors}`)
    }
  }

  return stats
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════╗')
  console.log('║  DISCIPLINARY ACTIONS — Bar Discipline Record Ingestion         ║')
  console.log('║                                                                  ║')
  console.log('║  LEGAL DATA: Zero tolerance for inaccuracy.                      ║')
  console.log('║  Never fabricate or assume disciplinary records.                  ║')
  console.log('║  Always verify source_url points to official state bar board.     ║')
  console.log('╚══════════════════════════════════════════════════════════════════╝')
  console.log()
  console.log(`Mode:        ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit:       ${LIMIT === Infinity ? 'ALL' : LIMIT}`)
  console.log(`Concurrency: ${CONCURRENCY}`)
  console.log(`Source:      ${CSV_PATH ? `CSV: ${CSV_PATH}` : `Scrape: ${STATE}`}`)
  console.log()

  let records: RawDisciplinaryRecord[] = []
  const startTime = Date.now()

  if (CSV_PATH) {
    // Generic CSV import mode
    console.log('--- CSV IMPORT MODE ---')
    console.log(`  Reading: ${CSV_PATH}`)
    records = parseCSV(CSV_PATH)
    console.log(`  Parsed: ${records.length.toLocaleString()} records from CSV`)

    // Validate state codes if --state was also provided
    if (STATE) {
      const filtered = records.filter(r => r.bar_state === STATE)
      console.log(`  Filtered to state ${STATE}: ${filtered.length.toLocaleString()} of ${records.length.toLocaleString()} records`)
      records = filtered
    }
  } else if (STATE) {
    // State-specific scraper mode
    console.log(`--- SCRAPING ${STATE} DISCIPLINE RECORDS ---`)
    console.log(`  Official source: ${DISCIPLINE_SOURCES[STATE!]?.baseUrl || 'unknown'}`)
    console.log()

    switch (STATE) {
      case 'CA': records = await scrapeCA(); break
      case 'NY': records = await scrapeNY(); break
      case 'TX': records = await scrapeTX(); break
      case 'FL': records = await scrapeFL(); break
      default:
        console.error(`Unsupported state: ${STATE}`)
        process.exit(1)
    }
  }

  // Process and upsert
  const stats = await processAndUpsert(records)

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log()
  console.log('='.repeat(66))
  console.log('DISCIPLINARY ACTIONS INGESTION COMPLETE')
  console.log('='.repeat(66))
  console.log(`  Source:               ${CSV_PATH ? `CSV: ${CSV_PATH}` : `Scrape: ${STATE}`}`)
  console.log(`  Records parsed:       ${records.length.toLocaleString()}`)
  console.log(`  Attempted:            ${stats.attempted.toLocaleString()}`)
  console.log(`  Upserted:             ${stats.upserted.toLocaleString()}`)
  console.log(`  Skipped (no match):   ${stats.skippedNoAttorney.toLocaleString()}`)
  console.log(`  Skipped (no source):  ${stats.skippedNoSource.toLocaleString()}`)
  console.log(`  Errors:               ${stats.errors.toLocaleString()}`)
  console.log(`  Duration:             ${elapsed}s`)
  console.log(`  Mode:                 ${DRY_RUN ? 'DRY RUN (no DB writes)' : 'LIVE'}`)
  console.log('='.repeat(66))

  if (stats.skippedNoAttorney > 0) {
    console.log()
    console.log(`  NOTE: ${stats.skippedNoAttorney} records could not be matched to attorneys.`)
    console.log('  These attorneys may not exist in the DB yet. Run attorney ingestion first,')
    console.log('  then re-run this script to match remaining discipline records.')
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
