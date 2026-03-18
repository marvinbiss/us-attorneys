import { createClient } from '@supabase/supabase-js'
import { getCityBySlug as getCityBySlugImport } from '@/lib/data/usa'
import { isZipSlug, extractZipCode, resolveZipToLocation } from '@/lib/location-resolver'
import { dbLogger } from '@/lib/logger'
import { getCachedData, generateCacheKey, CACHE_TTL } from '@/lib/cache'

/**
 * Detect if we're inside `next build` (static generation phase).
 * During build, skip Supabase client creation to avoid crashes when
 * env vars are not available (e.g. Vercel preview deployments).
 */
const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

// During build, supabase is null. All query functions guard with IS_BUILD checks.
// The non-null assertion (!) below is safe because every consumer checks IS_BUILD first.
export const supabase = IS_BUILD
  ? (null! as ReturnType<typeof createClient>)
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
 * Cast Supabase query result rows to the expected shape.
 * Supabase's generated types don't account for embedded joins resolving to
 * single objects (not arrays), so we need this typed identity function.
 */
function asAttorneyListRows(data: unknown[]): AttorneyListRow[] {
  return data as AttorneyListRow[]
}

/**
 * Row shape returned by provider listing queries (PROVIDER_LIST_SELECT).
 * Matches the columns selected in the lightweight listing query.
 * `specialty` comes from an embedded join on specialties via primary_specialty_id.
 */
export interface AttorneyListRow {
  id: string
  stable_id: string | null
  name: string
  slug: string
  primary_specialty_id: string | null
  specialty: { slug: string; name: string } | null
  address_line1: string | null
  address_zip: string | null
  address_city: string | null
  address_state: string | null
  address_county: string | null
  is_verified: boolean | null
  is_active: boolean | null
  noindex: boolean | null
  rating_average: number | null
  review_count: number | null
  phone: string | null
  bar_number: string | null
  latitude: number | null
  longitude: number | null
  created_at: string | null
  updated_at: string | null
  is_featured: boolean | null
  boost_level: number | null
}

/** Shape returned by Supabase join on states table (state:states!state_id(...)). */
interface StateJoinRow {
  abbreviation: string
  name?: string
  region?: string
}

/**
 * Unwrap a Supabase embedded join result to a single object.
 * Supabase TS types model joins as arrays, but single FK joins resolve to objects at runtime.
 */
function unwrapJoin<T>(value: T | T[] | null): T | null {
  if (value === null || value === undefined) return null
  if (Array.isArray(value)) return value[0] ?? null
  return value
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
      dbLogger.warn(
        `[retryWithBackoff] ${label} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`,
      )
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastError
}


/**
 * Resolve specialty slugs to their UUID primary keys.
 * Cached for 24h since specialties rarely change.
 * Used to filter attorneys by primary_specialty_id instead of the non-existent 'specialty' text column.
 */
async function resolveSpecialtyIds(slugs: string[]): Promise<string[]> {
  if (slugs.length === 0) return []
  const cacheKey = `specialty-ids:${slugs.sort().join(',')}`
  return getCachedData(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('specialties')
        .select('id')
        .in('slug', slugs)
      if (error) throw error
      return (data || []).map(s => s.id)
    },
    CACHE_TTL.services, // 86400s — specialties rarely change
  )
}

// Lightweight select for listing pages — all required Provider fields + display fields
// Covers: AttorneyCard, AttorneyList, GeographicMap, ServiceNeighborhoodPage
// `specialty` is an embedded join on specialties via primary_specialty_id FK (not a column on attorneys).
const PROVIDER_LIST_SELECT = [
  'id', 'stable_id', 'name', 'slug',
  'primary_specialty_id',
  'address_line1', 'address_zip', 'address_city', 'address_state', 'address_county',
  'is_verified', 'is_active', 'noindex',
  'rating_average', 'review_count',
  'phone', 'bar_number',
  'latitude', 'longitude',
  'created_at', 'updated_at',
  'is_featured', 'boost_level',
].join(',') + ',specialty:specialties!primary_specialty_id(slug,name)'


