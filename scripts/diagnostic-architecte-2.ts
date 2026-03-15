import { createClient } from '@supabase/supabase-js'

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  console.log('=== DIAGNOSTIC APPROFONDI ===\n')

  // 1. Toutes les specialties distinctes dans la base
  console.log('--- 1. TOUTES LES SPECIALTIES DISTINCTES (actifs, top 50) ---')
  const { data: allSpecs } = await supabase
    .from('providers')
    .select('specialty')
    .eq('is_active', true)
    .not('specialty', 'is', null)

  const specCount: Record<string, number> = {}
  for (const p of allSpecs || []) {
    specCount[p.specialty] = (specCount[p.specialty] || 0) + 1
  }
  const sortedSpecs = Object.entries(specCount).sort((a, b) => b[1] - a[1])
  console.log(`  Total specialties distinctes: ${sortedSpecs.length}`)
  for (const [spec, count] of sortedSpecs.slice(0, 50)) {
    console.log(`  ${spec}: ${count}`)
  }

  // 2. Chercher toute specialty contenant "archi" ou "decor" ou "interieur" ou "amenag"
  console.log('\n--- 2. SPECIALTIES CONTENANT "archi", "decor", "interieur", "amenag" ---')
  for (const keyword of ['archi', 'decor', 'interieur', 'amenag', 'design']) {
    const matches = sortedSpecs.filter(([spec]) => spec.toLowerCase().includes(keyword))
    if (matches.length > 0) {
      console.log(`  Contient "${keyword}":`)
      for (const [spec, count] of matches) {
        console.log(`    ${spec}: ${count}`)
      }
    } else {
      console.log(`  Contient "${keyword}": (aucun)`)
    }
  }

  // 3. Tous les code_naf distincts liés à l'architecture/design
  console.log('\n--- 3. CODES NAF LIÉS À L\'ARCHITECTURE/DESIGN ---')
  const archNafCodes = ['7111Z', '7410Z', '7410', '71.11Z', '74.10Z']
  for (const naf of archNafCodes) {
    const { count } = await supabase
      .from('providers')
      .select('id', { count: 'exact', head: true })
      .eq('code_naf', naf)
      .eq('is_active', true)
    if (count && count > 0) {
      console.log(`  code_naf="${naf}": ${count} actifs`)
    }
  }

  // Also search with LIKE patterns
  const { data: nafLike } = await supabase
    .from('providers')
    .select('code_naf, libelle_naf')
    .eq('is_active', true)
    .not('code_naf', 'is', null)

  const nafCount: Record<string, { count: number; libelle: string }> = {}
  for (const p of nafLike || []) {
    if (!nafCount[p.code_naf]) {
      nafCount[p.code_naf] = { count: 0, libelle: p.libelle_naf || '' }
    }
    nafCount[p.code_naf].count++
  }

  console.log('\n--- 4. TOUS LES CODES NAF DISTINCTS (top 30) ---')
  const sortedNaf = Object.entries(nafCount).sort((a, b) => b[1].count - a[1].count)
  console.log(`  Total codes NAF distincts: ${sortedNaf.length}`)
  for (const [naf, { count, libelle }] of sortedNaf.slice(0, 30)) {
    console.log(`  ${naf} (${libelle}): ${count}`)
  }

  // 5. Chercher des NAF qui contiennent "archi" ou "décor" ou "design" dans libelle_naf
  console.log('\n--- 5. CODES NAF DONT LE LIBELLÉ CONTIENT "archi", "décor", "design", "aménag" ---')
  for (const [naf, { count, libelle }] of sortedNaf) {
    const lib = libelle.toLowerCase()
    if (lib.includes('archi') || lib.includes('décor') || lib.includes('decor') || lib.includes('design') || lib.includes('aménag') || lib.includes('amenag') || lib.includes('intérieur') || lib.includes('interieur')) {
      console.log(`  ${naf} (${libelle}): ${count}`)
    }
  }

  // 6. Total providers actifs et inactifs
  console.log('\n--- 6. TOTAUX GLOBAUX ---')
  const { count: totalActive } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
  const { count: totalAll } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
  console.log(`  Total providers actifs: ${totalActive}`)
  console.log(`  Total providers (tous): ${totalAll}`)

  // 7. Providers avec specialty NULL
  const { count: nullSpec } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .is('specialty', null)
    .eq('is_active', true)
  console.log(`  Providers actifs sans specialty (NULL): ${nullSpec}`)

  console.log('\n=== FIN ===')
}

main().catch(console.error)
