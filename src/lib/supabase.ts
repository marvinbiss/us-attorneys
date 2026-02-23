import { createClient } from '@supabase/supabase-js'
import { getVilleBySlug as getVilleBySlugImport } from '@/lib/data/france'
import { resolveProviderCity, resolveProviderCities, getCityValues } from '@/lib/insee-resolver'

/**
 * Detect if we're inside `next build` (static generation phase).
 * During build, skip Supabase client creation to avoid crashes when
 * env vars are not available (e.g. Vercel preview deployments).
 */
const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

export const supabase = IS_BUILD
  ? (null as unknown as ReturnType<typeof createClient>)
  : createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

/**
 * Row shape returned by provider listing queries (PROVIDER_LIST_SELECT).
 * Matches the columns selected in the lightweight listing query.
 */
interface ProviderListRow {
  id: string
  stable_id: string | null
  name: string
  slug: string
  specialty: string | null
  address_street: string | null
  address_postal_code: string | null
  address_city: string | null
  address_region: string | null
  is_verified: boolean | null
  is_active: boolean | null
  noindex: boolean | null
  rating_average: number | null
  review_count: number | null
  phone: string | null
  siret: string | null
  latitude: number | null
  longitude: number | null
  created_at: string | null
  updated_at: string | null
}

/**
 * Race a promise against a timeout. If the promise doesn't resolve within
 * the given ms, rejects with a TimeoutError. Prevents Supabase queries from
 * hanging indefinitely during static generation (the "upstream request timeout"
 * scenario where the HTTP connection hangs without ever throwing).
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`[withTimeout] ${label} timed out after ${ms}ms`)),
      ms,
    )
    promise.then(
      (val) => { clearTimeout(timer); resolve(val) },
      (err) => { clearTimeout(timer); reject(err) },
    )
  })
}

/** Per-query timeout (seconds). Keep well below staticPageGenerationTimeout. */
const QUERY_TIMEOUT_MS = 8_000

