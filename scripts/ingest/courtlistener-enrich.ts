/**
 * CourtListener Attorney Enrichment Script
 * Source: https://www.courtlistener.com/api/rest/v4/
 * Cost: $0 (free API, 5000 req/day authenticated)
 *
 * Strategy: Search RECAP dockets via /search/?type=r&q=attorney:"Name"
 * CourtListener's /people/ only contains judges — attorneys are found
 * via their appearances in federal court dockets (RECAP archive).
 *
 * For each attorney in DB:
 *   1. Search RECAP by last name via /search/?type=r&q=attorney:"Last Name"
 *   2. Filter results client-side for first name + state match
 *   3. Extract: attorney_id, cases_count, courts[], last_case_date
 *   4. Update attorneys table + insert case_results + link attorney_courthouses
 *
 * Usage:
 *   npx tsx scripts/ingest/courtlistener-enrich.ts [options]
 *
 * Options:
 *   --dry-run       Preview without writing to DB
 *   --limit N       Process only N attorneys (default: 1000)
 *   --offset N      Skip first N attorneys
 *   --reset         Delete checkpoint and start from scratch
 *   --state XX      Only process attorneys from state XX
 *   --delay N       Delay between API calls in ms (default: 750)
 *
 * Prerequisites:
 *   1. Create free account at https://www.courtlistener.com/register/
 *   2. Get API token at https://www.courtlistener.com/profile/
 *   3. Set COURTLISTENER_API_TOKEN in .env.local
 *   4. Run courtlistener-courts.ts first (populates courthouses table)
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// ============================================================================
// CONFIG
// ============================================================================

const CL_BASE = 'https://www.courtlistener.com/api/rest/v4'
const DB_BATCH_SIZE = 100
const DAILY_LIMIT = 5000
const DEFAULT_DELAY = 750
const DEFAULT_LIMIT = 1000

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const RESET = args.includes('--reset')

function getArgValue(flag: string, defaultVal: number): number {
  const idx = args.indexOf(flag)
  if (idx === -1 || idx + 1 >= args.length) return defaultVal
  return parseInt(args[idx + 1], 10)
}

function getArgString(flag: string): string | null {
  const idx = args.indexOf(flag)
  if (idx === -1 || idx + 1 >= args.length) return null
  return args[idx + 1]
}

const LIMIT = getArgValue('--limit', DEFAULT_LIMIT)
const OFFSET = getArgValue('--offset', 0)
const DELAY = getArgValue('--delay', DEFAULT_DELAY)
const STATE_FILTER = getArgString('--state')?.toUpperCase() || null

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
  auth: { autoRefreshToken: false, persistSession: false },
})

// ============================================================================
// CHECKPOINT
// ============================================================================

const CHECKPOINT_DIR = path.join(__dirname, '..', '..', 'tmp')
const CHECKPOINT_FILE = path.join(CHECKPOINT_DIR, 'courtlistener-enrich-checkpoint.json')
const LOG_MATCH = path.join(CHECKPOINT_DIR, 'courtlistener-matches.jsonl')
const LOG_NOMATCH = path.join(CHECKPOINT_DIR, 'courtlistener-nomatch.jsonl')

interface Checkpoint {
  lastProcessedId: string | null
  totalProcessed: number
  totalMatched: number
  totalNoMatch: number
  totalErrors: number
  apiCallsToday: number
  lastRunDate: string
  processedIds: string[]
}

function loadCheckpoint(): Checkpoint {
  if (RESET) {
    console.log('Checkpoint reset requested.')
    return freshCheckpoint()
  }
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      const data = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'))
      const today = new Date().toISOString().slice(0, 10)
      if (data.lastRunDate !== today) {
        data.apiCallsToday = 0
        data.lastRunDate = today
      }
      return data
    }
  } catch {
    console.warn('Corrupted checkpoint, starting fresh.')
  }
  return freshCheckpoint()
}

function freshCheckpoint(): Checkpoint {
  return {
    lastProcessedId: null,
    totalProcessed: 0,
    totalMatched: 0,
    totalNoMatch: 0,
    totalErrors: 0,
    apiCallsToday: 0,
    lastRunDate: new Date().toISOString().slice(0, 10),
    processedIds: [],
  }
}

function saveCheckpoint(cp: Checkpoint): void {
  if (!fs.existsSync(CHECKPOINT_DIR)) fs.mkdirSync(CHECKPOINT_DIR, { recursive: true })
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp, null, 2))
}

function logMatch(entry: object): void {
  if (!fs.existsSync(CHECKPOINT_DIR)) fs.mkdirSync(CHECKPOINT_DIR, { recursive: true })
  fs.appendFileSync(LOG_MATCH, JSON.stringify(entry) + '\n')
}

function logNoMatch(entry: object): void {
  if (!fs.existsSync(CHECKPOINT_DIR)) fs.mkdirSync(CHECKPOINT_DIR, { recursive: true })
  fs.appendFileSync(LOG_NOMATCH, JSON.stringify(entry) + '\n')
}

// ============================================================================
// TYPES
// ============================================================================

interface RECAPResult {
  docket_id: number
  docket_absolute_url: string
  caseName: string
  case_name_full: string
  court: string
  court_id: string
  court_citation_string: string
  dateFiled: string | null
  dateTerminated: string | null
  docketNumber: string
  suitNature: string
  cause: string
  attorney: string[]       // all attorney names on this docket
  attorney_id: number[]    // CL internal attorney IDs
  firm: string[]
  firm_id: number[]
  party: string[]
  jurisdictionType: string
  meta: {
    timestamp: string
    date_created: string
    score: { bm25: number }
    more_docs: boolean
  }
}

interface RECAPResponse {
  count: number
  document_count: number
  next: string | null
  previous: string | null
  results: RECAPResult[]
}

interface EnrichmentResult {
  clAttorneyId: number       // CL's internal attorney ID
  clAttorneyName: string     // exact name as it appears in CL
  casesCount: number         // total dockets found
  courts: string[]           // unique court_ids
  lastCaseDate: string | null
  firstCaseDate: string | null
  firms: string[]            // unique firm names
  practiceAreas: string[]    // derived from suitNature/cause
  jurisdictionTypes: string[] // Federal Question, Diversity, etc.
  resolvedCount: number      // cases with dateTerminated
  dockets: RECAPResult[]     // top dockets for case_results
}

// ============================================================================
// API
// ============================================================================

let apiCallCount = 0

async function clFetch(url: string, cp: Checkpoint): Promise<RECAPResponse | null> {
  if (cp.apiCallsToday >= DAILY_LIMIT) {
    console.error(`\nDaily rate limit reached (${DAILY_LIMIT}). Resume tomorrow.`)
    saveCheckpoint(cp)
    process.exit(0)
  }

  const fullUrl = url.startsWith('http') ? url : `${CL_BASE}${url}`

  try {
    const res = await fetch(fullUrl, {
      headers: {
        Authorization: `Token ${CL_TOKEN}`,
        Accept: 'application/json',
      },
    })

    cp.apiCallsToday++
    apiCallCount++

    if (res.status === 429) {
      console.warn('\nRate limited. Waiting 60s...')
      await sleep(60_000)
      return clFetch(url, cp)
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================================================
// NAME MATCHING
// ============================================================================

/**
 * Normalize a name: lowercase, strip suffixes/punctuation, trim.
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/,/g, ' ')
    .replace(/\b(jr|sr|ii|iii|iv|esq|esquire|ph\.?d|j\.?d|ll\.?m|p\.?c|p\.?a)\b\.?/gi, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract first and last name parts from various formats:
 *  - "John Smith" → { first: "john", last: "smith" }
 *  - "Smith, John" → { first: "john", last: "smith" }
 *  - "John Michael Smith Jr." → { first: "john", last: "smith" }
 */
