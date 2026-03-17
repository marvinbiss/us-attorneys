/**
 * CalBar Attorney Ingestion: Last Names G-L
 * Scrapes California State Bar for attorneys whose last names start with G through L.
 * Discovery via 2-letter prefix search, then individual profile fetch, then Supabase upsert.
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/ingest/ca-attorneys-gl.ts
 *   Add --dry-run to skip Supabase writes.
 *   Add --limit 500 to cap total attorneys processed.
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

const BATCH_SIZE = 500
const DETAIL_DELAY_MS = 200
const RATE_LIMIT_WAIT_MS = 30_000
const MAX_RETRIES = 3
const LETTERS = ['G', 'H', 'I', 'J', 'K', 'L'] as const
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

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
  console.error('Run: export $(grep -v \'^#\' .env.local | xargs) && npx tsx scripts/ingest/ca-attorneys-gl.ts')
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

function mapStatus(calbarStatus: string): string {
  const s = calbarStatus.toLowerCase().trim()
  if (s === 'active') return 'active'
  if (s.includes('inactive') || s.includes('voluntary')) return 'inactive'
  if (s.includes('suspended')) return 'suspended'
  if (s.includes('disbarred')) return 'disbarred'
  if (s.includes('resigned') || s.includes('retired')) return 'inactive'
  if (s.includes('deceased')) return 'inactive'
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
    .replace(/&#(\d+);/g, (_match, num) => String.fromCharCode(parseInt(num, 10)))
}

// ============================================================================
// FETCH WITH RETRY + RATE LIMIT HANDLING
// ============================================================================

async function fetchWithRetry(
  url: string,
  retries = MAX_RETRIES,
  backoffMs = 2000
): Promise<Response | null> {
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
        const waitTime = attempt === 0 ? RATE_LIMIT_WAIT_MS : RATE_LIMIT_WAIT_MS * Math.pow(2, attempt)
        console.warn(`  [RATE LIMIT] ${res.status} on ${url} — waiting ${waitTime / 1000}s (attempt ${attempt + 1}/${retries + 1})`)
        await sleep(waitTime)
        continue
      }

      // Other non-200 status: retry once with backoff
      if (attempt < retries) {
        await sleep(backoffMs * Math.pow(2, attempt))
        continue
      }

      return null
    } catch (err: any) {
      if (attempt < retries) {
        console.warn(`  [NETWORK ERROR] ${err.message} — retry in ${backoffMs * Math.pow(2, attempt)}ms`)
        await sleep(backoffMs * Math.pow(2, attempt))
        continue
      }
      return null
    }
  }
  return null
}

// ============================================================================
// STEP 1: DISCOVERY — search by 2-letter prefix, extract bar numbers
// ============================================================================

async function discoverBarNumbers(prefix: string): Promise<string[]> {
  const url = `https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch?FreeText=${prefix}&SortBy=LastName`
  const res = await fetchWithRetry(url)
  if (!res) return []

  const html = await res.text()

  // Extract bar numbers from detail links
  const detailLinks = [...html.matchAll(/href="[^"]*Licensee\/Detail\/(\d+)[^"]*"/gi)]
  const barNumbers = [...new Set(detailLinks.map(m => m[1]))]

  // Check if results might be truncated (CalBar caps at 500 results)
  if (barNumbers.length >= 490) {
    console.warn(`  [WARN] Prefix "${prefix}" returned ${barNumbers.length} results — may be truncated. Consider 3-letter prefixes.`)
  }

  return barNumbers
}

// ============================================================================
// STEP 2: DETAIL FETCH — parse individual profile page
// ============================================================================

async function fetchAndParseProfile(barNum: string): Promise<CalBarRecord | null> {
  const url = `https://apps.calbar.ca.gov/attorney/Licensee/Detail/${barNum}`
  const res = await fetchWithRetry(url, 1, 2000)
  if (!res) return null

  const html = await res.text()

  // Verify it's a real profile page
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

  // CRITICAL: Skip if name or status is missing
  if (!fullName || !status) return null

  // === ADDRESS ===
  const addressMatch = html.match(/Address:\s*([\s\S]*?)\s*<\/p>/i)
  let address = '', firmName = '', city = '', state = '', zip = ''
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
        state = stateZipMatch[1]
        zip = stateZipMatch[2]
        city = parts[parts.length - 2]?.trim() || ''
      }
      if (parts.length >= 4) {
        firmName = parts[0]
      }
    }
  }

  // === PHONE & FAX ===
  const phoneMatch = html.match(/Phone:\s*([0-9()\s.-]+)/i)
  const phone = phoneMatch ? phoneMatch[1].trim() : ''
  const faxMatch = html.match(/Fax:\s*([0-9()\s.-]+)/i)
  const fax = faxMatch ? faxMatch[1].trim() : ''

  // === EMAIL (with HTML entity decoding) ===
  let email = ''
  const emailSection = html.match(/Email:\s*([\s\S]{0,500})/i)
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
  const lawSchoolMatch = html.match(/Law School\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i)
  if (lawSchoolMatch) {
    lawSchool = lawSchoolMatch[1].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim()
  }

  // Parse first/last name
  const nameParts = fullName.split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts[nameParts.length - 1] || ''

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
// STEP 3: SUPABASE UPSERT
// ============================================================================

async function upsertBatch(
  records: CalBarRecord[],
  stateId: string
): Promise<{ upserted: number; errors: number }> {
  const attorneys: AttorneyInsert[] = records.map(r => ({
    name: r.name,
    slug: makeSlug(r.name, r.barNumber),
    first_name: r.firstName,
    last_name: r.lastName,
    email: r.email || null,
    phone: normalizePhone(r.phone),
    bar_number: r.barNumber,
    bar_state: 'CA',
    bar_status: mapStatus(r.status),
    bar_admission_date: parseAdmitDate(r.admitDate),
    law_school: r.lawSchool || null,
    firm_name: r.firmName || null,
    address_city: r.city || null,
    address_state: r.state || null,
    address_zip: r.zip ? r.zip.substring(0, 5) : null,
    is_verified: false,
    is_active: mapStatus(r.status) === 'active',
    noindex: mapStatus(r.status) !== 'active',
    state_id: stateId,
  }))

  const { error } = await supabase
    .from('attorneys')
    .upsert(attorneys, {
      onConflict: 'slug',
      ignoreDuplicates: false,
    })

  if (error) {
    console.error(`  [UPSERT ERROR] attorneys: ${error.message}`)
    return { upserted: 0, errors: records.length }
  }

  return { upserted: records.length, errors: 0 }
}

async function upsertBarAdmissions(
  records: CalBarRecord[],
): Promise<void> {
  // Look up attorney IDs by slug
  const slugs = records.map(r => makeSlug(r.name, r.barNumber))

  // Query in chunks of 500 to avoid URI length limits
  const allAttorneys: { id: string; slug: string; bar_number: string }[] = []
  for (let i = 0; i < slugs.length; i += BATCH_SIZE) {
    const chunk = slugs.slice(i, i + BATCH_SIZE)
    const { data } = await supabase
      .from('attorneys')
      .select('id, slug, bar_number')
      .in('slug', chunk)

    if (data?.length) {
      allAttorneys.push(...data)
    }
  }

  if (!allAttorneys.length) return

  const slugToRecord = new Map(records.map(r => [makeSlug(r.name, r.barNumber), r]))

  const barAdmissions = allAttorneys.map(a => {
    const rec = slugToRecord.get(a.slug)
    return {
      attorney_id: a.id,
      state: 'CA',
      bar_number: a.bar_number,
      status: rec ? mapStatus(rec.status) : 'active',
      admission_date: rec ? parseAdmitDate(rec.admitDate) : null,
      verified: false,
      source: 'calbar_scrape',
    }
  })

  // Upsert in batches
  for (let i = 0; i < barAdmissions.length; i += BATCH_SIZE) {
    const batch = barAdmissions.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('bar_admissions')
      .upsert(batch, {
        onConflict: 'attorney_id,state',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error(`  [UPSERT ERROR] bar_admissions: ${error.message}`)
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const startTime = Date.now()

  console.log('================================================================')
  console.log('  CalBar Attorney Ingestion: Last Names G-L')
  console.log('================================================================')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${LIMIT === Infinity ? 'ALL' : LIMIT}`)
  console.log(`Letters: ${LETTERS.join(', ')}`)
  console.log(`Prefixes: ${LETTERS.length * 26} (2-letter combos)`)
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

  // 2. Discovery phase: collect all bar numbers
  console.log('\n--- PHASE 1: DISCOVERY ---')
  const allBarNumbers = new Set<string>()
  let prefixCount = 0
  const totalPrefixes = LETTERS.length * ALPHA.length

  for (const letter of LETTERS) {
    for (const second of ALPHA) {
      const prefix = `${letter}${second}`
      prefixCount++

      const barNumbers = await discoverBarNumbers(prefix)
      const newCount = barNumbers.filter(bn => !allBarNumbers.has(bn)).length
      barNumbers.forEach(bn => allBarNumbers.add(bn))

      if (barNumbers.length > 0) {
        console.log(
          `  [${prefixCount}/${totalPrefixes}] "${prefix}" -> ${barNumbers.length} results (${newCount} new) | Total: ${allBarNumbers.size}`
        )
      }

      // Respect rate limits
      await sleep(DETAIL_DELAY_MS)

      // Check limit
      if (allBarNumbers.size >= LIMIT) {
        console.log(`  Reached limit of ${LIMIT} bar numbers during discovery.`)
        break
      }
    }
    if (allBarNumbers.size >= LIMIT) break
  }

  const discoveredCount = allBarNumbers.size
  console.log(`\nDiscovery complete: ${discoveredCount.toLocaleString()} unique bar numbers found.`)

  if (discoveredCount === 0) {
    console.log('No attorneys discovered. Exiting.')
    return
  }

  // 3. Detail fetch phase
  console.log('\n--- PHASE 2: DETAIL FETCH ---')
  const records: CalBarRecord[] = []
  let fetchErrors = 0
  let fetchSkipped = 0
  let fetchCount = 0
  const barNumberArray = [...allBarNumbers].slice(0, LIMIT)

  for (const barNum of barNumberArray) {
    fetchCount++

    try {
      const record = await fetchAndParseProfile(barNum)
      if (record) {
        records.push(record)
      } else {
        fetchSkipped++
      }
    } catch (err: any) {
      fetchErrors++
      if (fetchErrors <= 10) {
        console.error(`  [ERROR] Bar #${barNum}: ${err.message}`)
      }
    }

    await sleep(DETAIL_DELAY_MS)

    // Progress every 1000
    if (fetchCount % 1000 === 0) {
      const pct = Math.round((fetchCount / barNumberArray.length) * 100)
      const matchRate = Math.round((records.length / fetchCount) * 100)
      console.log(
        `  [${pct}%] Fetched: ${fetchCount.toLocaleString()} | Parsed: ${records.length.toLocaleString()} | ` +
        `Skipped: ${fetchSkipped} | Errors: ${fetchErrors} | Match rate: ${matchRate}%`
      )
    }
  }

  console.log(`\nDetail fetch complete:`)
  console.log(`  Fetched:  ${fetchCount.toLocaleString()}`)
  console.log(`  Parsed:   ${records.length.toLocaleString()}`)
  console.log(`  Skipped:  ${fetchSkipped.toLocaleString()}`)
  console.log(`  Errors:   ${fetchErrors.toLocaleString()}`)
  console.log(`  Match rate: ${Math.round((records.length / fetchCount) * 100)}%`)

  // Status distribution
  const statusCounts: Record<string, number> = {}
  for (const r of records) {
    const s = r.status || 'UNKNOWN'
    statusCounts[s] = (statusCounts[s] || 0) + 1
  }
  console.log('\nStatus distribution:')
  for (const [s, c] of Object.entries(statusCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${s}: ${c.toLocaleString()}`)
  }

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: showing first 5 transformed records ---')
    records.slice(0, 5).forEach((r, i) => {
      console.log(`\n[${i + 1}] ${r.name} (Bar #${r.barNumber})`)
      console.log(`    Status: ${r.status} -> ${mapStatus(r.status)}`)
      console.log(`    City: ${r.city || 'N/A'}, ${r.state || 'N/A'} ${r.zip || 'N/A'}`)
      console.log(`    Phone: ${r.phone || 'N/A'}`)
      console.log(`    Email: ${r.email || 'N/A'}`)
      console.log(`    Firm: ${r.firmName || 'N/A'}`)
      console.log(`    Admit: ${r.admitDate || 'N/A'} -> ${parseAdmitDate(r.admitDate) || 'N/A'}`)
      console.log(`    Law School: ${r.lawSchool || 'N/A'}`)
      console.log(`    Slug: ${makeSlug(r.name, r.barNumber)}`)
    })
    console.log('\nDry run complete. No data written.')
    return
  }

  // 4. Upsert phase
  console.log('\n--- PHASE 3: SUPABASE UPSERT ---')
  let totalUpserted = 0
  let totalUpsertErrors = 0

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE)
    const { upserted, errors } = await upsertBatch(batch, caState.id)
    totalUpserted += upserted
    totalUpsertErrors += errors

    const pct = Math.min(100, Math.round(((i + batch.length) / records.length) * 100))
    console.log(
      `  [${pct}%] Upserted: ${totalUpserted.toLocaleString()} | Errors: ${totalUpsertErrors}`
    )
  }

  // 5. Bar admissions upsert
  console.log('\nUpserting bar admissions...')
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE)
    await upsertBarAdmissions(batch)
  }

  // 6. Verify
  const { count } = await supabase
    .from('attorneys')
    .select('*', { count: 'exact', head: true })
    .eq('bar_state', 'CA')

  // 7. Final report
  const elapsed = Math.round((Date.now() - startTime) / 1000)
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  console.log('\n================================================================')
  console.log('  FINAL REPORT')
  console.log('================================================================')
  console.log(`  Discovered:    ${discoveredCount.toLocaleString()} bar numbers`)
  console.log(`  Fetched:       ${fetchCount.toLocaleString()} profiles`)
  console.log(`  Parsed:        ${records.length.toLocaleString()} valid records`)
  console.log(`  Upserted:      ${totalUpserted.toLocaleString()} attorneys`)
  console.log(`  Upsert errors: ${totalUpsertErrors}`)
  console.log(`  Fetch errors:  ${fetchErrors}`)
  console.log(`  Fetch skipped: ${fetchSkipped}`)
  console.log(`  Total CA in DB: ${count?.toLocaleString() || 'unknown'}`)
  console.log(`  Duration:      ${minutes}m ${seconds}s`)
  console.log('================================================================')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
