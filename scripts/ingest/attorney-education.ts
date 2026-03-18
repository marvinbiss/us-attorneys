/**
 * Attorney Education Data Ingestion Script
 * Target table: attorney_education (migration 429)
 * Columns: id, attorney_id, institution, degree, graduation_year, honors, is_verified, source_url, created_at, updated_at
 * UNIQUE constraint: (attorney_id, institution, degree)
 *
 * Sources:
 *   1. state-bar — Extract education from attorneys table (law_school column already scraped)
 *   2. csv       — Bulk import from CSV file
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | xargs)
 *
 *   # State bar mode (extract from existing attorney records)
 *   npx tsx scripts/ingest/attorney-education.ts --source state-bar --state NY [--dry-run] [--limit 1000]
 *
 *   # CSV import mode
 *   npx tsx scripts/ingest/attorney-education.ts --source csv --csv-path /path/to/education.csv [--dry-run] [--limit 1000]
 */

import { createClient } from '@supabase/supabase-js'
import { createReadStream } from 'fs'
import { parse } from 'csv-parse'

// ============================================================================
// CONFIG
// ============================================================================

const BATCH_SIZE = 500

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')

const LIMIT = (() => {
  const idx = args.indexOf('--limit')
  return idx !== -1 ? parseInt(args[idx + 1], 10) : Infinity
})()

const SOURCE = (() => {
  const idx = args.indexOf('--source')
  return idx !== -1 ? args[idx + 1] : null
})()

const STATE = (() => {
  const idx = args.indexOf('--state')
  return idx !== -1 ? args[idx + 1]?.toUpperCase() : null
})()

const CSV_PATH = (() => {
  const idx = args.indexOf('--csv-path')
  return idx !== -1 ? args[idx + 1] : null
})()

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('Run: export $(grep -v \'^#\' .env.local | xargs) && npx tsx scripts/ingest/attorney-education.ts')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ============================================================================
// TYPES
// ============================================================================

interface EducationInsert {
  attorney_id: string
  institution: string
  degree: string
  graduation_year: number | null
  honors: string | null
  is_verified: boolean
  source_url: string | null
}

interface CsvRow {
  bar_number: string
  bar_state: string
  institution: string
  degree: string
  graduation_year: string
  honors: string
}

// ============================================================================
// STATS
// ============================================================================

const stats = {
  totalProcessed: 0,
  totalMatched: 0,
  totalUpserted: 0,
  totalSkipped: 0,
  totalErrors: 0,
  totalNormalized: 0,
  totalNoAttorneyMatch: 0,
  totalInvalidYear: 0,
}

// ============================================================================
// KNOWN INSTITUTIONS — Top 50 US Law Schools (canonical names)
// Maps common variations -> canonical name for normalization
// ============================================================================

