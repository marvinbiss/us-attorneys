/**
 * Texas Attorneys — Texas Bar Direct Scraper (High-Speed)
 *
 * Phase 1: Search texasbar.com with 3-letter last name prefixes (AAA-ZZZ).
 *          If a prefix hits 25-result cap, auto-subdivide to 4-letter.
 *          Extracts ContactIDs + name + city + practice areas from listing.
 *
 * Phase 2: Fetch detail pages for each ContactID (20 concurrent).
 *          Extracts bar_number, license_date, status.
 *
 * Expected: ~130K attorneys in ~2h
 *
 * Usage: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/ingest/tx-attorneys-opengovus.ts [--dry-run] [--limit 500] [--concurrency 20]
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

const SEARCH_URL = 'https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer&Template=/CustomSource/MemberDirectory/Result_form_client.cfm'
const DETAIL_URL = 'https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer&template=/Customsource/MemberDirectory/MemberDirectoryDetail.cfm'
const BATCH_SIZE = 500
const DEFAULT_CONCURRENCY = 20
const DELAY_MS = 150
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5000
const CAP = 25

const HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const LIMIT = (() => { const i = args.indexOf('--limit'); return i !== -1 ? parseInt(args[i + 1], 10) : Infinity })()
const CONCURRENCY = (() => { const i = args.indexOf('--concurrency'); return i !== -1 ? parseInt(args[i + 1], 10) : DEFAULT_CONCURRENCY })()

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

interface TXListingEntry {
  contactId: string
  firstName: string
  lastName: string
  city: string | null
  practiceAreas: string[]
}

interface TXAttorney extends TXListingEntry {
  barNumber: string
  licenseDate: string | null
  status: string
}

// ============================================================================
// HELPERS
// ============================================================================

function slugify(t: string): string { return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') }
function titleCase(s: string): string { return s ? s.toLowerCase().replace(/(?:^|\s|[-'])\S/g, c => c.toUpperCase()) : '' }
function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)) }

function parseTXDate(raw: string): string | null {
  if (!raw) return null
  const m = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : null
}

function normalizeStatus(raw: string): string {
  const s = raw.toLowerCase()
  if (s.includes('eligible')) return 'active'
  if (s.includes('inactive')) return 'inactive'
  if (s.includes('suspend')) return 'suspended'
  if (s.includes('disbar')) return 'disbarred'
  return 'active'
}

async function fetchHTML(url: string, body?: string): Promise<string | null> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const opts: RequestInit = { headers: HEADERS, redirect: 'follow' }
      if (body) {
        opts.method = 'POST'
        opts.headers = { ...HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' }
        opts.body = body
      }
      const res = await fetch(url, opts)
      if (res.ok) return await res.text()
      if (res.status === 429) { await sleep(RETRY_DELAY_MS * attempt * 2); continue }
      return null
    } catch {
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt)
    }
  }
  return null
}

// ============================================================================
// PHASE 1: LISTING SEARCH → ContactIDs
// ============================================================================

function parseListingResults(html: string): TXListingEntry[] {
  const entries: TXListingEntry[] = []
  const seen = new Set<string>()

  // Find ContactID blocks
  const contactIdRegex = /ContactID=(\d+)/g
  const contactIds: string[] = []
  let match
  while ((match = contactIdRegex.exec(html)) !== null) {
    if (!seen.has(match[1])) {
      seen.add(match[1])
      contactIds.push(match[1])
    }
  }

  for (const cid of contactIds) {
    // Find the section of HTML after this ContactID
    const idx = html.indexOf(`ContactID=${cid}`)
    const section = html.substring(idx, idx + 2000)

    const givenNames: string[] = []
    const gnRegex = /given-name">([^<]*)/g
    let gnMatch
    while ((gnMatch = gnRegex.exec(section)) !== null) {
      if (gnMatch[1].trim()) givenNames.push(gnMatch[1].trim())
    }
    const firstName = givenNames.join(' ').trim()
    const familyMatch = section.match(/family-name">([^<]*)/)
    const lastName = familyMatch?.[1]?.trim() || ''

    if (!lastName) continue

    const cityMatch = section.match(/Primary Practice Location:<\/strong>\s*([^,<\n]+)/i)
    const city = cityMatch?.[1]?.trim() || null

    const paMatch = section.match(/Practice Areas:[^<]*<\/strong>\s*([^<]+)/i)
      || section.match(/Practice Areas:\s*<span[^>]*>([^<]+)/i)
    const practiceAreas = paMatch?.[1]?.split(',').map(s => s.trim()).filter(Boolean) || []

    entries.push({ contactId: cid, firstName, lastName, city, practiceAreas })
  }

  return entries
}

async function discoverAttorneys(): Promise<Map<string, TXListingEntry>> {
  console.log('\n--- PHASE 1: DISCOVER ATTORNEYS (3-letter prefix → listing) ---')

  const prefixes: string[] = []
  for (let i = 0; i < 26; i++)
    for (let j = 0; j < 26; j++)
      for (let k = 0; k < 26; k++)
        prefixes.push(String.fromCharCode(65 + i) + String.fromCharCode(65 + j) + String.fromCharCode(65 + k))

  console.log(`  ${prefixes.length.toLocaleString()} prefixes, concurrency: ${CONCURRENCY}\n`)

  const allEntries = new Map<string, TXListingEntry>()
  const needsSub: string[] = []
  const startTime = Date.now()
  let done = 0

  for (let i = 0; i < prefixes.length; i += CONCURRENCY) {
    const batch = prefixes.slice(i, i + CONCURRENCY)
    const results = await Promise.all(batch.map(async (prefix) => {
      await sleep(Math.random() * DELAY_MS)
      const body = `Submitted=1&ShowPrinter=1&Find=Find&LastName=${prefix}&FirstName=&BarCardNumber=&City=&State=&Zip=`
      const html = await fetchHTML(SEARCH_URL, body)
      if (!html) return { prefix, entries: [] as TXListingEntry[] }
      return { prefix, entries: parseListingResults(html) }
    }))

    for (const { prefix, entries } of results) {
      if (entries.length >= CAP) needsSub.push(prefix)
      for (const e of entries) {
        if (!allEntries.has(e.contactId)) allEntries.set(e.contactId, e)
      }
      done++
    }

    if (done % 500 === 0 || i + CONCURRENCY >= prefixes.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
      console.log(`  [${done.toLocaleString()}/${prefixes.length.toLocaleString()}] ${allEntries.size.toLocaleString()} attorneys | ${elapsed}s | overflow: ${needsSub.length}`)
    }
  }

  // Subdivide capped prefixes → 4 letters
  if (needsSub.length > 0) {
    console.log(`\n  Subdividing ${needsSub.length} capped prefixes → 4-letter...`)
    const sub4: string[] = []
    for (const base of needsSub)
      for (let l = 0; l < 26; l++)
        sub4.push(base + String.fromCharCode(65 + l))

    const needsSub5: string[] = []
    for (let i = 0; i < sub4.length; i += CONCURRENCY) {
      const batch = sub4.slice(i, i + CONCURRENCY)
      const results = await Promise.all(batch.map(async (prefix) => {
        await sleep(Math.random() * DELAY_MS)
        const body = `Submitted=1&ShowPrinter=1&Find=Find&LastName=${prefix}&FirstName=&BarCardNumber=&City=&State=&Zip=`
        const html = await fetchHTML(SEARCH_URL, body)
        if (!html) return { prefix, entries: [] as TXListingEntry[] }
        return { prefix, entries: parseListingResults(html) }
      }))
      for (const { prefix, entries } of results) {
        if (entries.length >= CAP) needsSub5.push(prefix)
        for (const e of entries) {
          if (!allEntries.has(e.contactId)) allEntries.set(e.contactId, e)
        }
      }
    }
    console.log(`  After 4-letter: ${allEntries.size.toLocaleString()} attorneys, ${needsSub5.length} still capped`)

    // 5-letter subdivision
    if (needsSub5.length > 0) {
      console.log(`  Subdividing ${needsSub5.length} → 5-letter...`)
      const sub5: string[] = []
      for (const base of needsSub5)
        for (let l = 0; l < 26; l++)
          sub5.push(base + String.fromCharCode(65 + l))

      for (let i = 0; i < sub5.length; i += CONCURRENCY) {
        const batch = sub5.slice(i, i + CONCURRENCY)
        const results = await Promise.all(batch.map(async (prefix) => {
          await sleep(Math.random() * DELAY_MS)
          const body = `Submitted=1&ShowPrinter=1&Find=Find&LastName=${prefix}&FirstName=&BarCardNumber=&City=&State=&Zip=`
          const html = await fetchHTML(SEARCH_URL, body)
          if (!html) return { prefix, entries: [] as TXListingEntry[] }
          return { prefix, entries: parseListingResults(html) }
        }))
        for (const { entries } of results) {
          for (const e of entries) {
            if (!allEntries.has(e.contactId)) allEntries.set(e.contactId, e)
          }
        }
      }
      console.log(`  After 5-letter: ${allEntries.size.toLocaleString()} attorneys`)
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
  console.log(`\n  Phase 1 complete: ${allEntries.size.toLocaleString()} unique ContactIDs in ${elapsed}s`)
  return allEntries
}

// ============================================================================
// PHASE 2: DETAIL PAGES → bar_number, license_date, status
// ============================================================================

function parseDetailPage(html: string): { barNumber: string; licenseDate: string | null; status: string } | null {
  const barMatch = html.match(/Bar Card Number:<\/strong>\s*(\d+)/i)
  if (!barMatch) return null

  const dateMatch = html.match(/License Date:<\/strong>\s*([\d/]+)/i)
  const statusMatch = html.match(/(Eligible to Practice|Not Eligible|Inactive|Suspended|Disbarred)[^<]*/i)

  return {
    barNumber: barMatch[1],
    licenseDate: dateMatch?.[1] || null,
    status: statusMatch?.[0]?.trim() || 'Eligible to Practice',
  }
}

