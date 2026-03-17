/**
 * USPTO Patent Practitioner Ingestion Script
 * Source: USPTO Office of Enrollment and Discipline (OED) — Practitioner Roster
 * Bulk ZIP: https://www.uspto.gov/sites/default/files/documents/attorney.zip
 * Records: ~90,000+ registered patent attorneys and agents
 * Cost: $0 (public government dataset)
 *
 * Usage: npx tsx scripts/ingest/uspto-attorneys.ts [--limit 1000] [--dry-run]
 * Run:   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/ingest/uspto-attorneys.ts
 */

import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// ============================================================================
// CONFIG
// ============================================================================

const ROSTER_URLS = [
  // FY25 roster (Oct 2024 – Sep 2025) — 12 monthly .txt files inside ZIP
  'https://www.uspto.gov/sites/default/files/documents/FY25Roster.zip',
  // Fallback: FY24 roster
  'https://www.uspto.gov/sites/default/files/documents/FY2024Roster.zip',
  // Legacy URLs (may return 404)
  'https://www.uspto.gov/sites/default/files/documents/attorney.zip',
  'https://www.uspto.gov/attorney-roster/attorney.zip',
]

const BATCH_SIZE = 500
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

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
  console.error('Run: export $(grep -v \'^#\' .env.local | xargs) && npx tsx scripts/ingest/uspto-attorneys.ts')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ============================================================================
// TYPES
// ============================================================================

interface USPTOPractitioner {
  registrationNumber: string
  firstName: string
  middleName: string
  lastName: string
  suffix: string
  title: string // "Patent Attorney" or "Patent Agent"
  city: string
  state: string
  zip: string
  country: string
  status: string // "ACTIVE", "INACTIVE", "ADMINISTRATIVELY SUSPENDED", etc.
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
  address_line2: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  address_county: string | null
  is_verified: boolean
  is_active: boolean
  noindex: boolean
  description: string | null
  tagline: string | null
}

// ============================================================================
// HELPERS
// ============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function makeSlug(first: string, last: string, regNumber: string): string {
  const base = slugify(`${first} ${last}`.trim())
  return `${base}-uspto-${regNumber}`
}

function normalizeStatus(raw: string): string {
  const s = (raw || '').toUpperCase().trim()
  if (s === 'ACTIVE') return 'active'
  if (s.includes('SUSPEND')) return 'suspended'
  if (s.includes('DISBAR')) return 'disbarred'
  if (s.includes('INACTIVE') || s.includes('VOLUNTAR')) return 'inactive'
  if (s.includes('DECEASED')) return 'inactive'
  if (s.includes('RESIGN')) return 'inactive'
  return 'inactive'
}

function isActiveStatus(raw: string): boolean {
  return (raw || '').toUpperCase().trim() === 'ACTIVE'
}

/** Map US state abbreviations for validation */
const VALID_US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
  'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
  'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
  'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI',
  'WY', 'AS', 'GU', 'MP', 'PR', 'VI',
])

function normalizeState(raw: string): string {
  const s = (raw || '').toUpperCase().trim()
  if (VALID_US_STATES.has(s)) return s
  return ''
}

function normalizeZip(raw: string): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length >= 5) return digits.substring(0, 5)
  return null
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// DOWNLOAD & EXTRACT
// ============================================================================

async function downloadWithRetry(url: string, retries: number): Promise<Buffer | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`  Attempt ${attempt}/${retries}: ${url}`)
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; us-attorneys.com legal directory)',
          'Accept': '*/*',
        },
        redirect: 'follow',
      })
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer())
        console.log(`  Downloaded: ${(buf.length / 1024 / 1024).toFixed(1)} MB`)
        return buf
      }
      console.log(`  HTTP ${res.status}: ${res.statusText}`)
    } catch (err: any) {
      console.log(`  Error: ${err.message}`)
    }
    if (attempt < retries) {
      console.log(`  Retrying in ${RETRY_DELAY_MS / 1000}s...`)
      await sleep(RETRY_DELAY_MS)
    }
  }
  return null
}

