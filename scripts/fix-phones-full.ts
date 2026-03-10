/**
 * Fix complet des téléphones — Déduplication + Vérification Sirene
 *
 * Phase 1: Dédupliquer les providers (même phone + même nom → garder le meilleur)
 * Phase 2: Vérifier TOUS les SIRET via API Sirene (gratuite) avec similarité améliorée
 * Phase 3: Rapport final + corrections
 *
 * Usage:
 *   npx tsx scripts/fix-phones-full.ts                # Dry-run (rapport seulement)
 *   npx tsx scripts/fix-phones-full.ts --fix          # Appliquer les corrections
 *   npx tsx scripts/fix-phones-full.ts --phase 1      # Seulement déduplication
 *   npx tsx scripts/fix-phones-full.ts --phase 2      # Seulement vérification Sirene
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const OUT_DIR = path.join(__dirname, '.verify-data')
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

const ts = new Date().toISOString().slice(0, 16).replace(/:/g, '-')
const DEDUP_REPORT = path.join(OUT_DIR, `dedup-report-${ts}.csv`)
const SIRENE_REPORT = path.join(OUT_DIR, `sirene-full-${ts}.csv`)
const SIRENE_MISMATCHES = path.join(OUT_DIR, `sirene-mismatches-${ts}.csv`)
const SUMMARY_FILE = path.join(OUT_DIR, `fix-summary-${ts}.json`)
const PROGRESS_FILE = path.join(OUT_DIR, `sirene-progress.json`)

// ============================================
// HELPERS
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function fmt(n: number): string { return n.toLocaleString('fr-FR') }

function normalizeName(name: string): string {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(sarl|sas|sa|eurl|sasu|eirl|ei|ets|entreprise|societe|ste|monsieur|madame|m\.|mme|auto[- ]?entrepreneur|micro[- ]?entreprise)\b/gi, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ').trim()
}

/**
 * Improved similarity — handles Sirene format "PERSON NAME (COMPANY NAME)"
 * Also handles short names (acronyms like "B Y P")
 */
function smartSimilarity(dbName: string, sireneName: string): number {
  const normDB = normalizeName(dbName)
  const normSirene = normalizeName(sireneName)

  // Exact match after normalization
  if (normDB === normSirene) return 1.0

  // Check if one contains the other
  if (normDB.length >= 3 && normSirene.includes(normDB)) return 0.9
  if (normSirene.length >= 3 && normDB.includes(normSirene)) return 0.85

  // Extract company name from parentheses in Sirene format: "PERSON (COMPANY)"
  const parenMatch = sireneName.match(/\(([^)]+)\)/)
  if (parenMatch) {
    const companyInParens = normalizeName(parenMatch[1])
    if (companyInParens.length >= 3 && normDB === companyInParens) return 0.95
    if (companyInParens.length >= 3 && normDB.includes(companyInParens)) return 0.85
    if (companyInParens.length >= 3 && companyInParens.includes(normDB)) return 0.80
  }

  // Jaccard on tokens
  const tA = new Set(normDB.split(' ').filter(t => t.length > 1))
  const tB = new Set(normSirene.split(' ').filter(t => t.length > 1))
  if (tA.size === 0 || tB.size === 0) {
    // Fallback for single-char token names (acronyms like "B Y P")
    const charsA = normDB.replace(/\s/g, '')
    const charsB = normSirene.replace(/\s/g, '')
    if (charsA.length >= 2 && charsA === charsB) return 0.9
    return 0
  }

  let overlap = 0
  tA.forEach(t => { if (tB.has(t)) overlap++ })
  const union = new Set([...tA, ...tB])
  const jaccard = overlap / union.size

  // Bonus: if all DB tokens are found in Sirene (subset match)
  let dbInSirene = 0
  tA.forEach(t => { if (tB.has(t)) dbInSirene++ })
  if (tA.size > 0 && dbInSirene === tA.size) {
    return Math.max(jaccard, 0.7)
  }

  return jaccard
}

/**
 * Score a provider record — higher = more data, better to keep
 */
