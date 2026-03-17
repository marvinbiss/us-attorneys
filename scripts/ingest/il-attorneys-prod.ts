/**
 * Illinois ARDC Attorney Scraper — PRODUCTION
 *
 * Scrapes ALL Illinois attorneys from the ARDC directory and upserts into Supabase.
 *
 * Proven 4-step flow:
 * 1. GET /Lawyer/Search → session cookies + __RequestVerificationToken
 * 2. POST /Lawyer/SearchResults (LastName prefix) → PageKey (GUID)
 * 3. POST /Lawyer/SearchGrid (paginate) → HTML table (10/page)
 * 4. POST /Lawyer/Details/{GUID} → full profile modal
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/ingest/il-attorneys-prod.ts
 *   Options: --dry-run  --limit 100  --start-letter M
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const BASE = 'https://www.iardc.org'
const BATCH_SIZE = 500
const REQUEST_DELAY_MS = 300
const TOKEN_REFRESH_INTERVAL = 500 // re-fetch tokens every N detail requests
const MAX_RETRIES = 3
const RETRY_BASE_DELAY_MS = 30_000

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

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
// SUPABASE
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('Run: export $(grep -v \'^#\' .env.local | xargs) && npx tsx scripts/ingest/il-attorneys-prod.ts')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ============================================================================
// TYPES
// ============================================================================

interface AttorneyRecord {
  guid: string
  name: string
  city: string
  state: string
  date_admitted: string
  authorized: string
  // From detail page
  ardc_number?: string
  full_address?: string
  address_line1?: string
  address_line2?: string
  phone?: string
  email?: string
  firm?: string
  law_school?: string
  full_status?: string
  county?: string
}

interface SessionData {
  cookies: string
  token: string
}

interface AttorneyInsert {
  name: string
  slug: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  bar_number: string | null
  bar_state: string
  bar_status: string
  bar_admission_date: string | null
  law_school: string | null
  firm_name: string | null
  address_line1: string | null
  address_line2: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  address_county: string | null
  state_id: string
  is_verified: boolean
  is_active: boolean
  noindex: boolean
}

// ============================================================================
// STATS
// ============================================================================

const stats = {
  totalDiscovered: 0,
  totalDetailsFetched: 0,
  totalUpserted: 0,
  totalErrors: 0,
  totalSkipped: 0,
  byLetter: {} as Record<string, number>,
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

function makeSlug(name: string, guid: string): string {
  const base = slugify(name)
  const guidSuffix = guid.replace(/-/g, '').slice(-8).toLowerCase()
  return `${base}-il-${guidSuffix}`
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

function parseName(fullName: string): { first: string | null; last: string | null } {
  // ARDC format: "Last, First Middle" or "Last, First M."
  const parts = fullName.split(',').map(s => s.trim())
  if (parts.length >= 2) {
    const last = parts[0]
    const firstParts = parts[1].split(/\s+/)
    const first = firstParts[0] || null
    return { first, last }
  }
  // Fallback: just split on space
  const words = fullName.trim().split(/\s+/)
  if (words.length >= 2) {
    return { first: words[0], last: words[words.length - 1] }
  }
  return { first: null, last: fullName.trim() || null }
}

function mapStatus(authorized: string, fullStatus?: string): string {
  const s = (fullStatus || authorized || '').toLowerCase().trim()
  if (s.includes('authorized') || s.includes('active') || s.includes('registered')) return 'active'
  if (s.includes('not authorized') || s.includes('retired') || s.includes('inactive')) return 'inactive'
  if (s.includes('suspended')) return 'suspended'
  if (s.includes('disbarred')) return 'disbarred'
  // ARDC "Authorized to Practice" values
  if (s === 'yes' || s === 'true') return 'active'
  if (s === 'no' || s === 'false') return 'inactive'
  return 'inactive'
}

function parseAdmissionDate(dateStr: string): string | null {
  if (!dateStr) return null
  // ARDC format: "MM/DD/YYYY" or similar
  const m = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (m) {
    const [, month, day, year] = m
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  // Try "YYYY" only
  const y = dateStr.match(/(\d{4})/)
  if (y) return `${y[1]}-01-01`
  return null
}

function parseAddressComponents(fullAddress: string): { line1: string | null; line2: string | null; zip: string | null } {
  if (!fullAddress) return { line1: null, line2: null, zip: null }
  const zipMatch = fullAddress.match(/\b(\d{5})(?:-\d{4})?\b/)
  const zip = zipMatch ? zipMatch[1] : null
  const lines = fullAddress.split(',').map(s => s.trim()).filter(Boolean)
  return {
    line1: lines[0] || null,
    line2: lines.length > 2 ? lines[1] : null,
    zip,
  }
}

function mergeCookies(existing: string, newSetCookies: string[]): string {
  const m = new Map(
    existing.split('; ').filter(Boolean).map(c => {
      const [k, ...v] = c.split('=')
      return [k, v.join('=')] as [string, string]
    })
  )
  newSetCookies.forEach(c => {
    const [kv] = c.split(';')
    const [k, ...v] = kv.split('=')
    m.set(k, v.join('='))
  })
  return [...m].map(([k, v]) => `${k}=${v}`).join('; ')
}

function elapsed(): string {
  const s = Math.round((Date.now() - stats.startTime) / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${h}h${m}m${sec}s` : m > 0 ? `${m}m${sec}s` : `${sec}s`
}

// ============================================================================
// HTTP WITH RETRY
// ============================================================================

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  label: string
): Promise<Response> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, options)

      // 302 redirect likely means token expired — caller handles
      if (res.status === 302) return res

      // Retry on server errors or rate limiting
      if (res.status === 403 || res.status === 429 || res.status >= 500) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
        console.warn(`  [RETRY ${attempt}/${MAX_RETRIES}] ${label}: HTTP ${res.status}, waiting ${delay / 1000}s...`)
        if (attempt === MAX_RETRIES) {
          console.error(`  [FAIL] ${label}: HTTP ${res.status} after ${MAX_RETRIES} retries`)
          return res
        }
        await sleep(delay)
        continue
      }

      return res
    } catch (err: any) {
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
      console.warn(`  [RETRY ${attempt}/${MAX_RETRIES}] ${label}: ${err.message}, waiting ${delay / 1000}s...`)
      if (attempt === MAX_RETRIES) {
        throw err
      }
      await sleep(delay)
    }
  }
  // Should never reach here
  throw new Error(`fetchWithRetry exhausted for ${label}`)
}

// ============================================================================
// STEP 1: GET SESSION (cookies + CSRF token)
// ============================================================================

async function getSession(): Promise<SessionData> {
  const res = await fetchWithRetry(
    `${BASE}/Lawyer/Search`,
    { headers: { 'User-Agent': UA, Accept: 'text/html' } },
    'getSession'
  )
  const cookies = (res.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ')
  const html = await res.text()
  const token =
    (
      html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/) ||
      html.match(/value="([^"]+)"[^>]*name="__RequestVerificationToken"/)
    )?.[1] || ''

  if (!token) {
    throw new Error('Failed to extract __RequestVerificationToken from search page')
  }

  return { cookies, token }
}

// ============================================================================
// STEP 2: SEARCH BY LAST NAME PREFIX → PageKey
// ============================================================================

interface SearchResult {
  pageKey: string
  cookies: string
  token: string
  totalResults: number
}

async function searchByPrefix(
  letter: string,
  session: SessionData
): Promise<SearchResult | null> {
  const res = await fetchWithRetry(
    `${BASE}/Lawyer/SearchResults`,
    {
      method: 'POST',
      headers: {
        'User-Agent': UA,
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: session.cookies,
        Referer: `${BASE}/Lawyer/Search`,
        Origin: BASE,
      },
      body: new URLSearchParams({
        LastName: letter,
        FirstName: '',
        IsRecentSearch: 'false',
        IncludeFormerNames: 'false',
        __RequestVerificationToken: session.token,
      }).toString(),
      redirect: 'manual',
    },
    `searchByPrefix(${letter})`
  )

  // Handle redirect (token expired)
  if (res.status === 302) {
    console.warn(`  [TOKEN EXPIRED] Got 302 during search for "${letter}", refreshing session...`)
    return null
  }

  const newCookies = res.headers.getSetCookie?.() || []
  const cookies = newCookies.length > 0 ? mergeCookies(session.cookies, newCookies) : session.cookies

  const html = await res.text()
  const pageKey = html.match(/PageKey:\s*"([^"]+)"/)?.[1] || ''

  if (!pageKey) {
    console.warn(`  [WARN] No PageKey found for letter "${letter}"`)
    return null
  }

  const token =
    (
      html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/) ||
      html.match(/value="([^"]+)"[^>]*name="__RequestVerificationToken"/)
    )?.[1] || session.token

  // Try to extract total results count
  const totalMatch = html.match(/(\d[\d,]*)\s*(?:result|record|attorney)/i)
  const totalResults = totalMatch ? parseInt(totalMatch[1].replace(/,/g, ''), 10) : 0

  return { pageKey, cookies, token, totalResults }
}

// ============================================================================
// STEP 3: PAGINATE GRID → collect all attorneys
// ============================================================================

async function fetchAllGridPages(
  letter: string,
  pageKey: string,
  cookies: string,
  token: string,
  maxRecords: number = Infinity
): Promise<AttorneyRecord[]> {
  const records: AttorneyRecord[] = []
  const seenGuids = new Set<string>()

  const gridParams = new URLSearchParams({
    PageKey: pageKey,
    LastName: letter,
    LastNameMatch: '0',
    IncludeFormerNames: 'false',
    FirstName: '',
    Status: '1',
    City: '',
    State: '',
    Country: '',
    StatusChangeTimeFrame: '0',
    BusinessLocation: '0',
    County: '',
    LawyerCounty: '',
    JudicialCircuit: '',
    JudicialDistrict: '',
    IsRecentSearch: 'false',
    StatusLastName: '',
    __RequestVerificationToken: token,
  })

  let page = 1
  let totalOnGrid = 0

  while (true) {
    const url =
      page === 1
        ? `${BASE}/Lawyer/SearchGrid`
        : `${BASE}/Lawyer/SearchGrid?page=${page}&rows=10`

    const res = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: {
          'User-Agent': UA,
          Accept: '*/*',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Cookie: cookies,
          'X-Requested-With': 'XMLHttpRequest',
          Referer: `${BASE}/Lawyer/SearchResults`,
          Origin: BASE,
        },
        body: gridParams.toString(),
      },
      `grid(${letter},p${page})`
    )

    if (res.status !== 200) {
      console.warn(`  [WARN] Grid page ${page} for "${letter}" returned HTTP ${res.status}`)
      break
    }

    const html = await res.text()

    // Extract total count from first page
    if (page === 1) {
      const totalMatch = html.match(/data-total-results="(\d+)"/)
      if (totalMatch) {
        totalOnGrid = parseInt(totalMatch[1], 10)
      }
    }

    const pageRecords = parseGridPage(html)
    if (pageRecords.length === 0) break

    let newCount = 0
    for (const r of pageRecords) {
      if (r.guid && !seenGuids.has(r.guid)) {
        seenGuids.add(r.guid)
        records.push(r)
        newCount++
      }
    }

    // If we got fewer than 10, we've hit the last page
    if (pageRecords.length < 10) break

    // Safety: if no new records, stop
    if (newCount === 0) break

    // Respect maxRecords limit
    if (records.length >= maxRecords) break

    page++
    await sleep(REQUEST_DELAY_MS)
  }

  if (totalOnGrid > 0 && records.length < totalOnGrid * 0.9) {
    console.warn(`  [WARN] Letter "${letter}": expected ~${totalOnGrid} but only got ${records.length}`)
  }

  return records
}

