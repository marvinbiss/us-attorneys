/**
 * CourtListener Case Results Ingestion
 * Source: https://www.courtlistener.com/api/rest/v4/
 *
 * Fetches opinions/cases from CourtListener for attorneys that have a
 * courtlistener_id, parses case outcomes where possible, and upserts
 * into the case_results table.
 *
 * Also detects disciplinary opinions and inserts into disciplinary_actions.
 *
 * Usage:
 *   npx tsx scripts/ingest/courtlistener-cases.ts [--dry-run] [--limit N] [--from-date YYYY-MM-DD] [--concurrency N]
 *
 * Options:
 *   --dry-run               Preview without writing to DB
 *   --limit N               Process only N attorneys (default: all)
 *   --from-date YYYY-MM-DD  Only fetch opinions filed after this date
 *   --concurrency N         Parallel API requests (default: 10)
 *
 * Prerequisites:
 *   - COURTLISTENER_API_TOKEN in .env.local
 *   - courtlistener-courts-v2.ts already run (courthouses populated)
 *   - Attorneys with courtlistener_id already linked
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

const CL_BASE = 'https://www.courtlistener.com/api/rest/v4'
const RATE_DELAY = 200
const MAX_RETRIES = 5
const PROGRESS_INTERVAL = 100

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')

const LIMIT = (() => {
  const idx = args.indexOf('--limit')
  return idx !== -1 ? parseInt(args[idx + 1], 10) : 0
})()

const FROM_DATE = (() => {
  const idx = args.indexOf('--from-date')
  return idx !== -1 ? args[idx + 1] : null
})()

const CONCURRENCY = (() => {
  const idx = args.indexOf('--concurrency')
  return idx !== -1 ? parseInt(args[idx + 1], 10) : 10
})()

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
  auth: { autoRefreshToken: false, persistSession: false }
})

// ============================================================================
// TYPES
// ============================================================================

interface CLResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

interface CLOpinion {
  id: number
  resource_uri: string
  absolute_url: string
  cluster: string // URL to the cluster resource
  author: string | null
  joined_by: string[]
  type: string
  sha1: string
  page_count: number | null
  date_created: string
  date_modified: string
  plain_text: string
  html: string
  html_lawbox: string
  html_columbia: string
  html_with_citations: string
  extracted_by_ocr: boolean
}

interface CLCluster {
  id: number
  resource_uri: string
  absolute_url: string
  docket: string // URL to the docket
  case_name: string
  case_name_short: string
  date_filed: string
  date_blocked: string | null
  judges: string
  nature_of_suit: string
  precedential_status: string
  citation_count: number
  slug: string
  source: string
  sub_opinions: string[]
}

interface CLDocket {
  id: number
  resource_uri: string
  absolute_url: string
  court: string // URL to the court
  case_name: string
  date_filed: string
  date_terminated: string | null
  docket_number: string
  nature_of_suit: string
  cause: string
}

interface CLSearchResult {
  id: number
  caseName: string
  court: string
  court_id: string
  dateFiled: string
  dateArgued: string | null
  status: string
  suitNature: string
  snippet: string
  docket_id: number
  cluster_id: number
  absolute_url: string
}

interface AttorneyRow {
  id: string
  courtlistener_id: string
  name: string
  address_state: string | null
}

interface Stats {
  attorneys_processed: number
  opinions_fetched: number
  cases_inserted: number
  cases_skipped: number
  disciplinary_inserted: number
  errors: number
}

// ============================================================================
// HELPERS
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetch from CourtListener API with exponential backoff on 429/5xx errors.
 */