function providerScore(p: {
  siret: string | null
  address_city: string | null
  specialty: string | null
  rating_average: string | null
  review_count: number | null
  bio: string | null
  email: string | null
}): number {
  let score = 0
  if (p.siret) score += 10
  if (p.address_city) score += 3
  if (p.specialty) score += 2
  if (p.rating_average && parseFloat(p.rating_average) > 0) score += 5
  if (p.review_count && p.review_count > 0) score += 5
  if (p.bio) score += 3
  if (p.email) score += 4
  return score
}

// ============================================
// API Sirene (recherche-entreprises.api.gouv.fr)
// ============================================

interface SireneResult {
  denomination: string
  commune?: string
  activite?: string
}

async function lookupSirene(siret: string, retry = 0): Promise<SireneResult | null> {
  const siren = siret.substring(0, 9)
  const url = `https://recherche-entreprises.api.gouv.fr/search?q=${siren}&page=1&per_page=1`

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) })

    if (response.status === 429) {
      if (retry < 5) {
        await sleep(2000 + retry * 1000)
        return lookupSirene(siret, retry + 1)
      }
      return null
    }
    if (!response.ok) return null

    const data = await response.json()
    const results = data.results
    if (!results || results.length === 0) return null

    const e = results[0]
    return {
      denomination: e.nom_complet || e.nom_raison_sociale || '',
      activite: e.activite_principale,
      commune: e.siege?.commune,
    }
  } catch {
    if (retry < 3) { await sleep(1000); return lookupSirene(siret, retry + 1) }
    return null
  }
}

// ============================================
// PHASE 1: DEDUPLICATION
// ============================================

async function phase1Dedup(supabase: SupabaseClient, fix: boolean) {
  console.log('\n' + '═'.repeat(60))
  console.log('  PHASE 1: DÉDUPLICATION DES PROVIDERS')
  console.log('═'.repeat(60))

  // Load all providers with phones
  console.log('\n  Chargement des providers avec téléphone...')
  const allProviders: Array<{
    id: string; name: string; phone: string;
    address_department: string; address_city: string | null;
    specialty: string | null; siret: string | null;
    rating_average: string | null; review_count: number | null;
    bio: string | null; email: string | null;
    created_at: string
  }> = []

  let from = 0
  const BATCH = 1000
  while (true) {
    const { data, error } = await supabase
      .from('providers')
      .select('id, name, phone, address_department, address_city, specialty, siret, rating_average, review_count, bio, email, created_at')
      .eq('is_active', true)
      .not('phone', 'is', null)
      .order('created_at', { ascending: true })
      .range(from, from + BATCH - 1)

    if (error) {
      console.error(`  ⚠ DB error at offset ${from}: ${error.message}`)
      break
    }
    if (!data || data.length === 0) break
    allProviders.push(...data)
    from += BATCH
    if (data.length < BATCH) break
    process.stdout.write(`  ${fmt(allProviders.length)} chargés...\r`)
  }
  console.log(`  ${fmt(allProviders.length)} providers chargés`)

  // Normalize phones and group
  const phoneGroups = new Map<string, typeof allProviders>()
  for (const p of allProviders) {
    let phone = p.phone.replace(/[^\d+]/g, '')
    if (phone.startsWith('+33')) phone = '0' + phone.substring(3)
    if (phone.startsWith('0033')) phone = '0' + phone.substring(4)

    const group = phoneGroups.get(phone) || []
    group.push(p)
    phoneGroups.set(phone, group)
  }

  // Find duplicates
  const duplicates = new Map<string, typeof allProviders>()
  for (const [phone, providers] of phoneGroups) {
    if (providers.length > 1) {
      duplicates.set(phone, providers)
    }
  }

  if (duplicates.size === 0) {
    console.log('  Aucun doublon trouvé !')
    return { deduped: 0, kept: 0 }
  }

  console.log(`  ${fmt(duplicates.size)} numéros en doublon détectés`)

  // Write CSV header
  fs.writeFileSync(DEDUP_REPORT,
    'action,phone,provider_id,provider_name,score,department,specialty,siret,has_reviews\n'
  )

  let totalDeduped = 0
  let totalKept = 0
  const idsToDeactivate: string[] = []

  for (const [phone, providers] of duplicates) {
    // Score each provider — keep the one with most data
    const scored = providers.map(p => ({
      ...p,
      score: providerScore(p),
    })).sort((a, b) => b.score - a.score)

    // Keep the best one, deactivate the rest
    const keeper = scored[0]
    const dupes = scored.slice(1)

    // Log
    fs.appendFileSync(DEDUP_REPORT,
      `KEEP,${phone},${keeper.id},"${keeper.name.replace(/"/g, '""')}",${keeper.score},${keeper.address_department},"${keeper.specialty || ''}",${keeper.siret || ''},${(keeper.review_count || 0) > 0}\n`
    )

    for (const dupe of dupes) {
      fs.appendFileSync(DEDUP_REPORT,
        `DEACTIVATE,${phone},${dupe.id},"${dupe.name.replace(/"/g, '""')}",${dupe.score},${dupe.address_department},"${dupe.specialty || ''}",${dupe.siret || ''},${(dupe.review_count || 0) > 0}\n`
      )
      idsToDeactivate.push(dupe.id)
      totalDeduped++
    }
    totalKept++
  }

  console.log(`  → ${fmt(totalKept)} providers gardés (meilleur score)`)
  console.log(`  → ${fmt(totalDeduped)} providers à désactiver`)
  console.log(`  Rapport: ${DEDUP_REPORT}`)

  // Apply fix
  if (fix && idsToDeactivate.length > 0) {
    console.log(`\n  🔧 Désactivation de ${fmt(idsToDeactivate.length)} doublons...`)
    let fixed = 0
    // Batch update
    for (let i = 0; i < idsToDeactivate.length; i += 100) {
      const batch = idsToDeactivate.slice(i, i + 100)
      const { error } = await supabase
        .from('providers')
        .update({ is_active: false })
        .in('id', batch)

      if (!error) fixed += batch.length
      process.stdout.write(`  ${fmt(fixed)}/${fmt(idsToDeactivate.length)} désactivés...\r`)
    }
    console.log(`  ✅ ${fmt(fixed)} providers désactivés                    `)
  } else if (!fix && idsToDeactivate.length > 0) {
    console.log(`\n  ℹ️  Dry-run — ajouter --fix pour appliquer`)
  }

  return { deduped: totalDeduped, kept: totalKept }
}

