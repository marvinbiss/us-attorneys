/**
 * Texas State Bar — Production Attorney Scraper
 *
 * Scrapes ALL Texas attorneys from texasbar.com and upserts into Supabase.
 * Proven ColdFusion session-based approach from test-tx.ts.
 *
 * CRITICAL: Do NOT include County or PracticeArea as empty params — ColdFusion returns 0 results.
 * Only send: Submitted, ShowPrinter, Find, LastName, FirstName, BarCardNumber, City, State, Zip.
 *
 * Usage: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/ingest/tx-attorneys-prod.ts [--dry-run] [--limit 100] [--start-letter M]
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

const BATCH_SIZE = 500
const DELAY_MS = 400
const SESSION_REFRESH_INTERVAL = 200 // refresh cookies every N requests
const RETRY_DELAY_MS = 30_000
const MAX_RETRIES = 3
const PAGES_PER_SEARCH = 100 // safety cap per letter

const TX_BAR_PHONE = '(877) 953-5535'
const SEARCH_URL = 'https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer&Template=/CustomSource/MemberDirectory/Search_Form_Client_Main.cfm'
const RESULT_URL = 'https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer&Template=/CustomSource/MemberDirectory/Result_form_client.cfm'

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Connection': 'keep-alive',
}

// ============================================================================
// CLI ARGS
// ============================================================================

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const LIMIT = (() => {
  const idx = args.indexOf('--limit')
  return idx !== -1 ? parseInt(args[idx + 1], 10) : Infinity
})()
const START_LETTER = (() => {
  const idx = args.indexOf('--start-letter')
  return idx !== -1 ? args[idx + 1].toUpperCase() : 'A'
})()

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('Run: export $(grep -v \'^#\' .env.local | xargs) && npx tsx scripts/ingest/tx-attorneys-prod.ts')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ============================================================================
// TYPES
// ============================================================================

interface TXAttorney {
  contactId: string
  firstName: string
  lastName: string
  name: string
  barNumber: string | null
  status: string | null
  city: string | null
  state: string | null
  phone: string | null
  email: string | null
  firmName: string | null
  firmSize: string | null
  lawSchool: string | null
  dateAdmitted: string | null
  practiceAreas: string | null
}

// ============================================================================
// STATS
// ============================================================================

const stats = {
  totalDiscovered: 0,
  totalEnriched: 0,
  totalUpserted: 0,
  totalSkipped: 0,
  totalErrors: 0,
  sessionRefreshes: 0,
  httpRequests: 0,
  startTime: Date.now(),
}

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

function makeSlug(firstName: string, lastName: string, barNumber: string): string {
  const base = slugify(`${firstName} ${lastName}`)
  return `${base}-tx-${barNumber}`
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

function mapStatus(rawStatus: string | null): string {
  if (!rawStatus) return 'unknown'
  const s = rawStatus.toLowerCase()
  if (s.includes('active') || s.includes('eligible')) return 'active'
  if (s.includes('inactive')) return 'inactive'
  if (s.includes('suspended')) return 'suspended'
  if (s.includes('disbarred')) return 'disbarred'
  if (s.includes('deceased')) return 'deceased'
  if (s.includes('resigned')) return 'resigned'
  if (s.includes('not eligible')) return 'inactive'
  return 'inactive'
}

function parseAdmissionDate(raw: string | null): string | null {
  if (!raw) return null
  // Format: MM/DD/YYYY or MM/YYYY
  const fullMatch = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (fullMatch) return `${fullMatch[3]}-${fullMatch[1]}-${fullMatch[2]}`
  const shortMatch = raw.match(/(\d{2})\/(\d{4})/)
  if (shortMatch) return `${shortMatch[2]}-${shortMatch[1]}-01`
  return null
}

function elapsed(): string {
  const s = Math.floor((Date.now() - stats.startTime) / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h${m % 60}m${s % 60}s`
  if (m > 0) return `${m}m${s % 60}s`
  return `${s}s`
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

let currentCookies = ''
let requestsSinceRefresh = 0

async function getSession(): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(SEARCH_URL, { headers: BROWSER_HEADERS, redirect: 'follow' })
      stats.httpRequests++
      if (!res.ok) {
        console.warn(`  [SESSION] HTTP ${res.status} on attempt ${attempt + 1}`)
        await sleep(RETRY_DELAY_MS)
        continue
      }
      const cookies = (res.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ')
      if (!cookies) {
        console.warn(`  [SESSION] No cookies returned on attempt ${attempt + 1}`)
        await sleep(5000)
        continue
      }
      stats.sessionRefreshes++
      requestsSinceRefresh = 0
      return cookies
    } catch (err: any) {
      console.warn(`  [SESSION] Error attempt ${attempt + 1}: ${err.message}`)
      await sleep(RETRY_DELAY_MS)
    }
  }
  throw new Error('Failed to get session after max retries')
}

async function ensureFreshSession(): Promise<void> {
  if (requestsSinceRefresh >= SESSION_REFRESH_INTERVAL) {
    console.log(`  [SESSION] Refreshing cookies (${requestsSinceRefresh} requests since last refresh)...`)
    currentCookies = await getSession()
    console.log(`  [SESSION] OK`)
  }
}

// ============================================================================
// FETCH WITH RETRY
// ============================================================================

async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await ensureFreshSession()
      // Inject current cookies
      const headers = { ...(options.headers as Record<string, string>), 'Cookie': currentCookies }
      const res = await fetch(url, { ...options, headers, redirect: 'follow' })
      stats.httpRequests++
      requestsSinceRefresh++

      if (res.status === 403 || res.status === 429 || res.status === 500 || res.status === 502 || res.status === 503) {
        console.warn(`  [HTTP] ${res.status} — waiting ${RETRY_DELAY_MS / 1000}s then retry (attempt ${attempt + 1})`)
        await sleep(RETRY_DELAY_MS)
        // Force session refresh on server errors
        currentCookies = await getSession()
        continue
      }
      return res
    } catch (err: any) {
      console.warn(`  [FETCH] Error attempt ${attempt + 1}: ${err.message}`)
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAY_MS)
        currentCookies = await getSession()
      }
    }
  }
  throw new Error(`Failed to fetch ${url} after ${MAX_RETRIES} retries`)
}

// ============================================================================
// SEARCH: Parse result page for attorney cards
// ============================================================================

function parseResultPage(html: string): TXAttorney[] {
  const attorneys: TXAttorney[] = []

  // Extract unique ContactIDs
  const idSet = new Set<string>()
  const idRegex = /ContactID=(\d+)/gi
  let m: RegExpExecArray | null
  while ((m = idRegex.exec(html)) !== null) idSet.add(m[1])

  for (const cid of idSet) {
    const cidIdx = html.indexOf(`ContactID=${cid}`)
    if (cidIdx < 0) continue

    const articleStart = html.lastIndexOf('<article', cidIdx)
    if (articleStart < 0) continue
    const articleEnd = html.indexOf('</article>', cidIdx)
    const block = html.substring(articleStart, articleEnd > 0 ? articleEnd : cidIdx + 500)

    // Name
    const givenM = block.match(/<span\s+class="given-name">([^<]+)<\/span>/i)
    const familyM = block.match(/<span\s+class="family-name">([^<]+)<\/span>/i)
    const firstName = givenM ? givenM[1].trim() : ''
    const lastName = familyM ? familyM[1].trim() : ''
    const name = `${firstName} ${lastName}`.trim()
    if (!name) continue

    // Location from search results
    let city: string | null = null
    let state: string | null = null
    const locM = block.match(/Primary\s+Practice\s+Location:<\/strong>\s*([\s\S]*?)(?:<\/p>|<br|<a\s)/i)
    if (locM) {
      const locText = locM[1].replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '').trim()
      const parts = locText.split(',').map(s => s.trim())
      if (parts.length >= 2) { city = parts[0]; state = parts[1] }
      else if (parts[0]) city = parts[0]
    }

    // Practice areas from search results
    let practiceAreas: string | null = null
    const paM = block.match(/Practice\s+Areas:<\/strong>\s*([\s\S]*?)(?:<\/p>|<br|<a\s)/i)
    if (paM) {
      const pa = paM[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      if (!pa.includes('None Specified') && !pa.includes('None Reported') && pa.length > 2) {
        practiceAreas = pa
      }
    }

    attorneys.push({
      contactId: cid, firstName, lastName, name,
      barNumber: null, status: null, city, state,
      phone: null, email: null, firmName: null,
      firmSize: null, lawSchool: null, dateAdmitted: null,
      practiceAreas,
    })
  }

  return attorneys
}

// ============================================================================
// SEARCH: Check for pagination (next page link)
// ============================================================================

function getNextPageUrl(html: string): string | null {
  // TX Bar uses "Next" link for pagination
  const nextM = html.match(/<a\s+href="([^"]*)"[^>]*>\s*(?:Next|&gt;|›)\s*<\/a>/i)
  if (nextM) {
    let url = nextM[1].replace(/&amp;/g, '&')
    if (url.startsWith('/')) url = `https://www.texasbar.com${url}`
    return url
  }
  return null
}

// ============================================================================
// SEARCH by last name prefix (handles pagination)
// ============================================================================

async function searchByPrefix(prefix: string): Promise<TXAttorney[]> {
  const allResults: TXAttorney[] = []
  const seenContactIds = new Set<string>()

  // First page: POST
  const body = new URLSearchParams({
    Submitted: '1',
    ShowPrinter: '1',
    Find: '1',
    LastName: prefix,
    FirstName: '',
    BarCardNumber: '',
    City: '',
    State: '',
    Zip: '',
  })

  const res = await fetchWithRetry(RESULT_URL, {
    method: 'POST',
    headers: {
      ...BROWSER_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': SEARCH_URL,
      'Origin': 'https://www.texasbar.com',
    },
    body: body.toString(),
  })

  let html = await res.text()

  // Check for empty results (session might be expired)
  if (html.length < 500 && !html.includes('ContactID')) {
    // Possible session expiry — refresh and retry once
    console.log(`    [WARN] Empty results for "${prefix}" — refreshing session...`)
    currentCookies = await getSession()
    const retry = await fetchWithRetry(RESULT_URL, {
      method: 'POST',
      headers: {
        ...BROWSER_HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': SEARCH_URL,
        'Origin': 'https://www.texasbar.com',
      },
      body: body.toString(),
    })
    html = await retry.text()
  }

  // Parse first page
  let pageNum = 1
  const firstPageResults = parseResultPage(html)
  for (const a of firstPageResults) {
    if (!seenContactIds.has(a.contactId)) {
      seenContactIds.add(a.contactId)
      allResults.push(a)
    }
  }

  // Handle pagination
  let nextUrl = getNextPageUrl(html)
  while (nextUrl && pageNum < PAGES_PER_SEARCH) {
    pageNum++
    await sleep(DELAY_MS)

    try {
      const pageRes = await fetchWithRetry(nextUrl, {
        method: 'GET',
        headers: { ...BROWSER_HEADERS, 'Referer': RESULT_URL },
      })
      html = await pageRes.text()

      const pageResults = parseResultPage(html)
      if (pageResults.length === 0) break // no more results

      let newOnPage = 0
      for (const a of pageResults) {
        if (!seenContactIds.has(a.contactId)) {
          seenContactIds.add(a.contactId)
          allResults.push(a)
          newOnPage++
        }
      }
      if (newOnPage === 0) break // all duplicates, stop

      nextUrl = getNextPageUrl(html)
    } catch (err: any) {
      console.warn(`    [WARN] Page ${pageNum} error: ${err.message}`)
      break
    }
  }

  return allResults
}

// ============================================================================
// ENRICH: Fetch detail page for a single attorney
// ============================================================================

async function enrichDetail(a: TXAttorney): Promise<void> {
  const url = `https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer&template=/Customsource/MemberDirectory/MemberDirectoryDetail.cfm&ContactID=${a.contactId}`

  const res = await fetchWithRetry(url, {
    method: 'GET',
    headers: { ...BROWSER_HEADERS, 'Referer': RESULT_URL },
  })
  const html = await res.text()

  // Bar Card Number
  const barM = html.match(/Bar\s*Card\s*Number:<\/strong>\s*(\d{5,10})/i)
  if (barM) a.barNumber = barM[1]

  // Status — extract full text for filtering later
  const statusM = html.match(/Membership\s*Status:<\/strong>\s*([^<]+)/i)
  if (statusM) {
    a.status = statusM[1].trim()
  } else {
    // Fallback: pattern matching on page text
    if (/Eligible\s+to\s+Practice/i.test(html)) a.status = 'Eligible to Practice'
    else if (/Currently\s+Active/i.test(html)) a.status = 'Currently Active'
    else if (/Deceased/i.test(html)) a.status = 'Deceased'
    else if (/Not\s+Eligible/i.test(html)) a.status = 'Not Eligible to Practice'
    else if (/Inactive/i.test(html)) a.status = 'Inactive'
    else if (/Suspended/i.test(html)) a.status = 'Suspended'
    else if (/Disbarred/i.test(html)) a.status = 'Disbarred'
    else if (/Resigned/i.test(html)) a.status = 'Resigned'
  }

  // Location (detail page is more precise)
  const locM = html.match(/Primary\s+Practice\s+Location:<\/strong>\s*([^<]+)/i)
  if (locM) {
    const parts = locM[1].replace(/&nbsp;/g, ' ').trim().split(/\s*,\s*/)
    if (parts.length >= 2) { a.city = parts[0].trim(); a.state = parts[1].trim() }
  }

  // Phone
  const phoneM = html.match(/tel:\+?1?(\d{10})/i)
  if (phoneM) {
    const d = phoneM[1]
    const fmt = `(${d.substring(0, 3)}) ${d.substring(3, 6)}-${d.substring(6)}`
    if (fmt !== TX_BAR_PHONE) a.phone = fmt
  }

  // Email
  const emailM = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i)
  if (emailM) a.email = emailM[1]

  // Firm
  const firmM = html.match(/Firm:<\/strong>\s*([^<]+)/i) || html.match(/Company:<\/strong>\s*([^<]+)/i)
  if (firmM) {
    const f = firmM[1].trim()
    if (f !== 'None Reported By Attorney' && f.length > 1) a.firmName = f
  }

  // Firm Size
  const sizeM = html.match(/Firm\s*Size[:\s]*<\/strong>\s*([^<]+)/i)
  if (sizeM) a.firmSize = sizeM[1].trim()

  // Law School (table pattern — JD/LLB/LLM)
  const schoolM = html.match(/<td[^>]*>\s*([^<]{5,80}?)\s*<\/td>\s*<td[^>]*>\s*[^<]*(?:Juris|J\.?D|LL\.?[BM]|Doctor of Jur)[^<]*<\/td>\s*<td[^>]*>\s*(\d{2}\/\d{4})\s*<\/td>/i)
  if (schoolM) {
    a.lawSchool = schoolM[1].trim()
    if (!a.dateAdmitted) a.dateAdmitted = schoolM[2]
  }
  if (!a.lawSchool) {
    const simpleS = html.match(/<td[^>]*>\s*([A-Z][^<]{5,80})\s*<\/td>\s*<td[^>]*>\s*[^<]*(?:Juris|J\.?D|LL\.?[BM]|Doctor)[^<]*<\/td>/i)
    if (simpleS) a.lawSchool = simpleS[1].trim()
  }

  // License date
  const licM = html.match(/(\d{2}\/\d{2}\/\d{4})/i)
  if (licM && !a.dateAdmitted) a.dateAdmitted = licM[1]

  // Practice areas from detail page (may be more complete)
  const paM = html.match(/Practice\s+Areas?:<\/strong>\s*([^<]+)/i)
  if (paM) {
    const pa = paM[1].trim()
    if (!pa.includes('None Reported') && !pa.includes('None Specified') && pa.length > 2) {
      a.practiceAreas = pa
    }
  }
}

