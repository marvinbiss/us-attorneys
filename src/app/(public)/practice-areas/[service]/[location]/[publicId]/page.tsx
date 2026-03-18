import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getAttorneyByStableId, getAttorneyBySlug, getAttorneyById, getSpecialtyBySlug, getLocationBySlug, getAttorneyCountByServiceAndLocation } from '@/lib/supabase'
import { getAttorneyUrl } from '@/lib/utils'
import AttorneyPageClient from '@/components/attorney/AttorneyPageClient'
import AttorneyInternalLinks from '@/components/attorney/AttorneyInternalLinks'
import { Review } from '@/components/attorney'
import type { LegacyAttorney } from '@/types/legacy'
import type { Service, Location } from '@/types'
import { getServiceImage } from '@/lib/data/images'

/** Raw provider row from select('*') — includes all DB columns the mapper reads */
interface ProviderRecord {
  id: string
  stable_id?: string | null
  slug?: string | null
  name?: string | null
  business_name?: string | null
  first_name?: string | null
  last_name?: string | null
  specialty?: { slug: string; name: string } | null
  description?: string | null
  bio?: string | null
  address_line1?: string | null
  address_city?: string | null
  address_zip?: string | null
  address_state?: string | null
  is_verified?: boolean | null
  is_active?: boolean | null
  is_center?: boolean | null
  noindex?: boolean | null
  rating_average?: number | null
  average_rating?: number | null
  review_count?: number | null
  team_size?: number | null
  available_24h?: boolean | null
  accepts_new_clients?: boolean | null
  free_quote?: boolean | null
  phone?: string | null
  phone_secondary?: string | null
  email?: string | null
  website?: string | null
  bar_number?: string | null
  creation_date?: string | null
  latitude?: number | null
  longitude?: number | null
  opening_hours?: Record<string, { ouvert: boolean; debut: string; fin: string }> | null
  intervention_radius_km?: number | null
  services_offered?: string[] | null
  service_prices?: Array<{ name: string; description?: string; price: string; duration?: string }> | null
  faq?: Array<{ question: string; answer: string }> | null
  created_at?: string | null
  updated_at?: string | null
  user_id?: string | null
  trust_score?: number | null
  trust_score_breakdown?: Record<string, number> | null
  endorsement_count?: number | null
}
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import { SITE_URL } from '@/lib/seo/config'
import { hashCode } from '@/lib/seo/location-content'
import { getNeighborhoodBySlug, practiceAreas as staticPracticeAreas, getStateByCode } from '@/lib/data/usa'
import ServiceQuartierPage from './ServiceQuartierPage'
import dynamic from 'next/dynamic'
import { REVALIDATE } from '@/lib/cache'

const EstimationWidget = dynamic(
  () => import('@/components/estimation/EstimationWidget'),
  { ssr: false }
)

export const revalidate = REVALIDATE.attorneyProfile

// All ISR — parent route already has seeds (dynamicParams = true)
export function generateStaticParams() {
  return []
}
export const dynamicParams = true

interface PageProps {
  params: Promise<{
    service: string
    location: string
    publicId: string
  }>
}

