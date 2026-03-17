/**
 * California Bar Attorney Ingestion — Last Names M through R
 * Source: California State Bar (apps.calbar.ca.gov)
 * Strategy: 2-letter prefix search (MA..RZ = 156 combos) -> individual profile fetch -> Supabase upsert
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/ingest/ca-attorneys-mr.ts
 *   Options: --dry-run, --limit 500, --start-prefix MA
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

const BATCH_SIZE = 500
const DETAIL_DELAY_MS = 200
const RATE_LIMIT_WAIT_MS = 30_000
const MAX_RETRIES = 3
const SEARCH_URL_BASE = 'https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch'
const DETAIL_URL_BASE = 'https://apps.calbar.ca.gov/attorney/Licensee/Detail'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const LIMIT = (() => {
  const idx = args.indexOf('--limit')
  return idx !== -1 ? parseInt(args[idx + 1], 10) : Infinity
})()
const START_PREFIX = (() => {
  const idx = args.indexOf('--start-prefix')
  return idx !== -1 ? args[idx + 1].toUpperCase() : null
})()

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('Run: export $(grep -v "^#" .env.local | xargs) && npx tsx scripts/ingest/ca-attorneys-mr.ts')
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
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  is_verified: boolean
  is_active: boolean
  noindex: boolean
  state_id: string
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

function mapCalBarStatus(status: string): string {
  const s = status.toLowerCase().trim()
  if (s === 'active') return 'active'
  if (s.includes('inactive')) return 'inactive'
  if (s.includes('suspended')) return 'suspended'
  if (s.includes('disbarred')) return 'disbarred'
  if (s.includes('resigned')) return 'inactive'
  if (s.includes('deceased')) return 'inactive'
  if (s.includes('retired')) return 'inactive'
  return 'inactive'
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#64;/g, '@')
    .replace(/&#46;/g, '.')
    .replace(/&#45;/g, '-')
    .replace(/&#95;/g, '_')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_match, dec) => String.fromCharCode(parseInt(dec, 10)))
}

function parseAdmitDate(dateStr: string): string | null {
  if (!dateStr) return null
  // Format: MM/DD/YYYY -> YYYY-MM-DD
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null
  const [, month, day, year] = match
  const m = month.padStart(2, '0')
  const d = day.padStart(2, '0')
  // Basic validation
  const numY = parseInt(year, 10)
  const numM = parseInt(m, 10)
  const numD = parseInt(d, 10)
  if (numY < 1900 || numY > 2026 || numM < 1 || numM > 12 || numD < 1 || numD > 31) return null
  return `${year}-${m}-${d}`
}

function isValidName(name: string): boolean {
  if (!name || name.length < 2) return false
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(name)) return false
  // Reject if it's clearly not a name
  if (/^\d+$/.test(name)) return false
  return true
}

// ============================================================================
// GENERATE ALL 2-LETTER PREFIXES FOR M..R
// ============================================================================

function generatePrefixes(): string[] {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const startLetters = ['M', 'N', 'O', 'P', 'Q', 'R']
  const prefixes: string[] = []

  for (const first of startLetters) {
    for (const second of letters) {
      prefixes.push(first + second)
    }
  }

  return prefixes // 6 * 26 = 156 combos
}

// ============================================================================
// FETCH WITH RETRY + RATE LIMIT HANDLING
// ============================================================================

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
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

      if (res.status === 200) return res

      if (res.status === 403 || res.status === 429) {
        const backoff = RATE_LIMIT_WAIT_MS * Math.pow(2, attempt)
        console.warn(`  [RATE LIMIT] ${res.status} on ${url} — waiting ${backoff / 1000}s (attempt ${attempt + 1}/${retries + 1})`)
        await sleep(backoff)
        continue
      }

      // Other error status
      if (attempt < retries) {
        await sleep(2000)
        continue
      }

      return null
    } catch (err: any) {
      if (attempt < retries) {
        console.warn(`  [NETWORK] ${err.message} — retry in 2s (attempt ${attempt + 1}/${retries + 1})`)
        await sleep(2000)
        continue
      }
      return null
    }
  }
  return null
}

// ============================================================================
// STEP 1: DISCOVERY — Search by prefix, extract bar numbers
// ============================================================================

async function discoverBarNumbers(prefix: string): Promise<string[]> {
  const url = `${SEARCH_URL_BASE}?FreeText=${prefix}&SortBy=LastName`
  const res = await fetchWithRetry(url)
  if (!res) return []

  const html = await res.text()

  // Extract bar numbers from detail links
  const detailLinks = [...html.matchAll(/href="[^"]*Licensee\/Detail\/(\d+)[^"]*"/gi)]
  const barNumbers = detailLinks.map((m) => m[1])

  // Deduplicate
  const unique = [...new Set(barNumbers)]

  // Check for pagination: if we got exactly 500 results, there might be more
  // CalBar caps at 500 results per search
  if (unique.length >= 500) {
    console.warn(`  [PAGINATION] Prefix "${prefix}" returned 500+ results — may be truncated. Consider 3-letter prefixes.`)
  }

  return unique
}

// ============================================================================
// STEP 2: DETAIL FETCH — Parse individual profile
// ============================================================================

async function fetchAndParseProfile(barNumber: string): Promise<CalBarRecord | null> {
  const url = `${DETAIL_URL_BASE}/${barNumber}`
  const res = await fetchWithRetry(url, 1) // 1 retry only for detail pages
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

  if (!isValidName(fullName)) return null

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

  // CRITICAL: Must have extractable status
  if (!status) return null

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
        zip = stateZipMatch[2].substring(0, 5) // Only 5-digit ZIP for DB
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

  // === EMAIL (with HTML entity decoding) ===
  let email = ''
  const emailSection = html.match(/Email:\s*([\s\S]{0,300})/i)
  if (emailSection) {
    const decoded = decodeHtmlEntities(emailSection[1])
    const emailAddr = decoded.match(/[\w.-]+@[\w.-]+\.\w{2,}/)
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
  const lawSchoolMatch = html.match(/Law School<\/strong>\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i)
  if (lawSchoolMatch) {
    lawSchool = lawSchoolMatch[1].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
  }
  // Alternative pattern
  if (!lawSchool) {
    const altMatch = html.match(/Law School:\s*([\s\S]*?)(?:<\/|<br|$)/i)
    if (altMatch) {
      lawSchool = altMatch[1].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
    }
  }

  // Parse first/last name
  const nameParts = fullName.split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts[nameParts.length - 1] || ''

  return {
    barNumber,
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
    email,
    website,
    admitDate,
    lawSchool,
  }
}

// ============================================================================
// STEP 3: TRANSFORM FOR SUPABASE
// ============================================================================

function transformRecord(record: CalBarRecord, stateId: string): AttorneyInsert {
  return {
    name: record.name,
    slug: makeSlug(record.name, record.barNumber),
    first_name: record.firstName,
    last_name: record.lastName,
    email: record.email || null,
    phone: normalizePhone(record.phone),
    bar_number: record.barNumber,
    bar_state: 'CA',
    bar_status: mapCalBarStatus(record.status),
    bar_admission_date: parseAdmitDate(record.admitDate),
    law_school: record.lawSchool || null,
    firm_name: record.firmName || null,
    address_city: record.city || null,
    address_state: record.state || null,
    address_zip: record.zip || null,
    is_verified: false,
    is_active: mapCalBarStatus(record.status) === 'active',
    noindex: mapCalBarStatus(record.status) !== 'active',
    state_id: stateId,
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const startTime = Date.now()

  console.log('================================================================')
  console.log('  California Bar Attorney Ingestion — Last Names M through R')
  console.log('================================================================')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${LIMIT === Infinity ? 'ALL' : LIMIT}`)
  if (START_PREFIX) console.log(`Start prefix: ${START_PREFIX}`)
  console.log()

  // 1. Resolve CA state_id
  const { data: caState, error: stateErr } = await supabase
    .from('states')
    .select('id')
    .eq('abbreviation', 'CA')
    .single()

  if (stateErr || !caState) {
    console.error('CA state not found in DB. Ensure states table is seeded.')
    process.exit(1)
  }
  console.log(`CA state_id: ${caState.id}`)

  // 2. Generate prefixes
  let prefixes = generatePrefixes()
  if (START_PREFIX) {
    const idx = prefixes.indexOf(START_PREFIX)
    if (idx === -1) {
      console.error(`Invalid start prefix: ${START_PREFIX}`)
      process.exit(1)
    }
    prefixes = prefixes.slice(idx)
    console.log(`Resuming from prefix ${START_PREFIX} (${prefixes.length} remaining)`)
  }
  console.log(`Total prefixes to search: ${prefixes.length}`)

  // Stats
  let totalDiscovered = 0
  let totalFetched = 0
  let totalUpserted = 0
  let totalErrors = 0
  let totalSkipped = 0
  const allBarNumbers = new Set<string>()

  // 3. DISCOVERY PHASE
  console.log('\n--- PHASE 1: Discovery (search by prefix) ---')

  for (let pi = 0; pi < prefixes.length; pi++) {
    const prefix = prefixes[pi]
    const barNumbers = await discoverBarNumbers(prefix)

    // Deduplicate against global set
    let newCount = 0
    for (const bn of barNumbers) {
      if (!allBarNumbers.has(bn)) {
        allBarNumbers.add(bn)
        newCount++
      }
    }

    totalDiscovered += newCount

    if ((pi + 1) % 10 === 0 || pi === prefixes.length - 1) {
      console.log(
        `  [${pi + 1}/${prefixes.length}] Prefix "${prefix}": ${barNumbers.length} found, ${newCount} new | Total unique: ${allBarNumbers.size}`
      )
    }

    // Respect rate limits between search requests
    await sleep(DETAIL_DELAY_MS)

    // Check limit
    if (allBarNumbers.size >= LIMIT) {
      console.log(`  Reached limit of ${LIMIT} discovered bar numbers`)
      break
    }
  }

  console.log(`\nDiscovery complete: ${allBarNumbers.size} unique bar numbers`)

  // Apply limit
  let barNumbersToFetch = [...allBarNumbers]
  if (barNumbersToFetch.length > LIMIT) {
    barNumbersToFetch = barNumbersToFetch.slice(0, LIMIT)
  }

  if (DRY_RUN && barNumbersToFetch.length > 10) {
    console.log(`DRY RUN: limiting detail fetch to 10 records`)
    barNumbersToFetch = barNumbersToFetch.slice(0, 10)
  }

  // 4. DETAIL FETCH + UPSERT PHASE
  console.log(`\n--- PHASE 2: Detail fetch & upsert (${barNumbersToFetch.length} attorneys) ---`)

  const batch: CalBarRecord[] = []
  const statusCounts: Record<string, number> = {}

  for (let i = 0; i < barNumbersToFetch.length; i++) {
    const barNumber = barNumbersToFetch[i]

    try {
      const record = await fetchAndParseProfile(barNumber)

      if (record) {
        totalFetched++
        statusCounts[record.status] = (statusCounts[record.status] || 0) + 1
        batch.push(record)

        // Upsert in batches
        if (batch.length >= BATCH_SIZE) {
          if (!DRY_RUN) {
            const upserted = await upsertBatch(batch, caState.id)
            totalUpserted += upserted
          } else {
            totalUpserted += batch.length
          }
          batch.length = 0
        }
      } else {
        totalSkipped++
      }
    } catch (err: any) {
      totalErrors++
      if (totalErrors <= 20) {
        console.error(`  [ERROR] Bar #${barNumber}: ${err.message}`)
      }
    }

    // Delay between requests
    await sleep(DETAIL_DELAY_MS)

    // Progress every 1000
    if ((i + 1) % 1000 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
      const rate = totalFetched > 0 ? ((totalFetched / (i + 1)) * 100).toFixed(1) : '0'
      console.log(
        `  [${i + 1}/${barNumbersToFetch.length}] Fetched: ${totalFetched} | Upserted: ${totalUpserted} | Skipped: ${totalSkipped} | Errors: ${totalErrors} | Match rate: ${rate}% | ${elapsed}min`
      )
    }
  }

  // Flush remaining batch
  if (batch.length > 0) {
    if (!DRY_RUN) {
      const upserted = await upsertBatch(batch, caState.id)
      totalUpserted += upserted
    } else {
      totalUpserted += batch.length
    }
  }

  // 5. UPSERT BAR ADMISSIONS
  if (!DRY_RUN && totalUpserted > 0) {
    console.log('\n--- PHASE 3: Bar admissions upsert ---')
    await upsertBarAdmissions(barNumbersToFetch, caState.id)
  }

  // 6. FINAL REPORT
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)

  console.log('\n================================================================')
  console.log('  FINAL REPORT')
  console.log('================================================================')
  console.log(`Total discovered (unique bar numbers): ${allBarNumbers.size}`)
  console.log(`Total fetched (valid profiles):        ${totalFetched}`)
  console.log(`Total upserted to Supabase:            ${totalUpserted}`)
  console.log(`Total skipped (bad/missing data):      ${totalSkipped}`)
  console.log(`Total errors:                          ${totalErrors}`)
  console.log(`Match rate:                            ${barNumbersToFetch.length > 0 ? ((totalFetched / barNumbersToFetch.length) * 100).toFixed(1) : 0}%`)
  console.log(`Duration:                              ${elapsed} minutes`)

  console.log('\nStatus distribution:')
  for (const [s, c] of Object.entries(statusCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${s}: ${c}`)
  }

  if (!DRY_RUN) {
    // Verify count
    const { count } = await supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('bar_state', 'CA')

    console.log(`\nTotal CA attorneys in DB: ${count?.toLocaleString() || 'unknown'}`)
  }
}

// ============================================================================
// UPSERT BATCH TO SUPABASE
// ============================================================================

async function upsertBatch(records: CalBarRecord[], stateId: string): Promise<number> {
  const attorneys = records.map((r) => transformRecord(r, stateId))

  const { error } = await supabase.from('attorneys').upsert(attorneys, {
    onConflict: 'slug',
    ignoreDuplicates: false,
  })

  if (error) {
    console.error(`  [UPSERT ERROR] ${error.message}`)
    // Try individual inserts for the batch to salvage what we can
    let saved = 0
    for (const attorney of attorneys) {
      const { error: singleErr } = await supabase.from('attorneys').upsert([attorney], {
        onConflict: 'slug',
        ignoreDuplicates: false,
      })
      if (!singleErr) saved++
    }
    if (saved > 0) {
      console.log(`  [UPSERT RECOVERY] Saved ${saved}/${attorneys.length} individually`)
    }
    return saved
  }

  return attorneys.length
}

// ============================================================================
// UPSERT BAR ADMISSIONS
// ============================================================================

async function upsertBarAdmissions(barNumbers: string[], _stateId: string): Promise<void> {
  // Process in chunks to avoid oversized IN queries
  const chunkSize = 200
  let totalAdmissions = 0

  for (let i = 0; i < barNumbers.length; i += chunkSize) {
    const chunk = barNumbers.slice(i, i + chunkSize)

    // Build slugs to look up attorney IDs — we need the actual records for names
    // Instead, look up by bar_number + bar_state which is more reliable
    const { data: existingAttorneys, error } = await supabase
      .from('attorneys')
      .select('id, bar_number, bar_status')
      .eq('bar_state', 'CA')
      .in('bar_number', chunk)

    if (error || !existingAttorneys?.length) continue

    const barAdmissions = existingAttorneys.map((a) => ({
      attorney_id: a.id,
      state: 'CA',
      bar_number: a.bar_number,
      status: a.bar_status || 'active',
      verified: false,
      source: 'calbar_scrape',
    }))

    const { error: admError } = await supabase.from('bar_admissions').upsert(barAdmissions, {
      onConflict: 'attorney_id,state',
      ignoreDuplicates: false,
    })

    if (admError) {
      console.error(`  [BAR ADMISSIONS ERROR] Chunk ${Math.floor(i / chunkSize) + 1}: ${admError.message}`)
    } else {
      totalAdmissions += barAdmissions.length
    }
  }

  console.log(`  Bar admissions upserted: ${totalAdmissions}`)
}

// ============================================================================
// RUN
// ============================================================================

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
