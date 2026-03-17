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

// ISR: revalidate every 24h
export const revalidate = REVALIDATE.attorneyProfile
export const dynamicParams = true

// 1 seed for build
export function generateStaticParams() {
  return [{ specialty: 'personal-injury', location: 'new-york' }]
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
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { specialty: specialtySlug, location: locationSlug } = await params

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
  const title = `All ${specialtyName} Attorneys in ${locationName}${stateLabel} — Complete Directory`
  const description = `Complete list of all ${specialtyName.toLowerCase()} attorneys in ${locationName}${stateLabel}. Browse the full directory with no pagination limit.`

  const noindex = attorneyCount === 0

  return {
    title,
    description,
    robots: noindex
      ? { index: false, follow: true }
      : { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const },
    alternates: {
      canonical: `${SITE_URL}/attorneys/${specialtySlug}/${locationSlug}/all`,
    },
  }
}

export default async function AllAttorneysPage({ params }: PageProps) {
  const { specialty: specialtySlug, location: locationSlug } = await params

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

  // 3. Fetch all providers (limit=500) + total count
  const [providers, totalAttorneyCount] = await Promise.all([
    getAttorneysByServiceAndLocation(specialtySlug, locationSlug, { limit: 500 }),
    getAttorneyCountByServiceAndLocation(specialtySlug, locationSlug).catch(() => 0),
  ])

  const stateLabel = location.department_code ? `, ${location.department_code}` : ''
  const h1Text = `Complete List of ${service.name} Attorneys in ${location.name}${stateLabel}`

  // JSON-LD: CollectionPage with ItemListUnordered
  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `All ${service.name} Attorneys in ${location.name}`,
    description: `Complete directory of ${service.name.toLowerCase()} attorneys in ${location.name}.`,
    url: `${SITE_URL}/attorneys/${specialtySlug}/${locationSlug}/all`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'US Attorneys',
      url: SITE_URL,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'ItemListUnordered',
      numberOfItems: totalAttorneyCount,
    },
    dateModified: new Date().toISOString().split('T')[0],
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Attorneys', url: '/attorneys' },
    { name: service.name, url: `/attorneys/${specialtySlug}` },
    { name: location.name, url: `/attorneys/${specialtySlug}/${locationSlug}` },
    { name: 'All', url: `/attorneys/${specialtySlug}/${locationSlug}/all` },
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
            { label: 'All' },
          ]} />
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
