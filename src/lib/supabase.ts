import { createClient } from '@supabase/supabase-js'
import { getCityBySlug as getVilleBySlugImport } from '@/lib/data/usa'
import { logger } from '@/lib/logger'
import { getCachedData, CACHE_TTL } from '@/lib/cache'

/**
 * Detect if we're inside `next build` (static generation phase).
 * During build, skip Supabase client creation to avoid crashes when
 * env vars are not available (e.g. Vercel preview deployments).
 */
const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

export const supabase = IS_BUILD
  ? (null as unknown as ReturnType<typeof createClient>)
  : createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        // Tell Next.js to cache Supabase responses so ISR pages don't
        // become fully dynamic (perpetual x-vercel-cache: MISS).
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            next: { revalidate: 3600 },
          } as RequestInit)
        },
      },
    })

/**
 * Row shape returned by provider listing queries (PROVIDER_LIST_SELECT).
 * Matches the columns selected in the lightweight listing query.
 */
interface AttorneyListRow {
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
      logger.warn(
        `[retryWithBackoff] ${label} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`,
      )
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastError
}


// Lightweight select for listing pages — all required Provider fields + display fields
// Covers: AttorneyCard, AttorneyList, GeographicMap, ServiceQuartierPage
const PROVIDER_LIST_SELECT = [
  'id', 'stable_id', 'name', 'slug', 'specialty',
  'address_street', 'address_postal_code', 'address_city', 'address_region',
  'is_verified', 'is_active', 'noindex',
  'rating_average', 'review_count',
  'phone', 'siret',
  'latitude', 'longitude',
  'created_at', 'updated_at',
].join(',')


export async function getSpecialties() {
  if (IS_BUILD) return Object.values(staticServices) // Use static data during build
  return withTimeout(
    (async () => {
      const { data, error } = await supabase
        .from('specialties')
        .select('id, name, slug, description, icon, category, is_active')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data
    })(),
    QUERY_TIMEOUT_MS,
    'getSpecialties',
  )
}

// Static services fallback — generated from usa.ts (covers all practice areas)
import { practiceAreas as allStaticPracticeAreas } from '@/lib/data/usa'

const staticServices: Record<string, { id: string; name: string; slug: string; description: string; category: string; is_active: boolean }> =
  Object.fromEntries(
    allStaticPracticeAreas.map(s => [
      s.slug,
      { id: s.slug, name: s.name, slug: s.slug, description: `${s.name} professional: free consultation, qualified attorneys.`, category: 'Services', is_active: true },
    ])
  )

