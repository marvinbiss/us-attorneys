/**
 * SCRAPE DOMINATION — Reverse Search Multi-Source Multi-Agent
 *
 * STRATEGIE: au lieu de chercher "plombier Marseille" et esperer matcher,
 * on prend CHAQUE provider sans telephone et on cherche SON nom exact.
 *
 * Sources (cascade par cout):
 *   1. Google Search: "{nom}" {ville} telephone — 5 credits, ~40% hit
 *   2. Pages Jaunes: recherche nom+ville — 5 credits, ~30% hit
 *   3. Societe.com: page SIRET — 5 credits, ~15% hit
 *
 * Multi-agent: N workers paralleles sur une queue partagee
 * Anti-doublon: phones en memoire + verification DB avant UPDATE
 * Resume: progression sauvee dans JSON toutes les 10 ops
 *
 * Usage:
 *   npx tsx scripts/scrape-domination.ts [options]
 *
 * Options:
 *   --workers N       Nombre de workers (defaut: 5)
 *   --limit N         Nombre max de providers a traiter (defaut: illimite)
 *   --dept XX         Filtrer par departement
 *   --source X        Forcer une source: google|pj|societe|all (defaut: all)
 *   --resume          Reprendre la session precedente
 *   --dry-run         Afficher le plan sans executer
 *   --skip-google     Ne pas utiliser Google Search
 *   --skip-pj         Ne pas utiliser Pages Jaunes
 *   --skip-societe    Ne pas utiliser Societe.com
 */
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { Pool as PgPool } from 'pg'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// ════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY
const PG_URL = process.env.SUPABASE_DB_URL || 'postgresql://postgres:BEB6LnGlT6U9bkTe@db.umjmbdbwcsxrvfqktiui.supabase.co:5432/postgres'

const DATA_DIR = path.join(__dirname, '.domination-data')
// Agent-specific files set in main() after parsing --agent-id
let PROGRESS_FILE = path.join(DATA_DIR, 'progress.json')
let LOG_FILE = path.join(DATA_DIR, 'enrichment-log.jsonl')

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const SCRAPER_TIMEOUT_MS = 45000
const MAX_RETRIES = 1
const DELAY_BETWEEN_REQUESTS_MS = 300   // Per worker — max speed
const BATCH_SIZE = 3000 // Load providers in batches from DB

// ════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════

interface Provider {
  id: string
  name: string
  siret: string | null
  address_city: string | null
  address_department: string | null
  address_postal_code: string | null
  specialty: string | null
}

interface EnrichResult {
  phone: string | null
  rating: number | null
  review_count: number | null
  website: string | null
  source: string
}

interface Stats {
  processed: number
  phonesFound: number
  ratingsFound: number
  websitesFound: number
  bySource: Record<string, { tried: number; found: number }>
  errors: number
  apiCredits: number
  skippedDuplicate: number
}

// ════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════

let shuttingDown = false
const startTime = Date.now()
const knownPhones = new Set<string>()
const processedIds = new Set<string>()

const stats: Stats = {
  processed: 0, phonesFound: 0, ratingsFound: 0, websitesFound: 0,
  bySource: {
    google: { tried: 0, found: 0 },
    pj: { tried: 0, found: 0 },
    societe: { tried: 0, found: 0 },
  },
  errors: 0, apiCredits: 0, skippedDuplicate: 0,
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)) }
function fmt(n: number): string { return n.toLocaleString('fr-FR') }
function elapsed(): string {
  const s = Math.floor((Date.now() - startTime) / 1000)
  const m = Math.floor(s / 60); const h = Math.floor(m / 60)
  return h > 0 ? `${h}h${String(m % 60).padStart(2, '0')}m` : `${m}m${String(s % 60).padStart(2, '0')}s`
}
function rate(): string {
  const mins = (Date.now() - startTime) / 60000
  return mins > 0.5 ? `${Math.round(stats.phonesFound / mins)}/min` : '-'
}

