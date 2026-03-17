/**
 * California Bar Attorney Ingestion — Last Names A–F
 * Source: California State Bar (CalBar) website
 * Strategy: 2-letter prefix search (AA–FZ = 156 combos) → detail page scrape → Supabase upsert
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/ingest/ca-attorneys-af.ts
 *
 * Options:
 *   --dry-run    Preview without writing to DB
 *   --limit N    Cap total attorneys processed
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

const BATCH_SIZE = 500
const REQUEST_DELAY_MS = 200
const RETRY_DELAY_MS = 2000
const RATE_LIMIT_WAIT_MS = 30_000
const MAX_RATE_LIMIT_RETRIES = 5

const LETTERS_START = 'A'
const LETTERS_END = 'F'
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const LIMIT = (() => {
  const idx = args.indexOf('--limit')
  return idx !== -1 ? parseInt(args[idx + 1], 10) : Infinity
})()

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('Run: export $(grep -v \'^#\' .env.local | xargs) && npx tsx scripts/ingest/ca-attorneys-af.ts')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ============================================================================
// TYPES
// ============================================================================

interface CalBarRecord {
  barNumber: string
  name: string
  firstName: string
  lastName: string
  status: string
  address: string
  firmName: string
  city: string
  state: string
  zip: string
  phone: string
  fax: string
  email: string
  website: string
  admitDate: string
  lawSchool: string
}

interface AttorneyInsert {
  name: string
  slug: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  bar_number: string
  bar_state: string
  bar_status: string
  bar_admission_date: string | null
  law_school: string | null
  firm_name: string | null
  address_line1: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  is_verified: boolean
  is_active: boolean
  noindex: boolean
  state_id: string
}

// ============================================================================
// STATS
// ============================================================================

const stats = {
  totalDiscovered: 0,
  totalFetched: 0,
  totalUpserted: 0,
  totalErrors: 0,
  totalSkipped: 0,
  prefixesSearched: 0,
  paginatedPrefixes: 0,
}

// ============================================================================
// HELPERS
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function makeSlug(name: string, barNumber: string): string {
  const base = slugify(name)
  return `${base}-ca-${barNumber}`
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#64;/g, '@')
    .replace(/&#46;/g, '.')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function mapCalBarStatus(status: string): string {
  const s = status.toLowerCase().trim()
  if (s === 'active') return 'active'
  if (s.includes('inactive') || s.includes('voluntary')) return 'inactive'
  if (s.includes('suspended')) return 'suspended'
  if (s.includes('disbar')) return 'disbarred'
  if (s.includes('resigned')) return 'inactive'
  if (s.includes('deceased')) return 'inactive'
  if (s.includes('retired')) return 'inactive'
  return 'inactive'
}

function parseAdmitDate(dateStr: string): string | null {
  if (!dateStr) return null
  // Format: MM/DD/YYYY -> YYYY-MM-DD
  const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const month = m[1].padStart(2, '0')
  const day = m[2].padStart(2, '0')
  return `${m[3]}-${month}-${day}`
}

function isValidName(name: string): boolean {
  if (!name || name.length < 2) return false
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(name)) return false
  // Reject if it looks like garbage data
  if (/^[#\d\s]+$/.test(name)) return false
  return true
}

/** Generate all 2-letter prefixes for letters A through endLetter */
function generatePrefixes(startLetter: string, endLetter: string): string[] {
  const prefixes: string[] = []
  const startIdx = ALPHABET.indexOf(startLetter.toUpperCase())
  const endIdx = ALPHABET.indexOf(endLetter.toUpperCase())
  for (let i = startIdx; i <= endIdx; i++) {
    for (let j = 0; j < 26; j++) {
      prefixes.push(ALPHABET[i] + ALPHABET[j])
    }
  }
  return prefixes
}

// ============================================================================
// FETCH WITH RETRY + RATE LIMIT HANDLING
// ============================================================================

