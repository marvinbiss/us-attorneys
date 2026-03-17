import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getSpecialtyBySlug,
  getLocationBySlug,
  getAttorneysByServiceAndLocation,
  getAttorneyCountByServiceAndLocation,
} from '@/lib/supabase'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { practiceAreas as staticPracticeAreas, getCityBySlug, getStateByCode } from '@/lib/data/usa'
import { resolveZipToCity } from '@/lib/location-resolver'
import { SITE_URL } from '@/lib/seo/config'
import { REVALIDATE } from '@/lib/cache'
import Breadcrumb from '@/components/Breadcrumb'
import type { Service, Location as LocationType, Provider } from '@/types'

import ServiceLocationPageClient from '@/app/(public)/practice-areas/[service]/[location]/PageClient'

const DEMOGRAPHICS = [
  { slug: 'women', name: 'Women', filter: 'female' },
  { slug: 'spanish-speaking', name: 'Spanish-Speaking', filter: 'spanish' },
  { slug: 'black', name: 'Black', filter: 'black' },
  { slug: 'asian', name: 'Asian', filter: 'asian' },
  { slug: 'lgbtq', name: 'LGBTQ+', filter: 'lgbtq' },
  { slug: 'veteran', name: 'Veteran', filter: 'veteran' },
  { slug: 'experienced', name: 'Experienced (10+ years)', filter: 'experienced' },
  { slug: 'young', name: 'Young Attorneys', filter: 'young' },
  { slug: 'senior', name: 'Senior Attorneys', filter: 'senior' },
  { slug: 'pro-bono', name: 'Pro Bono', filter: 'pro-bono' },
]

// ISR: revalidate every 24h
export const revalidate = REVALIDATE.attorneyProfile
export const dynamicParams = true

// 1 seed for build
export function generateStaticParams() {
  return [{ specialty: 'personal-injury', location: 'new-york', demographic: 'women' }]
}

/** Resolve a city from static data to Location shape (fallback when DB is down) */
function cityToLocation(slug: string): LocationType | null {
  const cityData = getCityBySlug(slug)
  if (!cityData) return null
  return {
    id: '',
    name: cityData.name,
    slug: cityData.slug,
    postal_code: cityData.zipCode,
    region_name: getStateByCode(cityData.stateCode)?.region || '',
    department_name: cityData.stateName,
    department_code: cityData.stateCode,
    is_active: true,
    created_at: '',
  }
}

function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

