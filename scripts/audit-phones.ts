/**
 * Audit des téléphones — Analyse SANS API payante
 *
 * Vérifie l'intégrité des téléphones en base via :
 *   1. Doublons : même téléphone sur plusieurs providers
 *   2. API Sirene (gratuite) : vérifie que le SIRET correspond au bon artisan
 *   3. Anomalies : format invalide, numéros surtaxés, etc.
 *   4. Statistiques globales
 *
 * Usage:
 *   npx tsx scripts/audit-phones.ts
 *   npx tsx scripts/audit-phones.ts --dept 13
 *   npx tsx scripts/audit-phones.ts --sirene          # + vérification SIRET via API Sirene
 *   npx tsx scripts/audit-phones.ts --sirene --fix     # Met à NULL les téléphones où SIRET ≠ nom
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const OUT_DIR = path.join(__dirname, '.verify-data')
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

const REPORT_FILE = path.join(OUT_DIR, `audit-report-${new Date().toISOString().slice(0, 10)}.csv`)
const DUPES_FILE = path.join(OUT_DIR, `audit-doublons-${new Date().toISOString().slice(0, 10)}.csv`)
const SUMMARY_FILE = path.join(OUT_DIR, `audit-summary-${new Date().toISOString().slice(0, 10)}.json`)

// ============================================
// HELPERS
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function normalizeName(name: string): string {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(sarl|sas|sa|eurl|sasu|eirl|ei|ets|entreprise|societe|ste|monsieur|madame|m\.|mme)\b/gi, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ').trim()
}

function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a)
  const nb = normalizeName(b)
  const tA = new Set(na.split(' ').filter(t => t.length > 1))
  const tB = new Set(nb.split(' ').filter(t => t.length > 1))
  if (tA.size === 0 || tB.size === 0) return 0
  let overlap = 0
  tA.forEach(t => { if (tB.has(t)) overlap++ })
  const union = new Set([...tA, ...tB])
  return overlap / union.size
}

// ============================================
// API SIRENE (gratuite — api.insee.fr)
// ============================================

interface SireneResult {
  siren: string
  siret: string
  denomination: string
  prenom?: string
  nom?: string
  activite?: string
  commune?: string
}

async function lookupSirene(siret: string, retry = 0): Promise<SireneResult | null> {
  // API Sirene ouverte (pas besoin de token pour les données publiques)
  const url = `https://api.insee.fr/api-sirene/3.11/siret/${siret}`

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (response.status === 429) {
      if (retry < 3) { await sleep(2000); return lookupSirene(siret, retry + 1) }
      return null
    }
    if (response.status === 404) return null
    if (response.status === 403 || response.status === 401) {
      // Fallback: use recherche-entreprises.api.gouv.fr (no auth needed)
      return lookupRechercheEntreprises(siret, retry)
    }
    if (!response.ok) return null

    const data = await response.json()
    const etab = data.etablissement
    if (!etab) return null

    const unite = etab.uniteLegale
    const denomination = unite?.denominationUniteLegale
      || `${unite?.prenomUsuelUniteLegale || ''} ${unite?.nomUniteLegale || ''}`.trim()

    return {
      siren: etab.siren,
      siret: etab.siret,
      denomination,
      prenom: unite?.prenomUsuelUniteLegale,
      nom: unite?.nomUniteLegale,
      activite: etab.uniteLegale?.activitePrincipaleUniteLegale,
      commune: etab.adresseEtablissement?.libelleCommuneEtablissement,
    }
  } catch {
    if (retry < 2) { await sleep(1000); return lookupSirene(siret, retry + 1) }
    return null
  }
}

async function lookupRechercheEntreprises(siret: string, retry = 0): Promise<SireneResult | null> {
  // API gratuite sans authentification
  const siren = siret.substring(0, 9)
  const url = `https://recherche-entreprises.api.gouv.fr/search?q=${siren}&page=1&per_page=1`

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    })

    if (response.status === 429) {
      if (retry < 3) { await sleep(2000); return lookupRechercheEntreprises(siret, retry + 1) }
      return null
    }
    if (!response.ok) return null

    const data = await response.json()
    const results = data.results
    if (!results || results.length === 0) return null

    const entreprise = results[0]
    return {
      siren: entreprise.siren || siren,
      siret,
      denomination: entreprise.nom_complet || entreprise.nom_raison_sociale || '',
      activite: entreprise.activite_principale,
      commune: entreprise.siege?.commune,
    }
  } catch {
    if (retry < 2) { await sleep(1000); return lookupRechercheEntreprises(siret, retry + 1) }
    return null
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  const args = process.argv.slice(2)
  const flags = {
    dept: args.includes('--dept') ? args[args.indexOf('--dept') + 1] : undefined,
    sirene: args.includes('--sirene'),
    fix: args.includes('--fix'),
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  console.log('\n' + '='.repeat(60))
  console.log('  AUDIT DES TELEPHONES')
  console.log('='.repeat(60))
  console.log(`  Mode Sirene: ${flags.sirene ? 'OUI' : 'NON (ajouter --sirene)'}`)
  console.log(`  Fix mode: ${flags.fix ? 'OUI' : 'NON'}`)
  console.log()

  // ══════════════════════════════════════════
  // PHASE 1: Stats globales
  // ══════════════════════════════════════════

  console.log('── PHASE 1: Statistiques globales ──\n')

  // Total providers
  const { count: totalProviders } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Providers with phone
  const { count: withPhone } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .not('phone', 'is', null)

  // Providers without phone
  const { count: withoutPhone } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .is('phone', null)

  console.log(`  Total providers actifs:    ${totalProviders?.toLocaleString('fr-FR')}`)
  console.log(`  Avec téléphone:            ${withPhone?.toLocaleString('fr-FR')} (${totalProviders ? Math.round((withPhone || 0) / totalProviders * 100) : 0}%)`)
  console.log(`  Sans téléphone:            ${withoutPhone?.toLocaleString('fr-FR')}`)

  // ══════════════════════════════════════════
  // PHASE 2: Détection des doublons
  // ══════════════════════════════════════════

  console.log('\n── PHASE 2: Détection des doublons (même tél sur plusieurs providers) ──\n')

  // Fetch all providers with phones
  const allProviders: Array<{
    id: string; name: string; phone: string;
    address_department: string; address_city: string | null;
    specialty: string | null; siret: string | null
  }> = []

  let from = 0
  const BATCH = 1000
  while (true) {
    let query = supabase
      .from('providers')
      .select('id, name, phone, address_department, address_city, specialty, siret')
      .eq('is_active', true)
      .not('phone', 'is', null)
      .range(from, from + BATCH - 1)

    if (flags.dept) {
      query = query.eq('address_department', flags.dept)
    }

    const { data, error } = await query
    if (error) { console.error('  DB error:', error.message); break }
    if (!data || data.length === 0) break
    allProviders.push(...data)
    from += BATCH
    if (data.length < BATCH) break
    process.stdout.write(`  Chargement: ${allProviders.length} providers...\r`)
  }
  console.log(`  Chargé: ${allProviders.length.toLocaleString('fr-FR')} providers avec téléphone`)

  // Group by phone
  const phoneGroups = new Map<string, typeof allProviders>()
  for (const p of allProviders) {
    // Normalize phone for comparison
    let phone = p.phone.replace(/[^\d+]/g, '')
    if (phone.startsWith('+33')) phone = '0' + phone.substring(3)
    if (phone.startsWith('0033')) phone = '0' + phone.substring(4)

    const group = phoneGroups.get(phone) || []
    group.push(p)
    phoneGroups.set(phone, group)
  }

  const duplicates = new Map<string, typeof allProviders>()
  for (const [phone, providers] of phoneGroups) {
    if (providers.length > 1) {
      duplicates.set(phone, providers)
    }
  }

  console.log(`  Téléphones uniques:        ${phoneGroups.size.toLocaleString('fr-FR')}`)
  console.log(`  Téléphones en doublon:     ${duplicates.size.toLocaleString('fr-FR')}`)

  // Write duplicates report
  if (duplicates.size > 0) {
    fs.writeFileSync(DUPES_FILE,
      'phone,count,provider_ids,provider_names,departments,specialties\n'
    )

    let totalDupeProviders = 0
    const sortedDupes = Array.from(duplicates.entries())
      .sort((a, b) => b[1].length - a[1].length)

    for (const [phone, providers] of sortedDupes) {
      totalDupeProviders += providers.length
      const line = [
        phone,
        providers.length,
        `"${providers.map(p => p.id).join('; ')}"`,
        `"${providers.map(p => p.name.replace(/"/g, "'")).join('; ')}"`,
        `"${providers.map(p => p.address_department).join('; ')}"`,
        `"${providers.map(p => p.specialty || '').join('; ')}"`,
      ].join(',')
      fs.appendFileSync(DUPES_FILE, line + '\n')
    }

    console.log(`  Providers concernés:       ${totalDupeProviders.toLocaleString('fr-FR')}`)
    console.log(`  Pire doublon:              ${sortedDupes[0][1].length}x le même numéro`)
    console.log(`  Rapport doublons:          ${DUPES_FILE}`)

    // Show top 10 worst duplicates
    console.log('\n  Top 10 pires doublons:')
    for (const [phone, providers] of sortedDupes.slice(0, 10)) {
      const names = providers.map(p => p.name).slice(0, 3).join(', ')
      const depts = [...new Set(providers.map(p => p.address_department))].join(',')
      console.log(`    ${phone} → ${providers.length}x (depts: ${depts}) — ${names}${providers.length > 3 ? '...' : ''}`)
    }
  }

  // ══════════════════════════════════════════
  // PHASE 3: Anomalies de format
  // ══════════════════════════════════════════

  console.log('\n── PHASE 3: Anomalies de format ──\n')

  let invalidFormat = 0
  let mobileCount = 0
  let fixeCount = 0
  let otherFormat = 0
  const invalidPhones: Array<{ id: string; name: string; phone: string }> = []

  for (const p of allProviders) {
    const phone = p.phone.replace(/\s/g, '')
    // Normalize
    let cleaned = phone.replace(/[^\d+]/g, '')
    if (cleaned.startsWith('+33')) cleaned = '0' + cleaned.substring(3)

    if (!/^0[1-9]\d{8}$/.test(cleaned)) {
      invalidFormat++
      invalidPhones.push({ id: p.id, name: p.name, phone: p.phone })
    } else if (/^0[67]/.test(cleaned)) {
      mobileCount++
    } else if (/^0[1-5]/.test(cleaned)) {
      fixeCount++
    } else {
      otherFormat++
    }
  }

  console.log(`  Mobiles (06/07):           ${mobileCount.toLocaleString('fr-FR')}`)
  console.log(`  Fixes (01-05):             ${fixeCount.toLocaleString('fr-FR')}`)
  console.log(`  Autres (08/09):            ${otherFormat}`)
  console.log(`  Format invalide:           ${invalidFormat}`)

  if (invalidPhones.length > 0) {
    console.log('\n  Exemples de formats invalides:')
    for (const p of invalidPhones.slice(0, 10)) {
      console.log(`    "${p.phone}" — ${p.name}`)
    }
  }

  // ══════════════════════════════════════════
  // PHASE 4: Vérification SIRET via API Sirene
  // ══════════════════════════════════════════

  const sireneResults: Array<{
    provider_id: string
    provider_name: string
    phone: string
    siret: string
    sirene_name: string
    similarity: number
    status: 'MATCH' | 'SUSPECT' | 'MISMATCH' | 'NOT_FOUND'
  }> = []

  if (flags.sirene) {
    console.log('\n── PHASE 4: Vérification SIRET via API Sirene (gratuite) ──\n')

    // Filter providers that have both phone AND siret
    const withSiret = allProviders.filter(p => p.siret && p.siret.length >= 9)
    console.log(`  Providers avec SIRET + phone: ${withSiret.length.toLocaleString('fr-FR')}`)

    // Sample (API Sirene has rate limits)
    const sample = withSiret.slice(0, 500)
    console.log(`  Échantillon: ${sample.length}`)

    let checked = 0, matches = 0, suspects = 0, mismatches = 0, notFound = 0

    fs.writeFileSync(REPORT_FILE,
      'status,provider_id,provider_name,db_phone,siret,sirene_name,name_similarity\n'
    )

    for (let i = 0; i < sample.length; i += 5) {
      const batch = sample.slice(i, i + 5)

      for (const provider of batch) {
        const sireneData = await lookupRechercheEntreprises(provider.siret!)

        checked++
        if (!sireneData || !sireneData.denomination) {
          notFound++
          sireneResults.push({
            provider_id: provider.id,
            provider_name: provider.name,
            phone: provider.phone,
            siret: provider.siret!,
            sirene_name: '',
            similarity: 0,
            status: 'NOT_FOUND',
          })
          continue
        }

        const sim = nameSimilarity(provider.name, sireneData.denomination)

        let status: 'MATCH' | 'SUSPECT' | 'MISMATCH'
        if (sim >= 0.4) {
          status = 'MATCH'
          matches++
        } else if (sim >= 0.15) {
          status = 'SUSPECT'
          suspects++
        } else {
          status = 'MISMATCH'
          mismatches++
        }

        sireneResults.push({
          provider_id: provider.id,
          provider_name: provider.name,
          phone: provider.phone,
          siret: provider.siret!,
          sirene_name: sireneData.denomination,
          similarity: sim,
          status,
        })

        // Write CSV
        const csvLine = [
          status,
          provider.id,
          `"${provider.name.replace(/"/g, '""')}"`,
          provider.phone,
          provider.siret,
          `"${sireneData.denomination.replace(/"/g, '""')}"`,
          sim.toFixed(2),
        ].join(',')
        fs.appendFileSync(REPORT_FILE, csvLine + '\n')

        if (status === 'MISMATCH') {
          console.log(`   ❌ MISMATCH SIRET: "${provider.name}" (DB) ≠ "${sireneData.denomination}" (Sirene) sim:${sim.toFixed(2)} — tel: ${provider.phone}`)
        } else if (status === 'SUSPECT') {
          console.log(`   ⚠️  SUSPECT: "${provider.name}" (DB) ~ "${sireneData.denomination}" (Sirene) sim:${sim.toFixed(2)}`)
        }
      }

      process.stdout.write(`  ${checked}/${sample.length} | ✅${matches} ⚠️${suspects} ❌${mismatches} ❓${notFound}   \r`)
      await sleep(300) // Rate limit API gouv
    }

    const matchRate = checked > 0 ? Math.round(matches / checked * 100) : 0
    const mismatchRate = checked > 0 ? Math.round(mismatches / checked * 100) : 0

    console.log(`\n\n  Résultats Sirene:`)
    console.log(`    ✅ MATCH (sim≥0.4):    ${matches} (${matchRate}%) — SIRET correspond au nom`)
    console.log(`    ⚠️  SUSPECT (0.15-0.4): ${suspects} — possible variante de nom`)
    console.log(`    ❌ MISMATCH (sim<0.15): ${mismatches} (${mismatchRate}%) — SIRET ne correspond PAS`)
    console.log(`    ❓ NOT_FOUND:           ${notFound} — SIRET introuvable`)

    // Fix mode
    if (flags.fix && mismatches > 0) {
      const mismatchProviders = sireneResults.filter(r => r.status === 'MISMATCH')
      console.log(`\n  🔧 FIX: Mise à NULL de ${mismatchProviders.length} téléphones MISMATCH...`)
      let fixed = 0
      for (const r of mismatchProviders) {
        const { error } = await supabase
          .from('providers')
          .update({ phone: null })
          .eq('id', r.provider_id)
        if (!error) fixed++
      }
      console.log(`  → ${fixed}/${mismatchProviders.length} téléphones supprimés`)
    }
  }

  // ══════════════════════════════════════════
  // RÉSUMÉ FINAL
  // ══════════════════════════════════════════

  const summary = {
    date: new Date().toISOString(),
    total_providers: totalProviders,
    with_phone: withPhone,
    without_phone: withoutPhone,
    phone_coverage_pct: totalProviders ? Math.round((withPhone || 0) / totalProviders * 100) : 0,
    unique_phones: phoneGroups.size,
    duplicate_phones: duplicates.size,
    duplicate_providers: Array.from(duplicates.values()).reduce((a, b) => a + b.length, 0),
    format_invalid: invalidFormat,
    format_mobile: mobileCount,
    format_fixe: fixeCount,
    sirene_checked: flags.sirene ? sireneResults.length : 0,
    sirene_match: sireneResults.filter(r => r.status === 'MATCH').length,
    sirene_suspect: sireneResults.filter(r => r.status === 'SUSPECT').length,
    sirene_mismatch: sireneResults.filter(r => r.status === 'MISMATCH').length,
    fix_applied: flags.fix,
  }
  fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2))

  console.log('\n' + '='.repeat(60))
  console.log('  RÉSUMÉ AUDIT')
  console.log('='.repeat(60))
  console.log(`  Fichiers:`)
  if (duplicates.size > 0) console.log(`    Doublons: ${DUPES_FILE}`)
  if (flags.sirene) console.log(`    Sirene:   ${REPORT_FILE}`)
  console.log(`    Résumé:   ${SUMMARY_FILE}`)

  if (duplicates.size > 0) {
    console.log(`\n  ⚠️  ${duplicates.size} numéros partagés entre plusieurs providers`)
    console.log(`     → Signe clair de mauvaises assignations`)
  }

  if (!flags.sirene) {
    console.log(`\n  💡 Pour vérifier les SIRET: npx tsx scripts/audit-phones.ts --sirene`)
  }

  console.log('='.repeat(60) + '\n')
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error('Erreur fatale:', e); process.exit(1) })