export async function getSpecialties() {
  if (IS_BUILD) return Object.values(staticServices) // Use static data during build
  return getCachedData(
    'specialties:all',
    async () => {
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
    },
    CACHE_TTL.services,
    { skipNull: true },
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
      } catch (error: unknown) {
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
    // Use static usa.ts fallback during build
    const city = getCityBySlugImport(slug)
    if (city) return { id: '', name: city.name, slug: city.slug, postal_code: city.zipCode }
    return null
  }

  // ZIP slug (e.g., "10001-new-york-ny") — resolve from zip_codes table
  if (isZipSlug(slug)) {
    return resolveZipToLocation(slug)
  }

  return getCachedData(
    `location:${slug}`,
    async () => {
      try {
        const data = await retryWithBackoff(
          async () => {
            const { data, error } = await supabase
              .from('locations_us')
              .select('id, name, slug, population, latitude, longitude, state:states!state_id(abbreviation, name, region)')
              .eq('slug', slug)
              .limit(1)
              .single()

            if (error || !data) throw error || new Error('Location not found')
            const state = unwrapJoin(data.state) as StateJoinRow | null
            return {
              id: data.id,
              name: data.name,
              slug: data.slug,
              postal_code: undefined as string | undefined,
              population: data.population,
              department_code: state?.abbreviation ?? undefined,
              department_name: state?.name ?? undefined,
              region_name: state?.region ?? undefined,
              latitude: data.latitude,
              longitude: data.longitude,
            }
          },
          `getLocationBySlug(${slug})`,
        )
        return data
      } catch (err: unknown) {
        dbLogger.error(`[getLocationBySlug] DB query failed for slug="${slug}", falling back to static data`, err)
        // Fallback to usa.ts static data when DB table is empty/missing
        const fallbackCity = getCityBySlugImport(slug)
        if (fallbackCity) return { id: '', name: fallbackCity.name, slug: fallbackCity.slug, postal_code: fallbackCity.zipCode }
        return null
      }
    },
    CACHE_TTL.locations, // 604800s (7d) — locations never change
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
  const { data } = await supabase
    .from('attorneys')
    .select(PROVIDER_DETAIL_SELECT)
    .eq(field, value)
    .eq('is_active', true)
    .single()

  // Supabase anon client uses generated types; select() result matches AttorneyListRow by PROVIDER_LIST_SELECT
  return data ? (data as unknown as AttorneyListRow) : null
}

// Lookup by stable_id ONLY — no fallback.
export async function getAttorneyByStableId(stableId: string) {
  if (IS_BUILD) return null // Skip during build — ISR will populate on first visit
  return getCachedData(
    `attorney:stable:${stableId}`,
    async () => {
      try {
        return await withTimeout(
          queryAttorneyDetail('stable_id', stableId),
          QUERY_TIMEOUT_MS,
          `getAttorneyByStableId(${stableId})`,
        )
      } catch (err: unknown) {
        dbLogger.error(`[getAttorneyByStableId] failed for stableId="${stableId}"`, err)
        return null
      }
    },
    CACHE_TTL.attorneys,
    { skipNull: true },
  )
}

// Lookup by primary UUID id — fallback for providers with no stable_id/slug.
export async function getAttorneyById(id: string) {
  if (IS_BUILD) return null // Skip during build — ISR will populate on first visit
  return getCachedData(
    `attorney:id:${id}`,
    async () => {
      try {
        return await withTimeout(
          queryAttorneyDetail('id', id),
          QUERY_TIMEOUT_MS,
          `getAttorneyById(${id})`,
        )
      } catch (err: unknown) {
        dbLogger.error(`[getAttorneyById] failed for id="${id}"`, err)
        return null
      }
    },
    CACHE_TTL.attorneys,
    { skipNull: true },
  )
}

// Legacy — still used by non-slice code paths. Will be removed in a future PR.
export async function getAttorneyBySlug(slug: string) {
  if (IS_BUILD) return null // Skip during build — ISR will populate on first visit
  return getCachedData(
    `attorney:slug:${slug}`,
    async () => {
      try {
        return await withTimeout(
          queryAttorneyDetail('slug', slug),
          QUERY_TIMEOUT_MS,
          `getAttorneyBySlug(${slug})`,
        )
      } catch (err: unknown) {
        dbLogger.error(`[getAttorneyBySlug] failed for slug="${slug}"`, err)
        return null
      }
    },
    CACHE_TTL.attorneys,
    { skipNull: true },
  )
}

// Reverse mapping: specialty slug → bar category aliases (for fallback queries)
// All 200 practice areas are mapped here — unmapped ones can never show attorneys
// on neighborhood pages, causing them to be permanently noindexed.
// Parent PAs map to themselves; child PAs map to themselves + parent (+ grandparent if any).
export const SPECIALTY_TO_BAR_CATEGORIES: Record<string, string[]> = {
  // ── PERSONAL INJURY (25 + 4 additional) ──────────────────────────────────
  'personal-injury': ['personal-injury'],
  'car-accidents': ['car-accidents', 'personal-injury'],
  'truck-accidents': ['truck-accidents', 'personal-injury'],
  'motorcycle-accidents': ['motorcycle-accidents', 'personal-injury'],
  'slip-and-fall': ['slip-and-fall', 'personal-injury'],
  'medical-malpractice': ['medical-malpractice', 'personal-injury'],
  'wrongful-death': ['wrongful-death', 'personal-injury'],
  'product-liability': ['product-liability', 'personal-injury'],
  'workers-compensation': ['workers-compensation', 'personal-injury', 'workers-comp'],
  'nursing-home-abuse': ['nursing-home-abuse', 'personal-injury'],
  'bicycle-accidents': ['bicycle-accidents', 'personal-injury'],
  'pedestrian-accidents': ['pedestrian-accidents', 'personal-injury'],
  'brain-injury': ['brain-injury', 'personal-injury'],
  'spinal-cord-injury': ['spinal-cord-injury', 'personal-injury'],
  'burn-injury': ['burn-injury', 'personal-injury'],
  'dog-bite': ['dog-bite', 'personal-injury'],
  'uber-lyft-accidents': ['uber-lyft-accidents', 'personal-injury'],
  'boat-accidents': ['boat-accidents', 'personal-injury'],
  'aviation-accidents': ['aviation-accidents', 'personal-injury'],
  'construction-accidents': ['construction-accidents', 'personal-injury'],
  'premises-liability': ['premises-liability', 'personal-injury'],
  'catastrophic-injury': ['catastrophic-injury', 'personal-injury'],
  'toxic-exposure': ['toxic-exposure', 'personal-injury'],
  'railroad-injury': ['railroad-injury', 'personal-injury'],
  'swimming-pool-accidents': ['swimming-pool-accidents', 'personal-injury'],
  'medical-device-injury': ['medical-device-injury', 'personal-injury'],
  'rideshare-law': ['rideshare-law', 'personal-injury'],
  'uninsured-motorist': ['uninsured-motorist', 'personal-injury'],
  'mesothelioma': ['mesothelioma', 'personal-injury'],
  // Sub-subspecialties (grandchildren of personal-injury)
  'birth-injury': ['birth-injury', 'medical-malpractice', 'personal-injury'],
  'nursing-malpractice': ['nursing-malpractice', 'medical-malpractice', 'personal-injury'],
  'dental-malpractice': ['dental-malpractice', 'medical-malpractice', 'personal-injury'],

  // ── CRIMINAL DEFENSE (20) ────────────────────────────────────────────────
  'criminal-defense': ['criminal-defense'],
  'dui-dwi': ['dui-dwi', 'criminal-defense', 'dui', 'dwi'],
  'drug-crimes': ['drug-crimes', 'criminal-defense'],
  'white-collar-crime': ['white-collar-crime', 'criminal-defense'],
  'federal-crimes': ['federal-crimes', 'criminal-defense'],
  'juvenile-crimes': ['juvenile-crimes', 'criminal-defense'],
  'sex-crimes': ['sex-crimes', 'criminal-defense'],
  'theft-robbery': ['theft-robbery', 'criminal-defense'],
  'violent-crimes': ['violent-crimes', 'criminal-defense'],
  'traffic-violations': ['traffic-violations', 'criminal-defense'],
  'assault-battery': ['assault-battery', 'criminal-defense'],
  'domestic-assault': ['domestic-assault', 'criminal-defense'],
  'gun-charges': ['gun-charges', 'criminal-defense'],
  'probation-violations': ['probation-violations', 'criminal-defense'],
  'expungement': ['expungement', 'criminal-defense'],
  'embezzlement': ['embezzlement', 'criminal-defense'],
  'fraud': ['fraud', 'criminal-defense'],
  'manslaughter': ['manslaughter', 'criminal-defense'],
  'conspiracy': ['conspiracy', 'criminal-defense'],
  'hit-and-run': ['hit-and-run', 'criminal-defense'],

  // ── FAMILY LAW (15) ──────────────────────────────────────────────────────
  'divorce': ['divorce', 'family-law'],
  'child-custody': ['child-custody', 'divorce', 'family-law'],
  'child-support': ['child-support', 'divorce', 'family-law'],
  'adoption': ['adoption', 'family-law'],
  'alimony-spousal-support': ['alimony-spousal-support', 'divorce', 'alimony', 'spousal-support'],
  'domestic-violence': ['domestic-violence', 'family-law'],
  'prenuptial-agreements': ['prenuptial-agreements', 'divorce', 'prenup'],
  'paternity': ['paternity', 'family-law'],
  'grandparents-rights': ['grandparents-rights', 'divorce'],
  'military-divorce': ['military-divorce', 'divorce'],
  'same-sex-divorce': ['same-sex-divorce', 'divorce'],
  'modification-orders': ['modification-orders', 'divorce'],
  'relocation-custody': ['relocation-custody', 'child-custody', 'divorce'],
  'father-rights': ['father-rights', 'child-custody', 'divorce'],
  'mother-rights': ['mother-rights', 'child-custody', 'divorce'],

  // ── BUSINESS & CORPORATE (15) ────────────────────────────────────────────
  'business-law': ['business-law', 'corporate-law'],
  'corporate-law': ['corporate-law', 'business-law'],
  'mergers-acquisitions': ['mergers-acquisitions', 'business-law'],
  'contract-law': ['contract-law', 'business-law'],
  'business-litigation': ['business-litigation', 'business-law'],
  'startup-law': ['startup-law', 'business-law'],
  'franchise-law': ['franchise-law', 'business-law'],
  'partnership-disputes': ['partnership-disputes', 'business-law'],
  'shareholder-disputes': ['shareholder-disputes', 'corporate-law', 'business-law'],
  'non-compete-agreements': ['non-compete-agreements', 'business-law'],
  'trade-secrets': ['trade-secrets', 'business-law'],
  'securities-law': ['securities-law', 'corporate-law', 'business-law'],
  'venture-capital': ['venture-capital', 'corporate-law', 'business-law'],
  'commercial-lease': ['commercial-lease', 'business-law'],
  'small-business-law': ['small-business-law', 'business-law'],

  // ── INTELLECTUAL PROPERTY (8) ─────────────────────────────────────────────
  'intellectual-property': ['intellectual-property', 'ip'],
  'trademark': ['trademark', 'intellectual-property'],
  'patent': ['patent', 'intellectual-property'],
  'copyright': ['copyright', 'intellectual-property'],
  'trade-dress': ['trade-dress', 'intellectual-property'],
  'licensing-agreements': ['licensing-agreements', 'intellectual-property'],
  'ip-litigation': ['ip-litigation', 'intellectual-property'],
  'software-ip': ['software-ip', 'intellectual-property'],

  // ── REAL ESTATE (10) ─────────────────────────────────────────────────────
  'real-estate-law': ['real-estate-law', 'real-estate'],
  'landlord-tenant': ['landlord-tenant', 'real-estate-law'],
  'foreclosure': ['foreclosure', 'real-estate-law'],
  'zoning-land-use': ['zoning-land-use', 'real-estate-law'],
  'construction-law': ['construction-law', 'real-estate-law'],
  'commercial-real-estate': ['commercial-real-estate', 'real-estate-law'],
  'title-disputes': ['title-disputes', 'real-estate-law'],
  'boundary-disputes': ['boundary-disputes', 'real-estate-law'],
  'hoa-disputes': ['hoa-disputes', 'real-estate-law'],
  'eminent-domain': ['eminent-domain', 'real-estate-law'],

  // ── IMMIGRATION (12) ─────────────────────────────────────────────────────
  'immigration-law': ['immigration-law', 'immigration'],
  'green-cards': ['green-cards', 'immigration-law'],
  'visa-applications': ['visa-applications', 'immigration-law'],
  'deportation-defense': ['deportation-defense', 'immigration-law'],
  'asylum': ['asylum', 'immigration-law'],
  'citizenship-naturalization': ['citizenship-naturalization', 'immigration-law'],
  'daca': ['daca', 'immigration-law'],
  'work-permits': ['work-permits', 'immigration-law'],
  'investor-visas': ['investor-visas', 'immigration-law'],
  'family-immigration': ['family-immigration', 'immigration-law'],
  'immigration-appeals': ['immigration-appeals', 'immigration-law'],
  'immigration-detention': ['immigration-detention', 'immigration-law'],

  // ── ESTATE PLANNING (10) ─────────────────────────────────────────────────
  'estate-planning': ['estate-planning'],
  'wills-trusts': ['wills-trusts', 'estate-planning', 'wills', 'trusts'],
  'probate': ['probate', 'estate-planning'],
  'elder-law': ['elder-law', 'estate-planning'],
  'guardianship': ['guardianship', 'estate-planning'],
  'living-trusts': ['living-trusts', 'wills-trusts', 'estate-planning'],
  'power-of-attorney': ['power-of-attorney', 'estate-planning'],
  'trust-administration': ['trust-administration', 'wills-trusts', 'estate-planning'],
  'estate-litigation': ['estate-litigation', 'estate-planning'],
  'medicaid-planning': ['medicaid-planning', 'elder-law', 'estate-planning'],

  // ── EMPLOYMENT (13) ──────────────────────────────────────────────────────
  'employment-law': ['employment-law', 'labor-law'],
  'wrongful-termination': ['wrongful-termination', 'employment-law'],
  'workplace-discrimination': ['workplace-discrimination', 'employment-law'],
  'sexual-harassment': ['sexual-harassment', 'employment-law'],
  'wage-hour-claims': ['wage-hour-claims', 'employment-law'],
  'fmla-violations': ['fmla-violations', 'employment-law'],
  'whistleblower': ['whistleblower', 'employment-law'],
  'non-compete-employment': ['non-compete-employment', 'employment-law'],
  'executive-compensation': ['executive-compensation', 'employment-law'],
  'workplace-injury': ['workplace-injury', 'employment-law'],
  'retaliation': ['retaliation', 'employment-law'],
  'unemployment-claims': ['unemployment-claims', 'employment-law'],
  'ada-violations': ['ada-violations', 'employment-law'],

  // ── BANKRUPTCY (7) ────────────────────────────────────────────────────────
  'bankruptcy': ['bankruptcy', 'debt'],
  'chapter-7-bankruptcy': ['chapter-7-bankruptcy', 'bankruptcy'],
  'chapter-13-bankruptcy': ['chapter-13-bankruptcy', 'bankruptcy'],
  'debt-relief': ['debt-relief', 'bankruptcy'],
  'business-bankruptcy': ['business-bankruptcy', 'bankruptcy'],
  'foreclosure-defense': ['foreclosure-defense', 'bankruptcy'],
  'student-loan-debt': ['student-loan-debt', 'bankruptcy'],

  // ── TAX (7) ───────────────────────────────────────────────────────────────
  'tax-law': ['tax-law'],
  'irs-disputes': ['irs-disputes', 'tax-law'],
  'tax-planning': ['tax-planning', 'tax-law'],
  'back-taxes': ['back-taxes', 'tax-law'],
  'tax-fraud-defense': ['tax-fraud-defense', 'tax-law'],
  'international-tax': ['international-tax', 'tax-law'],
  'estate-tax': ['estate-tax', 'tax-law'],

  // ── SPECIALIZED (23) ─────────────────────────────────────────────────────
  'entertainment-law': ['entertainment-law'],
  'environmental-law': ['environmental-law'],
  'health-care-law': ['health-care-law', 'healthcare-law'],
  'insurance-law': ['insurance-law'],
  'civil-rights': ['civil-rights'],
  'consumer-protection': ['consumer-protection'],
  'social-security-disability': ['social-security-disability', 'ssd', 'ssdi'],
  'veterans-benefits': ['veterans-benefits'],
  'class-action': ['class-action'],
  'appeals': ['appeals'],
  'mediation-arbitration': ['mediation-arbitration', 'mediation', 'arbitration', 'alternative-dispute-resolution'],
  'military-law': ['military-law'],
  'maritime-law': ['maritime-law', 'admiralty-law'],
  'aviation-law': ['aviation-law'],
  'sports-law': ['sports-law'],
  'cannabis-law': ['cannabis-law', 'marijuana-law'],
  'education-law': ['education-law'],
  'animal-law': ['animal-law'],
  'election-law': ['election-law'],
  'native-american-law': ['native-american-law', 'tribal-law'],
  'water-rights': ['water-rights'],
  'agricultural-law': ['agricultural-law'],
  'energy-law': ['energy-law'],
  'telecommunications-law': ['telecommunications-law'],
  'church-abuse': ['church-abuse'],
  // Subspecialties under specialized parents
  'insurance-bad-faith': ['insurance-bad-faith', 'insurance-law'],
  'lemon-law': ['lemon-law', 'consumer-protection'],
  'debt-collection-defense': ['debt-collection-defense', 'consumer-protection'],
  'military-defense': ['military-defense', 'military-law'],
  'nursing-license-defense': ['nursing-license-defense', 'health-care-law'],
  'medical-license-defense': ['medical-license-defense', 'health-care-law'],

  // ── GOVERNMENT & ADMINISTRATIVE (8) ───────────────────────────────────────
  'administrative-law': ['administrative-law', 'government-law'],
  'government-contracts': ['government-contracts', 'administrative-law'],
  'regulatory-compliance': ['regulatory-compliance', 'administrative-law'],
  'foia-requests': ['foia-requests', 'administrative-law'],
  'licensing-permits': ['licensing-permits', 'administrative-law'],
  'municipal-law': ['municipal-law', 'administrative-law'],
  'government-ethics': ['government-ethics', 'administrative-law'],
  'public-records': ['public-records', 'administrative-law'],

  // ── TECHNOLOGY & CYBER (7) ────────────────────────────────────────────────
  'cyber-law': ['cyber-law'],
  'data-privacy': ['data-privacy', 'cyber-law'],
  'ai-law': ['ai-law', 'cyber-law'],
  'cryptocurrency-law': ['cryptocurrency-law', 'cyber-law'],
  'internet-law': ['internet-law', 'cyber-law'],
  'e-commerce-law': ['e-commerce-law', 'cyber-law'],
  'social-media-law': ['social-media-law', 'cyber-law'],

  // ── PERSONAL & FAMILY ADDITIONAL (5) ──────────────────────────────────────
  'name-change': ['name-change'],
  'gender-marker-change': ['gender-marker-change', 'name-change'],
  'surrogacy-law': ['surrogacy-law'],
  'egg-donor-law': ['egg-donor-law', 'surrogacy-law'],
  'restraining-orders': ['restraining-orders'],
}

// Backward-compatible alias
export const SPECIALTY_TO_PRACTICE_AREAS = SPECIALTY_TO_BAR_CATEGORIES

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
      const specialties = SPECIALTY_TO_BAR_CATEGORIES[specialtySlug]
      if (!specialties || specialties.length === 0) return []

      const specialtyIds = await resolveSpecialtyIds(specialties)
      if (specialtyIds.length === 0) return []

      // STRICT RULE: ZIP-specific pages show ONLY providers
      // whose address_zip matches the exact ZIP code.
      if (postalCode) {
        return await retryWithBackoff(
          async () => {
            const { data, error } = await supabase
              .from('attorneys')
              .select(PROVIDER_LIST_SELECT)
              .in('primary_specialty_id', specialtyIds)
              .eq('address_zip', postalCode)
              .eq('is_active', true)
              .is('canonical_attorney_id', null)
              .order('is_featured', { ascending: false, nullsFirst: true })
              .order('boost_level', { ascending: false, nullsFirst: true })
              .order('phone', { ascending: false, nullsFirst: false })
              .order('is_verified', { ascending: false })
              .order('name')
              .range(offset, offset + limit - 1)
            if (error) throw error
            return asAttorneyListRows(data || [])
          },
          `getAttorneysByServiceAndLocation:postal(${specialtySlug}, ${postalCode})`,
        )
      }

      // ZIP slug (e.g., "10001-new-york-ny") — filter by address_zip
      if (isZipSlug(locationSlug)) {
        const zipCode = extractZipCode(locationSlug)
        try {
          return await retryWithBackoff(
            async () => {
              const { data, error } = await supabase
                .from('attorneys')
                .select(PROVIDER_LIST_SELECT)
                .in('primary_specialty_id', specialtyIds)
                .eq('address_zip', zipCode)
                .eq('is_active', true)
                .is('canonical_attorney_id', null)
                .order('is_featured', { ascending: false, nullsFirst: true })
              .order('boost_level', { ascending: false, nullsFirst: true })
              .order('phone', { ascending: false, nullsFirst: false })
                .order('is_verified', { ascending: false })
                .order('name')
                .range(offset, offset + limit - 1)
              if (error) throw error
              return asAttorneyListRows(data || [])
            },
            `getAttorneysByServiceAndLocation:zip(${specialtySlug}, ${zipCode})`,
          )
        } catch (err: unknown) {
          dbLogger.error(`[getAttorneysByServiceAndLocation] ZIP query FAILED for ${specialtySlug}/${locationSlug}:`, { error: err instanceof Error ? err.message : err })
          throw err
        }
      }

      // City slug — use static data for city name resolution
      const cityData = getCityBySlugImport(locationSlug)
      if (!cityData) return []

      const cityValues = [cityData.name]

      try {
        return await retryWithBackoff(
          async () => {
            // Primary: direct specialty + city (fast — uses index + .in())
            const { data: direct, error: directError } = await supabase
              .from('attorneys')
              .select(PROVIDER_LIST_SELECT)
              .in('primary_specialty_id', specialtyIds)
              .in('address_city', cityValues)
              .eq('is_active', true)
              .is('canonical_attorney_id', null)
              // STRICT RULE: providers with phone always rank above those without
              .order('is_featured', { ascending: false, nullsFirst: true })
              .order('boost_level', { ascending: false, nullsFirst: true })
              .order('phone', { ascending: false, nullsFirst: false })
              .order('is_verified', { ascending: false })
              .order('name')
              .range(offset, offset + limit - 1)

            if (directError) {
              dbLogger.warn(`[getAttorneysByServiceAndLocation] primary query error for ${specialtySlug}/${locationSlug}:`, { error: directError.message })
            }

            if (!directError && direct && direct.length > 0) return asAttorneyListRows(direct)

            return []
          },
          `getAttorneysByServiceAndLocation(${specialtySlug}, ${locationSlug})`,
        )
      } catch (err: unknown) {
        // Re-throw so ISR keeps stale cached page instead of caching empty results.
        // Page component catches this and renders gracefully on first cold visit.
        dbLogger.error(`[getAttorneysByServiceAndLocation] FAILED for ${specialtySlug}/${locationSlug}:`, { error: err instanceof Error ? err.message : err })
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
  return getCachedData(
    `has-providers:svc-loc:${specialtySlug}:${locationSlug}`,
    async () => {
      try {
        return await retryWithBackoff(
          async () => {
            const specialties = SPECIALTY_TO_BAR_CATEGORIES[specialtySlug]
            if (!specialties || specialties.length === 0) return false

            const specialtyIds = await resolveSpecialtyIds(specialties)
            if (specialtyIds.length === 0) return false

            // ZIP slug — filter by address_zip
            if (isZipSlug(locationSlug)) {
              const zipCode = extractZipCode(locationSlug)
              const { count, error } = await supabase
                .from('attorneys')
                .select('id', { count: 'exact', head: true })
                .in('primary_specialty_id', specialtyIds)
                .eq('address_zip', zipCode)
                .eq('is_active', true)
                .is('canonical_attorney_id', null)
              if (error) throw error
              return (count ?? 0) > 0
            }

            const cityLookup = getCityBySlugImport(locationSlug)
            const cityName = cityLookup?.name
            if (!cityName) return false

            const cityValues = [cityName]
            const { count, error } = await supabase
              .from('attorneys')
              .select('id', { count: 'exact', head: true })
              .in('primary_specialty_id', specialtyIds)
              .in('address_city', cityValues)
              .eq('is_active', true)
              .is('canonical_attorney_id', null)

            if (error) throw error
            return (count ?? 0) > 0
          },
          `hasProvidersByServiceAndLocation(${specialtySlug}, ${locationSlug})`,
        )
      } catch (err: unknown) {
        // On any failure, conservatively return false (noindex)
        dbLogger.error(`[hasProvidersByServiceAndLocation] failed for ${specialtySlug}/${locationSlug}`, err)
        return false
      }
    },
    CACHE_TTL.attorneys,
  )
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
            const specialties = SPECIALTY_TO_BAR_CATEGORIES[specialtySlug]
            if (!specialties || specialties.length === 0) return 0

            const specialtyIds = await resolveSpecialtyIds(specialties)
            if (specialtyIds.length === 0) return 0

            // ZIP slug — filter by address_zip
            if (isZipSlug(locationSlug)) {
              const zipCode = extractZipCode(locationSlug)
              const { count, error } = await supabase
                .from('attorneys')
                .select('id', { count: 'exact', head: true })
                .in('primary_specialty_id', specialtyIds)
                .eq('address_zip', zipCode)
                .eq('is_active', true)
                .is('canonical_attorney_id', null)
              if (error) throw error
              return count ?? 0
            }

            const cityLookup = getCityBySlugImport(locationSlug)
            const cityName = cityLookup?.name
            if (!cityName) return 0

            const cityValues = [cityName]
            const { count, error } = await supabase
              .from('attorneys')
              .select('id', { count: 'exact', head: true })
              .in('primary_specialty_id', specialtyIds)
              .in('address_city', cityValues)
              .eq('is_active', true)
              .is('canonical_attorney_id', null)

            if (error) throw error
            return count ?? 0
          },
          `getAttorneyCountByServiceAndLocation(${specialtySlug}, ${locationSlug})`,
        )
      } catch (err: unknown) {
        dbLogger.error(`[getAttorneyCountByServiceAndLocation] failed for ${specialtySlug}/${locationSlug}`, err)
        return 0
      }
    },
    CACHE_TTL.attorneys, // 3600s (1h)
  )
}

