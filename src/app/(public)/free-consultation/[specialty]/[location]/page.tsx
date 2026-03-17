import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getSpecialtyBySlug,
  getLocationBySlug,
  getAttorneysByServiceAndLocation,
  getAttorneyCountByServiceAndLocation,
} from '@/lib/supabase'
import { getBreadcrumbSchema, getItemListSchema, getSpeakableSchema } from '@/lib/seo/jsonld'
import Breadcrumb from '@/components/Breadcrumb'
import CrossIntentLinks from '@/components/seo/CrossIntentLinks'
import { getAttorneyUrl } from '@/lib/utils'
import { getServiceImage } from '@/lib/data/images'
import {
  practiceAreas as staticPracticeAreas,
  cities,
  getCityBySlug,
  getNearbyCities,
  getCitiesByState,
  getStateByCode,
} from '@/lib/data/usa'
import { isZipSlug, getNearbyZipCodes } from '@/lib/location-resolver'
import { SITE_URL } from '@/lib/seo/config'
import { hashCode } from '@/lib/seo/location-content'
import { getNaturalTerm } from '@/lib/seo/natural-terms'
import type { Service, Location as LocationType, Provider } from '@/types'
import { REVALIDATE } from '@/lib/cache'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

function truncateTitle(title: string, maxLen = 55): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

// ---------------------------------------------------------------------------
// ISR
// ---------------------------------------------------------------------------

export const revalidate = REVALIDATE.serviceLocation
export const dynamicParams = true

// Pre-render: 1 seed only — ISR 24h handles the rest
const TOP_CITIES = 1
const TOP_PA = 1
export function generateStaticParams() {
  const topCities = cities.slice(0, TOP_CITIES)
  const topPAs = staticPracticeAreas.slice(0, TOP_PA)
  return topPAs.flatMap(pa =>
    topCities.map(c => ({ specialty: pa.slug, location: c.slug }))
  )
}

// ---------------------------------------------------------------------------
// Resolve helpers
// ---------------------------------------------------------------------------

function cityToLocation(slug: string): LocationType | null {
  const c = getCityBySlug(slug)
  if (!c) return null
  return {
    id: '',
    name: c.name,
    slug: c.slug,
    postal_code: c.zipCode,
    region_name: getStateByCode(c.stateCode)?.region || '',
    department_name: c.stateName,
    department_code: c.stateCode,
    is_active: true,
    created_at: '',
  }
}

interface PageProps {
  params: Promise<{ specialty: string; location: string }>
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { specialty: slug, location: locSlug } = await params

  let specialtyName = ''
  let locationName = ''
  let deptCode = ''
  let count = 1

  try {
    const [svc, loc, cnt] = await Promise.all([
      getSpecialtyBySlug(slug),
      getLocationBySlug(locSlug) as Promise<LocationType | null>,
      getAttorneyCountByServiceAndLocation(slug, locSlug),
    ])
    if (svc) specialtyName = svc.name
    if (loc) { locationName = loc.name; deptCode = loc.department_code || '' }
    count = cnt
  } catch {
    const s = staticPracticeAreas.find(p => p.slug === slug)
    const c = getCityBySlug(locSlug)
    if (s) specialtyName = s.name
    if (c) { locationName = c.name; deptCode = c.stateCode }
  }

  if (!specialtyName || !locationName) {
    return { title: 'Not Found', robots: { index: false, follow: false } }
  }

  const seed = Math.abs(hashCode(`consult-${slug}-${locSlug}`))
  const svcLower = specialtyName.toLowerCase()
  const naturalTerm = getNaturalTerm(slug)

  const titles = [
    `Free ${specialtyName} Consultation in ${locationName} — No Fee`,
    `${specialtyName} Free Consult ${locationName}${deptCode ? ` (${deptCode})` : ''}`,
    `Free ${naturalTerm.singular} Consultation — ${locationName}`,
    `No-Cost ${specialtyName} Consultation in ${locationName}`,
    `${locationName} ${specialtyName} — Free Initial Consultation`,
  ]

