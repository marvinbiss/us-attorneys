/**
 * Script d'agrégation pour le Baromètre des Artisans
 *
 * Se connecte à Supabase via service_role et agrège les données
 * des 940K+ providers par métier × ville, métier × département, métier × région.
 *
 * Usage :
 *   npx tsx scripts/aggregate-barometre.ts
 *
 * Pré-requis :
 *   - NEXT_PUBLIC_SUPABASE_URL dans .env
 *   - SUPABASE_SERVICE_ROLE_KEY dans .env
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') })
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' },
  global: { headers: { 'x-my-custom-header': 'barometre-aggregation' } },
})

// Mapping specialty → slug cohérent avec france.ts services
const SPECIALTY_SLUG_MAP: Record<string, { slug: string; label: string }> = {
  plombier: { slug: 'plombier', label: 'Plombier' },
  plomberie: { slug: 'plombier', label: 'Plombier' },
  electricien: { slug: 'electricien', label: 'Électricien' },
  électricien: { slug: 'electricien', label: 'Électricien' },
  serrurier: { slug: 'serrurier', label: 'Serrurier' },
  serrurerie: { slug: 'serrurier', label: 'Serrurier' },
  chauffagiste: { slug: 'chauffagiste', label: 'Chauffagiste' },
  'peintre en bâtiment': { slug: 'peintre-en-batiment', label: 'Peintre en bâtiment' },
  peintre: { slug: 'peintre-en-batiment', label: 'Peintre en bâtiment' },
  menuisier: { slug: 'menuisier', label: 'Menuisier' },
  menuiserie: { slug: 'menuisier', label: 'Menuisier' },
  carreleur: { slug: 'carreleur', label: 'Carreleur' },
  couvreur: { slug: 'couvreur', label: 'Couvreur' },
  maçon: { slug: 'macon', label: 'Maçon' },
  macon: { slug: 'macon', label: 'Maçon' },
  maconnerie: { slug: 'macon', label: 'Maçon' },
  jardinier: { slug: 'jardinier', label: 'Jardinier' },
  vitrier: { slug: 'vitrier', label: 'Vitrier' },
  climaticien: { slug: 'climaticien', label: 'Climaticien' },
  plaquiste: { slug: 'plaquiste', label: 'Plaquiste' },
  charpentier: { slug: 'charpentier', label: 'Charpentier' },
  terrassier: { slug: 'terrassier', label: 'Terrassier' },
  façadier: { slug: 'facadier', label: 'Façadier' },
  facadier: { slug: 'facadier', label: 'Façadier' },
  paysagiste: { slug: 'paysagiste', label: 'Paysagiste' },
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeSpecialty(specialty: string | null): { slug: string; label: string } | null {
  if (!specialty) return null
  const lower = specialty.toLowerCase().trim()
  return SPECIALTY_SLUG_MAP[lower] || null
}

interface AggRow {
  metier: string
  metier_slug: string
  ville: string | null
  ville_slug: string | null
  departement: string | null
  departement_code: string | null
  region: string | null
  region_slug: string | null
  nb_artisans: number
  note_moyenne: number | null
  nb_avis: number
  taux_verification: number
}

async function fetchProviders(): Promise<
  Array<{
    specialty: string | null
    address_city: string | null
    address_department: string | null
    address_region: string | null
    is_verified: boolean | null
    rating_average: number | null
    review_count: number | null
  }>
> {
  const allProviders: Array<{
    specialty: string | null
    address_city: string | null
    address_department: string | null
    address_region: string | null
    is_verified: boolean | null
    rating_average: number | null
    review_count: number | null
  }> = []

  // Supabase default row limit is 1000 — use smaller batches
  const BATCH = 1000
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('providers')
      .select('specialty, address_city, address_department, address_region, is_verified, rating_average, review_count')
      .eq('is_active', true)
      .range(offset, offset + BATCH - 1)

    if (error) {
      console.error(`❌ Erreur fetch offset=${offset}:`, error.message)
      break
    }

    if (!data || data.length === 0) {
      hasMore = false
    } else {
      allProviders.push(...data)
      console.log(`  📦 Fetched ${allProviders.length} providers...`)
      offset += BATCH
      if (data.length < BATCH) hasMore = false
    }
  }

  return allProviders
}

async function aggregate() {
  console.log('🚀 Démarrage de l\'agrégation Baromètre')
  console.log('━'.repeat(50))

  // 1. Fetch tous les providers actifs
  console.log('\n📊 Récupération des providers...')
  const providers = await fetchProviders()
  console.log(`✅ ${providers.length} providers récupérés`)

  // 2. Agrégation en mémoire
  const aggMap = new Map<string, AggRow>()

  function getKey(metierSlug: string, ville?: string | null, dept?: string | null, region?: string | null): string {
    return `${metierSlug}|${ville || ''}|${dept || ''}|${region || ''}`
  }

  function addToAgg(
    key: string,
    metier: string,
    metierSlug: string,
    ville: string | null,
    villeSlug: string | null,
    departement: string | null,
    deptCode: string | null,
    region: string | null,
    regionSlug: string | null,
    provider: (typeof providers)[0]
  ) {
    let agg = aggMap.get(key)
    if (!agg) {
      agg = {
        metier,
        metier_slug: metierSlug,
        ville,
        ville_slug: villeSlug,
        departement,
        departement_code: deptCode,
        region,
        region_slug: regionSlug,
        nb_artisans: 0,
        note_moyenne: null,
        nb_avis: 0,
        taux_verification: 0,
      }
      aggMap.set(key, agg)
    }
    agg.nb_artisans++
    agg.nb_avis += provider.review_count || 0
    if (provider.is_verified) {
      agg.taux_verification = ((agg.taux_verification * (agg.nb_artisans - 1)) + 1) / agg.nb_artisans
    } else {
      agg.taux_verification = (agg.taux_verification * (agg.nb_artisans - 1)) / agg.nb_artisans
    }
  }

  // Compute note_moyenne separately (need running average)
  const ratingAccum = new Map<string, { sum: number; count: number }>()

  function trackRating(key: string, rating: number | null) {
    if (rating === null || rating === undefined) return
    let acc = ratingAccum.get(key)
    if (!acc) {
      acc = { sum: 0, count: 0 }
      ratingAccum.set(key, acc)
    }
    acc.sum += rating
    acc.count++
  }

  console.log('\n🔄 Agrégation en cours...')

  for (const p of providers) {
    const spec = normalizeSpecialty(p.specialty)
    if (!spec) continue

    const { slug: metierSlug, label: metier } = spec
    const ville = p.address_city
    const villeSlug = ville ? slugify(ville) : null
    const dept = p.address_department
    const deptCode = dept ? slugify(dept) : null // approx, real code would need lookup
    const region = p.address_region
    const regionSlug = region ? slugify(region) : null

    // Niveau national (métier seul)
    const natKey = getKey(metierSlug)
    addToAgg(natKey, metier, metierSlug, null, null, null, null, null, null, p)
    trackRating(natKey, p.rating_average)

    // Niveau région
    if (region) {
      const regKey = getKey(metierSlug, null, null, region)
      addToAgg(regKey, metier, metierSlug, null, null, null, null, region, regionSlug, p)
      trackRating(regKey, p.rating_average)
    }

    // Niveau département
    if (dept) {
      const deptKey = getKey(metierSlug, null, dept)
      addToAgg(deptKey, metier, metierSlug, null, null, dept, deptCode, region, regionSlug, p)
      trackRating(deptKey, p.rating_average)
    }

    // Niveau ville
    if (ville) {
      const villeKey = getKey(metierSlug, ville)
      addToAgg(villeKey, metier, metierSlug, ville, villeSlug, dept, deptCode, region, regionSlug, p)
      trackRating(villeKey, p.rating_average)
    }
  }

  // Inject note_moyenne
  for (const [key, agg] of aggMap) {
    const acc = ratingAccum.get(key)
    if (acc && acc.count > 0) {
      agg.note_moyenne = Math.round((acc.sum / acc.count) * 100) / 100
    }
  }

  const rows = Array.from(aggMap.values())
  console.log(`✅ ${rows.length} lignes agrégées`)

  // 3. Upsert par batches
  console.log('\n💾 Écriture en base...')

  // Clear old data
  const { error: deleteError } = await supabase.from('barometre_stats').delete().neq('id', 0)
  if (deleteError) {
    console.error('❌ Erreur suppression:', deleteError.message)
  }

  const UPSERT_BATCH = 500
  let inserted = 0
  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    const batch = rows.slice(i, i + UPSERT_BATCH).map((r) => ({
      metier: r.metier,
      metier_slug: r.metier_slug,
      ville: r.ville,
      ville_slug: r.ville_slug,
      departement: r.departement,
      departement_code: r.departement_code,
      region: r.region,
      region_slug: r.region_slug,
      nb_artisans: r.nb_artisans,
      note_moyenne: r.note_moyenne,
      nb_avis: r.nb_avis,
      taux_verification: Math.round(r.taux_verification * 10000) / 10000,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from('barometre_stats').insert(batch)
    if (error) {
      console.error(`❌ Erreur insert batch ${i}:`, error.message)
    } else {
      inserted += batch.length
    }
  }

  console.log(`✅ ${inserted} lignes insérées`)

  // 4. Résumé
  console.log('\n━'.repeat(50))
  console.log('📈 Résumé :')
  const national = rows.filter((r) => !r.ville && !r.departement && !r.region)
  const regionLevel = rows.filter((r) => r.region && !r.departement && !r.ville)
  const deptLevel = rows.filter((r) => r.departement && !r.ville)
  const villeLevel = rows.filter((r) => r.ville)

  console.log(`  - ${national.length} métiers (niveau national)`)
  console.log(`  - ${regionLevel.length} combinaisons métier × région`)
  console.log(`  - ${deptLevel.length} combinaisons métier × département`)
  console.log(`  - ${villeLevel.length} combinaisons métier × ville`)
  console.log(`  - Total : ${rows.length} lignes`)
  console.log('\n✨ Agrégation terminée !')
}

aggregate().catch((err) => {
  console.error('❌ Erreur fatale:', err)
  process.exit(1)
})