async function downloadRoster(): Promise<Buffer> {
  console.log('Downloading USPTO Patent Practitioner Roster...')

  for (const url of ROSTER_URLS) {
    const buf = await downloadWithRetry(url, MAX_RETRIES)
    if (buf && buf.length > 1000) return buf
  }

  throw new Error('All USPTO roster download URLs failed after retries. The USPTO may have changed URLs.')
}

function extractAndParse(zipBuffer: Buffer): USPTOPractitioner[] {
  console.log('Extracting ZIP archive...')

  const tmpDir = mkdtempSync(join(tmpdir(), 'uspto-roster-'))
  const zipPath = join(tmpDir, 'attorney.zip')
  writeFileSync(zipPath, zipBuffer)

  // Try adm-zip first, then system unzip, then python
  try {
    const AdmZip = require('adm-zip')
    const zip = new AdmZip(zipBuffer)
    zip.extractAllTo(tmpDir, true)
  } catch {
    try {
      execSync(
        `unzip -o "${zipPath}" -d "${tmpDir}" 2>/dev/null || python3 -c "import zipfile; zipfile.ZipFile('${zipPath.replace(/\\/g, '/')}').extractall('${tmpDir.replace(/\\/g, '/')}')"`,
        { stdio: 'pipe' }
      )
    } catch {
      rmSync(tmpDir, { recursive: true, force: true })
      throw new Error('Cannot extract USPTO roster archive. Install adm-zip or ensure unzip/python3 is available.')
    }
  }

  const files = readdirSync(tmpDir).filter(f => !f.startsWith('.') && f !== 'attorney.zip')
  console.log(`Extracted files (${files.length}): ${files.join(', ')}`)

  // FY rosters contain 12 monthly .txt files — use the LATEST one (most recent data)
  const dataFiles = files
    .filter(f => f.endsWith('.txt') || f.endsWith('.csv') || f.endsWith('.xml'))
    .sort() // alphabetical sort puts later months last (e.g., Sep2025.txt > Oct2024.txt)

  if (dataFiles.length === 0) {
    rmSync(tmpDir, { recursive: true, force: true })
    throw new Error(`No data file found in ZIP. Files present: ${files.join(', ')}`)
  }

  // Pick the last file alphabetically (most recent month)
  const dataFile = dataFiles[dataFiles.length - 1]
  console.log(`Using most recent data file: ${dataFile} (out of ${dataFiles.length} files)`)
  const content = readFileSync(join(tmpDir, dataFile), 'utf-8')
  rmSync(tmpDir, { recursive: true, force: true })

  // Detect format and parse accordingly
  if (dataFile.endsWith('.xml')) {
    return parseXML(content)
  } else {
    return parseCSV(content)
  }
}

// ============================================================================
// PARSERS
// ============================================================================

/**
 * Parse CSV/TSV roster data.
 * The USPTO roster is typically a pipe-delimited or comma-delimited file.
 * Expected columns vary but generally include:
 *   Registration Number | Last Name | First Name | Middle Name | Suffix |
 *   Title | City | State | Zip | Country | Status
 */
