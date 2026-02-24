/**
 * 🚀 Collecte Massive d'Artisans de France
 *
 * Source: API Annuaire des Entreprises (recherche-entreprises.api.gouv.fr)
 * API GRATUITE du gouvernement français — pas de clé API requise
 * Stratégie: 16 codes NAF × 101 départements = 1 616 combinaisons
 * Rate limit: 7 req/s (150ms entre chaque requête)
 *
 * Usage:
 *   npx tsx scripts/collect-artisans.ts                # Collecte complète
 *   npx tsx scripts/collect-artisans.ts --resume        # Reprendre après interruption
 *   npx tsx scripts/collect-artisans.ts --naf 43.21A    # Un seul métier
 *   npx tsx scripts/collect-artisans.ts --dept 75       # Un seul département
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { supabase } from './lib/supabase-admin'
import {
  CODES_NAF,
  DEPARTEMENTS,
  NAF_TO_SPECIALTY,
  DEPARTEMENT_NAMES,
  generateCollectionTasks,
} from './lib/naf-config'

// ============================================
// CONFIG
// ============================================

const API_BASE = 'https://recherche-entreprises.api.gouv.fr'
const RATE_LIMIT_MS = 150  // 7 req/s → ~143ms, 150ms for safety
const PER_PAGE = 25        // Max allowed by API
const MAX_RETRIES = 3
const PROGRESS_SAVE_INTERVAL = 10 // Save progress every N tasks
const PROGRESS_FILE = path.join(__dirname, '.collect-progress.json')

// ============================================
// STATE
// ============================================

let shuttingDown = false

const stats = {
  apiCalls: 0,
  collected: 0,
  created: 0,
  updated: 0,
  skipped: 0,
  errors: 0,
  tasksCompleted: 0,
  tasksTotal: 0,
  pagesTotal: 0,
  truncatedTasks: 0, // Tasks where API hit max pages
}

let startTime = Date.now()
let lastRequestTime = 0
let validColumns: Set<string> = new Set()

// ============================================
// HELPERS
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function rateLimitWait(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed < RATE_LIMIT_MS) {
    await sleep(RATE_LIMIT_MS - elapsed)
  }
  lastRequestTime = Date.now()
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80)
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h${m % 60}m${s % 60}s`
  if (m > 0) return `${m}m${s % 60}s`
  return `${s}s`
}

function formatNumber(n: number): string {
  return n.toLocaleString('fr-FR')
}

// ============================================
// SCHEMA DETECTION — Detect which columns exist
// ============================================

const ALL_POSSIBLE_COLUMNS = [
  // Core (should always exist)
  'name', 'slug', 'siren', 'siret',
  // Location
  'address_street', 'address_postal_code', 'address_city', 'address_department',
  'latitude', 'longitude',
  // Business
  'specialty', 'legal_form', 'creation_date', 'employee_count',
  // Status
  'is_active', 'is_verified', 'noindex', 'source', 'source_id',
  // Migration 108
  'code_naf', 'libelle_naf', 'legal_form_code', 'is_artisan',
  'source_api', 'derniere_maj_api', 'data_quality_score', 'data_quality_flags',
  // Stable ID (public URL identifier)
  'stable_id',
]

// Generate a random 16-char URL-safe stable_id
function generateStableId(): string {
  return crypto.randomBytes(12).toString('base64url').substring(0, 16)
}

async function detectColumns(): Promise<void> {
  console.log('   Detection du schema providers...')

  // Test columns in small batches to find which exist
  for (const col of ALL_POSSIBLE_COLUMNS) {
    const { error } = await supabase
      .from('providers')
      .select(col)
      .limit(0)

    if (!error) {
      validColumns.add(col)
    }
  }

  console.log(`   ${validColumns.size}/${ALL_POSSIBLE_COLUMNS.length} colonnes detectees`)

  const missing = ALL_POSSIBLE_COLUMNS.filter(c => !validColumns.has(c))
  if (missing.length > 0) {
    console.log(`   Colonnes absentes: ${missing.join(', ')}`)
  }
  console.log('')
}

// ============================================
// SMART UPSERT — Only uses columns that exist
// ============================================

interface UpsertResult {
  created: number
  updated: number
  skipped: number
  errors: number
}

function filterRecord(record: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (validColumns.has(key)) {
      filtered[key] = value
    }
  }
  return filtered
}

async function smartUpsertProviders(records: Record<string, unknown>[]): Promise<UpsertResult> {
  const result: UpsertResult = { created: 0, updated: 0, skipped: 0, errors: 0 }
  if (records.length === 0) return result

  // Filter to valid columns + validate SIREN
  const validRecords = records
    .filter(r => r.siren && String(r.siren).length === 9)
    .map(filterRecord)

  result.skipped += records.length - validRecords.length
  if (validRecords.length === 0) return result

  // Check which SIRENs already exist
  const sirens = validRecords.map(r => String(r.siren))
  const { data: existingProviders } = await supabase
    .from('providers')
    .select('siren')
    .in('siren', sirens)

  const existingSirens = new Set((existingProviders || []).map((p: any) => p.siren))

  // Split into inserts and updates
  const toInsert = validRecords.filter(r => !existingSirens.has(String(r.siren)))
  const toUpdate = validRecords.filter(r => existingSirens.has(String(r.siren)))

  // Batch insert new providers — generate stable_id if column exists
  if (toInsert.length > 0) {
    if (validColumns.has('stable_id')) {
      for (const record of toInsert) {
        if (!record.stable_id) {
          record.stable_id = generateStableId()
        }
      }
    }
    const { error } = await supabase.from('providers').insert(toInsert)

    if (error) {
      // Log first batch error for diagnostics
      if (stats.errors === 0) {
        console.error(`\n   [DEBUG] Batch insert error: ${error.message}`)
        console.error(`   [DEBUG] Code: ${error.code}, Details: ${error.details}`)
      }
      // Fallback to individual inserts
      let loggedIndividual = false
      for (const record of toInsert) {
        const { error: singleError } = await supabase.from('providers').insert(record)
        if (singleError) {
          if (!loggedIndividual && stats.errors < 3) {
            console.error(`   [DEBUG] Individual insert error: ${singleError.message}`)
            console.error(`   [DEBUG] Record siren: ${record.siren}, slug: ${record.slug}`)
            loggedIndividual = true
          }
          result.errors++
        } else {
          result.created++
        }
      }
    } else {
      result.created += toInsert.length
    }
  }

  // Update existing providers (only API-sourced fields, batch)
  if (toUpdate.length > 0) {
    const updateFields = [
      'code_naf', 'libelle_naf', 'legal_form_code', 'specialty',
      'is_artisan', 'source_api', 'derniere_maj_api', 'siret',
    ].filter(f => validColumns.has(f))

    for (const record of toUpdate) {
      const update: Record<string, unknown> = {}
      for (const field of updateFields) {
        if (record[field] !== null && record[field] !== undefined) {
          update[field] = record[field]
        }
      }

      // Only update address if we have data and the existing record might not
      if (record.latitude !== null && record.latitude !== undefined) {
        update.latitude = record.latitude
        update.longitude = record.longitude
      }

      if (Object.keys(update).length > 0) {
        const { error } = await supabase
          .from('providers')
          .update(update)
          .eq('siren', String(record.siren))

        if (error) {
          result.errors++
        } else {
          result.updated++
        }
      } else {
        result.skipped++
      }
    }
  }

  return result
}

// Map API employee count codes to actual numbers
// See: https://www.sirene.fr/sirene/public/variable/tefen
function parseEmployeeCount(code: string | null): number | null {
  if (!code) return null
  const map: Record<string, number> = {
    '00': 0, '01': 1, '02': 3, '03': 6, '11': 10, '12': 20,
    '21': 50, '22': 100, '31': 200, '32': 250, '41': 500,
    '42': 1000, '51': 2000, '52': 5000, '53': 10000,
  }
  return map[code] ?? null
}

// ============================================
// API
// ============================================

interface ApiResponse {
  results: ApiEntreprise[]
  total_results: number
  page: number
  per_page: number
  total_pages: number
}

interface ApiEntreprise {
  siren: string
  nom_complet: string
  nom_raison_sociale: string | null
  activite_principale: string
  categorie_juridique: string
  nature_juridique: string
  date_creation: string
  etat_administratif: string
  tranche_effectif_salarie: string | null
  siege: {
    siret: string
    adresse: string
    code_postal: string
    commune: string
    geo_adresse: string | null
    latitude: string | null
    longitude: string | null
  }
  dirigeants: Array<{
    nom: string
    prenoms: string
    qualite: string
  }>
  complements?: {
    est_rge: boolean
  }
}

async function searchAPI(
  codeNaf: string,
  departement: string,
  page: number = 1,
): Promise<ApiResponse> {
  await rateLimitWait()
  stats.apiCalls++

  const url = new URL(`${API_BASE}/search`)
  url.searchParams.set('activite_principale', codeNaf)
  url.searchParams.set('departement', departement)
  url.searchParams.set('etat_administratif', 'A') // Only active businesses
  url.searchParams.set('per_page', String(PER_PAGE))
  url.searchParams.set('page', String(page))

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url.toString(), {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      })

      if (response.status === 429) {
        const wait = 2000 * attempt
        console.warn(`   ⚠️  Rate limit — attente ${wait / 1000}s (tentative ${attempt}/${MAX_RETRIES})`)
        await sleep(wait)
        continue
      }

      if (response.status === 404) {
        return { results: [], total_results: 0, page, per_page: PER_PAGE, total_pages: 0 }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return (await response.json()) as ApiResponse
    } catch (error: any) {
      if (attempt === MAX_RETRIES) {
        throw new Error(`API échec après ${MAX_RETRIES} tentatives: ${error.message}`)
      }
      await sleep(1000 * attempt)
    }
  }

  throw new Error('Unreachable')
}

// ============================================
// TRANSFORM
// ============================================

function transformEntreprise(
  e: ApiEntreprise,
  codeNaf: string,
  departement: string,
): Record<string, unknown> {
  const siege = e.siege || {} as any
  const name = e.nom_complet || 'Entreprise inconnue'
  const city = siege.commune || ''
  const siren = e.siren

  const record: Record<string, unknown> = {
    // Identity
    siren,
    siret: siege.siret || null,
    name,
    slug: `${slugify(name)}-${siren}`,
    // NOTE: stable_id auto-generated by DB trigger

    // Location
    address_street: siege.adresse || siege.geo_adresse || null,
    address_postal_code: siege.code_postal || null,
    address_city: city || null,
    address_department: departement,
    latitude: siege.latitude ? parseFloat(siege.latitude) : null,
    longitude: siege.longitude ? parseFloat(siege.longitude) : null,

    // Business
    specialty: NAF_TO_SPECIALTY[codeNaf] || null,
    legal_form: e.nature_juridique || null,
    creation_date: e.date_creation || null,
    employee_count: parseEmployeeCount(e.tranche_effectif_salarie),

    // Status
    is_active: true,
    source: 'annuaire_entreprises',
    source_id: siren,

    // Migration 108 fields (filterRecord will strip if columns don't exist)
    code_naf: e.activite_principale || codeNaf,
    libelle_naf: CODES_NAF[codeNaf] || null,
    legal_form_code: e.categorie_juridique || null,
    is_artisan: true,
    source_api: 'annuaire_entreprises',
    derniere_maj_api: new Date().toISOString(),
  }

  return record
}

// ============================================
// PROGRESS TRACKING (file-based for resume)
// ============================================

interface ProgressState {
  completedTasks: string[] // "NAF|DEPT" keys
  startedAt: string
  stats: typeof stats
}

function loadProgress(): ProgressState {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
      return data as ProgressState
    }
  } catch { /* ignore */ }
  return {
    completedTasks: [],
    startedAt: new Date().toISOString(),
    stats: { ...stats },
  }
}