function parseNameParts(raw: string): { first: string; last: string } {
  const normalized = normalizeName(raw)
  const parts = normalized.split(' ').filter(Boolean)
  if (parts.length === 0) return { first: '', last: '' }
  if (parts.length === 1) return { first: '', last: parts[0] }

  // Detect "Last, First" format (comma in original)
  if (raw.includes(',')) {
    const [lastPart, ...firstParts] = raw.split(',').map((s) => normalizeName(s))
    return { first: firstParts.join(' ').trim().split(' ')[0] || '', last: lastPart }
  }

  return { first: parts[0], last: parts[parts.length - 1] }
}

// Map CL court_id → state abbreviation
const COURT_STATE_MAP: Record<string, string> = {}

function extractStateFromCourtId(courtId: string): string | null {
  if (COURT_STATE_MAP[courtId]) return COURT_STATE_MAP[courtId]
  const id = courtId.toLowerCase()
  // Federal district: "cacd" → CA, "nysd" → NY
  const fedMatch = id.match(/^([a-z]{2})[nsewmc]?[db]$/)
  if (fedMatch) {
    COURT_STATE_MAP[courtId] = fedMatch[1].toUpperCase()
    return COURT_STATE_MAP[courtId]
  }
  // Bankruptcy: "canb" → CA
  const bkMatch = id.match(/^([a-z]{2})[nsewm]?b$/)
  if (bkMatch) {
    COURT_STATE_MAP[courtId] = bkMatch[1].toUpperCase()
    return COURT_STATE_MAP[courtId]
  }
  // State courts: "casupremedist" etc
  const stMatch = id.match(/^([a-z]{2})(?:sup|app|ct|dist|cir)/)
  if (stMatch) {
    COURT_STATE_MAP[courtId] = stMatch[1].toUpperCase()
    return COURT_STATE_MAP[courtId]
  }
  return null
}

