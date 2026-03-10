/**
 * SCRAPE PHONES LEAN V2 — Google Search, Max Throughput
 *
 * 100 workers paralleles (concurrency limit ScraperAPI = 200).
 * 1 seule requete Google par artisan = 1 credit.
 * Zero delay entre requetes — le bottleneck est le RTT ScraperAPI (~3s).
 * Tous departements en parallele via une queue globale.
 *
 * Usage:
 *   npx tsx scripts/scrape-phones-lean.ts                     # Lancer (100 workers)
 *   npx tsx scripts/scrape-phones-lean.ts --resume            # Reprendre
 *   npx tsx scripts/scrape-phones-lean.ts --workers 50        # Custom workers
 *   npx tsx scripts/scrape-phones-lean.ts --dept 13           # Un dept
 *   npx tsx scripts/scrape-phones-lean.ts --depts 13,69,75    # Plusieurs
 *   npx tsx scripts/scrape-phones-lean.ts --test              # Test 50 artisans
 *   npx tsx scripts/scrape-phones-lean.ts --limit 50000       # Max artisans
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { Pool as PgPool } from 'pg'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// ════════════════════════════
// CONFIG
// ════════════════════════════

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY
const PG_URL = process.env.SUPABASE_DB_URL || 'postgresql://postgres:BEB6LnGlT6U9bkTe@db.umjmbdbwcsxrvfqktiui.supabase.co:5432/postgres'

const DEFAULT_WORKERS = 100
const SCRAPER_TIMEOUT_MS = 30000
const MAX_CONCURRENT = 180      // Hard cap on simultaneous HTTP requests (ScraperAPI limit = 200)
const MAX_RETRIES = 0           // No retries — move on fast
const BATCH_SIZE = 5000         // Big batches to keep queue fed
const SAVE_INTERVAL = 500       // Save progress every N searches
const LOG_INTERVAL = 100        // Print status every N searches

const DATA_DIR = path.join(__dirname, '.lean-data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json')
const LOG_FILE = path.join(DATA_DIR, 'found-phones.jsonl')

const DEPT_ORDER = [
  '13','69','75','33','31','59','06','34','44','35','67','57','76','38','42',
  '83','92','93','94','91','77','78','95','62','45','37','49','14','29','56',
  '30','84','17','64','86','87','24','47','16','79','36','23','19','15','48',
  '01','02','03','04','05','07','08','09','10','11','12','18','21','22','25',
  '26','27','28','32','39','40','41','43','46','50','51','52','53','54','55',
  '58','60','61','63','65','66','68','70','71','72','73','74','80','81','82',
  '85','88','89','90','2A','2B',
]

// ════════════════════════════
// STATE
// ════════════════════════════

let shuttingDown = false
const startTime = Date.now()
const knownPhones = new Set<string>()
const processedIds = new Set<string>()
const completedDepts = new Set<string>()

const stats = {
  searched: 0,
  phonesFound: 0,
  updated: 0,
  skippedName: 0,
  skippedDedup: 0,
  errors: 0,
  creditsUsed: 0,
  rateLimits: 0,
}

// Semaphore — limits concurrent HTTP requests to MAX_CONCURRENT
let activeRequests = 0
const semaphoreQueue: (() => void)[] = []
function acquireSemaphore(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT) { activeRequests++; return Promise.resolve() }
  return new Promise(resolve => semaphoreQueue.push(() => { activeRequests++; resolve() }))
}
function releaseSemaphore() {
  activeRequests--
  if (semaphoreQueue.length > 0) { const next = semaphoreQueue.shift()!; next() }
}

// Global queue
let queue: Provider[] = []
let queueIdx = 0
let queueDepleted = false

// ════════════════════════════
// HELPERS
// ════════════════════════════

function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)) }
function fmt(n: number): string { return n.toLocaleString('fr-FR') }
function elapsed(): string {
  const s = Math.floor((Date.now() - startTime) / 1000)
  const m = Math.floor(s / 60); const h = Math.floor(m / 60)
  return h > 0 ? `${h}h${String(m % 60).padStart(2, '0')}m` : `${m}m${String(s % 60).padStart(2, '0')}s`
}

function normalizePhone(raw: string): string | null {
  if (!raw) return null
  let c = raw.replace(/[^\d+]/g, '')
  if (c.startsWith('+33')) c = '0' + c.substring(3)
  if (c.startsWith('0033')) c = '0' + c.substring(4)
  if (!/^0[1-9]\d{8}$/.test(c)) return null
  if (/^08[0-9]{8}$/.test(c)) return null
  return c
}

function decodeHtml(s: string): string {
  return s.replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;|\xa0/g, ' ')
    .replace(/\\u([\da-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

function extractBrand(name: string): string | null {
  const m = name.match(/\(([^)]{3,})\)/)
  return m ? m[1].trim() : null
}

function cleanSearchName(name: string): string {
  return name
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\b(SARL|SAS|SA|EURL|SASU|EIRL|EI|SCI|SNC|SCOP|SCP|SELARL|MONSIEUR|MADAME|M\.|MME|MR)\b/gi, '')
    .replace(/\s+/g, ' ').trim()
}

function isSearchable(name: string): boolean {
  const clean = cleanSearchName(name).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
  if (clean.length < 3) return false
  return clean.split(' ').filter(w => w.length > 2).length > 0
}

// ════════════════════════════
// GOOGLE SEARCH — 1 credit, no render, no country_code
// ════════════════════════════

async function searchGoogle(searchName: string, city: string): Promise<string[]> {
  const query = `"${searchName}" ${city} telephone`
  const url = `https://www.google.fr/search?q=${encodeURIComponent(query)}&hl=fr&gl=fr&num=5`
  const scraperUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`

  await acquireSemaphore()
  try {
    const res = await fetch(scraperUrl, { signal: AbortSignal.timeout(SCRAPER_TIMEOUT_MS) })
    stats.creditsUsed++

    if (res.status === 429) {
      stats.rateLimits++
      await sleep(2000)
      return []
    }
    if (res.status >= 400) return []

    const html = await res.text()
    if (html.length < 500) return []

    return extractPhonesFromGoogle(html)
  } catch {
    stats.errors++
    return []
  } finally {
    releaseSemaphore()
  }
}

function extractPhonesFromGoogle(html: string): string[] {
  const phones: string[] = []
  const seen = new Set<string>()
  const decoded = decodeHtml(html)

  // 1) data-phone-number (Knowledge Panel — highest confidence)
  const dpn = decoded.match(/data-phone-number="([^"]+)"/g) || []
  for (const m of dpn) {
    const num = m.match(/data-phone-number="([^"]+)"/)?.[1]
    if (num) { const p = normalizePhone(num); if (p && !seen.has(p)) { seen.add(p); phones.push(p) } }
  }

  // 2) tel: links
  const telLinks = decoded.match(/href="tel:([^"]+)"/g) || []
  for (const m of telLinks) {
    const num = m.match(/tel:([^"]+)/)?.[1]
    if (num) { const p = normalizePhone(num); if (p && !seen.has(p)) { seen.add(p); phones.push(p) } }
  }

  // 3) "Telephone" label patterns
  const telRx = /(?:t[eé]l(?:[eé]phone)?|phone|appeler)\s*[:\s]*((?:\+33|0)[1-79][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2})/gi
  let m
  while ((m = telRx.exec(decoded)) !== null) {
    const p = normalizePhone(m[1])
    if (p && !seen.has(p)) { seen.add(p); phones.push(p) }
  }

  // 4) French phones in first 15K chars
  const area = decoded.substring(0, 15000)
  const allRx = /(0[1-7][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2})/g
  while ((m = allRx.exec(area)) !== null) {
    const p = normalizePhone(m[1])
    if (p && !seen.has(p)) { seen.add(p); phones.push(p) }
  }

  // 5) +33 format
  const intlRx = /\+33[\s.]?([1-79])[\s.]?(\d{2})[\s.]?(\d{2})[\s.]?(\d{2})[\s.]?(\d{2})/g
  while ((m = intlRx.exec(decoded)) !== null) {
    const p = normalizePhone(m[0])
    if (p && !seen.has(p)) { seen.add(p); phones.push(p) }
  }

  // 6) 09 VoIP
  const voipRx = /(09[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2})/g
  while ((m = voipRx.exec(decoded)) !== null) {
    const p = normalizePhone(m[1])
    if (p && !seen.has(p)) { seen.add(p); phones.push(p) }
  }

  return phones
}

// ════════════════════════════
// DB
// ════════════════════════════

interface Provider {
  id: string
  name: string
  address_city: string | null
  address_department: string
}

async function loadBatch(db: PgPool, dept: string, offset: number): Promise<Provider[]> {
  const r = await db.query(`
    SELECT id, name, address_city, address_department
    FROM providers
    WHERE is_active = true AND is_artisan = true AND phone IS NULL
      AND address_city IS NOT NULL AND name IS NOT NULL AND LENGTH(name) >= 3
      AND address_department = $1
    ORDER BY id
    OFFSET $2 LIMIT $3
  `, [dept, offset, BATCH_SIZE])
  return r.rows
}

async function updatePhone(db: PgPool, providerId: string, phone: string): Promise<boolean> {
  try {
    const r = await db.query('UPDATE providers SET phone = $1 WHERE id = $2 AND phone IS NULL', [phone, providerId])
    return (r.rowCount ?? 0) > 0
  } catch { stats.errors++; return false }
}

// ════════════════════════════
// PROGRESS
// ════════════════════════════

function saveProgress() {
  const idsArr = Array.from(processedIds)
  const recentIds = idsArr.length > 300000 ? idsArr.slice(-300000) : idsArr
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    completedDepts: Array.from(completedDepts),
    processedIds: recentIds,
    stats,
    lastSave: new Date().toISOString(),
  }))
}

function loadProgress(): boolean {
  if (!fs.existsSync(PROGRESS_FILE)) return false
  try {
    const d = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
    d.completedDepts?.forEach((x: string) => completedDepts.add(x))
    d.processedIds?.forEach((x: string) => processedIds.add(x))
    if (d.stats) Object.assign(stats, d.stats)
    return true
  } catch { return false }
}

function logFound(provider: Provider, phone: string) {
  fs.appendFileSync(LOG_FILE, JSON.stringify({
    id: provider.id, name: provider.name,
    city: provider.address_city, dept: provider.address_department,
    phone, ts: new Date().toISOString(),
  }) + '\n')
}

// ════════════════════════════
// QUEUE FEEDER — loads from all depts into global queue
// ════════════════════════════

async function feedQueue(db: PgPool, depts: string[], maxLimit: number) {
  let totalLoaded = 0
  for (const dept of depts) {
    if (shuttingDown || queueDepleted) break
    if (completedDepts.has(dept)) continue
    if (maxLimit > 0 && totalLoaded >= maxLimit) break

    let offset = 0
    while (!shuttingDown) {
      if (maxLimit > 0 && totalLoaded >= maxLimit) break

      const batch = await loadBatch(db, dept, offset)
      if (batch.length === 0) {
        completedDepts.add(dept)
        break
      }

      const fresh = batch.filter(p => !processedIds.has(p.id))
      if (fresh.length > 0) {
        queue.push(...fresh)
        totalLoaded += fresh.length
      }
      offset += batch.length

      // If queue is big enough, wait for workers to consume
      while (queue.length - queueIdx > 20000 && !shuttingDown) {
        await sleep(1000)
      }
    }
  }
  queueDepleted = true
}

function getNext(): Provider | null {
  if (queueIdx >= queue.length) {
    if (queueDepleted) return null
    return null // Temporarily empty, worker will retry
  }
  if (shuttingDown) return null
  const p = queue[queueIdx]
  queueIdx++
  // Free memory: null out consumed entries periodically
  if (queueIdx > 10000 && queueIdx % 5000 === 0) {
    queue = queue.slice(queueIdx)
    queueIdx = 0
  }
  return p
}

// ════════════════════════════
// WORKER
// ════════════════════════════

async function worker(id: number, db: PgPool) {
  let idleCount = 0
  while (!shuttingDown) {
    const provider = getNext()
    if (!provider) {
      if (queueDepleted) break
      // Queue temporarily empty, wait for feeder
      idleCount++
      if (idleCount > 30) break // 15s idle = give up
      await sleep(500)
      continue
    }
    idleCount = 0

    if (processedIds.has(provider.id)) continue
    processedIds.add(provider.id)

    if (!isSearchable(provider.name)) { stats.skippedName++; continue }

    stats.searched++

    const brand = extractBrand(provider.name)
    const searchName = brand || cleanSearchName(provider.name)
    const city = provider.address_city || ''

    // Single Google request — 1 credit, no delay
    const phones = await searchGoogle(searchName, city)

    if (phones.length > 0) {
      for (const phone of phones) {
        if (knownPhones.has(phone)) { stats.skippedDedup++; continue }
        const ok = await updatePhone(db, provider.id, phone)
        if (ok) {
          knownPhones.add(phone)
          stats.phonesFound++
          stats.updated++
          logFound(provider, phone)
          break
        }
      }
    }

    // Status + save
    if (stats.searched % LOG_INTERVAL === 0) {
      const hitPct = ((stats.phonesFound / stats.searched) * 100).toFixed(1)
      const costPer = stats.phonesFound > 0 ? (stats.creditsUsed / stats.phonesFound).toFixed(1) : '-'
      const ratePerMin = Math.round(stats.searched / ((Date.now() - startTime) / 60000))
      const phonesPerMin = Math.round(stats.phonesFound / ((Date.now() - startTime) / 60000))
      process.stdout.write(
        `  [${fmt(stats.searched)}] ` +
        `+${fmt(stats.phonesFound)}T (${hitPct}%) ` +
        `| ${ratePerMin}/min | +${phonesPerMin}T/min ` +
        `| ${fmt(stats.creditsUsed)}cr (${costPer}cr/T) ` +
        `| RL:${stats.rateLimits} E:${stats.errors} ` +
        `| ${elapsed()}    \r`
      )
    }
    if (stats.searched % SAVE_INTERVAL === 0) saveProgress()
  }
}

// ════════════════════════════
// MAIN
// ════════════════════════════

async function main() {
  const args = process.argv.slice(2)
  const numWorkers = args.includes('--workers') ? parseInt(args[args.indexOf('--workers') + 1]) : DEFAULT_WORKERS
  const maxLimit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 0
  const deptArg = args.includes('--dept') ? args[args.indexOf('--dept') + 1] : null
  const deptsArg = args.includes('--depts') ? args[args.indexOf('--depts') + 1].split(',') : null
  const resume = args.includes('--resume')
  const test = args.includes('--test')

  if (!SCRAPER_API_KEY) { console.error('SCRAPER_API_KEY manquant'); process.exit(1) }

  console.log('\n' + '='.repeat(65))
  console.log('  SCRAPE PHONES LEAN V2 — Google Search, Max Throughput')
  console.log('='.repeat(65))
  console.log(`  Workers:    ${numWorkers} (concurrency limit: 200)`)
  console.log(`  Source:     Google Search (1 cr/requete, no render)`)
  console.log(`  Retries:    0 (fail fast, move on)`)
  console.log(`  Limite:     ${maxLimit > 0 ? fmt(maxLimit) : test ? '50' : 'aucune'}`)

  const db = new PgPool({
    connectionString: PG_URL,
    ssl: { rejectUnauthorized: false },
    max: Math.min(numWorkers + 5, 50), // PG pool capped at 50
    keepAlive: true,
    options: '-c statement_timeout=15000',
  })
  db.on('error', () => {}) // Suppress pool errors

  // Pre-load existing phones
  console.log('\n  Chargement phones existants...')
  const ep = await db.query('SELECT DISTINCT phone FROM providers WHERE phone IS NOT NULL AND is_active = true')
  for (const r of ep.rows) if (r.phone) knownPhones.add(r.phone)
  console.log(`  ${fmt(knownPhones.size)} phones en base`)

  if (resume) {
    const loaded = loadProgress()
    if (loaded) console.log(`  Reprise: ${fmt(processedIds.size)} traites, ${fmt(completedDepts.size)} depts, +${fmt(stats.phonesFound)} phones`)
  }

  let depts: string[]
  if (deptArg) depts = [deptArg]
  else if (deptsArg) depts = deptsArg
  else depts = DEPT_ORDER

  // Quick count
  const countR = await db.query(`
    SELECT COUNT(*) FROM providers
    WHERE is_active = true AND is_artisan = true AND phone IS NULL
      AND address_city IS NOT NULL AND name IS NOT NULL AND LENGTH(name) >= 3
      AND address_department = ANY($1)
  `, [depts.filter(d => !completedDepts.has(d))])
  const total = parseInt(countR.rows[0].count)
  const effective = test ? 50 : (maxLimit > 0 ? Math.min(maxLimit, total) : total)
  console.log(`  ${fmt(total)} artisans, budget ~${fmt(effective)} credits`)
  console.log(`  Vitesse attendue: ~${numWorkers * 15}/min (~${Math.round(numWorkers * 15 * 0.33)}T/min)`)
  console.log()

  process.on('SIGINT', () => {
    if (shuttingDown) { saveProgress(); process.exit(1) }
    console.log('\n  Arret gracieux...')
    shuttingDown = true
  })

  // Start queue feeder in background
  const feederLimit = test ? 50 : maxLimit
  const feederPromise = feedQueue(db, depts, feederLimit)

  // Wait for initial queue to fill
  while (queue.length < Math.min(numWorkers * 2, 100) && !queueDepleted) {
    await sleep(200)
  }

  console.log(`  Queue: ${fmt(queue.length)} prets, lancement ${numWorkers} workers...\n`)

  // Launch all workers
  const workers: Promise<void>[] = []
  for (let i = 1; i <= numWorkers; i++) {
    workers.push(worker(i, db))
  }

  await Promise.all([...workers, feederPromise])
  saveProgress()
  await db.end()

  const costPer = stats.phonesFound > 0 ? (stats.creditsUsed / stats.phonesFound).toFixed(1) : '-'
  const hitPct = stats.searched > 0 ? ((stats.phonesFound / stats.searched) * 100).toFixed(1) : '0'
  const ratePerMin = Math.round(stats.searched / ((Date.now() - startTime) / 60000))

  console.log('\n\n' + '='.repeat(65))
  console.log('  RESULTAT — SCRAPE PHONES LEAN V2')
  console.log('='.repeat(65))
  console.log(`  Duree:             ${elapsed()}`)
  console.log(`  Vitesse:           ${ratePerMin}/min`)
  console.log(`  Artisans traites:  ${fmt(stats.searched)}`)
  console.log(`  Phones trouves:    +${fmt(stats.phonesFound)} (${hitPct}%)`)
  console.log(`  Doublons bloques:  ${fmt(stats.skippedDedup)}`)
  console.log(`  Rate limits:       ${stats.rateLimits}`)
  console.log(`  Erreurs:           ${stats.errors}`)
  console.log(`  Credits API:       ${fmt(stats.creditsUsed)}`)
  console.log(`  Cout/telephone:    ${costPer} credits`)
  console.log('='.repeat(65) + '\n')
}

main().then(() => process.exit(0)).catch(e => { console.error('Erreur fatale:', e); process.exit(1) })
