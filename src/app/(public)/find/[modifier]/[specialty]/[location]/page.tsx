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

function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}

function truncateTitle(title: string, maxLen = 55): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export const revalidate = REVALIDATE.serviceLocation
export const dynamicParams = true

// ---------------------------------------------------------------------------
// Modifier definitions (demographic filters)
// ---------------------------------------------------------------------------

const validModifiers: Record<string, { label: string; adjective: string; why: string }> = {
  'female': { label: 'Female', adjective: 'Female', why: 'Some clients feel more comfortable discussing sensitive matters with a female attorney. Female attorneys bring diverse perspectives to legal strategy.' },
  'male': { label: 'Male', adjective: 'Male', why: 'Some clients prefer working with a male attorney based on personal comfort or case-specific considerations.' },
  'spanish-speaking': { label: 'Spanish-Speaking', adjective: 'Spanish-Speaking', why: 'A Spanish-speaking attorney ensures clear communication and cultural understanding, critical for legal accuracy.' },
  'chinese-speaking': { label: 'Chinese-Speaking', adjective: 'Chinese-Speaking', why: 'Mandarin or Cantonese-speaking attorneys serve the Chinese-American community with precision in legal terminology.' },
  'korean-speaking': { label: 'Korean-Speaking', adjective: 'Korean-Speaking', why: 'Korean-speaking attorneys bridge language and cultural gaps for Korean-American clients.' },
  'vietnamese-speaking': { label: 'Vietnamese-Speaking', adjective: 'Vietnamese-Speaking', why: 'Vietnamese-speaking attorneys ensure accurate communication for the Vietnamese-American community.' },
  'black': { label: 'Black', adjective: 'Black', why: 'Black attorneys bring lived experience and cultural understanding that can be valuable in navigating the legal system.' },
  'latino': { label: 'Latino', adjective: 'Latino', why: 'Latino attorneys understand the cultural nuances and challenges facing the Hispanic community.' },
  'asian': { label: 'Asian', adjective: 'Asian', why: 'Asian-American attorneys bring diverse cultural perspectives and may better understand community-specific legal needs.' },
  'lgbtq-friendly': { label: 'LGBTQ-Friendly', adjective: 'LGBTQ-Friendly', why: 'LGBTQ-friendly attorneys are knowledgeable about issues specific to the LGBTQ community including discrimination, family law and name changes.' },
  'veteran': { label: 'Veteran', adjective: 'Veteran', why: 'Attorneys who are military veterans understand the unique legal challenges facing service members and veterans.' },
  'young': { label: 'Young', adjective: 'Young', why: 'Younger attorneys often bring fresh perspectives, tech-savvy approaches and competitive rates.' },
  'experienced': { label: 'Experienced', adjective: 'Experienced', why: 'Attorneys with decades of experience have deep knowledge of case law, judicial preferences and negotiation strategies.' },
}

function getModifier(slug: string) {
  return validModifiers[slug] || null
}

// All ISR — no pre-rendering for demographic pages
export function generateStaticParams() {
  return [{ modifier: 'female', specialty: 'personal-injury', location: 'houston' }]
}

function cityToLocation(slug: string): LocationType | null {
  const c = getCityBySlug(slug)
  if (!c) return null
  return { id: '', name: c.name, slug: c.slug, postal_code: c.zipCode, region_name: getStateByCode(c.stateCode)?.region || '', department_name: c.stateName, department_code: c.stateCode, is_active: true, created_at: '' }
}

interface PageProps { params: Promise<{ modifier: string; specialty: string; location: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { modifier: modSlug, specialty: slug, location: locSlug } = await params

  const mod = getModifier(modSlug)
  if (!mod) return { title: 'Not Found', robots: { index: false, follow: false } }

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

  const seed = Math.abs(hashCode(`demo-${modSlug}-${slug}-${locSlug}`))
  const svcLower = specialtyName.toLowerCase()

  const titles = [
    `${mod.adjective} ${specialtyName} Attorney in ${locationName}`,
    `Find a ${mod.adjective} ${specialtyName} Lawyer — ${locationName}`,
    `${mod.adjective} ${specialtyName} in ${locationName}${deptCode ? ` (${deptCode})` : ''}`,
    `${locationName} ${mod.adjective} ${specialtyName} Attorneys`,
    `${mod.adjective} ${specialtyName} Lawyers Near ${locationName}`,
  ]

  const descs = [
    `Find a ${mod.adjective.toLowerCase()} ${svcLower} attorney in ${locationName}. ${count} verified attorneys. ${mod.why}`,
    `${mod.adjective} ${svcLower} attorneys in ${locationName}${deptCode ? ` (${deptCode})` : ''}. Compare profiles, ratings and experience.`,
    `Looking for a ${mod.adjective.toLowerCase()} ${svcLower} in ${locationName}? Browse verified attorneys matching your criteria.`,
    `${count} ${svcLower} attorneys in ${locationName}. Filter by ${mod.label.toLowerCase()} attorneys. Free consultation available.`,
    `Connect with a ${mod.adjective.toLowerCase()} ${svcLower} attorney in ${locationName}. Verified, bar-licensed professionals.`,
  ]

  const title = truncateTitle(titles[seed % titles.length])
  const description = descs[seed % descs.length]

