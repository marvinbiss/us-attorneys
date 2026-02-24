import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://umjmbdbwcsxrvfqktiui.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtam1iZGJ3Y3N4cnZmcWt0aXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY2NjQ1OCwiZXhwIjoyMDg1MjQyNDU4fQ.6hXdR5jfhCl1AA5052k3YrBmI-UMhu36mxV2IPvYxjc',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  console.log('=== DIAGNOSTIC ARCHITECTE D\'INTÉRIEUR ===\n')

  // 1. Distribution specialty × code_naf pour les 4 specialties du mapping actuel
  console.log('--- 1. MAPPING ACTUEL: specialty IN (architecte-interieur, architecte-d-interieur, decoration, peintre) ---')
  for (const spec of ['architecte-interieur', 'architecte-d-interieur', 'decoration', 'peintre']) {
    const { data, count } = await supabase
      .from('providers')
      .select('id', { count: 'exact', head: true })
      .eq('specialty', spec)
      .eq('is_active', true)
    console.log(`  specialty="${spec}" (actifs): ${count}`)
  }

  // 2. Parmi ces specialties, combien ont code_naf = 7111Z ?
  console.log('\n--- 2. CROISEMENT: specialty + code_naf 7111Z (actifs) ---')
  for (const spec of ['architecte-interieur', 'architecte-d-interieur', 'decoration', 'peintre']) {
    const { count } = await supabase
      .from('providers')
      .select('id', { count: 'exact', head: true })
      .eq('specialty', spec)
      .eq('code_naf', '7111Z')
      .eq('is_active', true)
    console.log(`  specialty="${spec}" + code_naf=7111Z: ${count}`)
  }

  // 3. Tous les providers code_naf = 7111Z, par specialty
  console.log('\n--- 3. TOUS LES code_naf=7111Z, PAR SPECIALTY (actifs) ---')
  const { data: naf7111 } = await supabase
    .from('providers')
    .select('specialty')
    .eq('code_naf', '7111Z')
    .eq('is_active', true)

  const bySpec: Record<string, number> = {}
  for (const p of naf7111 || []) {
    const key = p.specialty || '(NULL)'
    bySpec[key] = (bySpec[key] || 0) + 1
  }
  const sorted = Object.entries(bySpec).sort((a, b) => b[1] - a[1])
  for (const [spec, count] of sorted) {
    console.log(`  ${spec}: ${count}`)
  }
  console.log(`  TOTAL code_naf=7111Z actifs: ${naf7111?.length}`)

  // 4. Scénarios de filtrage
  console.log('\n--- 4. COMPARAISON DES SCÉNARIOS (providers actifs) ---')

  // A) Actuel
  const { count: cA } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .in('specialty', ['architecte-interieur', 'architecte-d-interieur', 'decoration', 'peintre'])
    .eq('is_active', true)
  console.log(`  A) Mapping actuel (4 specialties):            ${cA}`)

  // B) Specialty strict
  const { count: cB } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .in('specialty', ['architecte-interieur', 'architecte-d-interieur'])
    .eq('is_active', true)
  console.log(`  B) Specialty strict (sans décorateurs/peintres): ${cB}`)

  // C) code_naf 7111Z seul
  const { count: cC } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .eq('code_naf', '7111Z')
    .eq('is_active', true)
  console.log(`  C) code_naf 7111Z seul:                       ${cC}`)

  // D) RIGOUREUX: specialty archi + code_naf 7111Z
  const { count: cD } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .in('specialty', ['architecte-interieur', 'architecte-d-interieur'])
    .eq('code_naf', '7111Z')
    .eq('is_active', true)
  console.log(`  D) Rigoureux (specialty archi + 7111Z):        ${cD}`)

  // E) code_naf 7111Z + specialty compatible ou NULL
  // Need two queries since Supabase JS doesn't support OR easily
  const { count: cE1 } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .in('specialty', ['architecte-interieur', 'architecte-d-interieur'])
    .eq('code_naf', '7111Z')
    .eq('is_active', true)
  const { count: cE2 } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .is('specialty', null)
    .eq('code_naf', '7111Z')
    .eq('is_active', true)
  console.log(`  E) code_naf 7111Z + (specialty archi OU NULL): ${(cE1 || 0) + (cE2 || 0)}`)

  // 5. Codes NAF des décorateurs
  console.log('\n--- 5. CODES NAF DES DÉCORATEURS (specialty=decoration, actifs) ---')
  const { data: decos } = await supabase
    .from('providers')
    .select('code_naf, libelle_naf')
    .eq('specialty', 'decoration')
    .eq('is_active', true)

  const decoNaf: Record<string, number> = {}
  for (const p of decos || []) {
    const key = `${p.code_naf || 'NULL'} (${p.libelle_naf || '?'})`
    decoNaf[key] = (decoNaf[key] || 0) + 1
  }
  for (const [naf, count] of Object.entries(decoNaf).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${naf}: ${count}`)
  }

  // 6. Codes NAF des peintres
  console.log('\n--- 6. CODES NAF DES PEINTRES (specialty=peintre, actifs) ---')
  const { data: peintres } = await supabase
    .from('providers')
    .select('code_naf, libelle_naf')
    .eq('specialty', 'peintre')
    .eq('is_active', true)

  const peintreNaf: Record<string, number> = {}
  for (const p of peintres || []) {
    const key = `${p.code_naf || 'NULL'} (${p.libelle_naf || '?'})`
    peintreNaf[key] = (peintreNaf[key] || 0) + 1
  }
  for (const [naf, count] of Object.entries(peintreNaf).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${naf}: ${count}`)
  }

  // 7. Échantillon: providers architecte-interieur SANS code_naf 7111Z
  console.log('\n--- 7. ARCHITECTES D\'INTÉRIEUR SANS code_naf 7111Z (actifs) ---')
  const { data: noNaf } = await supabase
    .from('providers')
    .select('name, specialty, code_naf, libelle_naf, address_city')
    .in('specialty', ['architecte-interieur', 'architecte-d-interieur'])
    .neq('code_naf', '7111Z')
    .eq('is_active', true)
    .limit(20)

  if (noNaf && noNaf.length > 0) {
    console.table(noNaf)
  } else {
    console.log('  (aucun)')
  }

  // Also check those with NULL code_naf
  const { data: nullNaf } = await supabase
    .from('providers')
    .select('name, specialty, code_naf, address_city')
    .in('specialty', ['architecte-interieur', 'architecte-d-interieur'])
    .is('code_naf', null)
    .eq('is_active', true)
    .limit(20)

  if (nullNaf && nullNaf.length > 0) {
    console.log('\n  Dont code_naf NULL:')
    console.table(nullNaf)
  }

  console.log('\n=== FIN DU DIAGNOSTIC ===')
}

main().catch(console.error)