function normalizePhone(raw: string): string | null {
  if (!raw) return null
  let c = raw.replace(/[^\d+]/g, '')
  if (c.startsWith('+33')) c = '0' + c.substring(3)
  if (c.startsWith('0033')) c = '0' + c.substring(4)
  if (!/^0[1-9]\d{8}$/.test(c)) return null
  // Filtrer numeros surtaxes, tracking, VoIP douteux
  if (/^0[89][0-9]{8}$/.test(c)) return null
  return c
}

function normalizeWebsite(raw: string): string | null {
  if (!raw) return null
  let url = raw.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url
  try {
    const p = new URL(url)
    const blocked = ['google.com', 'google.fr', 'facebook.com', 'instagram.com',
      'twitter.com', 'linkedin.com', 'x.com', 'pagesjaunes.fr', 'societe.com',
      'pappers.fr', 'verif.com', 'infogreffe.fr']
    if (blocked.some(d => p.hostname.includes(d))) return null
    return p.toString()
  } catch { return null }
}

function decodeHtml(s: string): string {
  return s.replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;|\xa0/g, ' ')
    .replace(/\\u([\da-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

// Clean company name for search queries
function cleanNameForSearch(name: string): string {
  return name
    // Remove legal form parenthetical at end
    .replace(/\s*\([^)]*\)\s*$/, '')
    // Remove common legal prefixes/suffixes
    .replace(/\b(SARL|SAS|SA|EURL|SASU|EIRL|EI|SCI|SNC|SCOP|SCP|SELARL|MONSIEUR|MADAME|M\.|MME|MR)\b/gi, '')
    // Clean up
    .replace(/\s+/g, ' ').trim()
}

// Extract the commercial/brand name from parentheses if present
function extractBrandName(name: string): string | null {
  const m = name.match(/\(([^)]{3,})\)/)
  return m ? m[1].trim() : null
}

// ════════════════════════════════════════════════════════════
// SCRAPER API — Generic fetch with proxy
// ════════════════════════════════════════════════════════════

async function fetchViaProxy(url: string, render = false, retry = 0): Promise<string | null> {
  const credits = render ? 10 : 5
  const scraperUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}${render ? '&render=true' : ''}&country_code=fr`

  try {
    const res = await fetch(scraperUrl, { signal: AbortSignal.timeout(SCRAPER_TIMEOUT_MS) })
    stats.apiCredits += credits

    if (res.status === 429) {
      if (retry < MAX_RETRIES) { await sleep(15000); return fetchViaProxy(url, render, retry + 1) }
      return null
    }
    if (res.status === 500 || res.status === 403) {
      if (retry < MAX_RETRIES) { await sleep(8000); return fetchViaProxy(url, render, retry + 1) }
      return null
    }
    if (res.status >= 400) return ''

    const html = await res.text()
    if (html.length < 500) {
      if (retry < MAX_RETRIES) { await sleep(5000); return fetchViaProxy(url, render, retry + 1) }
      return null
    }
    return html
  } catch {
    stats.errors++
    if (retry < MAX_RETRIES) { await sleep(5000); return fetchViaProxy(url, render, retry + 1) }
    return null
  }
}

// ════════════════════════════════════════════════════════════
// SOURCE 1: GOOGLE SEARCH — Reverse search by company name
// ════════════════════════════════════════════════════════════

function parseGoogleKnowledgePanel(html: string): EnrichResult {
  const result: EnrichResult = { phone: null, rating: null, review_count: null, website: null, source: 'google' }
  const decoded = decodeHtml(html)

  // Phone patterns in Knowledge Panel
  // Pattern 1: "data-phone-number" attribute
  const dpn = decoded.match(/data-phone-number="([^"]+)"/)
  if (dpn) { result.phone = normalizePhone(dpn[1]) }

  // Pattern 2: Phone in structured snippet — "Telephone : 0X XX XX XX XX" or "Tel:" etc.
  if (!result.phone) {
    const telPatterns = [
      /(?:t[eé]l(?:[eé]phone)?|phone|appeler)\s*[:\s]*\(?(?:\+33|0)\s*([1-9][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2})\)?/gi,
      /(?:t[eé]l(?:[eé]phone)?|phone)\s*[:\s]*(0[1-9][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2})/gi,
    ]
    for (const rx of telPatterns) {
      const m = decoded.match(rx)
      if (m) {
        for (const match of m) {
          const phoneRaw = match.match(/((?:\+33|0)[1-9][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2})/)
          if (phoneRaw) { result.phone = normalizePhone(phoneRaw[1]); if (result.phone) break }
        }
      }
      if (result.phone) break
    }
  }

  // Pattern 3: French phone in local pack / organic results
  if (!result.phone) {
    const phones = [...decoded.matchAll(/(0[1-7][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2})/g)]
    // Take the first non-0800 landline/mobile
    for (const pm of phones) {
      const n = normalizePhone(pm[1])
      if (n) { result.phone = n; break }
    }
  }

  // Rating: "X,X" or "X.X" near "avis" or "etoiles" or star icon
  const ratingMatch = decoded.match(/(\d[,.]\d)\s*(?:\/\s*5|sur\s*5|[eé]toiles?|\u2605|stars?)/i)
    || decoded.match(/aria-label="[^"]*(\d[,.]\d)[^"]*[eé]toiles?"/)
    || decoded.match(/(\d[,.]\d)\s*</)
  if (ratingMatch) {
    const r = parseFloat(ratingMatch[1].replace(',', '.'))
    if (r >= 1 && r <= 5) result.rating = r
  }

  // Review count
  const reviewMatch = decoded.match(/(\d[\d\s.,]*)\s*(?:avis|reviews?|notes?|[eé]valuations?)/i)
  if (reviewMatch && result.rating) {
    const c = parseInt(reviewMatch[1].replace(/[\s.,]/g, ''))
    if (c > 0 && c < 100000) result.review_count = c
  }

  // Website — look for non-Google, non-directory hrefs near the company info
  const websiteMatch = decoded.match(/href="(https?:\/\/(?!(?:www\.)?(?:google|facebook|instagram|twitter|linkedin|x|pagesjaunes|societe|pappers|verif|infogreffe))[^"]{10,200})"[^>]*(?:site\s*web|website|visiter|official)/i)
    || decoded.match(/data-url="(https?:\/\/(?!(?:www\.)?(?:google|facebook|instagram|twitter|linkedin|x|pagesjaunes|societe))[^"]{10,200})"/)
  if (websiteMatch) result.website = normalizeWebsite(websiteMatch[1])

  return result
}

async function searchGoogle(provider: Provider): Promise<EnrichResult> {
  const name = cleanNameForSearch(provider.name)
  const brand = extractBrandName(provider.name)
  const city = provider.address_city || ''

  // Use the brand name if available (more likely to match Google listing)
  const searchName = brand || name
  const query = `"${searchName}" ${city} telephone`
  const url = `https://www.google.fr/search?q=${encodeURIComponent(query)}&hl=fr&gl=fr&num=10`

  stats.bySource.google.tried++
  const html = await fetchViaProxy(url)
  if (!html) return { phone: null, rating: null, review_count: null, website: null, source: 'google' }

  const result = parseGoogleKnowledgePanel(html)
  if (result.phone) stats.bySource.google.found++

  // If no phone found with brand name, retry with full legal name
  if (!result.phone && brand && name !== brand) {
    await sleep(DELAY_BETWEEN_REQUESTS_MS)
    const query2 = `"${name}" ${city} telephone`
    const url2 = `https://www.google.fr/search?q=${encodeURIComponent(query2)}&hl=fr&gl=fr&num=10`
    stats.bySource.google.tried++
    const html2 = await fetchViaProxy(url2)
    if (html2) {
      const result2 = parseGoogleKnowledgePanel(html2)
      if (result2.phone) {
        stats.bySource.google.found++
        return result2
      }
      // Merge partial results
      if (result2.rating && !result.rating) result.rating = result2.rating
      if (result2.review_count && !result.review_count) result.review_count = result2.review_count
      if (result2.website && !result.website) result.website = result2.website
    }
  }

  return result
}