// Convert provider data to LegacyAttorney format (sub-components still read legacy fields)
function convertToAttorney(provider: ProviderRecord, service: Service | null, location: Location | null, specialtySlug: string): LegacyAttorney {
  const specialty = service?.name || provider.specialty?.name || 'Attorney'
  const city = location?.name || provider.address_city || ''
  const name = provider.name || provider.business_name || 'Attorney'

  // Generate description if missing or too short (WITHOUT fake ratings)
  const existingDesc = provider.description || provider.bio
  const description = (existingDesc && existingDesc.length > 50)
    ? existingDesc
    : generateDescription(name, specialty, city || 'your area', provider, specialtySlug)

  // Only show member_since if it's a meaningful past year.
  // Providers imported in the current year (e.g. 2026 bulk import) would show
  // "Inscrit depuis 2026" which is not informative.
  const memberYear = provider.created_at ? new Date(provider.created_at).getFullYear() : null
  const currentYear = new Date().getFullYear()

  return {
    id: provider.id,
    stable_id: provider.stable_id || undefined,
    slug: provider.slug || undefined,
    business_name: name,
    first_name: provider.first_name || null,
    last_name: provider.last_name || null,
    city: city,
    postal_code: String(location?.postal_code || provider.address_zip || '').replace(/\.0$/, ''),
    address: provider.address_line1 || '',
    department: location?.department_name || undefined,
    department_code: location?.department_code || undefined,
    region: location?.region_name || undefined,
    specialty: specialty,
    specialty_slug: specialtySlug,
    city_slug: location?.slug || undefined,
    description: description,
    bio: provider.bio || undefined,
    average_rating: provider.rating_average || provider.average_rating || 0,
    review_count: provider.review_count || 0,
    is_verified: provider.is_verified || false,
    is_center: provider.is_center || false,
    team_size: provider.team_size || undefined,
    services: provider.services_offered || [],
    service_prices: (provider.service_prices && provider.service_prices.length > 0)
      ? provider.service_prices.map(sp => ({ name: sp.name, description: sp.description || '', price: sp.price, duration: sp.duration }))
      : [],
    prices_are_estimated: false,
    accepts_new_clients: provider.accepts_new_clients === true ? true : undefined,
    free_quote: provider.free_quote === true ? true : undefined,
    available_24h: provider.available_24h || false,
    phone_secondary: provider.phone_secondary || undefined,
    opening_hours: provider.opening_hours && Object.keys(provider.opening_hours).length > 0 ? provider.opening_hours : undefined,
    intervention_radius_km: provider.intervention_radius_km || undefined,
    member_since: (memberYear && memberYear < currentYear) ? memberYear.toString() : undefined,
    bar_number: provider.bar_number || undefined,
    phone: provider.phone || undefined,
    email: provider.email || undefined,
    website: provider.website || undefined,
    latitude: provider.latitude || undefined,
    longitude: provider.longitude || undefined,
    faq: (provider.faq && provider.faq.length > 0) ? provider.faq : undefined,
    updated_at: provider.updated_at || undefined,
    // Legacy fields — undefined at runtime (columns dropped), kept for sub-component compat
    // Will be removed when each sub-component migrates to v2 Artisan type
  }
}

// Generate a rich, unique description based on all available provider data
function generateDescription(name: string, specialty: string, city: string, provider?: ProviderRecord | null, specialtySlug?: string): string {
  const spe = specialty.toLowerCase()
  const parts: string[] = []

  // Hash-varied intro templates to reduce duplicate content across similar profiles
  const introKey = `desc-${provider?.stable_id || provider?.slug || provider?.id || name}-${specialtySlug || spe}`
  const introHash = hashCode(introKey)
  const introTemplates = [
    `${name} is a professional specializing in ${spe} in ${city}.`,
    `Based in ${city}, ${name} serves clients in ${spe} for individuals and businesses.`,
    `${name} offers ${spe} services in ${city} and surrounding areas.`,
    `A ${spe} professional, ${name} practices in ${city} serving a local clientele.`,
    `In ${city}, ${name} brings expertise in ${spe} to serve your needs.`,
  ]
  parts.push(introTemplates[introHash % introTemplates.length])

  // Company history and experience
  if (provider?.creation_date) {
    const year = new Date(provider.creation_date).getFullYear()
    const age = new Date().getFullYear() - year
    if (age > 1) {
      parts.push(`Founded in ${year}, the firm has over ${age} years of presence in the region.`)
    }
  }

  // Verification
  if (provider?.bar_number) {
    parts.push(`Registered and verified attorney (Bar # ${provider.bar_number}).`)
  }

  // Rating
  const rating = provider?.rating_average || provider?.average_rating
  if (rating && rating >= 4) {
    parts.push(`Rated ${Number(rating).toFixed(1)}/5 by clients.`)
  }

  // Zone d'intervention
  parts.push(`Service area: ${city} and surrounding cities.`)

  // CTA
  parts.push(`Contact ${name} for a free, personalized consultation with no obligation.`)

  // Freshness / E-E-A-T: signal that content is data-derived
  parts.push('Information based on declared professional data.')

  return parts.join(' ')
}

