/**
 * Scraping de numeros de PORTABLE (06/07) pour artisans sans telephone
 *
 * Strategie:
 *   1. PagesJaunes par nom d'artisan (1 credit ScraperAPI)
 *   2. Google Search fallback (1 credit ScraperAPI)
 *
 * Politique anti-doublon:
 *   - Pre-charge TOUS les telephones existants en base
 *   - Track les numeros assignes dans la session
 *   - Un numero ne peut etre assigne qu'a UN SEUL artisan
 *
 * Filtrage strict:
 *   - SEULS les numeros 06/07 sont acceptes (portables)
 *   - Les fixes (01-05, 09) et speciaux (08) sont ignores
 *
 * Usage:
 *   npx tsx scripts/scrape-mobile-phones.ts                    # Lancer
 *   npx tsx scripts/scrape-mobile-phones.ts --resume           # Reprendre
 *   npx tsx scripts/scrape-mobile-phones.ts --dept 13          # Un seul dept
 *   npx tsx scripts/scrape-mobile-phones.ts --test             # Test 10 artisans
 *   npx tsx scripts/scrape-mobile-phones.ts --workers 10       # 10 workers
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dns from 'dns'
import * as dotenv from 'dotenv'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Force Google DNS to avoid local DNS failures
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])

// ============================================
// CONFIG
// ============================================

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const DEFAULT_WORKERS = 5
const DELAY_BETWEEN_REQUESTS_MS = 1500
const SCRAPER_TIMEOUT_MS = 60000
const MAX_RETRIES = 2
const MATCH_THRESHOLD = 0.5
const BATCH_SIZE = 500

const DATA_DIR = path.join(__dirname, '.mobile-data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

// Instance ID for multi-agent runs (separate progress files)
const INSTANCE_ID = (() => {
  const idx = process.argv.indexOf('--instance')
  return idx >= 0 ? process.argv[idx + 1] : null
})()
const PROGRESS_FILE = path.join(DATA_DIR, INSTANCE_ID ? `progress-${INSTANCE_ID}.json` : 'progress.json')

// ============================================
// DEPARTMENTS
// ============================================

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
  '06':'Alpes-Maritimes','07':'Ardeche','08':'Ardennes','09':'Ariege','10':'Aube',
  '11':'Aude','12':'Aveyron','13':'Bouches-du-Rhone','14':'Calvados','15':'Cantal',
  '16':'Charente','17':'Charente-Maritime','18':'Cher','19':'Correze','2A':'Corse-du-Sud',
  '2B':'Haute-Corse','21':'Cote-d\'Or','22':'Cotes-d\'Armor','23':'Creuse','24':'Dordogne',
  '25':'Doubs','26':'Drome','27':'Eure','28':'Eure-et-Loir','29':'Finistere',
  '30':'Gard','31':'Haute-Garonne','32':'Gers','33':'Gironde','34':'Herault',
  '35':'Ille-et-Vilaine','36':'Indre','37':'Indre-et-Loire','38':'Isere','39':'Jura',
  '40':'Landes','41':'Loir-et-Cher','42':'Loire','43':'Haute-Loire','44':'Loire-Atlantique',
  '45':'Loiret','46':'Lot','47':'Lot-et-Garonne','48':'Lozere','49':'Maine-et-Loire',
  '50':'Manche','51':'Marne','52':'Haute-Marne','53':'Mayenne','54':'Meurthe-et-Moselle',
  '55':'Meuse','56':'Morbihan','57':'Moselle','58':'Nievre','59':'Nord',
  '60':'Oise','61':'Orne','62':'Pas-de-Calais','63':'Puy-de-Dome','64':'Pyrenees-Atlantiques',
  '65':'Hautes-Pyrenees','66':'Pyrenees-Orientales','67':'Bas-Rhin','68':'Haut-Rhin','69':'Rhone',
  '70':'Haute-Saone','71':'Saone-et-Loire','72':'Sarthe','73':'Savoie','74':'Haute-Savoie',
  '75':'Paris','76':'Seine-Maritime','77':'Seine-et-Marne','78':'Yvelines','79':'Deux-Sevres',
  '80':'Somme','81':'Tarn','82':'Tarn-et-Garonne','83':'Var','84':'Vaucluse',
  '85':'Vendee','86':'Vienne','87':'Haute-Vienne','88':'Vosges','89':'Yonne',
  '90':'Territoire de Belfort','91':'Essonne','92':'Hauts-de-Seine','93':'Seine-Saint-Denis',
  '94':'Val-de-Marne','95':'Val-d\'Oise',
}

// ============================================
// STATE
// ============================================

let shuttingDown = false
let startTime = Date.now()

const stats = {
  searched: 0,
  mobilesFound: 0,
  updated: 0,
  skippedNoName: 0,
  skippedFixeOnly: 0,
  phoneDedups: 0,
  errors: 0,
  creditsUsed: 0,
  pjHits: 0,
  googleHits: 0,
}

// Anti-doublon: tous les telephones existants + assignes dans cette session
const existingPhones = new Set<string>()
const sessionPhones = new Set<string>()

interface Artisan {
  id: string
  name: string
  address_postal_code: string | null
  address_department: string
  address_city: string | null
  siret: string | null
}

// ============================================
// HELPERS
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h${m % 60}m`
  if (m > 0) return `${m}m${s % 60}s`
  return `${s}s`
}

function fmt(n: number): string { return n.toLocaleString('fr-FR') }

/**
 * Normalise un numero et REJETTE tout sauf les portables (06/07)
 */