// ============================================================================
// STEP 4: FETCH DETAIL for each attorney
// ============================================================================

async function fetchDetail(
  guid: string,
  cookies: string,
  token: string
): Promise<Partial<AttorneyRecord> | null> {
  const res = await fetchWithRetry(
    `${BASE}/Lawyer/Details/${guid}`,
    {
      method: 'POST',
      headers: {
        'User-Agent': UA,
        Accept: '*/*',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Cookie: cookies,
        'X-Requested-With': 'XMLHttpRequest',
        Referer: `${BASE}/Lawyer/SearchResults`,
        Origin: BASE,
      },
      body: new URLSearchParams({
        id: guid,
        includeFormerNames: 'false',
        __RequestVerificationToken: token,
      }).toString(),
      redirect: 'manual',
    },
    `detail(${guid.substring(0, 8)})`
  )

  if (res.status === 302) return null // Token expired
  if (res.status !== 200) return null

  const html = await res.text()
  const detail: Partial<AttorneyRecord> = {}
  parseDetailInto(html, detail as AttorneyRecord)
  return detail
}

// ============================================================================
// HTML PARSERS (from test-il.ts, proven)
// ============================================================================

function parseGridPage(html: string): AttorneyRecord[] {
  const records: AttorneyRecord[] = []
  const columns: string[] = []
  const headerMatch = html.match(/<thead>([\s\S]*?)<\/thead>/)
  if (headerMatch) {
    let m
    const p = /data-name="([^"]+)"/g
    while ((m = p.exec(headerMatch[1])) !== null) columns.push(m[1])
  }

  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/)
  const rowsHtml = tbodyMatch ? tbodyMatch[1] : html
  const rowPattern = /<tr>[\s\S]*?<\/tr>/g
  let rowMatch
  while ((rowMatch = rowPattern.exec(rowsHtml)) !== null) {
    const row = rowMatch[0]
    if (row.includes('<th')) continue
    const cells: string[] = []
    const cellHtmls: string[] = []
    let tdMatch
    const tdP = /<td[^>]*>([\s\S]*?)<\/td>/g
    while ((tdMatch = tdP.exec(row)) !== null) {
      cellHtmls.push(tdMatch[1])
      cells.push(tdMatch[1].replace(/<[^>]+>/g, '').trim())
    }
    if (cells.length < 5 || columns.length < 5) continue

    const nameIdx = columns.indexOf('name')
    const name = cells[nameIdx] || ''
    if (!name || name === 'False' || name.length < 3) continue

    const guidMatch = cellHtmls[nameIdx]?.match(/data-id='([^']+)'/)
    const guid = guidMatch?.[1] || cells[columns.indexOf('id')] || ''
    if (!guid) continue

    records.push({
      guid,
      name,
      city: cells[columns.indexOf('city')] || '',
      state: cells[columns.indexOf('state')] || '',
      date_admitted: cells[columns.indexOf('date-admitted')] || '',
      authorized: cells[columns.indexOf('authorized-to-practice')] || '',
    })
  }
  return records
}