  return {
    title, description,
    robots: { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const },
    openGraph: { title, description, type: 'website', locale: 'en_US', images: [{ url: getServiceImage(slug).src, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [getServiceImage(slug).src] },
    alternates: { canonical: `${SITE_URL}/find/${modSlug}/${slug}/${locSlug}` },
  }
}

export default async function DemographicPage({ params }: PageProps) {
  const { modifier: modSlug, specialty: slug, location: locSlug } = await params

  const mod = getModifier(modSlug)
  if (!mod) notFound()

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

  const seed = Math.abs(hashCode(`demo-${modSlug}-${slug}-${locSlug}`))
  const naturalTerm = getNaturalTerm(slug)
  const svcLower = service.name.toLowerCase()

  const h1Variants = [
    `Find a ${mod.adjective} ${service.name} Lawyer in ${location.name}, ${location.department_code || ''}`,
    `${mod.adjective} ${naturalTerm.plural} in ${location.name}`,
    `${mod.adjective} ${service.name} Attorneys — ${location.name}`,
    `Find ${mod.adjective} ${service.name} Help in ${location.name}`,
    `${location.name} ${mod.adjective} ${service.name} Lawyers`,
  ]
  const h1 = h1Variants[seed % h1Variants.length]

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: `Find — ${mod.label}`, url: `/find/${modSlug}` },
    { name: service.name, url: `/find/${modSlug}/${slug}` },
    { name: location.name, url: `/find/${modSlug}/${slug}/${locSlug}` },
  ])
  const itemListSchema = providers.length > 0
    ? getItemListSchema({ name: `${mod.adjective} ${service.name} in ${location.name}`, description: `${mod.adjective} ${svcLower}s in ${location.name}`, url: `/find/${modSlug}/${slug}/${locSlug}`, items: providers.slice(0, 20).map((p, i) => ({ name: p.name, url: getAttorneyUrl({ stable_id: p.stable_id, slug: p.slug, specialty: p.specialty, city: p.address_city }), position: i + 1, image: getServiceImage(slug).src, rating: p.rating_average ?? undefined, reviewCount: p.review_count ?? undefined })) })
    : null
  const speakableSchema = getSpeakableSchema({ url: `${SITE_URL}/find/${modSlug}/${slug}/${locSlug}`, title: h1 })
  const schemas: Record<string, unknown>[] = [breadcrumbSchema, speakableSchema, ...(itemListSchema ? [itemListSchema] : [])]

  const nearbyCities = isZipSlug(locSlug)
    ? await getNearbyZipCodes(locSlug, 8)
    : getNearbyCities(locSlug, 8)
  const stateCities = location.department_code ? getCitiesByState(location.department_code).filter(c => c.slug !== locSlug).slice(0, 6) : []

  return (
    <>
      {schemas.map((s, i) => (<script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(s) }} />))}

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumb items={[{ label: `Find ${mod.label}`, href: `/find/${modSlug}` }, { label: service.name, href: `/find/${modSlug}/${slug}` }, { label: location.name }]} />
        </div>
      </div>

      <section className="bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900">{h1}</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl">
            {mod.why} Browse {svcLower} attorneys in {location.name} and find the right match for your legal needs. {totalCount > 0 ? `${totalCount} verified attorneys in our directory.` : ''}
          </p>
        </div>
      </section>

      {/* Why This Matters */}
      <section className="py-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose a {mod.adjective} Attorney?</h2>
          <div className="prose prose-gray max-w-3xl">
            <p>{mod.why}</p>
            <p>The attorney-client relationship is built on trust and open communication. Finding a lawyer who understands your background and perspective can make a meaningful difference in your case outcome and overall experience.</p>
            <p>All attorneys in our directory are bar-verified and licensed to practice in {location.department_name || location.name}. We verify credentials through official state bar records.</p>
          </div>
        </div>
      </section>

      {/* Attorney Listings */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{service.name} Attorneys in {location.name}</h2>
          {providers.length > 0 ? (
            <div className="grid gap-4">
              {(providers as Provider[]).slice(0, 20).map((p, idx) => (
                <Link key={p.stable_id || idx} href={getAttorneyUrl({ stable_id: p.stable_id, slug: p.slug, specialty: p.specialty, city: p.address_city })} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all bg-white">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.address_city}{p.address_county ? `, ${p.address_county}` : ''}</p>
                  </div>
                  {p.rating_average != null && <span className="text-sm font-semibold text-indigo-600">★ {p.rating_average.toFixed(1)}</span>}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">We are building our directory of {mod.adjective.toLowerCase()} {svcLower} attorneys in {location.name}. Try nearby cities below.</p>
          )}
        </div>
      </section>

      {/* Other Modifiers */}
      <section className="py-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Other Filters for {service.name} in {location.name}</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(validModifiers).filter(([k]) => k !== modSlug).slice(0, 8).map(([k, v]) => (
              <Link key={k} href={`/find/${k}/${slug}/${locSlug}`} className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm hover:border-indigo-300 hover:text-indigo-700 transition-colors">{v.label}</Link>
            ))}
          </div>
        </div>
      </section>

      {(nearbyCities.length > 0 || stateCities.length > 0) && (
        <section className="py-10 bg-gray-50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{mod.adjective} {service.name} Nearby</h2>
            <div className="flex flex-wrap gap-2">
              {[...nearbyCities, ...stateCities].slice(0, 12).map(c => (
                <Link key={c.slug} href={`/find/${modSlug}/${slug}/${c.slug}`} className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm hover:border-indigo-300 hover:text-indigo-700 transition-colors">{c.name}</Link>
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
            '@type': 'CollectionPage',
            name: h1,
            description: `${mod.adjective} ${svcLower} attorneys in ${location.name}. Compare profiles, ratings and experience.`,
            url: `${SITE_URL}/find/${modSlug}/${slug}/${locSlug}`,
            isPartOf: {
              '@type': 'WebSite',
              name: 'Lawtendr',
              url: 'https://lawtendr.com',
            },
          }),
        }}
      />
    </>
  )
}
