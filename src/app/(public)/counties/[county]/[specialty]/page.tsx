import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getSpecialtyBySlug,
  getAttorneyCountByServiceAndLocation,
} from '@/lib/supabase'
import { getBreadcrumbSchema, getSpeakableSchema } from '@/lib/seo/jsonld'
import Breadcrumb from '@/components/Breadcrumb'
import CrossIntentLinks from '@/components/seo/CrossIntentLinks'
import { getServiceImage } from '@/lib/data/images'
import {
  practiceAreas as staticPracticeAreas,
  cities,
  getStateByCode,
} from '@/lib/data/usa'
import { SITE_URL } from '@/lib/seo/config'
import { hashCode } from '@/lib/seo/location-content'
import { getNaturalTerm } from '@/lib/seo/natural-terms'
import type { Service } from '@/types'
import { REVALIDATE, getCachedData, CACHE_TTL } from '@/lib/cache'
import { supabase } from '@/lib/supabase'

function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}

function truncateTitle(title: string, maxLen = 55): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export const revalidate = REVALIDATE.locations
export const dynamicParams = true

// ---------------------------------------------------------------------------
// County data — top 100 US counties
// ---------------------------------------------------------------------------

interface CountyInfo {
  slug: string
  name: string
  stateCode: string
  stateName: string
  seat: string
  population: string
  citySlugs: string[]
}