const KNOWN_INSTITUTIONS: Record<string, string> = {
  // T14
  'yale law school': 'Yale Law School',
  'yale university school of law': 'Yale Law School',
  'yale university law school': 'Yale Law School',
  'yale univ school of law': 'Yale Law School',

  'stanford law school': 'Stanford Law School',
  'stanford university school of law': 'Stanford Law School',
  'stanford university law school': 'Stanford Law School',

  'harvard law school': 'Harvard Law School',
  'harvard university school of law': 'Harvard Law School',
  'harvard university law school': 'Harvard Law School',

  'columbia law school': 'Columbia Law School',
  'columbia university school of law': 'Columbia Law School',
  'columbia university law school': 'Columbia Law School',

  'university of chicago law school': 'University of Chicago Law School',
  'u of chicago law school': 'University of Chicago Law School',
  'chicago law school': 'University of Chicago Law School',

  'nyu school of law': 'NYU School of Law',
  'new york university school of law': 'NYU School of Law',
  'new york university law school': 'NYU School of Law',
  'nyu law school': 'NYU School of Law',
  'nyu law': 'NYU School of Law',

  'university of pennsylvania carey law school': 'University of Pennsylvania Carey Law School',
  'university of pennsylvania law school': 'University of Pennsylvania Carey Law School',
  'penn law school': 'University of Pennsylvania Carey Law School',
  'penn law': 'University of Pennsylvania Carey Law School',
  'upenn law': 'University of Pennsylvania Carey Law School',

  'university of virginia school of law': 'University of Virginia School of Law',
  'university of virginia law school': 'University of Virginia School of Law',
  'uva law school': 'University of Virginia School of Law',
  'uva school of law': 'University of Virginia School of Law',
  'uva law': 'University of Virginia School of Law',

  'duke university school of law': 'Duke University School of Law',
  'duke law school': 'Duke University School of Law',
  'duke university law school': 'Duke University School of Law',

  'northwestern pritzker school of law': 'Northwestern Pritzker School of Law',
  'northwestern university school of law': 'Northwestern Pritzker School of Law',
  'northwestern law school': 'Northwestern Pritzker School of Law',
  'northwestern university pritzker school of law': 'Northwestern Pritzker School of Law',

  'university of michigan law school': 'University of Michigan Law School',
  'u of michigan law school': 'University of Michigan Law School',
  'michigan law school': 'University of Michigan Law School',

  'uc berkeley school of law': 'UC Berkeley School of Law',
  'university of california berkeley school of law': 'UC Berkeley School of Law',
  'boalt hall school of law': 'UC Berkeley School of Law',
  'berkeley law': 'UC Berkeley School of Law',
  'uc berkeley law': 'UC Berkeley School of Law',

  'cornell law school': 'Cornell Law School',
  'cornell university law school': 'Cornell Law School',
  'cornell university school of law': 'Cornell Law School',

  'georgetown university law center': 'Georgetown University Law Center',
  'georgetown law center': 'Georgetown University Law Center',
  'georgetown law': 'Georgetown University Law Center',
  'georgetown university law school': 'Georgetown University Law Center',

  // T15-T30
  'ucla school of law': 'UCLA School of Law',
  'university of california los angeles school of law': 'UCLA School of Law',
  'ucla law school': 'UCLA School of Law',

  'university of texas school of law': 'University of Texas School of Law',
  'university of texas at austin school of law': 'University of Texas School of Law',
  'ut austin law school': 'University of Texas School of Law',
  'texas law school': 'University of Texas School of Law',
  'ut law school': 'University of Texas School of Law',

  'vanderbilt law school': 'Vanderbilt Law School',
  'vanderbilt university law school': 'Vanderbilt Law School',
  'vanderbilt university school of law': 'Vanderbilt Law School',

  'washington university in st. louis school of law': 'Washington University in St. Louis School of Law',
  'washington university school of law': 'Washington University in St. Louis School of Law',
  'wash u law school': 'Washington University in St. Louis School of Law',
  'wash u school of law': 'Washington University in St. Louis School of Law',
  'wustl law': 'Washington University in St. Louis School of Law',

  'usc gould school of law': 'USC Gould School of Law',
  'university of southern california gould school of law': 'USC Gould School of Law',
  'usc law school': 'USC Gould School of Law',
  'usc gould law school': 'USC Gould School of Law',

  'university of minnesota law school': 'University of Minnesota Law School',
  'u of minnesota law school': 'University of Minnesota Law School',
  'minnesota law school': 'University of Minnesota Law School',

  'george washington university law school': 'George Washington University Law School',
  'gw law school': 'George Washington University Law School',
  'gwu law school': 'George Washington University Law School',
  'george washington law school': 'George Washington University Law School',

  'university of notre dame law school': 'University of Notre Dame Law School',
  'notre dame law school': 'University of Notre Dame Law School',
  'notre dame university law school': 'University of Notre Dame Law School',

  'boston university school of law': 'Boston University School of Law',
  'boston university law school': 'Boston University School of Law',
  'bu law school': 'Boston University School of Law',
  'bu school of law': 'Boston University School of Law',

  'emory university school of law': 'Emory University School of Law',
  'emory law school': 'Emory University School of Law',
  'emory university law school': 'Emory University School of Law',

  'university of florida levin college of law': 'University of Florida Levin College of Law',
  'university of florida college of law': 'University of Florida Levin College of Law',
  'uf law school': 'University of Florida Levin College of Law',
  'uf levin college of law': 'University of Florida Levin College of Law',
  'florida law school': 'University of Florida Levin College of Law',

  // T31-T50
  'boston college law school': 'Boston College Law School',
  'boston college school of law': 'Boston College Law School',

  'university of iowa college of law': 'University of Iowa College of Law',
  'iowa law school': 'University of Iowa College of Law',
  'iowa college of law': 'University of Iowa College of Law',

  'university of wisconsin law school': 'University of Wisconsin Law School',
  'wisconsin law school': 'University of Wisconsin Law School',
  'uw law school': 'University of Wisconsin Law School',

  'university of north carolina school of law': 'University of North Carolina School of Law',
  'unc law school': 'University of North Carolina School of Law',
  'unc school of law': 'University of North Carolina School of Law',

  'university of georgia school of law': 'University of Georgia School of Law',
  'uga law school': 'University of Georgia School of Law',
  'georgia law school': 'University of Georgia School of Law',

  'fordham university school of law': 'Fordham University School of Law',
  'fordham law school': 'Fordham University School of Law',
  'fordham law': 'Fordham University School of Law',

  'george mason university antonin scalia law school': 'George Mason University Antonin Scalia Law School',
  'george mason law school': 'George Mason University Antonin Scalia Law School',
  'antonin scalia law school': 'George Mason University Antonin Scalia Law School',
  'george mason university school of law': 'George Mason University Antonin Scalia Law School',

  'university of alabama school of law': 'University of Alabama School of Law',
  'alabama law school': 'University of Alabama School of Law',

  'ohio state university moritz college of law': 'Ohio State University Moritz College of Law',
  'ohio state law school': 'Ohio State University Moritz College of Law',
  'osu moritz college of law': 'Ohio State University Moritz College of Law',

  'indiana university maurer school of law': 'Indiana University Maurer School of Law',
  'indiana law school': 'Indiana University Maurer School of Law',
  'iu maurer school of law': 'Indiana University Maurer School of Law',

  'arizona state university sandra day oconnor college of law': 'Arizona State University Sandra Day O\'Connor College of Law',
  'arizona state law school': 'Arizona State University Sandra Day O\'Connor College of Law',
  'asu law school': 'Arizona State University Sandra Day O\'Connor College of Law',
  'asu sandra day oconnor college of law': 'Arizona State University Sandra Day O\'Connor College of Law',

  'william & mary law school': 'William & Mary Law School',
  'william and mary law school': 'William & Mary Law School',
  'college of william and mary law school': 'William & Mary Law School',
  'college of william & mary marshall-wythe school of law': 'William & Mary Law School',

  'university of colorado law school': 'University of Colorado Law School',
  'colorado law school': 'University of Colorado Law School',
  'cu boulder law school': 'University of Colorado Law School',

  'wake forest university school of law': 'Wake Forest University School of Law',
  'wake forest law school': 'Wake Forest University School of Law',

  'university of washington school of law': 'University of Washington School of Law',
  'uw school of law': 'University of Washington School of Law',
  'washington law school': 'University of Washington School of Law',

  'university of illinois college of law': 'University of Illinois College of Law',
  'illinois law school': 'University of Illinois College of Law',
  'uiuc law school': 'University of Illinois College of Law',

  'tulane university law school': 'Tulane University Law School',
  'tulane law school': 'Tulane University Law School',

  'university of maryland francis king carey school of law': 'University of Maryland Francis King Carey School of Law',
  'university of maryland law school': 'University of Maryland Francis King Carey School of Law',
  'maryland law school': 'University of Maryland Francis King Carey School of Law',

  'university of connecticut school of law': 'University of Connecticut School of Law',
  'uconn law school': 'University of Connecticut School of Law',
  'connecticut law school': 'University of Connecticut School of Law',

  'temple university beasley school of law': 'Temple University Beasley School of Law',
  'temple law school': 'Temple University Beasley School of Law',
  'temple university school of law': 'Temple University Beasley School of Law',
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Normalize an institution name using the KNOWN_INSTITUTIONS map.
 * Strips extra whitespace, lowercases for lookup, and returns
 * the canonical name if found — otherwise the cleaned original.
 */
function normalizeInstitution(raw: string): { name: string; wasNormalized: boolean } {
  if (!raw) return { name: raw, wasNormalized: false }

  // Clean up the raw string
  let cleaned = raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")

  // Normalize lookup key: lowercase, strip punctuation except apostrophes
  const key = cleaned
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (KNOWN_INSTITUTIONS[key]) {
    return { name: KNOWN_INSTITUTIONS[key], wasNormalized: true }
  }

  // Try additional normalization: strip leading "the "
  const keyNoThe = key.replace(/^the /, '')
  if (KNOWN_INSTITUTIONS[keyNoThe]) {
    return { name: KNOWN_INSTITUTIONS[keyNoThe], wasNormalized: true }
  }

  // Return the cleaned original (capitalize first letter of each word)
  return { name: cleaned, wasNormalized: false }
}

/**
 * Validate graduation year is in the range 1900-2100.
 */
function validateGraduationYear(year: string | number | null | undefined): number | null {
  if (year === null || year === undefined || year === '') return null
  const parsed = typeof year === 'number' ? year : parseInt(String(year), 10)
  if (isNaN(parsed)) return null
  if (parsed < 1900 || parsed > 2100) return null
  return parsed
}

/**
 * Parse a degree string. Defaults to 'J.D.' if empty or unrecognized.
 */
function normalizeDegree(raw: string | null | undefined): string {
  if (!raw) return 'J.D.'
  const trimmed = raw.trim()
  if (!trimmed) return 'J.D.'

  const upper = trimmed.toUpperCase().replace(/\./g, '')

  // Map common variants
  const degreeMap: Record<string, string> = {
    'JD': 'J.D.',
    'JURIS DOCTOR': 'J.D.',
    'JURIS DOCTORATE': 'J.D.',
    'LLM': 'LL.M.',
    'MASTER OF LAWS': 'LL.M.',
    'LLB': 'LL.B.',
    'BACHELOR OF LAWS': 'LL.B.',
    'SJD': 'S.J.D.',
    'DOCTOR OF JURIDICAL SCIENCE': 'S.J.D.',
    'JSD': 'S.J.D.',
    'MLS': 'M.L.S.',
    'MASTER OF LEGAL STUDIES': 'M.L.S.',
    'MCL': 'M.C.L.',
    'MASTER OF COMPARATIVE LAW': 'M.C.L.',
    'BA': 'B.A.',
    'BS': 'B.S.',
    'MA': 'M.A.',
    'MBA': 'M.B.A.',
    'PHD': 'Ph.D.',
  }

  return degreeMap[upper] || trimmed
}

// ============================================================================
// SOURCE: STATE BAR (extract from existing attorneys table)
// ============================================================================

async function ingestFromStateBar(state: string) {
  console.log(`\n--- Source: State Bar (${state}) ---`)
  console.log('Extracting education from attorneys.law_school column...\n')

  // Fetch attorneys with law_school data for the given state
  let offset = 0
  const pageSize = 1000
  let hasMore = true
  const educationRecords: EducationInsert[] = []

  while (hasMore && educationRecords.length < LIMIT) {
    const { data: attorneys, error } = await supabase
      .from('attorneys')
      .select('id, bar_number, law_school, bar_admission_date')
      .eq('bar_state', state)
      .not('law_school', 'is', null)
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error(`Error fetching attorneys at offset ${offset}:`, error.message)
      stats.totalErrors++
      break
    }

    if (!attorneys || attorneys.length === 0) {
      hasMore = false
      break
    }

    for (const attorney of attorneys) {
      if (educationRecords.length >= LIMIT) break

      stats.totalProcessed++

      const lawSchool = attorney.law_school?.trim()
      if (!lawSchool) {
        stats.totalSkipped++
        continue
      }

      // Normalize institution name
      const { name: institution, wasNormalized } = normalizeInstitution(lawSchool)
      if (wasNormalized) stats.totalNormalized++

      // Try to extract graduation year from bar_admission_date (rough estimate: admitted ~3 years after graduation)
      let graduationYear: number | null = null
      if (attorney.bar_admission_date) {
        const admitYear = new Date(attorney.bar_admission_date).getFullYear()
        if (admitYear > 1900 && admitYear <= 2100) {
          // Law school is typically 3 years, so graduation ~ admission year or admission year - 0
          // Actually, many are admitted the same year they graduate. Use admission year as estimate.
          graduationYear = admitYear
        }
      }

      educationRecords.push({
        attorney_id: attorney.id,
        institution,
        degree: 'J.D.', // Default for state bar data — they typically list law school only
        graduation_year: graduationYear,
        honors: null,
        is_verified: true, // Data from official state bar records
        source_url: null,
      })

      stats.totalMatched++
    }

    offset += pageSize

    // Progress logging
    if (offset % 10000 === 0) {
      console.log(
        `  Scanned ${offset.toLocaleString()} attorneys — ` +
        `${educationRecords.length.toLocaleString()} education records extracted`
      )
    }
  }

  console.log(`\nExtraction complete: ${educationRecords.length.toLocaleString()} education records from ${stats.totalProcessed.toLocaleString()} attorneys`)
  console.log(`  Normalized institutions: ${stats.totalNormalized.toLocaleString()}`)
  console.log(`  Skipped (no law school): ${stats.totalSkipped.toLocaleString()}`)

  return educationRecords
}