async function fetchWithRetry(
  url: string,
  retries: number = 1,
  rateLimitRetries: number = 0
): Promise<Response | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30_000)
    const res = await fetch(url, {
      headers: {
        Accept: 'text/html',
        'User-Agent': USER_AGENT,
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (res.status === 403 || res.status === 429) {
      if (rateLimitRetries >= MAX_RATE_LIMIT_RETRIES) {
        console.error(`  [RATE LIMIT] Max retries exceeded for ${url}`)
        return null
      }
      const waitMs = RATE_LIMIT_WAIT_MS * Math.pow(2, rateLimitRetries)
      console.warn(`  [RATE LIMIT] ${res.status} — waiting ${waitMs / 1000}s before retry...`)
      await sleep(waitMs)
      return fetchWithRetry(url, retries, rateLimitRetries + 1)
    }

    if (res.status !== 200) {
      if (retries > 0) {
        await sleep(RETRY_DELAY_MS)
        return fetchWithRetry(url, retries - 1, rateLimitRetries)
      }
      return null
    }

    return res
  } catch (err: any) {
    if (retries > 0) {
      await sleep(RETRY_DELAY_MS)
      return fetchWithRetry(url, retries - 1, rateLimitRetries)
    }
    return null
  }
}

// ============================================================================
// STEP 1: DISCOVERY — Search by 2-letter prefix, extract bar numbers
// ============================================================================

async function discoverBarNumbers(prefix: string): Promise<string[]> {
  const barNumbers: string[] = []
  let pageUrl = `https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch?FreeText=${prefix}&SortBy=LastName`

  // Paginate through all results
  let pageNum = 0
  while (pageUrl) {
    const res = await fetchWithRetry(pageUrl)
    if (!res) break

    const html = await res.text()

    // Extract bar numbers from detail links
    const links = [...html.matchAll(/href="[^"]*Licensee\/Detail\/(\d+)[^"]*"/gi)]
    for (const match of links) {
      barNumbers.push(match[1])
    }

    // Check for pagination — look for "Next" link
    const nextMatch = html.match(/href="([^"]*)"[^>]*>\s*Next\s*</i)
    if (nextMatch && pageNum < 20) {
      // Safety cap: max 20 pages per prefix
      let nextUrl = nextMatch[1]
      if (nextUrl.startsWith('/')) {
        nextUrl = `https://apps.calbar.ca.gov${nextUrl}`
      }
      // Decode HTML entities in URL
      nextUrl = nextUrl.replace(/&amp;/g, '&')
      pageUrl = nextUrl
      pageNum++
      await sleep(REQUEST_DELAY_MS)
    } else {
      pageUrl = ''
    }
  }

  // Deduplicate
  return [...new Set(barNumbers)]
}

// ============================================================================
// STEP 2: DETAIL FETCH — Parse individual attorney profile
// ============================================================================