export async function getAttorneysByLocation(locationSlug: string) {
  if (IS_BUILD) return [] // Skip during build

  // ZIP slug — filter by address_zip
  if (isZipSlug(locationSlug)) {
    const zipCode = extractZipCode(locationSlug)
    return getCachedData(
      `attorneys:location:zip:${zipCode}`,
      async () => {
        try {
          return await retryWithBackoff(
            async () => {
              const { data, error } = await supabase
                .from('attorneys')
                .select(PROVIDER_LIST_SELECT)
                .eq('address_zip', zipCode)
                .eq('is_active', true)
                .is('canonical_attorney_id', null)
                .order('is_featured', { ascending: false, nullsFirst: true })
                .order('boost_level', { ascending: false, nullsFirst: true })
                .order('phone', { ascending: false, nullsFirst: false })
                .order('is_verified', { ascending: false })
                .order('name')
                .limit(500)
              if (error) throw error
              return asAttorneyListRows(data || [])
            },
            `getAttorneysByLocation:zip(${zipCode})`,
          )
        } catch (err: unknown) {
          dbLogger.error(`[getAttorneysByLocation] ZIP FAILED for ${locationSlug}:`, { error: err instanceof Error ? err.message : err })
          throw err
        }
      },
      CACHE_TTL.attorneys,
      { skipNull: true },
    )
  }

  // City slug — use static data for city name resolution
  const cityLookup = getCityBySlugImport(locationSlug)
  if (!cityLookup) return []

  return getCachedData(
    `attorneys:location:${locationSlug}`,
    async () => {
      const cityValues = [cityLookup.name]
      try {
        return await retryWithBackoff(
          async () => {
            const { data, error } = await supabase
              .from('attorneys')
              .select(PROVIDER_LIST_SELECT)
              .in('address_city', cityValues)
              .eq('is_active', true)
              .is('canonical_attorney_id', null)
              .order('is_featured', { ascending: false, nullsFirst: true })
              .order('boost_level', { ascending: false, nullsFirst: true })
              .order('phone', { ascending: false, nullsFirst: false })
              .order('is_verified', { ascending: false })
              .order('name')
              .limit(500)

            if (error) throw error
            return asAttorneyListRows(data || [])
          },
          `getAttorneysByLocation(${locationSlug})`,
        )
      } catch (err: unknown) {
        dbLogger.error(`[getAttorneysByLocation] FAILED for ${locationSlug}:`, { error: err instanceof Error ? err.message : err })
        throw err
      }
    },
    CACHE_TTL.attorneys,
    { skipNull: true },
  )
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
            .is('canonical_attorney_id', null)
            .order('is_featured', { ascending: false, nullsFirst: true })
            .order('boost_level', { ascending: false, nullsFirst: true })
            .order('phone', { ascending: false, nullsFirst: false })
            .order('is_verified', { ascending: false })
            .order('name')
            .limit(1000)

          if (error) throw error
          return asAttorneyListRows(data || [])
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

  const specialties = SPECIALTY_TO_BAR_CATEGORIES[specialtySlug]
  if (!specialties || specialties.length === 0) return []

  const specialtyIds = await resolveSpecialtyIds(specialties)
  if (specialtyIds.length === 0) return []

  const effectiveLimit = limit || 50
  return getCachedData(
    generateCacheKey('attorneys:service', { slug: specialtySlug, limit: effectiveLimit }),
    async () => {
      try {
        return await withTimeout(
          (async () => {
            const { data, error } = await supabase
              .from('attorneys')
              .select(PROVIDER_LIST_SELECT)
              .in('primary_specialty_id', specialtyIds)
              .eq('is_active', true)
              .is('canonical_attorney_id', null)
              .order('is_featured', { ascending: false, nullsFirst: true })
              .order('boost_level', { ascending: false, nullsFirst: true })
              .order('phone', { ascending: false, nullsFirst: false })
              .order('is_verified', { ascending: false })
              .limit(effectiveLimit)

            if (error) throw error
            return asAttorneyListRows(data || [])
          })(),
          QUERY_TIMEOUT_MS,
          `getAttorneysByService(${specialtySlug})`,
        )
      } catch (err: unknown) {
        dbLogger.error(`[getAttorneysByService] failed for specialty="${specialtySlug}"`, err)
        return []
      }
    },
    CACHE_TTL.attorneys,
    { skipNull: true },
  )
}