// ============================================================================
// SOURCE: CSV IMPORT
// ============================================================================

async function ingestFromCsv(csvPath: string) {
  console.log(`\n--- Source: CSV Import ---`)
  console.log(`File: ${csvPath}\n`)

  // Parse CSV
  const rows: CsvRow[] = await new Promise((resolve, reject) => {
    const records: CsvRow[] = []
    const parser = createReadStream(csvPath).pipe(
      parse({
        columns: (header: string[]) =>
          header.map((h: string) =>
            h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
          ),
        skip_empty_lines: true,
        trim: true,
      })
    )
    parser.on('data', (row: CsvRow) => records.push(row))
    parser.on('error', reject)
    parser.on('end', () => resolve(records))
  })

  console.log(`Parsed ${rows.length.toLocaleString()} rows from CSV`)

  const educationRecords: EducationInsert[] = []
  const limitedRows = rows.slice(0, LIMIT)

  // Build a lookup cache: batch lookup attorneys by bar_number+bar_state
  // Group rows by bar_state for efficient batched queries
  const rowsByState: Record<string, CsvRow[]> = {}
  for (const row of limitedRows) {
    const state = row.bar_state?.toUpperCase()?.trim()
    if (!state || !row.bar_number?.trim()) {
      stats.totalSkipped++
      continue
    }
    if (!rowsByState[state]) rowsByState[state] = []
    rowsByState[state].push(row)
  }

  for (const [state, stateRows] of Object.entries(rowsByState)) {
    // Batch lookup attorneys for this state
    const barNumbers = stateRows.map((r) => r.bar_number.trim())

    // Supabase .in() has a limit; process in chunks of 500
    for (let i = 0; i < barNumbers.length; i += BATCH_SIZE) {
      const batchBarNumbers = barNumbers.slice(i, i + BATCH_SIZE)
      const batchRows = stateRows.slice(i, i + BATCH_SIZE)

      // First try bar_admissions table (cross-state tracking)
      const { data: barAdmissions } = await supabase
        .from('bar_admissions')
        .select('attorney_id, bar_number')
        .eq('state', state)
        .in('bar_number', batchBarNumbers)

      // Also try attorneys table directly
      const { data: directAttorneys } = await supabase
        .from('attorneys')
        .select('id, bar_number')
        .eq('bar_state', state)
        .in('bar_number', batchBarNumbers)

      // Build bar_number -> attorney_id map
      const barToAttorney: Record<string, string> = {}
      if (barAdmissions) {
        for (const ba of barAdmissions) {
          barToAttorney[ba.bar_number] = ba.attorney_id
        }
      }
      if (directAttorneys) {
        for (const a of directAttorneys) {
          if (!barToAttorney[a.bar_number]) {
            barToAttorney[a.bar_number] = a.id
          }
        }
      }

      for (const row of batchRows) {
        stats.totalProcessed++
        const barNum = row.bar_number.trim()
        const attorneyId = barToAttorney[barNum]

        if (!attorneyId) {
          stats.totalNoAttorneyMatch++
          continue
        }

        // Validate institution
        const rawInstitution = row.institution?.trim()
        if (!rawInstitution) {
          stats.totalSkipped++
          continue
        }

        // Normalize
        const { name: institution, wasNormalized } = normalizeInstitution(rawInstitution)
        if (wasNormalized) stats.totalNormalized++

        // Validate graduation year
        const graduationYear = validateGraduationYear(row.graduation_year)
        if (row.graduation_year?.trim() && graduationYear === null) {
          stats.totalInvalidYear++
        }

        // Normalize degree
        const degree = normalizeDegree(row.degree)

        educationRecords.push({
          attorney_id: attorneyId,
          institution,
          degree,
          graduation_year: graduationYear,
          honors: row.honors?.trim() || null,
          is_verified: false, // CSV data not verified by default
          source_url: null,
        })

        stats.totalMatched++
      }
    }

    console.log(`  State ${state}: processed ${stateRows.length.toLocaleString()} rows`)
  }

  console.log(`\nCSV processing complete: ${educationRecords.length.toLocaleString()} education records from ${stats.totalProcessed.toLocaleString()} rows`)
  console.log(`  No attorney match: ${stats.totalNoAttorneyMatch.toLocaleString()}`)
  console.log(`  Invalid graduation years: ${stats.totalInvalidYear.toLocaleString()}`)

  return educationRecords
}

