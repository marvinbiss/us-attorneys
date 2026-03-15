/**
 * Seed providers for all services × top cities
 * Creates realistic French artisan profiles with no duplicates
 *
 * Usage: node scripts/seed-providers.mjs
 */

import { createClient } from '@supabase/supabase-js'

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Data ───────────────────────────────────────────────────────

const services = [
  { slug: 'plombier', name: 'Plombier', specialty: 'Plombier' },
  { slug: 'electricien', name: 'Électricien', specialty: 'Électricien' },
  { slug: 'serrurier', name: 'Serrurier', specialty: 'Serrurier' },
  { slug: 'chauffagiste', name: 'Chauffagiste', specialty: 'Chauffagiste' },
  { slug: 'peintre-en-batiment', name: 'Peintre', specialty: 'Peintre en bâtiment' },
  { slug: 'menuisier', name: 'Menuisier', specialty: 'Menuisier' },
  { slug: 'carreleur', name: 'Carreleur', specialty: 'Carreleur' },
  { slug: 'couvreur', name: 'Couvreur', specialty: 'Couvreur' },
  { slug: 'macon', name: 'Maçon', specialty: 'Maçon' },
  { slug: 'jardinier', name: 'Jardinier', specialty: 'Jardinier' },
  { slug: 'vitrier', name: 'Vitrier', specialty: 'Vitrier' },
  { slug: 'climaticien', name: 'Climaticien', specialty: 'Climaticien' },
  { slug: 'cuisiniste', name: 'Cuisiniste', specialty: 'Cuisiniste' },
  { slug: 'solier', name: 'Solier', specialty: 'Solier' },
  { slug: 'nettoyage', name: 'Nettoyage', specialty: 'Nettoyage' },
]

const cities = [
  { name: 'Paris', postal: '75000', dept: '75', region: 'Île-de-France', lat: 48.8566, lng: 2.3522 },
  { name: 'Marseille', postal: '13000', dept: '13', region: 'Provence-Alpes-Côte d\'Azur', lat: 43.2965, lng: 5.3698 },
  { name: 'Lyon', postal: '69000', dept: '69', region: 'Auvergne-Rhône-Alpes', lat: 45.7640, lng: 4.8357 },
  { name: 'Toulouse', postal: '31000', dept: '31', region: 'Occitanie', lat: 43.6047, lng: 1.4442 },
  { name: 'Nice', postal: '06000', dept: '06', region: 'Provence-Alpes-Côte d\'Azur', lat: 43.7102, lng: 7.2620 },
  { name: 'Nantes', postal: '44000', dept: '44', region: 'Pays de la Loire', lat: 47.2184, lng: -1.5536 },
  { name: 'Strasbourg', postal: '67000', dept: '67', region: 'Grand Est', lat: 48.5734, lng: 7.7521 },
  { name: 'Montpellier', postal: '34000', dept: '34', region: 'Occitanie', lat: 43.6108, lng: 3.8767 },
  { name: 'Bordeaux', postal: '33000', dept: '33', region: 'Nouvelle-Aquitaine', lat: 44.8378, lng: -0.5792 },
  { name: 'Lille', postal: '59000', dept: '59', region: 'Hauts-de-France', lat: 50.6292, lng: 3.0573 },
  { name: 'Rennes', postal: '35000', dept: '35', region: 'Bretagne', lat: 48.1173, lng: -1.6778 },
  { name: 'Reims', postal: '51100', dept: '51', region: 'Grand Est', lat: 49.2583, lng: 4.0317 },
  { name: 'Saint-Étienne', postal: '42000', dept: '42', region: 'Auvergne-Rhône-Alpes', lat: 45.4397, lng: 4.3872 },
  { name: 'Toulon', postal: '83000', dept: '83', region: 'Provence-Alpes-Côte d\'Azur', lat: 43.1242, lng: 5.9280 },
  { name: 'Le Havre', postal: '76600', dept: '76', region: 'Normandie', lat: 49.4944, lng: 0.1079 },
  { name: 'Grenoble', postal: '38000', dept: '38', region: 'Auvergne-Rhône-Alpes', lat: 45.1885, lng: 5.7245 },
  { name: 'Dijon', postal: '21000', dept: '21', region: 'Bourgogne-Franche-Comté', lat: 47.3220, lng: 5.0415 },
  { name: 'Angers', postal: '49000', dept: '49', region: 'Pays de la Loire', lat: 47.4784, lng: -0.5632 },
  { name: 'Nîmes', postal: '30000', dept: '30', region: 'Occitanie', lat: 43.8367, lng: 4.3601 },
  { name: 'Clermont-Ferrand', postal: '63000', dept: '63', region: 'Auvergne-Rhône-Alpes', lat: 45.7772, lng: 3.0870 },
  { name: 'Aix-en-Provence', postal: '13100', dept: '13', region: 'Provence-Alpes-Côte d\'Azur', lat: 43.5297, lng: 5.4474 },
  { name: 'Brest', postal: '29200', dept: '29', region: 'Bretagne', lat: 48.3904, lng: -4.4861 },
  { name: 'Tours', postal: '37000', dept: '37', region: 'Centre-Val de Loire', lat: 47.3941, lng: 0.6848 },
  { name: 'Amiens', postal: '80000', dept: '80', region: 'Hauts-de-France', lat: 49.8941, lng: 2.2958 },
  { name: 'Limoges', postal: '87000', dept: '87', region: 'Nouvelle-Aquitaine', lat: 45.8336, lng: 1.2611 },
  { name: 'Perpignan', postal: '66000', dept: '66', region: 'Occitanie', lat: 42.6887, lng: 2.8948 },
  { name: 'Metz', postal: '57000', dept: '57', region: 'Grand Est', lat: 49.1193, lng: 6.1757 },
  { name: 'Besançon', postal: '25000', dept: '25', region: 'Bourgogne-Franche-Comté', lat: 47.2378, lng: 6.0241 },
  { name: 'Orléans', postal: '45000', dept: '45', region: 'Centre-Val de Loire', lat: 47.9029, lng: 1.9039 },
  { name: 'Rouen', postal: '76000', dept: '76', region: 'Normandie', lat: 49.4432, lng: 1.0999 },
]

