/**
 * Vérification des téléphones — Reverse lookup PagesJaunes
 *
 * Pour chaque provider avec un téléphone, cherche son NOM sur PagesJaunes
 * et vérifie que le téléphone en base correspond bien.
 *
 * Génère un rapport CSV avec les résultats :
 *   - MATCH      → PJ retourne le même téléphone pour ce nom
 *   - MISMATCH   → PJ retourne un AUTRE téléphone pour ce nom
 *   - NOT_FOUND  → PJ ne trouve pas ce nom (inconclusif)
 *   - NO_PHONE   → PJ trouve le nom mais sans téléphone
 *
 * Usage:
 *   npx tsx scripts/verify-phones.ts                     # Tous les depts, sample 50/dept
 *   npx tsx scripts/verify-phones.ts --dept 13           # Un seul département
 *   npx tsx scripts/verify-phones.ts --sample 100        # 100 par département
 *   npx tsx scripts/verify-phones.ts --full              # Tous les providers (lent + cher)
 *   npx tsx scripts/verify-phones.ts --fix               # Met à NULL les mismatches
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// ============================================
// CONFIG
// ============================================

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const DELAY_MS = 1500
const SCRAPER_TIMEOUT_MS = 60000
const MAX_RETRIES = 2
const DEFAULT_SAMPLE = 50 // providers per department
const WORKERS = 5

const OUT_DIR = path.join(__dirname, '.verify-data')
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

const REPORT_FILE = path.join(OUT_DIR, `verify-report-${new Date().toISOString().slice(0, 10)}.csv`)
const SUMMARY_FILE = path.join(OUT_DIR, `verify-summary-${new Date().toISOString().slice(0, 10)}.json`)

const DEPARTEMENTS = [
  '01','02','03','04','05','06','07','08','09','10',
  '11','12','13','14','15','16','17','18','19','2A',
  '2B','21','22','23','24','25','26','27','28','29',
  '30','31','32','33','34','35','36','37','38','39',
  '40','41','42','43','44','45','46','47','48','49',
  '50','51','52','53','54','55','56','57','58','59',
  '60','61','62','63','64','65','66','67','68','69',
  '70','71','72','73','74','75','76','77','78','79',
  '80','81','82','83','84','85','86','87','88','89',
  '90','91','92','93','94','95',
]

const DEPT_NAMES: Record<string, string> = {
  '01':'Ain','02':'Aisne','03':'Allier','04':'Alpes-de-Haute-Provence','05':'Hautes-Alpes',
  '06':'Alpes-Maritimes','07':'Ardèche','08':'Ardennes','09':'Ariège','10':'Aube',
  '11':'Aude','12':'Aveyron','13':'Bouches-du-Rhône','14':'Calvados','15':'Cantal',
  '16':'Charente','17':'Charente-Maritime','18':'Cher','19':'Corrèze','2A':'Corse-du-Sud',
  '2B':'Haute-Corse','21':'Côte-d\'Or','22':'Côtes-d\'Armor','23':'Creuse','24':'Dordogne',
  '25':'Doubs','26':'Drôme','27':'Eure','28':'Eure-et-Loir','29':'Finistère',
  '30':'Gard','31':'Haute-Garonne','32':'Gers','33':'Gironde','34':'Hérault',
  '35':'Ille-et-Vilaine','36':'Indre','37':'Indre-et-Loire','38':'Isère','39':'Jura',
  '40':'Landes','41':'Loir-et-Cher','42':'Loire','43':'Haute-Loire','44':'Loire-Atlantique',
  '45':'Loiret','46':'Lot','47':'Lot-et-Garonne','48':'Lozère','49':'Maine-et-Loire',
  '50':'Manche','51':'Marne','52':'Haute-Marne','53':'Mayenne','54':'Meurthe-et-Moselle',
  '55':'Meuse','56':'Morbihan','57':'Moselle','58':'Nièvre','59':'Nord',
  '60':'Oise','61':'Orne','62':'Pas-de-Calais','63':'Puy-de-Dôme','64':'Pyrénées-Atlantiques',
  '65':'Hautes-Pyrénées','66':'Pyrénées-Orientales','67':'Bas-Rhin','68':'Haut-Rhin','69':'Rhône',
  '70':'Haute-Saône','71':'Saône-et-Loire','72':'Sarthe','73':'Savoie','74':'Haute-Savoie',
  '75':'Paris','76':'Seine-Maritime','77':'Seine-et-Marne','78':'Yvelines','79':'Deux-Sèvres',
  '80':'Somme','81':'Tarn','82':'Tarn-et-Garonne','83':'Var','84':'Vaucluse',
  '85':'Vendée','86':'Vienne','87':'Haute-Vienne','88':'Vosges','89':'Yonne',
  '90':'Territoire de Belfort','91':'Essonne','92':'Hauts-de-Seine','93':'Seine-Saint-Denis',
  '94':'Val-de-Marne','95':'Val-d\'Oise',
}

// ============================================
// TYPES
// ============================================

interface Provider {
  id: string
  name: string
  phone: string
  address_department: string
  address_city: string | null
  specialty: string | null
  siret: string | null
}

type VerifyResult = 'MATCH' | 'MISMATCH' | 'NOT_FOUND' | 'NO_PHONE' | 'ERROR'

interface VerifyRecord {
  provider_id: string
  provider_name: string
  db_phone: string
  department: string
  city: string
  specialty: string
  result: VerifyResult
  pj_name: string
  pj_phone: string
  name_similarity: number
}

// ============================================
// HELPERS
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function normalizePhone(raw: string): string | null {
  if (!raw) return null
  let cleaned = raw.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+33')) cleaned = '0' + cleaned.substring(3)
  if (cleaned.startsWith('0033')) cleaned = '0' + cleaned.substring(4)
  if (!/^0[1-9]\d{8}$/.test(cleaned)) return null
  return cleaned
}

function normalizeName(name: string): string {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(sarl|sas|sa|eurl|sasu|eirl|ei|auto[- ]?entrepreneur|micro[- ]?entreprise|ets|entreprise|societe|ste|monsieur|madame|m\.|mme)\b/gi, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ').trim()
}

function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a)
  const nb = normalizeName(b)
  // Jaccard on tokens
  const tA = new Set(na.split(' ').filter(t => t.length > 1))
  const tB = new Set(nb.split(' ').filter(t => t.length > 1))
  if (tA.size === 0 || tB.size === 0) return 0
  let overlap = 0
  tA.forEach(t => { if (tB.has(t)) overlap++ })
  const union = new Set([...tA, ...tB])
  return overlap / union.size
}

function decodeHtml(s: string): string {
  return s
    .replace(/&#039;/g, "'").replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
}

// ============================================
// PAGESJAUNES SEARCH
// ============================================

interface PJResult {
  name: string
  phone: string | null
  city?: string
}

function parsePJResults(html: string): PJResult[] {
  const results: PJResult[] = []

  // From HTML blocks
  const blocks = html.split(/class="bi-denomination/)
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i]
    const nameMatch = block.match(/<h3[^>]*>\s*([^<]+)\s*<\/h3>/)
    if (!nameMatch) continue
    const name = decodeHtml(nameMatch[1].trim())
    if (!name || name.length < 2) continue

    const searchArea = block.substring(0, 5000)
    let phone: string | null = null

    const telMatch = searchArea.match(/href="tel:([^"]+)"/)
    if (telMatch) phone = normalizePhone(telMatch[1])

    if (!phone) {
      const phoneMatches = searchArea.match(/(0[1-9][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2})/g)
      if (phoneMatches) {
        for (const p of phoneMatches) {
          const normalized = normalizePhone(p)
          if (normalized) { phone = normalized; break }
        }
      }
    }

    const cityMatch = searchArea.match(/bi-address-city[^>]*>([^<]+)/)
    const city = cityMatch ? cityMatch[1].trim() : undefined

    results.push({ name, phone, city })
  }

  // JSON-LD
  const jsonLdRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
  let m
  while ((m = jsonLdRe.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1])
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        if (item.name) {
          results.push({
            name: decodeHtml(item.name),
            phone: item.telephone ? normalizePhone(item.telephone) : null,
            city: item.address?.addressLocality,
          })
        }
      }
    } catch { /* skip */ }
  }

  return results
}