/**
 * Search RECAP dockets for an attorney and identify the best CL attorney_id match.
 *
 * Strategy:
 *   1. Query: attorney:"FirstName LastName" (exact phrase in RECAP)
 *   2. If 0 results → try attorney:"LastName" (broader)
 *   3. From results, look at the `attorney` and `attorney_id` arrays
 *   4. Find the attorney_id whose name best matches ours
 *   5. Count how many dockets reference that attorney_id (= cases_count)
 */
async function enrichAttorney(
  attorney: { id: string; name: string; first_name: string | null; last_name: string | null; bar_state: string },
  cp: Checkpoint
): Promise<EnrichmentResult | null> {
  const { first: ourFirst, last: ourLast } = attorney.first_name && attorney.last_name
    ? { first: normalizeName(attorney.first_name), last: normalizeName(attorney.last_name) }
    : parseNameParts(attorney.name)

  if (!ourLast || ourLast.length < 2) return null

  // --- Step 1: Search RECAP by full name ---
  const fullQuery = ourFirst
    ? `attorney:"${ourFirst} ${ourLast}"`
    : `attorney:"${ourLast}"`

  const searchUrl = `/search/?type=r&q=${encodeURIComponent(fullQuery)}&format=json&page_size=20`
  const res = await clFetch(searchUrl, cp)
  await sleep(DELAY)

  if (!res) return null

  // If full name yields 0, try last name only (but only if we searched full name)
  let results = res.results
  let totalCount = res.count

  if (results.length === 0 && ourFirst) {
    const fallbackUrl = `/search/?type=r&q=${encodeURIComponent(`attorney:"${ourLast}"`)}&format=json&page_size=20`
    const fallbackRes = await clFetch(fallbackUrl, cp)
    await sleep(DELAY)

    if (!fallbackRes || fallbackRes.results.length === 0) return null
    results = fallbackRes.results
    totalCount = fallbackRes.count
  }

  if (results.length === 0) return null

  // --- Step 2: Find the best attorney_id match across all results ---
  // Build a map: CL attorney_id → { name, count, courts, dates }
  const candidateMap = new Map<number, {
    name: string
    count: number
    courts: Set<string>
    lastDate: string | null
    stateMatch: boolean
  }>()

  for (const docket of results) {
    const attorneys = docket.attorney || []
    const attorneyIds = docket.attorney_id || []
    const courtState = extractStateFromCourtId(docket.court_id)

    for (let i = 0; i < attorneys.length; i++) {
      const clName = attorneys[i]
      const clId = attorneyIds[i]
      if (!clName || !clId) continue

      const { first: clFirst, last: clLast } = parseNameParts(clName)

      // Last name must match
      if (clLast !== ourLast) continue

      // First name: exact, prefix, or initial match
      let firstMatch = false
      if (!ourFirst || !clFirst) {
        firstMatch = true // can't compare, accept
      } else if (ourFirst === clFirst) {
        firstMatch = true
      } else if (ourFirst.startsWith(clFirst) || clFirst.startsWith(ourFirst)) {
        firstMatch = true // "Robert" vs "Rob"
      } else if (ourFirst[0] === clFirst[0] && (ourFirst.length === 1 || clFirst.length === 1)) {
        firstMatch = true // "R" vs "Robert"
      }

      if (!firstMatch) continue

      const existing = candidateMap.get(clId)
      const dateStr = docket.dateFiled || docket.dateTerminated || null
      const isStateMatch = courtState === attorney.bar_state

      if (existing) {
        existing.count++
        if (docket.court_id) existing.courts.add(docket.court_id)
        if (dateStr && (!existing.lastDate || dateStr > existing.lastDate)) {
          existing.lastDate = dateStr
        }
        if (isStateMatch) existing.stateMatch = true
      } else {
        const courts = new Set<string>()
        if (docket.court_id) courts.add(docket.court_id)
        candidateMap.set(clId, {
          name: clName,
          count: 1,
          courts,
          lastDate: dateStr,
          stateMatch: isStateMatch,
        })
      }
    }
  }

  if (candidateMap.size === 0) return null

  // --- Step 3: Pick the best candidate ---
  // Prefer: state match > most cases > most recent
  let bestId = 0
  let bestScore = -1

  candidateMap.forEach((cand, clId) => {
    let score = cand.count
    if (cand.stateMatch) score += 1000 // strong preference for same-state
    const { first: clFirst } = parseNameParts(cand.name)
    if (ourFirst && clFirst && ourFirst === clFirst) score += 500 // exact first name match

    if (score > bestScore) {
      bestScore = score
      bestId = clId
    }
  })

  const best = candidateMap.get(bestId)!

  // --- Step 4: Build enrichment result ---
  const matchedDockets = results.filter((d) =>
    d.attorney_id?.includes(bestId)
  )

  const courts = Array.from(best.courts)

  // Extract firm names associated with this attorney
  const firmSet = new Set<string>()
  for (const d of matchedDockets) {
    const idx = d.attorney_id?.indexOf(bestId)
    if (idx !== undefined && idx >= 0 && d.firm?.[idx]) {
      firmSet.add(cleanFirmName(d.firm[idx]))
    }
    // Also check all firms on dockets where this attorney appears
    if (d.firm) {
      for (const f of d.firm) {
        if (f && f.length > 3 && !f.match(/^\s*$/)) {
          firmSet.add(cleanFirmName(f))
        }
      }
    }
  }

  // Extract practice areas from suitNature
  const practiceAreaSet = new Set<string>()
  const jurisdictionSet = new Set<string>()
  let resolvedCount = 0
  const allDates: string[] = []

  for (const d of matchedDockets) {
    if (d.suitNature) {
      const pa = mapSuitNatureToPracticeArea(d.suitNature)
      if (pa) practiceAreaSet.add(pa)
    }
    if (d.cause) {
      const pa = mapCauseToPracticeArea(d.cause)
      if (pa) practiceAreaSet.add(pa)
    }
    if (d.jurisdictionType) {
      jurisdictionSet.add(d.jurisdictionType)
    }
    if (d.dateTerminated) resolvedCount++
    if (d.dateFiled) allDates.push(d.dateFiled)
  }

  allDates.sort()

  return {
    clAttorneyId: bestId,
    clAttorneyName: best.name,
    casesCount: totalCount > matchedDockets.length ? totalCount : matchedDockets.length,
    courts,
    lastCaseDate: allDates.length > 0 ? allDates[allDates.length - 1] : null,
    firstCaseDate: allDates.length > 0 ? allDates[0] : null,
    firms: Array.from(firmSet).slice(0, 5), // top 5 firms
    practiceAreas: Array.from(practiceAreaSet),
    jurisdictionTypes: Array.from(jurisdictionSet),
    resolvedCount,
    dockets: matchedDockets,
  }
}

