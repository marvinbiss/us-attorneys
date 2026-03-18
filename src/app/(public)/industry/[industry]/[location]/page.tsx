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
// Industry definitions
// ---------------------------------------------------------------------------

interface IndustryDef {
  slug: string
  name: string
  paSlug: string
  description: string
  legalNeeds: string[]
}

const industries: IndustryDef[] = [
  { slug: 'oil-field-injury', name: 'Oil Field Injury', paSlug: 'personal-injury', description: 'Oil field workers face unique hazards including explosions, chemical exposure and heavy machinery accidents.', legalNeeds: ['Workers compensation claims', 'Third-party liability suits', 'OSHA violation claims', 'Wrongful death cases'] },
  { slug: 'construction-injury', name: 'Construction Injury', paSlug: 'workers-compensation', description: 'Construction sites are among the most dangerous workplaces in America, with falls, struck-by and electrocution hazards.', legalNeeds: ['Scaffold accidents', 'Crane accidents', 'OSHA violation claims', 'Third-party liability'] },
  { slug: 'trucking-accident', name: 'Trucking Accident', paSlug: 'truck-accidents', description: 'Commercial truck accidents often involve multiple liable parties including drivers, carriers, shippers and manufacturers.', legalNeeds: ['FMCSA regulation violations', 'Hours of service violations', 'Cargo loading negligence', 'Commercial insurance claims'] },
  { slug: 'medical-industry', name: 'Medical Industry', paSlug: 'health-care-law', description: 'Healthcare providers face unique legal challenges from malpractice defense to regulatory compliance and licensing.', legalNeeds: ['Malpractice defense', 'HIPAA compliance', 'Licensing issues', 'Medicare/Medicaid fraud defense'] },
  { slug: 'tech-industry', name: 'Tech Industry', paSlug: 'intellectual-property', description: 'Technology companies need specialized legal guidance for IP protection, data privacy, employment and corporate matters.', legalNeeds: ['Patent prosecution and litigation', 'Trade secret protection', 'Data privacy compliance (CCPA/GDPR)', 'Employee non-compete agreements'] },
  { slug: 'real-estate-development', name: 'Real Estate Development', paSlug: 'real-estate-law', description: 'Real estate developers navigate complex zoning, permitting, financing and contract issues across jurisdictions.', legalNeeds: ['Zoning and land use approvals', 'Construction contracts', 'Environmental compliance', 'Financing and lending agreements'] },
  { slug: 'restaurant-hospitality', name: 'Restaurant & Hospitality', paSlug: 'business-law', description: 'Restaurants and hospitality businesses face regulatory, employment and liability challenges unique to the industry.', legalNeeds: ['Liquor license compliance', 'Wage and hour disputes', 'Premises liability', 'Health code violations'] },
  { slug: 'maritime-industry', name: 'Maritime Industry', paSlug: 'personal-injury', description: 'Maritime workers are covered under federal admiralty law, including the Jones Act and Longshore Act, not state workers comp.', legalNeeds: ['Jones Act claims', 'Longshore and Harbor Workers Compensation', 'Maintenance and cure', 'Unseaworthiness claims'] },
  { slug: 'agriculture-farming', name: 'Agriculture & Farming', paSlug: 'business-law', description: 'Agricultural operations face unique legal issues from land rights and water rights to pesticide liability and USDA regulation.', legalNeeds: ['Water rights disputes', 'USDA regulatory compliance', 'Pesticide exposure claims', 'Farm equipment liability'] },
  { slug: 'entertainment-media', name: 'Entertainment & Media', paSlug: 'entertainment-law', description: 'The entertainment industry requires specialized legal expertise in contracts, IP, talent representation and production.', legalNeeds: ['Talent contracts and negotiations', 'Copyright and licensing', 'Production liability', 'Defamation and right of publicity'] },
  { slug: 'banking-finance', name: 'Banking & Finance', paSlug: 'business-law', description: 'Financial institutions navigate complex regulatory environments at federal and state levels.', legalNeeds: ['Regulatory compliance (Dodd-Frank, BSA)', 'Securities litigation', 'Consumer lending compliance', 'Merger and acquisition due diligence'] },
  { slug: 'pharmaceutical', name: 'Pharmaceutical', paSlug: 'product-liability', description: 'Pharmaceutical companies and consumers face issues from drug approval to adverse effect litigation.', legalNeeds: ['Drug liability claims', 'FDA regulatory compliance', 'Clinical trial disputes', 'Mass tort and class action defense'] },
  { slug: 'transportation-logistics', name: 'Transportation & Logistics', paSlug: 'business-law', description: 'Transportation companies deal with federal regulations, accident liability and complex insurance requirements.', legalNeeds: ['DOT compliance', 'Cargo damage claims', 'Driver classification disputes', 'Commercial accident liability'] },
  { slug: 'mining-industry', name: 'Mining Industry', paSlug: 'personal-injury', description: 'Mining operations involve significant safety risks governed by MSHA regulations and state mining laws.', legalNeeds: ['MSHA violation claims', 'Black lung disease claims', 'Equipment malfunction liability', 'Environmental compliance'] },
  { slug: 'aviation-industry', name: 'Aviation Industry', paSlug: 'personal-injury', description: 'Aviation accidents and industry disputes involve complex federal regulations and international treaties.', legalNeeds: ['Aircraft accident liability', 'FAA regulatory matters', 'Pilot licensing disputes', 'Airport noise and environmental claims'] },
]