// ============================================================================
// FILTER: Only upsert attorneys with quality data
// ============================================================================

function isUpsertable(a: TXAttorney): boolean {
  // MUST have: name + bar_number + status confirmed
  if (!a.name || !a.barNumber) return false
  if (!a.status) return false
  // Only upsert attorneys with status containing "Eligible" or "Active"
  const s = a.status.toLowerCase()
  if (s.includes('eligible') || s.includes('active')) return true
  // Also include inactive/resigned — they existed, useful for completeness
  if (s.includes('inactive') || s.includes('resigned')) return true
  // Skip: Deceased, Disbarred (unless you want them)
  if (s.includes('deceased') || s.includes('disbarred') || s.includes('suspended')) return false
  return true
}

// ============================================================================
// UPSERT BATCH TO SUPABASE
// ============================================================================

async function upsertBatch(
  attorneys: TXAttorney[],
  stateId: string,
): Promise<{ inserted: number; errors: number }> {
  const records = attorneys.map(a => ({
    name: a.name,
    slug: makeSlug(a.firstName, a.lastName, a.barNumber!),
    first_name: a.firstName,
    last_name: a.lastName,
    email: a.email || null,
    phone: normalizePhone(a.phone),
    bar_number: a.barNumber!,
    bar_state: 'TX' as const,
    bar_status: mapStatus(a.status),
    bar_admission_date: parseAdmissionDate(a.dateAdmitted),
    law_school: a.lawSchool || null,
    firm_name: a.firmName || null,
    firm_size: a.firmSize || null,
    address_city: a.city || null,
    address_state: (a.state || 'TX').substring(0, 2) as any,
    is_verified: false,
    is_active: mapStatus(a.status) === 'active',
    noindex: mapStatus(a.status) !== 'active',
    state_id: stateId,
  }))

  if (DRY_RUN) {
    return { inserted: records.length, errors: 0 }
  }

  const { error } = await supabase
    .from('attorneys')
    .upsert(records, {
      onConflict: 'slug',
      ignoreDuplicates: false,
    })

  if (error) {
    console.error(`  [UPSERT ERROR] ${error.message}`)
    // Try individual inserts to isolate bad records
    let ok = 0
    let fail = 0
    for (const rec of records) {
      const { error: singleErr } = await supabase
        .from('attorneys')
        .upsert([rec], { onConflict: 'slug', ignoreDuplicates: false })
      if (singleErr) {
        fail++
        if (fail <= 3) console.error(`    [BAD RECORD] ${rec.slug}: ${singleErr.message}`)
      } else {
        ok++
      }
    }
    return { inserted: ok, errors: fail }
  }

  return { inserted: records.length, errors: 0 }
}