async function clFetch<T>(endpoint: string, retryCount = 0): Promise<T | null> {
  const url = endpoint.startsWith('http') ? endpoint : `${CL_BASE}${endpoint}`
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Token ${CL_TOKEN}`,
        'Accept': 'application/json',
      },
    })

    if (res.status === 429 || res.status >= 500) {
      if (retryCount >= MAX_RETRIES) {
        console.error(`  Max retries reached for ${url} (status ${res.status})`)
        return null
      }
      const backoff = Math.min(1000 * Math.pow(2, retryCount), 120_000)
      const jitter = Math.random() * 1000
      console.warn(`  ${res.status} on ${url.slice(0, 80)}... retrying in ${Math.round(backoff / 1000)}s (attempt ${retryCount + 1}/${MAX_RETRIES})`)
      await sleep(backoff + jitter)
      return clFetch<T>(endpoint, retryCount + 1)
    }

    if (res.status === 404) {
      // Resource not found — not an error, just no data
      return null
    }

    if (!res.ok) {
      console.error(`  CL API ${res.status}: ${res.statusText} — ${url.slice(0, 100)}`)
      return null
    }

    return await res.json()
  } catch (err) {
    if (retryCount >= MAX_RETRIES) {
      console.error(`  Network error after ${MAX_RETRIES} retries: ${(err as Error).message}`)
      return null
    }
    const backoff = Math.min(1000 * Math.pow(2, retryCount), 120_000)
    console.warn(`  Network error: ${(err as Error).message} — retrying in ${Math.round(backoff / 1000)}s`)
    await sleep(backoff)
    return clFetch<T>(endpoint, retryCount + 1)
  }
}

// ============================================================================
// OUTCOME PARSING
// ============================================================================

/**
 * Known disciplinary action keywords in opinion text.
 */
const DISCIPLINARY_PATTERNS = [
  /\bdisbar(?:red|ment)\b/i,
  /\bsuspend(?:ed|s)?\s+from\s+(?:the\s+)?practice\b/i,
  /\bpublic\s+reprimand\b/i,
  /\bprivate\s+reprimand\b/i,
  /\bcensure[d]?\b/i,
  /\bprobation(?:ary)?\b/i,
  /\breinstate(?:d|ment)\b/i,
  /\bresign(?:ed|ation)\s+(?:from\s+)?(?:the\s+)?bar\b/i,
]

const DISCIPLINARY_TYPE_MAP: Record<string, string> = {
  'disbar': 'disbarment',
  'suspend': 'suspension',
  'public reprimand': 'public_reprimand',
  'private reprimand': 'private_reprimand',
  'censure': 'censure',
  'probation': 'probation',
  'reinstate': 'reinstatement',
  'resign': 'resignation',
}

/**
 * Attempt to classify the case outcome from opinion text and metadata.
 * Returns null if outcome cannot be determined with confidence.
 */
function parseOutcome(text: string, caseName: string, suitNature: string): string | null {
  if (!text && !caseName) return null

  const combined = `${caseName} ${text}`.toLowerCase()

  // Dismissal patterns
  if (/\bdismiss(?:ed|al)\b/.test(combined)) return 'dismissed'

  // Settlement patterns
  if (/\bsettl(?:ed|ement)\b/.test(combined)) return 'settled'
  if (/\bconsent\s+(?:decree|judgment|order)\b/.test(combined)) return 'settled'

  // Verdict patterns — be cautious, these are less reliable
  if (/\bverdict\s+(?:for|in\s+favor\s+of)\s+(?:the\s+)?(?:plaintiff|petitioner)\b/.test(combined)) return 'won'
  if (/\bverdict\s+(?:for|in\s+favor\s+of)\s+(?:the\s+)?(?:defendant|respondent)\b/.test(combined)) return 'lost'
  if (/\bjudgment\s+(?:for|in\s+favor\s+of)\s+(?:the\s+)?(?:plaintiff|petitioner)\b/.test(combined)) return 'won'
  if (/\bjudgment\s+(?:for|in\s+favor\s+of)\s+(?:the\s+)?(?:defendant|respondent)\b/.test(combined)) return 'lost'
  if (/\baffirm(?:ed|s)?\b/.test(combined)) return 'won'
  if (/\brevers(?:ed|al)\b/.test(combined)) return 'lost'

  // Cannot determine with confidence
  return null
}

/**
 * Extract monetary amount from text (e.g., "$1,500,000" or "$1.5 million").
 */
function parseAmount(text: string): number | null {
  if (!text) return null

  // Match "$X,XXX,XXX.XX" or "$X.X million/billion"
  const directMatch = text.match(/\$\s*([\d,]+(?:\.\d{1,2})?)\s*(?:million|billion)?/i)
  if (directMatch) {
    let amount = parseFloat(directMatch[1].replace(/,/g, ''))
    if (/million/i.test(directMatch[0])) amount *= 1_000_000
    if (/billion/i.test(directMatch[0])) amount *= 1_000_000_000
    if (amount > 0 && amount < 100_000_000_000) return amount // sanity check
  }

  return null
}

/**
 * Detect if an opinion is a disciplinary action and extract the type.
 */
function detectDisciplinary(text: string, caseName: string): { type: string; description: string } | null {
  const combined = `${caseName} ${text}`

  for (const pattern of DISCIPLINARY_PATTERNS) {
    const match = combined.match(pattern)
    if (match) {
      // Determine specific type
      const matchLower = match[0].toLowerCase()
      let actionType = 'other'
      for (const [keyword, type] of Object.entries(DISCIPLINARY_TYPE_MAP)) {
        if (matchLower.includes(keyword)) {
          actionType = type
          break
        }
      }

      // Extract a short description from surrounding context
      const idx = combined.toLowerCase().indexOf(matchLower)
      const start = Math.max(0, idx - 100)
      const end = Math.min(combined.length, idx + match[0].length + 200)
      const description = combined.slice(start, end).trim()

      return { type: actionType, description: description.slice(0, 500) }
    }
  }

  return null
}

/**
 * Map CourtListener's nature_of_suit to a case_type.
 */
function mapCaseType(suitNature: string, outcome: string | null): string {
  if (outcome === 'settled') return 'settlement'
  if (outcome === 'dismissed') return 'dismissal'

  const lower = (suitNature || '').toLowerCase()
  if (lower.includes('tort') || lower.includes('personal injury')) return 'verdict'
  if (lower.includes('contract')) return 'verdict'
  if (lower.includes('civil rights')) return 'verdict'
  if (lower.includes('labor')) return 'verdict'

  return 'verdict'
}

// ============================================================================
// CORE INGESTION
// ============================================================================

/**
 * Fetch opinions for a single attorney via the CourtListener search API.
 * We search for opinions associated with the attorney's CourtListener person ID.
 */
async function fetchOpinionsForAttorney(
  attorney: AttorneyRow,
  courthouseMap: Map<string, string>,
  stats: Stats,
): Promise<{
  caseRows: Record<string, unknown>[]
  disciplinaryRows: Record<string, unknown>[]
}> {
  const caseRows: Record<string, unknown>[] = []
  const disciplinaryRows: Record<string, unknown>[] = []
  const clId = attorney.courtlistener_id

  // Use the search endpoint to find opinions by this attorney's person ID
  let searchUrl = `/search/?type=o&atty_id=${clId}&format=json&page_size=20&order_by=dateFiled+desc`
  if (FROM_DATE) {
    searchUrl += `&filed_after=${FROM_DATE}`
  }

  let page = 0
  let nextUrl: string | null = searchUrl

  while (nextUrl) {
    const data = await clFetch<CLResponse<CLSearchResult>>(nextUrl)
    if (!data || !data.results?.length) break

    for (const result of data.results) {
      stats.opinions_fetched++

      const clCaseId = `cl-opinion-${result.cluster_id}`
      const opinionText = result.snippet || ''
      const outcome = parseOutcome(opinionText, result.caseName, result.suitNature)
      const amount = parseAmount(opinionText)
      const caseType = mapCaseType(result.suitNature, outcome)

      // Map court to our courthouse table
      const courthouseId = result.court_id ? courthouseMap.get(result.court_id) : null

      // Build case_results row
      caseRows.push({
        attorney_id: attorney.id,
        case_type: caseType,
        outcome: outcome || 'unknown',
        amount: amount,
        date: result.dateFiled || null,
        court_id: courthouseId || null,
        is_public: true,
        description: result.caseName?.slice(0, 500) || null,
        courtlistener_case_id: clCaseId,
      })

      // Check for disciplinary action
      const disciplinary = detectDisciplinary(opinionText, result.caseName)
      if (disciplinary) {
        disciplinaryRows.push({
          attorney_id: attorney.id,
          state: attorney.address_state || 'XX',
          action_type: disciplinary.type,
          effective_date: result.dateFiled || null,
          description: disciplinary.description,
          docket_number: result.docket_id ? `CL-${result.docket_id}` : null,
          source_url: `https://www.courtlistener.com${result.absolute_url}`,
          is_public: true,
        })
      }
    }

    nextUrl = data.next
    page++

    // Safety: cap pages to prevent runaway fetching for prolific attorneys
    if (page >= 50) {
      console.warn(`  Capped at 50 pages for attorney ${attorney.name} (CL: ${clId})`)
      break
    }

    await sleep(RATE_DELAY)
  }

  return { caseRows, disciplinaryRows }
}

