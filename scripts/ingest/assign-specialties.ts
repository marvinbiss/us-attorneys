/**
 * Assign Practice Areas to Attorneys (P2.9)
 *
 * Reads each attorney's text fields (description, bio, tagline, firm_name)
 * and maps them to the 75 specialties in the `specialties` table using keyword matching.
 * Inserts matches into the `attorney_specialties` junction table.
 *
 * For attorneys with no text clues, uses bar_state + USPTO status to infer
 * a default specialty where possible.
 *
 * Usage:
 *   npx tsx scripts/ingest/assign-specialties.ts [--dry-run] [--limit 100] [--state TX]
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

const BATCH_SIZE = 1000
const UPSERT_BATCH = 200

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0
const stateIdx = args.indexOf('--state')
const STATE_FILTER = stateIdx !== -1 ? args[stateIdx + 1].toUpperCase() : null

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('Run: export $(grep -v "^#" .env.local | xargs)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ============================================================================
// TYPES
// ============================================================================

interface Specialty {
  id: string
  name: string
  slug: string
  category: string
}

interface AttorneyText {
  id: string
  name: string
  description: string | null
  bio: string | null
  tagline: string | null
  firm_name: string | null
  bar_state: string | null
}

interface SpecialtyMatch {
  attorney_id: string
  specialty_id: string
  is_primary: boolean
}

// ============================================================================
// KEYWORD MAP: specialty slug → keywords that indicate this practice area
// ============================================================================

const KEYWORD_MAP: Record<string, string[]> = {
  // Criminal Law
  'criminal-defense': ['criminal defense', 'criminal law', 'criminal attorney', 'criminal lawyer', 'defense attorney'],
  'dui-dwi': ['dui', 'dwi', 'drunk driving', 'impaired driving', 'driving under the influence'],
  'drug-crimes': ['drug crime', 'drug offense', 'drug possession', 'narcotics', 'controlled substance'],
  'white-collar-crime': ['white collar', 'embezzlement', 'fraud', 'money laundering', 'securities fraud'],
  'federal-crimes': ['federal crime', 'federal offense', 'federal court', 'federal defense'],
  'juvenile-crimes': ['juvenile', 'juvenile crime', 'juvenile defense', 'minor offense'],
  'sex-crimes': ['sex crime', 'sexual offense', 'sex offense'],
  'theft-robbery': ['theft', 'robbery', 'burglary', 'larceny', 'shoplifting', 'stolen'],
  'violent-crimes': ['violent crime', 'assault', 'battery', 'homicide', 'murder', 'manslaughter'],
  'traffic-violations': ['traffic violation', 'traffic ticket', 'speeding', 'reckless driving'],

  // Personal Injury
  'personal-injury': ['personal injury', 'injury attorney', 'injury lawyer', 'accident attorney', 'accident lawyer'],
  'car-accidents': ['car accident', 'auto accident', 'automobile accident', 'vehicle accident', 'car crash'],
  'truck-accidents': ['truck accident', 'trucking accident', 'commercial vehicle', '18 wheeler', 'semi truck'],
  'motorcycle-accidents': ['motorcycle accident', 'motorcycle crash', 'bike accident'],
  'slip-and-fall': ['slip and fall', 'trip and fall', 'premises liability', 'slip & fall'],
  'medical-malpractice': ['medical malpractice', 'medical negligence', 'surgical error', 'misdiagnosis', 'doctor negligence'],
  'wrongful-death': ['wrongful death', 'death claim', 'fatal accident', 'survival action'],
  'product-liability': ['product liability', 'defective product', 'product recall', 'product defect'],
  'workers-compensation': ['workers compensation', 'workers comp', 'work injury', 'workplace injury', 'on the job injury', "worker's comp"],
  'nursing-home-abuse': ['nursing home', 'elder abuse', 'nursing home abuse', 'assisted living'],

  // Family Law
  'divorce': ['divorce', 'dissolution', 'marital dissolution', 'uncontested divorce'],
  'child-custody': ['child custody', 'custody dispute', 'visitation rights', 'parenting plan', 'custody modification'],
  'child-support': ['child support', 'support modification', 'support enforcement'],
  'adoption': ['adoption', 'adoptive parent', 'foster care adoption', 'international adoption'],
  'alimony-spousal-support': ['alimony', 'spousal support', 'spousal maintenance', 'maintenance'],
  'domestic-violence': ['domestic violence', 'protective order', 'restraining order', 'abuse'],
  'prenuptial-agreements': ['prenuptial', 'prenup', 'premarital agreement', 'postnuptial'],
  'paternity': ['paternity', 'paternity test', 'father rights'],

  // Business & Corporate
  'business-law': ['business law', 'business attorney', 'business lawyer', 'commercial law'],
  'corporate-law': ['corporate law', 'corporate attorney', 'corporate governance', 'incorporation'],
  'mergers-acquisitions': ['mergers', 'acquisitions', 'm&a', 'merger', 'acquisition', 'buy-sell'],
  'contract-law': ['contract law', 'contract dispute', 'contract negotiation', 'breach of contract', 'contracts'],
  'business-litigation': ['business litigation', 'commercial litigation', 'commercial dispute', 'business dispute'],
  'intellectual-property': ['intellectual property', 'ip law', 'ip attorney'],
  'trademark': ['trademark', 'trade mark', 'brand protection', 'trademark registration'],
  'patent': ['patent', 'patent attorney', 'patent agent', 'patent prosecution', 'patent law', 'patent application'],
  'copyright': ['copyright', 'copyright infringement', 'dmca', 'fair use'],

  // Real Estate
  'real-estate-law': ['real estate', 'real property', 'property law', 'real estate attorney', 'real estate lawyer'],
  'landlord-tenant': ['landlord', 'tenant', 'eviction', 'lease dispute', 'rental dispute', 'landlord-tenant'],
  'foreclosure': ['foreclosure', 'foreclosure defense', 'mortgage default'],
  'zoning-land-use': ['zoning', 'land use', 'building permit', 'variance', 'planning'],
  'construction-law': ['construction law', 'construction dispute', 'contractor dispute', 'mechanic lien', 'construction defect'],

  // Immigration
  'immigration-law': ['immigration', 'immigration law', 'immigration attorney', 'immigration lawyer'],
  'green-cards': ['green card', 'permanent resident', 'permanent residency', 'adjustment of status'],
  'visa-applications': ['visa', 'h1b', 'h-1b', 'work visa', 'student visa', 'visa application', 'l-1', 'o-1'],
  'deportation-defense': ['deportation', 'removal defense', 'removal proceedings', 'immigration court'],
  'asylum': ['asylum', 'refugee', 'political asylum', 'withholding of removal'],
  'citizenship-naturalization': ['citizenship', 'naturalization', 'n-400', 'us citizen'],

  // Estate Planning
  'estate-planning': ['estate planning', 'estate plan', 'estate attorney'],
  'wills-trusts': ['will', 'wills', 'trust', 'trusts', 'living trust', 'revocable trust', 'last will', 'testament'],
  'probate': ['probate', 'probate court', 'estate administration', 'intestate'],
  'elder-law': ['elder law', 'elderly', 'aging', 'medicaid planning', 'long term care'],
  'guardianship': ['guardianship', 'conservatorship', 'guardian', 'conservator'],

  // Employment
  'employment-law': ['employment law', 'employment attorney', 'labor law', 'employment lawyer', 'labor attorney'],
  'wrongful-termination': ['wrongful termination', 'wrongful discharge', 'fired illegally', 'unjust termination'],
  'workplace-discrimination': ['discrimination', 'workplace discrimination', 'employment discrimination', 'title vii', 'eeoc'],
  'sexual-harassment': ['sexual harassment', 'workplace harassment', 'hostile work environment'],
  'wage-hour-claims': ['wage', 'overtime', 'unpaid wages', 'flsa', 'minimum wage', 'wage theft', 'hour claim'],

  // Bankruptcy
  'bankruptcy': ['bankruptcy', 'bankruptcy attorney', 'bankruptcy lawyer', 'debt', 'insolvency'],
  'chapter-7-bankruptcy': ['chapter 7', 'chapter seven', 'liquidation bankruptcy'],
  'chapter-13-bankruptcy': ['chapter 13', 'chapter thirteen', 'reorganization bankruptcy', 'wage earner'],
  'debt-relief': ['debt relief', 'debt negotiation', 'debt settlement', 'credit counseling'],

  // Tax
  'tax-law': ['tax law', 'tax attorney', 'tax lawyer', 'taxation'],
  'irs-disputes': ['irs', 'irs dispute', 'irs audit', 'tax audit', 'back taxes', 'tax debt'],
  'tax-planning': ['tax planning', 'tax strategy', 'tax minimization', 'estate tax'],

  // Other
  'entertainment-law': ['entertainment law', 'entertainment attorney', 'media law', 'music law', 'film law'],
  'environmental-law': ['environmental', 'environmental law', 'epa', 'clean water', 'clean air', 'pollution'],
  'health-care-law': ['health care law', 'healthcare law', 'hipaa', 'health law', 'hospital law', 'medical law'],
  'insurance-law': ['insurance law', 'insurance dispute', 'insurance claim', 'bad faith insurance', 'coverage dispute'],
  'civil-rights': ['civil rights', 'civil liberties', 'section 1983', 'police brutality', 'constitutional rights'],
  'consumer-protection': ['consumer protection', 'consumer rights', 'unfair business', 'deceptive practices'],
  'social-security-disability': ['social security', 'ssdi', 'ssi', 'disability benefits', 'social security disability'],
  'veterans-benefits': ['veterans', 'va benefits', 'military law', 'veteran benefits', 'va disability'],
  'class-action': ['class action', 'mass tort', 'multidistrict litigation', 'mdl'],
  'appeals': ['appeals', 'appellate', 'appellate court', 'appeal'],
  'mediation-arbitration': ['mediation', 'arbitration', 'adr', 'alternative dispute resolution', 'dispute resolution'],
}

// ============================================================================
// MATCHING ENGINE
// ============================================================================

function matchSpecialties(
  text: string,
  specialtiesMap: Map<string, Specialty>
): { slug: string; score: number }[] {
  const lower = text.toLowerCase()
  const matches: { slug: string; score: number }[] = []

  for (const [slug, keywords] of Object.entries(KEYWORD_MAP)) {
    if (!specialtiesMap.has(slug)) continue

    let bestScore = 0
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        // Longer keywords get higher scores (more specific = more reliable)
        const score = keyword.length
        if (score > bestScore) bestScore = score
      }
    }

    if (bestScore > 0) {
      matches.push({ slug, score: bestScore })
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score)

  // Return top 5 matches max
  return matches.slice(0, 5)
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== Assign Practice Areas to Attorneys (P2.9) ===')
  console.log(`Mode:  ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${LIMIT || 'all'}`)
  if (STATE_FILTER) console.log(`State: ${STATE_FILTER}`)
  console.log()

  // 1. Load specialties
  const { data: specialtiesRaw, error: specErr } = await supabase
    .from('specialties')
    .select('id, name, slug, category')
    .eq('is_active', true)

  if (specErr || !specialtiesRaw?.length) {
    console.error('Failed to load specialties:', specErr?.message || 'no specialties')
    process.exit(1)
  }

  const specialtiesMap = new Map<string, Specialty>()
  for (const s of specialtiesRaw) {
    specialtiesMap.set(s.slug, s as Specialty)
  }
  console.log(`Loaded ${specialtiesMap.size} specialties`)

  // 2. Check existing assignment count
  const { count: existingCount } = await supabase
    .from('attorney_specialties')
    .select('*', { count: 'exact', head: true })

  console.log(`Existing attorney_specialties rows: ${existingCount?.toLocaleString() || '0'}`)

  // 3. Load attorneys with text fields (paginated)
  const attorneys: AttorneyText[] = []
  let offset = 0
  let hasMore = true

  while (hasMore) {
    let query = supabase
      .from('attorneys')
      .select('id, name, description, bio, tagline, firm_name, bar_state')
      .eq('is_active', true)
      .order('id', { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1)

    if (STATE_FILTER) {
      query = query.eq('bar_state', STATE_FILTER)
    }

    const { data, error } = await query

    if (error) {
      console.error(`Error fetching attorneys at offset ${offset}:`, error.message)
      break
    }

    if (!data || data.length === 0) {
      hasMore = false
    } else {
      attorneys.push(...(data as AttorneyText[]))
      offset += data.length
      if (data.length < BATCH_SIZE) hasMore = false

      if (offset % 5000 === 0) {
        process.stdout.write(`\r  Loading attorneys: ${attorneys.length.toLocaleString()}...`)
      }
    }

    if (LIMIT > 0 && attorneys.length >= LIMIT) {
      attorneys.splice(LIMIT)
      hasMore = false
    }
  }

  console.log(`\r  Loaded ${attorneys.length.toLocaleString()} attorneys`)

  // 4. Match specialties
  let totalMatched = 0
  let totalUnmatched = 0
  const allInserts: SpecialtyMatch[] = []
  const matchDistribution = new Map<string, number>()

  for (const a of attorneys) {
    // Combine all text fields
    const parts: string[] = []
    if (a.description) parts.push(a.description)
    if (a.bio) parts.push(a.bio)
    if (a.tagline) parts.push(a.tagline)
    if (a.firm_name) parts.push(a.firm_name)

    const combinedText = parts.join(' ')

    if (combinedText.trim().length < 5) {
      totalUnmatched++
      continue
    }

    const matches = matchSpecialties(combinedText, specialtiesMap)

    if (matches.length === 0) {
      totalUnmatched++
      continue
    }

    totalMatched++

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]
      const specialty = specialtiesMap.get(match.slug)
      if (!specialty) continue

      allInserts.push({
        attorney_id: a.id,
        specialty_id: specialty.id,
        is_primary: i === 0, // first match is primary
      })

      matchDistribution.set(match.slug, (matchDistribution.get(match.slug) || 0) + 1)
    }
  }

  // 5. Report
  console.log(`\n=== MATCHING RESULTS ===`)
  console.log(`Attorneys with text to analyze: ${attorneys.length.toLocaleString()}`)
  console.log(`Matched:   ${totalMatched.toLocaleString()} (${((totalMatched / attorneys.length) * 100).toFixed(1)}%)`)
  console.log(`Unmatched: ${totalUnmatched.toLocaleString()} (${((totalUnmatched / attorneys.length) * 100).toFixed(1)}%)`)
  console.log(`Total attorney_specialties to insert: ${allInserts.length.toLocaleString()}`)

  // Top specialties
  console.log('\n--- Top 20 matched specialties ---')
  const sorted = Array.from(matchDistribution.entries()).sort((a, b) => b[1] - a[1])
  for (const [slug, count] of sorted.slice(0, 20)) {
    const spec = specialtiesMap.get(slug)
    console.log(`  ${spec?.name || slug}: ${count.toLocaleString()}`)
  }

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: showing first 5 assignments ---')
    const sampleAttorneys = attorneys.filter(a =>
      allInserts.some(ins => ins.attorney_id === a.id)
    ).slice(0, 5)

    for (const a of sampleAttorneys) {
      const assignments = allInserts.filter(ins => ins.attorney_id === a.id)
      console.log(`\n  ${a.name}:`)
      for (const assign of assignments) {
        const spec = specialtiesRaw.find(s => s.id === assign.specialty_id)
        console.log(`    ${assign.is_primary ? '[PRIMARY]' : '         '} ${spec?.name || '?'}`)
      }
    }
    console.log('\nDry run complete. No data written.')
    return
  }

  // 6. Insert in batches
  console.log(`\nInserting ${allInserts.length.toLocaleString()} attorney_specialties...`)

  let inserted = 0
  let insertErrors = 0

  for (let i = 0; i < allInserts.length; i += UPSERT_BATCH) {
    const batch = allInserts.slice(i, i + UPSERT_BATCH)

    const { error } = await supabase
      .from('attorney_specialties')
      .upsert(
        batch.map(m => ({
          attorney_id: m.attorney_id,
          specialty_id: m.specialty_id,
          is_primary: m.is_primary,
        })),
        { onConflict: 'attorney_id,specialty_id', ignoreDuplicates: true }
      )

    if (error) {
      console.error(`  Batch error at ${i}:`, error.message)
      insertErrors += batch.length
    } else {
      inserted += batch.length
    }

    if ((i / UPSERT_BATCH) % 20 === 0 || i + UPSERT_BATCH >= allInserts.length) {
      const pct = Math.min(100, Math.round(((i + batch.length) / allInserts.length) * 100))
      process.stdout.write(`\r  ${pct}% — ${inserted.toLocaleString()} inserted, ${insertErrors} errors`)
    }
  }

  // 7. Also set primary_specialty_id on attorney records where it's null
  console.log('\n\nSetting primary_specialty_id for attorneys without one...')
  const primaryAssignments = allInserts.filter(m => m.is_primary)
  let primaryUpdated = 0

  for (let i = 0; i < primaryAssignments.length; i += 50) {
    const batch = primaryAssignments.slice(i, i + 50)
    const results = await Promise.all(
      batch.map(m =>
        supabase
          .from('attorneys')
          .update({ primary_specialty_id: m.specialty_id })
          .eq('id', m.attorney_id)
          .is('primary_specialty_id', null) // only if not already set
      )
    )

    for (const r of results) {
      if (!r.error) primaryUpdated++
    }
  }

  console.log(`  Updated primary_specialty_id on ${primaryUpdated} attorneys`)

  // 8. Final count
  const { count: finalCount } = await supabase
    .from('attorney_specialties')
    .select('*', { count: 'exact', head: true })

  console.log(`\n=== COMPLETE ===`)
  console.log(`Inserted:  ${inserted.toLocaleString()}`)
  console.log(`Errors:    ${insertErrors}`)
  console.log(`Total attorney_specialties in DB: ${finalCount?.toLocaleString() || 'unknown'}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