async function searchPJ(name: string, location: string, retry = 0): Promise<PJResult[]> {
  const cleanName = name
    .replace(/\b(SARL|SAS|SA|EURL|SASU|EIRL|EI|SCI|SNC|SCOP)\b/gi, '')
    .replace(/\([^)]*\)/g, '')
    .trim()

  const url = `https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=${encodeURIComponent(cleanName)}&ou=${encodeURIComponent(location)}`
  const scraperUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`

  try {
    const response = await fetch(scraperUrl, { signal: AbortSignal.timeout(SCRAPER_TIMEOUT_MS) })
    if (response.status === 429) {
      if (retry < MAX_RETRIES) { await sleep(10000); return searchPJ(name, location, retry + 1) }
      return []
    }
    if (response.status >= 400) return []

    const html = await response.text()
    if (html.length < 5000 && (html.includes('datadome') || html.includes('DataDome'))) {
      if (retry < MAX_RETRIES) { await sleep(15000); return searchPJ(name, location, retry + 1) }
      return []
    }

    return parsePJResults(html)
  } catch {
    if (retry < MAX_RETRIES) { await sleep(3000); return searchPJ(name, location, retry + 1) }
    return []
  }
}

// ============================================
// VERIFY ONE PROVIDER
// ============================================

async function verifyProvider(provider: Provider): Promise<VerifyRecord> {
  const deptName = DEPT_NAMES[provider.address_department] || provider.address_department
  const location = provider.address_city || deptName

  const record: VerifyRecord = {
    provider_id: provider.id,
    provider_name: provider.name,
    db_phone: provider.phone,
    department: provider.address_department,
    city: provider.address_city || '',
    specialty: provider.specialty || '',
    result: 'ERROR',
    pj_name: '',
    pj_phone: '',
    name_similarity: 0,
  }

  try {
    const pjResults = await searchPJ(provider.name, location)

    if (pjResults.length === 0) {
      record.result = 'NOT_FOUND'
      return record
    }

    // Strategy 1: Check if any PJ result has the SAME phone as DB
    for (const pj of pjResults) {
      if (pj.phone === provider.phone) {
        const sim = nameSimilarity(provider.name, pj.name)
        record.result = 'MATCH'
        record.pj_name = pj.name
        record.pj_phone = pj.phone
        record.name_similarity = sim
        return record
      }
    }

    // Strategy 2: Find the PJ result with the best name match
    let bestSim = 0
    let bestPJ: PJResult | null = null
    for (const pj of pjResults) {
      const sim = nameSimilarity(provider.name, pj.name)
      if (sim > bestSim) {
        bestSim = sim
        bestPJ = pj
      }
    }

    if (bestPJ && bestSim >= 0.3) {
      record.pj_name = bestPJ.name
      record.pj_phone = bestPJ.phone || ''
      record.name_similarity = bestSim

      if (bestPJ.phone && bestPJ.phone !== provider.phone) {
        // PJ found a good name match but with a DIFFERENT phone
        record.result = 'MISMATCH'
      } else if (!bestPJ.phone) {
        record.result = 'NO_PHONE'
      } else {
        record.result = 'MATCH'
      }
    } else {
      // No good name match found — could be a completely wrong assignment
      // Report the best we found
      if (bestPJ) {
        record.pj_name = bestPJ.name
        record.pj_phone = bestPJ.phone || ''
        record.name_similarity = bestSim
      }
      record.result = 'NOT_FOUND'
    }

    return record
  } catch {
    record.result = 'ERROR'
    return record
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  const args = process.argv.slice(2)
  const flags = {
    dept: args.includes('--dept') ? args[args.indexOf('--dept') + 1] : undefined,
    sample: args.includes('--sample') ? parseInt(args[args.indexOf('--sample') + 1]) : DEFAULT_SAMPLE,
    full: args.includes('--full'),
    fix: args.includes('--fix'),
  }

  if (!SCRAPER_API_KEY) {
    console.error('SCRAPER_API_KEY manquant dans .env.local')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  console.log('\n' + '='.repeat(60))
  console.log('  VERIFICATION DES TELEPHONES — REVERSE LOOKUP PJ')
  console.log('='.repeat(60))
  console.log(`  Sample: ${flags.full ? 'TOUS' : flags.sample + '/dept'}`)
  console.log(`  Fix mode: ${flags.fix ? 'OUI — les mismatches seront mis à NULL' : 'NON — rapport seulement'}`)
  console.log(`  Rapport: ${REPORT_FILE}`)
  console.log()

  // CSV header
  fs.writeFileSync(REPORT_FILE,
    'result,provider_id,provider_name,db_phone,pj_name,pj_phone,name_similarity,department,city,specialty\n'
  )

  const depts = flags.dept ? [flags.dept] : DEPARTEMENTS
  const totals = { match: 0, mismatch: 0, not_found: 0, no_phone: 0, error: 0, total: 0 }
  const mismatchIds: string[] = []
  let creditsUsed = 0
  const startTime = Date.now()

  for (const deptCode of depts) {
    const deptName = DEPT_NAMES[deptCode] || deptCode

    // Fetch providers with phones in this department
    let query = supabase
      .from('providers')
      .select('id, name, phone, address_department, address_city, specialty, siret')
      .eq('address_department', deptCode)
      .eq('is_active', true)
      .not('phone', 'is', null)

    if (!flags.full) {
      query = query.limit(flags.sample)
    }

    const { data: providers, error } = await query

    if (error || !providers || providers.length === 0) {
      if (error) console.log(`  ⚠ ${deptName}: ${error.message}`)
      continue
    }

    console.log(`── ${deptName} (${deptCode}) — ${providers.length} providers à vérifier`)

    let deptMatch = 0, deptMismatch = 0, deptNotFound = 0
    let processed = 0

    // Process in batches of WORKERS
    for (let i = 0; i < providers.length; i += WORKERS) {
      const batch = providers.slice(i, i + WORKERS) as Provider[]
      const results = await Promise.allSettled(
        batch.map(p => verifyProvider(p))
      )

      for (const res of results) {
        if (res.status !== 'fulfilled') {
          totals.error++
          continue
        }
        const rec = res.value
        totals.total++
        processed++
        creditsUsed += 5

        // Count
        switch (rec.result) {
          case 'MATCH': totals.match++; deptMatch++; break
          case 'MISMATCH': totals.mismatch++; deptMismatch++; mismatchIds.push(rec.provider_id); break
          case 'NOT_FOUND': totals.not_found++; deptNotFound++; break
          case 'NO_PHONE': totals.no_phone++; break
          case 'ERROR': totals.error++; break
        }

        // Write CSV line
        const csvLine = [
          rec.result,
          rec.provider_id,
          `"${rec.provider_name.replace(/"/g, '""')}"`,
          rec.db_phone,
          `"${rec.pj_name.replace(/"/g, '""')}"`,
          rec.pj_phone,
          rec.name_similarity.toFixed(2),
          rec.department,
          `"${rec.city.replace(/"/g, '""')}"`,
          `"${rec.specialty.replace(/"/g, '""')}"`,
        ].join(',')
        fs.appendFileSync(REPORT_FILE, csvLine + '\n')

        // Log mismatches immediately
        if (rec.result === 'MISMATCH') {
          console.log(`   ❌ MISMATCH: "${rec.provider_name}" DB:${rec.db_phone} ≠ PJ:${rec.pj_phone} ("${rec.pj_name}" sim:${rec.name_similarity.toFixed(2)})`)
        }
      }

      // Progress
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
      process.stdout.write(
        `   ${processed}/${providers.length} | ✅${deptMatch} ❌${deptMismatch} ❓${deptNotFound} | ${elapsed}s ~${creditsUsed}cr   \r`
      )

      await sleep(DELAY_MS)
    }

    const pct = processed > 0 ? Math.round(deptMatch / processed * 100) : 0
    console.log(`   ✓ ${deptName}: ${processed} vérifiés — ✅${deptMatch} (${pct}%) ❌${deptMismatch} ❓${deptNotFound}         `)
  }

  // Fix mode: set mismatched phones to NULL
  if (flags.fix && mismatchIds.length > 0) {
    console.log(`\n  🔧 FIX: Mise à NULL de ${mismatchIds.length} téléphones incorrects...`)
    let fixed = 0
    for (const id of mismatchIds) {
      const { error } = await supabase
        .from('providers')
        .update({ phone: null })
        .eq('id', id)
      if (!error) fixed++
    }
    console.log(`  → ${fixed}/${mismatchIds.length} téléphones supprimés`)
  }

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
  const matchRate = totals.total > 0 ? Math.round(totals.match / totals.total * 100) : 0
  const mismatchRate = totals.total > 0 ? Math.round(totals.mismatch / totals.total * 100) : 0

  const summary = {
    date: new Date().toISOString(),
    total_verified: totals.total,
    match: totals.match,
    mismatch: totals.mismatch,
    not_found: totals.not_found,
    no_phone: totals.no_phone,
    errors: totals.error,
    match_rate_pct: matchRate,
    mismatch_rate_pct: mismatchRate,
    credits_used: creditsUsed,
    duration_min: parseFloat(elapsed),
    mismatch_ids: mismatchIds,
    fix_applied: flags.fix,
  }
  fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2))

  console.log('\n' + '='.repeat(60))
  console.log('  RÉSUMÉ VÉRIFICATION')
  console.log('='.repeat(60))
  console.log(`  Total vérifiés:  ${totals.total}`)
  console.log(`  ✅ MATCH:        ${totals.match} (${matchRate}%) — téléphone confirmé`)
  console.log(`  ❌ MISMATCH:     ${totals.mismatch} (${mismatchRate}%) — MAUVAIS téléphone`)
  console.log(`  ❓ NOT_FOUND:    ${totals.not_found} — artisan pas trouvé sur PJ`)
  console.log(`  📞 NO_PHONE:     ${totals.no_phone} — trouvé sur PJ mais sans tél`)
  console.log(`  ⚠ ERRORS:       ${totals.error}`)
  console.log(`  ─────────────────────────────`)
  console.log(`  Crédits API:     ~${creditsUsed}`)
  console.log(`  Durée:           ${elapsed} min`)
  console.log(`  Rapport CSV:     ${REPORT_FILE}`)
  console.log(`  Résumé JSON:     ${SUMMARY_FILE}`)
  if (flags.fix) {
    console.log(`  🔧 FIX appliqué: ${mismatchIds.length} téléphones mis à NULL`)
  } else if (mismatchIds.length > 0) {
    console.log(`\n  → Pour corriger: npx tsx scripts/verify-phones.ts --fix`)
  }
  console.log('='.repeat(60) + '\n')
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error('Erreur fatale:', e); process.exit(1) })