function getIndustry(slug: string): IndustryDef | null {
  return industries.find(i => i.slug === slug) || null
}

// All ISR — no pre-rendering for industry pages
export function generateStaticParams() {
  return [{ industry: 'oil-field-injury', location: 'houston' }]
}

function cityToLocation(slug: string): LocationType | null {
  const c = getCityBySlug(slug)
  if (!c) return null
  return { id: '', name: c.name, slug: c.slug, postal_code: c.zipCode, region_name: getStateByCode(c.stateCode)?.region || '', department_name: c.stateName, department_code: c.stateCode, is_active: true, created_at: '' }
}

interface PageProps { params: Promise<{ industry: string; location: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { industry: indSlug, location: locSlug } = await params

  const ind = getIndustry(indSlug)
  if (!ind) return { title: 'Not Found', robots: { index: false, follow: false } }

  let locationName = '', deptCode = '', count = 1
  try {
    const [loc, cnt] = await Promise.all([
      getLocationBySlug(locSlug) as Promise<LocationType | null>,
      getAttorneyCountByServiceAndLocation(ind.paSlug, locSlug),
    ])
    if (loc) { locationName = loc.name; deptCode = loc.department_code || '' }
    count = cnt
  } catch {
    const c = getCityBySlug(locSlug)
    if (c) { locationName = c.name; deptCode = c.stateCode }
  }

  if (!locationName) return { title: 'Not Found', robots: { index: false, follow: false } }

  const seed = Math.abs(hashCode(`ind-${indSlug}-${locSlug}`))
  const paName = staticPracticeAreas.find(p => p.slug === ind.paSlug)?.name || ind.name

  const titles = [
    `${ind.name} Attorneys in ${locationName} — Industry Specialists`,
    `${locationName} ${ind.name} Lawyers`,
    `${ind.name} Legal Help in ${locationName}${deptCode ? ` (${deptCode})` : ''}`,
    `Find ${ind.name} Attorneys — ${locationName}`,
    `${ind.name} in ${locationName} — Specialized Attorneys`,
  ]

  const descs = [
    `${ind.description} Find specialized ${paName.toLowerCase()} attorneys in ${locationName} who understand the ${ind.name.toLowerCase()} industry. ${count} verified attorneys.`,
    `${ind.name} legal specialists in ${locationName}${deptCode ? ` (${deptCode})` : ''}. Industry-specific expertise in ${ind.legalNeeds.slice(0, 2).join(', ').toLowerCase()}.`,
    `Need an attorney for ${ind.name.toLowerCase()} issues in ${locationName}? ${count} attorneys with industry experience. Free consultation.`,
    `Specialized ${ind.name.toLowerCase()} attorneys in ${locationName}. Understanding of industry regulations, risks and legal strategies.`,
    `${locationName} attorneys specializing in ${ind.name.toLowerCase()}. ${ind.description} Free consultation available.`,
  ]