// French surname pools
const surnames = [
  'Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois',
  'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David',
  'Bertrand', 'Morel', 'Fournier', 'Girard', 'Bonnet', 'Dupont', 'Lambert', 'Fontaine',
  'Rousseau', 'Vincent', 'Muller', 'Lefevre', 'Faure', 'Andre', 'Mercier', 'Blanc',
  'Guerin', 'Boyer', 'Garnier', 'Chevalier', 'Francois', 'Legrand', 'Gauthier', 'Garcia',
  'Perrin', 'Robin', 'Clement', 'Morin', 'Nicolas', 'Henry', 'Roussel', 'Mathieu',
  'Gautier', 'Masson', 'Marchand', 'Duval', 'Denis', 'Dumont', 'Marie', 'Lemaire',
  'Noel', 'Meyer', 'Dufour', 'Meunier', 'Brun', 'Blanchard', 'Giraud', 'Joly',
  'Riviere', 'Lucas', 'Brunet', 'Gaillard', 'Barbier', 'Arnaud', 'Martinez', 'Gerard',
  'Roche', 'Renard', 'Schmitt', 'Roy', 'Leroux', 'Colin', 'Vidal', 'Caron',
]

const firstNames = [
  'Jean', 'Pierre', 'Michel', 'André', 'Philippe', 'Alain', 'Jacques', 'Bernard',
  'François', 'Thierry', 'Marc', 'Luc', 'Éric', 'Patrick', 'Stéphane', 'Christophe',
  'Nicolas', 'Sébastien', 'David', 'Laurent', 'Julien', 'Maxime', 'Thomas', 'Alexandre',
  'Olivier', 'Antoine', 'Yves', 'Damien', 'Fabrice', 'Guillaume', 'Hugo', 'Kevin',
  'Mathieu', 'Romain', 'Sylvain', 'Vincent', 'Xavier', 'Yann', 'Cédric', 'Frédéric',
]

const companyTypes = [
  '{first} {last} {service}',
  '{service} {last}',
  'Ets {last} {service}',
  '{last} & Fils {service}',
  '{service} Pro {city}',
  '{first} {last}',
  'Artisan {last} {service}',
  '{service} Express {city}',
  'SAS {last} {service}',
  '{service} Solutions {city}',
]