/**
 * Retry a function with exponential backoff.
 * Designed for Supabase free tier where statement_timeout (5-8s) causes
 * error code 57014 during heavy static generation (2,498 pages).
 * Each attempt is also guarded by withTimeout to prevent hanging queries.
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = 2,
  baseDelayMs = 800,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(fn(), QUERY_TIMEOUT_MS, label)
    } catch (err: unknown) {
      lastError = err
      const isRetryable =
        err instanceof Error &&
        (err.message?.includes('statement timeout') ||
         err.message?.includes('57014') ||
         err.message?.includes('canceling statement') ||
         err.message?.includes('timed out') ||
         err.message?.includes('upstream request timeout') ||
         err.message?.includes('ECONNRESET') ||
         err.message?.includes('fetch failed'))
      if (!isRetryable || attempt === maxRetries) {
        throw err
      }
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 300
      console.warn(
        `[retryWithBackoff] ${label} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`,
      )
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastError
}


// Lightweight select for listing pages — all required Provider fields + display fields
// Covers: ProviderCard, ProviderList, GeographicMap, ServiceQuartierPage
const PROVIDER_LIST_SELECT = [
  'id', 'stable_id', 'name', 'slug', 'specialty',
  'address_street', 'address_postal_code', 'address_city', 'address_region',
  'is_verified', 'is_active', 'noindex',
  'rating_average', 'review_count',
  'phone', 'siret',
  'latitude', 'longitude',
  'created_at', 'updated_at',
].join(',')


export async function getServices() {
  if (IS_BUILD) return Object.values(staticServices) // Use static data during build
  return withTimeout(
    (async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, slug, description, icon, category, is_active')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data
    })(),
    QUERY_TIMEOUT_MS,
    'getServices',
  )
}

// Services statiques en fallback — généré depuis france.ts (couvre les 46 métiers)
import { services as allStaticServices } from '@/lib/data/france'

const staticServices: Record<string, { id: string; name: string; slug: string; description: string; category: string; is_active: boolean }> =
  Object.fromEntries(
    allStaticServices.map(s => [
      s.slug,
      { id: s.slug, name: s.name, slug: s.slug, description: `${s.name} professionnel : devis gratuit, artisans qualifiés.`, category: 'Services', is_active: true },
    ])
  )

export async function getServiceBySlug(slug: string) {
  // During build, use static data only — no DB hit
  if (IS_BUILD) {
    const staticService = staticServices[slug]
    if (staticService) return staticService
    throw new Error(`Service not found: ${slug}`)
  }

  try {
    const data = await withTimeout(
      (async () => {
        const { data, error } = await supabase
          .from('services')
          .select('id, name, slug, description, icon, category, is_active')
          .eq('slug', slug)
          .single()

        if (error || !data) {
          const staticService = staticServices[slug]
          if (staticService) return staticService
          throw error || new Error('Service not found')
        }
        return data
      })(),
      QUERY_TIMEOUT_MS,
      `getServiceBySlug(${slug})`,
    )
    return data
  } catch (error) {
    const staticService = staticServices[slug]
    if (staticService) return staticService
    throw error
  }
}

export async function getLocationBySlug(slug: string) {
  if (IS_BUILD) {
    // Use static france.ts fallback during build
    const ville = getVilleBySlugImport(slug)
    if (ville) return { id: '', name: ville.name, slug: ville.slug, postal_code: ville.codePostal }
    return null
  }

  try {
    const data = await retryWithBackoff(
      async () => {
        const { data, error } = await supabase
          .from('locations')
          .select('id, name, slug, postal_code, population, department, region, is_active')
          .eq('slug', slug)
          .single()

        if (error || !data) throw error || new Error('Location not found')
        return data
      },
      `getLocationBySlug(${slug})`,
    )
    return data
  } catch {
    // Fallback to france.ts static data when DB table is empty/missing
    const ville = getVilleBySlugImport(slug)
    if (ville) return { id: '', name: ville.name, slug: ville.slug, postal_code: ville.codePostal }
    return null
  }
}

// Full SELECT for single-provider detail pages — includes all columns needed for
// rich artisan profiles (description, location, legal info, etc.)
// Listing pages use PROVIDER_LIST_SELECT instead (lightweight).
//
// IMPORTANT: Only include columns VERIFIED to exist in production.
// Columns like address_department, user_id, claimed_at, code_naf, libelle_naf
// are defined in migrations but may not have been applied to the production DB.
// Including a non-existent column causes PostgREST to error → silent 404.
// These columns are fetched separately below when needed.
const PROVIDER_DETAIL_SELECT = 'id, stable_id, name, slug, specialty, email, phone, siret, siren, description, meta_description, address_street, address_city, address_postal_code, address_region, is_verified, is_active, noindex, rating_average, review_count, legal_form_code, website, latitude, longitude, created_at, updated_at'

// Lookup by stable_id ONLY — no fallback.
export async function getProviderByStableId(stableId: string) {
  if (IS_BUILD) return null // Skip during build — ISR will populate on first visit
  try {
    return await withTimeout(
      (async () => {
        const { data } = await supabase
          .from('providers')
          .select(PROVIDER_DETAIL_SELECT)
          .eq('stable_id', stableId)
          .eq('is_active', true)
          .single()

        return data ? resolveProviderCity(data) : null
      })(),
      QUERY_TIMEOUT_MS,
      `getProviderByStableId(${stableId})`,
    )
  } catch {
    return null
  }
}

// Lookup by primary UUID id — fallback for providers with no stable_id/slug.
export async function getProviderById(id: string) {
  if (IS_BUILD) return null // Skip during build — ISR will populate on first visit
  try {
    return await withTimeout(
      (async () => {
        const { data } = await supabase
          .from('providers')
          .select(PROVIDER_DETAIL_SELECT)
          .eq('id', id)
          .eq('is_active', true)
          .single()

        return data ? resolveProviderCity(data) : null
      })(),
      QUERY_TIMEOUT_MS,
      `getProviderById(${id})`,
    )
  } catch {
    return null
  }
}

// Legacy — still used by non-slice code paths. Will be removed in a future PR.
export async function getProviderBySlug(slug: string) {
  if (IS_BUILD) return null // Skip during build — ISR will populate on first visit
  try {
    return await withTimeout(
      (async () => {
        const { data } = await supabase
          .from('providers')
          .select(PROVIDER_DETAIL_SELECT)
          .eq('slug', slug)
          .eq('is_active', true)
          .single()

        return data ? resolveProviderCity(data) : null
      })(),
      QUERY_TIMEOUT_MS,
      `getProviderBySlug(${slug})`,
    )
  } catch {
    return null
  }
}

// Reverse mapping: service slug → provider specialties (for fallback queries)
// All 46 services must be mapped here — unmapped services can never show providers
// on quartier pages, causing them to be permanently noindexed.
export const SERVICE_TO_SPECIALTIES: Record<string, string[]> = {
  // --- Core trades (direct match) ---
  'plombier': ['plombier'],
  'electricien': ['electricien'],
  'chauffagiste': ['chauffagiste'],
  'menuisier': ['menuisier', 'menuisier-metallique'],
  'carreleur': ['carreleur'],
  'couvreur': ['couvreur', 'charpentier'],
  'macon': ['macon'],
  'peintre-en-batiment': ['peintre', 'platrier', 'finition'],
  'peintre': ['peintre', 'platrier', 'finition'],  // alias — redirects to peintre-en-batiment
  'climaticien': ['isolation', 'chauffagiste'],
  'serrurier': ['serrurier', 'menuisier-metallique'],
  'jardinier': ['jardinier', 'paysagiste'],
  'vitrier': ['vitrier', 'miroitier', 'menuisier'],
  'cuisiniste': ['cuisiniste', 'installateur-de-cuisine', 'menuisier'],
  'solier': ['solier', 'poseur-de-parquet', 'moquettiste', 'carreleur'],
  'nettoyage': ['nettoyage', 'nettoyage-professionnel'],

  // --- Bâtiment / Gros œuvre (linked to macon, couvreur, charpentier) ---
  'terrassier': ['terrassier', 'terrassement', 'macon'],
  'charpentier': ['charpentier', 'couvreur'],
  'zingueur': ['zingueur', 'couvreur-zingueur', 'couvreur'],
  'etancheiste': ['etancheiste', 'etancheite', 'couvreur', 'macon'],
  'facadier': ['facadier', 'facade', 'ravalement', 'peintre', 'macon'],
  'platrier': ['platrier', 'plaquiste', 'platrerie', 'finition'],
  'metallier': ['metallier', 'metallerie', 'menuisier-metallique'],
  'ferronnier': ['ferronnier', 'ferronnerie', 'menuisier-metallique'],

  // --- Finitions / Aménagement (linked to menuisier, peintre, plombier) ---
  'poseur-de-parquet': ['poseur-de-parquet', 'parqueteur', 'solier', 'menuisier'],
  'miroitier': ['miroitier', 'vitrier', 'menuisier'],
  'storiste': ['storiste', 'store', 'volet', 'menuisier'],
  'salle-de-bain': ['salle-de-bain', 'installateur-de-salle-de-bain', 'plombier', 'carreleur'],
  'architecte-interieur': ['architecte-interieur', 'architecte-d-interieur', 'decoration', 'peintre'],
  'decorateur': ['decorateur', 'decoration', 'peintre-decorateur', 'peintre'],

  // --- Énergie / Chauffage (linked to electricien, chauffagiste, couvreur) ---
  'domoticien': ['domoticien', 'domotique', 'electricien'],
  'pompe-a-chaleur': ['pompe-a-chaleur', 'pac', 'chauffagiste'],
  'panneaux-solaires': ['panneaux-solaires', 'photovoltaique', 'solaire', 'electricien', 'couvreur'],
  'isolation-thermique': ['isolation', 'isolation-thermique', 'ite', 'iti', 'macon'],
  'renovation-energetique': ['renovation-energetique', 'rge', 'isolation', 'chauffagiste', 'macon'],
  'borne-recharge': ['borne-recharge', 'borne-electrique', 'electricien'],
  'ramoneur': ['ramoneur', 'ramonage', 'chauffagiste'],

  // --- Extérieur (linked to macon, peintre) ---
  'paysagiste': ['paysagiste', 'jardinier', 'amenagement-exterieur', 'macon'],
  'pisciniste': ['pisciniste', 'piscine', 'macon', 'plombier'],

  // --- Sécurité / Technique (linked to electricien) ---
  'alarme-securite': ['alarme', 'securite', 'videosurveillance', 'alarme-securite', 'electricien'],
  'antenniste': ['antenniste', 'antenne', 'electricien'],
  'ascensoriste': ['ascensoriste', 'ascenseur', 'electricien'],

  // --- Diagnostics / Conseil (linked to macon, electricien) ---
  'diagnostiqueur': ['diagnostiqueur', 'diagnostic', 'dpe', 'electricien'],
  'geometre': ['geometre', 'geometre-expert', 'macon'],

  // --- Services spécialisés ---
  'desinsectisation': ['desinsectisation', 'desinsectiseur', 'nuisibles', 'nettoyage'],
  'deratisation': ['deratisation', 'deratiseur', 'nuisibles', 'nettoyage'],
  'demenageur': ['demenageur', 'demenagement'],
}

export async function getProvidersByServiceAndLocation(
  serviceSlug: string,
  locationSlug: string,
  { limit = 50, offset = 0, postalCode }: { limit?: number; offset?: number; postalCode?: string } = {}
) {
  if (IS_BUILD) return [] // Skip during build — ISR will populate on first visit

  // Use STATIC data for service/location — no DB needed. This keeps total function
  // time well under Vercel's 10s serverless timeout (avoids nested retry cascades).
  const ville = getVilleBySlugImport(locationSlug)
  if (!ville) return []

  const specialties = SERVICE_TO_SPECIALTIES[serviceSlug]
  if (!specialties || specialties.length === 0) return []

  // STRICT RULE: arrondissement pages (Paris/Lyon/Marseille) show ONLY providers
  // whose address_postal_code matches the exact arrondissement.
  if (postalCode) {
    return await retryWithBackoff(
      async () => {
        const { data, error } = await supabase
          .from('providers')
          .select(PROVIDER_LIST_SELECT)
          .in('specialty', specialties)
          .eq('address_postal_code', postalCode)
          .eq('is_active', true)
          .order('phone', { ascending: false, nullsFirst: false })
          .order('is_verified', { ascending: false })
          .order('name')
          .range(offset, offset + limit - 1)
        if (error) throw error
        return resolveProviderCities((data || []) as unknown as ProviderListRow[])
      },
      `getProvidersByServiceAndLocation:postal(${serviceSlug}, ${postalCode})`,
    )
  }

  const cityValues = getCityValues(ville.name)

  try {
    return await retryWithBackoff(
      async () => {
        // Primary: direct specialty + city (fast — uses index + .in())
        const { data: direct, error: directError } = await supabase
          .from('providers')
          .select(PROVIDER_LIST_SELECT)
          .in('specialty', specialties)
          .in('address_city', cityValues)
          .eq('is_active', true)
          // STRICT RULE: providers with phone always rank above those without
          .order('phone', { ascending: false, nullsFirst: false })
          .order('is_verified', { ascending: false })
          .order('name')
          .range(offset, offset + limit - 1)

        if (directError) {
          console.warn(`[getProvidersByServiceAndLocation] primary query error for ${serviceSlug}/${locationSlug}:`, directError.message)
        }

        if (!directError && direct && direct.length > 0) return resolveProviderCities(direct as unknown as ProviderListRow[])

        return []
      },
      `getProvidersByServiceAndLocation(${serviceSlug}, ${locationSlug})`,
    )
  } catch (err) {
    // Re-throw so ISR keeps stale cached page instead of caching empty results.
    // Page component catches this and renders gracefully on first cold visit.
    console.error(`[getProvidersByServiceAndLocation] FAILED for ${serviceSlug}/${locationSlug}:`, err instanceof Error ? err.message : err)
    throw err
  }
}

/**
 * Lightweight check: does this service+location combo have any providers?
 * Uses head:true + count:exact to avoid fetching rows — much faster than
 * getProvidersByServiceAndLocation during static generation.
 */