// ════════════════════════════════════════════════════════════
// SOURCE 2: PAGES JAUNES — Reverse search
// ════════════════════════════════════════════════════════════

function parsePagesJaunes(html: string): EnrichResult {
  const result: EnrichResult = { phone: null, rating: null, review_count: null, website: null, source: 'pj' }
  const decoded = decodeHtml(html)

  // PJ phone patterns
  // Pattern 1: data-phone attribute
  const dpn = decoded.match(/data-phone="(0[1-7]\d{8})"/)
  if (dpn) result.phone = normalizePhone(dpn[1])

  // Pattern 2: Phone in "Appeler" button or tel: link
  if (!result.phone) {
    const telLink = decoded.match(/href="tel:(0[1-7]\d{8})"/)
      || decoded.match(/href="tel:(\+33[1-7]\d{8})"/)
      || decoded.match(/href="tel:(0[1-7][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2})"/)
    if (telLink) result.phone = normalizePhone(telLink[1])
  }

  // Pattern 3: Phone displayed as text near "Appeler" or "Afficher le N"
  if (!result.phone) {
    const phoneDisplay = decoded.match(/(?:appeler|afficher le n|num[eé]ro)[^<]{0,50}(0[1-7][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2})/i)
    if (phoneDisplay) result.phone = normalizePhone(phoneDisplay[1])
  }

  // Pattern 4: Any French landline/mobile in the first result block
  if (!result.phone) {
    // Look in first ~5000 chars after first result
    const firstResult = decoded.substring(0, 8000)
    const phones = [...firstResult.matchAll(/(0[1-7][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2})/g)]
    for (const pm of phones) {
      const n = normalizePhone(pm[1])
      if (n) { result.phone = n; break }
    }
  }

  // Rating from PJ
  const ratingMatch = decoded.match(/(\d[,.]\d)\s*\/\s*5/)
    || decoded.match(/note[^<]{0,30}(\d[,.]\d)/i)
  if (ratingMatch) {
    const r = parseFloat(ratingMatch[1].replace(',', '.'))
    if (r >= 1 && r <= 5) result.rating = r
  }

  // Review count
  const reviewMatch = decoded.match(/(\d+)\s*avis/i)
  if (reviewMatch && result.rating) {
    const c = parseInt(reviewMatch[1])
    if (c > 0 && c < 100000) result.review_count = c
  }

  return result
}