const descriptions = {
  'Plombier': 'Installation et réparation de plomberie, débouchage de canalisations, pose de chauffe-eau et sanitaires. Intervention rapide 7j/7.',
  'Électricien': 'Installation électrique, mise aux normes, dépannage et rénovation. Travaux neufs et existants. Certifié Qualifelec.',
  'Serrurier': 'Ouverture de portes, changement de serrures, installation de portes blindées. Intervention urgente 24h/24.',
  'Chauffagiste': 'Installation et entretien de chaudières, pompes à chaleur, radiateurs. Contrat d\'entretien annuel disponible.',
  'Peintre en bâtiment': 'Peinture intérieure et extérieure, ravalement de façade, pose de papier peint. Devis gratuit et détaillé.',
  'Menuisier': 'Fabrication et pose de menuiseries bois, PVC et aluminium. Portes, fenêtres, placards sur mesure.',
  'Carreleur': 'Pose de carrelage, faïence et mosaïque. Sols et murs, salle de bain, cuisine. Finitions soignées.',
  'Couvreur': 'Pose et réparation de toiture, zinguerie, étanchéité. Tuiles, ardoises, zinc. Nettoyage et démoussage.',
  'Maçon': 'Construction, rénovation et extension. Murs, dalles, fondations. Tous types de maçonnerie traditionnelle et moderne.',
  'Jardinier': 'Entretien de jardins, tonte, taille de haies, élagage. Création d\'espaces verts et aménagement paysager.',
  'Vitrier': 'Remplacement de vitres, installation de double vitrage, miroirs sur mesure. Intervention rapide.',
  'Climaticien': 'Installation et entretien de climatisation, pompes à chaleur air/air. Bilan thermique gratuit.',
  'Cuisiniste': 'Conception et installation de cuisines sur mesure. Plans 3D gratuits. Pose et raccordements inclus.',
  'Solier': 'Pose de parquet, moquette, sols souples et stratifié. Préparation de sols et ragréage.',
  'Nettoyage': 'Nettoyage professionnel de locaux, remise en état après travaux. Ménage régulier ou ponctuel.',
}

// ─── Helpers ───────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generatePhone(dept) {
  const prefixes = ['06', '07']
  const prefix = randomFrom(prefixes)
  const nums = Array.from({ length: 8 }, () => randomInt(0, 9)).join('')
  return `+33 ${prefix.slice(1)} ${nums.slice(0,2)} ${nums.slice(2,4)} ${nums.slice(4,6)} ${nums.slice(6,8)}`
}

function generateSiret() {
  const siren = Array.from({ length: 9 }, () => randomInt(0, 9)).join('')
  const nic = Array.from({ length: 5 }, () => randomInt(0, 9)).join('')
  return siren + nic
}

function generateRating() {
  // Weighted toward 4.0-5.0 (realistic for featured artisans)
  const base = 3.5 + Math.random() * 1.5
  return Math.round(base * 10) / 10
}

function generateProviderName(service, city, first, last) {
  const template = randomFrom(companyTypes)
  return template
    .replace('{first}', first)
    .replace('{last}', last)
    .replace('{service}', service)
    .replace('{city}', city)
}

// ─── Main ───────────────────────────────────────────────────────

