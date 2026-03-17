import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import {
  getSpecialtyBySlug,
  getAttorneysByServiceAndLocation,
  getAttorneyCountByServiceAndLocation,
} from '@/lib/supabase'
import {
  practiceAreas as staticPracticeAreas,
  getNeighborhoodBySlug,
  getNeighborhoodsByCity,
  getStateByCode,
} from '@/lib/data/usa'
import { SITE_URL } from '@/lib/seo/config'
import { REVALIDATE } from '@/lib/cache'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { hashCode } from '@/lib/seo/location-content'
import { getNaturalTerm } from '@/lib/seo/natural-terms'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import ServiceLocationPageClient from '@/app/(public)/practice-areas/[service]/[location]/PageClient'
import type { Service, Location as LocationType, Provider } from '@/types'

// ISR: revalidate every 24h
export const revalidate = REVALIDATE.serviceLocation
export const dynamicParams = true

// 1 seed page for build — ISR handles the rest
export function generateStaticParams() {
  return [{ specialty: 'personal-injury', city: 'new-york', neighborhood: 'manhattan' }]
}

interface PageProps {
  params: Promise<{
    specialty: string
    city: string
    neighborhood: string
  }>
}

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { specialty: specialtySlug, city: citySlug, neighborhood: neighborhoodSlug } = await params

  // Resolve neighborhood + specialty
  const neighborhoodResult = getNeighborhoodBySlug(citySlug, neighborhoodSlug)
  if (!neighborhoodResult) return { title: 'Not Found', robots: { index: false, follow: false } }

  const { city, neighborhoodName } = neighborhoodResult

  let specialtyName = ''
  let attorneyCount = 1 // Fail open

  try {
    const [service, count] = await Promise.all([
      getSpecialtyBySlug(specialtySlug),
      getAttorneyCountByServiceAndLocation(specialtySlug, citySlug),
    ])
    if (service) specialtyName = service.name
    attorneyCount = count
  } catch {
    const staticSvc = staticPracticeAreas.find(s => s.slug === specialtySlug)
    if (staticSvc) specialtyName = staticSvc.name
  }

  if (!specialtyName) return { title: 'Not Found', robots: { index: false, follow: false } }

  const noindex = attorneyCount === 0
  const svcLower = specialtyName.toLowerCase()
  const naturalTerm = getNaturalTerm(specialtySlug)
  const seoHash = Math.abs(hashCode(`nbh-seo-${specialtySlug}-${citySlug}-${neighborhoodSlug}`))

  const titleTemplates = [
    `${specialtyName} in ${neighborhoodName}, ${city.name}`,
    `${neighborhoodName} ${specialtyName} — ${city.name}`,
    `Find ${naturalTerm.article} in ${neighborhoodName}`,
    `${specialtyName} ${neighborhoodName} (${city.stateCode})`,
    `Best ${naturalTerm.plural} in ${neighborhoodName}`,
  ]
  const title = truncateTitle(titleTemplates[seoHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`nbh-desc-${specialtySlug}-${citySlug}-${neighborhoodSlug}`))
  const descTemplates = [
    `Find a qualified ${svcLower} in ${neighborhoodName}, ${city.name} (${city.stateCode}). Bar-verified attorneys. Free consultation.`,
    `${specialtyName} in the ${neighborhoodName} neighborhood of ${city.name}. Compare profiles, fees and reviews.`,
    `Need a ${svcLower} in ${neighborhoodName}? Verified attorneys in ${city.name}, ${city.stateName}. Free consultation.`,
    `${attorneyCount > 0 ? `${attorneyCount} verified` : 'Qualified'} ${svcLower}s in ${neighborhoodName}, ${city.name}. Free consultation.`,
    `${neighborhoodName}, ${city.name}: find the best ${svcLower}. Bar-verified. Free consultation available.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  return {
    title,
    description,
    robots: noindex
      ? { index: false, follow: true }
      : { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const },
    alternates: {
      canonical: `${SITE_URL}/neighborhoods/${specialtySlug}/${citySlug}/${neighborhoodSlug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function NeighborhoodSpecialtyPage({ params }: PageProps) {
  const { specialty: specialtySlug, city: citySlug, neighborhood: neighborhoodSlug } = await params

  // 1. Resolve neighborhood
  const neighborhoodResult = getNeighborhoodBySlug(citySlug, neighborhoodSlug)
  if (!neighborhoodResult) notFound()
  const { city, neighborhoodName } = neighborhoodResult

  // 2. Resolve specialty (DB -> static fallback)
  let service: Service
  try {
    const dbService = await getSpecialtyBySlug(specialtySlug)
    if (!dbService) {
      const staticSvc = staticPracticeAreas.find(s => s.slug === specialtySlug)
      if (!staticSvc) notFound()
      service = { id: '', name: staticSvc.name, slug: staticSvc.slug, is_active: true, created_at: '' }
    } else {
      service = dbService
    }
  } catch {
    const staticSvc = staticPracticeAreas.find(s => s.slug === specialtySlug)
    if (!staticSvc) notFound()
    service = { id: '', name: staticSvc.name, slug: staticSvc.slug, is_active: true, created_at: '' }
  }

  // 3. Build a Location object from city data
  const stateData = getStateByCode(city.stateCode)
  const location: LocationType = {
    id: '',
    name: city.name,
    slug: city.slug,
    postal_code: city.zipCode,
    region_name: stateData?.region || '',
    department_name: city.stateName,
    department_code: city.stateCode,
    is_active: true,
    created_at: '',
    latitude: city.latitude,
    longitude: city.longitude,
  }

  // 4. Fetch attorneys for this specialty in this city
  const [providers, totalAttorneyCount] = await Promise.all([
    getAttorneysByServiceAndLocation(specialtySlug, citySlug),
    getAttorneyCountByServiceAndLocation(specialtySlug, citySlug).catch(() => 0),
  ])

  // 5. H1
  const naturalTerm = getNaturalTerm(specialtySlug)
  const h1Hash = Math.abs(hashCode(`nbh-h1-${specialtySlug}-${citySlug}-${neighborhoodSlug}`))
  const h1Templates = [
    `${service.name} Attorneys in ${neighborhoodName}, ${city.name}`,
    `Find ${naturalTerm.article} in ${neighborhoodName}, ${city.name}`,
    `${service.name} in ${neighborhoodName} (${city.stateCode})`,
    `Best ${naturalTerm.plural} in ${neighborhoodName}, ${city.name}`,
  ]
  const h1Text = h1Templates[h1Hash % h1Templates.length]

  // 6. Cross-links data
  const otherNeighborhoods = getNeighborhoodsByCity(citySlug).filter(q => q.slug !== neighborhoodSlug)
  const otherSpecialties = staticPracticeAreas.filter(s => s.slug !== specialtySlug).slice(0, 10)

  // 7. JSON-LD
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Practice Areas', url: '/services' },
    { name: service.name, url: `/practice-areas/${specialtySlug}` },
    { name: `${city.name}`, url: `/practice-areas/${specialtySlug}/${citySlug}` },
    { name: neighborhoodName, url: `/neighborhoods/${specialtySlug}/${citySlug}/${neighborhoodSlug}` },
  ])

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${service.name} Attorneys in ${neighborhoodName}, ${city.name}`,
    description: `Find qualified ${service.name.toLowerCase()} attorneys in the ${neighborhoodName} neighborhood of ${city.name}, ${city.stateName}.`,
    url: `${SITE_URL}/neighborhoods/${specialtySlug}/${citySlug}/${neighborhoodSlug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'US Attorneys',
      url: SITE_URL,
    },
  }

  // Brief neighborhood context paragraph
  const contextHash = Math.abs(hashCode(`nbh-ctx-${specialtySlug}-${citySlug}-${neighborhoodSlug}`))
  const contextTemplates = [
    `Looking for a ${service.name.toLowerCase()} attorney in ${neighborhoodName}? This ${city.name} neighborhood is served by attorneys practicing in ${city.stateName}. Browse verified profiles below to find the right fit for your legal needs.`,
    `${neighborhoodName} is a neighborhood in ${city.name}, ${city.stateName}. Whether you need representation for a ${service.name.toLowerCase()} matter or a free consultation, our directory connects you with bar-verified attorneys in the area.`,
    `Find experienced ${service.name.toLowerCase()} attorneys serving the ${neighborhoodName} area of ${city.name}. All attorneys listed are bar-verified in ${city.stateName}. Compare profiles and request a free consultation.`,
  ]
  const contextText = contextTemplates[contextHash % contextTemplates.length]

  return (
    <>
      <JsonLd data={[breadcrumbSchema, collectionSchema]} />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumb items={[
            { label: 'Practice Areas', href: '/services' },
            { label: service.name, href: `/practice-areas/${specialtySlug}` },
            { label: city.name, href: `/practice-areas/${specialtySlug}/${citySlug}` },
            { label: neighborhoodName },
          ]} />
        </div>
      </div>

      {/* Neighborhood context */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-gray-600 text-sm leading-relaxed max-w-3xl">
          {contextText}
        </p>
      </div>

      {/* Attorney listings */}
      <ServiceLocationPageClient
        service={service}
        location={location}
        providers={(providers || []) as unknown as Provider[]}
        h1Text={h1Text}
        totalCount={totalAttorneyCount}
        specialtySlug={specialtySlug}
        locationSlug={citySlug}
      />

      {/* Cross-links */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-8 tracking-tight">
            See Also
          </h2>
          <div className="grid md:grid-cols-3 gap-10">

            {/* Other neighborhoods in the same city for this specialty */}
            {otherNeighborhoods.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                  {service.name} in Other {city.name} Neighborhoods
                </h3>
                <div className="space-y-2">
                  {otherNeighborhoods.slice(0, 8).map(({ name, slug }) => (
                    <Link
                      key={slug}
                      href={`/neighborhoods/${specialtySlug}/${citySlug}/${slug}`}
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-1.5 transition-colors"
                    >
                      <ChevronRight className="w-3 h-3" />
                      {service.name} in {name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Other specialties in same neighborhood */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                Other Practice Areas in {neighborhoodName}
              </h3>
              <div className="space-y-2">
                {otherSpecialties.slice(0, 8).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/neighborhoods/${s.slug}/${citySlug}/${neighborhoodSlug}`}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-1.5 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
                    {s.name} in {neighborhoodName}
                  </Link>
                ))}
              </div>
            </div>

            {/* Navigation links */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                Navigation
              </h3>
              <div className="space-y-2">
                <Link
                  href={`/practice-areas/${specialtySlug}/${citySlug}`}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-1.5 transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                  {service.name} in {city.name}
                </Link>
                <Link
                  href={`/cities/${citySlug}/${neighborhoodSlug}`}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-1.5 transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                  All Attorneys in {neighborhoodName}
                </Link>
                <Link
                  href={`/cities/${citySlug}`}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-1.5 transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                  Attorneys in {city.name}
                </Link>
                <Link
                  href={`/practice-areas/${specialtySlug}`}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-1.5 transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                  {service.name} — All Locations
                </Link>
                <Link
                  href="/services"
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-1.5 transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                  All Practice Areas
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