async function searchPagesJaunes(provider: Provider): Promise<EnrichResult> {
  const name = cleanNameForSearch(provider.name)
  const brand = extractBrandName(provider.name)
  const searchName = brand || name
  const city = provider.address_city || ''
  const cp = provider.address_postal_code || ''
  const where = cp || city

  const url = `https://www.pagesjaunes.fr/annuaire/chercherdansqui?quoiqui=${encodeURIComponent(searchName)}&ou=${encodeURIComponent(where)}`

  stats.bySource.pj.tried++
  const html = await fetchViaProxy(url)
  if (!html) return { phone: null, rating: null, review_count: null, website: null, source: 'pj' }

  const result = parsePagesJaunes(html)
  if (result.phone) stats.bySource.pj.found++

  return result
}

// ════════════════════════════════════════════════════════════
// SOURCE 3: SOCIETE.COM — SIRET lookup
// ════════════════════════════════════════════════════════════

function parseSocieteCom(html: string): EnrichResult {
  const result: EnrichResult = { phone: null, rating: null, review_count: null, website: null, source: 'societe' }
  const decoded = decodeHtml(html)

  // Phone on societe.com
  const telMatch = decoded.match(/href="tel:(0[1-7]\d{8})"/)
    || decoded.match(/href="tel:(\+33[1-7]\d{8})"/)
    || decoded.match(/T[eé]l[eé]phone\s*[:\s]*(0[1-7][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2})/i)
    || decoded.match(/(?:numero|phone)\s*[:\s]*(0[1-7][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2})/i)
  if (telMatch) result.phone = normalizePhone(telMatch[1])

  // Website
  const wsMatch = decoded.match(/site\s*(?:web|internet)\s*[:\s]*<[^>]*href="(https?:\/\/[^"]+)"/i)
    || decoded.match(/href="(https?:\/\/(?!(?:www\.)?(?:societe|google|facebook))[^"]{10,200})"[^>]*>(?:site|www\.)/i)
  if (wsMatch) result.website = normalizeWebsite(wsMatch[1])

  return result
}