function parseCSV(content: string): USPTOPractitioner[] {
  const lines = content.split(/\r?\n/)
  if (lines.length < 2) {
    throw new Error(`Data file has only ${lines.length} lines — expected thousands`)
  }

  // Detect delimiter: pipe, tab, or comma
  const firstLine = lines[0]
  let delimiter = ','
  if (firstLine.includes('|')) delimiter = '|'
  else if (firstLine.split('\t').length > 3) delimiter = '\t'

  console.log(`Detected delimiter: "${delimiter === '\t' ? 'TAB' : delimiter}"`)
  console.log(`Total lines: ${lines.length.toLocaleString()}`)

  // Detect if first line is a header or data
  // FY roster files have NO header — first line is data like: "LASTNAME","FIRSTNAME",...
  const firstCols = firstLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  const looksLikeHeader = firstCols.some(c =>
    ['registration_number', 'reg_no', 'last_name', 'lastname', 'first_name', 'firstname', 'name'].includes(c)
  )

  if (looksLikeHeader) {
    console.log('Detected: file WITH header row')
    const headerCols = firstCols.map(h => h.replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, ''))
    console.log(`Header columns (${headerCols.length}): ${headerCols.join(', ')}`)

    const colMap = buildColumnMap(headerCols)
    console.log(`Column mapping: ${JSON.stringify(colMap)}`)

    if (colMap.regNumber === -1) {
      throw new Error(`Cannot find Registration Number column. Headers: ${headerCols.join(', ')}`)
    }
    if (colMap.lastName === -1 && colMap.fullName === -1) {
      throw new Error(`Cannot find Name column. Headers: ${headerCols.join(', ')}`)
    }

    return parseWithColumnMap(lines, 1, delimiter, colMap)
  }

  // No header — assume FY Roster positional format:
  // 0:LastName, 1:FirstName, 2:MiddleInitial, 3:Suffix, 4:Firm, 5:Addr1, 6:Addr2, 7:Addr3,
  // 8:City, 9:State, 10:Country, 11:Zip, 12:Phone, 13:RegNumber, 14:Type, 15:Unknown
  console.log('Detected: file WITHOUT header (FY Roster positional format)')
  console.log('Format: LastName,FirstName,Middle,Suffix,Firm,Addr1,Addr2,Addr3,City,State,Country,Zip,Phone,RegNumber,Type')

  const practitioners: USPTOPractitioner[] = []
  let parseErrors = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    try {
      const parts = parseQuotedCSVLine(line)

      const regNumber = (parts[13] || '').trim()
      if (!regNumber || !/^\d+$/.test(regNumber)) {
        parseErrors++
        continue
      }

      const lastName = (parts[0] || '').trim()
      if (!lastName) {
        parseErrors++
        continue
      }

      practitioners.push({
        registrationNumber: regNumber,
        firstName: titleCase((parts[1] || '').trim()),
        middleName: titleCase((parts[2] || '').trim()),
        lastName: titleCase(lastName),
        suffix: (parts[3] || '').trim().toUpperCase(),
        title: (parts[14] || '').trim(), // ATTORNEY, AGENT, or LIMITED
        city: titleCase((parts[8] || '').trim()),
        state: (parts[9] || '').trim().toUpperCase(),
        zip: (parts[11] || '').trim(),
        country: ((parts[10] || '').trim().toUpperCase()) || 'US',
        status: 'ACTIVE', // FY roster only contains active practitioners
      })
    } catch {
      parseErrors++
    }
  }

  if (parseErrors > 0) {
    console.log(`Parse errors (skipped): ${parseErrors.toLocaleString()}`)
  }

  return practitioners
}

/** Parse a CSV line respecting quoted fields (handles commas inside quotes) */
function parseQuotedCSVLine(line: string): string[] {
  const parts: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // skip escaped quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      parts.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  parts.push(current)
  return parts
}