/**
 * Process a batch of attorneys concurrently.
 */
async function processBatch(
  attorneys: AttorneyRow[],
  courthouseMap: Map<string, string>,
  existingCaseIds: Set<string>,
  stats: Stats,
): Promise<void> {
  const results = await Promise.all(
    attorneys.map(attorney =>
      fetchOpinionsForAttorney(attorney, courthouseMap, stats).catch(err => {
        console.error(`  Error for attorney ${attorney.name}: ${(err as Error).message}`)
        stats.errors++
        return { caseRows: [], disciplinaryRows: [] }
      })
    )
  )

  // Collect all rows
  const allCaseRows: Record<string, unknown>[] = []
  const allDisciplinaryRows: Record<string, unknown>[] = []

  for (const { caseRows, disciplinaryRows } of results) {
    for (const row of caseRows) {
      const clCaseId = row.courtlistener_case_id as string
      if (existingCaseIds.has(clCaseId)) {
        stats.cases_skipped++
      } else {
        allCaseRows.push(row)
        existingCaseIds.add(clCaseId) // prevent duplicates within this run
      }
    }
    allDisciplinaryRows.push(...disciplinaryRows)
  }

  if (DRY_RUN) {
    stats.cases_inserted += allCaseRows.length
    stats.disciplinary_inserted += allDisciplinaryRows.length
    return
  }

  // Upsert case_results
  if (allCaseRows.length > 0) {
    // courtlistener_case_id has no unique constraint in DB, so we use
    // application-level dedup (existingCaseIds set) and insert new rows.
    // We batch in groups of 100 for Supabase limits.
    for (let i = 0; i < allCaseRows.length; i += 100) {
      const batch = allCaseRows.slice(i, i + 100)
      const { error } = await supabase
        .from('case_results')
        .insert(batch)

      if (error) {
        console.error(`  case_results insert error: ${error.message}`)
        stats.errors++
      } else {
        stats.cases_inserted += batch.length
      }
    }
  }

  // Insert disciplinary_actions
  if (allDisciplinaryRows.length > 0) {
    for (let i = 0; i < allDisciplinaryRows.length; i += 100) {
      const batch = allDisciplinaryRows.slice(i, i + 100)
      const { error } = await supabase
        .from('disciplinary_actions')
        .insert(batch)

      if (error) {
        // Disciplinary actions may fail due to action_type CHECK constraint
        // if our detection was wrong. Log and continue.
        console.error(`  disciplinary_actions insert error: ${error.message}`)
        stats.errors++
      } else {
        stats.disciplinary_inserted += batch.length
      }
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const startTime = Date.now()

  console.log('=== CourtListener Case Results Ingestion ===')
  console.log(`Mode:        ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit:       ${LIMIT || 'all'}`)
  console.log(`From date:   ${FROM_DATE || 'all time'}`)
  console.log(`Concurrency: ${CONCURRENCY}`)
  console.log()

  // ------------------------------------------------------------------
  // 1. Load attorneys with courtlistener_id
  // ------------------------------------------------------------------
  console.log('Loading attorneys with courtlistener_id...')

  let query = supabase
    .from('attorneys')
    .select('id, courtlistener_id, name, address_state')
    .not('courtlistener_id', 'is', null)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (LIMIT > 0) {
    query = query.limit(LIMIT)
  }

  const { data: attorneys, error: attErr } = await query

  if (attErr || !attorneys?.length) {
    console.error('Failed to load attorneys:', attErr?.message || 'none with courtlistener_id')
    process.exit(1)
  }

  console.log(`Found ${attorneys.length} attorneys with courtlistener_id`)

  // ------------------------------------------------------------------
  // 2. Load courthouse courtlistener_id → id mapping
  // ------------------------------------------------------------------
  console.log('Loading courthouse mapping...')

  const { data: courthouses } = await supabase
    .from('courthouses')
    .select('id, courtlistener_id')
    .not('courtlistener_id', 'is', null)

  const courthouseMap = new Map<string, string>()
  if (courthouses) {
    for (const ch of courthouses) {
      courthouseMap.set(ch.courtlistener_id, ch.id)
    }
  }
  console.log(`Loaded ${courthouseMap.size} courthouse mappings`)

  // ------------------------------------------------------------------
  // 3. Load existing courtlistener_case_ids to skip duplicates
  // ------------------------------------------------------------------
  console.log('Loading existing case IDs for dedup...')

  const { data: existingCases } = await supabase
    .from('case_results')
    .select('courtlistener_case_id')
    .not('courtlistener_case_id', 'is', null)

  const existingCaseIds = new Set<string>(
    existingCases?.map(c => c.courtlistener_case_id).filter(Boolean) || []
  )
  console.log(`Found ${existingCaseIds.size} existing case results (will skip)`)

  // ------------------------------------------------------------------
  // 4. Process attorneys in concurrent batches
  // ------------------------------------------------------------------
  console.log('\nFetching opinions from CourtListener API...')

  const stats: Stats = {
    attorneys_processed: 0,
    opinions_fetched: 0,
    cases_inserted: 0,
    cases_skipped: 0,
    disciplinary_inserted: 0,
    errors: 0,
  }

  for (let i = 0; i < attorneys.length; i += CONCURRENCY) {
    const batch = attorneys.slice(i, i + CONCURRENCY) as AttorneyRow[]

    await processBatch(batch, courthouseMap, existingCaseIds, stats)

    stats.attorneys_processed += batch.length

    // Progress logging
    if (stats.attorneys_processed % PROGRESS_INTERVAL === 0 || i + CONCURRENCY >= attorneys.length) {
      const pct = ((stats.attorneys_processed / attorneys.length) * 100).toFixed(1)
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
      console.log(
        `  [${pct}%] ${stats.attorneys_processed}/${attorneys.length} attorneys | ` +
        `${stats.opinions_fetched} opinions | ${stats.cases_inserted} inserted | ` +
        `${stats.cases_skipped} skipped | ${stats.errors} errors | ${elapsed}s`
      )
    }

    await sleep(RATE_DELAY)
  }

  // ------------------------------------------------------------------
  // 5. Summary
  // ------------------------------------------------------------------
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log(`Mode:                  ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Attorneys processed:   ${stats.attorneys_processed}`)
  console.log(`Opinions fetched:      ${stats.opinions_fetched}`)
  console.log(`Cases inserted:        ${stats.cases_inserted}`)
  console.log(`Cases skipped (dedup): ${stats.cases_skipped}`)
  console.log(`Disciplinary inserted: ${stats.disciplinary_inserted}`)
  console.log(`Errors:                ${stats.errors}`)
  console.log(`Duration:              ${elapsed}s`)
  console.log('='.repeat(60))

  if (stats.errors > 0) {
    console.warn(`\nCompleted with ${stats.errors} errors. Review logs above.`)
  }

  console.log('\n=== INGESTION COMPLETE ===')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
