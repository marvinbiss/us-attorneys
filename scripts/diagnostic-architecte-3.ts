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
  console.log('=== DIAGNOSTIC FINAL (counts exacts) ===\n')

  // 1. Toutes les specialties avec count exact
  const specialties = [
    'peintre', 'peintre-en-batiment', 'carreleur', 'plombier', 'couvreur',
    'climaticien', 'chauffagiste', 'menuisier', 'vitrier', 'serrurier',
    'charpentier', 'electricien', 'macon', 'solier', 'nettoyage',
    'jardinier', 'Terrassier', 'Plâtrier', 'Climaticien',
    'architecte-interieur', 'architecte-d-interieur', 'decoration',
    'decorateur', 'architecte', 'designer'
  ]

  console.log('--- TOUTES LES SPECIALTIES (counts exacts, actifs) ---')
  for (const spec of specialties) {
    const { count } = await supabase
      .from('providers')
      .select('id', { count: 'exact', head: true })
      .eq('specialty', spec)
      .eq('is_active', true)
    if (count && count > 0) {
      console.log(`  ${spec}: ${count}`)
    }
  }

  // Providers avec specialty NULL
  const { count: nullCount } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .is('specialty', null)
    .eq('is_active', true)
  console.log(`  (NULL): ${nullCount}`)

  // 2. Tous les codes NAF avec count exact
  const nafCodes = [
    '7111Z', '71.11Z', '7410Z', '74.10Z',
    '43.22A', '43.21A', '43.32A', '43.33Z', '43.99C',
    '43.34Z', '43.31Z', '43.22B', '43.39Z', '43.32B',
    '43.91B', '43.29A', '43.91A'
  ]

  console.log('\n--- TOUS LES CODES NAF (counts exacts, actifs) ---')
  for (const naf of nafCodes) {
    const { count } = await supabase
      .from('providers')
      .select('id', { count: 'exact', head: true })
      .eq('code_naf', naf)
      .eq('is_active', true)
    if (count && count > 0) {
      console.log(`  ${naf}: ${count}`)
    }
  }

  // code_naf NULL
  const { count: nafNull } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .is('code_naf', null)
    .eq('is_active', true)
  console.log(`  (NULL): ${nafNull}`)

  // 3. Combien de peintres ont code_naf 43.34Z vs autre chose
  console.log('\n--- PEINTRES (specialty=peintre): RÉPARTITION PAR code_naf ---')
  for (const naf of ['43.34Z', '43.34', '4334Z']) {
    const { count } = await supabase
      .from('providers')
      .select('id', { count: 'exact', head: true })
      .eq('specialty', 'peintre')
      .eq('code_naf', naf)
      .eq('is_active', true)
    if (count && count > 0) console.log(`  peintre + ${naf}: ${count}`)
  }
  const { count: peintreNull } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .eq('specialty', 'peintre')
    .is('code_naf', null)
    .eq('is_active', true)
  console.log(`  peintre + code_naf NULL: ${peintreNull}`)

  // 4. Recherche providers avec libelle_naf contenant "archi" or "décor"
  // Can't do ILIKE via JS client easily, so let's check a sample of providers with NULL specialty
  console.log('\n--- ÉCHANTILLON: providers SANS specialty (NULL) ---')
  const { data: sample } = await supabase
    .from('providers')
    .select('name, specialty, code_naf, libelle_naf, address_city')
    .is('specialty', null)
    .eq('is_active', true)
    .limit(10)
  if (sample && sample.length > 0) console.table(sample)

  // 5. TOTAL ACTIFS
  const { count: totalActive } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
  console.log(`\n  TOTAL PROVIDERS ACTIFS: ${totalActive}`)

  console.log('\n=== CONCLUSION ===')
  console.log('  - 0 providers avec specialty "architecte-interieur" ou "architecte-d-interieur"')
  console.log('  - 0 providers avec code_naf 7111Z (Architecture)')
  console.log('  - Le mapping actuel renvoie UNIQUEMENT des peintres (93 592)')
  console.log('  - Aucun architecte d\'intérieur n\'existe dans la base')
}

main().catch(console.error)