function parseWithColumnMap(lines: string[], startIdx: number, delimiter: string, colMap: Record<string, number>): USPTOPractitioner[] {
  const practitioners: USPTOPractitioner[] = []
  let parseErrors = 0

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    try {
      const parts = delimiter === ',' ? parseQuotedCSVLine(line) : line.split(delimiter).map(p => p.trim().replace(/^"|"$/g, ''))

      const regNumber = (parts[colMap.regNumber] || '').trim()
      if (!regNumber || !/^\d+$/.test(regNumber)) {
        parseErrors++
        continue
      }

      let firstName = ''
      let middleName = ''
      let lastName = ''
      let suffix = ''

      if (colMap.fullName !== -1 && colMap.lastName === -1) {
        const nameParts = (parts[colMap.fullName] || '').split(/[,]+/).map(p => p.trim())
        lastName = nameParts[0] || ''
        const rest = (nameParts[1] || '').split(/\s+/)
        firstName = rest[0] || ''
        middleName = rest.slice(1).join(' ')
      } else {
        firstName = colMap.firstName !== -1 ? (parts[colMap.firstName] || '').trim() : ''
        middleName = colMap.middleName !== -1 ? (parts[colMap.middleName] || '').trim() : ''
        lastName = colMap.lastName !== -1 ? (parts[colMap.lastName] || '').trim() : ''
        suffix = colMap.suffix !== -1 ? (parts[colMap.suffix] || '').trim() : ''
      }

      if (!lastName) {
        parseErrors++
        continue
      }

      const title = colMap.title !== -1 ? (parts[colMap.title] || '').trim() : ''
      const city = colMap.city !== -1 ? (parts[colMap.city] || '').trim() : ''
      const state = colMap.state !== -1 ? (parts[colMap.state] || '').trim() : ''
      const zip = colMap.zip !== -1 ? (parts[colMap.zip] || '').trim() : ''
      const country = colMap.country !== -1 ? (parts[colMap.country] || '').trim() : ''
      const status = colMap.status !== -1 ? (parts[colMap.status] || '').trim() : 'ACTIVE'

      practitioners.push({
        registrationNumber: regNumber,
        firstName: titleCase(firstName),
        middleName: titleCase(middleName),
        lastName: titleCase(lastName),
        suffix: suffix.toUpperCase(),
        title,
        city: titleCase(city),
        state: state.toUpperCase(),
        zip,
        country: country.toUpperCase() || 'US',
        status: status.toUpperCase(),
      })
    } catch {
      parseErrors++
    }
  }

  if (parseErrors > 0) {
    console.log(`Parse errors (skipped): ${parseErrors.toLocaleString()}`)
  }

  return practitioners
}

function buildColumnMap(headers: string[]): Record<string, number> {
  const find = (patterns: string[]) => {
    for (const p of patterns) {
      const idx = headers.findIndex(h => h === p || h.includes(p))
      if (idx !== -1) return idx
    }
    return -1
  }

  return {
    regNumber: find(['registration_number', 'reg_no', 'registration_no', 'reg_number', 'registration', 'number']),
    firstName: find(['first_name', 'firstname', 'first']),
    middleName: find(['middle_name', 'middlename', 'middle']),
    lastName: find(['last_name', 'lastname', 'last', 'surname']),
    fullName: find(['name', 'full_name', 'fullname', 'practitioner_name']),
    suffix: find(['suffix', 'name_suffix']),
    title: find(['title', 'type', 'practitioner_type', 'designation']),
    city: find(['city', 'practitioner_city']),
    state: find(['state', 'practitioner_state', 'st']),
    zip: find(['zip', 'zipcode', 'zip_code', 'postal_code', 'postal']),
    country: find(['country', 'practitioner_country']),
    status: find(['status', 'practitioner_status', 'registration_status']),
  }
}

function parseXML(content: string): USPTOPractitioner[] {
  // Simple XML parser — USPTO sometimes publishes XML roster
  const practitioners: USPTOPractitioner[] = []
  let parseErrors = 0

  // Match each practitioner record block
  const recordPattern = /<(?:practitioner|attorney|agent|record)[\s>]([\s\S]*?)<\/(?:practitioner|attorney|agent|record)>/gi
  const records = content.match(recordPattern) || []

  if (records.length === 0) {
    // Try line-by-line XML tags
    console.log('No XML record blocks found. Attempting line-by-line parse...')
    return parseCSV(content) // Fallback to CSV parser
  }

  for (const record of records) {
    try {
      const getTag = (tag: string): string => {
        const m = record.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i'))
        return (m?.[1] || '').trim()
      }

      const regNumber = getTag('registration_number') || getTag('reg_no') || getTag('number')
      if (!regNumber || !/^\d+$/.test(regNumber)) {
        parseErrors++
        continue
      }

      const lastName = getTag('last_name') || getTag('lastname') || getTag('surname')
      if (!lastName) {
        parseErrors++
        continue
      }

      practitioners.push({
        registrationNumber: regNumber,
        firstName: titleCase(getTag('first_name') || getTag('firstname')),
        middleName: titleCase(getTag('middle_name') || getTag('middlename')),
        lastName: titleCase(lastName),
        suffix: (getTag('suffix') || '').toUpperCase(),
        title: getTag('title') || getTag('type') || getTag('designation'),
        city: titleCase(getTag('city')),
        state: (getTag('state') || '').toUpperCase(),
        zip: getTag('zip') || getTag('zipcode') || getTag('postal_code'),
        country: (getTag('country') || 'US').toUpperCase(),
        status: (getTag('status') || 'ACTIVE').toUpperCase(),
      })
    } catch {
      parseErrors++
    }
  }

  if (parseErrors > 0) {
    console.log(`XML parse errors (skipped): ${parseErrors.toLocaleString()}`)
  }

  return practitioners
}