// ============================================
// PHASE 2: VERIFICATION SIRENE COMPLETE
// ============================================

async function phase2Sirene(supabase: SupabaseClient, fix: boolean) {
  console.log('\n' + '═'.repeat(60))
  console.log('  PHASE 2: VÉRIFICATION SIRET COMPLÈTE (API Sirene)')
  console.log('═'.repeat(60))

  // Load all active providers with phone + siret
  console.log('\n  Chargement des providers avec SIRET + phone...')
  const providers: Array<{
    id: string; name: string; phone: string;
    siret: string; address_department: string
  }> = []

  let from = 0
  const BATCH = 1000
  while (true) {
    const { data, error } = await supabase
      .from('providers')
      .select('id, name, phone, siret, address_department')
      .eq('is_active', true)
      .not('phone', 'is', null)
      .not('siret', 'is', null)
      .range(from, from + BATCH - 1)

    if (error || !data || data.length === 0) break
    // Filter valid SIRETs
    const valid = data.filter(p => p.siret && p.siret.length >= 9)
    providers.push(...valid as any)
    from += BATCH
    if (data.length < BATCH) break
    process.stdout.write(`  ${fmt(providers.length)} chargés...\r`)
  }
  console.log(`  ${fmt(providers.length)} providers à vérifier`)

  // Load progress (resume support)
  const checked = new Set<string>()
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const prev = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
      if (prev.checkedIds) prev.checkedIds.forEach((id: string) => checked.add(id))
      console.log(`  Reprise: ${fmt(checked.size)} déjà vérifiés`)
    } catch {}
  }

  // Filter already checked
  const toCheck = providers.filter(p => !checked.has(p.id))
  console.log(`  Restant: ${fmt(toCheck.length)}`)

  // CSV header (append mode if resuming)
  if (checked.size === 0) {
    fs.writeFileSync(SIRENE_REPORT,
      'status,provider_id,provider_name,db_phone,siret,sirene_name,similarity,department\n'
    )
    fs.writeFileSync(SIRENE_MISMATCHES,
      'provider_id,provider_name,db_phone,siret,sirene_name,similarity,department\n'
    )
  }

  let stats = { match: 0, suspect: 0, mismatch: 0, notFound: 0, total: 0 }
  const mismatchIds: string[] = []
  const startTime = Date.now()
  let shuttingDown = false

  process.on('SIGINT', () => {
    if (shuttingDown) process.exit(1)
    console.log('\n  Arrêt gracieux — sauvegarde en cours...')
    shuttingDown = true
  })

  // Process in batches of 5 (rate limit friendly)
  for (let i = 0; i < toCheck.length; i += 5) {
    if (shuttingDown) break

    const batch = toCheck.slice(i, i + 5)

    const results = await Promise.allSettled(
      batch.map(async (p) => {
        const sirene = await lookupSirene(p.siret)
        return { provider: p, sirene }
      })
    )

    for (const res of results) {
      if (res.status !== 'fulfilled') continue
      const { provider, sirene } = res.value

      stats.total++
      checked.add(provider.id)

      let status: string
      let sireneName = ''
      let sim = 0

      if (!sirene || !sirene.denomination) {
        status = 'NOT_FOUND'
        stats.notFound++
      } else {
        sireneName = sirene.denomination
        sim = smartSimilarity(provider.name, sireneName)

        if (sim >= 0.4) {
          status = 'MATCH'
          stats.match++
        } else if (sim >= 0.15) {
          status = 'SUSPECT'
          stats.suspect++
        } else {
          status = 'MISMATCH'
          stats.mismatch++
          mismatchIds.push(provider.id)

          // Write to mismatches file
          fs.appendFileSync(SIRENE_MISMATCHES,
            `${provider.id},"${provider.name.replace(/"/g, '""')}",${provider.phone},${provider.siret},"${sireneName.replace(/"/g, '""')}",${sim.toFixed(2)},${provider.address_department}\n`
          )
        }
      }

      // Write to full report
      fs.appendFileSync(SIRENE_REPORT,
        `${status},${provider.id},"${provider.name.replace(/"/g, '""')}",${provider.phone},${provider.siret},"${sireneName.replace(/"/g, '""')}",${sim.toFixed(2)},${provider.address_department}\n`
      )
    }

    // Progress
    const elapsed = (Date.now() - startTime) / 1000
    const rate = stats.total > 0 ? Math.round(stats.total / elapsed * 3600) : 0
    const eta = rate > 0 ? Math.round((toCheck.length - i) / rate * 60) : 0
    process.stdout.write(
      `  ${fmt(stats.total)}/${fmt(toCheck.length)} | ✅${fmt(stats.match)} ⚠️${fmt(stats.suspect)} ❌${fmt(stats.mismatch)} ❓${fmt(stats.notFound)} | ${rate}/h ETA:${eta}min   \r`
    )

    // Save progress every 200
    if (stats.total % 200 === 0) {
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
        checkedIds: Array.from(checked),
        stats,
        lastSave: new Date().toISOString(),
      }))
    }

    await sleep(300)
  }

  // Final save
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    checkedIds: Array.from(checked),
    stats,
    lastSave: new Date().toISOString(),
    completed: !shuttingDown,
  }))

  const matchRate = stats.total > 0 ? Math.round(stats.match / stats.total * 100) : 0
  const mismatchRate = stats.total > 0 ? Math.round(stats.mismatch / stats.total * 100) : 0

  console.log(`\n\n  Résultats Sirene (${fmt(stats.total)} vérifiés):`)
  console.log(`    ✅ MATCH:    ${fmt(stats.match)} (${matchRate}%)`)
  console.log(`    ⚠️  SUSPECT:  ${fmt(stats.suspect)}`)
  console.log(`    ❌ MISMATCH: ${fmt(stats.mismatch)} (${mismatchRate}%)`)
  console.log(`    ❓ NOT_FOUND: ${fmt(stats.notFound)}`)

  // Fix: null out phones where SIRET clearly doesn't match
  if (fix && mismatchIds.length > 0) {
    console.log(`\n  🔧 Mise à NULL de ${fmt(mismatchIds.length)} téléphones MISMATCH...`)
    let fixed = 0
    for (let i = 0; i < mismatchIds.length; i += 100) {
      const batch = mismatchIds.slice(i, i + 100)
      const { error } = await supabase
        .from('providers')
        .update({ phone: null })
        .in('id', batch)
      if (!error) fixed += batch.length
    }
    console.log(`  ✅ ${fmt(fixed)} téléphones mis à NULL`)
  }

  return { stats, mismatchIds }
}