export async function getAttorneyCountByService(specialtySlug: string): Promise<number> {
  if (IS_BUILD) return 0
  const specialties = SPECIALTY_TO_BAR_CATEGORIES[specialtySlug]
  if (!specialties || specialties.length === 0) return 0
  const specialtyIds = await resolveSpecialtyIds(specialties)
  if (specialtyIds.length === 0) return 0
  return getCachedData(
    `attorney-count:service:${specialtySlug}`,
    async () => {
      try {
        return await withTimeout(
          (async () => {
            const { count, error } = await supabase
              .from('attorneys')
              .select('id', { count: 'exact', head: true })
              .in('primary_specialty_id', specialtyIds)
              .eq('is_active', true)
              .is('canonical_attorney_id', null)
            if (error) throw error
            return count ?? 0
          })(),
          QUERY_TIMEOUT_MS,
          `getAttorneyCountByService(${specialtySlug})`,
        )
      } catch (err: unknown) {
        dbLogger.error(`[getAttorneyCountByService] failed for specialty="${specialtySlug}"`, err)
        return 0
      }
    },
    CACHE_TTL.attorneys,
  )
}

// ============================================================================
// FULL-TEXT SEARCH + GEO-RADIUS SEARCH
// Uses search_vector tsvector (GIN-indexed) from migration 400
// Weights: A=name, B=firm_name, C=description+city, D=bio
// ============================================================================