// ============================================================================
// BATCH UPSERT
// ============================================================================

async function upsertEducationRecords(records: EducationInsert[]) {
  console.log(`\nUpserting ${records.length.toLocaleString()} education records in batches of ${BATCH_SIZE}...`)

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE)

    const { error } = await supabase
      .from('attorney_education')
      .upsert(batch, {
        onConflict: 'attorney_id,institution,degree',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} error: ${error.message}`)
      // Fallback: try one-by-one to salvage what we can
      let saved = 0
      for (const record of batch) {
        const { error: singleErr } = await supabase
          .from('attorney_education')
          .upsert([record], {
            onConflict: 'attorney_id,institution,degree',
            ignoreDuplicates: false,
          })
        if (!singleErr) {
          saved++
        } else {
          stats.totalErrors++
        }
      }
      stats.totalUpserted += saved
    } else {
      stats.totalUpserted += batch.length
    }

    // Progress logging
    const pct = Math.min(100, Math.round(((i + batch.length) / records.length) * 100))
    if (pct % 10 === 0 || i + BATCH_SIZE >= records.length) {
      console.log(
        `  ${pct}% — ${stats.totalUpserted.toLocaleString()} upserted, ${stats.totalErrors} errors`
      )
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('================================================================')
  console.log('  Attorney Education Data Ingestion')
  console.log('================================================================')
  console.log(`Mode:   ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Source: ${SOURCE || 'NOT SET'}`)
  console.log(`Limit:  ${LIMIT === Infinity ? 'ALL' : LIMIT}`)

  // Validate args
  if (!SOURCE || !['state-bar', 'csv'].includes(SOURCE)) {
    console.error('\nError: --source is required. Must be "state-bar" or "csv".')
    console.error('Usage:')
    console.error('  npx tsx scripts/ingest/attorney-education.ts --source state-bar --state NY')
    console.error('  npx tsx scripts/ingest/attorney-education.ts --source csv --csv-path /path/to/file.csv')
    process.exit(1)
  }

  if (SOURCE === 'state-bar' && !STATE) {
    console.error('\nError: --state XX is required for state-bar mode.')
    process.exit(1)
  }

  if (SOURCE === 'csv' && !CSV_PATH) {
    console.error('\nError: --csv-path is required for csv mode.')
    process.exit(1)
  }

  if (STATE) console.log(`State:  ${STATE}`)
  if (CSV_PATH) console.log(`CSV:    ${CSV_PATH}`)
  console.log()

  // Collect education records from the chosen source
  let educationRecords: EducationInsert[]

  if (SOURCE === 'state-bar') {
    educationRecords = await ingestFromStateBar(STATE!)
  } else {
    educationRecords = await ingestFromCsv(CSV_PATH!)
  }

  if (educationRecords.length === 0) {
    console.log('\nNo education records to process. Exiting.')
    printFinalReport()
    return
  }

  // Dry run: show sample records and exit
  if (DRY_RUN) {
    console.log('\n--- DRY RUN: showing first 5 records ---')
    educationRecords.slice(0, 5).forEach((r, i) => {
      console.log(`\n[${i + 1}]`, JSON.stringify(r, null, 2))
    })

    // Show institution distribution (top 20)
    const instCounts: Record<string, number> = {}
    for (const r of educationRecords) {
      instCounts[r.institution] = (instCounts[r.institution] || 0) + 1
    }
    console.log('\n--- Top 20 institutions ---')
    Object.entries(instCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .forEach(([inst, count]) => console.log(`  ${count.toLocaleString().padStart(6)} | ${inst}`))

    // Show degree distribution
    const degreeCounts: Record<string, number> = {}
    for (const r of educationRecords) {
      degreeCounts[r.degree] = (degreeCounts[r.degree] || 0) + 1
    }
    console.log('\n--- Degree distribution ---')
    Object.entries(degreeCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([degree, count]) => console.log(`  ${count.toLocaleString().padStart(6)} | ${degree}`))

    console.log('\nDry run complete. No data written.')
    printFinalReport()
    return
  }

  // Live mode: upsert to Supabase
  await upsertEducationRecords(educationRecords)

  // Verify final count
  const { count } = await supabase
    .from('attorney_education')
    .select('*', { count: 'exact', head: true })

  console.log(`\nTotal education records in DB: ${count?.toLocaleString() || 'unknown'}`)

  printFinalReport()
}

function printFinalReport() {
  console.log('\n================================================================')
  console.log('  FINAL REPORT')
  console.log('================================================================')
  console.log(`Total processed:      ${stats.totalProcessed.toLocaleString()}`)
  console.log(`Total matched:        ${stats.totalMatched.toLocaleString()}`)
  console.log(`Total upserted:       ${stats.totalUpserted.toLocaleString()}`)
  console.log(`Total skipped:        ${stats.totalSkipped.toLocaleString()}`)
  console.log(`Total errors:         ${stats.totalErrors}`)
  console.log(`Normalized names:     ${stats.totalNormalized.toLocaleString()}`)
  console.log(`No attorney match:    ${stats.totalNoAttorneyMatch.toLocaleString()}`)
  console.log(`Invalid grad years:   ${stats.totalInvalidYear.toLocaleString()}`)

  if (stats.totalProcessed > 0) {
    const matchRate = ((stats.totalMatched / stats.totalProcessed) * 100).toFixed(1)
    console.log(`Match rate:           ${matchRate}%`)
  }
  if (stats.totalMatched > 0) {
    const normalizeRate = ((stats.totalNormalized / stats.totalMatched) * 100).toFixed(1)
    console.log(`Normalization rate:   ${normalizeRate}%`)
  }

  console.log('================================================================')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  printFinalReport()
  process.exit(1)
})
