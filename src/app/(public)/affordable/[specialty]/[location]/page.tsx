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
import { SITE_URL } from '@/lib/seo/config'
import { hashCode } from '@/lib/seo/location-content'
import { getNaturalTerm } from '@/lib/seo/natural-terms'
import type { Service, Location as LocationType, Provider } from '@/types'
import { REVALIDATE } from '@/lib/cache'

function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}

function truncateTitle(title: string, maxLen = 55): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export const revalidate = REVALIDATE.serviceLocation
export const dynamicParams = true

const TOP_CITIES = 1
const TOP_PA = 1
export function generateStaticParams() {
  return staticPracticeAreas.slice(0, TOP_PA).flatMap(pa =>
    cities.slice(0, TOP_CITIES).map(c => ({ specialty: pa.slug, location: c.slug }))
  )
}

function cityToLocation(slug: string): LocationType | null {
  const c = getCityBySlug(slug)
  if (!c) return null
  return { id: '', name: c.name, slug: c.slug, postal_code: c.zipCode, region_name: getStateByCode(c.stateCode)?.region || '', department_name: c.stateName, department_code: c.stateCode, is_active: true, created_at: '' }
}

interface PageProps { params: Promise<{ specialty: string; location: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { specialty: slug, location: locSlug } = await params

  let specialtyName = '', locationName = '', deptCode = '', count = 1
  try {
    const [svc, loc, cnt] = await Promise.all([getSpecialtyBySlug(slug), getLocationBySlug(locSlug) as Promise<LocationType | null>, getAttorneyCountByServiceAndLocation(slug, locSlug)])
    if (svc) specialtyName = svc.name
    if (loc) { locationName = loc.name; deptCode = loc.department_code || '' }
    count = cnt
  } catch {
    const s = staticPracticeAreas.find(p => p.slug === slug); const c = getCityBySlug(locSlug)
    if (s) specialtyName = s.name; if (c) { locationName = c.name; deptCode = c.stateCode }
  }

  if (!specialtyName || !locationName) return { title: 'Not Found', robots: { index: false, follow: false } }

  const seed = Math.abs(hashCode(`afford-${slug}-${locSlug}`))
  const svcLower = specialtyName.toLowerCase()

  const titles = [
    `Affordable ${specialtyName} Attorney in ${locationName}`,
    `Budget-Friendly ${specialtyName} Lawyers — ${locationName}`,
    `Low-Cost ${specialtyName} in ${locationName}${deptCode ? ` (${deptCode})` : ''}`,
    `${specialtyName} on a Budget — ${locationName} Attorneys`,
    `Affordable ${specialtyName} Help in ${locationName}`,
  ]

  const descs = [
    `Find affordable ${svcLower} attorneys in ${locationName}. Sliding scale fees, payment plans and budget-friendly legal help. ${count} verified attorneys.`,
    `Need a ${svcLower} but worried about cost? ${locationName} attorneys offering payment plans and reduced fees.`,
    `Affordable ${svcLower} services in ${locationName}${deptCode ? ` (${deptCode})` : ''}. Compare fees, find sliding-scale options and payment plans.`,
    `Budget-friendly ${svcLower}s in ${locationName}. Don't let cost prevent you from getting legal help.`,
    `${count} ${svcLower} attorneys in ${locationName} with affordable fee options. Payment plans available.`,
  ]

  const title = truncateTitle(titles[seed % titles.length])
  const description = descs[seed % descs.length]

  return {
    title, description,
    robots: { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const },
    openGraph: { title, description, type: 'website', locale: 'en_US', images: [{ url: getServiceImage(slug).src, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [getServiceImage(slug).src] },
    alternates: { canonical: `${SITE_URL}/affordable/${slug}/${locSlug}` },
  }
}

export default async function AffordablePage({ params }: PageProps) {
  const { specialty: slug, location: locSlug } = await params

  let service: Service
  try { service = await getSpecialtyBySlug(slug); if (!service) { const s = staticPracticeAreas.find(p => p.slug === slug); if (!s) notFound(); service = { id: '', name: s.name, slug: s.slug, is_active: true, created_at: '' } } }
  catch { const s = staticPracticeAreas.find(p => p.slug === slug); if (!s) notFound(); service = { id: '', name: s.name, slug: s.slug, is_active: true, created_at: '' } }

  let location: LocationType
  try { const db = await getLocationBySlug(locSlug); if (!db) { const f = cityToLocation(locSlug); if (!f) notFound(); location = f } else location = { ...db, id: (db as Record<string, unknown>).code_insee as string || '' } }
  catch { const f = cityToLocation(locSlug); if (!f) notFound(); location = f }

  const [providers, totalCount] = await Promise.all([
    getAttorneysByServiceAndLocation(slug, locSlug),
    getAttorneyCountByServiceAndLocation(slug, locSlug).catch(() => 0),
  ])

  const seed = Math.abs(hashCode(`afford-${slug}-${locSlug}`))
  const svcLower = service.name.toLowerCase()
  const naturalTerm = getNaturalTerm(slug)

  const h1Variants = [
    `Affordable ${service.name} Attorney in ${location.name}`,
    `Budget-Friendly ${naturalTerm.plural} in ${location.name}`,
    `Low-Cost ${service.name} Legal Help — ${location.name}${location.department_code ? `, ${location.department_code}` : ''}`,
    `${service.name} on a Budget in ${location.name}`,
    `Find Affordable ${service.name} in ${location.name}`,
  ]
  const h1 = h1Variants[seed % h1Variants.length]

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Affordable Attorneys', url: '/affordable' },
    { name: service.name, url: `/affordable/${slug}` },
    { name: location.name, url: `/affordable/${slug}/${locSlug}` },
  ])
  const itemListSchema = providers.length > 0
    ? getItemListSchema({ name: `Affordable ${service.name} in ${location.name}`, description: `Budget-friendly ${svcLower}s in ${location.name}`, url: `/affordable/${slug}/${locSlug}`, items: providers.slice(0, 20).map((p, i) => ({ name: p.name, url: getAttorneyUrl({ stable_id: p.stable_id, slug: p.slug, specialty: p.specialty, city: p.address_city }), position: i + 1, image: getServiceImage(slug).src, rating: p.rating_average ?? undefined, reviewCount: p.review_count ?? undefined })) })
    : null
  const speakableSchema = getSpeakableSchema({ url: `${SITE_URL}/affordable/${slug}/${locSlug}`, title: h1 })
  const schemas: Record<string, unknown>[] = [breadcrumbSchema, speakableSchema, ...(itemListSchema ? [itemListSchema] : [])]