// ============================================
// MAIN
// ============================================

async function main() {
  const args = process.argv.slice(2)
  const flags = {
    fix: args.includes('--fix'),
    phase: args.includes('--phase') ? parseInt(args[args.indexOf('--phase') + 1]) : 0,
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  console.log('\n' + '='.repeat(60))
  console.log('  FIX COMPLET DES TÉLÉPHONES')
  console.log('='.repeat(60))
  console.log(`  Mode: ${flags.fix ? '🔧 FIX (corrections appliquées)' : '📊 DRY-RUN (rapport seulement)'}`)
  console.log(`  Phase: ${flags.phase || 'toutes'}`)

  const startTime = Date.now()
  let dedupResult = { deduped: 0, kept: 0 }
  let sireneResult = { stats: { match: 0, suspect: 0, mismatch: 0, notFound: 0, total: 0 }, mismatchIds: [] as string[] }

  // Phase 1
  if (!flags.phase || flags.phase === 1) {
    dedupResult = await phase1Dedup(supabase, flags.fix)
  }

  // Phase 2
  if (!flags.phase || flags.phase === 2) {
    sireneResult = await phase2Sirene(supabase, flags.fix)
  }

  // Final summary
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)

  const summary = {
    date: new Date().toISOString(),
    duration_min: parseFloat(elapsed),
    fix_applied: flags.fix,
    dedup: {
      duplicates_deactivated: dedupResult.deduped,
      unique_kept: dedupResult.kept,
    },
    sirene: {
      total_verified: sireneResult.stats.total,
      match: sireneResult.stats.match,
      suspect: sireneResult.stats.suspect,
      mismatch: sireneResult.stats.mismatch,
      not_found: sireneResult.stats.notFound,
      match_rate_pct: sireneResult.stats.total > 0 ? Math.round(sireneResult.stats.match / sireneResult.stats.total * 100) : 0,
    },
  }
  fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2))

  console.log('\n' + '='.repeat(60))
  console.log('  RÉSUMÉ FINAL')
  console.log('='.repeat(60))
  console.log(`  Durée: ${elapsed} min`)
  if (!flags.phase || flags.phase === 1) {
    console.log(`\n  📋 Déduplication:`)
    console.log(`     ${fmt(dedupResult.deduped)} doublons ${flags.fix ? 'désactivés' : 'détectés'}`)
    console.log(`     ${fmt(dedupResult.kept)} providers uniques conservés`)
  }
  if (!flags.phase || flags.phase === 2) {
    console.log(`\n  📋 Vérification Sirene:`)
    console.log(`     ${fmt(sireneResult.stats.total)} vérifiés`)
    console.log(`     ✅ ${fmt(sireneResult.stats.match)} confirmés`)
    console.log(`     ❌ ${fmt(sireneResult.stats.mismatch)} ${flags.fix ? 'corrigés (tel→NULL)' : 'à corriger'}`)
  }
  console.log(`\n  Fichiers: ${OUT_DIR}`)
  if (!flags.fix) {
    console.log(`\n  → Pour appliquer: npx tsx scripts/fix-phones-full.ts --fix`)
  }
  console.log('='.repeat(60) + '\n')
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error('Erreur fatale:', e); process.exit(1) })