export async function hasProvidersByServiceAndLocation(
  serviceSlug: string,
  locationSlug: string,
): Promise<boolean> {
  if (IS_BUILD) return false // Conservative: noindex during build, ISR will update
  try {
    return await retryWithBackoff(
      async () => {
        const specialties = SERVICE_TO_SPECIALTIES[serviceSlug]
        if (!specialties || specialties.length === 0) return false

        const ville = getVilleBySlugImport(locationSlug)
        const cityName = ville?.name
        if (!cityName) return false

        const cityValues = getCityValues(cityName)
        const { count, error } = await supabase
          .from('providers')
          .select('id', { count: 'exact', head: true })
          .in('specialty', specialties)
          .in('address_city', cityValues)
          .eq('is_active', true)

        if (error) throw error
        return (count ?? 0) > 0
      },
      `hasProvidersByServiceAndLocation(${serviceSlug}, ${locationSlug})`,
    )
  } catch {
    // On any failure, conservatively return false (noindex)
    return false
  }
}

/**
 * Return the count of providers for a service+location combo.
 * Uses head:true + count:exact to avoid fetching rows — lightweight.
 * Returns 0 during build or on failure.
 */
export async function getProviderCountByServiceAndLocation(
  serviceSlug: string,
  locationSlug: string,
): Promise<number> {
  if (IS_BUILD) return 0
  try {
    return await retryWithBackoff(
      async () => {
        const specialties = SERVICE_TO_SPECIALTIES[serviceSlug]
        if (!specialties || specialties.length === 0) return 0

        const ville = getVilleBySlugImport(locationSlug)
        const cityName = ville?.name
        if (!cityName) return 0

        const cityValues = getCityValues(cityName)
        const { count, error } = await supabase
          .from('providers')
          .select('id', { count: 'exact', head: true })
          .in('specialty', specialties)
          .in('address_city', cityValues)
          .eq('is_active', true)

        if (error) throw error
        return count ?? 0
      },
      `getProviderCountByServiceAndLocation(${serviceSlug}, ${locationSlug})`,
    )
  } catch {
    return 0
  }
}