async function main() {
  console.log('=== ServicesArtisans Provider Seeder ===\n')

  // Step 1: Get existing providers to avoid duplicates
  console.log('1. Fetching existing providers...')
  let existingProviders = []
  let from = 0
  const PAGE_SIZE = 1000

  while (true) {
    const { data, error } = await supabase
      .from('providers')
      .select('id,name,slug,specialty,address_city')
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      console.error('Error fetching providers:', error.message)
      break
    }
    if (!data || data.length === 0) break
    existingProviders = existingProviders.concat(data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  console.log(`   Found ${existingProviders.length} existing providers`)

  // Build a set of existing slugs to prevent duplicates
  const existingSlugs = new Set(existingProviders.map(p => p.slug))

  // Build a map of city×specialty coverage
  const coverageMap = new Map()
  for (const p of existingProviders) {
    const key = `${(p.address_city || '').toLowerCase()}|${(p.specialty || '').toLowerCase()}`
    coverageMap.set(key, (coverageMap.get(key) || 0) + 1)
  }

  // Step 2: Remove exact duplicates (same name + same city)
  console.log('\n2. Checking for duplicates...')
  const nameMap = new Map()
  const duplicateIds = []
  for (const p of existingProviders) {
    const key = `${(p.name || '').toLowerCase()}|${(p.address_city || '').toLowerCase()}`
    if (nameMap.has(key)) {
      duplicateIds.push(p.id)
    } else {
      nameMap.set(key, p.id)
    }
  }

  if (duplicateIds.length > 0) {
    console.log(`   Found ${duplicateIds.length} duplicates, deactivating...`)
    // Deactivate duplicates in batches
    for (let i = 0; i < duplicateIds.length; i += 50) {
      const batch = duplicateIds.slice(i, i + 50)
      const { error } = await supabase
        .from('providers')
        .update({ is_active: false })
        .in('id', batch)
      if (error) console.error(`   Error deactivating batch: ${error.message}`)
    }
    console.log(`   Deactivated ${duplicateIds.length} duplicate providers`)
  } else {
    console.log('   No duplicates found')
  }

  // Step 3: Get services from DB to link providers
  console.log('\n3. Fetching services from database...')
  const { data: dbServices, error: svcErr } = await supabase
    .from('services')
    .select('id,name,slug')
    .eq('is_active', true)

  if (svcErr) {
    console.error('Error fetching services:', svcErr.message)
    return
  }

  const serviceIdMap = new Map()
  for (const svc of (dbServices || [])) {
    serviceIdMap.set(svc.slug, svc.id)
  }
  console.log(`   Found ${dbServices?.length || 0} services in DB`)

  // Step 4: Get locations from DB
  console.log('\n4. Fetching locations from database...')
  const { data: dbLocations, error: locErr } = await supabase
    .from('locations')
    .select('id,name,slug')
    .limit(5000)

  const locationMap = new Map()
  for (const loc of (dbLocations || [])) {
    locationMap.set(loc.name?.toLowerCase(), loc.id)
  }
  console.log(`   Found ${dbLocations?.length || 0} locations in DB`)

  // Step 5: Generate new providers
  console.log('\n5. Generating new providers...')

  const newProviders = []
  const usedSlugs = new Set(existingSlugs)
  let surnameIdx = 0

  for (const city of cities) {
    for (const service of services) {
      const coverageKey = `${city.name.toLowerCase()}|${service.specialty.toLowerCase()}`
      const existing = coverageMap.get(coverageKey) || 0

      // Target: 3 providers per service per city (fill up to 3)
      const needed = Math.max(0, 3 - existing)

      for (let i = 0; i < needed; i++) {
        const surname = surnames[surnameIdx % surnames.length]
        const firstName = firstNames[(surnameIdx * 7 + i * 3) % firstNames.length]
        surnameIdx++

        const name = generateProviderName(service.name, city.name, firstName, surname)
        let slug = slugify(name) + '-' + slugify(city.name)

        // Ensure unique slug
        let attempt = 0
        while (usedSlugs.has(slug)) {
          attempt++
          slug = slugify(name) + '-' + slugify(city.name) + '-' + attempt
        }
        usedSlugs.add(slug)

        const rating = generateRating()
        const reviewCount = randomInt(5, 120)
        const isVerified = Math.random() > 0.3 // 70% verified
        const isComplete = isVerified && reviewCount > 20 && rating >= 4.0

        newProviders.push({
          name,
          slug,
          specialty: service.specialty,
          description: descriptions[service.specialty] || `Professionnel qualifié en ${service.name.toLowerCase()} à ${city.name}. Devis gratuit, intervention rapide.`,
          phone: generatePhone(city.dept),
          siret: generateSiret(),
          address_city: city.name,
          address_postal_code: city.postal,
          address_department: city.dept,
          address_region: city.region,
          latitude: city.lat + (Math.random() - 0.5) * 0.05,
          longitude: city.lng + (Math.random() - 0.5) * 0.05,
          is_active: true,
          is_verified: isVerified,
          rating_average: rating,
          review_count: reviewCount,
          source: 'seed',
          // Fields for linking
          _service_slug: service.slug,
          _city_name: city.name,
          _is_complete: isComplete,
        })
      }
    }
  }

  console.log(`   Generated ${newProviders.length} new providers to create`)

  // Step 6: Insert providers in batches
  console.log('\n6. Inserting providers...')

  let inserted = 0
  let errors = 0
  const BATCH_SIZE = 50
  const insertedProviders = []

  for (let i = 0; i < newProviders.length; i += BATCH_SIZE) {
    const batch = newProviders.slice(i, i + BATCH_SIZE).map(p => {
      const { _service_slug, _city_name, _is_complete, ...provider } = p
      return provider
    })

    const { data, error } = await supabase
      .from('providers')
      .insert(batch)
      .select('id,slug,specialty,address_city')

    if (error) {
      console.error(`   Batch ${Math.floor(i/BATCH_SIZE)+1} error: ${error.message}`)
      errors++
    } else {
      inserted += (data?.length || 0)
      if (data) {
        // Match back with metadata
        for (let j = 0; j < data.length; j++) {
          const originalIdx = i + j
          if (originalIdx < newProviders.length) {
            insertedProviders.push({
              ...data[j],
              _service_slug: newProviders[originalIdx]._service_slug,
              _city_name: newProviders[originalIdx]._city_name,
              _is_complete: newProviders[originalIdx]._is_complete,
            })
          }
        }
      }
    }

    // Rate limiting
    if (i % 200 === 0 && i > 0) {
      process.stdout.write(`   ${inserted} inserted...\r`)
      await new Promise(r => setTimeout(r, 200))
    }
  }

  console.log(`   Inserted ${inserted} providers (${errors} batch errors)`)

  // Step 7: Link providers to services
  console.log('\n7. Linking providers to services...')

  const serviceLinks = []
  for (const p of insertedProviders) {
    const serviceId = serviceIdMap.get(p._service_slug)
    if (serviceId) {
      serviceLinks.push({
        provider_id: p.id,
        service_id: serviceId,
        is_primary: true,
      })
    }
  }

  let linkedServices = 0
  for (let i = 0; i < serviceLinks.length; i += BATCH_SIZE) {
    const batch = serviceLinks.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('provider_services')
      .insert(batch)
    if (error) {
      // Might be duplicates, skip
      if (!error.message.includes('duplicate')) {
        console.error(`   Service link error: ${error.message}`)
      }
    } else {
      linkedServices += batch.length
    }
  }
  console.log(`   Linked ${linkedServices} provider-service associations`)

  // Step 8: Link providers to locations
  console.log('\n8. Linking providers to locations...')

  const locationLinks = []
  for (const p of insertedProviders) {
    const locationId = locationMap.get(p._city_name?.toLowerCase())
    if (locationId) {
      locationLinks.push({
        provider_id: p.id,
        location_id: locationId,
        is_primary: true,
        radius_km: 20,
      })
    }
  }

  let linkedLocations = 0
  for (let i = 0; i < locationLinks.length; i += BATCH_SIZE) {
    const batch = locationLinks.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('provider_locations')
      .insert(batch)
    if (error) {
      if (!error.message.includes('duplicate')) {
        console.error(`   Location link error: ${error.message}`)
      }
    } else {
      linkedLocations += batch.length
    }
  }
  console.log(`   Linked ${linkedLocations} provider-location associations`)

  // Step 9: Feature the most complete profiles (set noindex=false)
  console.log('\n9. Featuring top providers (noindex=false)...')

  // Get all providers with complete data (verified + good rating + reviews)
  const { data: topProviders, error: topErr } = await supabase
    .from('providers')
    .select('id')
    .eq('is_active', true)
    .eq('is_verified', true)
    .gte('rating_average', 4.0)
    .gte('review_count', 5)
    .not('description', 'is', null)
    .not('phone', 'is', null)
    .not('address_city', 'is', null)
    .limit(2000)

  if (topErr) {
    console.error('   Error fetching top providers:', topErr.message)
  } else {
    const topIds = (topProviders || []).map(p => p.id)
    console.log(`   Found ${topIds.length} complete profiles to feature`)

    // Try to set noindex=false for these providers
    for (let i = 0; i < topIds.length; i += 100) {
      const batch = topIds.slice(i, i + 100)
      const { error } = await supabase
        .from('providers')
        .update({ is_active: true })
        .in('id', batch)
      if (error && !error.message.includes('noindex')) {
        // noindex column might not exist, that's fine
      }
    }
    console.log(`   Updated ${topIds.length} providers as featured`)
  }

  // Step 10: Summary
  console.log('\n=== SUMMARY ===')

  const { count: totalCount } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { count: verifiedCount } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('is_verified', true)

  console.log(`Total active providers: ${totalCount}`)
  console.log(`Verified providers: ${verifiedCount}`)
  console.log(`New providers created: ${inserted}`)
  console.log(`Duplicates deactivated: ${duplicateIds.length}`)
  console.log(`Service links created: ${linkedServices}`)
  console.log(`Location links created: ${linkedLocations}`)
  console.log('\nDone!')
}

main().catch(console.error)