/** Row shape from the similar-attorneys lightweight query */
interface SimilarAttorneyRow {
  id: string
  stable_id: string | null
  slug: string | null
  name: string | null
  specialty: { slug: string; name: string } | null
  primary_specialty_id: string | null
  rating_average: number | null
  review_count: number | null
  address_city: string | null
  is_verified: boolean | null
}

/** Row shape from the reviews query */
interface ReviewRow {
  id: string
  rating: number
  comment: string | null
  created_at: string
  client_name: string | null
  has_media: boolean | null
}

// Fetch similar attorneys (same specialty, same department)
async function getSimilarAttorneys(attorneyId: string, specialty: string, postalCode?: string) {
  try {
    const { supabase } = await import('@/lib/supabase')
    const deptCode = postalCode && postalCode.length >= 2 ? postalCode.substring(0, 2) : null

    // Resolve specialty name to ID for filtering
    let specialtyId: string | null = null
    if (specialty) {
      const { data: specData } = await supabase
        .from('specialties')
        .select('id')
        .eq('name', specialty)
        .limit(1)
        .single()
      specialtyId = specData?.id ?? null
    }

    let query = supabase
      .from('attorneys')
      .select('id, stable_id, slug, name, primary_specialty_id, rating_average, review_count, address_city, is_verified, phone, specialty:specialties!primary_specialty_id(slug,name)')
      .eq('is_active', true)
      .neq('id', attorneyId)
      .order('phone', { ascending: false, nullsFirst: false })
      .order('rating_average', { ascending: false, nullsFirst: false })
      .limit(8)

    // Match exact specialty by primary_specialty_id
    if (specialtyId) {
      query = query.eq('primary_specialty_id', specialtyId)
    }

    // Prefer same department
    if (deptCode) {
      query = query.like('address_zip', `${deptCode}%`)
    }

    const { data } = await query

    return ((data || []) as unknown as SimilarAttorneyRow[]).map((p) => {
      return {
        id: p.id,
        stable_id: p.stable_id || undefined,
        slug: p.slug || undefined,
        name: p.name || 'Attorney',
        specialty: p.specialty?.name || specialty,
        rating: p.rating_average || 0,
        reviews: p.review_count || 0,
        city: p.address_city || '',
        is_verified: p.is_verified || false,
      }
    })
  } catch {
    return []
  }
}

// Fetch attorney's specialties for endorsement form
async function getAttorneySpecialtiesList(attorneyId: string): Promise<Array<{ id: string; name: string; slug: string }>> {
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data } = await supabase
      .from('attorney_specialties')
      .select('specialty:specialty_id (id, name, slug)')
      .eq('attorney_id', attorneyId)
      .limit(20)

    if (!data || data.length === 0) return []
    // Supabase returns joined rows; cast via unknown for safety
    const rows = data as unknown as Array<{ specialty: { id: string; name: string; slug: string } | null }>
    return rows
      .filter((d) => d.specialty !== null)
      .map((d) => d.specialty!)
  } catch {
    return []
  }
}