export async function getProvidersByLocation(locationSlug: string) {
  if (IS_BUILD) return [] // Skip during build

  // Use STATIC data for location — no DB needed
  const ville = getVilleBySlugImport(locationSlug)
  if (!ville) return []

  const cityValues = getCityValues(ville.name)
  try {
    return await retryWithBackoff(
      async () => {
        const { data, error } = await supabase
          .from('providers')
          .select(PROVIDER_LIST_SELECT)
          .in('address_city', cityValues)
          .eq('is_active', true)
          .order('is_verified', { ascending: false })
          .order('name')
          .limit(500)

        if (error) throw error
        return resolveProviderCities((data || []) as unknown as ProviderListRow[])
      },
      `getProvidersByLocation(${locationSlug})`,
    )
  } catch (err) {
    console.error(`[getProvidersByLocation] FAILED for ${locationSlug}:`, err instanceof Error ? err.message : err)
    throw err
  }
}

export async function getAllProviders() {
  if (IS_BUILD) return [] // Skip during build
  return withTimeout(
    (async () => {
      const { data, error } = await supabase
        .from('providers')
        .select(PROVIDER_LIST_SELECT)
        .eq('is_active', true)
        .order('is_verified', { ascending: false })
        .order('name')
        .limit(1000)

      if (error) throw error
      return resolveProviderCities((data || []) as unknown as ProviderListRow[])
    })(),
    QUERY_TIMEOUT_MS,
    'getAllProviders',
  )
}

