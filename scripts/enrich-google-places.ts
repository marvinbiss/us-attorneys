/**
 * Enrichissement Telephonique des Artisans via Google Places API (New)
 *
 * Strategie EQUILIBREE:
 *   Pour chaque combo specialty × departement, enrichit N providers
 *   → garantit que chaque page du site a des artisans avec telephone
 *
 * Usage:
 *   node --import tsx scripts/enrich-google-places.ts                    # Lancer (40/combo)
 *   node --import tsx scripts/enrich-google-places.ts --per-combo 20     # 20 par combo
 *   node --import tsx scripts/enrich-google-places.ts --dept 75          # Un seul departement
 *   node --import tsx scripts/enrich-google-places.ts --specialty plombier
 *   node --import tsx scripts/enrich-google-places.ts --dry-run          # Simuler
 *   node --import tsx scripts/enrich-google-places.ts --resume           # Reprendre
 *   node --import tsx scripts/enrich-google-places.ts --budget 50000     # Max N requetes
 *
 * Prerequis:
 *   GOOGLE_PLACES_API_KEY dans .env.local
 *
 * Cout:
 *   ~3$/1000 requetes (FieldMask Contact)
 *   40/combo × 1871 combos = ~75 000 requetes = ~225$
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// ============================================
// CONFIG
// ============================================

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY
const DELAY_MS = 350              // Base delay between requests (ms)
const MAX_RETRIES = 3             // Max retries for network/server errors
const MAX_RATE_LIMIT_RETRIES = 5  // Max 429 retries before skipping
const SAVE_INTERVAL = 50
const RATE_LIMIT_BASE_MS = 60000  // Start at 60s on 429, then backoff

const DATA_DIR = path.join(__dirname, '.enrich-data')
const PROGRESS_FILE = path.join(DATA_DIR, 'google-places-v2-progress.json')

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

// ============================================
// SPECIALTIES — ordered by SEO priority
// ============================================

const SPECIALTIES = [
  // Core trades (high search volume)
  'plombier', 'electricien', 'chauffagiste', 'serrurier', 'couvreur',
  'menuisier', 'macon', 'peintre-en-batiment', 'carreleur', 'charpentier',
  // Secondary trades
  'climaticien', 'paysagiste', 'terrassier', 'isolation-thermique', 'solier',
  'facadier', 'storiste', 'ramoneur', 'vitrier', 'ferronnier',
  // Professional services
  'architecte-interieur', 'geometre', 'diagnostiqueur', 'domoticien',
  // Remaining
  'platrier', 'etancheur', 'demolition',
]

const SPECIALTY_LABELS: Record<string, string> = {
  'plombier': 'Plombier', 'electricien': 'Electricien', 'chauffagiste': 'Chauffagiste',
  'serrurier': 'Serrurier', 'couvreur': 'Couvreur', 'menuisier': 'Menuisier',
  'macon': 'Macon', 'peintre-en-batiment': 'Peintre', 'carreleur': 'Carreleur',
  'charpentier': 'Charpentier', 'climaticien': 'Climaticien', 'paysagiste': 'Paysagiste',
  'terrassier': 'Terrassier', 'isolation-thermique': 'Isolation', 'solier': 'Solier',
  'facadier': 'Facadier', 'storiste': 'Storiste', 'ramoneur': 'Ramoneur',
  'vitrier': 'Vitrier', 'ferronnier': 'Ferronnier', 'architecte-interieur': 'Archi interieur',
  'geometre': 'Geometre', 'diagnostiqueur': 'Diagnostiqueur', 'domoticien': 'Domoticien',
  'platrier': 'Platrier', 'etancheur': 'Etancheur', 'demolition': 'Demolition',
}

// ============================================
// STATE
// ============================================

let shuttingDown = false
const startTime = Date.now()

const stats = {
  processed: 0,
  found: 0,
  phonesUpdated: 0,
  noResult: 0,
  noPhone: 0,
  duplicates: 0,
  errors: 0,
  apiCalls: 0,
  rateLimitHits: 0,
  combosCompleted: 0,
  combosTotal: 0,
}

// Adaptive delay — increases when we hit rate limits, decreases over time
let adaptiveDelay = DELAY_MS
let consecutiveRateLimits = 0

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

function normalizePhone(raw: string): string | null {
  if (!raw) return null
  let cleaned = raw.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+33')) cleaned = '0' + cleaned.substring(3)
  if (cleaned.startsWith('0033')) cleaned = '0' + cleaned.substring(4)
  if (!/^0[1-9]\d{8}$/.test(cleaned)) return null
  if (cleaned.startsWith('089')) return null
  return cleaned
}

// ============================================
// GOOGLE PLACES API
// ============================================

interface PlaceResult {
  phone: string | null
  placeId: string | null
  displayName: string | null
}

async function searchPlace(query: string, retry = 0, rateLimitRetry = 0): Promise<PlaceResult> {
  const url = 'https://places.googleapis.com/v1/places:searchText'

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY!,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.nationalPhoneNumber,places.internationalPhoneNumber',
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'fr',
        regionCode: 'FR',
        maxResultCount: 1,
      }),
      signal: AbortSignal.timeout(15000),
    })

    stats.apiCalls++

    if (response.status === 429) {
      stats.rateLimitHits++
      consecutiveRateLimits++

      if (rateLimitRetry >= MAX_RATE_LIMIT_RETRIES) {
        console.log(`      Rate limit: ${MAX_RATE_LIMIT_RETRIES} retries epuises, skip`)
        stats.errors++
        return { phone: null, placeId: null, displayName: null }
      }

      // Exponential backoff: 60s, 120s, 240s, 480s, 960s
      const backoff = RATE_LIMIT_BASE_MS * Math.pow(2, rateLimitRetry)
      // Increase adaptive delay for subsequent requests
      adaptiveDelay = Math.min(adaptiveDelay * 1.5, 5000)
      console.log(`      Rate limit (${rateLimitRetry + 1}/${MAX_RATE_LIMIT_RETRIES}), pause ${Math.round(backoff / 1000)}s... (delay adapte: ${Math.round(adaptiveDelay)}ms)`)
      await sleep(backoff)
      return searchPlace(query, retry, rateLimitRetry + 1)
    }

    // Success — reset consecutive rate limit counter and slowly reduce adaptive delay
    consecutiveRateLimits = 0
    if (adaptiveDelay > DELAY_MS) {
      adaptiveDelay = Math.max(DELAY_MS, adaptiveDelay * 0.95)
    }

    if (response.status === 403) {
      const body = await response.text()
      if (body.includes('API_KEY') || body.includes('not enabled') || body.includes('PERMISSION_DENIED')) {
        console.error('\n   GOOGLE_PLACES_API_KEY invalide ou API non activee')
        process.exit(1)
      }
      if (retry < MAX_RETRIES) { await sleep(5000); return searchPlace(query, retry + 1) }
      return { phone: null, placeId: null, displayName: null }
    }

    if (!response.ok) {
      stats.errors++
      return { phone: null, placeId: null, displayName: null }
    }

    const data = await response.json()
    const places = data.places || []

    if (places.length === 0) {
      return { phone: null, placeId: null, displayName: null }
    }

    const place = places[0]
    const phoneRaw = place.nationalPhoneNumber || place.internationalPhoneNumber || null

    return {
      phone: phoneRaw ? normalizePhone(phoneRaw) : null,
      placeId: place.id || null,
      displayName: place.displayName?.text || null,
    }
  } catch (err: unknown) {
    stats.errors++
    const message = err instanceof Error ? err.message : String(err)
    console.log(`      Fetch error: ${message} (retry ${retry})`)
    if (retry < MAX_RETRIES) { await sleep(3000 * (retry + 1)); return searchPlace(query, retry + 1) }
    return { phone: null, placeId: null, displayName: null }
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  if (!GOOGLE_API_KEY) {
    console.error('\n   GOOGLE_PLACES_API_KEY manquante dans .env.local')
    console.error('   Ajoutez GOOGLE_PLACES_API_KEY=... dans .env.local\n')
    process.exit(1)
  }

  const { supabase } = await import('./lib/supabase-admin')

  // Parse args
  const args = process.argv.slice(2)
  const flags = {
    perCombo: args.includes('--per-combo') ? parseInt(args[args.indexOf('--per-combo') + 1]) : 40,
    dept: args.includes('--dept') ? args[args.indexOf('--dept') + 1] : undefined,
    specialty: args.includes('--specialty') ? args[args.indexOf('--specialty') + 1] : undefined,
    dryRun: args.includes('--dry-run'),
    resume: args.includes('--resume'),
    budget: args.includes('--budget') ? parseInt(args[args.indexOf('--budget') + 1]) : 83000,
  }

  console.log('\n' + '='.repeat(65))
  console.log('  ENRICHISSEMENT GOOGLE PLACES — STRATEGIE SPECIALTY x DEPARTEMENT')
  console.log('='.repeat(65))
  console.log(`  Par combo:  ${flags.perCombo} providers`)
  console.log(`  Budget max: ${fmt(flags.budget)} requetes`)
  if (flags.dryRun) console.log('  MODE DRY-RUN')
  if (flags.dept) console.log(`  Filtre dept: ${flags.dept}`)
  if (flags.specialty) console.log(`  Filtre specialty: ${flags.specialty}`)
  console.log()

  // Load progress
  const processedIds = new Set<string>()
  const completedCombos = new Set<string>()
  if (flags.resume && fs.existsSync(PROGRESS_FILE)) {
    const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
    progress.processedIds?.forEach((id: string) => processedIds.add(id))
    progress.completedCombos?.forEach((c: string) => completedCombos.add(c))
    if (progress.stats) Object.assign(stats, progress.stats)
    console.log(`   Reprise: ${fmt(processedIds.size)} providers traites, ${completedCombos.size} combos termines`)
    console.log(`   ${fmt(stats.phonesUpdated)} tel mis a jour, ${fmt(stats.apiCalls)} appels API\n`)
  }

  // Build list of specialties to process
  const specsToProcess = flags.specialty
    ? [flags.specialty]
    : SPECIALTIES

  // For each specialty, get the departments that have providers without phone
  console.log('   Chargement des combos specialty x departement...\n')

  interface ComboTask {
    specialty: string
    dept: string
    count: number
  }

  const combos: ComboTask[] = []

  for (const spec of specsToProcess) {
    // Get departments with providers for this specialty
    const { data: deptData } = await supabase
      .from('providers')
      .select('address_department')
      .eq('is_active', true)
      .is('phone', null)
      .eq('specialty', spec)
      .not('address_department', 'is', null)
      .limit(50000)

    if (!deptData || deptData.length === 0) continue

    // Count per department
    const deptCounts: Record<string, number> = {}
    for (const row of deptData) {
      const d = row.address_department
      if (flags.dept && d !== flags.dept) continue
      deptCounts[d] = (deptCounts[d] || 0) + 1
    }

    // Create combos sorted by department
    for (const [dept, count] of Object.entries(deptCounts).sort((a, b) => a[0].localeCompare(b[0]))) {
      const comboKey = `${spec}|${dept}`
      if (completedCombos.has(comboKey)) continue
      combos.push({ specialty: spec, dept, count })
    }
  }

  stats.combosTotal = combos.length + completedCombos.size

  console.log(`   Combos a traiter: ${fmt(combos.length)}`)
  console.log(`   Combos deja faits: ${completedCombos.size}`)
  console.log(`   Requetes estimees: ~${fmt(combos.length * flags.perCombo)} (budget: ${fmt(flags.budget)})`)
  console.log()

  // Graceful shutdown
  process.on('SIGINT', () => {
    if (shuttingDown) process.exit(1)
    console.log('\n   Arret gracieux en cours...')
    shuttingDown = true
  })

  // Process combos
  for (const combo of combos) {
    if (shuttingDown) break
    if (stats.apiCalls >= flags.budget) {
      console.log(`\n   Budget atteint (${fmt(stats.apiCalls)} appels). Arret.`)
      break
    }

    const comboKey = `${combo.specialty}|${combo.dept}`
    const label = SPECIALTY_LABELS[combo.specialty] || combo.specialty
    const available = Math.min(combo.count, flags.perCombo)

    // Fetch providers for this combo
    const { data: providers } = await supabase
      .from('providers')
      .select('id, name, address_city, address_postal_code')
      .eq('is_active', true)
      .is('phone', null)
      .eq('specialty', combo.specialty)
      .eq('address_department', combo.dept)
      .limit(flags.perCombo)

    if (!providers || providers.length === 0) {
      completedCombos.add(comboKey)
      continue
    }

    // Filter already processed
    const batch = providers.filter(p => !processedIds.has(p.id))
    if (batch.length === 0) {
      completedCombos.add(comboKey)
      stats.combosCompleted++
      continue
    }

    let comboPhones = 0

    for (const provider of batch) {
      if (shuttingDown) break
      if (stats.apiCalls >= flags.budget) break

      stats.processed++
      processedIds.add(provider.id)

      const city = provider.address_city || ''
      const postalCode = provider.address_postal_code || ''
      const location = city || postalCode
      const searchQuery = `${provider.name} ${location} ${label}`.trim()

      const result = await searchPlace(searchQuery)

      if (!result.placeId) {
        stats.noResult++
      } else if (!result.phone) {
        stats.noPhone++
      } else {
        stats.found++

        if (!flags.dryRun) {
          const { error: updateError } = await supabase
            .from('providers')
            .update({ phone: result.phone, phone_source: 'google_maps' })
            .eq('id', provider.id)

          if (updateError) {
            if (updateError.message.includes('duplicate')) {
              stats.duplicates++
            } else {
              stats.errors++
              console.log(`      ERR ${provider.name}: ${updateError.message}`)
            }
          } else {
            stats.phonesUpdated++
            comboPhones++
          }
        } else {
          stats.phonesUpdated++
          comboPhones++
        }
      }

      // Save progress periodically
      if (stats.processed % SAVE_INTERVAL === 0) {
        saveProgress(processedIds, completedCombos)

        const elapsed = Date.now() - startTime
        const rate = (stats.apiCalls / (elapsed / 60000)).toFixed(1)
        const pct = ((stats.apiCalls / flags.budget) * 100).toFixed(1)
        console.log(`   [${fmt(stats.apiCalls)}/${fmt(flags.budget)} req ${pct}%] ${fmt(stats.phonesUpdated)} tel | ${fmt(stats.combosCompleted)}/${fmt(stats.combosTotal)} combos | ${rate} req/min | ${formatDuration(elapsed)}`)
      }

      await sleep(adaptiveDelay)
    }

    completedCombos.add(comboKey)
    stats.combosCompleted++

    // Log combo result
    const dryTag = flags.dryRun ? '[DRY] ' : ''
    console.log(`   ${dryTag}${label.padEnd(18)} | dept ${combo.dept.padStart(3)} | ${batch.length} traites → ${comboPhones} tel`)
  }

  // Final save
  saveProgress(processedIds, completedCombos)

  const elapsed = Date.now() - startTime
  const hitRate = stats.processed > 0 ? ((stats.found / stats.processed) * 100).toFixed(1) : '0'

  console.log('\n' + '='.repeat(65))
  console.log('  RESUME')
  console.log('='.repeat(65))
  console.log(`  Duree:              ${formatDuration(elapsed)}`)
  console.log(`  Combos traites:     ${fmt(stats.combosCompleted)} / ${fmt(stats.combosTotal)}`)
  console.log(`  Providers traites:  ${fmt(stats.processed)}`)
  console.log(`  Telephones trouves: ${fmt(stats.found)} (${hitRate}%)`)
  console.log(`  Telephones MAJ:     ${fmt(stats.phonesUpdated)}`)
  console.log(`  Doublons ignores:   ${fmt(stats.duplicates)}`)
  console.log(`  Sans resultat:      ${fmt(stats.noResult)}`)
  console.log(`  Sans telephone:     ${fmt(stats.noPhone)}`)
  console.log(`  Appels API:         ${fmt(stats.apiCalls)}`)
  console.log(`  Rate limits:        ${fmt(stats.rateLimitHits)}`)
  console.log(`  Erreurs:            ${stats.errors}`)
  if (flags.dryRun) console.log(`  (Mode dry-run)`)
  console.log('='.repeat(65) + '\n')

  if (shuttingDown || stats.apiCalls >= flags.budget) {
    console.log('   --resume pour reprendre\n')
  } else {
    try { fs.unlinkSync(PROGRESS_FILE) } catch {}
    console.log('   Enrichissement termine!\n')
  }

  function saveProgress(pIds: Set<string>, cCombos: Set<string>) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
      processedIds: Array.from(pIds),
      completedCombos: Array.from(cCombos),
      stats: { ...stats },
    }))
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error('\n   Erreur fatale:', e); process.exit(1) })
