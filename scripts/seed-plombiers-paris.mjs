/**
 * Seed 20 realistic plumbers in Paris
 * Each has: name, slug, stable_id, SIRET, phone, address, coordinates, rating, reviews
 * Links to services table (plombier) and locations table (paris)
 *
 * Usage: node scripts/seed-plombiers-paris.mjs
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const SUPABASE_URL = 'https://umjmbdbwcsxrvfqktiui.supabase.co'
const SUPABASE_SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ─── 20 realistic Paris plumber profiles ───────────────────────

const plombiers = [
  {
    name: 'Dupont Plomberie',
    address_street: '12 Rue de Rivoli',
    address_postal_code: '75001',
    lat: 48.8601, lng: 2.3444,
    phone: '+33 1 42 36 18 54',
    siret: '82345678901234',
    rating: 4.7, reviews: 89,
    description: 'Plomberie générale et dépannage dans le 1er arrondissement. Installation sanitaire, réparation de fuites, débouchage de canalisations. Plus de 15 ans d\'expérience au cœur de Paris. Intervention rapide sous 1h.',
    experience_years: 15,
    employee_count: 3,
  },
  {
    name: 'Moreau & Fils Plomberie',
    address_street: '45 Boulevard Voltaire',
    address_postal_code: '75011',
    lat: 48.8614, lng: 2.3786,
    phone: '+33 1 43 57 29 61',
    siret: '91234567890123',
    rating: 4.9, reviews: 142,
    description: 'Entreprise familiale de plomberie depuis 1998. Spécialiste de la rénovation de salles de bain, installation de chauffe-eau, remplacement de colonnes montantes. Devis gratuit sous 24h.',
    experience_years: 26,
    employee_count: 5,
  },
  {
    name: 'SAS Bernard Plomberie',
    address_street: '78 Rue de la Roquette',
    address_postal_code: '75011',
    lat: 48.8571, lng: 2.3791,
    phone: '+33 1 48 06 34 72',
    siret: '45678912345678',
    rating: 4.5, reviews: 67,
    description: 'Plombier chauffagiste certifié RGE. Installation et entretien de chaudières gaz, pompes à chaleur. Contrat d\'entretien annuel. Intervention sur Paris et petite couronne.',
    experience_years: 12,
    employee_count: 4,
  },
  {
    name: 'Artisan Lefevre Plombier',
    address_street: '23 Rue du Faubourg Saint-Antoine',
    address_postal_code: '75012',
    lat: 48.8512, lng: 2.3738,
    phone: '+33 1 43 43 18 90',
    siret: '56789012345678',
    rating: 4.8, reviews: 103,
    description: 'Plombier diplômé, spécialisé dans la détection de fuites non destructive. Caméra d\'inspection, recherche de fuite par gaz traceur. Intervention d\'urgence 7j/7 sur Paris.',
    experience_years: 18,
    employee_count: 2,
  },
  {
    name: 'Paris Plomberie Express',
    address_street: '156 Avenue de Clichy',
    address_postal_code: '75017',
    lat: 48.8870, lng: 2.3210,
    phone: '+33 1 42 28 55 17',
    siret: '67890123456789',
    rating: 4.3, reviews: 54,
    description: 'Dépannage plomberie urgent à Paris 17e et alentours. Débouchage haute pression, réparation de chasse d\'eau, remplacement de robinetterie. Disponible soirs et week-ends.',
    experience_years: 8,
    employee_count: 2,
  },
  {
    name: 'Fontaine Services Plomberie',
    address_street: '34 Rue de Tolbiac',
    address_postal_code: '75013',
    lat: 48.8285, lng: 2.3591,
    phone: '+33 1 45 82 67 33',
    siret: '78901234567890',
    rating: 4.6, reviews: 78,
    description: 'Installation et rénovation de salle de bain clé en main. Plomberie, carrelage, électricité. Équipe de 4 artisans qualifiés. Showroom sur rendez-vous dans le 13e.',
    experience_years: 20,
    employee_count: 4,
  },
  {
    name: 'Ets Rousseau Plomberie',
    address_street: '89 Rue Lecourbe',
    address_postal_code: '75015',
    lat: 48.8416, lng: 2.3020,
    phone: '+33 1 45 67 82 14',
    siret: '89012345678901',
    rating: 4.4, reviews: 61,
    description: 'Plombier zingueur à Paris 15e. Pose de gouttières, descentes EP, évacuations. Travaux de zinguerie et plomberie sanitaire. Intervention toiture et terrasse.',
    experience_years: 22,
    employee_count: 3,
  },
  {
    name: 'Mercier Plomberie Chauffage',
    address_street: '67 Avenue Parmentier',
    address_postal_code: '75011',
    lat: 48.8645, lng: 2.3793,
    phone: '+33 1 43 55 91 27',
    siret: '90123456789012',
    rating: 4.8, reviews: 115,
    description: 'Expert en plomberie et chauffage depuis 2001. Installation pompes à chaleur air/eau, plancher chauffant, radiateurs. Certification RGE QualiPAC. Devis gratuit.',
    experience_years: 23,
    employee_count: 6,
  },
  {
    name: 'Lambert Dépannage Plomberie',
    address_street: '15 Rue des Abbesses',
    address_postal_code: '75018',
    lat: 48.8844, lng: 2.3384,
    phone: '+33 1 42 58 13 46',
    siret: '12345098765432',
    rating: 4.2, reviews: 43,
    description: 'Plombier de quartier à Montmartre. Dépannage rapide : fuites, WC bouchés, robinets, ballons d\'eau chaude. Tarifs transparents affichés. Sans surprise.',
    experience_years: 10,
    employee_count: 1,
  },
  {
    name: 'Garnier Plomberie Paris',
    address_street: '101 Rue Saint-Dominique',
    address_postal_code: '75007',
    lat: 48.8590, lng: 2.3060,
    phone: '+33 1 45 55 72 38',
    siret: '23456789012345',
    rating: 4.9, reviews: 156,
    description: 'Plombier haut de gamme dans le 7e arrondissement. Rénovation de salles de bain luxe, robinetterie design, douche à l\'italienne. Références dans les immeubles haussmanniens.',
    experience_years: 25,
    employee_count: 5,
  },
  {
    name: 'Fournier Plomberie Sanitaire',
    address_street: '42 Rue de Charonne',
    address_postal_code: '75011',
    lat: 48.8548, lng: 2.3838,
    phone: '+33 1 43 71 45 82',
    siret: '34567890123456',
    rating: 4.6, reviews: 82,
    description: 'Spécialiste sanitaire et plomberie dans le 11e. Pose de WC suspendus, douches PMR, accessibilité. Partenaire des syndics de copropriété. Devis sous 48h.',
    experience_years: 14,
    employee_count: 3,
  },
  {
    name: 'Roux Plomberie Urgence',
    address_street: '28 Rue de Belleville',
    address_postal_code: '75020',
    lat: 48.8717, lng: 2.3838,
    phone: '+33 1 43 58 27 64',
    siret: '45678901234567',
    rating: 4.1, reviews: 38,
    description: 'Plombier urgentiste à Paris 20e et Est parisien. Intervention en moins de 45 minutes. Débouchage, fuite d\'eau, dégât des eaux. Disponible 24h/24.',
    experience_years: 7,
    employee_count: 2,
  },
  {
    name: 'Chevalier & Associés Plomberie',
    address_street: '55 Avenue de la Grande Armée',
    address_postal_code: '75016',
    lat: 48.8753, lng: 2.2877,
    phone: '+33 1 45 01 88 53',
    siret: '56789012345679',
    rating: 4.7, reviews: 94,
    description: 'Cabinet de plomberie dans le 16e arrondissement. Rénovation complète, mise en conformité gaz, installation VMC. Agrément Qualigaz. Assurance décennale.',
    experience_years: 30,
    employee_count: 7,
  },
  {
    name: 'Simon Plomberie Verte',
    address_street: '73 Rue de la Convention',
    address_postal_code: '75015',
    lat: 48.8395, lng: 2.2938,
    phone: '+33 1 45 77 63 19',
    siret: '67890123456790',
    rating: 4.5, reviews: 71,
    description: 'Plombier éco-responsable à Paris 15e. Récupération d\'eau de pluie, chauffe-eau solaire, robinetterie économe. Solutions durables pour réduire votre consommation d\'eau.',
    experience_years: 11,
    employee_count: 2,
  },
  {
    name: 'Girard Plomberie Pro',
    address_street: '18 Rue de Passy',
    address_postal_code: '75016',
    lat: 48.8564, lng: 2.2770,
    phone: '+33 1 42 88 45 71',
    siret: '78901234567891',
    rating: 4.8, reviews: 128,
    description: 'Plombier de confiance à Passy depuis 2005. Entretien annuel de plomberie, contrats syndics, gestion de sinistres dégâts des eaux. Rapport photo systématique.',
    experience_years: 19,
    employee_count: 4,
  },
  {
    name: 'Bonnet Plomberie Rénovation',
    address_street: '36 Avenue Jean Jaurès',
    address_postal_code: '75019',
    lat: 48.8829, lng: 2.3927,
    phone: '+33 1 42 08 36 58',
    siret: '89012345678902',
    rating: 4.4, reviews: 56,
    description: 'Spécialiste rénovation plomberie dans l\'ancien. Remplacement de tuyauterie plomb, mise aux normes, cuivre et PER. Expérience en immeubles classés.',
    experience_years: 16,
    employee_count: 3,
  },
  {
    name: 'Vincent Plomberie Bâtiment',
    address_street: '92 Boulevard de Sébastopol',
    address_postal_code: '75003',
    lat: 48.8658, lng: 2.3538,
    phone: '+33 1 42 72 53 87',
    siret: '90123456789013',
    rating: 4.3, reviews: 49,
    description: 'Plombier du Marais et Centre de Paris. Travaux neufs et rénovation. Collaboration architectes et décorateurs. Installation cuisine et salle de bain sur mesure.',
    experience_years: 13,
    employee_count: 2,
  },
  {
    name: 'Durand Plomberie Services',
    address_street: '64 Rue Oberkampf',
    address_postal_code: '75011',
    lat: 48.8655, lng: 2.3767,
    phone: '+33 1 43 57 82 15',
    siret: '12098765432109',
    rating: 4.6, reviews: 87,
    description: 'Plombier polyvalent Oberkampf et Bastille. Dépannage, installation, rénovation. Tarif horaire fixe affiché. Facture détaillée. Garantie pièces et main d\'œuvre 2 ans.',
    experience_years: 17,
    employee_count: 3,
  },
  {
    name: 'Lefebvre Plomberie Île-de-France',
    address_street: '8 Place de la Nation',
    address_postal_code: '75012',
    lat: 48.8485, lng: 2.3957,
    phone: '+33 1 43 07 64 29',
    siret: '23456109876543',
    rating: 4.5, reviews: 73,
    description: 'Entreprise de plomberie basée à Nation. Couverture Paris intra-muros et première couronne. Flotte de 3 véhicules équipés. Pièces de rechange en stock.',
    experience_years: 21,
    employee_count: 5,
  },
  {
    name: 'Martin Plomberie Chauffage Paris',
    address_street: '51 Rue de Vaugirard',
    address_postal_code: '75006',
    lat: 48.8466, lng: 2.3295,
    phone: '+33 1 43 26 78 41',
    siret: '34567210987654',
    rating: 4.7, reviews: 98,
    description: 'Plombier chauffagiste dans le 6e arrondissement depuis 2003. Entretien chaudières toutes marques, installation pompe à chaleur, plancher chauffant. Certification RGE.',
    experience_years: 21,
    employee_count: 4,
  },
]

// ─── Main ──────────────────────────────────────────────────────

async function main() {
  console.log('=== Seed 20 Plombiers Paris ===\n')

  // Step 1: Check existing plumbers in Paris
  console.log('1. Checking existing plumbers in Paris...')
  const { data: existing, error: existErr } = await supabase
    .from('providers')
    .select('id, name, slug, stable_id')
    .ilike('specialty', '%plomb%')
    .or('address_city.ilike.%Paris%,address_postal_code.like.75%')
    .eq('is_active', true)

  if (existErr) {
    console.error('Error checking existing:', existErr.message)
  } else {
    console.log(`   Found ${existing?.length || 0} existing plumbers in Paris`)
  }

  const existingSlugs = new Set((existing || []).map(p => p.slug))

  // Step 2: Get service ID for 'plombier'
  console.log('\n2. Looking up plombier service...')
  const { data: svcData } = await supabase
    .from('services')
    .select('id, name, slug')
    .eq('slug', 'plombier')
    .single()

  if (!svcData) {
    console.error('   plombier service not found!')
    return
  }
  console.log(`   Found: ${svcData.name} (${svcData.id})`)

  // Step 3: Get location ID for 'paris'
  console.log('\n3. Looking up Paris location...')
  const { data: locData } = await supabase
    .from('locations')
    .select('id, name, slug')
    .eq('slug', 'paris')
    .single()

  if (locData) {
    console.log(`   Found: ${locData.name} (${locData.id})`)
  } else {
    console.log('   Paris location not found in locations table (will skip location linking)')
  }

  // Step 4: Insert providers
  console.log('\n4. Inserting 20 plumbers...')

  const toInsert = []
  for (const p of plombiers) {
    const slug = slugify(p.name) + '-paris'
    const finalSlug = existingSlugs.has(slug) ? slug + '-' + Date.now().toString(36).slice(-4) : slug

    // Generate a stable_id (short hash for URL)
    const stableId = 'plb-' + crypto.createHash('md5').update(p.name + p.address_street).digest('hex').slice(0, 8)

    toInsert.push({
      name: p.name,
      slug: finalSlug,
      stable_id: stableId,
      specialty: 'Plombier',
      description: p.description,
      phone: p.phone,
      siret: p.siret,
      address_street: p.address_street,
      address_city: 'Paris',
      address_postal_code: p.address_postal_code,
      address_region: 'Île-de-France',
      latitude: p.lat,
      longitude: p.lng,
      is_active: true,
      is_verified: true,
      rating_average: p.rating,
      review_count: p.reviews,
      employee_count: String(p.employee_count), // text column in DB
      source: 'seed-plombiers-paris',
    })
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('providers')
    .insert(toInsert)
    .select('id, name, slug, stable_id')

  if (insertErr) {
    console.error('Insert error:', insertErr.message)
    // Try one by one
    console.log('   Trying one by one...')
    const insertedOne = []
    for (const p of toInsert) {
      const { data: d, error: e } = await supabase
        .from('providers')
        .insert(p)
        .select('id, name, slug, stable_id')
      if (e) {
        console.error(`   SKIP ${p.name}: ${e.message}`)
      } else if (d) {
        insertedOne.push(d[0])
        console.log(`   OK ${p.name} → ${d[0].stable_id}`)
      }
    }
    console.log(`\n   Inserted ${insertedOne.length} plumbers (one-by-one)`)

    // Link to service
    if (insertedOne.length > 0) {
      await linkToService(insertedOne, svcData.id)
      if (locData) await linkToLocation(insertedOne, locData.id)
    }
  } else {
    console.log(`   Inserted ${inserted?.length || 0} plumbers successfully!`)
    if (inserted && inserted.length > 0) {
      for (const p of inserted) {
        console.log(`   ✓ ${p.name} → /services/plombier/paris/${p.stable_id}`)
      }
      await linkToService(inserted, svcData.id)
      if (locData) await linkToLocation(inserted, locData.id)
    }
  }

  // Step 5: Verify
  console.log('\n5. Verifying...')
  const { data: verify, error: verErr } = await supabase
    .from('providers')
    .select('id, name, stable_id, slug, rating_average, review_count, address_postal_code')
    .eq('source', 'seed-plombiers-paris')
    .eq('is_active', true)
    .order('rating_average', { ascending: false })

  if (verErr) {
    console.error('Verify error:', verErr.message)
  } else {
    console.log(`\n=== ${verify?.length || 0} plombiers à Paris ===`)
    for (const p of (verify || [])) {
      console.log(`  ${p.name} | ${p.rating_average}★ (${p.review_count} avis) | ${p.address_postal_code} | /services/plombier/paris/${p.stable_id}`)
    }
  }

  console.log('\nDone!')
}

async function linkToService(providers, serviceId) {
  console.log('\n   Linking to plombier service...')
  const links = providers.map(p => ({
    provider_id: p.id,
    service_id: serviceId,
    is_primary: true,
  }))

  const { error } = await supabase
    .from('provider_services')
    .insert(links)

  if (error) {
    console.error('   Service link error:', error.message)
    // Try one by one
    let ok = 0
    for (const link of links) {
      const { error: e } = await supabase.from('provider_services').insert(link)
      if (!e) ok++
    }
    console.log(`   Linked ${ok}/${links.length} to service`)
  } else {
    console.log(`   Linked ${links.length} providers to plombier service`)
  }
}

async function linkToLocation(providers, locationId) {
  console.log('   Linking to Paris location...')
  const links = providers.map(p => ({
    provider_id: p.id,
    location_id: locationId,
    is_primary: true,
    radius_km: 15,
  }))

  const { error } = await supabase
    .from('provider_locations')
    .insert(links)

  if (error) {
    console.error('   Location link error:', error.message)
    let ok = 0
    for (const link of links) {
      const { error: e } = await supabase.from('provider_locations').insert(link)
      if (!e) ok++
    }
    console.log(`   Linked ${ok}/${links.length} to location`)
  } else {
    console.log(`   Linked ${links.length} providers to Paris location`)
  }
}

main().catch(console.error)
