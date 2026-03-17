import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getSpecialtyBySlug,
  getAttorneysByServiceAndLocation,
} from '@/lib/supabase'
import ServiceLocationPageClient from '../PageClient'
import { getBreadcrumbSchema, getFAQSchema, getItemListSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { getAttorneyUrl } from '@/lib/utils'
import { getServiceImage } from '@/lib/data/images'
import {
  practiceAreas as staticPracticeAreas,
  getNeighborhoodBySlug,
  getNeighborhoodsByCity,
  getNearbyCities,
  getStateByCode,
} from '@/lib/data/usa'
import { getTradeContent } from '@/lib/data/trade-content'
// TODO: Neighborhood enrichment data removed (stub was always null)
import {
  generateNeighborhoodContent,
  hashCode,
} from '@/lib/seo/location-content'
import { popularServices, relatedServices } from '@/lib/constants/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import type { Service, Location as LocationType, Provider } from '@/types'

// Safely escape JSON for script tags to prevent XSS
function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

interface ServiceQuartierPageProps {
  specialtySlug: string
  locationSlug: string
  quartierSlug: string
}

export default async function ServiceQuartierPage({
  specialtySlug,
  locationSlug,
  quartierSlug,
}: ServiceQuartierPageProps) {
  // 1. Resolve quartier (static data)
  const quartierData = getNeighborhoodBySlug(locationSlug, quartierSlug)
  if (!quartierData) notFound()
  const { city: cityData, neighborhoodName: quartierName } = quartierData

  // 1b. Enriched neighborhood data (stub -- always null, to be replaced with real data)
  const quartierRealData = null as { codePostal?: string } | null

  // 2. Resolve service (DB → static fallback)
  let service: Service
  try {
    const dbService = await getSpecialtyBySlug(specialtySlug)
    if (dbService) {
      service = dbService
    } else {
      const staticSvc = staticPracticeAreas.find(s => s.slug === specialtySlug)
      if (!staticSvc) notFound()
      service = { id: '', name: staticSvc.name, slug: staticSvc.slug, is_active: true, created_at: '' }
    }
  } catch {
    const staticSvc = staticPracticeAreas.find(s => s.slug === specialtySlug)
    if (!staticSvc) notFound()
    service = { id: '', name: staticSvc.name, slug: staticSvc.slug, is_active: true, created_at: '' }
  }

  // 3. Fetch providers
  // STRICT RULE: Paris/Lyon/Marseille arrondissements show ONLY providers in that
  // exact arrondissement (filtered by address_postal_code). Other quartiers use the
  // city-level pool as before.
  const ARRONDISSEMENT_CITIES = ['paris', 'lyon', 'marseille']
  const arrondissementPostalCode =
    ARRONDISSEMENT_CITIES.includes(locationSlug) && quartierRealData?.codePostal
      ? quartierRealData.codePostal
      : undefined
  // Throw on failure so ISR keeps stale cache (prevents "disappearing attorneys" bug)
  const providers = await getAttorneysByServiceAndLocation(
    specialtySlug,
    locationSlug,
    { postalCode: arrondissementPostalCode },
  ) as unknown as Provider[]

  // 4. Generate content
  const trade = getTradeContent(specialtySlug)
  const quartierContent = generateNeighborhoodContent(cityData, quartierName, specialtySlug)
  const cityRegion = getStateByCode(cityData.stateCode)?.region || ''
  const svcLower = service.name.toLowerCase()

  // 5. JSON-LD schemas
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${service.name} in ${quartierName}, ${cityData.name}`,
    description: `Find the best ${svcLower}s in the ${quartierName} neighborhood of ${cityData.name}`,
    image: getServiceImage(specialtySlug).src,
    areaServed: {
      '@type': 'Place',
      name: `${quartierName}, ${cityData.name}`,
      containedInPlace: {
        '@type': 'City',
        name: cityData.name,
        containedInPlace: {
          '@type': 'AdministrativeArea',
          name: cityData.stateName,
        },
      },
    },
    provider: { '@id': `${SITE_URL}#organization` },
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Practice Areas', url: '/services' },
    { name: service.name, url: `/practice-areas/${specialtySlug}` },
    { name: cityData.name, url: `/practice-areas/${specialtySlug}/${locationSlug}` },
    { name: quartierName, url: `/practice-areas/${specialtySlug}/${locationSlug}/${quartierSlug}` },
  ])

  // Combined FAQ: 2 trade FAQ (hash-selected) + 3 quartier FAQ
  const combinedFaq: { question: string; answer: string }[] = []
  if (trade && trade.faq.length > 0) {
    const tradeFaqHash = Math.abs(hashCode(`trade-faq-${specialtySlug}-${locationSlug}-${quartierSlug}`))
    const idx1 = tradeFaqHash % trade.faq.length
    const idx2 = (tradeFaqHash + 3) % trade.faq.length
    combinedFaq.push({ question: trade.faq[idx1].q, answer: trade.faq[idx1].a })
    if (idx2 !== idx1) combinedFaq.push({ question: trade.faq[idx2].q, answer: trade.faq[idx2].a })
  }
  // Add quartier-specific FAQ (3 items max)
  combinedFaq.push(...quartierContent.faqItems.slice(0, 3))

  const faqSchema = combinedFaq.length > 0 ? getFAQSchema(combinedFaq) : null

  const itemListSchema = providers.length > 0
    ? getItemListSchema({
        name: `${service.name} in ${quartierName}, ${cityData.name}`,
        description: `List of verified ${svcLower}s in ${quartierName}, ${cityData.name}`,
        url: `/practice-areas/${specialtySlug}/${locationSlug}/${quartierSlug}`,
        items: providers.slice(0, 20).map((p, i) => ({
          name: p.name,
          url: getAttorneyUrl({ stable_id: p.stable_id, slug: p.slug, specialty: p.specialty, city: p.address_city }),
          position: i + 1,
          image: getServiceImage(specialtySlug).src,
          rating: p.rating_average ?? undefined,
          reviewCount: p.review_count ?? undefined,
        })),
      })
    : null

  const jsonLdSchemas: Record<string, unknown>[] = [
    serviceSchema,
    breadcrumbSchema,
    ...(faqSchema ? [faqSchema] : []),
    ...(itemListSchema ? [itemListSchema] : []),
  ]

  // 7. Varied H1
  const h1Hash = Math.abs(hashCode(`h1-sq-${specialtySlug}-${locationSlug}-${quartierSlug}`))
  const h1Templates = [
    `${service.name} in ${quartierName}, ${cityData.name}`,
    `${service.name} — ${quartierName} Neighborhood, ${cityData.name}`,
    `Find a ${svcLower} in ${quartierName} (${cityData.name})`,
    `${service.name} in ${quartierName}: verified attorneys`,
    `Best ${svcLower}s in ${quartierName}, ${cityData.name}`,
  ]
  const h1Text = h1Templates[h1Hash % h1Templates.length]

  // 8. Location for PageClient
  const location: LocationType = {
    id: '',
    name: cityData.name,
    slug: cityData.slug,
    postal_code: cityData.zipCode,
    region_name: cityRegion,
    department_name: cityData.stateName,
    department_code: cityData.stateCode,
    is_active: true,
    created_at: '',
  }

  // Other services for cross-linking — use related services map with fallback
  const relatedSlugs = relatedServices[specialtySlug] || []
  const otherServices = relatedSlugs.length > 0
    ? relatedSlugs.slice(0, 6).map(slug => {
        const svc = staticPracticeAreas.find(s => s.slug === slug)
        return svc ? { name: svc.name, slug: svc.slug } : null
      }).filter((s): s is NonNullable<typeof s> => s !== null)
    : popularServices.filter(s => s.slug !== specialtySlug).slice(0, 6)
  const otherQuartiers = getNeighborhoodsByCity(locationSlug).filter(q => q.slug !== quartierSlug).slice(0, 10)
  const nearbyCities = getNearbyCities(locationSlug, 8)
  const { profile: _profile } = quartierContent

  return (
    <>
      {/* JSON-LD Structured Data */}
      {jsonLdSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonStringify(schema) }}
        />
      ))}

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumb items={[
            { label: 'Services', href: '/services' },
            { label: service.name, href: `/practice-areas/${specialtySlug}` },
            { label: cityData.name, href: `/practice-areas/${specialtySlug}/${locationSlug}` },
            { label: quartierName },
          ]} />
        </div>
      </div>

      {/* Provider Listing (reuses the split-view PageClient from service×location) */}
      <ServiceLocationPageClient
        service={service}
        location={location}
        providers={providers}
        h1Text={h1Text}
      />


      {/* ─── INTERNAL LINKS ─────────────────────────────────── */}
      <section className="py-12 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Back to city-level service page */}
          <Link
            href={`/practice-areas/${specialtySlug}/${locationSlug}`}
            className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-700 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            All {svcLower}s in {cityData.name}
          </Link>

          {/* Other quartiers for this service */}
          {otherQuartiers.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                {service.name} in Other Neighborhoods of {cityData.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {otherQuartiers.map(q => (
                  <Link
                    key={q.slug}
                    href={`/practice-areas/${specialtySlug}/${locationSlug}/${q.slug}`}
                    className="text-sm bg-white text-blue-700 px-3 py-1.5 rounded-full border border-blue-100 hover:bg-blue-50 transition-colors"
                  >
                    {q.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Other services in this quartier */}
          {otherServices.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Other Services in {quartierName}, {cityData.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {otherServices.map(s => (
                  <Link
                    key={s.slug}
                    href={`/practice-areas/${s.slug}/${locationSlug}/${quartierSlug}`}
                    className="text-sm bg-white text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Nearby cities */}
          {nearbyCities.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                {service.name} in Nearby Cities
              </h3>
              <div className="flex flex-wrap gap-2">
                {nearbyCities.map(c => (
                  <Link
                    key={c.slug}
                    href={`/practice-areas/${specialtySlug}/${c.slug}`}
                    className="text-sm bg-white text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

    </>
  )
}
