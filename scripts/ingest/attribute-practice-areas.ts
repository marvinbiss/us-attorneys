/**
 * Attribute Practice Areas to Attorneys
 *
 * Assigns specialties to attorneys that have NO entries in attorney_specialties.
 * Inference sources (in priority order):
 *   1. case_results.specialty_id — direct link from case data
 *   2. Text fields (description, bio, tagline, firm_name) — keyword matching
 *   3. USPTO patent attorneys — bar_admissions-based inference
 *
 * Idempotent: only processes attorneys with zero specialty assignments.
 * Safe to run multiple times.
 *
 * Usage:
 *   npx tsx scripts/ingest/attribute-practice-areas.ts [--dry-run] [--limit 100] [--state TX]
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

const BATCH_SIZE = 1000        // attorneys fetched per page
const UPSERT_BATCH = 100       // attorney_specialties upserted per batch

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

interface AttorneyRow {
  id: string
  name: string
  description: string | null
  bio: string | null
  tagline: string | null
  firm_name: string | null
  bar_state: string | null
}

interface SpecialtyInsert {
  attorney_id: string
  specialty_id: string
  is_primary: boolean
}

// ============================================================================
// KEYWORD MAP: specialty slug -> keywords that indicate this practice area
//
// Covers all 75 specialties. Longer keywords score higher (more specific).
// ============================================================================

const KEYWORD_MAP: Record<string, string[]> = {
  // Criminal Law (10)
  'criminal-defense': [
    'criminal defense', 'criminal law', 'criminal attorney', 'criminal lawyer',
    'defense attorney', 'criminal case', 'criminal charge',
  ],
  'dui-dwi': [
    'dui', 'dwi', 'drunk driving', 'impaired driving',
    'driving under the influence', 'operating under the influence', 'oui',
  ],
  'drug-crimes': [
    'drug crime', 'drug offense', 'drug possession', 'narcotics',
    'controlled substance', 'drug trafficking', 'drug charge',
  ],
  'white-collar-crime': [
    'white collar', 'embezzlement', 'money laundering', 'securities fraud',
    'wire fraud', 'mail fraud', 'ponzi scheme', 'insider trading',
  ],
  'federal-crimes': [
    'federal crime', 'federal offense', 'federal court', 'federal defense',
    'federal indictment', 'federal prosecution',
  ],
  'juvenile-crimes': [
    'juvenile', 'juvenile crime', 'juvenile defense', 'minor offense',
    'juvenile court', 'delinquency',
  ],
  'sex-crimes': [
    'sex crime', 'sexual offense', 'sex offense', 'sexual assault defense',
    'sex offender', 'indecent exposure',
  ],
  'theft-robbery': [
    'theft', 'robbery', 'burglary', 'larceny', 'shoplifting', 'stolen property',
    'grand theft', 'petty theft',
  ],
  'violent-crimes': [
    'violent crime', 'assault', 'battery', 'homicide', 'murder',
    'manslaughter', 'aggravated assault', 'domestic battery',
  ],
  'traffic-violations': [
    'traffic violation', 'traffic ticket', 'speeding ticket', 'reckless driving',
    'traffic offense', 'moving violation', 'suspended license',
  ],

  // Personal Injury (10)
  'personal-injury': [
    'personal injury', 'injury attorney', 'injury lawyer', 'accident attorney',
    'accident lawyer', 'bodily injury', 'catastrophic injury',
  ],
  'car-accidents': [
    'car accident', 'auto accident', 'automobile accident', 'vehicle accident',
    'car crash', 'motor vehicle accident', 'car collision',
  ],
  'truck-accidents': [
    'truck accident', 'trucking accident', 'commercial vehicle accident',
    '18 wheeler', 'semi truck', '18-wheeler', 'tractor trailer',
  ],
  'motorcycle-accidents': [
    'motorcycle accident', 'motorcycle crash', 'bike accident', 'motorcycle injury',
  ],
  'slip-and-fall': [
    'slip and fall', 'trip and fall', 'premises liability', 'slip & fall',
    'property hazard', 'unsafe premises',
  ],
  'medical-malpractice': [
    'medical malpractice', 'medical negligence', 'surgical error', 'misdiagnosis',
    'doctor negligence', 'hospital negligence', 'birth injury', 'medication error',
  ],
  'wrongful-death': [
    'wrongful death', 'death claim', 'fatal accident', 'survival action',
    'death lawsuit',
  ],
  'product-liability': [
    'product liability', 'defective product', 'product recall', 'product defect',
    'dangerous product', 'manufacturing defect',
  ],
  'workers-compensation': [
    'workers compensation', 'workers comp', 'work injury', 'workplace injury',
    'on the job injury', "worker's comp", "workers' compensation",
    'occupational injury', 'job injury',
  ],
  'nursing-home-abuse': [
    'nursing home', 'elder abuse', 'nursing home abuse', 'assisted living abuse',
    'nursing home neglect',
  ],

  // Family Law (8)
  'divorce': [
    'divorce', 'dissolution of marriage', 'marital dissolution',
    'uncontested divorce', 'contested divorce', 'divorce attorney',
    'divorce lawyer',
  ],
  'child-custody': [
    'child custody', 'custody dispute', 'visitation rights', 'parenting plan',
    'custody modification', 'joint custody', 'sole custody',
  ],
  'child-support': [
    'child support', 'support modification', 'support enforcement',
    'child support modification',
  ],
  'adoption': [
    'adoption', 'adoptive parent', 'foster care adoption',
    'international adoption', 'stepparent adoption', 'adoption attorney',
  ],
  'alimony-spousal-support': [
    'alimony', 'spousal support', 'spousal maintenance', 'maintenance order',
  ],
  'domestic-violence': [
    'domestic violence', 'protective order', 'restraining order',
    'order of protection', 'domestic abuse',
  ],
  'prenuptial-agreements': [
    'prenuptial', 'prenup', 'premarital agreement', 'postnuptial',
    'prenuptial agreement',
  ],
  'paternity': [
    'paternity', 'paternity test', 'father rights', 'paternity action',
    'establishing paternity',
  ],

  // Business & Corporate (9)
  'business-law': [
    'business law', 'business attorney', 'business lawyer', 'commercial law',
    'business formation', 'llc formation', 'business contract',
  ],
  'corporate-law': [
    'corporate law', 'corporate attorney', 'corporate governance',
    'incorporation', 'corporate counsel', 'corporate compliance',
  ],
  'mergers-acquisitions': [
    'mergers and acquisitions', 'mergers', 'acquisitions', 'm&a',
    'merger', 'acquisition', 'buy-sell agreement', 'corporate transaction',
  ],
  'contract-law': [
    'contract law', 'contract dispute', 'contract negotiation',
    'breach of contract', 'contract drafting', 'contract review',
  ],
  'business-litigation': [
    'business litigation', 'commercial litigation', 'commercial dispute',
    'business dispute', 'shareholder dispute', 'partnership dispute',
  ],
  'intellectual-property': [
    'intellectual property', 'ip law', 'ip attorney', 'ip litigation',
    'ip protection',
  ],
  'trademark': [
    'trademark', 'trade mark', 'brand protection', 'trademark registration',
    'trademark infringement', 'trademark law',
  ],
  'patent': [
    'patent', 'patent attorney', 'patent agent', 'patent prosecution',
    'patent law', 'patent application', 'patent infringement', 'patent office',
  ],
  'copyright': [
    'copyright', 'copyright infringement', 'dmca', 'fair use',
    'copyright law', 'copyright protection',
  ],

  // Real Estate (5)
  'real-estate-law': [
    'real estate', 'real property', 'property law', 'real estate attorney',
    'real estate lawyer', 'real estate transaction', 'title issue',
    'closing attorney', 'real estate closing',
  ],
  'landlord-tenant': [
    'landlord', 'tenant', 'eviction', 'lease dispute', 'rental dispute',
    'landlord-tenant', 'lease agreement', 'tenant rights',
  ],
  'foreclosure': [
    'foreclosure', 'foreclosure defense', 'mortgage default',
    'mortgage foreclosure', 'loan modification',
  ],
  'zoning-land-use': [
    'zoning', 'land use', 'building permit', 'variance',
    'zoning law', 'land use planning', 'zoning dispute',
  ],
  'construction-law': [
    'construction law', 'construction dispute', 'contractor dispute',
    'mechanic lien', 'construction defect', 'construction litigation',
  ],

  // Immigration (6)
  'immigration-law': [
    'immigration', 'immigration law', 'immigration attorney',
    'immigration lawyer', 'immigration case',
  ],
  'green-cards': [
    'green card', 'permanent resident', 'permanent residency',
    'adjustment of status', 'immigrant visa', 'i-485',
  ],
  'visa-applications': [
    'visa', 'h1b', 'h-1b', 'work visa', 'student visa', 'visa application',
    'l-1', 'o-1', 'f-1', 'j-1', 'eb-1', 'eb-2', 'eb-3', 'visa petition',
  ],
  'deportation-defense': [
    'deportation', 'removal defense', 'removal proceedings',
    'immigration court', 'deportation defense',
  ],
  'asylum': [
    'asylum', 'refugee', 'political asylum', 'withholding of removal',
    'asylum seeker', 'asylum application',
  ],
  'citizenship-naturalization': [
    'citizenship', 'naturalization', 'n-400', 'us citizen',
    'citizenship application', 'oath of allegiance',
  ],

  // Estate Planning (5)
  'estate-planning': [
    'estate planning', 'estate plan', 'estate attorney', 'estate lawyer',
    'advance directive', 'power of attorney',
  ],
  'wills-trusts': [
    'will', 'wills', 'trust', 'trusts', 'living trust', 'revocable trust',
    'last will', 'testament', 'irrevocable trust', 'testamentary trust',
  ],
  'probate': [
    'probate', 'probate court', 'estate administration', 'intestate',
    'probate litigation', 'probate attorney',
  ],
  'elder-law': [
    'elder law', 'elderly', 'medicaid planning', 'long term care',
    'senior law', 'aging',
  ],
  'guardianship': [
    'guardianship', 'conservatorship', 'guardian', 'conservator',
    'adult guardianship', 'minor guardianship',
  ],

  // Employment (5)
  'employment-law': [
    'employment law', 'employment attorney', 'labor law',
    'employment lawyer', 'labor attorney', 'employment rights',
    'labor dispute', 'nlrb',
  ],
  'wrongful-termination': [
    'wrongful termination', 'wrongful discharge', 'fired illegally',
    'unjust termination', 'unlawful termination',
  ],
  'workplace-discrimination': [
    'discrimination', 'workplace discrimination', 'employment discrimination',
    'title vii', 'eeoc', 'age discrimination', 'race discrimination',
    'gender discrimination', 'disability discrimination',
  ],
  'sexual-harassment': [
    'sexual harassment', 'workplace harassment', 'hostile work environment',
    'quid pro quo', 'harassment claim',
  ],
  'wage-hour-claims': [
    'wage', 'overtime', 'unpaid wages', 'flsa', 'minimum wage',
    'wage theft', 'hour claim', 'wage dispute', 'overtime pay',
  ],

  // Bankruptcy (4)
  'bankruptcy': [
    'bankruptcy', 'bankruptcy attorney', 'bankruptcy lawyer',
    'insolvency', 'bankruptcy filing',
  ],
  'chapter-7-bankruptcy': [
    'chapter 7', 'chapter seven', 'liquidation bankruptcy', 'chapter 7 bankruptcy',
  ],
  'chapter-13-bankruptcy': [
    'chapter 13', 'chapter thirteen', 'reorganization bankruptcy',
    'wage earner plan', 'chapter 13 bankruptcy',
  ],
  'debt-relief': [
    'debt relief', 'debt negotiation', 'debt settlement', 'credit counseling',
    'debt management', 'debt consolidation',
  ],

  // Tax (3)
  'tax-law': [
    'tax law', 'tax attorney', 'tax lawyer', 'taxation', 'tax counsel',
  ],
  'irs-disputes': [
    'irs', 'irs dispute', 'irs audit', 'tax audit', 'back taxes',
    'tax debt', 'tax lien', 'tax levy', 'irs problem',
  ],
  'tax-planning': [
    'tax planning', 'tax strategy', 'tax minimization', 'estate tax',
    'tax optimization', 'tax shelter',
  ],

  // Other (10)
  'entertainment-law': [
    'entertainment law', 'entertainment attorney', 'media law',
    'music law', 'film law', 'talent agency',
  ],
  'environmental-law': [
    'environmental', 'environmental law', 'epa', 'clean water act',
    'clean air act', 'pollution', 'environmental compliance', 'cercla',
  ],
  'health-care-law': [
    'health care law', 'healthcare law', 'hipaa', 'health law',
    'hospital law', 'medical law', 'healthcare compliance',
    'healthcare regulation',
  ],
  'insurance-law': [
    'insurance law', 'insurance dispute', 'insurance claim',
    'bad faith insurance', 'coverage dispute', 'insurance denial',
    'insurance litigation',
  ],
  'civil-rights': [
    'civil rights', 'civil liberties', 'section 1983', 'police brutality',
    'constitutional rights', 'civil rights violation', 'police misconduct',
    'excessive force',
  ],
  'consumer-protection': [
    'consumer protection', 'consumer rights', 'unfair business',
    'deceptive practices', 'consumer fraud', 'lemon law',
  ],
  'social-security-disability': [
    'social security', 'ssdi', 'ssi', 'disability benefits',
    'social security disability', 'disability claim', 'disability appeal',
  ],
  'veterans-benefits': [
    'veterans', 'va benefits', 'military law', 'veteran benefits',
    'va disability', 'military justice', 'court martial',
  ],
  'class-action': [
    'class action', 'mass tort', 'multidistrict litigation', 'mdl',
    'class action lawsuit', 'mass litigation',
  ],
  'appeals': [
    'appeals', 'appellate', 'appellate court', 'appeal',
    'appellate practice', 'appellate brief', 'appellate review',
  ],
  'mediation-arbitration': [
    'mediation', 'arbitration', 'adr', 'alternative dispute resolution',
    'dispute resolution', 'mediator', 'arbitrator',
  ],
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

    let totalScore = 0
    let hitCount = 0

    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        // Longer keywords are more specific = higher weight
        // Count occurrences for frequency bonus
        const occurrences = countOccurrences(lower, keyword)
        totalScore += keyword.length * Math.min(occurrences, 3) // cap at 3x
        hitCount++
      }
    }

    if (hitCount > 0) {
      // Bonus for multiple keyword hits (breadth of evidence)
      const breadthBonus = hitCount > 1 ? hitCount * 2 : 0
      matches.push({ slug, score: totalScore + breadthBonus })
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score)

  // Return top 5 matches max
  return matches.slice(0, 5)
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0
  let pos = 0
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    count++
    pos += needle.length
  }
  return count
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== Attribute Practice Areas to Attorneys ===')
  console.log(`Mode:  ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${LIMIT || 'all'}`)
  if (STATE_FILTER) console.log(`State: ${STATE_FILTER}`)
  console.log()

  // ----------------------------------------------------------------
  // 1. Load specialties
  // ----------------------------------------------------------------
  const { data: specialtiesRaw, error: specErr } = await supabase
    .from('specialties')
    .select('id, name, slug, category')
    .eq('is_active', true)

  if (specErr || !specialtiesRaw?.length) {
    console.error('Failed to load specialties:', specErr?.message || 'no specialties found')
    process.exit(1)
  }

  const specialtiesMap = new Map<string, Specialty>()
  const specialtiesById = new Map<string, Specialty>()
  for (const s of specialtiesRaw) {
    const spec = s as Specialty
    specialtiesMap.set(spec.slug, spec)
    specialtiesById.set(spec.id, spec)
  }
  console.log(`Loaded ${specialtiesMap.size} active specialties`)

  // ----------------------------------------------------------------
  // 2. Load IDs of attorneys that already have specialty assignments
  // ----------------------------------------------------------------
  console.log('Loading already-assigned attorney IDs...')
  const assignedIds = new Set<string>()
  let assignedOffset = 0

  while (true) {
    const { data, error } = await supabase
      .from('attorney_specialties')
      .select('attorney_id')
      .range(assignedOffset, assignedOffset + 4999)

    if (error) {
      console.error('Error loading assigned IDs:', error.message)
      break
    }
    if (!data || data.length === 0) break

    for (const row of data) {
      assignedIds.add(row.attorney_id)
    }
    assignedOffset += data.length
    if (data.length < 5000) break
  }
  console.log(`  Already assigned: ${assignedIds.size.toLocaleString()} attorneys (will be skipped)`)

  // ----------------------------------------------------------------
  // 3. Load case_results specialty links (attorney_id -> specialty_id[])
  // ----------------------------------------------------------------
  console.log('Loading case_results specialty data...')
  const caseSpecialties = new Map<string, Set<string>>()
  let crOffset = 0

  while (true) {
    const { data, error } = await supabase
      .from('case_results')
      .select('attorney_id, specialty_id')
      .not('specialty_id', 'is', null)
      .range(crOffset, crOffset + 4999)

    if (error) {
      console.error('Error loading case_results:', error.message)
      break
    }
    if (!data || data.length === 0) break

    for (const row of data) {
      if (!caseSpecialties.has(row.attorney_id)) {
        caseSpecialties.set(row.attorney_id, new Set())
      }
      caseSpecialties.get(row.attorney_id)!.add(row.specialty_id)
    }
    crOffset += data.length
    if (data.length < 5000) break
  }
  console.log(`  Case results with specialty: ${caseSpecialties.size.toLocaleString()} attorneys`)

  // ----------------------------------------------------------------
  // 4. Load USPTO patent attorneys (from bar_admissions)
  // ----------------------------------------------------------------
  console.log('Loading USPTO patent attorneys...')
  const usptoAttorneyIds = new Set<string>()
  let usptoOffset = 0

  while (true) {
    const { data, error } = await supabase
      .from('bar_admissions')
      .select('attorney_id')
      .eq('state', 'US') // USPTO uses 'US' as state
      .range(usptoOffset, usptoOffset + 4999)

    if (error) {
      // Table may not have 'US' state entries — that's fine
      break
    }
    if (!data || data.length === 0) break

    for (const row of data) {
      usptoAttorneyIds.add(row.attorney_id)
    }
    usptoOffset += data.length
    if (data.length < 5000) break
  }
  console.log(`  USPTO patent attorneys: ${usptoAttorneyIds.size.toLocaleString()}`)

  // ----------------------------------------------------------------
  // 5. Load unassigned attorneys (paginated)
  // ----------------------------------------------------------------
  console.log('Loading unassigned attorneys...')
  const attorneys: AttorneyRow[] = []
  let offset = 0

  while (true) {
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

    if (!data || data.length === 0) break

    // Filter out already-assigned attorneys in memory
    for (const row of data) {
      if (!assignedIds.has(row.id)) {
        attorneys.push(row as AttorneyRow)
      }
    }

    offset += data.length
    if (data.length < BATCH_SIZE) break

    if (offset % 10000 === 0) {
      process.stdout.write(`\r  Scanning: ${offset.toLocaleString()} checked, ${attorneys.length.toLocaleString()} unassigned...`)
    }

    if (LIMIT > 0 && attorneys.length >= LIMIT) {
      attorneys.splice(LIMIT)
      break
    }
  }

  console.log(`\r  Found ${attorneys.length.toLocaleString()} unassigned attorneys (scanned ${offset.toLocaleString()} total)`)

  if (attorneys.length === 0) {
    console.log('\nNo unassigned attorneys found. Nothing to do.')
    return
  }

  // ----------------------------------------------------------------
  // 6. Match specialties for each attorney
  // ----------------------------------------------------------------
  let matchedFromCases = 0
  let matchedFromText = 0
  let matchedFromUspto = 0
  let totalUnmatched = 0
  const allInserts: SpecialtyInsert[] = []
  const matchDistribution = new Map<string, number>()

  const patentSpec = specialtiesMap.get('patent')
  const ipSpec = specialtiesMap.get('intellectual-property')

  for (const a of attorneys) {
    const inserts: SpecialtyInsert[] = []

    // --- Source A: case_results (highest confidence) ---
    const caseSpecs = caseSpecialties.get(a.id)
    if (caseSpecs && caseSpecs.size > 0) {
      let first = true
      for (const specId of caseSpecs) {
        if (specialtiesById.has(specId)) {
          inserts.push({
            attorney_id: a.id,
            specialty_id: specId,
            is_primary: first,
          })
          const spec = specialtiesById.get(specId)!
          matchDistribution.set(spec.slug, (matchDistribution.get(spec.slug) || 0) + 1)
          first = false
        }
      }
      if (inserts.length > 0) {
        matchedFromCases++
        allInserts.push(...inserts)
        continue // case_results is authoritative, skip text matching
      }
    }

    // --- Source B: text fields (keyword matching) ---
    const parts: string[] = []
    if (a.description) parts.push(a.description)
    if (a.bio) parts.push(a.bio)
    if (a.tagline) parts.push(a.tagline)
    if (a.firm_name) parts.push(a.firm_name)

    const combinedText = parts.join(' ')

    if (combinedText.trim().length >= 5) {
      const matches = matchSpecialties(combinedText, specialtiesMap)

      if (matches.length > 0) {
        matchedFromText++
        for (let i = 0; i < matches.length; i++) {
          const match = matches[i]
          const specialty = specialtiesMap.get(match.slug)
          if (!specialty) continue

          inserts.push({
            attorney_id: a.id,
            specialty_id: specialty.id,
            is_primary: i === 0,
          })
          matchDistribution.set(match.slug, (matchDistribution.get(match.slug) || 0) + 1)
        }
        allInserts.push(...inserts)
        continue
      }
    }

    // --- Source C: USPTO patent attorneys ---
    if (usptoAttorneyIds.has(a.id) && patentSpec) {
      matchedFromUspto++
      const patentInsert: SpecialtyInsert = {
        attorney_id: a.id,
        specialty_id: patentSpec.id,
        is_primary: true,
      }
      allInserts.push(patentInsert)
      matchDistribution.set('patent', (matchDistribution.get('patent') || 0) + 1)

      // Also add Intellectual Property as secondary
      if (ipSpec) {
        allInserts.push({
          attorney_id: a.id,
          specialty_id: ipSpec.id,
          is_primary: false,
        })
        matchDistribution.set('intellectual-property', (matchDistribution.get('intellectual-property') || 0) + 1)
      }
      continue
    }

    // --- No match ---
    totalUnmatched++
  }

  const totalMatched = matchedFromCases + matchedFromText + matchedFromUspto

  // ----------------------------------------------------------------
  // 7. Report
  // ----------------------------------------------------------------
  console.log(`\n=== MATCHING RESULTS ===`)
  console.log(`Unassigned attorneys analyzed: ${attorneys.length.toLocaleString()}`)
  console.log(`Matched total:    ${totalMatched.toLocaleString()} (${((totalMatched / attorneys.length) * 100).toFixed(1)}%)`)
  console.log(`  From case_results: ${matchedFromCases.toLocaleString()}`)
  console.log(`  From text fields:  ${matchedFromText.toLocaleString()}`)
  console.log(`  From USPTO/patent: ${matchedFromUspto.toLocaleString()}`)
  console.log(`Unmatched:        ${totalUnmatched.toLocaleString()} (${((totalUnmatched / attorneys.length) * 100).toFixed(1)}%)`)
  console.log(`Total rows to insert: ${allInserts.length.toLocaleString()}`)

  // Top specialties
  console.log('\n--- Top 25 matched specialties ---')
  const sorted = Array.from(matchDistribution.entries()).sort((a, b) => b[1] - a[1])
  for (const [slug, count] of sorted.slice(0, 25)) {
    const spec = specialtiesMap.get(slug)
    console.log(`  ${(spec?.name || slug).padEnd(30)} ${count.toLocaleString()}`)
  }

  // ----------------------------------------------------------------
  // 8. Dry run sample
  // ----------------------------------------------------------------
  if (DRY_RUN) {
    console.log('\n--- DRY RUN: first 10 sample assignments ---')
    const seen = new Set<string>()
    let shown = 0

    for (const ins of allInserts) {
      if (seen.has(ins.attorney_id)) continue
      seen.add(ins.attorney_id)

      const att = attorneys.find(a => a.id === ins.attorney_id)
      if (!att) continue

      const assignments = allInserts.filter(i => i.attorney_id === ins.attorney_id)
      console.log(`\n  ${att.name} (${att.bar_state || '??'}):`)
      for (const assign of assignments) {
        const spec = specialtiesById.get(assign.specialty_id)
        console.log(`    ${assign.is_primary ? '[PRIMARY]' : '         '} ${spec?.name || '?'}`)
      }

      shown++
      if (shown >= 10) break
    }
    console.log('\nDry run complete. No data written.')
    return
  }

  if (allInserts.length === 0) {
    console.log('\nNo new assignments to insert.')
    return
  }

  // ----------------------------------------------------------------
  // 9. Insert attorney_specialties in batches
  // ----------------------------------------------------------------
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

    if ((i / UPSERT_BATCH) % 50 === 0 || i + UPSERT_BATCH >= allInserts.length) {
      const pct = Math.min(100, Math.round(((i + batch.length) / allInserts.length) * 100))
      process.stdout.write(`\r  ${pct}% -- ${inserted.toLocaleString()} inserted, ${insertErrors} errors`)
    }
  }

  // ----------------------------------------------------------------
  // 10. Set primary_specialty_id on attorneys where null
  // ----------------------------------------------------------------
  console.log('\n\nSetting primary_specialty_id for attorneys...')
  const primaryAssignments = allInserts.filter(m => m.is_primary)
  let primaryUpdated = 0
  let primarySkipped = 0

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
      else primarySkipped++
    }

    if ((i / 50) % 20 === 0) {
      process.stdout.write(`\r  ${primaryUpdated} updated...`)
    }
  }

  console.log(`\r  Updated primary_specialty_id: ${primaryUpdated}, skipped: ${primarySkipped}`)

  // ----------------------------------------------------------------
  // 11. Final count
  // ----------------------------------------------------------------
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