function saveProgress(progress: ProgressState): void {
  progress.stats = { ...stats }
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

function clearProgress(): void {
  try { fs.unlinkSync(PROGRESS_FILE) } catch { /* ignore */ }
}

// ============================================
// COLLECTION FOR A SINGLE TASK (NAF × DEPT)
// ============================================

async function collectForTask(
  codeNaf: string,
  departement: string,
): Promise<{ collected: number; pages: number; truncated: boolean }> {
  let collected = 0
  let page = 1
  let totalPages = 1
  let truncated = false

  while (page <= totalPages && !shuttingDown) {
    const response = await searchAPI(codeNaf, departement, page)
    totalPages = Math.min(response.total_pages, 400) // API caps at 10000 results = 400 pages

    if (response.results.length === 0) break

    // Detect truncation (API can't return more than 10000 results)
    if (page === 1 && response.total_results > 10000) {
      truncated = true
      stats.truncatedTasks++
    }

    // Transform — only active, open, non-radié businesses
    const records = response.results
      .filter(e => {
        if (!e.siren || e.siren.length !== 9) return false
        // Entreprise active (pas cessée/radiée)
        if ((e as any).etat_administratif !== 'A') return false
        // Siège ouvert (pas fermé)
        if ((e as any).siege?.etat_administratif === 'F') return false
        // Diffusible (pas de données restreintes)
        if ((e as any).statut_diffusion === 'P') return false
        return true
      })
      .map(e => transformEntreprise(e, codeNaf, departement))

    if (records.length > 0) {
      // Upsert batch
      const result = await smartUpsertProviders(records)
      stats.created += result.created
      stats.updated += result.updated
      stats.skipped += result.skipped
      stats.errors += result.errors
    }

    collected += response.results.length
    stats.collected += response.results.length
    stats.pagesTotal++

    page++
  }

  return { collected, pages: totalPages, truncated }
}

// ============================================
// CLI ARGS
// ============================================

function parseArgs(): { naf?: string; dept?: string; resume: boolean; dryRun: boolean } {
  const args = process.argv.slice(2)
  const result: { naf?: string; dept?: string; resume: boolean; dryRun: boolean } = {
    resume: false,
    dryRun: false,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--naf': result.naf = args[++i]; break
      case '--dept': result.dept = args[++i]; break
      case '--resume': result.resume = true; break
      case '--dry-run': result.dryRun = true; break
    }
  }

  // Validate NAF code
  if (result.naf && !CODES_NAF[result.naf]) {
    console.error(`❌ Code NAF invalide: ${result.naf}`)
    console.error(`   Codes valides: ${Object.keys(CODES_NAF).join(', ')}`)
    process.exit(1)
  }

  // Validate department
  if (result.dept && !DEPARTEMENTS.includes(result.dept)) {
    console.error(`❌ Département invalide: ${result.dept}`)
    process.exit(1)
  }

  return result
}