async function searchSocieteCom(provider: Provider): Promise<EnrichResult> {
  if (!provider.siret) return { phone: null, rating: null, review_count: null, website: null, source: 'societe' }

  const siren = provider.siret.substring(0, 9)
  // Build societe.com URL from SIREN
  const url = `https://www.societe.com/cgi-bin/search?champs=${siren}`

  stats.bySource.societe.tried++
  const html = await fetchViaProxy(url)
  if (!html) return { phone: null, rating: null, review_count: null, website: null, source: 'societe' }

  const result = parseSocieteCom(html)
  if (result.phone) stats.bySource.societe.found++

  return result
}

// ════════════════════════════════════════════════════════════
// ENRICHMENT CASCADE — Try sources in order of cost/efficiency
// ════════════════════════════════════════════════════════════

async function enrichProvider(
  provider: Provider,
  sources: string[],
): Promise<EnrichResult> {
  let merged: EnrichResult = { phone: null, rating: null, review_count: null, website: null, source: '' }

  for (const source of sources) {
    if (shuttingDown) break
    if (merged.phone) break // Phone found, stop searching

    let result: EnrichResult
    switch (source) {
      case 'google':
        result = await searchGoogle(provider)
        break
      case 'pj':
        result = await searchPagesJaunes(provider)
        break
      case 'societe':
        result = await searchSocieteCom(provider)
        break
      default:
        continue
    }

    // Merge results (first non-null wins)
    if (result.phone && !merged.phone) { merged.phone = result.phone; merged.source = source }
    if (result.rating && !merged.rating) merged.rating = result.rating
    if (result.review_count && !merged.review_count) merged.review_count = result.review_count
    if (result.website && !merged.website) merged.website = result.website

    if (!merged.phone) await sleep(DELAY_BETWEEN_REQUESTS_MS)
  }

  return merged
}

// ════════════════════════════════════════════════════════════
// DB OPERATIONS
// ════════════════════════════════════════════════════════════

async function loadProviderBatch(
  db: PgPool, offset: number, limit: number, dept: string | null, deptsList: string[] | null,
): Promise<Provider[]> {
  let query = `
    SELECT id, name, siret, address_city, address_department, address_postal_code, specialty
    FROM providers
    WHERE is_active = true
      AND phone IS NULL
      AND address_city IS NOT NULL
      AND name IS NOT NULL
      AND LENGTH(name) >= 3
  `
  const params: any[] = []
  let pi = 1

  if (deptsList && deptsList.length > 0) {
    query += ` AND address_department = ANY($${pi++})`
    params.push(deptsList)
  } else if (dept) {
    query += ` AND address_department = $${pi++}`
    params.push(dept)
  }

  // Prioritize: verified first, then by populated departments
  query += `
    ORDER BY
      CASE WHEN claimed_at IS NOT NULL THEN 0 ELSE 1 END,
      CASE WHEN is_verified = true THEN 0 ELSE 1 END,
      review_count DESC NULLS LAST,
      address_department
    OFFSET $${pi++} LIMIT $${pi++}
  `
  params.push(offset, limit)

  const r = await db.query(query, params)
  return r.rows
}

async function updateProvider(db: PgPool, providerId: string, result: EnrichResult): Promise<boolean> {
  const sets: string[] = []
  const params: any[] = []
  let pi = 1

  if (result.phone) {
    // Double-check phone is not already assigned to another provider
    const existing = await db.query(
      'SELECT id FROM providers WHERE phone = $1 AND is_active = true LIMIT 1', [result.phone]
    )
    if (existing.rows.length > 0) {
      stats.skippedDuplicate++
      return false
    }
    sets.push(`phone = $${pi++}`)
    params.push(result.phone)
  }

  if (result.rating && result.rating >= 1 && result.rating <= 5) {
    sets.push(`rating_average = $${pi++}`)
    params.push(result.rating)
    if (result.review_count) {
      sets.push(`review_count = $${pi++}`)
      params.push(result.review_count)
    }
  }

  // Don't overwrite existing website
  if (result.website) {
    sets.push(`website = COALESCE(website, $${pi++})`)
    params.push(result.website)
  }

  if (sets.length === 0) return false

  params.push(providerId)
  const query = `UPDATE providers SET ${sets.join(', ')} WHERE id = $${pi} AND phone IS NULL`

  try {
    const r = await db.query(query, params)
    return (r.rowCount ?? 0) > 0
  } catch {
    stats.errors++
    return false
  }
}