export async function getProvidersByService(serviceSlug: string, limit?: number) {
  if (IS_BUILD) return [] // Skip during build

  const specialties = SERVICE_TO_SPECIALTIES[serviceSlug]
  if (!specialties || specialties.length === 0) return []

  const effectiveLimit = limit || 50
  try {
    return await withTimeout(
      (async () => {
        const { data, error } = await supabase
          .from('providers')
          .select(PROVIDER_LIST_SELECT)
          .in('specialty', specialties)
          .eq('is_active', true)
          .order('is_verified', { ascending: false })
          .limit(effectiveLimit)

        if (error) throw error
        return resolveProviderCities((data || []) as unknown as ProviderListRow[])
      })(),
      QUERY_TIMEOUT_MS,
      `getProvidersByService(${serviceSlug})`,
    )
  } catch {
    return []
  }
}

export async function getProviderCountByService(serviceSlug: string): Promise<number> {
  if (IS_BUILD) return 0
  const specialties = SERVICE_TO_SPECIALTIES[serviceSlug]
  if (!specialties || specialties.length === 0) return 0
  try {
    return await withTimeout(
      (async () => {
        const { count, error } = await supabase
          .from('providers')
          .select('id', { count: 'exact', head: true })
          .in('specialty', specialties)
          .eq('is_active', true)
        if (error) throw error
        return count ?? 0
      })(),
      QUERY_TIMEOUT_MS,
      `getProviderCountByService(${serviceSlug})`,
    )
  } catch {
    return 0
  }
}

export async function getLocationsByService(serviceSlug: string) {
  if (IS_BUILD) return [] // Skip during build

  const specialties = SERVICE_TO_SPECIALTIES[serviceSlug]
  if (!specialties || specialties.length === 0) return []

  return retryWithBackoff(
    async () => {
      // Step 1: get distinct cities from active providers with this specialty
      const { data: providerCities, error: citiesError } = await supabase
        .from('providers')
        .select('address_city')
        .in('specialty', specialties)
        .eq('is_active', true)
        .not('address_city', 'is', null)
        .limit(500)

      if (citiesError) throw citiesError
      if (!providerCities || providerCities.length === 0) return []

      const uniqueCityNames = Array.from(new Set(
        providerCities.map(p => p.address_city).filter(Boolean)
      )) as string[]

      // Step 2: look up commune data (slug, dept, region) for those cities
      const { data: communes, error: communesError } = await supabase
        .from('communes')
        .select('code_insee, name, slug, departement_code, region_name')
        .in('name', uniqueCityNames.slice(0, 200))
        .order('population', { ascending: false })
        .limit(100)

      if (communesError) throw communesError

      return (communes || []).map(c => ({
        id: c.code_insee,
        name: c.name,
        slug: c.slug,
        department_code: c.departement_code,
        region_name: c.region_name,
      }))
    },
    `getLocationsByService(${serviceSlug})`,
  )
}