async function fetchDetailsAndUpsert(entries: Map<string, TXListingEntry>, txStateId: string): Promise<{ totalValid: number; totalUpserted: number; totalErrors: number }> {
  const contactIds = [...entries.keys()]
  console.log(`\n--- PHASE 2: FETCH DETAILS + UPSERT STREAMING (${CONCURRENCY} concurrent, ${contactIds.length.toLocaleString()} pages) ---\n`)

  let fetched = 0
  let totalValid = 0
  let totalUpserted = 0
  let totalErrors = 0
  let pendingBatch: TXAttorney[] = []
  const startTime = Date.now()

  for (let i = 0; i < contactIds.length; i += CONCURRENCY) {
    const batch = contactIds.slice(i, i + CONCURRENCY)
    const results = await Promise.all(batch.map(async (cid) => {
      await sleep(Math.random() * DELAY_MS)
      const html = await fetchHTML(`${DETAIL_URL}&ContactID=${cid}`)
      if (!html) return null
      const detail = parseDetailPage(html)
      if (!detail) return null
      const listing = entries.get(cid)!
      return { ...listing, ...detail } as TXAttorney
    }))

    for (const r of results) {
      fetched++
      if (r && r.barNumber) {
        totalValid++
        pendingBatch.push(r)
      } else {
        totalErrors++
      }
    }

    // Upsert every BATCH_SIZE records to avoid memory buildup
    if (pendingBatch.length >= BATCH_SIZE) {
      const count = await upsertBatch(pendingBatch, txStateId)
      totalUpserted += count
      pendingBatch = [] // free memory
    }

    if (fetched % 1000 === 0 || i + CONCURRENCY >= contactIds.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
      const rate = (fetched / parseFloat(elapsed || '1')).toFixed(0)
      const eta = ((contactIds.length - fetched) / parseFloat(rate || '1') / 60).toFixed(1)
      console.log(`  [${((fetched / contactIds.length) * 100).toFixed(0)}%] ${fetched.toLocaleString()}/${contactIds.length.toLocaleString()} | valid: ${totalValid.toLocaleString()} | upserted: ${totalUpserted.toLocaleString()} | ${rate} req/s | ETA: ${eta}min`)
    }
  }

  // Final batch
  if (pendingBatch.length > 0) {
    const count = await upsertBatch(pendingBatch, txStateId)
    totalUpserted += count
  }

  console.log(`\n  Phase 2 complete: ${totalValid.toLocaleString()} valid, ${totalUpserted.toLocaleString()} upserted, ${totalErrors} errors`)
  return { totalValid, totalUpserted, totalErrors }
}