const topCounties: CountyInfo[] = [
  { slug: 'los-angeles-county-ca', name: 'Los Angeles County', stateCode: 'CA', stateName: 'California', seat: 'Los Angeles', population: '9,829,544', citySlugs: ['los-angeles', 'long-beach', 'santa-clarita', 'glendale', 'lancaster'] },
  { slug: 'cook-county-il', name: 'Cook County', stateCode: 'IL', stateName: 'Illinois', seat: 'Chicago', population: '5,150,233', citySlugs: ['chicago', 'aurora', 'joliet', 'naperville', 'elgin'] },
  { slug: 'harris-county-tx', name: 'Harris County', stateCode: 'TX', stateName: 'Texas', seat: 'Houston', population: '4,780,913', citySlugs: ['houston', 'pasadena'] },
  { slug: 'maricopa-county-az', name: 'Maricopa County', stateCode: 'AZ', stateName: 'Arizona', seat: 'Phoenix', population: '4,496,588', citySlugs: ['phoenix', 'mesa', 'chandler', 'scottsdale', 'gilbert', 'glendale', 'tempe', 'peoria', 'surprise'] },
  { slug: 'san-diego-county-ca', name: 'San Diego County', stateCode: 'CA', stateName: 'California', seat: 'San Diego', population: '3,286,069', citySlugs: ['san-diego', 'chula-vista'] },
  { slug: 'orange-county-ca', name: 'Orange County', stateCode: 'CA', stateName: 'California', seat: 'Santa Ana', population: '3,167,809', citySlugs: ['anaheim', 'santa-ana', 'irvine'] },
  { slug: 'miami-dade-county-fl', name: 'Miami-Dade County', stateCode: 'FL', stateName: 'Florida', seat: 'Miami', population: '2,701,767', citySlugs: ['miami', 'hialeah'] },
  { slug: 'dallas-county-tx', name: 'Dallas County', stateCode: 'TX', stateName: 'Texas', seat: 'Dallas', population: '2,613,539', citySlugs: ['dallas', 'irving', 'garland', 'grand-prairie'] },
  { slug: 'kings-county-ny', name: 'Kings County', stateCode: 'NY', stateName: 'New York', seat: 'Brooklyn', population: '2,559,903', citySlugs: ['new-york'] },
  { slug: 'riverside-county-ca', name: 'Riverside County', stateCode: 'CA', stateName: 'California', seat: 'Riverside', population: '2,418,185', citySlugs: ['riverside'] },
  { slug: 'queens-county-ny', name: 'Queens County', stateCode: 'NY', stateName: 'New York', seat: 'Queens', population: '2,270,976', citySlugs: ['new-york'] },
  { slug: 'san-bernardino-county-ca', name: 'San Bernardino County', stateCode: 'CA', stateName: 'California', seat: 'San Bernardino', population: '2,181,654', citySlugs: ['san-bernardino', 'fontana'] },
  { slug: 'king-county-wa', name: 'King County', stateCode: 'WA', stateName: 'Washington', seat: 'Seattle', population: '2,269,675', citySlugs: ['seattle', 'bellevue', 'kent', 'renton'] },
  { slug: 'clark-county-nv', name: 'Clark County', stateCode: 'NV', stateName: 'Nevada', seat: 'Las Vegas', population: '2,265,461', citySlugs: ['las-vegas', 'henderson', 'north-las-vegas'] },
  { slug: 'tarrant-county-tx', name: 'Tarrant County', stateCode: 'TX', stateName: 'Texas', seat: 'Fort Worth', population: '2,110,640', citySlugs: ['fort-worth', 'arlington'] },
  { slug: 'bexar-county-tx', name: 'Bexar County', stateCode: 'TX', stateName: 'Texas', seat: 'San Antonio', population: '2,009,324', citySlugs: ['san-antonio'] },
  { slug: 'broward-county-fl', name: 'Broward County', stateCode: 'FL', stateName: 'Florida', seat: 'Fort Lauderdale', population: '1,944,375', citySlugs: ['fort-lauderdale'] },
  { slug: 'santa-clara-county-ca', name: 'Santa Clara County', stateCode: 'CA', stateName: 'California', seat: 'San Jose', population: '1,936,259', citySlugs: ['san-jose'] },
  { slug: 'wayne-county-mi', name: 'Wayne County', stateCode: 'MI', stateName: 'Michigan', seat: 'Detroit', population: '1,793,561', citySlugs: ['detroit', 'dearborn', 'livonia'] },
  { slug: 'new-york-county-ny', name: 'New York County', stateCode: 'NY', stateName: 'New York', seat: 'Manhattan', population: '1,694,251', citySlugs: ['new-york'] },
  { slug: 'alameda-county-ca', name: 'Alameda County', stateCode: 'CA', stateName: 'California', seat: 'Oakland', population: '1,682,353', citySlugs: ['oakland', 'fremont'] },
  { slug: 'middlesex-county-ma', name: 'Middlesex County', stateCode: 'MA', stateName: 'Massachusetts', seat: 'Cambridge', population: '1,632,002', citySlugs: ['cambridge', 'lowell'] },
  { slug: 'philadelphia-county-pa', name: 'Philadelphia County', stateCode: 'PA', stateName: 'Pennsylvania', seat: 'Philadelphia', population: '1,603,797', citySlugs: ['philadelphia'] },
  { slug: 'sacramento-county-ca', name: 'Sacramento County', stateCode: 'CA', stateName: 'California', seat: 'Sacramento', population: '1,585,055', citySlugs: ['sacramento'] },
  { slug: 'suffolk-county-ny', name: 'Suffolk County', stateCode: 'NY', stateName: 'New York', seat: 'Riverhead', population: '1,525,920', citySlugs: [] },
  { slug: 'palm-beach-county-fl', name: 'Palm Beach County', stateCode: 'FL', stateName: 'Florida', seat: 'West Palm Beach', population: '1,496,770', citySlugs: [] },
  { slug: 'hennepin-county-mn', name: 'Hennepin County', stateCode: 'MN', stateName: 'Minnesota', seat: 'Minneapolis', population: '1,281,565', citySlugs: ['minneapolis', 'bloomington', 'brooklyn-park', 'plymouth', 'maple-grove'] },
  { slug: 'hillsborough-county-fl', name: 'Hillsborough County', stateCode: 'FL', stateName: 'Florida', seat: 'Tampa', population: '1,459,762', citySlugs: ['tampa'] },
  { slug: 'cuyahoga-county-oh', name: 'Cuyahoga County', stateCode: 'OH', stateName: 'Ohio', seat: 'Cleveland', population: '1,264,817', citySlugs: ['cleveland', 'parma'] },
  { slug: 'franklin-county-oh', name: 'Franklin County', stateCode: 'OH', stateName: 'Ohio', seat: 'Columbus', population: '1,323,807', citySlugs: ['columbus'] },
  { slug: 'travis-county-tx', name: 'Travis County', stateCode: 'TX', stateName: 'Texas', seat: 'Austin', population: '1,290,188', citySlugs: ['austin'] },
  { slug: 'mecklenburg-county-nc', name: 'Mecklenburg County', stateCode: 'NC', stateName: 'North Carolina', seat: 'Charlotte', population: '1,155,509', citySlugs: ['charlotte'] },
  { slug: 'denver-county-co', name: 'Denver County', stateCode: 'CO', stateName: 'Colorado', seat: 'Denver', population: '713,252', citySlugs: ['denver'] },
  { slug: 'wake-county-nc', name: 'Wake County', stateCode: 'NC', stateName: 'North Carolina', seat: 'Raleigh', population: '1,129,410', citySlugs: ['raleigh', 'cary'] },
  { slug: 'fulton-county-ga', name: 'Fulton County', stateCode: 'GA', stateName: 'Georgia', seat: 'Atlanta', population: '1,066,710', citySlugs: ['atlanta', 'sandy-springs', 'roswell', 'johns-creek'] },
  { slug: 'duval-county-fl', name: 'Duval County', stateCode: 'FL', stateName: 'Florida', seat: 'Jacksonville', population: '995,567', citySlugs: ['jacksonville'] },
  { slug: 'marion-county-in', name: 'Marion County', stateCode: 'IN', stateName: 'Indiana', seat: 'Indianapolis', population: '977,203', citySlugs: ['indianapolis'] },
  { slug: 'shelby-county-tn', name: 'Shelby County', stateCode: 'TN', stateName: 'Tennessee', seat: 'Memphis', population: '929,744', citySlugs: ['memphis'] },
  { slug: 'essex-county-nj', name: 'Essex County', stateCode: 'NJ', stateName: 'New Jersey', seat: 'Newark', population: '863,728', citySlugs: ['newark'] },
  { slug: 'davidson-county-tn', name: 'Davidson County', stateCode: 'TN', stateName: 'Tennessee', seat: 'Nashville', population: '715,884', citySlugs: ['nashville'] },
]