  const title = truncateTitle(titles[seed % titles.length])
  const description = descs[seed % descs.length]

  return {
    title, description,
    robots: { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const },
    openGraph: { title, description, type: 'website', locale: 'en_US', images: [{ url: getServiceImage(ind.paSlug).src, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [getServiceImage(ind.paSlug).src] },
    alternates: { canonical: `${SITE_URL}/industry/${indSlug}/${locSlug}` },
  }
}

export default async function IndustryPage({ params }: PageProps) {
  const { industry: indSlug, location: locSlug } = await params

  const ind = getIndustry(indSlug)
  if (!ind) notFound()

  const paData = staticPracticeAreas.find(p => p.slug === ind.paSlug)
  const paName = paData?.name || ind.name

  let service: Service
  try { service = await getSpecialtyBySlug(ind.paSlug); if (!service) service = { id: '', name: paName, slug: ind.paSlug, is_active: true, created_at: '' } }
  catch { service = { id: '', name: paName, slug: ind.paSlug, is_active: true, created_at: '' } }

  let location: LocationType
  try { const db = await getLocationBySlug(locSlug); if (!db) { const f = cityToLocation(locSlug); if (!f) notFound(); location = f } else location = { ...db, id: (db as Record<string, unknown>).code_insee as string || '' } }
  catch { const f = cityToLocation(locSlug); if (!f) notFound(); location = f }

  const [providers, totalCount] = await Promise.all([
    getAttorneysByServiceAndLocation(ind.paSlug, locSlug),
    getAttorneyCountByServiceAndLocation(ind.paSlug, locSlug).catch(() => 0),
  ])

  const seed = Math.abs(hashCode(`ind-${indSlug}-${locSlug}`))

  const h1Variants = [
    `${ind.name} Lawyers in ${location.name}, ${location.department_code || ''}`,
    `${ind.name} Attorneys — ${location.name}`,
    `${location.name} ${ind.name} Legal Specialists`,
    `Find ${ind.name} Attorneys in ${location.name}`,
    `${ind.name} Legal Help in ${location.name}${location.department_code ? ` (${location.department_code})` : ''}`,
  ]
  const h1 = h1Variants[seed % h1Variants.length]

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Industries', url: '/industry' },
    { name: ind.name, url: `/industry/${indSlug}` },
    { name: location.name, url: `/industry/${indSlug}/${locSlug}` },
  ])
  const itemListSchema = providers.length > 0
    ? getItemListSchema({ name: `${ind.name} Attorneys in ${location.name}`, description: `Attorneys for ${ind.name.toLowerCase()} in ${location.name}`, url: `/industry/${indSlug}/${locSlug}`, items: providers.slice(0, 20).map((p, i) => ({ name: p.name, url: getAttorneyUrl({ stable_id: p.stable_id, slug: p.slug, specialty: p.specialty, city: p.address_city }), position: i + 1, image: getServiceImage(ind.paSlug).src, rating: p.rating_average ?? undefined, reviewCount: p.review_count ?? undefined })) })
    : null
  const speakableSchema = getSpeakableSchema({ url: `${SITE_URL}/industry/${indSlug}/${locSlug}`, title: h1 })
  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: h1,
    description: `${ind.description} Find specialized ${paName.toLowerCase()} attorneys in ${location.name} who understand the ${ind.name.toLowerCase()} industry.`,
    url: `${SITE_URL}/industry/${indSlug}/${locSlug}`,
    isPartOf: { '@type': 'WebSite', name: 'USAttorneys', url: SITE_URL },
    about: { '@type': 'Thing', name: `${ind.name} Law` },
    ...(totalCount > 0 ? { numberOfItems: totalCount } : {}),
  }
  const schemas: Record<string, unknown>[] = [breadcrumbSchema, speakableSchema, collectionPageSchema, ...(itemListSchema ? [itemListSchema] : [])]

