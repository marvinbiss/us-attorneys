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

  const seed = Math.abs(hashCode(`best-${slug}-${locSlug}`))
  const year = new Date().getFullYear()
  const naturalTerm = getNaturalTerm(slug)

  const titles = [
    `Best ${specialtyName} Lawyers in ${locationName} — Top Rated ${year}`,
    `Top ${specialtyName} Attorneys in ${locationName}${deptCode ? ` (${deptCode})` : ''}`,
    `${locationName} Best ${specialtyName} — ${count}+ Rated Attorneys`,
    `Top Rated ${naturalTerm.plural} in ${locationName} — ${year}`,
    `Best ${specialtyName} in ${locationName} — Awards & Ratings`,
  ]

  const descs = [
    `Compare the best ${specialtyName.toLowerCase()} attorneys in ${locationName}. Ratings, Super Lawyers, Avvo scores and client reviews. ${count} verified pros.`,
    `Top-rated ${specialtyName.toLowerCase()}s in ${locationName}${deptCode ? ` (${deptCode})` : ''}. Award-winning attorneys with proven track records.`,
    `Find the highest-rated ${specialtyName.toLowerCase()} in ${locationName}. Peer reviews, bar certifications and client testimonials.`,
    `${locationName}'s best ${specialtyName.toLowerCase()} attorneys ranked by ratings, awards and outcomes. Free consultation.`,
    `${count}+ top-rated ${specialtyName.toLowerCase()}s in ${locationName}. Super Lawyers, Avvo 10.0 and Martindale-Hubbell rated. Compare now.`,
  ]

  const title = truncateTitle(titles[seed % titles.length])
  const description = descs[seed % descs.length]
  const canonical = `${SITE_URL}/best/${slug}/${locSlug}`

  return {
    title,
    description,
    robots: { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const },
    openGraph: { title, description, type: 'website', locale: 'en_US', images: [{ url: getServiceImage(slug).src, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [getServiceImage(slug).src] },
    alternates: { canonical },
  }
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function BestAttorneysPage({ params }: PageProps) {
  const { specialty: slug, location: locSlug } = await params

  // Resolve specialty
  let service: Service
  try {
    service = await getSpecialtyBySlug(slug)
    if (!service) {
      const s = staticPracticeAreas.find(p => p.slug === slug)
      if (!s) notFound()
      service = { id: '', name: s.name, slug: s.slug, is_active: true, created_at: '' }
    }
  } catch {
    const s = staticPracticeAreas.find(p => p.slug === slug)
    if (!s) notFound()
    service = { id: '', name: s.name, slug: s.slug, is_active: true, created_at: '' }
  }

  // Resolve location
  let location: LocationType
  try {
    const db = await getLocationBySlug(locSlug)
    if (!db) { const f = cityToLocation(locSlug); if (!f) notFound(); location = f }
    else location = { ...db, id: (db as Record<string, unknown>).code_insee as string || '' }
  } catch {
    const f = cityToLocation(locSlug); if (!f) notFound(); location = f
  }

  // Fetch providers
  const [providers, totalCount] = await Promise.all([
    getAttorneysByServiceAndLocation(slug, locSlug),
    getAttorneyCountByServiceAndLocation(slug, locSlug).catch(() => 0),
  ])

  const year = new Date().getFullYear()
  const seed = Math.abs(hashCode(`best-${slug}-${locSlug}`))
  const naturalTerm = getNaturalTerm(slug)
  const svcLower = service.name.toLowerCase()

  const h1Variants = [
    `Top Rated ${service.name} Attorneys in ${location.name}, ${location.department_code || ''}`,
    `Best ${naturalTerm.plural} in ${location.name} — ${year}`,
    `${location.name}'s Highest Rated ${service.name} Lawyers`,
    `Award-Winning ${service.name} Attorneys in ${location.name}`,
    `Top ${service.name} Lawyers in ${location.name}${location.department_code ? ` (${location.department_code})` : ''}`,
  ]
  const h1 = h1Variants[seed % h1Variants.length]

  // JSON-LD
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Best Attorneys', url: '/best' },
    { name: service.name, url: `/best/${slug}` },
    { name: location.name, url: `/best/${slug}/${locSlug}` },
  ])

  const itemListSchema = providers.length > 0
    ? getItemListSchema({
        name: `Best ${service.name} in ${location.name}`,
        description: `Top-rated ${svcLower}s in ${location.name}`,
        url: `/best/${slug}/${locSlug}`,
        items: providers.slice(0, 20).map((p, i) => ({
          name: p.name,
          url: getAttorneyUrl({ stable_id: p.stable_id, slug: p.slug, specialty: p.specialty?.name, city: p.address_city }),
          position: i + 1,
          image: getServiceImage(slug).src,
          rating: p.rating_average ?? undefined,
          reviewCount: p.review_count ?? undefined,
        })),
      })
    : null

  const speakableSchema = getSpeakableSchema({
    url: `${SITE_URL}/best/${slug}/${locSlug}`,
    title: h1,
  })

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
            { label: 'Best Attorneys', href: '/best' },
            { label: service.name, href: `/best/${slug}` },
            { label: location.name },
          ]} />
        </div>
      </div>

      <section className="bg-gradient-to-b from-yellow-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900">{h1}</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl">
            We analyzed ratings, awards, peer reviews and case outcomes to identify the top {svcLower} attorneys serving {location.name}{location.department_code ? `, ${location.department_code}` : ''}. {totalCount > 0 ? `${totalCount} verified attorneys available.` : 'Directory actively growing.'}
          </p>
        </div>
      </section>

      {/* Rating Criteria */}
      <section className="py-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How We Rank the Best {service.name} Attorneys</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { title: 'Peer Reviews', desc: 'Ratings from other attorneys who know their work firsthand.' },
              { title: 'Client Ratings', desc: 'Verified client reviews and satisfaction scores.' },
              { title: 'Awards & Recognition', desc: 'Super Lawyers, Best Lawyers, Avvo ratings and state bar honors.' },
              { title: 'Case Outcomes', desc: 'Win rates, settlement amounts and trial experience.' },
            ].map((item) => (
              <div key={item.title} className="p-5 rounded-lg border border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
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
            {providers.length > 0 ? `Top ${Math.min(providers.length, 20)} ${service.name} Attorneys in ${location.name}` : `${service.name} Attorneys in ${location.name}`}
          </h2>
          {providers.length > 0 ? (
            <div className="grid gap-4">
              {(providers as Provider[]).slice(0, 20).map((p, idx) => (
                <Link
                  key={p.stable_id || idx}
                  href={getAttorneyUrl({ stable_id: p.stable_id, slug: p.slug, specialty: p.specialty?.name, city: p.address_city })}
                  className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all bg-white"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.address_city}{p.address_county ? `, ${p.address_county}` : ''}</p>
                  </div>
                  {p.rating_average != null && (
                    <span className="text-sm font-semibold text-yellow-600">★ {p.rating_average.toFixed(1)}</span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">We are actively building our directory of top-rated {svcLower} attorneys in {location.name}. Check back soon or explore nearby cities below.</p>
          )}
        </div>
      </section>

      {/* Nearby Cities */}
      {(nearbyCities.length > 0 || stateCities.length > 0) && (
        <section className="py-10 bg-gray-50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Best {service.name} Attorneys Nearby</h2>
            <div className="flex flex-wrap gap-2">
              {[...nearbyCities, ...stateCities].slice(0, 12).map(c => (
                <Link key={c.slug} href={`/best/${slug}/${c.slug}`} className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm hover:border-blue-300 hover:text-blue-700 transition-colors">
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CrossIntentLinks
        service={slug}
        specialtyName={service.name}
        city={locSlug}
        cityName={location.name}
        currentIntent="reviews"
      />
    </>
  )
}