// ============================================================================
// SUIT NATURE → PRACTICE AREA MAPPING
// ============================================================================

function cleanFirmName(raw: string): string {
  return raw
    .replace(/^(Direct|Attn|Tel|Fax|Phone):?\s*[\d\-().\s]+,?\s*/i, '')
    .replace(/,?\s*(LLP|LLC|PC|P\.C\.|P\.A\.|PLLC|Inc\.?|Corp\.?)$/i, '')
    .trim()
}

function mapSuitNatureToPracticeArea(nature: string): string | null {
  const n = nature.toLowerCase()
  if (n.includes('labor') || n.includes('fair standards')) return 'employment-law'
  if (n.includes('civil rights')) return 'civil-rights'
  if (n.includes('personal inj')) return 'personal-injury'
  if (n.includes('product liability')) return 'product-liability'
  if (n.includes('medical malpractice')) return 'medical-malpractice'
  if (n.includes('prisoner')) return 'criminal-defense'
  if (n.includes('securities') || n.includes('commodities')) return 'securities-law'
  if (n.includes('bankruptcy') || n.includes('recovery of money')) return 'bankruptcy'
  if (n.includes('tax')) return 'tax-law'
  if (n.includes('patent') || n.includes('trademark') || n.includes('copyright')) return 'intellectual-property'
  if (n.includes('environmental')) return 'environmental-law'
  if (n.includes('immigration') || n.includes('naturalization')) return 'immigration'
  if (n.includes('contract')) return 'business-law'
  if (n.includes('real property') || n.includes('foreclosure') || n.includes('rent')) return 'real-estate'
  if (n.includes('insurance')) return 'insurance-law'
  if (n.includes('antitrust')) return 'antitrust'
  if (n.includes('habeas corpus')) return 'criminal-defense'
  if (n.includes('social security') || n.includes('disability')) return 'social-security-disability'
  if (n.includes('fraud')) return 'white-collar-crime'
  if (n.includes('forfeiture')) return 'criminal-defense'
  if (n.includes('motor vehicle')) return 'personal-injury'
  if (n.includes('employment') || n.includes('erisa') || n.includes('wage')) return 'employment-law'
  if (n.includes('consumer') || n.includes('truth in lending')) return 'consumer-protection'
  if (n.includes('discrimination')) return 'employment-law'
  if (n.includes('tort')) return 'personal-injury'
  if (n.includes('declaratory')) return 'business-law'
  return null
}