  const nearbyCities = getNearbyCities(locSlug, 8)
  const stateCities = location.department_code ? getCitiesByState(location.department_code).filter(c => c.slug !== locSlug).slice(0, 6) : []

  return (
    <>
      {schemas.map((s, i) => (<script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(s) }} />))}

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumb items={[{ label: 'Affordable', href: '/affordable' }, { label: service.name, href: `/affordable/${slug}` }, { label: location.name }]} />
        </div>
      </div>

      <section className="bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900">{h1}</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl">
            Quality legal representation should not be out of reach. Find {svcLower} attorneys in {location.name} who offer sliding-scale fees, payment plans and competitive rates. {totalCount > 0 ? `${totalCount} verified attorneys available.` : ''}
          </p>
        </div>
      </section>

      {/* Cost-Saving Strategies */}
      <section className="py-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Reduce Your {service.name} Costs</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Payment Plans', desc: 'Many attorneys offer monthly installment plans to spread the cost over time.' },
              { title: 'Sliding Scale', desc: 'Fees adjusted based on your income level. Ask attorneys about income-based pricing.' },
              { title: 'Unbundled Services', desc: 'Pay only for specific tasks (document review, court appearances) instead of full representation.' },
              { title: 'Legal Aid Referrals', desc: 'If you qualify, attorneys can connect you with local legal aid organizations.' },
            ].map(item => (
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Affordable {service.name} Attorneys in {location.name}</h2>
          {providers.length > 0 ? (
            <div className="grid gap-4">
              {(providers as Provider[]).slice(0, 20).map((p, idx) => (
                <Link key={p.stable_id || idx} href={getAttorneyUrl({ stable_id: p.stable_id, slug: p.slug, specialty: p.specialty, city: p.address_city })} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all bg-white">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.address_city}{p.address_department ? `, ${p.address_department}` : ''}</p>
                  </div>
                  {p.rating_average != null && <span className="text-sm font-semibold text-blue-600">★ {p.rating_average.toFixed(1)}</span>}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">We are building our directory of affordable {svcLower} attorneys in {location.name}. Check nearby cities below.</p>
          )}
        </div>
      </section>

      {(nearbyCities.length > 0 || stateCities.length > 0) && (
        <section className="py-10 bg-gray-50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Affordable {service.name} Nearby</h2>
            <div className="flex flex-wrap gap-2">
              {[...nearbyCities, ...stateCities].slice(0, 12).map(c => (
                <Link key={c.slug} href={`/affordable/${slug}/${c.slug}`} className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm hover:border-blue-300 hover:text-blue-700 transition-colors">{c.name}</Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CrossIntentLinks service={slug} specialtyName={service.name} city={locSlug} cityName={location.name} currentIntent="pricing" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonStringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: h1,
            description: `Find affordable ${svcLower} attorneys in ${location.name}. Sliding scale fees, payment plans and budget-friendly legal help.`,
            url: `${SITE_URL}/affordable/${slug}/${locSlug}`,
            isPartOf: {
              '@type': 'WebSite',
              name: 'Lawtendr',
              url: 'https://lawtendr.com',
            },
            ...(providers.length > 0 ? {
              mainEntity: {
                '@type': 'ItemList',
                numberOfItems: providers.length,
                itemListElement: providers.slice(0, 20).map((p, i) => ({
                  '@type': 'ListItem',
                  position: i + 1,
                  name: p.name,
                  url: `${SITE_URL}${getAttorneyUrl({ stable_id: p.stable_id, slug: p.slug, specialty: p.specialty, city: p.address_city })}`,
                })),
              },
            } : {}),
          }),
        }}
      />
    </>
  )
}