function parseDetailInto(html: string, record: AttorneyRecord) {
  // Registration Number
  const regMatch =
    html.match(/Registration\s*Number[\s\S]*?<[^>]*>(\d{7})</) ||
    html.match(/(?:ARDC|Registration)\s*(?:#|Number|No)[^<]*<[^>]*>\s*(\d+)\s*</) ||
    html.match(/>\s*(\d{7})\s*</)
  if (regMatch) record.ardc_number = regMatch[1]

  // Full status
  const statusMatch = html.match(/(?:Lawyer\s*)?Status[\s\S]{0,200}?<[^>]*class="[^"]*"[^>]*>([^<]+)</)
  if (statusMatch) record.full_status = statusMatch[1].trim()

  // Firm
  const firmMatch =
    html.match(/Firm[\s\S]{0,200}?<p[^>]*>([^<]+)</) ||
    html.match(/Employer[\s\S]{0,200}?<p[^>]*>([^<]+)</)
  if (firmMatch) record.firm = firmMatch[1].trim()

  // Address
  const addrMatch = html.match(/Address[\s\S]{0,300}?<p[^>]*>([\s\S]*?)<\/p>/)
  if (addrMatch) record.full_address = addrMatch[1].replace(/<br\s*\/?>/g, ', ').replace(/<[^>]+>/g, '').trim()

  // Phone
  const phoneMatch = html.match(/Phone[\s\S]{0,200}?<[^>]*>([^<]*\d{3}[^<]*)</)
  if (phoneMatch) record.phone = phoneMatch[1].trim()

  // Email
  const emailMatch =
    html.match(/mailto:([^"]+)"/) ||
    html.match(/Email[\s\S]{0,200}?<[^>]*>([^<]+@[^<]+)</)
  if (emailMatch) record.email = emailMatch[1].trim()

  // Law School
  const schoolMatch =
    html.match(/Law\s*School[\s\S]{0,200}?<p[^>]*>([^<]+)</) ||
    html.match(/School[\s\S]{0,200}?<p[^>]*>([^<]+)</)
  if (schoolMatch) record.law_school = schoolMatch[1].trim()

  // County
  const countyMatch = html.match(/County[\s\S]{0,200}?<p[^>]*>([^<]+)</)
  if (countyMatch) record.county = countyMatch[1].trim()

  // If we didn't find registration number, try more aggressively
  if (!record.ardc_number) {
    const allNums = html.match(/\b\d{7}\b/g)
    if (allNums) {
      const candidates = allNums.filter(n => !html.includes(`${n}-`) && !html.includes(`-${n}`))
      if (candidates.length > 0) record.ardc_number = candidates[0]
    }
  }

  // Parse all form-group label/value pairs
  const labelPattern = /<label[^>]*>([^<]+)<\/label>[\s\S]*?<p[^>]*class="form-control-static"[^>]*>([\s\S]*?)<\/p>/g
  let gm
  while ((gm = labelPattern.exec(html)) !== null) {
    const label = gm[1].trim()
    const value = gm[2].replace(/<[^>]+>/g, '').trim()
    if (/registration\s*number/i.test(label) && value) record.ardc_number = value
    if (/status/i.test(label) && value) record.full_status = value
    if (/law\s*school/i.test(label) && value) record.law_school = value
    if (/firm|employer/i.test(label) && value) record.firm = value
    if (/county/i.test(label) && value) record.county = value
  }

  // Extract address from registered address section
  const addrSection = html.match(/Registered\s*Address[\s\S]*?<\/div>[\s\S]*?<\/div>/i)
  if (addrSection) {
    const addrText = addrSection[0]
      .replace(/<br\s*\/?>/g, ', ')
      .replace(/<[^>]+>/g, '')
      .trim()
    const cleanAddr = addrText.replace(/Registered\s*Address/i, '').trim()
    if (cleanAddr) record.full_address = cleanAddr
  }
}

// ============================================================================
// TRANSFORM → Supabase row
// ============================================================================

function transformToInsert(record: AttorneyRecord, stateId: string): AttorneyInsert | null {
  // Validation: must have name + confirmed status
  if (!record.name || record.name.length < 3) return null

  const { first, last } = parseName(record.name)
  const barStatus = mapStatus(record.authorized, record.full_status)
  const admissionDate = parseAdmissionDate(record.date_admitted)
  const addr = parseAddressComponents(record.full_address || '')

  return {
    name: record.name.trim(),
    slug: makeSlug(record.name, record.guid),
    first_name: first,
    last_name: last,
    email: record.email || null,
    phone: normalizePhone(record.phone),
    bar_number: record.ardc_number || null,
    bar_state: 'IL',
    bar_status: barStatus,
    bar_admission_date: admissionDate,
    law_school: record.law_school || null,
    firm_name: record.firm || null,
    address_line1: addr.line1,
    address_line2: addr.line2,
    address_city: record.city || null,
    address_state: (record.state && record.state.length === 2) ? record.state.toUpperCase() : 'IL',
    address_zip: addr.zip,
    address_county: record.county || null,
    state_id: stateId,
    is_verified: true,
    is_active: barStatus === 'active',
    noindex: barStatus !== 'active',
  }
}

// ============================================================================
// UPSERT BATCH
// ============================================================================

async function upsertBatch(attorneys: AttorneyInsert[]): Promise<number> {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would upsert ${attorneys.length} attorneys`)
    return attorneys.length
  }

  const { error } = await supabase.from('attorneys').upsert(attorneys, {
    onConflict: 'slug',
    ignoreDuplicates: false,
  })

  if (error) {
    console.error(`  [UPSERT ERROR] ${error.message}`)
    stats.totalErrors += attorneys.length
    return 0
  }

  return attorneys.length
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('================================================================')
  console.log(' Illinois ARDC Attorney Scraper — PRODUCTION')
  console.log(` Date: ${new Date().toISOString()}`)
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${LIMIT === Infinity ? 'ALL' : LIMIT}`)
  console.log(`Start letter: ${START_LETTER}`)
  console.log('================================================================\n')

  // 1. Resolve IL state_id
  const { data: ilState, error: stateErr } = await supabase
    .from('states')
    .select('id')
    .eq('abbreviation', 'IL')
    .single()

  if (stateErr || !ilState) {
    console.error('IL state not found in DB. Ensure states table is seeded.')
    process.exit(1)
  }
  console.log(`[INIT] IL state_id: ${ilState.id}`)

  // 2. Get initial session
  console.log('[INIT] Fetching initial session from ARDC...')
  let session = await getSession()
  console.log('[INIT] Session acquired ✓\n')

  // 3. Global dedup
  const globalSeen = new Set<string>()
  const allRecords: AttorneyRecord[] = []
  let detailRequestCount = 0
  const pendingUpsertBatch: AttorneyInsert[] = []

  // Helper: flush pending upsert batch
  async function flushBatch() {
    if (pendingUpsertBatch.length === 0) return
    const batch = pendingUpsertBatch.splice(0, pendingUpsertBatch.length)
    const count = await upsertBatch(batch)
    stats.totalUpserted += count
  }

  // 4. Iterate through letters A-Z
  const startIdx = LETTERS.indexOf(START_LETTER)
  if (startIdx === -1) {
    console.error(`Invalid start letter: ${START_LETTER}`)
    process.exit(1)
  }

  for (let li = startIdx; li < LETTERS.length; li++) {
    const letter = LETTERS[li]

    if (allRecords.length >= LIMIT) {
      console.log(`\n[LIMIT] Reached limit of ${LIMIT}, stopping.`)
      break
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`[LETTER ${letter}] Starting search... (${elapsed()})`)
    console.log(`${'='.repeat(60)}`)

    // Step 2: Search
    let searchResult = await searchByPrefix(letter, session)

    // Handle token expiration
    if (!searchResult) {
      console.log('  [TOKEN] Refreshing session...')
      session = await getSession()
      searchResult = await searchByPrefix(letter, session)
      if (!searchResult) {
        console.error(`  [FAIL] Cannot search for letter "${letter}" even after token refresh`)
        stats.totalErrors++
        continue
      }
    }

    console.log(`  [SEARCH] PageKey: ${searchResult.pageKey.substring(0, 12)}...`)
    if (searchResult.totalResults > 0) {
      console.log(`  [SEARCH] Reported total: ~${searchResult.totalResults}`)
    }

    // Step 3: Paginate grid
    const remaining = LIMIT - allRecords.length
    const gridRecords = await fetchAllGridPages(
      letter,
      searchResult.pageKey,
      searchResult.cookies,
      searchResult.token,
      remaining
    )

    // Dedup against global set
    const newRecords: AttorneyRecord[] = []
    for (const r of gridRecords) {
      if (!globalSeen.has(r.guid)) {
        globalSeen.add(r.guid)
        newRecords.push(r)
      }
    }

    stats.totalDiscovered += newRecords.length
    stats.byLetter[letter] = newRecords.length
    console.log(`  [GRID] Found ${gridRecords.length} records, ${newRecords.length} new (deduped)`)

    // Step 4: Fetch details for each attorney
    let detailCount = 0
    let detailErrors = 0
    let currentCookies = searchResult.cookies
    let currentToken = searchResult.token

    for (let i = 0; i < newRecords.length; i++) {
      if (allRecords.length >= LIMIT) break

      const record = newRecords[i]

      // Token refresh check
      if (detailRequestCount > 0 && detailRequestCount % TOKEN_REFRESH_INTERVAL === 0) {
        console.log(`  [TOKEN] Refreshing session after ${detailRequestCount} detail requests...`)
        try {
          session = await getSession()
          currentCookies = session.cookies
          currentToken = session.token
          // Need to re-search to get valid cookies for this letter
          const refreshedSearch = await searchByPrefix(letter, session)
          if (refreshedSearch) {
            currentCookies = refreshedSearch.cookies
            currentToken = refreshedSearch.token
          }
          console.log('  [TOKEN] Session refreshed ✓')
        } catch (err: any) {
          console.warn(`  [TOKEN] Refresh failed: ${err.message}, continuing with existing session`)
        }
      }

      try {
        const detail = await fetchDetail(record.guid, currentCookies, currentToken)

        if (detail === null) {
          // Token expired mid-detail
          console.log(`  [TOKEN] Expired at record ${i + 1}, refreshing...`)
          session = await getSession()
          currentCookies = session.cookies
          currentToken = session.token
          // Re-search for the letter to get fresh cookies
          const refreshedSearch = await searchByPrefix(letter, session)
          if (refreshedSearch) {
            currentCookies = refreshedSearch.cookies
            currentToken = refreshedSearch.token
          }
          // Retry this record
          const retryDetail = await fetchDetail(record.guid, currentCookies, currentToken)
          if (retryDetail) {
            Object.assign(record, retryDetail)
            detailCount++
          } else {
            detailErrors++
          }
        } else {
          Object.assign(record, detail)
          detailCount++
        }

        detailRequestCount++
        stats.totalDetailsFetched++
      } catch (err: any) {
        console.warn(`  [ERROR] Detail for ${record.guid.substring(0, 8)}: ${err.message}`)
        detailErrors++
        stats.totalErrors++
      }

      // Transform and add to batch
      const insert = transformToInsert(record, ilState.id)
      if (insert) {
        allRecords.push(record)
        pendingUpsertBatch.push(insert)

        // Flush batch when it reaches BATCH_SIZE
        if (pendingUpsertBatch.length >= BATCH_SIZE) {
          await flushBatch()
        }
      } else {
        stats.totalSkipped++
      }

      // Progress log every 500 attorneys
      if (stats.totalDetailsFetched > 0 && stats.totalDetailsFetched % 500 === 0) {
        console.log(
          `  [PROGRESS] ${stats.totalDetailsFetched} details fetched | ` +
            `${stats.totalUpserted} upserted | ${stats.totalErrors} errors | ${elapsed()}`
        )
      }

      await sleep(REQUEST_DELAY_MS)
    }

    console.log(
      `  [DONE] Letter ${letter}: ${detailCount} details OK, ${detailErrors} errors | ` +
        `Running total: ${allRecords.length} attorneys`
    )
  }

  // Flush remaining batch
  await flushBatch()

  // Also insert bar_admissions for attorneys with ARDC numbers
  if (!DRY_RUN) {
    console.log('\n[BAR ADMISSIONS] Inserting bar admissions...')
    const recordsWithArdc = allRecords.filter(r => r.ardc_number)
    let barAdmissionCount = 0

    for (let i = 0; i < recordsWithArdc.length; i += BATCH_SIZE) {
      const batch = recordsWithArdc.slice(i, i + BATCH_SIZE)
      const slugs = batch.map(r => makeSlug(r.name, r.guid))

      const { data: existingAttorneys } = await supabase
        .from('attorneys')
        .select('id, slug, bar_number')
        .in('slug', slugs)

      if (!existingAttorneys?.length) continue

      const barAdmissions = existingAttorneys
        .filter(a => a.bar_number)
        .map(a => ({
          attorney_id: a.id,
          state: 'IL',
          bar_number: a.bar_number,
          status: 'active',
          admission_date: null,
          verified: true,
          source: 'il_ardc',
        }))

      if (barAdmissions.length > 0) {
        const { error } = await supabase.from('bar_admissions').upsert(barAdmissions, {
          onConflict: 'attorney_id,state',
          ignoreDuplicates: true,
        })
        if (!error) barAdmissionCount += barAdmissions.length
      }
    }
    console.log(`  [BAR ADMISSIONS] Inserted ${barAdmissionCount} records`)
  }

  // ============================================================================
  // FINAL REPORT
  // ============================================================================

  console.log('\n================================================================')
  console.log(' FINAL REPORT')
  console.log('================================================================')
  console.log(`Duration:         ${elapsed()}`)
  console.log(`Total discovered: ${stats.totalDiscovered.toLocaleString()}`)
  console.log(`Total details:    ${stats.totalDetailsFetched.toLocaleString()}`)
  console.log(`Total upserted:   ${stats.totalUpserted.toLocaleString()}`)
  console.log(`Total skipped:    ${stats.totalSkipped.toLocaleString()}`)
  console.log(`Total errors:     ${stats.totalErrors.toLocaleString()}`)
  console.log()
  console.log('By letter:')
  for (const [letter, count] of Object.entries(stats.byLetter).sort()) {
    console.log(`  ${letter}: ${count.toLocaleString()}`)
  }

  // Verify count in DB
  if (!DRY_RUN) {
    const { count } = await supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('bar_state', 'IL')

    console.log(`\nTotal IL attorneys in DB: ${count?.toLocaleString() || 'unknown'}`)
  }

  console.log('\n================================================================')
  console.log(' DONE')
  console.log('================================================================')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