// ════════════════════════════════════════════════════════════
// PROGRESS MANAGEMENT
// ════════════════════════════════════════════════════════════

function saveProgress() {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    processedIds: Array.from(processedIds),
    stats,
    timestamp: new Date().toISOString(),
  }))
}

function loadProgress(): boolean {
  if (!fs.existsSync(PROGRESS_FILE)) return false
  try {
    const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
    if (data.processedIds) {
      for (const id of data.processedIds) processedIds.add(id)
    }
    if (data.stats) {
      stats.processed = data.stats.processed || 0
      stats.phonesFound = data.stats.phonesFound || 0
      stats.ratingsFound = data.stats.ratingsFound || 0
      stats.websitesFound = data.stats.websitesFound || 0
      stats.errors = data.stats.errors || 0
      stats.apiCredits = data.stats.apiCredits || 0
      stats.skippedDuplicate = data.stats.skippedDuplicate || 0
      if (data.stats.bySource) stats.bySource = data.stats.bySource
    }
    return true
  } catch { return false }
}

function logEnrichment(provider: Provider, result: EnrichResult) {
  const entry = {
    id: provider.id,
    name: provider.name,
    city: provider.address_city,
    phone: result.phone,
    rating: result.rating,
    website: result.website,
    source: result.source,
    ts: new Date().toISOString(),
  }
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n')
}

// ════════════════════════════════════════════════════════════
// WORKER
// ════════════════════════════════════════════════════════════

// Shared queue
let queue: Provider[] = []
let queueIdx = 0
let totalToProcess = 0
let batchOffset = 0
let noMoreProviders = false

async function refillQueue(db: PgPool, dept: string | null, deptsList: string[] | null, maxLimit: number) {
  if (noMoreProviders) return
  const remaining = maxLimit > 0 ? Math.min(BATCH_SIZE, maxLimit - stats.processed) : BATCH_SIZE
  if (remaining <= 0) { noMoreProviders = true; return }

  const batch = await loadProviderBatch(db, batchOffset, remaining, dept, deptsList)
  if (batch.length === 0) { noMoreProviders = true; return }

  // Filter out already processed
  const fresh = batch.filter(p => !processedIds.has(p.id))
  queue.push(...fresh)
  batchOffset += batch.length

  // If we got fewer than requested, or all were processed, try next batch
  if (fresh.length === 0 && batch.length > 0) {
    await refillQueue(db, dept, deptsList, maxLimit)
  }
}

function getNextProvider(): Provider | null {
  if (queueIdx >= queue.length || shuttingDown) return null
  return queue[queueIdx++]
}

async function worker(
  id: number, db: PgPool, sources: string[],
) {
  while (!shuttingDown) {
    const provider = getNextProvider()
    if (!provider) break

    processedIds.add(provider.id)
    stats.processed++

    try {
      const result = await enrichProvider(provider, sources)

      if (result.phone) {
        // Anti-doublon: check memory set
        if (knownPhones.has(result.phone)) {
          stats.skippedDuplicate++
        } else {
          knownPhones.add(result.phone)
          const updated = await updateProvider(db, provider.id, result)
          if (updated) {
            stats.phonesFound++
            if (result.rating) stats.ratingsFound++
            if (result.website) stats.websitesFound++
            logEnrichment(provider, result)
          }
        }
      } else if (result.rating || result.website) {
        // No phone but got rating or website — still update
        const updated = await updateProvider(db, provider.id, result)
        if (updated) {
          if (result.rating) stats.ratingsFound++
          if (result.website) stats.websitesFound++
        }
      }

      // Status line
      const hitRate = stats.bySource.google.tried > 0
        ? ((stats.bySource.google.found / stats.bySource.google.tried) * 100).toFixed(1)
        : '-'
      const pjRate = stats.bySource.pj.tried > 0
        ? ((stats.bySource.pj.found / stats.bySource.pj.tried) * 100).toFixed(1)
        : '-'

      if (stats.processed % 50 === 0) {
        const icon = result.phone ? '+' : '.'
        console.log(
          `  W${id} [${fmt(stats.processed)}] ${icon} ${provider.name.substring(0, 35).padEnd(35)} ` +
          `${(provider.address_city || '').substring(0, 15).padEnd(15)} ` +
          `| ${fmt(stats.phonesFound)}T ${fmt(stats.ratingsFound)}R ${fmt(stats.websitesFound)}W ` +
          `| G:${hitRate}% PJ:${pjRate}% ` +
          `| ${rate()} | ${elapsed()} | ${fmt(stats.apiCredits)}cr`
        )
      }
    } catch (err: any) {
      stats.errors++
      if (stats.errors % 10 === 0) {
        console.log(`  W${id} ERR [${stats.errors}]: ${err.message}`)
      }
    }

    // Save progress periodically
    if (stats.processed % 100 === 0) saveProgress()

    await sleep(Math.random() * 300) // Minimal jitter
  }
}