function getCountyStatic(slug: string) {
  return topCounties.find(c => c.slug === slug) || null
}

const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

/** Resolve county from static data OR DB (3,244 counties) */
async function getCounty(slug: string): Promise<CountyInfo | null> {
  const staticCounty = getCountyStatic(slug)
  if (staticCounty) return staticCounty
  if (IS_BUILD) return null

  return getCachedData(
    `county:${slug}`,
    async () => {
      try {
        const { data, error } = await supabase
          .from('counties')
          .select('id, name, slug, fips_code, state:state_id(name, abbreviation, slug)')
          .eq('slug', slug)
          .limit(1)
          .single()
        if (error || !data) return null

        const row = data as unknown as {
          slug: string
          name: string
          fips_code: string | null
          state: { name: string; abbreviation: string; slug: string } | null
        }
        const stateData = row.state

        return {
          slug: row.slug,
          name: row.name,
          stateCode: stateData?.abbreviation || '',
          stateName: stateData?.name || '',
          seat: '',
          population: '',
          citySlugs: [],
        } satisfies CountyInfo
      } catch {
        return null
      }
    },
    CACHE_TTL.locations,
  )
}

// 1 seed page — ISR 24h handles the rest (dynamicParams = true)
export function generateStaticParams() {
  return [{ county: 'los-angeles-county-ca', specialty: 'personal-injury' }]
}