  const descs = [
    `Get a free ${svcLower} consultation in ${locationName}. ${count} attorneys offer no-cost initial meetings. No obligation, no hidden fees.`,
    `Free initial consultation with a ${svcLower} in ${locationName}${deptCode ? ` (${deptCode})` : ''}. Many work on contingency — you pay nothing unless you win.`,
    `${count} ${svcLower}s in ${locationName} offering free consultations. Compare, ask questions and get legal advice at no cost.`,
    `Need a ${svcLower} in ${locationName}? Request a free consultation today. No upfront fees, no obligation.`,
    `Free ${svcLower} consultation in ${locationName}. Discuss your case with a qualified attorney at zero cost.`,
  ]

  const title = truncateTitle(titles[seed % titles.length])
  const description = descs[seed % descs.length]

  return {
    title,
    description,
    robots: { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const },
    openGraph: { title, description, type: 'website', locale: 'en_US', images: [{ url: getServiceImage(slug).src, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [getServiceImage(slug).src] },
    alternates: { canonical: `${SITE_URL}/free-consultation/${slug}/${locSlug}` },
  }
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function FreeConsultationPage({ params }: PageProps) {
  const { specialty: slug, location: locSlug } = await params

  let service: Service
  try {
    service = await getSpecialtyBySlug(slug)
    if (!service) { const s = staticPracticeAreas.find(p => p.slug === slug); if (!s) notFound(); service = { id: '', name: s.name, slug: s.slug, is_active: true, created_at: '' } }
  } catch { const s = staticPracticeAreas.find(p => p.slug === slug); if (!s) notFound(); service = { id: '', name: s.name, slug: s.slug, is_active: true, created_at: '' } }

  let location: LocationType
  try {
    const db = await getLocationBySlug(locSlug)
    if (!db) { const f = cityToLocation(locSlug); if (!f) notFound(); location = f }
    else location = { ...db, id: (db as Record<string, unknown>).code_insee as string || '' }
  } catch { const f = cityToLocation(locSlug); if (!f) notFound(); location = f }

  const [providers, totalCount] = await Promise.all([
    getAttorneysByServiceAndLocation(slug, locSlug),
    getAttorneyCountByServiceAndLocation(slug, locSlug).catch(() => 0),
  ])

  const seed = Math.abs(hashCode(`consult-${slug}-${locSlug}`))
  const naturalTerm = getNaturalTerm(slug)
  const svcLower = service.name.toLowerCase()

  const h1Variants = [
    `Free ${service.name} Attorney Consultation in ${location.name}`,
    `No-Cost ${service.name} Legal Consultation — ${location.name}`,
    `Get Free ${naturalTerm.singular} Advice in ${location.name}`,
    `Free ${service.name} Consultation in ${location.name}${location.department_code ? `, ${location.department_code}` : ''}`,
    `Consult a ${service.name} Attorney for Free in ${location.name}`,
  ]
  const h1 = h1Variants[seed % h1Variants.length]

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Free Consultation', url: '/free-consultation' },
    { name: service.name, url: `/free-consultation/${slug}` },
    { name: location.name, url: `/free-consultation/${slug}/${locSlug}` },
  ])

  const itemListSchema = providers.length > 0
    ? getItemListSchema({
        name: `Free ${service.name} Consultation in ${location.name}`,
        description: `Attorneys offering free ${svcLower} consultations in ${location.name}`,
        url: `/free-consultation/${slug}/${locSlug}`,
        items: providers.slice(0, 20).map((p, i) => ({
          name: p.name,
          url: getAttorneyUrl({ stable_id: p.stable_id, slug: p.slug, specialty: p.specialty, city: p.address_city }),
          position: i + 1,
          image: getServiceImage(slug).src,
          rating: p.rating_average ?? undefined,
          reviewCount: p.review_count ?? undefined,
        })),
      })
    : null

  const speakableSchema = getSpeakableSchema({ url: `${SITE_URL}/free-consultation/${slug}/${locSlug}`, title: h1 })
  const schemas: Record<string, unknown>[] = [breadcrumbSchema, speakableSchema, ...(itemListSchema ? [itemListSchema] : [])]

  const nearbyCities = isZipSlug(locSlug)
    ? await getNearbyZipCodes(locSlug, 8)
    : getNearbyCities(locSlug, 8)
  const stateCities = location.department_code ? getCitiesByState(location.department_code).filter(c => c.slug !== locSlug).slice(0, 6) : []

  return (
    <>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(s) }} />
      ))}

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumb items={[
            { label: 'Free Consultation', href: '/free-consultation' },
            { label: service.name, href: `/free-consultation/${slug}` },
            { label: location.name },
          ]} />
        </div>
      </div>

      <section className="bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900">{h1}</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl">
            Many {svcLower} attorneys in {location.name} offer free initial consultations. This is your opportunity to discuss your case, understand your legal options and get a fee estimate — all at no cost. {totalCount > 0 ? `${totalCount} attorneys available.` : ''}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-semibold">
            <span>$0</span>
            <span>No upfront cost &middot; No obligation &middot; 100% confidential</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How the Free Consultation Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Choose an Attorney', desc: `Browse ${svcLower} attorneys in ${location.name} and select one based on ratings and experience.` },
              { step: '2', title: 'Request a Consultation', desc: 'Fill out a brief form or call directly. Most attorneys respond within 24 hours.' },
              { step: '3', title: 'Get Legal Advice', desc: 'Discuss your situation, learn about your rights and get a clear fee structure — no cost, no pressure.' },
            ].map(item => (
              <div key={item.step} className="p-5 rounded-lg border border-gray-200 bg-gray-50">
                <span className="inline-block w-8 h-8 rounded-full bg-green-600 text-white text-center leading-8 font-bold text-sm mb-3">{item.step}</span>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fee Structures */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Fee Structures for {service.name}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Contingency Fee', desc: 'You pay nothing unless you win. Common for personal injury, wrongful death and employment cases.', highlight: 'No Win = No Fee' },
              { title: 'Flat Fee', desc: 'A fixed price for specific legal services like document review, simple filings or consultations.', highlight: 'Predictable Cost' },
              { title: 'Hourly Rate', desc: 'Billed per hour of work. Common for complex litigation, business law and criminal defense.', highlight: 'Pay As You Go' },
            ].map(item => (
              <div key={item.title} className="p-5 rounded-lg border border-gray-200 bg-white">
                <span className="text-xs font-semibold text-green-700 uppercase">{item.highlight}</span>
                <h3 className="font-semibold text-gray-900 mt-2">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Attorney Listings */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {service.name} Attorneys Offering Free Consultations in {location.name}
          </h2>
          {providers.length > 0 ? (
            <div className="grid gap-4">
              {(providers as Provider[]).slice(0, 20).map((p, idx) => (
                <Link
                  key={p.stable_id || idx}
                  href={getAttorneyUrl({ stable_id: p.stable_id, slug: p.slug, specialty: p.specialty, city: p.address_city })}
                  className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all bg-white"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.address_city}{p.address_department ? `, ${p.address_department}` : ''}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold whitespace-nowrap">Free Consult</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Our directory of {svcLower} attorneys offering free consultations in {location.name} is growing. Explore nearby cities below.</p>
          )}
        </div>
      </section>

      {(nearbyCities.length > 0 || stateCities.length > 0) && (
        <section className="py-10 bg-gray-50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Free {service.name} Consultations Nearby</h2>
            <div className="flex flex-wrap gap-2">
              {[...nearbyCities, ...stateCities].slice(0, 12).map(c => (
                <Link key={c.slug} href={`/free-consultation/${slug}/${c.slug}`} className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm hover:border-green-300 hover:text-green-700 transition-colors">
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CrossIntentLinks service={slug} specialtyName={service.name} city={locSlug} cityName={location.name} currentIntent="services" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonStringify({
            '@context': 'https://schema.org',
            '@type': 'LegalService',
            name: h1,
            description: `Free ${svcLower} consultation in ${location.name}. No upfront cost, no obligation.`,
            url: `${SITE_URL}/free-consultation/${slug}/${locSlug}`,
            areaServed: {
              '@type': 'City',
              name: location.name,
            },
            isPartOf: {
              '@type': 'WebSite',
              name: 'Lawtendr',
              url: 'https://lawtendr.com',
            },
            mainEntity: {
              '@type': 'CollectionPage',
              name: `${service.name} Attorneys Offering Free Consultations in ${location.name}`,
              numberOfItems: providers.length,
            },
          }),
        }}
      />
    </>
  )
}