  const nearbyCities = isZipSlug(locSlug)
    ? await getNearbyZipCodes(locSlug, 8)
    : getNearbyCities(locSlug, 8)
  const stateCities = location.department_code ? getCitiesByState(location.department_code).filter(c => c.slug !== locSlug).slice(0, 6) : []

  return (
    <>
      {schemas.map((s, i) => (<script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(s) }} />))}

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumb items={[{ label: 'Industries', href: '/industry' }, { label: ind.name, href: `/industry/${indSlug}` }, { label: location.name }]} />
        </div>
      </div>

      <section className="bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900">{h1}</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl">
            {ind.description} Our directory connects you with {paName.toLowerCase()} attorneys in {location.name} who have experience with {ind.name.toLowerCase()} cases. {totalCount > 0 ? `${totalCount} verified attorneys.` : ''}
          </p>
        </div>
      </section>

      {/* Industry-Specific Legal Needs */}
      <section className="py-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{ind.name} Legal Needs</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {ind.legalNeeds.map(need => (
              <div key={need} className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50">
                <span className="text-orange-600 font-bold mt-0.5">&#9679;</span>
                <span className="text-gray-700">{need}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Specialized Attorney */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Why You Need an Industry-Specialized Attorney</h2>
          <div className="prose prose-gray max-w-3xl">
            <p>The {ind.name.toLowerCase()} industry operates under specific federal and state regulations that general practitioners may not fully understand. An attorney with {ind.name.toLowerCase()} experience knows:</p>
            <ul>
              <li>Industry-specific regulations and compliance requirements</li>
              <li>Common causes of disputes and how to prevent them</li>
              <li>Expert witnesses and technical consultants in the field</li>
              <li>Typical settlement ranges and litigation strategies</li>
            </ul>
            <p>This specialized knowledge can significantly impact the outcome of your case in {location.name}.</p>
          </div>
        </div>
      </section>

      {/* Attorney Listings */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{paName} Attorneys in {location.name}</h2>
          {providers.length > 0 ? (
            <div className="grid gap-4">
              {(providers as Provider[]).slice(0, 20).map((p, idx) => (
                <Link key={p.stable_id || idx} href={getAttorneyUrl({ stable_id: p.stable_id, slug: p.slug, specialty: p.specialty, city: p.address_city })} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all bg-white">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.address_city}{p.address_county ? `, ${p.address_county}` : ''}</p>
                  </div>
                  {p.rating_average != null && <span className="text-sm font-semibold text-orange-600">★ {p.rating_average.toFixed(1)}</span>}
                </Link>
              ))}
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">Our directory of {ind.name.toLowerCase()} attorneys in {location.name} is growing.</p>
              <Link href={`/practice-areas/${ind.paSlug}/${locSlug}`} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Browse All {paName} Attorneys in {location.name}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Other Industries */}
      <section className="py-10 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Other Industries in {location.name}</h2>
          <div className="flex flex-wrap gap-2">
            {industries.filter(i => i.slug !== indSlug).slice(0, 8).map(i => (
              <Link key={i.slug} href={`/industry/${i.slug}/${locSlug}`} className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm hover:border-orange-300 hover:text-orange-700 transition-colors">{i.name}</Link>
            ))}
          </div>
        </div>
      </section>

      {(nearbyCities.length > 0 || stateCities.length > 0) && (
        <section className="py-10 bg-gray-50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{ind.name} Attorneys Nearby</h2>
            <div className="flex flex-wrap gap-2">
              {[...nearbyCities, ...stateCities].slice(0, 12).map(c => (
                <Link key={c.slug} href={`/industry/${indSlug}/${c.slug}`} className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm hover:border-orange-300 hover:text-orange-700 transition-colors">{c.name}</Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CrossIntentLinks service={ind.paSlug} specialtyName={paName} city={locSlug} cityName={location.name} currentIntent="services" />
    </>
  )
}