interface PageProps { params: Promise<{ county: string; specialty: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { county: countySlug, specialty: slug } = await params

  const county = await getCounty(countySlug)
  if (!county) return { title: 'Not Found', robots: { index: false, follow: false } }

  let specialtyName = ''
  try { const svc = await getSpecialtyBySlug(slug); if (svc) specialtyName = svc.name }
  catch { /* fallback below */ }
  if (!specialtyName) { const s = staticPracticeAreas.find(p => p.slug === slug); if (s) specialtyName = s.name }
  if (!specialtyName) return { title: 'Not Found', robots: { index: false, follow: false } }

  const seed = Math.abs(hashCode(`county-${countySlug}-${slug}`))
  const svcLower = specialtyName.toLowerCase()
  const stateName = county.stateName

  const titles = [
    `${specialtyName} Attorneys in ${county.name}, ${county.stateCode}`,
    `${county.name} ${specialtyName} Lawyers — Directory`,
    `Find a ${specialtyName} Attorney in ${county.name}`,
    `${specialtyName} in ${county.name}, ${stateName}`,
    `${county.name} ${specialtyName} — Licensed Attorneys`,
  ]

  const descs = [
    `Find qualified ${svcLower} attorneys in ${county.name}, ${stateName}. County seat: ${county.seat}. Bar-verified attorneys serving all jurisdictions.`,
    `${specialtyName} attorneys serving ${county.name}, ${county.stateCode}. Population ${county.population}. Compare profiles and request free consultations.`,
    `Directory of ${svcLower}s in ${county.name}, ${stateName}. Courts, jurisdictions and verified attorneys covering the full county.`,
    `Need a ${svcLower} in ${county.name}? Verified attorneys serving ${county.seat} and surrounding areas. Free consultation.`,
    `${county.name} ${svcLower} directory. Bar-verified attorneys, county court information and free consultations.`,
  ]

  const title = truncateTitle(titles[seed % titles.length])
  const description = descs[seed % descs.length]

  return {
    title, description,
    robots: { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const },
    openGraph: { title, description, type: 'website', locale: 'en_US', images: [{ url: getServiceImage(slug).src, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [getServiceImage(slug).src] },
    alternates: { canonical: `${SITE_URL}/counties/${countySlug}/${slug}` },
  }
}

export default async function CountyPage({ params }: PageProps) {
  const { county: countySlug, specialty: slug } = await params

  const county = await getCounty(countySlug)
  if (!county) notFound()

  let service: Service
  try { service = await getSpecialtyBySlug(slug); if (!service) { const s = staticPracticeAreas.find(p => p.slug === slug); if (!s) notFound(); service = { id: '', name: s.name, slug: s.slug, is_active: true, created_at: '' } } }
  catch { const s = staticPracticeAreas.find(p => p.slug === slug); if (!s) notFound(); service = { id: '', name: s.name, slug: s.slug, is_active: true, created_at: '' } }

  // Aggregate attorney count across county cities
  let totalCount = 0
  const cityCounts: { slug: string; name: string; count: number }[] = []
  for (const citySlug of county.citySlugs) {
    try {
      const cnt = await getAttorneyCountByServiceAndLocation(slug, citySlug)
      totalCount += cnt
      const cityData = cities.find(c => c.slug === citySlug)
      if (cityData) cityCounts.push({ slug: citySlug, name: cityData.name, count: cnt })
    } catch {
      const cityData = cities.find(c => c.slug === citySlug)
      if (cityData) cityCounts.push({ slug: citySlug, name: cityData.name, count: 0 })
    }
  }

  const seed = Math.abs(hashCode(`county-${countySlug}-${slug}`))
  const svcLower = service.name.toLowerCase()
  const naturalTerm = getNaturalTerm(slug)
  const state = getStateByCode(county.stateCode)

  const h1Variants = [
    `${service.name} Lawyers in ${county.name}, ${county.stateName}`,
    `${county.name} ${naturalTerm.plural} — Directory`,
    `Find a ${service.name} Attorney in ${county.name}, ${county.stateCode}`,
    `${service.name} in ${county.name} — ${county.stateName}`,
    `${county.name} ${service.name} Attorney Directory`,
  ]
  const h1 = h1Variants[seed % h1Variants.length]

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Counties', url: '/counties' },
    { name: county.name, url: `/counties/${countySlug}` },
    { name: service.name, url: `/counties/${countySlug}/${slug}` },
  ])
  const speakableSchema = getSpeakableSchema({ url: `${SITE_URL}/counties/${countySlug}/${slug}`, title: h1 })
  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: h1,
    description: `Find qualified ${svcLower} attorneys in ${county.name}, ${county.stateName}. County seat: ${county.seat}. Population ${county.population}.`,
    url: `${SITE_URL}/counties/${countySlug}/${slug}`,
    isPartOf: { '@type': 'WebSite', name: 'USAttorneys', url: SITE_URL },
    about: { '@type': 'Thing', name: service.name },
    ...(totalCount > 0 ? { numberOfItems: totalCount } : {}),
  }
  const schemas: Record<string, unknown>[] = [breadcrumbSchema, speakableSchema, collectionPageSchema]