function mapCauseToPracticeArea(cause: string): string | null {
  const c = cause.toLowerCase()
  if (c.includes('fair labor') || c.includes('29:')) return 'employment-law'
  if (c.includes('civil rights') || c.includes('42:1983')) return 'civil-rights'
  if (c.includes('diversity') && c.includes('personal injury')) return 'personal-injury'
  if (c.includes('securities') || c.includes('15:78')) return 'securities-law'
  if (c.includes('patent') || c.includes('35:')) return 'intellectual-property'
  if (c.includes('trademark') || c.includes('15:1051')) return 'intellectual-property'
  if (c.includes('copyright') || c.includes('17:')) return 'intellectual-property'
  if (c.includes('bankruptcy') || c.includes('28:0158')) return 'bankruptcy'
  if (c.includes('immigration') || c.includes('8:')) return 'immigration'
  if (c.includes('tax') || c.includes('26:')) return 'tax-law'
  if (c.includes('ada') || c.includes('42:12101')) return 'civil-rights'
  if (c.includes('breach of contract') || c.includes('28:1332')) return 'business-law'
  return null
}

// ============================================================================
// DATABASE UPDATES
// ============================================================================

async function applyEnrichment(
  attorneyId: string,
  result: EnrichmentResult,
  courthouseMap: Map<string, string>
): Promise<void> {
  // 1. Update attorney record with all extracted data
  const updateData: Record<string, unknown> = {
    courtlistener_id: String(result.clAttorneyId),
    courtlistener_url: `https://www.courtlistener.com/person/${result.clAttorneyId}/`,
    cases_handled: result.casesCount,
  }

  // Set firm_name if not already set and we found one
  if (result.firms.length > 0) {
    // Only set if attorney has no firm yet
    const { data: current } = await supabase
      .from('attorneys')
      .select('firm_name')
      .eq('id', attorneyId)
      .single()
    if (!current?.firm_name) {
      updateData.firm_name = result.firms[0]
    }
  }

  const { error: updateErr } = await supabase
    .from('attorneys')
    .update(updateData)
    .eq('id', attorneyId)

  if (updateErr) {
    console.error(`  DB update error for ${attorneyId}: ${updateErr.message}`)
    return
  }

  // 2. Link attorney to courthouses
  const courthouseLinks: { attorney_id: string; courthouse_id: string }[] = []
  for (const clCourtId of result.courts) {
    const courthouseId = courthouseMap.get(clCourtId)
    if (courthouseId) {
      courthouseLinks.push({ attorney_id: attorneyId, courthouse_id: courthouseId })
    }
  }

  if (courthouseLinks.length > 0) {
    const { error: linkErr } = await supabase
      .from('attorney_courthouses')
      .upsert(courthouseLinks, {
        onConflict: 'attorney_id,courthouse_id',
        ignoreDuplicates: true,
      })

    if (linkErr) {
      console.error(`  Courthouse link error: ${linkErr.message}`)
    }
  }

  // 3. Insert case_results (top 20 most recent)
  const caseResults = result.dockets
    .filter((d) => d.dateFiled)
    .slice(0, 20)
    .map((d) => {
      const courthouseId = courthouseMap.get(d.court_id) || null
      return {
        attorney_id: attorneyId,
        court_id: courthouseId,
        case_type: d.suitNature || 'general',
        outcome: d.dateTerminated ? 'resolved' : 'pending',
        date: d.dateFiled,
        description: (d.caseName || '').slice(0, 255),
        courtlistener_case_id: String(d.docket_id),
        is_public: true,
      }
    })

  if (caseResults.length > 0) {
    // Insert one by one to skip duplicates gracefully
    for (const cr of caseResults) {
      const { error } = await supabase.from('case_results').insert(cr)
      if (error && !error.message.includes('duplicate') && !error.message.includes('unique')) {
        console.error(`  Case insert error: ${error.message}`)
      }
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== CourtListener Attorney Enrichment (RECAP Search) ===')
  console.log(`Mode:   ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit:  ${LIMIT} attorneys`)
  console.log(`Offset: ${OFFSET}`)
  console.log(`Delay:  ${DELAY}ms between API calls`)
  if (STATE_FILTER) console.log(`State:  ${STATE_FILTER}`)
  console.log()

  const cp = loadCheckpoint()
  console.log(`Checkpoint: ${cp.totalProcessed} processed, ${cp.totalMatched} matched, ${cp.apiCallsToday} API calls today`)
  console.log(`Daily budget remaining: ${DAILY_LIMIT - cp.apiCallsToday} calls`)
  console.log()

  if (cp.apiCallsToday >= DAILY_LIMIT) {
    console.error('Daily rate limit already exhausted. Resume tomorrow.')
    process.exit(0)
  }

  // Load courthouse mapping
  const { data: courthouses } = await supabase
    .from('courthouses')
    .select('id, courtlistener_id')
    .not('courtlistener_id', 'is', null)

  const courthouseMap = new Map<string, string>()
  if (courthouses) {
    for (const c of courthouses) {
      courthouseMap.set(c.courtlistener_id, c.id)
    }
  }
  console.log(`Loaded ${courthouseMap.size} courthouses with CourtListener IDs`)

  const processedSet = new Set(cp.processedIds)

  let processed = 0
  let batchOffset = OFFSET
  const startTime = Date.now()

  while (processed < LIMIT) {
    let query = supabase
      .from('attorneys')
      .select('id, name, first_name, last_name, bar_state')
      .is('courtlistener_id', null)
      .eq('is_active', true)
      .not('bar_state', 'is', null)
      .order('id')
      .range(batchOffset, batchOffset + DB_BATCH_SIZE - 1)

    if (STATE_FILTER) {
      query = query.eq('bar_state', STATE_FILTER)
    }

    const { data: attorneys, error: fetchErr } = await query

    if (fetchErr) {
      console.error(`DB fetch error: ${fetchErr.message}`)
      break
    }

    if (!attorneys?.length) {
      console.log('\nNo more attorneys to process.')
      break
    }

    console.log(`\n--- Batch: ${attorneys.length} attorneys (offset ${batchOffset}) ---`)

    for (const attorney of attorneys) {
      if (processed >= LIMIT) break
      if (processedSet.has(attorney.id)) continue

      if (cp.apiCallsToday >= DAILY_LIMIT) {
        console.log(`\nDaily limit reached after ${processed} attorneys.`)
        saveCheckpoint(cp)
        printSummary(cp, startTime)
        process.exit(0)
      }

      process.stdout.write(
        `  [${processed + 1}/${LIMIT}] ${attorney.name} (${attorney.bar_state}) ... `
      )

      try {
        const result = await enrichAttorney(attorney, cp)

        if (result) {
          const extras = [
            result.firms.length > 0 ? `firm: ${result.firms[0]}` : null,
            result.practiceAreas.length > 0 ? `areas: ${result.practiceAreas.join(', ')}` : null,
            result.firstCaseDate ? `since ${result.firstCaseDate.slice(0, 4)}` : null,
          ].filter(Boolean).join(' | ')

          console.log(
            `MATCH: "${result.clAttorneyName}" (${result.casesCount} cases, ${result.courts.length} courts, ${result.resolvedCount} resolved)${extras ? ' | ' + extras : ''}`
          )

          if (!DRY_RUN) {
            await applyEnrichment(attorney.id, result, courthouseMap)
          }

          cp.totalMatched++
          logMatch({
            ts: new Date().toISOString(),
            attorneyId: attorney.id,
            name: attorney.name,
            barState: attorney.bar_state,
            clId: result.clAttorneyId,
            clName: result.clAttorneyName,
            casesCount: result.casesCount,
            resolvedCount: result.resolvedCount,
            courts: result.courts,
            firms: result.firms,
            practiceAreas: result.practiceAreas,
            jurisdictionTypes: result.jurisdictionTypes,
            firstCaseDate: result.firstCaseDate,
            lastCaseDate: result.lastCaseDate,
          })
        } else {
          console.log('no match')
          cp.totalNoMatch++
          logNoMatch({
            ts: new Date().toISOString(),
            attorneyId: attorney.id,
            name: attorney.name,
            barState: attorney.bar_state,
          })
        }
      } catch (err) {
        console.log(`ERROR: ${(err as Error).message}`)
        cp.totalErrors++
      }

      cp.totalProcessed++
      cp.lastProcessedId = attorney.id
      cp.processedIds.push(attorney.id)
      processedSet.add(attorney.id)
      processed++

      if (processed % 50 === 0) {
        saveCheckpoint(cp)
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
        const rate = (processed / (Number(elapsed) || 1)).toFixed(1)
        console.log(
          `  [checkpoint] ${processed} done, ${cp.totalMatched} matched, ${cp.apiCallsToday} API calls, ${rate} att/s`
        )
      }
    }

    if (attorneys.length < DB_BATCH_SIZE) break
    batchOffset += DB_BATCH_SIZE
  }

  saveCheckpoint(cp)
  printSummary(cp, startTime)
}

function printSummary(cp: Checkpoint, startTime: number) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  const matchRate = cp.totalProcessed > 0
    ? ((cp.totalMatched / cp.totalProcessed) * 100).toFixed(1)
    : '0'

  console.log('\n' + '='.repeat(60))
  console.log('  ENRICHMENT SUMMARY')
  console.log('='.repeat(60))
  console.log(`  Processed:    ${cp.totalProcessed}`)
  console.log(`  Matched:      ${cp.totalMatched} (${matchRate}%)`)
  console.log(`  No match:     ${cp.totalNoMatch}`)
  console.log(`  Errors:       ${cp.totalErrors}`)
  console.log(`  API calls:    ${apiCallCount} this run / ${cp.apiCallsToday} today`)
  console.log(`  Duration:     ${elapsed}s`)
  console.log(`  Checkpoint:   ${CHECKPOINT_FILE}`)
  console.log(`  Match log:    ${LOG_MATCH}`)
  console.log(`  No-match log: ${LOG_NOMATCH}`)
  console.log('='.repeat(60))
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