export async function getSpecialtyBySlug(slug: string) {
  // During build, use static data only — no DB hit
  if (IS_BUILD) {
    const staticService = staticServices[slug]
    if (staticService) return staticService
    throw new Error(`Service not found: ${slug}`)
  }

  return getCachedData(
    `service:${slug}`,
    async () => {
      try {
        const data = await withTimeout(
          (async () => {
            const { data, error } = await supabase
              .from('specialties')
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
          `getSpecialtyBySlug(${slug})`,
        )
        return data
      } catch (error) {
        const staticService = staticServices[slug]
        if (staticService) return staticService
        throw error
      }
    },
    CACHE_TTL.services, // 86400s — services rarely change
  )
}

export async function getLocationBySlug(slug: string) {
  if (IS_BUILD) {
    // Use static france.ts fallback during build
    const ville = getVilleBySlugImport(slug)
    if (ville) return { id: '', name: ville.name, slug: ville.slug, postal_code: ville.zipCode }
    return null
  }

  return getCachedData(
    `location:${slug}`,
    async () => {
      try {
        const data = await retryWithBackoff(
          async () => {
            const { data, error } = await supabase
              .from('locations_us')
              .select('code_insee, name, slug, code_postal, population, departement_code, departement_name, region_name, latitude, longitude')
              .eq('slug', slug)
              .limit(1)
              .single()

            if (error || !data) throw error || new Error('Location not found')
            return {
              id: data.code_insee,
              name: data.name,
              slug: data.slug,
              postal_code: data.code_postal,
              population: data.population,
              department_code: data.departement_code,
              department_name: data.departement_name,
              region_name: data.region_name,
              latitude: data.latitude,
              longitude: data.longitude,
            }
          },
          `getLocationBySlug(${slug})`,
        )
        return data
      } catch {
        // Fallback to france.ts static data when DB table is empty/missing
        const ville = getVilleBySlugImport(slug)
        if (ville) return { id: '', name: ville.name, slug: ville.slug, postal_code: ville.zipCode }
        return null
      }
    },
    CACHE_TTL.locations, // 604800s (7j) — communes ne changent jamais
  )
}

// Provider detail SELECT — uses EXACTLY the same columns as the listing pages.
// PROVIDER_LIST_SELECT is proven to work in production (listing pages render).
// Any extra columns can be added back ONE AT A TIME after verifying they exist.
const PROVIDER_DETAIL_SELECT = PROVIDER_LIST_SELECT

/**
 * Query a single provider by field.
 * Uses PROVIDER_LIST_SELECT (same as listing pages — proven to work).
 */
async function queryAttorneyDetail(
  field: 'stable_id' | 'id' | 'slug',
  value: string,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Row = Record<string, any>

  const { data } = await supabase
    .from('attorneys')
    .select(PROVIDER_DETAIL_SELECT)
    .eq(field, value)
    .eq('is_active', true)
    .single()

  return data ? (data as Row) : null
}

// Lookup by stable_id ONLY — no fallback.
export async function getAttorneyByStableId(stableId: string) {
  if (IS_BUILD) return null // Skip during build — ISR will populate on first visit
  try {
    return await withTimeout(
      queryAttorneyDetail('stable_id', stableId),
      QUERY_TIMEOUT_MS,
      `getAttorneyByStableId(${stableId})`,
    )
  } catch {
    return null
  }
}

// Lookup by primary UUID id — fallback for providers with no stable_id/slug.
export async function getAttorneyById(id: string) {
  if (IS_BUILD) return null // Skip during build — ISR will populate on first visit
  try {
    return await withTimeout(
      queryAttorneyDetail('id', id),
      QUERY_TIMEOUT_MS,
      `getAttorneyById(${id})`,
    )
  } catch {
    return null
  }
}

// Legacy — still used by non-slice code paths. Will be removed in a future PR.
export async function getAttorneyBySlug(slug: string) {
  if (IS_BUILD) return null // Skip during build — ISR will populate on first visit
  try {
    return await withTimeout(
      queryAttorneyDetail('slug', slug),
      QUERY_TIMEOUT_MS,
      `getAttorneyBySlug(${slug})`,
    )
  } catch {
    return null
  }
}

// Reverse mapping: service slug → provider specialties (for fallback queries)
// All 46 services must be mapped here — unmapped services can never show providers
// on quartier pages, causing them to be permanently noindexed.
export const SPECIALTY_TO_PRACTICE_AREAS: Record<string, string[]> = {
  // === Métiers du bâtiment — correspondance directe NAF ===
  'plombier': ['plombier'],                                        // NAF 43.22A
  'electricien': ['electricien'],                                  // NAF 43.21A
  'chauffagiste': ['chauffagiste'],                                // NAF 43.22B
  'menuisier': ['menuisier'],                                      // NAF 43.32A
  'carreleur': ['carreleur'],                                      // NAF 43.33Z
  'couvreur': ['couvreur'],                                        // NAF 43.91B
  'macon': ['macon'],                                              // NAF 43.99C
  'peintre-en-batiment': ['peintre', 'peintre-en-batiment'],       // NAF 43.34Z
  'peintre': ['peintre', 'peintre-en-batiment'],                   // alias → peintre-en-batiment
  'charpentier': ['charpentier'],                                  // NAF 43.91A
  'serrurier': ['serrurier'],                                      // NAF 43.32B
  'vitrier': ['vitrier'],                                          // NAF 43.34Z
  'climaticien': ['climaticien'],                                  // NAF 43.22B
  'jardinier': ['jardinier'],                                      // NAF 81.30Z
  'solier': ['solier'],                                            // NAF 43.39Z
  'nettoyage': ['nettoyage'],                                      // NAF 81.21Z

  // === Bâtiment / Gros œuvre ===
  'terrassier': ['terrassier'],                                    // NAF 43.12A
  'zingueur': ['zingueur'],                                        // NAF 43.91B (sous-spécialité couverture)
  'etancheiste': ['etancheiste'],                                  // NAF 43.99A
  'facadier': ['facadier'],                                        // NAF 43.34Z + 43.99C
  'platrier': ['platrier'],                                        // NAF 43.31Z
  'metallier': ['metallier'],                                      // NAF 43.32B + 25.11Z
  'ferronnier': ['ferronnier'],                                    // NAF 25.11Z

  // === Finitions / Aménagement ===
  'poseur-de-parquet': ['poseur-de-parquet'],                      // NAF 43.33Z
  'miroitier': ['miroitier'],                                      // NAF 43.34Z
  'storiste': ['storiste'],                                        // NAF 43.32A
  'salle-de-bain': ['salle-de-bain'],                              // NAF 43.22A + 43.33Z
  'architecte-interieur': ['architecte-interieur'],                // NAF 71.11Z
  'decorateur': ['decorateur'],                                    // NAF 74.10Z
  'cuisiniste': ['cuisiniste'],                                    // NAF 43.32C + 31.02Z

  // === Énergie / Chauffage ===
  'domoticien': ['domoticien'],                                    // NAF 43.21A
  'pompe-a-chaleur': ['pompe-a-chaleur'],                          // NAF 43.22B
  'panneaux-solaires': ['panneaux-solaires'],                      // NAF 43.21A + 43.22B
  'isolation-thermique': ['isolation-thermique', 'isolation'],     // NAF 43.29A
  'renovation-energetique': ['renovation-energetique'],            // NAF 43.29A + 43.22B
  'borne-recharge': ['borne-recharge'],                            // NAF 43.21A
  'ramoneur': ['ramoneur'],                                        // NAF 81.29B

  // === Extérieur ===
  'paysagiste': ['paysagiste'],                                    // NAF 71.11Z + 81.30Z
  'pisciniste': ['pisciniste'],                                    // NAF 43.22A

  // === Sécurité / Technique ===
  'alarme-securite': ['alarme-securite'],                          // NAF 43.21A
  'antenniste': ['antenniste'],                                    // NAF 43.21A
  'ascensoriste': ['ascensoriste'],                                // NAF 43.29B

  // === Diagnostics / Conseil ===
  'diagnostiqueur': ['diagnostiqueur'],                            // NAF 71.20B
  'geometre': ['geometre'],                                        // NAF 71.12B

  // === Services spécialisés ===
  'desinsectisation': ['desinsectisation'],                        // NAF 81.29A
  'deratisation': ['deratisation'],                                // NAF 81.29A
  'demenageur': ['demenageur'],                                    // NAF 49.42Z
}

export async function getAttorneysByServiceAndLocation(
  specialtySlug: string,
  locationSlug: string,
  { limit = 50, offset = 0, postalCode }: { limit?: number; offset?: number; postalCode?: string } = {}
) {
  if (IS_BUILD) return [] // Skip during build — ISR will populate on first visit

  const cacheKey = `providers:svc-loc:${specialtySlug}:${locationSlug}:${limit}:${offset}:${postalCode || ''}`

  return getCachedData(
    cacheKey,
    async () => {
      // Use STATIC data for service/location — no DB needed. This keeps total function
      // time well under Vercel's 10s serverless timeout (avoids nested retry cascades).
      const ville = getVilleBySlugImport(locationSlug)
      if (!ville) return []

      const specialties = SPECIALTY_TO_PRACTICE_AREAS[specialtySlug]
      if (!specialties || specialties.length === 0) return []

      // STRICT RULE: arrondissement pages (Paris/Lyon/Marseille) show ONLY providers
      // whose address_postal_code matches the exact arrondissement.
      if (postalCode) {
        return await retryWithBackoff(
          async () => {
            const { data, error } = await supabase
              .from('attorneys')
              .select(PROVIDER_LIST_SELECT)
              .in('specialty', specialties)
              .eq('address_postal_code', postalCode)
              .eq('is_active', true)
              .order('phone', { ascending: false, nullsFirst: false })
              .order('is_verified', { ascending: false })
              .order('name')
              .range(offset, offset + limit - 1)
            if (error) throw error
            return (data || []) as unknown as AttorneyListRow[]
          },
          `getAttorneysByServiceAndLocation:postal(${specialtySlug}, ${postalCode})`,
        )
      }

      const cityValues = [ville.name]

      try {
        return await retryWithBackoff(
          async () => {
            // Primary: direct specialty + city (fast — uses index + .in())
            const { data: direct, error: directError } = await supabase
              .from('attorneys')
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
              logger.warn(`[getAttorneysByServiceAndLocation] primary query error for ${specialtySlug}/${locationSlug}:`, { error: directError.message })
            }

            if (!directError && direct && direct.length > 0) return direct as unknown as AttorneyListRow[]

            return []
          },
          `getAttorneysByServiceAndLocation(${specialtySlug}, ${locationSlug})`,
        )
      } catch (err) {
        // Re-throw so ISR keeps stale cached page instead of caching empty results.
        // Page component catches this and renders gracefully on first cold visit.
        logger.error(`[getAttorneysByServiceAndLocation] FAILED for ${specialtySlug}/${locationSlug}:`, { error: err instanceof Error ? err.message : err })
        throw err
      }
    },
    CACHE_TTL.attorneys, // 3600s (1h)
    { skipNull: true },
  )
}

/**
 * Lightweight check: does this service+location combo have any providers?
 * Uses head:true + count:exact to avoid fetching rows — much faster than
 * getAttorneysByServiceAndLocation during static generation.
 */
export async function hasProvidersByServiceAndLocation(
  specialtySlug: string,
  locationSlug: string,
): Promise<boolean> {
  // Fail open: assume providers exist during build so pages are indexed by default.
  // ISR will correct to noindex if truly 0 providers on first revalidation.
  if (IS_BUILD) return true
  try {
    return await retryWithBackoff(
      async () => {
        const specialties = SPECIALTY_TO_PRACTICE_AREAS[specialtySlug]
        if (!specialties || specialties.length === 0) return false

        const ville = getVilleBySlugImport(locationSlug)
        const cityName = ville?.name
        if (!cityName) return false

        const cityValues = [cityName]
        const { count, error } = await supabase
          .from('attorneys')
          .select('id', { count: 'exact', head: true })
          .in('specialty', specialties)
          .in('address_city', cityValues)
          .eq('is_active', true)

        if (error) throw error
        return (count ?? 0) > 0
      },
      `hasProvidersByServiceAndLocation(${specialtySlug}, ${locationSlug})`,
    )
  } catch {
    // On any failure, conservatively return false (noindex)
    return false
  }
}

/**
 * Return the count of providers for a service+location combo.
 * Uses head:true + count:exact to avoid fetching rows — lightweight.
 * Fail open: returns 1 during build so pages are indexed by default.
 * ISR will correct with the real count on first revalidation.
 */
export async function getAttorneyCountByServiceAndLocation(
  specialtySlug: string,
  locationSlug: string,
): Promise<number> {
  // Fail open: default to 1 during build so pages are indexed (not noindexed).
  // ISR will correct with the real DB count on first revalidation.
  if (IS_BUILD) return 1

  return getCachedData(
    `provider-count:svc-loc:${specialtySlug}:${locationSlug}`,
    async () => {
      try {
        return await retryWithBackoff(
          async () => {
            const specialties = SPECIALTY_TO_PRACTICE_AREAS[specialtySlug]
            if (!specialties || specialties.length === 0) return 0

            const ville = getVilleBySlugImport(locationSlug)
            const cityName = ville?.name
            if (!cityName) return 0

            const cityValues = [cityName]
            const { count, error } = await supabase
              .from('attorneys')
              .select('id', { count: 'exact', head: true })
              .in('specialty', specialties)
              .in('address_city', cityValues)
              .eq('is_active', true)

            if (error) throw error
            return count ?? 0
          },
          `getAttorneyCountByServiceAndLocation(${specialtySlug}, ${locationSlug})`,
        )
      } catch {
        return 0
      }
    },
    CACHE_TTL.attorneys, // 3600s (1h)
  )
}

export async function getAttorneysByLocation(locationSlug: string) {
  if (IS_BUILD) return [] // Skip during build

  // Use STATIC data for location — no DB needed
  const ville = getVilleBySlugImport(locationSlug)
  if (!ville) return []

  const cityValues = [ville.name]
  try {
    return await retryWithBackoff(
      async () => {
        const { data, error } = await supabase
          .from('attorneys')
          .select(PROVIDER_LIST_SELECT)
          .in('address_city', cityValues)
          .eq('is_active', true)
          .order('phone', { ascending: false, nullsFirst: false })
          .order('is_verified', { ascending: false })
          .order('name')
          .limit(500)

        if (error) throw error
        return (data || []) as unknown as AttorneyListRow[]
      },
      `getAttorneysByLocation(${locationSlug})`,
    )
  } catch (err) {
    logger.error(`[getAttorneysByLocation] FAILED for ${locationSlug}:`, { error: err instanceof Error ? err.message : err })
    throw err
  }
}

export async function getAllProviders() {
  if (IS_BUILD) return [] // Skip during build

  return getCachedData(
    'providers:all',
    async () => {
      return withTimeout(
        (async () => {
          const { data, error } = await supabase
            .from('attorneys')
            .select(PROVIDER_LIST_SELECT)
            .eq('is_active', true)
            .order('phone', { ascending: false, nullsFirst: false })
            .order('is_verified', { ascending: false })
            .order('name')
            .limit(1000)

          if (error) throw error
          return (data || []) as unknown as AttorneyListRow[]
        })(),
        QUERY_TIMEOUT_MS,
        'getAllProviders',
      )
    },
    CACHE_TTL.attorneys, // 3600s (1h)
    { skipNull: true },
  )
}

export async function getAttorneysByService(specialtySlug: string, limit?: number) {
  if (IS_BUILD) return [] // Skip during build

  const specialties = SPECIALTY_TO_PRACTICE_AREAS[specialtySlug]
  if (!specialties || specialties.length === 0) return []

  const effectiveLimit = limit || 50
  try {
    return await withTimeout(
      (async () => {
        const { data, error } = await supabase
          .from('attorneys')
          .select(PROVIDER_LIST_SELECT)
          .in('specialty', specialties)
          .eq('is_active', true)
          .order('phone', { ascending: false, nullsFirst: false })
          .order('is_verified', { ascending: false })
          .limit(effectiveLimit)

        if (error) throw error
        return (data || []) as unknown as AttorneyListRow[]
      })(),
      QUERY_TIMEOUT_MS,
      `getAttorneysByService(${specialtySlug})`,
    )
  } catch {
    return []
  }
}

export async function getAttorneyCountByService(specialtySlug: string): Promise<number> {
  if (IS_BUILD) return 0
  const specialties = SPECIALTY_TO_PRACTICE_AREAS[specialtySlug]
  if (!specialties || specialties.length === 0) return 0
  try {
    return await withTimeout(
      (async () => {
        const { count, error } = await supabase
          .from('attorneys')
          .select('id', { count: 'exact', head: true })
          .in('specialty', specialties)
          .eq('is_active', true)
        if (error) throw error
        return count ?? 0
      })(),
      QUERY_TIMEOUT_MS,
      `getAttorneyCountByService(${specialtySlug})`,
    )
  } catch {
    return 0
  }
}

export async function getLocationsByService(specialtySlug: string) {
  if (IS_BUILD) return [] // Skip during build

  const specialties = SPECIALTY_TO_PRACTICE_AREAS[specialtySlug]
  if (!specialties || specialties.length === 0) return []

  return retryWithBackoff(
    async () => {
      // Step 1: get distinct cities from active providers with this specialty
      const { data: providerCities, error: citiesError } = await supabase
        .from('attorneys')
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
        .from('locations_us')
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
    `getLocationsByService(${specialtySlug})`,
  )
}