// ============================================================================
// UPSERT
// ============================================================================

async function upsertBatch(attorneys: TXAttorney[], txStateId: string): Promise<number> {
  const rows = attorneys.map(a => {
    const fullName = [a.firstName, a.lastName].filter(Boolean).join(' ')
    return {
      name: fullName,
      slug: slugify(`${a.firstName} ${a.lastName}`) + `-tx-${a.barNumber}`,
      first_name: titleCase(a.firstName),
      last_name: titleCase(a.lastName),
      email: null,
      phone: null,
      bar_number: a.barNumber,
      bar_state: 'TX',
      bar_status: normalizeStatus(a.status),
      bar_admission_date: parseTXDate(a.licenseDate || ''),
      law_school: null,
      firm_name: null,
      address_city: a.city ? titleCase(a.city) : null,
      address_state: 'TX',
      address_zip: null,
      state_id: txStateId,
      is_verified: true,
      is_active: normalizeStatus(a.status) === 'active',
      noindex: normalizeStatus(a.status) !== 'active',
      description: `${fullName} is a licensed attorney in Texas${a.city ? ` based in ${titleCase(a.city)}` : ''}${a.practiceAreas.length ? `, practicing ${a.practiceAreas.join(', ')}` : ''}.`,
      tagline: a.practiceAreas.length > 0 ? a.practiceAreas.slice(0, 3).join(' | ') : 'Texas Licensed Attorney',
    }
  })

  if (DRY_RUN) return rows.length

  const { error } = await supabase.from('attorneys').upsert(rows, { onConflict: 'slug', ignoreDuplicates: false })
  if (error) { console.error(`  Upsert error: ${error.message}`); return 0 }
  return rows.length
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║  TEXAS — Texas Bar Direct Scraper (3-letter + detail)       ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log()
  console.log(`Mode:        ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit:       ${LIMIT === Infinity ? 'ALL' : LIMIT}`)
  console.log(`Concurrency: ${CONCURRENCY}`)
  console.log()

  const { data: txState } = await supabase.from('states').select('id').eq('abbreviation', 'TX').single()
  if (!txState) { console.error('TX state not found!'); process.exit(1) }
  console.log(`TX state_id: ${txState.id}`)

  // Phase 1
  const listings = await discoverAttorneys()

  // Phase 2 + 3: Fetch details & stream upserts (avoids heap OOM)
  const { totalValid, totalUpserted, totalErrors } = await fetchDetailsAndUpsert(listings, txState.id)

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('TEXAS INGESTION COMPLETE')
  console.log('='.repeat(60))
  console.log(`  ContactIDs discovered: ${listings.size.toLocaleString()}`)
  console.log(`  With bar number:       ${totalValid.toLocaleString()}`)
  console.log(`  Upserted to DB:        ${totalUpserted.toLocaleString()}`)
  console.log(`  Errors:                ${totalErrors.toLocaleString()}`)
  console.log('='.repeat(60))
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