// ============================================================================
// UPSERT BAR ADMISSIONS
// ============================================================================

async function upsertBarAdmissions(attorneys: TXAttorney[]): Promise<void> {
  if (DRY_RUN) return

  const slugs = attorneys.map(a => makeSlug(a.firstName, a.lastName, a.barNumber!))

  // Look up attorney IDs by slug (batch of 500 max for .in())
  for (let i = 0; i < slugs.length; i += 500) {
    const batchSlugs = slugs.slice(i, i + 500)
    const batchAttorneys = attorneys.slice(i, i + 500)

    const { data: existing } = await supabase
      .from('attorneys')
      .select('id, slug, bar_number')
      .in('slug', batchSlugs)

    if (!existing?.length) continue

    const slugToId = new Map(existing.map(e => [e.slug, e.id]))

    const admissions = batchAttorneys
      .filter(a => {
        const slug = makeSlug(a.firstName, a.lastName, a.barNumber!)
        return slugToId.has(slug)
      })
      .map(a => {
        const slug = makeSlug(a.firstName, a.lastName, a.barNumber!)
        return {
          attorney_id: slugToId.get(slug)!,
          state: 'TX' as const,
          bar_number: a.barNumber!,
          status: mapStatus(a.status),
          admission_date: parseAdmissionDate(a.dateAdmitted),
          verified: false,
          source: 'tx_bar_scrape',
        }
      })

    if (admissions.length > 0) {
      await supabase
        .from('bar_admissions')
        .upsert(admissions, {
          onConflict: 'attorney_id,state',
          ignoreDuplicates: true,
        })
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('='.repeat(70))
  console.log('  TEXAS STATE BAR — PRODUCTION ATTORNEY SCRAPER')
  console.log('='.repeat(70))
  console.log(`  Mode:         ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`  Limit:        ${LIMIT === Infinity ? 'ALL' : LIMIT}`)
  console.log(`  Start letter: ${START_LETTER}`)
  console.log(`  Batch size:   ${BATCH_SIZE}`)
  console.log(`  Delay:        ${DELAY_MS}ms`)
  console.log('='.repeat(70))
  console.log()

  // 1. Resolve TX state_id
  const { data: txState, error: stateErr } = await supabase
    .from('states')
    .select('id')
    .eq('abbreviation', 'TX')
    .single()

  if (stateErr || !txState) {
    console.error('TX state not found in DB. Ensure states table has Texas.')
    process.exit(1)
  }
  console.log(`[INIT] TX state_id: ${txState.id}`)

  // 2. Get initial session
  console.log('[INIT] Getting ColdFusion session...')
  currentCookies = await getSession()
  console.log('[INIT] Session OK\n')

  // 3. Search A-Z
  const allAttorneys: TXAttorney[] = []
  const seenContactIds = new Set<string>()
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const startIdx = alphabet.indexOf(START_LETTER)

  for (let li = startIdx; li < 26; li++) {
    if (allAttorneys.length >= LIMIT) break
    const letter = alphabet[li]
    console.log(`[SEARCH] Letter "${letter}"...`)

    try {
      const results = await searchByPrefix(letter)
      let added = 0
      for (const a of results) {
        if (!seenContactIds.has(a.contactId)) {
          seenContactIds.add(a.contactId)
          allAttorneys.push(a)
          added++
        }
      }
      console.log(`  -> ${results.length} found, ${added} new (total: ${allAttorneys.length})`)
      stats.totalDiscovered = allAttorneys.length
      await sleep(DELAY_MS)
    } catch (err: any) {
      console.error(`  [ERROR] Letter "${letter}": ${err.message}`)
      stats.totalErrors++
    }
  }

  console.log(`\n[SEARCH COMPLETE] ${allAttorneys.length} unique attorneys discovered (${elapsed()})\n`)

  if (allAttorneys.length === 0) {
    console.error('FATAL: No attorneys found. Check session/network.')
    process.exit(1)
  }

  // 4. Enrich detail pages
  const toProcess = allAttorneys.slice(0, LIMIT)
  console.log(`[ENRICH] Fetching detail pages for ${toProcess.length} attorneys...`)
  console.log(`  (${DELAY_MS}ms delay between requests, session refresh every ${SESSION_REFRESH_INTERVAL})\n`)

  for (let i = 0; i < toProcess.length; i++) {
    const a = toProcess[i]
    try {
      await enrichDetail(a)
      stats.totalEnriched++

      // Progress log every 500
      if ((i + 1) % 500 === 0 || i === toProcess.length - 1) {
        const withBar = toProcess.slice(0, i + 1).filter(x => x.barNumber).length
        console.log(
          `  [PROGRESS] ${i + 1}/${toProcess.length} enriched | ` +
          `${withBar} with bar# | ` +
          `${stats.httpRequests} HTTP reqs | ` +
          `${stats.sessionRefreshes} session refreshes | ` +
          `${elapsed()}`
        )
      }
    } catch (err: any) {
      console.warn(`  [ENRICH ERROR] ${a.name} (CID ${a.contactId}): ${err.message}`)
      stats.totalErrors++
    }
    await sleep(DELAY_MS)
  }

  console.log(`\n[ENRICH COMPLETE] ${stats.totalEnriched} enriched (${elapsed()})\n`)

  // 5. Filter and upsert
  const upsertable = toProcess.filter(isUpsertable)
  const skipped = toProcess.length - upsertable.length
  stats.totalSkipped = skipped

  console.log(`[UPSERT] ${upsertable.length} attorneys pass quality filter (${skipped} skipped)`)

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: First 5 records ---')
    upsertable.slice(0, 5).forEach((a, i) => {
      console.log(`\n[${i + 1}] ${a.name}`)
      console.log(`    Bar#: ${a.barNumber} | Status: ${a.status}`)
      console.log(`    City: ${a.city} | Firm: ${a.firmName || 'N/A'}`)
      console.log(`    Slug: ${makeSlug(a.firstName, a.lastName, a.barNumber!)}`)
    })
  }

  // Status distribution
  const statusDist: Record<string, number> = {}
  toProcess.forEach(a => { statusDist[a.status || 'Unknown'] = (statusDist[a.status || 'Unknown'] || 0) + 1 })
  console.log('\n  Status distribution (all enriched):')
  Object.entries(statusDist).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => console.log(`    ${s}: ${c}`))
  console.log()

  // Batch upsert
  for (let i = 0; i < upsertable.length; i += BATCH_SIZE) {
    const batch = upsertable.slice(i, i + BATCH_SIZE)
    const result = await upsertBatch(batch, txState.id)
    stats.totalUpserted += result.inserted
    stats.totalErrors += result.errors

    if ((i + BATCH_SIZE) % 500 === 0 || i + BATCH_SIZE >= upsertable.length) {
      console.log(
        `  [UPSERT] ${Math.min(i + BATCH_SIZE, upsertable.length)}/${upsertable.length} | ` +
        `${stats.totalUpserted} OK, ${stats.totalErrors} errors | ${elapsed()}`
      )
    }
  }

  // 6. Upsert bar admissions
  console.log('\n[BAR ADMISSIONS] Upserting bar_admissions records...')
  await upsertBarAdmissions(upsertable)
  console.log('[BAR ADMISSIONS] Done')

  // 7. Verify count
  if (!DRY_RUN) {
    const { count } = await supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('bar_state', 'TX')

    console.log(`\n[VERIFY] Total TX attorneys in DB: ${count?.toLocaleString() || 'unknown'}`)
  }

  // 8. Final report
  console.log('\n' + '='.repeat(70))
  console.log('  FINAL REPORT')
  console.log('='.repeat(70))
  console.log(`  Total discovered:     ${stats.totalDiscovered.toLocaleString()}`)
  console.log(`  Total enriched:       ${stats.totalEnriched.toLocaleString()}`)
  console.log(`  Total upserted:       ${stats.totalUpserted.toLocaleString()}`)
  console.log(`  Total skipped:        ${stats.totalSkipped.toLocaleString()}`)
  console.log(`  Total errors:         ${stats.totalErrors}`)
  console.log(`  HTTP requests:        ${stats.httpRequests.toLocaleString()}`)
  console.log(`  Session refreshes:    ${stats.sessionRefreshes}`)
  console.log(`  Duration:             ${elapsed()}`)
  console.log('='.repeat(70))
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