// ════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2)
  const numWorkers = args.includes('--workers') ? parseInt(args[args.indexOf('--workers') + 1]) : 5
  const maxLimit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 0
  const dept = args.includes('--dept') ? args[args.indexOf('--dept') + 1] : null
  const depts = args.includes('--depts') ? args[args.indexOf('--depts') + 1].split(',') : null
  const agentId = args.includes('--agent-id') ? args[args.indexOf('--agent-id') + 1] : null
  const resume = args.includes('--resume')
  const dryRun = args.includes('--dry-run')
  const sourceArg = args.includes('--source') ? args[args.indexOf('--source') + 1] : 'all'

  // Build source cascade
  let sources: string[] = []
  if (sourceArg === 'all') {
    sources = ['google', 'pj', 'societe']
  } else {
    sources = [sourceArg]
  }
  if (args.includes('--skip-google')) sources = sources.filter(s => s !== 'google')
  if (args.includes('--skip-pj')) sources = sources.filter(s => s !== 'pj')
  if (args.includes('--skip-societe')) sources = sources.filter(s => s !== 'societe')

  // Agent-specific files
  if (agentId) {
    PROGRESS_FILE = path.join(DATA_DIR, `progress-agent-${agentId}.json`)
    LOG_FILE = path.join(DATA_DIR, `enrichment-log-agent-${agentId}.jsonl`)
  }

  if (!SCRAPER_API_KEY) { console.error('SCRAPER_API_KEY manquant dans .env.local'); process.exit(1) }
  if (sources.length === 0) { console.error('Aucune source active !'); process.exit(1) }

  const label = agentId ? `Agent ${agentId}` : 'DOMINATION'
  console.log('\n' + '='.repeat(70))
  console.log('  SCRAPE DOMINATION — Reverse Search Multi-Source')
  console.log('='.repeat(70))
  console.log(`  Sources:     ${sources.join(' -> ')} (cascade)`)
  console.log(`  Workers:     ${numWorkers}`)
  console.log(`  Limite:      ${maxLimit > 0 ? fmt(maxLimit) : 'illimitee'}`)
  console.log(`  Dept filtre: ${dept || 'tous'}`)
  console.log(`  Resume:      ${resume ? 'oui' : 'non'}`)

  // Connect DB
  const db = new PgPool({
    connectionString: PG_URL, ssl: { rejectUnauthorized: false },
    max: numWorkers + 2, keepAlive: true,
    options: '-c statement_timeout=30000',
  })
  db.on('error', (err: any) => console.log('  DB Pool error:', err.message))

  // Load existing phones for anti-doublon
  console.log('\n  Chargement phones existants...')
  const ep = await db.query('SELECT DISTINCT phone FROM providers WHERE phone IS NOT NULL AND is_active = true')
  for (const r of ep.rows) knownPhones.add(r.phone)
  console.log(`  ${fmt(knownPhones.size)} phones en base`)

  // Count opportunity
  let countQuery = `SELECT COUNT(*) FROM providers WHERE is_active = true AND phone IS NULL AND address_city IS NOT NULL AND name IS NOT NULL AND LENGTH(name) >= 3`
  const countParams: any[] = []
  if (depts && depts.length > 0) { countQuery += ` AND address_department = ANY($1)`; countParams.push(depts) }
  else if (dept) { countQuery += ` AND address_department = $1`; countParams.push(dept) }
  const countResult = await db.query(countQuery, countParams)
  totalToProcess = parseInt(countResult.rows[0].count)

  console.log(`  ${fmt(totalToProcess)} providers a enrichir`)

  // Load resume
  if (resume) {
    const loaded = loadProgress()
    if (loaded) {
      console.log(`  Reprise: ${fmt(processedIds.size)} deja traites, ${fmt(stats.phonesFound)} phones trouves`)
    }
  }

  // Cost projection
  const remaining = maxLimit > 0 ? Math.min(maxLimit, totalToProcess) : totalToProcess
  const avgCreditsPerProvider = sources.length * 5 // Pessimistic: all sources tried
  const estimatedCredits = remaining * avgCreditsPerProvider * 0.6 // ~60% need all sources
  console.log(`\n  Estimation credits: ~${fmt(Math.round(estimatedCredits))} pour ${fmt(remaining)} providers`)
  console.log(`  (cout reel sera inferieur grace a la cascade)\n`)

  if (dryRun) { console.log('  [DRY-RUN] Fin.'); await db.end(); return }

  // Graceful shutdown
  process.on('SIGINT', () => {
    if (shuttingDown) { saveProgress(); process.exit(1) }
    console.log('\n  Arret gracieux en cours...')
    shuttingDown = true
  })

  // Initial queue fill
  await refillQueue(db, dept, depts, maxLimit)
  console.log(`  Queue initiale: ${fmt(queue.length)} providers`)
  console.log(`  Demarrage ${numWorkers} workers...\n`)

  // Launch workers
  const workers: Promise<void>[] = []
  for (let i = 1; i <= numWorkers; i++) {
    workers.push(worker(i, db, sources))
  }

  // Refill queue periodically
  const refillTimer = setInterval(async () => {
    if (shuttingDown || noMoreProviders) { clearInterval(refillTimer); return }
    if (queue.length - queueIdx < numWorkers * 5) {
      await refillQueue(db, dept, depts, maxLimit)
    }
  }, 10000)

  // Wait for all workers
  await Promise.all(workers)
  clearInterval(refillTimer)
  saveProgress()
  await db.end()

  // Final summary
  console.log('\n' + '='.repeat(70))
  console.log('  RESULTATS — SCRAPE DOMINATION')
  console.log('='.repeat(70))
  console.log(`  Duree:              ${elapsed()}`)
  console.log(`  Providers traites:  ${fmt(stats.processed)}`)
  console.log(`  Telephones trouves: +${fmt(stats.phonesFound)}`)
  console.log(`  Ratings trouves:    +${fmt(stats.ratingsFound)}`)
  console.log(`  Websites trouves:   +${fmt(stats.websitesFound)}`)
  console.log(`  Doublons evites:    ${fmt(stats.skippedDuplicate)}`)
  console.log(`  Erreurs:            ${stats.errors}`)
  console.log(`  Credits API:        ~${fmt(stats.apiCredits)}`)
  console.log()
  console.log('  Par source:')
  for (const [src, data] of Object.entries(stats.bySource)) {
    if (data.tried > 0) {
      const pct = ((data.found / data.tried) * 100).toFixed(1)
      console.log(`    ${src.padEnd(10)} ${fmt(data.tried)} essais → ${fmt(data.found)} trouves (${pct}%)`)
    }
  }
  console.log()
  if (stats.processed > 0) {
    const phoneRate = ((stats.phonesFound / stats.processed) * 100).toFixed(1)
    const creditsPerPhone = stats.phonesFound > 0 ? Math.round(stats.apiCredits / stats.phonesFound) : '-'
    console.log(`  Taux de reussite:   ${phoneRate}%`)
    console.log(`  Credits/telephone:  ${creditsPerPhone}`)
  }
  console.log('='.repeat(70) + '\n')
}

main().then(() => process.exit(0)).catch(e => { console.error('Erreur fatale:', e); process.exit(1) })