function titleCase(s: string): string {
  if (!s) return ''
  return s.toLowerCase().replace(/(?:^|\s|[-'])\S/g, c => c.toUpperCase())
}

// ============================================================================
// TRANSFORM
// ============================================================================

function transformPractitioner(p: USPTOPractitioner, patentSpecialtyId: string | null): AttorneyInsert {
  const firstName = p.firstName.trim()
  const lastName = p.lastName.trim()
  const suffix = p.suffix.trim()
  const fullName = [firstName, p.middleName.trim(), lastName, suffix].filter(Boolean).join(' ')

  const addrState = normalizeState(p.state)
  const isPatentAttorney = (p.title || '').toLowerCase().includes('attorney')
  const titleLabel = isPatentAttorney ? 'Patent Attorney' : 'Patent Agent'

  return {
    name: fullName,
    slug: makeSlug(firstName, lastName, p.registrationNumber),
    first_name: firstName,
    last_name: lastName,
    email: null,
    phone: null,
    bar_number: p.registrationNumber,
    bar_state: 'US', // USPTO is federal, use "US" for CHAR(2) constraint
    bar_status: normalizeStatus(p.status),
    bar_admission_date: null,
    law_school: null,
    firm_name: null,
    address_line1: null,
    address_line2: null,
    address_city: p.city || null,
    address_state: addrState || null,
    address_zip: normalizeZip(p.zip),
    address_county: null,
    is_verified: true, // Official USPTO data
    is_active: true, // We only insert ACTIVE practitioners
    noindex: false,
    description: `${fullName} is a registered USPTO ${titleLabel} (Reg. #${p.registrationNumber}).`,
    tagline: `Registered ${titleLabel}`,
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== USPTO Patent Practitioner Ingestion ===')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${LIMIT === Infinity ? 'ALL' : LIMIT}`)
  console.log(`Batch size: ${BATCH_SIZE}`)
  console.log()

  // 1. Load state mapping from DB
  const { data: states, error: statesErr } = await supabase
    .from('states')
    .select('id, abbreviation')

  if (statesErr || !states?.length) {
    console.error('Cannot load states from DB:', statesErr?.message || 'no data')
    process.exit(1)
  }

  const stateMap = new Map(states.map(s => [s.abbreviation, s.id]))
  console.log(`Loaded ${stateMap.size} states from DB`)

  // 2. Look up "Patent" specialty for linking
  const { data: patentSpecialty } = await supabase
    .from('specialties')
    .select('id')
    .eq('slug', 'patent')
    .single()

  const patentSpecialtyId = patentSpecialty?.id || null
  if (patentSpecialtyId) {
    console.log(`Patent specialty ID: ${patentSpecialtyId}`)
  } else {
    console.log('Warning: "Patent" specialty not found — will skip specialty linking')
  }

  // Also look up "Intellectual Property" as fallback
  const { data: ipSpecialty } = await supabase
    .from('specialties')
    .select('id')
    .eq('slug', 'intellectual-property')
    .single()

  const ipSpecialtyId = ipSpecialty?.id || null

  // 3. Download and parse roster
  const zipBuffer = await downloadRoster()
  const allPractitioners = extractAndParse(zipBuffer)
  console.log(`\nTotal practitioners parsed: ${allPractitioners.length.toLocaleString()}`)

  // 4. Status distribution
  const statusCounts: Record<string, number> = {}
  const titleCounts: Record<string, number> = {}
  allPractitioners.forEach(p => {
    const s = p.status || 'EMPTY'
    statusCounts[s] = (statusCounts[s] || 0) + 1
    const t = p.title || 'UNKNOWN'
    titleCounts[t] = (titleCounts[t] || 0) + 1
  })

  console.log('\nStatus distribution:')
  Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => console.log(`  ${status}: ${count.toLocaleString()}`))

  console.log('\nTitle distribution:')
  Object.entries(titleCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([title, count]) => console.log(`  ${title}: ${count.toLocaleString()}`))

  // 5. Filter: ONLY Active practitioners with valid reg number + name
  const active = allPractitioners.filter(p => {
    if (!isActiveStatus(p.status)) return false
    if (!p.registrationNumber || !/^\d+$/.test(p.registrationNumber)) return false
    if (!p.lastName.trim()) return false
    return true
  })

  console.log(`\nActive practitioners with valid data: ${active.length.toLocaleString()}`)

  // Deduplicate by registration number (should be unique, but safety check)
  const deduped = new Map<string, USPTOPractitioner>()
  let dupeCount = 0
  for (const p of active) {
    if (deduped.has(p.registrationNumber)) {
      dupeCount++
    } else {
      deduped.set(p.registrationNumber, p)
    }
  }
  const usable = Array.from(deduped.values()).slice(0, LIMIT)
  if (dupeCount > 0) {
    console.log(`Duplicate registration numbers removed: ${dupeCount}`)
  }
  console.log(`Usable records (after dedup + limit): ${usable.length.toLocaleString()}`)

  // State distribution of active practitioners
  const stateCounts: Record<string, number> = {}
  usable.forEach(p => {
    const st = normalizeState(p.state) || 'FOREIGN/UNKNOWN'
    stateCounts[st] = (stateCounts[st] || 0) + 1
  })
  console.log('\nTop 15 states (by practitioner count):')
  Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([st, c]) => console.log(`  ${st}: ${c.toLocaleString()}`))

  // 6. DRY RUN output
  if (DRY_RUN) {
    console.log('\n--- DRY RUN: showing first 5 transformed records ---')
    usable.slice(0, 5).forEach((p, i) => {
      const transformed = transformPractitioner(p, patentSpecialtyId)
      console.log(`\n[${i + 1}]`, JSON.stringify(transformed, null, 2))
    })
    console.log(`\nDry run complete. ${usable.length.toLocaleString()} records would be upserted.`)
    return
  }

  // 7. Transform & upsert in batches
  console.log(`\nUpserting ${usable.length.toLocaleString()} patent practitioners in batches of ${BATCH_SIZE}...`)

  let inserted = 0
  let errors = 0
  let batchErrors: string[] = []

  for (let i = 0; i < usable.length; i += BATCH_SIZE) {
    const batch = usable.slice(i, i + BATCH_SIZE)

    const attorneys = batch.map(p => {
      const a = transformPractitioner(p, patentSpecialtyId)
      const addrState = normalizeState(p.state)
      const stateId = addrState ? stateMap.get(addrState) : null

      return {
        ...a,
        state_id: stateId || null,
        primary_specialty_id: patentSpecialtyId || ipSpecialtyId || null,
      }
    })

    const { error } = await supabase
      .from('attorneys')
      .upsert(attorneys, {
        onConflict: 'slug',
        ignoreDuplicates: false,
      })

    if (error) {
      const errMsg = `Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`
      console.error(`  ERROR — ${errMsg}`)
      batchErrors.push(errMsg)
      errors += batch.length
    } else {
      inserted += batch.length
    }

    // Progress every 5000 records
    const processed = i + batch.length
    if (processed % 5000 < BATCH_SIZE || processed >= usable.length) {
      const pct = Math.min(100, Math.round((processed / usable.length) * 100))
      console.log(`  ${pct}% — ${inserted.toLocaleString()} inserted, ${errors.toLocaleString()} errors (${processed.toLocaleString()}/${usable.length.toLocaleString()})`)
    }
  }

  // 8. Upsert bar_admissions
  console.log('\nUpserting bar admissions (state=US for USPTO)...')
  let barInserted = 0
  let barErrors = 0

  for (let i = 0; i < usable.length; i += BATCH_SIZE) {
    const batch = usable.slice(i, i + BATCH_SIZE)

    // Look up attorney IDs by slug
    const slugs = batch.map(p => makeSlug(p.firstName, p.lastName, p.registrationNumber))

    const { data: existingAttorneys } = await supabase
      .from('attorneys')
      .select('id, slug, bar_number')
      .in('slug', slugs)

    if (!existingAttorneys?.length) continue

    const barAdmissions = existingAttorneys.map(a => ({
      attorney_id: a.id,
      state: 'US', // CHAR(2) — "US" for federal USPTO registration
      bar_number: a.bar_number || '',
      status: 'active',
      admission_date: null,
      verified: true,
      source: 'uspto_roster',
    }))

    const { error } = await supabase
      .from('bar_admissions')
      .upsert(barAdmissions, {
        onConflict: 'attorney_id,state',
        ignoreDuplicates: true,
      })

    if (error) {
      barErrors += barAdmissions.length
    } else {
      barInserted += barAdmissions.length
    }
  }

  console.log(`Bar admissions: ${barInserted.toLocaleString()} upserted, ${barErrors.toLocaleString()} errors`)

  // 9. Link patent attorneys to "Patent" specialty via attorney_specialties
  if (patentSpecialtyId) {
    console.log('\nLinking practitioners to Patent specialty...')
    let specLinked = 0

    for (let i = 0; i < usable.length; i += BATCH_SIZE) {
      const batch = usable.slice(i, i + BATCH_SIZE)
      const slugs = batch.map(p => makeSlug(p.firstName, p.lastName, p.registrationNumber))

      const { data: existingAttorneys } = await supabase
        .from('attorneys')
        .select('id')
        .in('slug', slugs)

      if (!existingAttorneys?.length) continue

      const links = existingAttorneys.map(a => ({
        attorney_id: a.id,
        specialty_id: patentSpecialtyId,
        is_primary: true,
      }))

      const { error } = await supabase
        .from('attorney_specialties')
        .upsert(links, {
          onConflict: 'attorney_id,specialty_id',
          ignoreDuplicates: true,
        })

      if (!error) specLinked += links.length
    }

    console.log(`Specialty links created: ${specLinked.toLocaleString()}`)
  }

  // 10. Summary
  console.log('\n=== INGESTION COMPLETE ===')
  console.log(`Attorneys upserted:    ${inserted.toLocaleString()}`)
  console.log(`Attorney errors:       ${errors.toLocaleString()}`)
  console.log(`Bar admissions:        ${barInserted.toLocaleString()}`)
  console.log(`Bar admission errors:  ${barErrors.toLocaleString()}`)

  if (batchErrors.length > 0) {
    console.log(`\nFirst 5 batch errors:`)
    batchErrors.slice(0, 5).forEach(e => console.log(`  - ${e}`))
  }

  // Verify count
  const { count } = await supabase
    .from('attorneys')
    .select('*', { count: 'exact', head: true })
    .eq('bar_state', 'US')

  console.log(`\nTotal USPTO practitioners in DB: ${count?.toLocaleString() || 'unknown'}`)

  // Overall DB count
  const { count: totalCount } = await supabase
    .from('attorneys')
    .select('*', { count: 'exact', head: true })

  console.log(`Total attorneys in DB (all sources): ${totalCount?.toLocaleString() || 'unknown'}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