interface PageProps {
  params: Promise<{
    specialty: string
    location: string
    demographic: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { specialty: specialtySlug, location: locationSlug, demographic: demographicSlug } = await params

  const demo = DEMOGRAPHICS.find(d => d.slug === demographicSlug)
  if (!demo) {
    return { title: 'Not Found', robots: { index: false, follow: false } }
  }

  let specialtyName = ''
  let locationName = ''
  let departmentCode = ''
  let attorneyCount = 1

  try {
    const [service, location, count] = await Promise.all([
      getSpecialtyBySlug(specialtySlug),
      getLocationBySlug(locationSlug) as Promise<import('@/types').Location | null>,
      getAttorneyCountByServiceAndLocation(specialtySlug, locationSlug),
    ])

    if (service) specialtyName = service.name
    if (location) {
      locationName = location.name
      departmentCode = location.department_code || ''
    }
    attorneyCount = count
  } catch {
    const staticSvc = staticPracticeAreas.find(s => s.slug === specialtySlug)
    const fallbackCity = getCityBySlug(locationSlug)
    if (staticSvc) specialtyName = staticSvc.name
    if (fallbackCity) {
      locationName = fallbackCity.name
      departmentCode = fallbackCity.stateCode
    }
    attorneyCount = 1
  }

  if (!specialtyName || !locationName) {
    return { title: 'Not Found', robots: { index: false, follow: false } }
  }

  const stateLabel = departmentCode ? `, ${departmentCode}` : ''
  const title = `${demo.name} ${specialtyName} Attorneys in ${locationName}${stateLabel}`
  const description = `Find ${demo.name.toLowerCase()} ${specialtyName.toLowerCase()} attorneys in ${locationName}${stateLabel}. Browse verified professionals, compare profiles, and request a free consultation.`

  const noindex = attorneyCount === 0

  return {
    title,
    description,
    robots: noindex
      ? { index: false, follow: true }
      : { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const },
    alternates: {
      canonical: `${SITE_URL}/attorneys/${specialtySlug}/${locationSlug}/${demographicSlug}`,
    },
  }
}

export default async function DemographicAttorneysPage({ params }: PageProps) {
  const { specialty: specialtySlug, location: locationSlug, demographic: demographicSlug } = await params

  // Validate demographic slug
  const demo = DEMOGRAPHICS.find(d => d.slug === demographicSlug)
  if (!demo) notFound()

  // 1. Resolve service (DB then static fallback)
  let service: Service
  try {
    service = await getSpecialtyBySlug(specialtySlug)
    if (!service) {
      const staticSvc = staticPracticeAreas.find(s => s.slug === specialtySlug)
      if (!staticSvc) notFound()
      service = { id: '', name: staticSvc.name, slug: staticSvc.slug, is_active: true, created_at: '' }
    }
  } catch {
    const staticSvc = staticPracticeAreas.find(s => s.slug === specialtySlug)
    if (!staticSvc) notFound()
    service = { id: '', name: staticSvc.name, slug: staticSvc.slug, is_active: true, created_at: '' }
  }

  // 2. Resolve location (DB then static fallback, with ZIP support)
  let location: LocationType
  try {
    const dbLocation = await getLocationBySlug(locationSlug)
    if (!dbLocation) {
      const cityData = getCityBySlug(locationSlug) || await resolveZipToCity(locationSlug)
      const fallback = cityData ? cityToLocation(cityData.slug) : null
      if (!fallback) notFound()
      location = fallback
    } else {
      location = { ...dbLocation, id: (dbLocation as Record<string, unknown>).code_insee as string || '' }
    }
  } catch {
    const cityData = getCityBySlug(locationSlug) || await resolveZipToCity(locationSlug)
    const fallback = cityData ? cityToLocation(cityData.slug) : null
    if (!fallback) notFound()
    location = fallback
  }

  // 3. Fetch providers + total count (demographic filtering will be added when DB supports it)
  const [providers, totalAttorneyCount] = await Promise.all([
    getAttorneysByServiceAndLocation(specialtySlug, locationSlug),
    getAttorneyCountByServiceAndLocation(specialtySlug, locationSlug).catch(() => 0),
  ])

  const stateLabel = location.department_code ? `, ${location.department_code}` : ''
  const h1Text = `Find ${demo.name} ${service.name} Attorneys in ${location.name}${stateLabel}`

  // JSON-LD: CollectionPage
  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${demo.name} ${service.name} Attorneys in ${location.name}`,
    description: `Find ${demo.name.toLowerCase()} ${service.name.toLowerCase()} attorneys in ${location.name}.`,
    url: `${SITE_URL}/attorneys/${specialtySlug}/${locationSlug}/${demographicSlug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'US Attorneys',
      url: SITE_URL,
    },
    dateModified: new Date().toISOString().split('T')[0],
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Attorneys', url: '/attorneys' },
    { name: service.name, url: `/attorneys/${specialtySlug}` },
    { name: location.name, url: `/attorneys/${specialtySlug}/${locationSlug}` },
    { name: demo.name, url: `/attorneys/${specialtySlug}/${locationSlug}/${demographicSlug}` },
  ])

  const jsonLdSchemas = [collectionPageSchema, breadcrumbSchema]

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
            { label: 'Attorneys', href: '/attorneys' },
            { label: service.name, href: `/attorneys/${specialtySlug}` },
            { label: location.name, href: `/attorneys/${specialtySlug}/${locationSlug}` },
            { label: demo.name },
          ]} />
        </div>
      </div>

      {/* Demographic description */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-gray-600 text-sm max-w-3xl">
            Browse {demo.name.toLowerCase()} {service.name.toLowerCase()} attorneys in {location.name}{stateLabel}.
            {totalAttorneyCount > 0
              ? ` ${totalAttorneyCount} verified attorney${totalAttorneyCount > 1 ? 's' : ''} available. Compare profiles and request a free consultation.`
              : ' Request a consultation and we will connect you with a qualified professional.'}
          </p>
        </div>
      </div>

      {/* Page Content — reuses the practice-areas client component */}
      <ServiceLocationPageClient
        service={service}
        location={location}
        providers={(providers || []) as unknown as Provider[]}
        h1Text={h1Text}
        totalCount={totalAttorneyCount}
        specialtySlug={specialtySlug}
        locationSlug={locationSlug}
      />
    </>
  )
}
