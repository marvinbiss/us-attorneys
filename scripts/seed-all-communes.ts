#!/usr/bin/env npx tsx
/**
 * seed-all-communes.ts — Seed ALL 34,969 French communes from INSEE data into Supabase.
 *
 * The communes table currently only has ~2,449 cities (>10K inhabitants from france.ts).
 * This script adds the remaining ~32,500 smaller communes so that programmatic SEO pages
 * (/services/[service]/[location], /tarifs/..., /devis/..., etc.) return proper content
 * instead of "Non trouvé" with noindex.
 *
 * Handles duplicate slugs (e.g., "amance" exists in depts 10, 54, 70) by appending
 * the department code: "amance-10", "amance-54", "amance-70".
 *
 * Usage:
 *   npx tsx scripts/seed-all-communes.ts              # Dry run (count only)
 *   npx tsx scripts/seed-all-communes.ts --execute     # Actually insert into DB
 *   npx tsx scripts/seed-all-communes.ts --execute --force  # Re-insert even if slug exists
 */

import { createClient } from '@supabase/supabase-js'
import inseeData from '../src/lib/data/insee-communes.json'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const EXECUTE = process.argv.includes('--execute')
const FORCE = process.argv.includes('--force')
const BATCH_SIZE = 500

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Department code → department name mapping
const DEPT_NAMES: Record<string, string> = {
  '01': 'Ain', '02': 'Aisne', '03': 'Allier', '04': 'Alpes-de-Haute-Provence',
  '05': 'Hautes-Alpes', '06': 'Alpes-Maritimes', '07': 'Ardèche', '08': 'Ardennes',
  '09': 'Ariège', '10': 'Aube', '11': 'Aude', '12': 'Aveyron',
  '13': 'Bouches-du-Rhône', '14': 'Calvados', '15': 'Cantal', '16': 'Charente',
  '17': 'Charente-Maritime', '18': 'Cher', '19': 'Corrèze', '21': 'Côte-d\'Or',
  '22': 'Côtes-d\'Armor', '23': 'Creuse', '24': 'Dordogne', '25': 'Doubs',
  '26': 'Drôme', '27': 'Eure', '28': 'Eure-et-Loir', '29': 'Finistère',
  '2A': 'Corse-du-Sud', '2B': 'Haute-Corse', '30': 'Gard', '31': 'Haute-Garonne',
  '32': 'Gers', '33': 'Gironde', '34': 'Hérault', '35': 'Ille-et-Vilaine',
  '36': 'Indre', '37': 'Indre-et-Loire', '38': 'Isère', '39': 'Jura',
  '40': 'Landes', '41': 'Loir-et-Cher', '42': 'Loire', '43': 'Haute-Loire',
  '44': 'Loire-Atlantique', '45': 'Loiret', '46': 'Lot', '47': 'Lot-et-Garonne',
  '48': 'Lozère', '49': 'Maine-et-Loire', '50': 'Manche', '51': 'Marne',
  '52': 'Haute-Marne', '53': 'Mayenne', '54': 'Meurthe-et-Moselle', '55': 'Meuse',
  '56': 'Morbihan', '57': 'Moselle', '58': 'Nièvre', '59': 'Nord',
  '60': 'Oise', '61': 'Orne', '62': 'Pas-de-Calais', '63': 'Puy-de-Dôme',
  '64': 'Pyrénées-Atlantiques', '65': 'Hautes-Pyrénées', '66': 'Pyrénées-Orientales',
  '67': 'Bas-Rhin', '68': 'Haut-Rhin', '69': 'Rhône', '70': 'Haute-Saône',
  '71': 'Saône-et-Loire', '72': 'Sarthe', '73': 'Savoie', '74': 'Haute-Savoie',
  '75': 'Paris', '76': 'Seine-Maritime', '77': 'Seine-et-Marne', '78': 'Yvelines',
  '79': 'Deux-Sèvres', '80': 'Somme', '81': 'Tarn', '82': 'Tarn-et-Garonne',
  '83': 'Var', '84': 'Vaucluse', '85': 'Vendée', '86': 'Vienne',
  '87': 'Haute-Vienne', '88': 'Vosges', '89': 'Yonne', '90': 'Territoire de Belfort',
  '91': 'Essonne', '92': 'Hauts-de-Seine', '93': 'Seine-Saint-Denis',
  '94': 'Val-de-Marne', '95': 'Val-d\'Oise',
  '971': 'Guadeloupe', '972': 'Martinique', '973': 'Guyane',
  '974': 'La Réunion', '976': 'Mayotte',
  '987': 'Polynésie française', '988': 'Nouvelle-Calédonie',
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('📊 INSEE communes:', Object.keys(inseeData).length)

  // 1. Build slug map to detect duplicates
  const slugMap = new Map<string, Array<{ code: string; name: string; dept: string; region: string }>>()

  for (const [code, data] of Object.entries(inseeData as Record<string, { n: string; r: string; d: string }>)) {
    const baseSlug = slugify(data.n)
    if (!slugMap.has(baseSlug)) slugMap.set(baseSlug, [])
    slugMap.get(baseSlug)!.push({ code, name: data.n, dept: data.d, region: data.r })
  }

  // 2. Build final list with deduplicated slugs
  const communes: Array<{
    code_insee: string
    name: string
    slug: string
    departement_code: string
    departement_name: string
    region_name: string
    is_active: boolean
  }> = []

  for (const [baseSlug, entries] of slugMap) {
    if (entries.length === 1) {
      // Unique slug — use as-is
      const e = entries[0]
      communes.push({
        code_insee: e.code,
        name: e.name,
        slug: baseSlug,
        departement_code: e.dept,
        departement_name: DEPT_NAMES[e.dept] || e.dept,
        region_name: e.region,
        is_active: true,
      })
    } else {
      // Duplicate slug — append department code
      for (const e of entries) {
        communes.push({
          code_insee: e.code,
          name: e.name,
          slug: `${baseSlug}-${e.dept.toLowerCase()}`,
          departement_code: e.dept,
          departement_name: DEPT_NAMES[e.dept] || e.dept,
          region_name: e.region,
          is_active: true,
        })
      }
    }
  }

  console.log('📋 Communes to seed:', communes.length)

  // 3. Get existing slugs from DB
  console.log('🔍 Fetching existing communes from DB...')
  const { data: existing, error: fetchErr } = await supabase
    .from('communes')
    .select('slug, code_insee')

  if (fetchErr) {
    console.error('Failed to fetch existing communes:', fetchErr)
    process.exit(1)
  }

  const existingSlugs = new Set((existing || []).map(c => c.slug))
  const existingCodes = new Set((existing || []).map(c => c.code_insee))
  console.log('📦 Existing in DB:', existingSlugs.size)

  // 4. Filter to only new communes
  const toInsert = FORCE
    ? communes
    : communes.filter(c => !existingCodes.has(c.code_insee) && !existingSlugs.has(c.slug))

  console.log('🆕 New communes to insert:', toInsert.length)
  console.log('⏭️  Already in DB:', communes.length - toInsert.length)

  if (toInsert.length === 0) {
    console.log('✅ Nothing to do — all communes already in DB')
    return
  }

  // Show sample
  console.log('\nSample (first 10):')
  toInsert.slice(0, 10).forEach(c => {
    console.log(`  ${c.slug} → ${c.name} (${c.departement_code}, ${c.region_name})`)
  })

  if (!EXECUTE) {
    console.log('\n⚠️  DRY RUN — pass --execute to actually insert')
    return
  }

  // 5. Insert in batches
  console.log(`\n🚀 Inserting ${toInsert.length} communes in batches of ${BATCH_SIZE}...`)
  let inserted = 0
  let errors = 0

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('communes')
      .upsert(batch, { onConflict: 'code_insee', ignoreDuplicates: true })

    if (error) {
      console.error(`  ❌ Batch ${i / BATCH_SIZE + 1} failed:`, error.message)
      errors += batch.length
    } else {
      inserted += batch.length
      if ((i / BATCH_SIZE + 1) % 10 === 0 || i + BATCH_SIZE >= toInsert.length) {
        console.log(`  ✅ ${inserted}/${toInsert.length} inserted`)
      }
    }
  }

  console.log(`\n🏁 Done: ${inserted} inserted, ${errors} errors`)
}

main().catch(console.error)