async function fetchAndParseProfile(barNum: string): Promise<CalBarRecord | null> {
  const url = `https://apps.calbar.ca.gov/attorney/Licensee/Detail/${barNum}`
  const res = await fetchWithRetry(url)
  if (!res) return null

  const html = await res.text()

  // Verify this is a real profile page
  if (!html.includes('moduleMemberDetail') && !html.includes('License Status')) return null

  // === NAME ===
  const nameMatch = html.match(/<h3>\s*<b>\s*([\s\S]*?)#(\d+)\s*<\/b>\s*<\/h3>/)
  let fullName = ''
  if (nameMatch) {
    fullName = nameMatch[1].replace(/\s+/g, ' ').trim()
  }

  // === STATUS ===
  let status = ''
  const statusSection = html.match(/License Status:([\s\S]*?)<!-- End: Name and status -->/i)
  if (statusSection) {
    const section = statusSection[1]
    const spanMatch = section.match(/<span\s+style="background-color[^"]*"[^>]*>([\s\S]*?)<\/span>/i)
    if (spanMatch) {
      status = spanMatch[1].replace(/&nbsp;/g, '').replace(/<[^>]*>/g, '').trim()
    } else {
      const plainMatch = section.match(/\s+([A-Za-z][A-Za-z ]+[A-Za-z])\s/)
      if (plainMatch) {
        status = plainMatch[1].trim()
      }
    }
  }

  // === ADDRESS ===
  const addressMatch = html.match(/Address:\s*([\s\S]*?)\s*<\/p>/i)
  let address = ''
  let firmName = ''
  let city = ''
  let state = ''
  let zip = ''
  if (addressMatch) {
    address = addressMatch[1]
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const parts = address.split(',').map((p) => p.trim())
    if (parts.length >= 3) {
      const lastPart = parts[parts.length - 1].trim()
      const stateZipMatch = lastPart.match(/([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/)
      if (stateZipMatch) {
        state = stateZipMatch[1]
        zip = stateZipMatch[2]
        city = parts[parts.length - 2]?.trim() || ''
      }
      if (parts.length >= 4) {
        firmName = parts[0]
      }
    }
  }

  // === PHONE ===
  const phoneMatch = html.match(/Phone:\s*([0-9()\s.-]+)/i)
  const phone = phoneMatch ? phoneMatch[1].trim() : ''

  // === FAX ===
  const faxMatch = html.match(/Fax:\s*([0-9()\s.-]+)/i)
  const fax = faxMatch ? faxMatch[1].trim() : ''

  // === EMAIL (CalBar uses CSS-based obfuscation) ===
  // 20 <span id="e0">...<span id="e19"> are generated, only ONE has display:inline in CSS
  // CSS block: #e0{display:none;}#e2{display:inline;}#e3{display:none;}...
  let email = ''
  const cssMatch = html.match(/#e(\d+)\{display:\s*inline;?\}/)
  if (cssMatch) {
    const realId = cssMatch[1]
    // Extract the content of the visible span
    const spanPattern = new RegExp(
      `<span\\s+id="e${realId}"[^>]*>([\\s\\S]*?)<\\/span>`,
      'i'
    )
    const spanMatch = html.match(spanPattern)
    if (spanMatch) {
      // The span content has nested <span>&#46;</span> for dots and &#64; for @
      const rawEmail = spanMatch[1]
        .replace(/<span>&#46;<\/span>/g, '.')
        .replace(/<span>\.<\/span>/g, '.')
        .replace(/<[^>]*>/g, '')
      const decoded = decodeHtmlEntities(rawEmail)
      const emailAddr = decoded.match(/[\w.-]+@[\w.-]+\.\w{2,}/)
      if (emailAddr) {
        email = emailAddr[0].toLowerCase()
      }
    }
  }

  // === WEBSITE ===
  const websiteMatch = html.match(/var memberWebsite\s*=\s*'([^']+)'/)
  const website = websiteMatch ? websiteMatch[1] : ''

  // === ADMISSION DATE ===
  const admitMatch = html.match(
    /<td><strong>(\d{1,2}\/\d{1,2}\/\d{4})<\/strong><\/td>\s*<td[^>]*>Admitted to/i
  )
  const admitDate = admitMatch ? admitMatch[1] : ''

  // === LAW SCHOOL ===
  let lawSchool = ''
  const lawSchoolMatch = html.match(
    /Law School<\/strong><\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i
  )
  if (lawSchoolMatch) {
    lawSchool = lawSchoolMatch[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  }
  // Alternate pattern
  if (!lawSchool) {
    const altMatch = html.match(/Law School:\s*([\s\S]*?)(?:<\/|<br|<p)/i)
    if (altMatch) {
      lawSchool = altMatch[1].replace(/<[^>]*>/g, '').trim()
    }
  }

  // === PARSE FIRST/LAST NAME ===
  const nameParts = fullName.split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts[nameParts.length - 1] || ''

  // VALIDATION: Must have name + status
  if (!fullName || !status) return null
  if (!isValidName(fullName)) return null

  return {
    barNumber: barNum,
    name: fullName,
    firstName,
    lastName,
    status,
    address,
    firmName,
    city,
    state,
    zip,
    phone,
    fax,
    email,
    website,
    admitDate,
    lawSchool,
  }
}

// ============================================================================
// STEP 3: TRANSFORM & UPSERT
// ============================================================================

function transformRecord(record: CalBarRecord, stateId: string): AttorneyInsert {
  const mappedStatus = mapCalBarStatus(record.status)
  return {
    name: record.name,
    slug: makeSlug(record.name, record.barNumber),
    first_name: record.firstName,
    last_name: record.lastName,
    email: record.email || null,
    phone: normalizePhone(record.phone),
    bar_number: record.barNumber,
    bar_state: 'CA',
    bar_status: mappedStatus,
    bar_admission_date: parseAdmitDate(record.admitDate),
    law_school: record.lawSchool || null,
    firm_name: record.firmName || null,
    address_line1: null, // CalBar doesn't give street-level; only city/state/zip
    address_city: record.city || null,
    address_state: record.state || null,
    address_zip: record.zip ? record.zip.substring(0, 5) : null,
    is_verified: false, // Scraped data, not officially verified
    is_active: mappedStatus === 'active',
    noindex: mappedStatus !== 'active',
    state_id: stateId,
  }
}

async function upsertBatch(attorneys: AttorneyInsert[]): Promise<number> {
  const { error, data } = await supabase
    .from('attorneys')
    .upsert(attorneys, {
      onConflict: 'slug',
      ignoreDuplicates: false,
    })

  if (error) {
    console.error(`  [UPSERT ERROR] ${error.message}`)
    // Try one-by-one to salvage what we can
    let saved = 0
    for (const attorney of attorneys) {
      const { error: singleErr } = await supabase
        .from('attorneys')
        .upsert([attorney], { onConflict: 'slug', ignoreDuplicates: false })
      if (!singleErr) {
        saved++
      } else {
        stats.totalErrors++
      }
    }
    return saved
  }

  return attorneys.length
}

async function upsertBarAdmissions(slugs: string[]): Promise<void> {
  // Look up attorney IDs by slug
  const { data: existingAttorneys } = await supabase
    .from('attorneys')
    .select('id, slug, bar_number, bar_status')
    .in('slug', slugs)

  if (!existingAttorneys?.length) return

  const barAdmissions = existingAttorneys.map((a) => ({
    attorney_id: a.id,
    state: 'CA',
    bar_number: a.bar_number,
    status: a.bar_status || 'active',
    verified: false,
    source: 'calbar_scrape',
  }))

  const { error } = await supabase
    .from('bar_admissions')
    .upsert(barAdmissions, {
      onConflict: 'attorney_id,state',
      ignoreDuplicates: false,
    })

  if (error) {
    console.error(`  [BAR ADMISSIONS ERROR] ${error.message}`)
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('================================================================')
  console.log('  CalBar Attorney Ingestion — Last Names A through F')
  console.log('================================================================')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${LIMIT === Infinity ? 'ALL' : LIMIT}`)
  console.log(`Prefixes: ${LETTERS_START}A — ${LETTERS_END}Z (156 combos)`)
  console.log()

  // 1. Resolve CA state_id
  const { data: caState, error: stateErr } = await supabase
    .from('states')
    .select('id')
    .eq('abbreviation', 'CA')
    .single()

  if (stateErr || !caState) {
    console.error('CA state not found in DB. Ensure states table is populated.')
    process.exit(1)
  }
  console.log(`CA state_id: ${caState.id}`)

  // 2. Generate all 2-letter prefixes A*–F*
  const prefixes = generatePrefixes(LETTERS_START, LETTERS_END)
  console.log(`Generated ${prefixes.length} search prefixes\n`)

  // 3. DISCOVERY PHASE: Collect all bar numbers
  console.log('--- PHASE 1: DISCOVERY ---')
  const allBarNumbers = new Set<string>()
  let prefixIdx = 0

  for (const prefix of prefixes) {
    prefixIdx++
    try {
      const barNumbers = await discoverBarNumbers(prefix)

      for (const bn of barNumbers) {
        allBarNumbers.add(bn)
      }

      if (barNumbers.length > 0) {
        if (barNumbers.length >= 500) {
          stats.paginatedPrefixes++
          console.log(
            `  [${prefixIdx}/${prefixes.length}] ${prefix}: ${barNumbers.length} attorneys (PAGINATED) — total: ${allBarNumbers.size}`
          )
        } else if (prefixIdx % 10 === 0 || prefixIdx <= 5) {
          console.log(
            `  [${prefixIdx}/${prefixes.length}] ${prefix}: ${barNumbers.length} attorneys — total: ${allBarNumbers.size}`
          )
        }
      }

      stats.prefixesSearched++
    } catch (err: any) {
      console.error(`  [ERROR] Prefix ${prefix}: ${err.message}`)
      stats.totalErrors++
    }

    await sleep(REQUEST_DELAY_MS)

    // Check limit on discovered
    if (allBarNumbers.size >= LIMIT) break
  }

  stats.totalDiscovered = allBarNumbers.size
  console.log(`\nDiscovery complete: ${stats.totalDiscovered.toLocaleString()} unique bar numbers found`)
  console.log(`Paginated prefixes: ${stats.paginatedPrefixes}`)

  if (stats.totalDiscovered === 0) {
    console.error('No attorneys discovered. Exiting.')
    process.exit(1)
  }

  // 4. DETAIL FETCH PHASE: Scrape each profile
  console.log('\n--- PHASE 2: DETAIL FETCH ---')
  const barNumberList = [...allBarNumbers].slice(0, LIMIT)
  const validRecords: CalBarRecord[] = []
  let fetchCount = 0

  for (const barNum of barNumberList) {
    fetchCount++
    try {
      const record = await fetchAndParseProfile(barNum)
      if (record) {
        validRecords.push(record)
        stats.totalFetched++
      } else {
        stats.totalSkipped++
      }
    } catch (err: any) {
      stats.totalErrors++
    }

    // Progress logging every 1000
    if (fetchCount % 1000 === 0) {
      const matchRate = ((stats.totalFetched / fetchCount) * 100).toFixed(1)
      console.log(
        `  [${fetchCount.toLocaleString()}/${barNumberList.length.toLocaleString()}] ` +
          `Fetched: ${stats.totalFetched.toLocaleString()} | ` +
          `Skipped: ${stats.totalSkipped} | ` +
          `Errors: ${stats.totalErrors} | ` +
          `Match rate: ${matchRate}%`
      )
    }

    await sleep(REQUEST_DELAY_MS)
  }

  console.log(
    `\nDetail fetch complete: ${stats.totalFetched.toLocaleString()} valid records from ${fetchCount.toLocaleString()} attempts`
  )

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: showing first 5 transformed records ---')
    validRecords.slice(0, 5).forEach((r, i) => {
      const transformed = transformRecord(r, caState.id)
      console.log(`\n[${i + 1}]`, JSON.stringify(transformed, null, 2))
    })
    console.log('\nDry run complete. No data written.')
    printFinalReport()
    return
  }

  // 5. UPSERT PHASE: Batch insert into Supabase
  console.log('\n--- PHASE 3: SUPABASE UPSERT ---')
  console.log(`Upserting ${validRecords.length.toLocaleString()} attorneys in batches of ${BATCH_SIZE}...`)

  for (let i = 0; i < validRecords.length; i += BATCH_SIZE) {
    const batch = validRecords.slice(i, i + BATCH_SIZE)
    const attorneys = batch.map((r) => transformRecord(r, caState.id))

    const upserted = await upsertBatch(attorneys)
    stats.totalUpserted += upserted

    // Also upsert bar_admissions
    const slugs = attorneys.map((a) => a.slug)
    await upsertBarAdmissions(slugs)

    // Progress
    const pct = Math.min(100, Math.round(((i + batch.length) / validRecords.length) * 100))
    if (pct % 10 === 0 || i + BATCH_SIZE >= validRecords.length) {
      console.log(
        `  ${pct}% — ${stats.totalUpserted.toLocaleString()} upserted, ${stats.totalErrors} errors`
      )
    }
  }

  // 6. Verify count
  const { count } = await supabase
    .from('attorneys')
    .select('*', { count: 'exact', head: true })
    .eq('bar_state', 'CA')

  console.log(`\nTotal CA attorneys now in DB: ${count?.toLocaleString() || 'unknown'}`)

  printFinalReport()
}

function printFinalReport() {
  console.log('\n================================================================')
  console.log('  FINAL REPORT')
  console.log('================================================================')
  console.log(`Prefixes searched:  ${stats.prefixesSearched} / 156`)
  console.log(`Paginated prefixes: ${stats.paginatedPrefixes}`)
  console.log(`Total discovered:   ${stats.totalDiscovered.toLocaleString()}`)
  console.log(`Total fetched:      ${stats.totalFetched.toLocaleString()}`)
  console.log(`Total upserted:     ${stats.totalUpserted.toLocaleString()}`)
  console.log(`Total skipped:      ${stats.totalSkipped.toLocaleString()}`)
  console.log(`Total errors:       ${stats.totalErrors}`)

  if (stats.totalDiscovered > 0) {
    const fetchRate = ((stats.totalFetched / stats.totalDiscovered) * 100).toFixed(1)
    console.log(`Fetch success rate: ${fetchRate}%`)
  }
  if (stats.totalFetched > 0) {
    const upsertRate = ((stats.totalUpserted / stats.totalFetched) * 100).toFixed(1)
    console.log(`Upsert success rate: ${upsertRate}%`)
  }

  console.log('================================================================')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  printFinalReport()
  process.exit(1)
})