export interface SearchFilters {
  q?: string
  specialty?: string
  state?: string
  city?: string
  rating_min?: number
  lat?: number
  lng?: number
  radius_miles?: number
  sort?: 'relevance' | 'distance' | 'rating'
  page?: number
  limit?: number
}

export interface SearchResult {
  attorneys: AttorneyListRow[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

/**
 * Unified full-text search for attorneys.
 * Combines tsvector search (search_vector) with geo-distance and filters.
 *
 * For full-text: uses plainto_tsquery to safely parse user input,
 * then ts_rank for relevance scoring with weights.
 *
 * For geo: uses PostGIS ST_DWithin for radius filtering and
 * ST_Distance for distance sorting.
 *
 * Falls back to RPC for combined full-text + geo queries since
 * Supabase JS client cannot do ts_rank ordering natively.
 */
export async function searchAttorneys(filters: SearchFilters): Promise<SearchResult> {
  if (IS_BUILD) return { attorneys: [], total: 0, page: 1, limit: 20, has_more: false }

  const page = Math.max(1, filters.page || 1)
  const limit = Math.min(100, Math.max(1, filters.limit || 20))
  const offset = (page - 1) * limit

  const cacheKey = generateCacheKey('search:attorneys', {
    q: filters.q || '',
    specialty: filters.specialty || '',
    state: filters.state || '',
    city: filters.city || '',
    rating_min: filters.rating_min || 0,
    lat: filters.lat || '',
    lng: filters.lng || '',
    radius: filters.radius_miles || '',
    sort: filters.sort || 'relevance',
    page,
    limit,
  })

  return getCachedData(
    cacheKey,
    async () => {
      return retryWithBackoff(
        async () => {
          const hasTextQuery = !!(filters.q && filters.q.trim().length >= 2)
          const hasGeoQuery = !!(filters.lat && filters.lng)

          // If we have text search OR geo query, use the RPC function for
          // ts_rank / ST_Distance ordering (not possible via PostgREST)
          if (hasTextQuery || hasGeoQuery) {
            return _searchWithRPC(filters, page, limit, offset)
          }

          // Simple filter-only query (no text, no geo) — use PostgREST
          return _searchWithPostgREST(filters, page, limit, offset)
        },
        'searchAttorneys',
      )
    },
    CACHE_TTL.attorneys,
    { skipNull: true },
  )
}

/**
 * Search via RPC for full-text + geo queries.
 * Calls the search_attorneys_v1 function created in migration.
 * Falls back to PostgREST with textSearch if RPC is unavailable.
 */
async function _searchWithRPC(
  filters: SearchFilters,
  page: number,
  limit: number,
  offset: number,
): Promise<SearchResult> {
  const { q, specialty, state, city, rating_min, lat, lng, radius_miles, sort } = filters

  // Resolve specialty slugs to IDs if provided
  let specialtyIds: string[] = []
  if (specialty) {
    const slugs = SPECIALTY_TO_BAR_CATEGORIES[specialty]
    if (slugs && slugs.length > 0) {
      specialtyIds = await resolveSpecialtyIds(slugs)
    }
  }

  // Try RPC first (server-side function for combined search)
  try {
    const { data, error } = await supabase.rpc('search_attorneys_v1', {
      search_query: q?.trim() || null,
      filter_specialty_ids: specialtyIds.length > 0 ? specialtyIds : null,
      filter_state: state?.toUpperCase() || null,
      filter_city: city || null,
      filter_rating_min: rating_min || null,
      geo_lat: lat || null,
      geo_lng: lng || null,
      geo_radius_miles: radius_miles || null,
      sort_by: sort || 'relevance',
      result_limit: limit,
      result_offset: offset,
    })

    if (error) throw error

    const rows = (data || []) as Array<AttorneyListRow & { total_count?: number }>
    const total = rows.length > 0 && rows[0].total_count ? Number(rows[0].total_count) : rows.length

    return {
      attorneys: rows.map(r => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { total_count: _tc, ...rest } = r as unknown as Record<string, unknown>
        return rest as unknown as AttorneyListRow
      }),
      total,
      page,
      limit,
      has_more: offset + rows.length < total,
    }
  } catch (rpcError) {
    dbLogger.warn('[searchAttorneys] RPC search_attorneys_v1 failed, falling back to PostgREST', {
      error: rpcError instanceof Error ? rpcError.message : rpcError,
    })
    // Fallback: use PostgREST textSearch
    return _searchWithPostgRESTTextSearch(filters, page, limit, offset)
  }
}

/**
 * Fallback: PostgREST with .textSearch() on search_vector.
 * No ts_rank ordering (PostgREST limitation) but still uses the GIN index.
 */
async function _searchWithPostgRESTTextSearch(
  filters: SearchFilters,
  page: number,
  limit: number,
  offset: number,
): Promise<SearchResult> {
  let query = supabase
    .from('attorneys')
    .select(PROVIDER_LIST_SELECT, { count: 'exact' })
    .eq('is_active', true)
    .is('canonical_attorney_id', null)

  // Full-text search using textSearch (uses the GIN index on search_vector)
  if (filters.q && filters.q.trim().length >= 2) {
    // Convert user input to safe tsquery tokens
    const sanitized = filters.q.trim().replace(/[^a-zA-Z0-9\s'-]/g, '')
    if (sanitized) {
      query = query.textSearch('search_vector', sanitized, { type: 'plain', config: 'english' })
    }
  }

  // Apply filters
  if (filters.specialty) {
    const slugs = SPECIALTY_TO_BAR_CATEGORIES[filters.specialty]
    if (slugs && slugs.length > 0) {
      const ids = await resolveSpecialtyIds(slugs)
      if (ids.length > 0) {
        query = query.in('primary_specialty_id', ids)
      }
    }
  }

  if (filters.state) {
    query = query.eq('address_state', filters.state.toUpperCase())
  }

  if (filters.city) {
    query = query.ilike('address_city', filters.city)
  }

  if (filters.rating_min && filters.rating_min > 0) {
    query = query.gte('rating_average', filters.rating_min)
  }

  // Ordering: best available without RPC
  if (filters.sort === 'rating') {
    query = query.order('rating_average', { ascending: false, nullsFirst: false })
  } else {
    query = query.order('is_featured', { ascending: false, nullsFirst: true })
    query = query.order('boost_level', { ascending: false, nullsFirst: true })
    query = query.order('rating_average', { ascending: false, nullsFirst: false })
  }
  query = query.order('name')

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw error

  const total = count ?? 0
  return {
    attorneys: asAttorneyListRows(data || []),
    total,
    page,
    limit,
    has_more: offset + (data?.length ?? 0) < total,
  }
}

/**
 * Simple filter-only search (no text, no geo) — pure PostgREST.
 */
async function _searchWithPostgREST(
  filters: SearchFilters,
  page: number,
  limit: number,
  offset: number,
): Promise<SearchResult> {
  let query = supabase
    .from('attorneys')
    .select(PROVIDER_LIST_SELECT, { count: 'exact' })
    .eq('is_active', true)
    .is('canonical_attorney_id', null)

  if (filters.specialty) {
    const slugs = SPECIALTY_TO_BAR_CATEGORIES[filters.specialty]
    if (slugs && slugs.length > 0) {
      const ids = await resolveSpecialtyIds(slugs)
      if (ids.length > 0) {
        query = query.in('primary_specialty_id', ids)
      }
    }
  }

  if (filters.state) {
    query = query.eq('address_state', filters.state.toUpperCase())
  }

  if (filters.city) {
    query = query.ilike('address_city', filters.city)
  }

  if (filters.rating_min && filters.rating_min > 0) {
    query = query.gte('rating_average', filters.rating_min)
  }

  // Default ordering
  if (filters.sort === 'rating') {
    query = query.order('rating_average', { ascending: false, nullsFirst: false })
  } else {
    query = query.order('is_featured', { ascending: false, nullsFirst: true })
    query = query.order('boost_level', { ascending: false, nullsFirst: true })
    query = query.order('phone', { ascending: false, nullsFirst: false })
    query = query.order('is_verified', { ascending: false })
  }
  query = query.order('name')

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw error

  const total = count ?? 0
  return {
    attorneys: asAttorneyListRows(data || []),
    total,
    page,
    limit,
    has_more: offset + (data?.length ?? 0) < total,
  }
}

/**
 * Geo-radius search: find attorneys within a given radius of a point.
 * Uses PostGIS ST_DWithin on the `geo` GEOGRAPHY(POINT) column.
 * Results sorted by distance (closest first).
 */
export async function searchAttorneysByRadius(
  lat: number,
  lng: number,
  radiusMiles: number,
  filters: Omit<SearchFilters, 'lat' | 'lng' | 'radius_miles'> = {},
): Promise<SearchResult> {
  return searchAttorneys({
    ...filters,
    lat,
    lng,
    radius_miles: radiusMiles,
    sort: filters.sort || 'distance',
  })
}

export async function getLocationsByService(specialtySlug: string) {
  if (IS_BUILD) return [] // Skip during build

  const specialties = SPECIALTY_TO_BAR_CATEGORIES[specialtySlug]
  if (!specialties || specialties.length === 0) return []

  const specialtyIds = await resolveSpecialtyIds(specialties)
  if (specialtyIds.length === 0) return []

  return getCachedData(
    `locations:service:${specialtySlug}`,
    async () => {
      return retryWithBackoff(
        async () => {
          // Step 1: get distinct cities from active providers with this specialty
          const { data: providerCities, error: citiesError } = await supabase
            .from('attorneys')
            .select('address_city')
            .in('primary_specialty_id', specialtyIds)
            .eq('is_active', true)
            .is('canonical_attorney_id', null)
            .not('address_city', 'is', null)
            .limit(500)

          if (citiesError) throw citiesError
          if (!providerCities || providerCities.length === 0) return []

          const uniqueCityNames = Array.from(new Set(
            providerCities.map(p => p.address_city).filter(Boolean)
          )) as string[]

          // Step 2: look up location data (slug, state, region) for those cities
          const { data: locations, error: locationsError } = await supabase
            .from('locations_us')
            .select('id, name, slug, state:states!state_id(abbreviation, region)')
            .in('name', uniqueCityNames.slice(0, 200))
            .order('population', { ascending: false })
            .limit(100)

          if (locationsError) throw locationsError

          return (locations || []).map(c => {
            const state = unwrapJoin(c.state) as StateJoinRow | null
            return {
              id: c.id,
              name: c.name,
              slug: c.slug,
              department_code: state?.abbreviation ?? undefined,
              region_name: state?.region ?? undefined,
            }
          })
        },
        `getLocationsByService(${specialtySlug})`,
      )
    },
    CACHE_TTL.locations,
    { skipNull: true },
  )
}

/**
 * Get similar attorneys matching by primary specialty and state/city.
 * Used by the SimilarAttorneys server component for internal linking.
 * Returns attorneys with same specialty, preferring same city/state, sorted by rating.
 */
export async function getSimilarAttorneys(
  attorneyId: string,
  specialtyName: string,
  stateCode?: string | null,
  limit: number = 6,
): Promise<Array<{
  id: string
  stable_id: string | null
  slug: string | null
  name: string
  specialty: string
  rating: number
  reviews: number
  city: string
  is_verified: boolean
}>> {
  if (IS_BUILD) return []

  return getCachedData(
    generateCacheKey('similar-attorneys', { attorneyId, specialtyName, stateCode: stateCode || '', limit: String(limit) }),
    async () => {
      try {
        // Resolve specialty name to ID
        let specialtyId: string | null = null
        if (specialtyName) {
          const { data: specData } = await supabase
            .from('specialties')
            .select('id')
            .eq('name', specialtyName)
            .limit(1)
            .single()
          specialtyId = specData?.id ?? null
        }

        let query = supabase
          .from('attorneys')
          .select('id, stable_id, slug, name, primary_specialty_id, rating_average, review_count, address_city, is_verified, phone, specialty:specialties!primary_specialty_id(slug,name)')
          .eq('is_active', true)
          .neq('id', attorneyId)
          .is('canonical_attorney_id', null)
          .order('phone', { ascending: false, nullsFirst: false })
          .order('rating_average', { ascending: false, nullsFirst: false })
          .limit(limit)

        if (specialtyId) {
          query = query.eq('primary_specialty_id', specialtyId)
        }

        // Prefer same state
        if (stateCode) {
          query = query.eq('address_state', stateCode)
        }

        const { data } = await query

        return ((data || []) as Array<{
          id: string
          stable_id: string | null
          slug: string | null
          name: string | null
          specialty: { slug: string; name: string } | { slug: string; name: string }[] | null
          primary_specialty_id: string | null
          rating_average: number | null
          review_count: number | null
          address_city: string | null
          is_verified: boolean | null
        }>).map((p) => {
          const spec = Array.isArray(p.specialty) ? p.specialty[0] ?? null : p.specialty
          return {
            id: p.id,
            stable_id: p.stable_id,
            slug: p.slug,
            name: p.name || 'Attorney',
            specialty: spec?.name || specialtyName,
            rating: p.rating_average || 0,
            reviews: p.review_count || 0,
            city: p.address_city || '',
            is_verified: p.is_verified || false,
          }
        })
      } catch {
        return []
      }
    },
    CACHE_TTL.attorneys, // 3600s (1h)
  )
}