// Fetch reviews for provider (only real reviews from database)
async function getAttorneyReviews(attorneyId: string, specialtyName?: string): Promise<Review[]> {
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data: reviews } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        client_name,
        has_media
      `)
      .eq('attorney_id', attorneyId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(100) // Increased limit to show more reviews

    if (reviews && reviews.length > 0) {
      return (reviews as ReviewRow[]).map((r) => ({
        id: r.id,
        author: r.client_name || 'Client',
        rating: r.rating,
        date: new Date(r.created_at).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        comment: r.comment || '',
        dateISO: r.created_at ? r.created_at.split('T')[0] : undefined,
        service: specialtyName || '',
        verified: false,
        hasPhoto: r.has_media || false,
      }))
    }

    // No fake reviews! Return empty array if no real reviews in database
    return []
  } catch {
    // On error, return empty array (no fake reviews!)
    return []
  }
}

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { service: specialtySlug, location: locationSlug, publicId } = await params

  // ─── QUARTIER DETECTION ──────────────────────────────────
  const quartierMatch = getNeighborhoodBySlug(locationSlug, publicId)
  if (quartierMatch) {
    const { city: cityData, neighborhoodName: quartierName } = quartierMatch
    const staticSvc = staticPracticeAreas.find(s => s.slug === specialtySlug)
    if (!staticSvc) return { title: 'Not Found', robots: { index: false, follow: false } }

    const svcLower = staticSvc.name.toLowerCase()
    let attorneyCount = 0
    try { attorneyCount = await getAttorneyCountByServiceAndLocation(specialtySlug, locationSlug) } catch { /* best-effort */ }
    const hasProviders = attorneyCount > 0

    const tHash = Math.abs(hashCode(`sq-title-${specialtySlug}-${locationSlug}-${publicId}`))
    const titleTemplates = hasProviders
      ? [
          `${staticSvc.name} in ${quartierName}, ${cityData.name} — ${attorneyCount} pros`,
          `${attorneyCount} ${svcLower}s in ${quartierName} (${cityData.name})`,
          `${staticSvc.name} ${quartierName} ${cityData.name}: free consultation`,
          `Find a ${svcLower} in ${quartierName}, ${cityData.name}`,
        ]
      : [
          `${staticSvc.name} in ${quartierName}, ${cityData.name} — Free Consultation`,
          `${svcLower} in ${quartierName} (${cityData.name}): verified attorneys`,
          `Find a ${svcLower} in ${quartierName}, ${cityData.name}`,
        ]
    const title = truncateTitle(titleTemplates[tHash % titleTemplates.length])

    const dHash = Math.abs(hashCode(`sq-desc-${specialtySlug}-${locationSlug}-${publicId}`))
    const descTemplates = hasProviders
      ? [
          `${attorneyCount} verified ${svcLower}s in ${quartierName}, ${cityData.name} (${cityData.stateCode}). Free consultation in ${getStateByCode(cityData.stateCode)?.region || ''}.`,
          `Compare ${svcLower}s in ${quartierName} (${cityData.name}). ${attorneyCount} bar-verified attorneys. Free consultation.`,
        ]
      : [
          `Find a qualified ${svcLower} in ${quartierName}, ${cityData.name} (${cityData.stateCode}). Verified attorneys, free consultation.`,
          `${svcLower} in ${quartierName} (${cityData.name}): directory of verified attorneys in ${getStateByCode(cityData.stateCode)?.region || ''}. Free consultation.`,
        ]
    const description = descTemplates[dHash % descTemplates.length]

    return {
      title,
      description,
      // All service x neighborhood pages indexed — rich content exists even with few providers
      openGraph: { title, description, type: 'website', locale: 'en_US', url: `${SITE_URL}/practice-areas/${specialtySlug}/${locationSlug}/${publicId}`, images: [{ url: getServiceImage(specialtySlug).src, width: 1200, height: 630, alt: title }] },
      twitter: { card: 'summary_large_image', title, description, images: [getServiceImage(specialtySlug).src] },
      alternates: { canonical: `${SITE_URL}/practice-areas/${specialtySlug}/${locationSlug}/${publicId}` },
    }
  }

  // ─── PROVIDER DETAIL (existing logic) ────────────────────
  try {
    // Parallel lookups to minimize total latency
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(publicId)
    const [stableIdResult, slugResult, service] = await Promise.all([
      (isUuid ? getAttorneyById(publicId) : getAttorneyByStableId(publicId)).catch(() => null),
      (isUuid ? Promise.resolve(null) : getAttorneyBySlug(publicId)).catch(() => null),
      getSpecialtyBySlug(specialtySlug).catch(() => null),
    ])
    const rawProvider = stableIdResult || slugResult
    if (!rawProvider) return { title: 'Attorney Not Found', robots: { index: false, follow: false } }

    // Cast to access DB columns that TS can't infer from select('*')
    const provider = rawProvider as unknown as ProviderRecord

    const realCity = provider.address_city || ''
    const displayName = provider.name || provider.business_name || 'Attorney'
    const specialtyName = service?.name || 'Attorney'

    // Compute canonical from provider's REAL data, not URL segments
    const canonicalPath = getAttorneyUrl({
      stable_id: provider.stable_id,
      slug: provider.slug,
      specialty: provider.specialty?.name,
      city: realCity,
    })
    const ratingStr = provider.rating_average && Number(provider.rating_average) >= 1
      ? ` ${Number(provider.rating_average).toFixed(1)}★`
      : ''
    const title = truncateTitle(`${displayName} - ${specialtyName} à ${realCity}${ratingStr}`)

    const descParts: string[] = []
    descParts.push(`${displayName}, ${specialtyName.toLowerCase()} in ${realCity}`)
    if (provider.review_count && provider.review_count > 0) {
      descParts.push(`${provider.review_count} reviews${provider.rating_average ? ` (${Number(provider.rating_average).toFixed(1)}/5)` : ''}`)
    }
    if (provider.bar_number) descParts.push('Bar-verified')
    descParts.push('Free consultation')
    const rawDesc = descParts.join(' · ') + '.'
    const description = rawDesc.length > 155 ? rawDesc.slice(0, 154).replace(/\s+\S*$/, '') + '…' : rawDesc

    // Noindex only if provider is explicitly flagged by admin.
    // Non-canonical URLs are handled by redirect() in the page component + alternates.canonical.
    // Previously also checked isWrongUrl, but this caused 710+ false noindex pages because
    // the sitemap used stable_id while getAttorneyUrl preferred slug.
    const shouldNoindex = provider.noindex === true

    const serviceImage = getServiceImage(specialtySlug)
    const ogAlt = `${displayName} - ${specialtyName} à ${realCity}`
    const ogImage = serviceImage.src

    return {
      title,
      description,
      robots: shouldNoindex
        ? { index: false, follow: true }
        : { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const },
      openGraph: {
        title,
        description,
        type: 'profile',
        locale: 'en_US',
        url: `${SITE_URL}${canonicalPath}`,
        images: [{ url: ogImage, width: 1200, height: 630, alt: ogAlt }],
      },
      twitter: {
        card: 'summary_large_image' as const,
        title,
        description,
        images: [ogImage],
      },
      alternates: {
        canonical: `${SITE_URL}${canonicalPath}`,
      },
    }
  } catch {
    // Don't noindex on transient DB errors — ISR will retry and Google will recrawl.
    // Returning index:true prevents permanent noindex from temporary failures.
    return { title: 'Attorney Not Found' }
  }
}

export default async function AttorneyPage({ params }: PageProps) {
  const { service: specialtySlug, location: locationSlug, publicId } = await params

  // ─── QUARTIER DETECTION ──────────────────────────────────
  const quartierMatch = getNeighborhoodBySlug(locationSlug, publicId)
  if (quartierMatch) {
    return <ServiceQuartierPage specialtySlug={specialtySlug} locationSlug={locationSlug} quartierSlug={publicId} />
  }

  // ─── PROVIDER DETAIL (existing logic) ────────────────────
  // Run ALL lookups in parallel to minimize total latency
  let provider: ProviderRecord | null = null
  let service: Service | null = null
  let location: Location | null = null

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(publicId)
    const [stableIdResult, slugResult, svcResult, locResult] = await Promise.all([
      (isUuid ? getAttorneyById(publicId) : getAttorneyByStableId(publicId)).catch(() => null),
      (isUuid ? Promise.resolve(null) : getAttorneyBySlug(publicId)).catch(() => null),
      getSpecialtyBySlug(specialtySlug).catch(() => null),
      getLocationBySlug(locationSlug).catch(() => null),
    ])
    provider = (stableIdResult || slugResult) as ProviderRecord | null
    service = svcResult as Service | null
    location = locResult as Location | null
  } catch {
    // Graceful degradation
  }

  if (!provider) {
    notFound()
  }

  // Canonical redirect: if the URL segments don't match the canonical slugs, redirect
  const canonicalUrl = getAttorneyUrl({
    stable_id: provider.stable_id,
    slug: provider.slug,
    specialty: provider.specialty?.name,
    city: provider.address_city,
  })
  const currentPath = `/practice-areas/${specialtySlug}/${locationSlug}/${publicId}`
  // Only redirect if canonical URL has a valid ID segment (avoid redirect to hub page)
  const canonicalId = canonicalUrl.split('/').pop()
  if (canonicalId && currentPath !== canonicalUrl) {
    redirect(canonicalUrl)
  }

  // Convert to Attorney format
  const attorney = convertToAttorney(provider, service, location, specialtySlug)

  // Fetch reviews, similar attorneys, and specialties in parallel (graceful degradation)
  let reviews: Review[] = []
  let similarAttorneys: Awaited<ReturnType<typeof getSimilarAttorneys>> = []
  let attorneySpecialties: Array<{ id: string; name: string; slug: string }> = []
  try {
    const [revs, similar, specs] = await Promise.all([
      getAttorneyReviews(provider.id, service?.name || attorney.specialty),
      getSimilarAttorneys(provider.id, attorney.specialty, attorney.postal_code),
      getAttorneySpecialtiesList(provider.id),
    ])
    reviews = revs
    similarAttorneys = similar
    attorneySpecialties = specs
  } catch {
    // Graceful degradation — page renders without reviews/similar attorneys
  }

  const specialtyName = service?.name || attorney.specialty
  const cityName = attorney.city

  return (
    <>
      {/* Preload hints */}
      <link rel="dns-prefetch" href="//umjmbdbwcsxrvfqktiui.supabase.co" />

      {/* Breadcrumbs (visual + JSON-LD) */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumbs
            items={[
              { label: 'Practice Areas', href: '/practice-areas' },
              { label: specialtyName, href: `/practice-areas/${specialtySlug}` },
              ...(cityName ? [{ label: cityName, href: `/practice-areas/${specialtySlug}/${locationSlug}` }] : []),
              { label: attorney.business_name || 'Attorney' },
            ]}
          />
        </div>
      </div>

      <AttorneyPageClient
        initialAttorney={attorney}
        initialReviews={reviews}
        attorneyId={provider.id}
        similarAttorneys={similarAttorneys}
        isClaimed={!!provider.user_id}
        hasBarNumber={!!provider.bar_number}
        trustScore={provider.trust_score ?? 0}
        trustScoreBreakdown={provider.trust_score_breakdown ?? undefined}
        endorsementCount={provider.endorsement_count ?? 0}
        attorneySpecialties={attorneySpecialties}
      />

      {/* Back link to service+location listing */}
      <section className="py-6 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={`/practice-areas/${specialtySlug}/${locationSlug}`}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-700 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            All {(service?.name || attorney.specialty).toLowerCase()}s in {attorney.city}
          </Link>
        </div>
      </section>

      {/* Internal Links — Maillage interne (SEO) */}
      <AttorneyInternalLinks
        specialtySlug={specialtySlug}
        locationSlug={locationSlug}
        specialtyName={service?.name || attorney.specialty}
        cityName={attorney.city}
        regionName={location?.region_name}
        departmentName={location?.department_name}
        departmentCode={location?.department_code}
      />


      <EstimationWidget hideLauncher context={{
        metier: service?.name || attorney.specialty,
        metierSlug: specialtySlug,
        ville: attorney.city,
        departement: location?.department_code || '',
        pageUrl: `/practice-areas/${specialtySlug}/${locationSlug}/${publicId}`,
        artisan: {  // API-bound field name — do not rename without migration
          name: attorney.business_name || 'Attorney',
          slug: provider.slug || '',
          publicId: provider.stable_id || provider.slug || publicId,
        },
      }} />
    </>
  )
}
