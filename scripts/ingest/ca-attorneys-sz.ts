/**
 * California State Bar Attorney Ingestion — Last Names S through Z
 * Source: CalBar public HTML pages (proven scraping method from test-ca.ts)
 *
 * Strategy:
 *   1. DISCOVERY: Search by 2-letter last name prefixes (SA..ZZ = 208 combos)
 *      Parse search result HTML to extract bar numbers from detail links
 *   2. DETAIL: Fetch individual profile pages, parse HTML for all fields
 *   3. UPSERT: Batch upsert into Supabase `attorneys` + `bar_admissions`
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/ingest/ca-attorneys-sz.ts
 *   # Options: --dry-run, --limit 1000
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

const CALBAR_SEARCH = 'https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch'
const CALBAR_DETAIL = 'https://apps.calbar.ca.gov/attorney/Licensee/Detail'
const BATCH_SIZE = 500
const REQUEST_DELAY_MS = 200
const RETRY_DELAY_MS = 2000
const RATE_LIMIT_WAIT_MS = 30000
const MAX_BACKOFF_MS = 120000

const HEADERS = {
  'Accept': 'text/html',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

// Letters S through Z
const TARGET_LETTERS = 'STUVWXYZ'.split('')
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

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
  console.error('Run: export $(grep -v \'^#\' .env.local | xargs) && npx tsx scripts/ingest/ca-attorneys-sz.ts')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
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

interface Stats {
  totalDiscovered: number
  totalFetched: number
  totalUpserted: number
  totalErrors: number
  totalSkipped: number
  duplicatesFiltered: number
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

function mapStatus(caStatus: string): string {
  const s = (caStatus || '').toLowerCase()
  if (s.includes('active') && !s.includes('inactive') && !s.includes('not active')) return 'active'
  if (s.includes('suspend')) return 'suspended'
  if (s.includes('disbar')) return 'disbarred'
  if (s.includes('deceased')) return 'inactive'
  return 'inactive'
}

function parseDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  // MM/DD/YYYY -> YYYY-MM-DD
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (match) {
    const mm = match[1].padStart(2, '0')
    const dd = match[2].padStart(2, '0')
    return `${match[3]}-${mm}-${dd}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
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
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function isValidName(name: string): boolean {
  if (!name || name.length < 2) return false
  if (/^\d+$/.test(name)) return false
  if (name.toLowerCase() === 'unknown' || name.toLowerCase() === 'n/a') return false
  return true
}

// ============================================================================
// DISCOVERY: Search CalBar for bar numbers by 2-letter prefix
// ============================================================================

async function discoverBarNumbers(prefix: string, stats: Stats): Promise<string[]> {
  const barNumbers: string[] = []
  const url = `${CALBAR_SEARCH}?FreeText=${encodeURIComponent(prefix)}&SortBy=LastName`

  let html: string
  try {
    html = await fetchWithRetry(url, stats)
  } catch (err: any) {
    console.error(`  [DISCOVERY] Failed to fetch search for prefix "${prefix}": ${err.message}`)
    stats.totalErrors++
    return []
  }

  // Extract bar numbers from detail links
  // Pattern: href="/attorney/Licensee/Detail/12345"
  const detailLinks = [...html.matchAll(/href="[^"]*Licensee\/Detail\/(\d+)[^"]*"/gi)]
  for (const match of detailLinks) {
    barNumbers.push(match[1])
  }

  // Check if results were truncated (CalBar caps at 500 results)
  // If we got close to 500 results, log a warning — some attorneys may be missed
  if (barNumbers.length >= 490) {
    console.warn(`  [WARNING] Prefix "${prefix}" returned ${barNumbers.length} results (near 500 cap). Some attorneys may be missed.`)
  }

  return barNumbers
}

// ============================================================================
// DETAIL FETCH: Parse individual attorney profile page
// ============================================================================

async function fetchAndParseProfile(barNumber: string, stats: Stats): Promise<CalBarRecord | null> {
  const url = `${CALBAR_DETAIL}/${barNumber}`

  let html: string
  try {
    html = await fetchWithRetry(url, stats)
  } catch (err: any) {
    stats.totalErrors++
    return null
  }

  // Verify this is a real profile page
  if (!html.includes('moduleMemberDetail') && !html.includes('License Status')) {
    return null
  }

  // === NAME ===
  // Pattern: <h3><b> FirstName MiddleName LastName \n #XXXXX </b></h3>
  const nameMatch = html.match(/<h3>\s*<b>\s*([\s\S]*?)#(\d+)\s*<\/b>\s*<\/h3>/)
  let fullName = ''
  if (nameMatch) {
    fullName = nameMatch[1].replace(/\s+/g, ' ').trim()
  }

  if (!isValidName(fullName)) return null

  // === STATUS ===
  let status = ''
  const statusSection = html.match(/License Status:([\s\S]*?)<!-- End: Name and status -->/i)
  if (statusSection) {
    const section = statusSection[1]
    // Non-Active statuses are in <span> with background-color
    const spanMatch = section.match(/<span\s+style="background-color[^"]*"[^>]*>([\s\S]*?)<\/span>/i)
    if (spanMatch) {
      status = spanMatch[1].replace(/&nbsp;/g, '').replace(/<[^>]*>/g, '').trim()
    } else {
      // Active status is plain text
      const plainMatch = section.match(/\s+([A-Za-z][A-Za-z ]+[A-Za-z])\s/)
      if (plainMatch) {
        status = plainMatch[1].trim()
      }
    }
  }

  // CRITICAL: Must have extractable status
  if (!status) return null

  // === ADDRESS ===
  const addressMatch = html.match(/Address:\s*([\s\S]*?)\s*<\/p>/i)
  let address = '', firmName = '', city = '', addrState = '', zip = ''
  if (addressMatch) {
    address = addressMatch[1]
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const parts = address.split(',').map(p => p.trim())
    if (parts.length >= 3) {
      const lastPart = parts[parts.length - 1].trim()
      const stateZipMatch = lastPart.match(/([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/)
      if (stateZipMatch) {
        addrState = stateZipMatch[1]
        zip = stateZipMatch[2]
        city = parts[parts.length - 2]?.trim() || ''
      }
      if (parts.length >= 4) {
        firmName = parts[0]
      }
    }
  }

  // === PHONE & FAX ===
  const phoneMatch = html.match(/Phone:\s*([0-9()\s.+-]+)/i)
  const phone = phoneMatch ? phoneMatch[1].trim() : ''
  const faxMatch = html.match(/Fax:\s*([0-9()\s.+-]+)/i)
  const fax = faxMatch ? faxMatch[1].trim() : ''

  // === EMAIL (decode HTML entities like &#64; for @) ===
  let email = ''
  const emailSection = html.match(/Email:\s*([\s\S]{0,300})/i)
  if (emailSection) {
    const decoded = decodeHtmlEntities(emailSection[1])
    const emailAddr = decoded.match(/[\w.+-]+@[\w.-]+\.\w{2,}/)
    if (emailAddr) {
      email = emailAddr[0].toLowerCase()
    }
  }

  // === WEBSITE ===
  const websiteMatch = html.match(/var memberWebsite\s*=\s*'([^']+)'/)
  const website = websiteMatch ? websiteMatch[1] : ''

  // === ADMISSION DATE ===
  const admitMatch = html.match(/<td><strong>(\d{1,2}\/\d{1,2}\/\d{4})<\/strong><\/td>\s*<td[^>]*>Admitted to/i)
  const admitDate = admitMatch ? admitMatch[1] : ''

  // === LAW SCHOOL ===
  let lawSchool = ''
  const schoolMatch = html.match(/Law School\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i)
  if (schoolMatch) {
    lawSchool = schoolMatch[1].replace(/<[^>]*>/g, '').trim()
  }

  // Parse first/last name
  const nameParts = fullName.split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts[nameParts.length - 1] || ''

  return {
    barNumber: String(barNumber),
    name: fullName,
    firstName,
    lastName,
    status,
    address,
    firmName,
    city,
    state: addrState,
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
// HTTP FETCH WITH RETRY & RATE LIMIT HANDLING
// ============================================================================

async function fetchWithRetry(url: string, stats: Stats, attempt: number = 0): Promise<string> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30_000)
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal })
    clearTimeout(timeout)

    if (res.status === 403 || res.status === 429) {
      const waitMs = Math.min(RATE_LIMIT_WAIT_MS * Math.pow(2, attempt), MAX_BACKOFF_MS)
      console.warn(`  [RATE LIMIT] ${res.status} on ${url} — waiting ${Math.round(waitMs / 1000)}s (attempt ${attempt + 1})`)
      await sleep(waitMs)
      if (attempt < 3) {
        return fetchWithRetry(url, stats, attempt + 1)
      }
      throw new Error(`Rate limited after ${attempt + 1} attempts`)
    }

    if (res.status !== 200) {
      throw new Error(`HTTP ${res.status}`)
    }

    return await res.text()
  } catch (err: any) {
    if (attempt === 0 && !err.message.includes('Rate limited')) {
      // One retry after 2s delay
      await sleep(RETRY_DELAY_MS)
      return fetchWithRetry(url, stats, 1)
    }
    throw err
  }
}

// ============================================================================
// SUPABASE UPSERT
// ============================================================================

async function upsertBatch(
  records: CalBarRecord[],
  stateId: string,
  stats: Stats
): Promise<void> {
  const attorneys = records.map(r => {
    const firstName = (r.firstName || '').trim()
    const lastName = (r.lastName || '').trim()
    const fullName = r.name.trim()

    return {
      name: fullName,
      slug: makeSlug(fullName, r.barNumber),
      first_name: firstName,
      last_name: lastName,
      email: r.email || null,
      phone: normalizePhone(r.phone),
      website: r.website || null,
      bar_number: r.barNumber,
      bar_state: 'CA' as const,
      bar_status: mapStatus(r.status),
      bar_admission_date: parseDate(r.admitDate),
      law_school: r.lawSchool || null,
      firm_name: r.firmName || null,
      address_line1: r.address || null,
      address_city: r.city || null,
      address_state: r.state || null,
      address_zip: r.zip?.substring(0, 5) || null,
      state_id: stateId,
      is_verified: true,
      is_active: mapStatus(r.status) === 'active',
      noindex: mapStatus(r.status) !== 'active',
    }
  })

  const { error } = await supabase
    .from('attorneys')
    .upsert(attorneys, { onConflict: 'slug', ignoreDuplicates: false })

  if (error) {
    console.error(`  [UPSERT ERROR] Batch of ${records.length}: ${error.message}`)
    stats.totalErrors += records.length
  } else {
    stats.totalUpserted += records.length
  }
}

async function upsertBarAdmissions(
  records: CalBarRecord[],
  stats: Stats
): Promise<void> {
  // Look up attorney IDs by slug
  const slugs = records.map(r => makeSlug(r.name.trim(), r.barNumber))

  // Supabase .in() has a limit, chunk if needed
  const chunkSize = 200
  for (let i = 0; i < slugs.length; i += chunkSize) {
    const slugChunk = slugs.slice(i, i + chunkSize)
    const recordChunk = records.slice(i, i + chunkSize)

    const { data: existingAttorneys } = await supabase
      .from('attorneys')
      .select('id, slug, bar_number, bar_status')
      .in('slug', slugChunk)

    if (!existingAttorneys?.length) continue

    const slugToRecord = new Map<string, CalBarRecord>()
    for (const r of recordChunk) {
      slugToRecord.set(makeSlug(r.name.trim(), r.barNumber), r)
    }

    const barAdmissions = existingAttorneys.map(a => ({
      attorney_id: a.id,
      state: 'CA' as const,
      bar_number: a.bar_number || '',
      status: a.bar_status || 'active',
      admission_date: null as string | null,
      verified: false,
      source: 'calbar_scrape',
    }))

    const { error } = await supabase
      .from('bar_admissions')
      .upsert(barAdmissions, { onConflict: 'attorney_id,state', ignoreDuplicates: true })

    if (error) {
      // Non-fatal: log and continue
      console.error(`  [BAR ADMISSIONS ERROR] ${error.message}`)
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const startTime = Date.now()

  console.log('================================================================')
  console.log('  California State Bar — Attorney Ingestion (S through Z)')
  console.log('  Source: CalBar HTML profile pages (proven method)')
  console.log('================================================================')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${LIMIT === Infinity ? 'ALL' : LIMIT}`)
  console.log(`Target prefixes: ${TARGET_LETTERS.join(', ')} (${TARGET_LETTERS.length * 26} two-letter combos)`)
  console.log()

  // 1. Resolve CA state_id
  const { data: caState, error: stateErr } = await supabase
    .from('states')
    .select('id')
    .eq('abbreviation', 'CA')
    .single()

  if (stateErr || !caState) {
    console.error('CA state not found in DB. Ensure states are seeded (migration 400+).')
    process.exit(1)
  }
  console.log(`CA state_id: ${caState.id}`)

  const stats: Stats = {
    totalDiscovered: 0,
    totalFetched: 0,
    totalUpserted: 0,
    totalErrors: 0,
    totalSkipped: 0,
    duplicatesFiltered: 0,
  }

  // 2. Generate all 2-letter prefixes for S-Z
  const prefixes: string[] = []
  for (const letter of TARGET_LETTERS) {
    for (const second of ALPHABET) {
      prefixes.push(`${letter}${second}`)
    }
  }
  console.log(`Total prefixes to search: ${prefixes.length}`)

  // ========================================================================
  // PHASE 1: DISCOVERY — collect all unique bar numbers
  // ========================================================================
  console.log('\n--- PHASE 1: DISCOVERY ---')
  const allBarNumbers = new Set<string>()
  let prefixCount = 0

  for (const prefix of prefixes) {
    if (allBarNumbers.size >= LIMIT) break

    const barNumbers = await discoverBarNumbers(prefix, stats)
    const newCount = barNumbers.filter(bn => !allBarNumbers.has(bn)).length

    for (const bn of barNumbers) {
      allBarNumbers.add(bn)
    }

    stats.totalDiscovered = allBarNumbers.size
    prefixCount++

    // Log every 26 prefixes (one full letter)
    if (prefixCount % 26 === 0) {
      const letter = prefix[0]
      console.log(`  ${letter}*: ${allBarNumbers.size.toLocaleString()} unique bar numbers discovered (${prefixCount}/${prefixes.length} prefixes)`)
    }

    await sleep(REQUEST_DELAY_MS)
  }

  // Filter deduplicates
  stats.duplicatesFiltered = stats.totalDiscovered - allBarNumbers.size + stats.duplicatesFiltered

  console.log(`\nDiscovery complete: ${allBarNumbers.size.toLocaleString()} unique bar numbers found`)

  if (allBarNumbers.size === 0) {
    console.error('No bar numbers discovered. CalBar may be blocking requests.')
    process.exit(1)
  }

  // ========================================================================
  // PHASE 2: DETAIL FETCH — scrape each attorney profile
  // ========================================================================
  console.log('\n--- PHASE 2: DETAIL FETCH ---')
  const barNumberArray = [...allBarNumbers].slice(0, LIMIT)
  const validRecords: CalBarRecord[] = []
  let fetchCount = 0

  for (const barNumber of barNumberArray) {
    try {
      const record = await fetchAndParseProfile(barNumber, stats)
      fetchCount++

      if (record && record.name && record.status && record.barNumber) {
        validRecords.push(record)
        stats.totalFetched++
      } else {
        stats.totalSkipped++
      }
    } catch (err: any) {
      stats.totalErrors++
      // Non-fatal: skip this record
    }

    // Progress every 1000
    if (fetchCount % 1000 === 0) {
      const matchRate = fetchCount > 0 ? Math.round((validRecords.length / fetchCount) * 100) : 0
      const elapsed = Math.round((Date.now() - startTime) / 1000)
      console.log(
        `  [${fetchCount.toLocaleString()}/${barNumberArray.length.toLocaleString()}] ` +
        `Valid: ${validRecords.length.toLocaleString()} (${matchRate}% match rate) | ` +
        `Errors: ${stats.totalErrors} | Elapsed: ${elapsed}s`
      )
    }

    await sleep(REQUEST_DELAY_MS)
  }

  console.log(`\nDetail fetch complete: ${validRecords.length.toLocaleString()} valid records from ${fetchCount.toLocaleString()} fetched`)

  // ========================================================================
  // DRY RUN: show sample and exit
  // ========================================================================
  if (DRY_RUN) {
    console.log('\n--- DRY RUN: First 5 records ---')
    validRecords.slice(0, 5).forEach((r, i) => {
      console.log(`\n  [${i + 1}] ${r.name} (Bar #${r.barNumber})`)
      console.log(`      Status:    ${r.status}`)
      console.log(`      City:      ${r.city || 'N/A'}, ${r.state || 'N/A'} ${r.zip || 'N/A'}`)
      console.log(`      Phone:     ${r.phone || 'N/A'}`)
      console.log(`      Email:     ${r.email || 'N/A'}`)
      console.log(`      Firm:      ${r.firmName || 'N/A'}`)
      console.log(`      Admitted:  ${r.admitDate || 'N/A'}`)
      console.log(`      School:    ${r.lawSchool || 'N/A'}`)
      console.log(`      Slug:      ${makeSlug(r.name.trim(), r.barNumber)}`)
    })

    // Status distribution
    const statusCounts: Record<string, number> = {}
    validRecords.forEach(r => {
      const s = r.status || 'UNKNOWN'
      statusCounts[s] = (statusCounts[s] || 0) + 1
    })
    console.log('\nStatus distribution:')
    Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([s, c]) => console.log(`  ${s}: ${c.toLocaleString()}`))

    console.log('\nDry run complete. No data written.')
    return
  }

  // ========================================================================
  // PHASE 3: SUPABASE UPSERT
  // ========================================================================
  console.log('\n--- PHASE 3: SUPABASE UPSERT ---')
  console.log(`Upserting ${validRecords.length.toLocaleString()} attorneys in batches of ${BATCH_SIZE}...`)

  for (let i = 0; i < validRecords.length; i += BATCH_SIZE) {
    const batch = validRecords.slice(i, i + BATCH_SIZE)
    await upsertBatch(batch, caState.id, stats)

    // Progress every 5 batches
    if (Math.floor(i / BATCH_SIZE) % 5 === 0 || i + BATCH_SIZE >= validRecords.length) {
      const pct = Math.min(100, Math.round(((i + batch.length) / validRecords.length) * 100))
      console.log(`  ${pct}% — ${stats.totalUpserted.toLocaleString()} upserted, ${stats.totalErrors} errors`)
    }
  }

  // ========================================================================
  // PHASE 4: BAR ADMISSIONS
  // ========================================================================
  console.log('\n--- PHASE 4: BAR ADMISSIONS ---')
  for (let i = 0; i < validRecords.length; i += BATCH_SIZE) {
    const batch = validRecords.slice(i, i + BATCH_SIZE)
    await upsertBarAdmissions(batch, stats)
  }
  console.log('  Bar admissions upsert complete.')

  // ========================================================================
  // FINAL REPORT
  // ========================================================================
  const elapsed = Math.round((Date.now() - startTime) / 1000)
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  console.log('\n================================================================')
  console.log('  FINAL REPORT — CA Attorneys (S-Z)')
  console.log('================================================================')
  console.log(`  Discovered (unique bar #s):  ${stats.totalDiscovered.toLocaleString()}`)
  console.log(`  Fetched (valid profiles):    ${stats.totalFetched.toLocaleString()}`)
  console.log(`  Upserted to Supabase:        ${stats.totalUpserted.toLocaleString()}`)
  console.log(`  Skipped (invalid/missing):   ${stats.totalSkipped.toLocaleString()}`)
  console.log(`  Errors:                      ${stats.totalErrors.toLocaleString()}`)
  console.log(`  Duration:                    ${minutes}m ${seconds}s`)

  // Verify DB count
  const { count } = await supabase
    .from('attorneys')
    .select('*', { count: 'exact', head: true })
    .eq('bar_state', 'CA')

  console.log(`\n  Total CA attorneys in DB:     ${count?.toLocaleString() || 'unknown'}`)
  console.log('================================================================')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