function normalizeMobile(raw: string): string | null {
  if (!raw) return null
  let cleaned = raw.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+33')) cleaned = '0' + cleaned.substring(3)
  if (cleaned.startsWith('0033')) cleaned = '0' + cleaned.substring(4)
  if (!/^0[67]\d{8}$/.test(cleaned)) return null
  return cleaned
}

/**
 * Normalise un numero (tous types) pour le dedup
 */
function normalizeAnyPhone(raw: string): string | null {
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
  const tA = new Set(a.split(' ').filter(t => t.length > 1))
  const tB = new Set(b.split(' ').filter(t => t.length > 1))
  if (tA.size === 0 || tB.size === 0) return 0
  let overlap = 0
  tA.forEach(t => { if (tB.has(t)) overlap++ })
  const union = new Set(Array.from(tA).concat(Array.from(tB)))
  return overlap / union.size
}

function decodeHtml(s: string): string {
  return s.replace(/&#039;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
}

function isPhoneSafe(phone: string): boolean {
  return !existingPhones.has(phone) && !sessionPhones.has(phone)
}

function markPhoneUsed(phone: string): void {
  sessionPhones.add(phone)
  existingPhones.add(phone)
}

function isSearchable(name: string): boolean {
  const norm = normalizeName(name)
  if (norm.length < 3) return false
  if (/^(sarl|sas|sa|eurl|sasu|eirl|ei)$/i.test(norm)) return false
  const words = norm.split(' ').filter(w => w.length > 2)
  return words.length > 0
}

// ============================================
// SOURCE 1: PagesJaunes par nom
// ============================================

async function searchPJ(name: string, location: string, retry = 0): Promise<string[]> {
  const cleanName = name
    .replace(/\b(SARL|SAS|SA|EURL|SASU|EIRL|EI|SCI|SNC|SCOP)\b/gi, '')
    .replace(/\([^)]*\)/g, '')
    .trim()

  const url = `https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=${encodeURIComponent(cleanName)}&ou=${encodeURIComponent(location)}`
  const scraperUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`

  try {
    const response = await fetch(scraperUrl, { signal: AbortSignal.timeout(SCRAPER_TIMEOUT_MS) })
    stats.creditsUsed++

    if (response.status === 429) {
      if (retry < MAX_RETRIES) { await sleep(10000); return searchPJ(name, location, retry + 1) }
      return []
    }
    if (response.status === 500) {
      if (retry < MAX_RETRIES) { await sleep(5000); return searchPJ(name, location, retry + 1) }
      return []
    }
    if (response.status >= 400) return []

    const html = await response.text()

    if (html.length < 5000 && (html.includes('datadome') || html.includes('DataDome'))) {
      if (retry < MAX_RETRIES) { await sleep(15000); return searchPJ(name, location, retry + 1) }
      return []
    }

    return extractMobilesFromPJ(html)
  } catch (err: any) {
    stats.errors++
    if (retry < MAX_RETRIES) { await sleep(3000); return searchPJ(name, location, retry + 1) }
    return []
  }
}

function extractMobilesFromPJ(html: string): string[] {
  const mobiles: string[] = []
  const seen = new Set<string>()

  // Methode 1: tel: links
  const telMatches = html.match(/href="tel:([^"]+)"/g) || []
  for (const m of telMatches) {
    const num = m.match(/tel:([^"]+)/)?.[1]
    if (num) {
      const mobile = normalizeMobile(num)
      if (mobile && !seen.has(mobile)) { seen.add(mobile); mobiles.push(mobile) }
    }
  }

  // Methode 2: Phone patterns in HTML
  const phonePattern = /(0[67])[\s.]?(\d{2})[\s.]?(\d{2})[\s.]?(\d{2})[\s.]?(\d{2})/g
  let match
  while ((match = phonePattern.exec(html)) !== null) {
    const raw = match[0]
    const mobile = normalizeMobile(raw)
    if (mobile && !seen.has(mobile)) { seen.add(mobile); mobiles.push(mobile) }
  }

  // Methode 3: +33 6/7 format
  const intlPattern = /\+33[\s.]?([67])[\s.]?(\d{2})[\s.]?(\d{2})[\s.]?(\d{2})[\s.]?(\d{2})/g
  while ((match = intlPattern.exec(html)) !== null) {
    const mobile = normalizeMobile(match[0])
    if (mobile && !seen.has(mobile)) { seen.add(mobile); mobiles.push(mobile) }
  }

  // Methode 4: JSON-LD telephone field
  const jsonLdRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
  let m
  while ((m = jsonLdRe.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1])
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        const listItems = item.itemListElement || [item]
        for (const li of listItems) {
          const biz = li.item || li
          if (biz.telephone) {
            const mobile = normalizeMobile(biz.telephone)
            if (mobile && !seen.has(mobile)) { seen.add(mobile); mobiles.push(mobile) }
          }
        }
      }
    } catch { /* skip */ }
  }

  return mobiles
}

// ============================================
// SOURCE 2: Google Search par nom
// ============================================

async function searchGoogle(name: string, location: string, retry = 0): Promise<string | null> {
  const cleanName = name
    .replace(/\b(SARL|SAS|SA|EURL|SASU|EIRL|EI|SCI|SNC|SCOP)\b/gi, '')
    .replace(/\([^)]*\)/g, '')
    .trim()

  const query = `"${cleanName}" ${location} telephone portable`
  const url = `https://www.google.fr/search?q=${encodeURIComponent(query)}&hl=fr&gl=fr&num=5`
  const scraperUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`

  try {
    const response = await fetch(scraperUrl, { signal: AbortSignal.timeout(SCRAPER_TIMEOUT_MS) })
    stats.creditsUsed++

    if (response.status === 429) {
      if (retry < MAX_RETRIES) { await sleep(10000); return searchGoogle(name, location, retry + 1) }
      return null
    }
    if (response.status >= 400) return null

    const html = await response.text()

    // Extract mobile numbers near the business name
    const nameWords = cleanName.split(/[\s,.()\-]+/).filter(w => w.length > 2)
    if (nameWords.length === 0) return null
    const nameKey = nameWords.slice(0, 3).join('|')
    const nameRe = new RegExp(nameKey, 'i')

    // Phone patterns: only 06/07
    const mobileRe = /(0[67][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2})/g
    let pm
    while ((pm = mobileRe.exec(html)) !== null) {
      const start = Math.max(0, pm.index - 500)
      const end = Math.min(html.length, pm.index + 500)
      const ctx = html.substring(start, end)

      if (nameRe.test(ctx)) {
        const mobile = normalizeMobile(pm[1])
        if (mobile) return mobile
      }
    }

    // Also check +33 6/7 format
    const intlRe = /\+33[\s.]?([67])[\s.]?(\d{2})[\s.]?(\d{2})[\s.]?(\d{2})[\s.]?(\d{2})/g
    while ((pm = intlRe.exec(html)) !== null) {
      const start = Math.max(0, pm.index - 500)
      const end = Math.min(html.length, pm.index + 500)
      const ctx = html.substring(start, end)

      if (nameRe.test(ctx)) {
        const mobile = normalizeMobile(pm[0])
        if (mobile) return mobile
      }
    }

    return null
  } catch {
    stats.errors++
    if (retry < MAX_RETRIES) { await sleep(3000); return searchGoogle(name, location, retry + 1) }
    return null
  }
}

// ============================================
// WORKER: Traiter un artisan
// ============================================

async function processArtisan(
  artisan: Artisan,
  supabase: SupabaseClient,
  deptName: string,
): Promise<boolean> {
  if (shuttingDown) return false

  const searchName = artisan.name
  const searchLocation = artisan.address_city || deptName

  // ── Source 1: PagesJaunes par nom (1 credit) ──
  const pjMobiles = await searchPJ(searchName, searchLocation)

  if (pjMobiles.length > 0) {
    // Trouver le premier numero safe (anti-doublon)
    for (const mobile of pjMobiles) {
      if (isPhoneSafe(mobile)) {
        const { error } = await supabase
          .from('providers')
          .update({ phone: mobile })
          .eq('id', artisan.id)

        if (!error) {
          markPhoneUsed(mobile)
          stats.mobilesFound++
          stats.updated++
          stats.pjHits++
          return true
        }
      } else {
        stats.phoneDedups++
      }
    }
  }

  // Google fallback desactive — PJ suffit (89% des resultats, 1 credit/artisan)
  return false
}

// ============================================
// MAIN
// ============================================

async function main() {
  const args = process.argv.slice(2)
  const flags = {
    resume: args.includes('--resume'),
    test: args.includes('--test'),
    dept: args.includes('--dept') ? args[args.indexOf('--dept') + 1] : undefined,
    depts: args.includes('--depts') ? args[args.indexOf('--depts') + 1].split(',') : undefined,
    workers: args.includes('--workers') ? parseInt(args[args.indexOf('--workers') + 1]) : DEFAULT_WORKERS,
  }

  if (!SCRAPER_API_KEY) {
    console.error('   SCRAPER_API_KEY manquant')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  console.log('\n' + '='.repeat(60))
  console.log('  SCRAPING NUMEROS PORTABLES (06/07) — ANTI-DOUBLON')
  console.log('='.repeat(60))
  if (INSTANCE_ID) console.log(`  Instance: ${INSTANCE_ID}`)
  console.log(`  Workers: ${flags.workers}`)
  console.log(`  Sources: PagesJaunes nom -> Google nom`)
  console.log(`  Filtre: UNIQUEMENT portables 06/07`)

  // ── Pre-charger TOUS les telephones existants pour dedup ──
  console.log('  Chargement des telephones existants...')
  let phoneLoadCount = 0
  for (const dept of DEPARTEMENTS) {
    let from = 0
    while (true) {
      const { data } = await supabase
        .from('providers')
        .select('phone')
        .eq('is_active', true)
        .eq('address_department', dept)
        .not('phone', 'is', null)
        .order('id', { ascending: true })
        .range(from, from + 999)
      if (!data || data.length === 0) break
      data.forEach(d => {
        if (d.phone) {
          const norm = normalizeAnyPhone(d.phone)
          if (norm) existingPhones.add(norm)
        }
      })
      phoneLoadCount += data.length
      if (data.length < 1000) break
      from += 1000
    }
  }
  console.log(`  ${fmt(existingPhones.size)} telephones en base (anti-doublon actif)`)

  // ── Charger la progression ──
  const processedIds = new Set<string>()
  const completedDepts = new Set<string>()
  if (flags.resume && fs.existsSync(PROGRESS_FILE)) {
    const prev = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
    prev.completedDepts?.forEach((d: string) => completedDepts.add(d))
    prev.processedIds?.forEach((id: string) => processedIds.add(id))
    if (prev.stats) Object.assign(stats, prev.stats)
    console.log(`  Reprise: ${fmt(processedIds.size)} artisans, ${completedDepts.size} depts termines`)
  }
  console.log()

  // SIGINT
  process.on('SIGINT', () => {
    if (shuttingDown) process.exit(1)
    console.log('\n   Arret gracieux en cours...')
    shuttingDown = true
  })

  startTime = Date.now()
  const depts = flags.dept ? [flags.dept] : flags.depts ? flags.depts : DEPARTEMENTS

  for (const deptCode of depts) {
    if (shuttingDown) break
    if (completedDepts.has(deptCode)) continue

    const deptName = DEPT_NAMES[deptCode] || deptCode
    console.log(`\n-- ${deptName} (${deptCode}) --`)

    // Charger les artisans SANS telephone dans ce departement
    let allArtisans: Artisan[] = []
    let from = 0
    while (true) {
      const { data, error } = await supabase
        .from('providers')
        .select('id, name, address_postal_code, address_department, address_city, siret')
        .is('phone', null)
        .eq('is_active', true)
        .eq('is_artisan', true)
        .eq('address_department', deptCode)
        .order('id', { ascending: true })
        .range(from, from + BATCH_SIZE - 1)

      if (error) {
        console.log(`   DB error: ${error.message}`)
        await sleep(5000)
        break
      }
      if (!data || data.length === 0) break
      allArtisans.push(...(data as Artisan[]))
      from += BATCH_SIZE
      if (data.length < BATCH_SIZE) break
    }

    // Filtrer: deja traites + noms non-recherchables
    const artisans = allArtisans.filter(a => {
      if (processedIds.has(a.id)) return false
      if (!isSearchable(a.name)) {
        stats.skippedNoName++
        processedIds.add(a.id)
        return false
      }
      return true
    })

    console.log(`   ${fmt(artisans.length)} artisans a traiter (${fmt(allArtisans.length - artisans.length)} deja faits/ignores)`)

    if (flags.test) artisans.splice(10)

    let deptFound = 0
    let deptProcessed = 0

    // Traiter en batch avec workers concurrents
    for (let i = 0; i < artisans.length; i += flags.workers) {
      if (shuttingDown) break

      const batch = artisans.slice(i, i + flags.workers)
      const results = await Promise.allSettled(
        batch.map(artisan => processArtisan(artisan, supabase, deptName))
      )

      for (let j = 0; j < batch.length; j++) {
        processedIds.add(batch[j].id)
        stats.searched++
        deptProcessed++
        if (results[j].status === 'fulfilled' && results[j].value) {
          deptFound++
        }
      }

      // Affichage progression
      const elapsed = Date.now() - startTime
      const rate = stats.searched > 0 ? Math.round(stats.searched / (elapsed / 3600000)) : 0
      process.stdout.write(
        `   ${fmt(deptProcessed)}/${fmt(artisans.length)} | ` +
        `${fmt(stats.mobilesFound)} portables (${fmt(stats.pjHits)} PJ + ${fmt(stats.googleHits)} Google) | ` +
        `${fmt(stats.phoneDedups)} dedups | ` +
        `${rate}/h | ~${fmt(stats.creditsUsed)} cr    \r`
      )

      // Sauvegarder toutes les 50 artisans
      if (deptProcessed % 50 === 0) {
        saveProgress(processedIds, completedDepts)
      }

      await sleep(DELAY_BETWEEN_REQUESTS_MS)
    }

    const hitRate = deptProcessed > 0 ? Math.round(deptFound / deptProcessed * 100) : 0
    console.log(
      `\n   ${deptName}: ${fmt(deptProcessed)} traites -> ${fmt(deptFound)} portables trouves (${hitRate}%)    `
    )

    if (!flags.test) {
      completedDepts.add(deptCode)
      saveProgress(processedIds, completedDepts)
    }
  }

  // Sauvegarde finale
  saveProgress(processedIds, completedDepts)

  const elapsed = Date.now() - startTime
  console.log('\n' + '='.repeat(60))
  console.log('  RESUME — SCRAPING PORTABLES')
  console.log('='.repeat(60))
  console.log(`  Duree:             ${formatDuration(elapsed)}`)
  console.log(`  Artisans traites:  ${fmt(stats.searched)}`)
  console.log(`  Ignores (nom):     ${fmt(stats.skippedNoName)}`)
  console.log(`  Portables trouves: ${fmt(stats.mobilesFound)}`)
  console.log(`    PagesJaunes:     ${fmt(stats.pjHits)}`)
  console.log(`    Google:          ${fmt(stats.googleHits)}`)
  console.log(`  MAJ en base:       ${fmt(stats.updated)}`)
  console.log(`  Doublons bloques:  ${fmt(stats.phoneDedups)}`)
  console.log(`  Erreurs:           ${stats.errors}`)
  console.log(`  Credits API:       ~${fmt(stats.creditsUsed)}`)
  console.log('='.repeat(60) + '\n')
}

function saveProgress(processedIds: Set<string>, completedDepts: Set<string>) {
  const idsArr = Array.from(processedIds)
  const recentIds = idsArr.length > 100000 ? idsArr.slice(-100000) : idsArr

  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    completedDepts: Array.from(completedDepts),
    processedIds: recentIds,
    stats,
    lastSave: new Date().toISOString(),
  }))
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error('\n   Erreur fatale:', e); process.exit(1) })