// ============================================
// MAIN
// ============================================

async function main() {
  const args = parseArgs()

  console.log('')
  console.log('='.repeat(60))
  console.log('  COLLECTE MASSIVE D\'ARTISANS DE FRANCE')
  console.log('  Source: API Annuaire des Entreprises (gouv.fr)')
  console.log('='.repeat(60))
  console.log('')

  // Graceful shutdown
  process.on('SIGINT', () => {
    if (shuttingDown) {
      console.log('\n\n   Arret force')
      process.exit(1)
    }
    console.log('\n\n   Arret gracieux en cours... (Ctrl+C a nouveau pour forcer)')
    shuttingDown = true
  })

  // Detect available columns
  await detectColumns()

  // Build task list
  let tasks: Array<{ codeNaf: string; departement: string }>

  if (args.naf && args.dept) {
    tasks = [{ codeNaf: args.naf, departement: args.dept }]
  } else if (args.naf) {
    tasks = DEPARTEMENTS.map(d => ({ codeNaf: args.naf!, departement: d }))
  } else if (args.dept) {
    tasks = Object.keys(CODES_NAF).map(n => ({ codeNaf: n, departement: args.dept! }))
  } else {
    tasks = generateCollectionTasks()
  }

  stats.tasksTotal = tasks.length

  // Resume support
  let progress: ProgressState
  if (args.resume) {
    progress = loadProgress()
    const before = tasks.length
    tasks = tasks.filter(t => !progress.completedTasks.includes(`${t.codeNaf}|${t.departement}`))

    // Restore stats from saved progress
    if (progress.stats) {
      Object.assign(stats, progress.stats)
    }

    console.log(`   Reprise: ${formatNumber(before - tasks.length)} taches completees, ${formatNumber(tasks.length)} restantes`)
    console.log('')
  } else {
    progress = { completedTasks: [], startedAt: new Date().toISOString(), stats }
  }

  console.log(`   ${formatNumber(tasks.length)} taches a traiter`)
  console.log(`   ${Object.keys(CODES_NAF).length} metiers x ${DEPARTEMENTS.length} departements`)
  console.log(`   API: recherche-entreprises.api.gouv.fr (gratuite, 7 req/s)`)
  console.log('')

  if (args.dryRun) {
    console.log('   --dry-run: aucune ecriture en base')
    process.exit(0)
  }

  startTime = Date.now()
  let taskIndex = 0

  for (const task of tasks) {
    if (shuttingDown) break

    taskIndex++
    const nafLabel = CODES_NAF[task.codeNaf] || task.codeNaf
    const deptName = DEPARTEMENT_NAMES[task.departement] || task.departement
    const shortLabel = nafLabel.length > 35 ? nafLabel.substring(0, 35) + '...' : nafLabel

    // Display current task
    const elapsed = Date.now() - startTime
    const rate = elapsed > 0 ? Math.round(stats.collected / (elapsed / 60000)) : 0
    process.stdout.write(
      `\r   [${taskIndex}/${tasks.length}] ${shortLabel} | ${task.departement} ${deptName}` +
      ` | ${formatNumber(stats.collected)} total | ${rate}/min` +
      ' '.repeat(20),
    )

    try {
      const { collected, pages, truncated } = await collectForTask(task.codeNaf, task.departement)

      if (collected > 0) {
        process.stdout.write(
          `\r   [${taskIndex}/${tasks.length}] ${shortLabel} | ${task.departement} ${deptName}` +
          ` -> ${collected} artisans (${pages}p)` +
          (truncated ? ' [TRONQUE >10000]' : '') +
          ' '.repeat(20) + '\n',
        )
      }

      stats.tasksCompleted++

      // Save progress periodically
      progress.completedTasks.push(`${task.codeNaf}|${task.departement}`)
      if (taskIndex % PROGRESS_SAVE_INTERVAL === 0) {
        saveProgress(progress)
      }
    } catch (error: any) {
      process.stdout.write('\n')
      console.error(`   X  Erreur [${task.codeNaf}|${task.departement}]: ${error.message}`)
      stats.errors++
    }
  }

  // Save final progress
  saveProgress(progress)

  if (shuttingDown) {
    console.log(`\n   Collecte interrompue. Utilisez --resume pour reprendre.`)
    console.log(`   Progression sauvegardee dans ${PROGRESS_FILE}`)
  } else {
    clearProgress()
  }

  // ============================================
  // QUALITY SCORING (if data_quality_score column exists)
  // ============================================

  if (validColumns.has('data_quality_score') && !shuttingDown && stats.created > 0) {
    console.log('\n   Calcul des scores de qualite...')
    try {
      const { calculateQualityScore } = await import('./lib/data-quality')
      let offset = 0
      const batchSize = 500
      let totalScored = 0

      while (true) {
        const { data: providers } = await supabase
          .from('providers')
          .select('*')
          .eq('source', 'annuaire_entreprises')
          .eq('data_quality_score', 0)
          .range(offset, offset + batchSize - 1)

        if (!providers || providers.length === 0) break

        for (const provider of providers) {
          const { score, flags } = calculateQualityScore(provider)
          await supabase
            .from('providers')
            .update({ data_quality_score: score, data_quality_flags: flags })
            .eq('id', provider.id)
          totalScored++
        }

        offset += batchSize
        process.stdout.write(`\r   Scores: ${formatNumber(totalScored)} providers evalues...`)
      }

      if (totalScored > 0) {
        console.log(`\r   Scores: ${formatNumber(totalScored)} providers evalues`)
      }
    } catch (error: any) {
      console.error(`   Erreur scoring: ${error.message}`)
    }
  }

  // ============================================
  // SUMMARY
  // ============================================

  const elapsed = Date.now() - startTime
  const rate = elapsed > 0 ? Math.round(stats.collected / (elapsed / 60000)) : 0
  const successRate = stats.collected > 0
    ? Math.round(((stats.created + stats.updated) / stats.collected) * 100)
    : 0

  console.log('')
  console.log('='.repeat(60))
  console.log('  RESUME DE LA COLLECTE')
  console.log('='.repeat(60))
  console.log(`  Duree:              ${formatDuration(elapsed)}`)
  console.log(`  Requetes API:       ${formatNumber(stats.apiCalls)}`)
  console.log(`  Pages parcourues:   ${formatNumber(stats.pagesTotal)}`)
  console.log(`  Taches completees:  ${formatNumber(stats.tasksCompleted)} / ${formatNumber(stats.tasksTotal)}`)
  console.log('  ' + '-'.repeat(40))
  console.log(`  Artisans collectes: ${formatNumber(stats.collected)}`)
  console.log(`  Crees:              ${formatNumber(stats.created)}`)
  console.log(`  Mis a jour:         ${formatNumber(stats.updated)}`)
  console.log(`  Ignores:            ${formatNumber(stats.skipped)}`)
  console.log(`  Erreurs:            ${formatNumber(stats.errors)}`)
  console.log('  ' + '-'.repeat(40))
  console.log(`  Taux de reussite:   ${successRate}%`)
  console.log(`  Debit:              ${formatNumber(rate)} artisans/min`)
  if (stats.truncatedTasks > 0) {
    console.log(`  Taches tronquees:   ${stats.truncatedTasks} (>10000 resultats)`)
  }
  console.log('='.repeat(60))
  console.log('')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n   Erreur fatale:', error)
    process.exit(1)
  })