  // Other practice areas in this county
  const otherPAs = staticPracticeAreas.filter(p => p.slug !== slug).slice(0, 8)

  return (
    <>
      {schemas.map((s, i) => (<script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(s) }} />))}

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumb items={[{ label: 'Counties', href: '/counties' }, { label: county.name, href: `/counties/${countySlug}` }, { label: service.name }]} />
        </div>
      </div>

      <section className="bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900">{h1}</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl">
            {county.name} is located in {county.stateName} with a population of {county.population}. The county seat is {county.seat}. {totalCount > 0 ? `${totalCount} verified ${svcLower} attorneys serve this county.` : `Our directory of ${svcLower} attorneys in ${county.name} is growing.`}
          </p>
        </div>
      </section>

      {/* County Info */}
      <section className="py-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{county.name} Jurisdiction Information</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 rounded-lg border border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">County Seat</h3>
              <p className="mt-2 text-gray-600">{county.seat}</p>
            </div>
            <div className="p-5 rounded-lg border border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">State</h3>
              <p className="mt-2 text-gray-600">{county.stateName} ({county.stateCode})</p>
            </div>
            <div className="p-5 rounded-lg border border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Population</h3>
              <p className="mt-2 text-gray-600">{county.population}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cities in County */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{service.name} Attorneys by City in {county.name}</h2>
          {cityCounts.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {cityCounts.map(cc => (
                <Link key={cc.slug} href={`/practice-areas/${slug}/${cc.slug}`} className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all bg-white">
                  <p className="font-semibold text-gray-900">{cc.name}</p>
                  <p className="text-sm text-gray-500">{cc.count > 0 ? `${cc.count} attorneys` : 'View directory'}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">City-level data for {county.name} is being compiled. Explore the county directory or use the state page.</p>
          )}
        </div>
      </section>

      {/* Other Practice Areas */}
      <section className="py-10 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Other Practice Areas in {county.name}</h2>
          <div className="flex flex-wrap gap-2">
            {otherPAs.map(pa => (
              <Link key={pa.slug} href={`/counties/${countySlug}/${pa.slug}`} className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm hover:border-blue-300 hover:text-blue-700 transition-colors">{pa.name}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* State link */}
      {state && (
        <section className="py-10 bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Statewide Directory</h2>
            <Link href={`/states/${state.slug}/${slug}`} className="text-blue-600 hover:underline">
              View all {service.name} attorneys in {state.name}
            </Link>
          </div>
        </section>
      )}

      <CrossIntentLinks service={slug} specialtyName={service.name} currentIntent="services" />
    </>
  )
}
