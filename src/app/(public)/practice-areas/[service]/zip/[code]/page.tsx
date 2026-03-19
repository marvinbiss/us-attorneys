import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Users, DollarSign, Scale, ArrowRight, Building2 } from 'lucide-react'
import { getZipPageData, getZipMetadata, getZipAttorneyCountByRadius } from '@/lib/zip-pages'
import type { CensusData } from '@/lib/zip-pages'
import { getAttorneysByServiceAndLocation } from '@/lib/supabase'
import { practiceAreas as staticPracticeAreas } from '@/lib/data/usa'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { getServiceImage } from '@/lib/data/images'
import { getAttorneyUrl } from '@/lib/utils'
import { buildZipSlug } from '@/lib/location-resolver'
import Breadcrumb from '@/components/Breadcrumb'
import NearbyZips from '@/components/seo/NearbyZips'
import type { Provider } from '@/types'
import { REVALIDATE } from '@/lib/cache'

// ─── ISR: revalidate every 24h ──────────────────────────────────────────────
export const revalidate = REVALIDATE.serviceLocation
export const dynamicParams = true

// ─── Safely escape JSON for script tags ─────────────────────────────────────
function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

// ─── Pre-render top 10 PAs x top 100 ZIP codes = 1,000 pages ───────────────
const TOP_PA_COUNT = 10
const TOP_ZIPS = [
  '10001',
  '10002',
  '10003',
  '10004',
  '10005',
  '10006',
  '10007',
  '10009',
  '10010',
  '10011',
  '90001',
  '90002',
  '90003',
  '90004',
  '90005',
  '90006',
  '90007',
  '90008',
  '90010',
  '90011',
  '60601',
  '60602',
  '60603',
  '60604',
  '60605',
  '60606',
  '60607',
  '60608',
  '60610',
  '60611',
  '77001',
  '77002',
  '77003',
  '77004',
  '77005',
  '77006',
  '77007',
  '77008',
  '77009',
  '77010',
  '85001',
  '85003',
  '85004',
  '85006',
  '85007',
  '85008',
  '85009',
  '85012',
  '85013',
  '85014',
  '19101',
  '19102',
  '19103',
  '19104',
  '19106',
  '19107',
  '19109',
  '19111',
  '19114',
  '19120',
  '78201',
  '78202',
  '78204',
  '78205',
  '78207',
  '78210',
  '78211',
  '78212',
  '78213',
  '78214',
  '92101',
  '92102',
  '92103',
  '92104',
  '92105',
  '92106',
  '92107',
  '92108',
  '92109',
  '92110',
  '75201',
  '75202',
  '75204',
  '75205',
  '75206',
  '75207',
  '75208',
  '75209',
  '75210',
  '75211',
  '95101',
  '95110',
  '95112',
  '95113',
  '95116',
  '95117',
  '95118',
  '95119',
  '95120',
  '95121',
]

export function generateStaticParams() {
  const topPAs = staticPracticeAreas.slice(0, TOP_PA_COUNT)
  return topPAs.flatMap((pa) => TOP_ZIPS.map((zip) => ({ service: pa.slug, code: zip })))
}

// ─── Page Props ─────────────────────────────────────────────────────────────
interface PageProps {
  params: Promise<{ service: string; code: string }>
}

// ─── generateMetadata ───────────────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { service: serviceSlug, code: zipCode } = await params

  // Validate ZIP format
  if (!/^\d{5}$/.test(zipCode)) {
    return { title: 'Not Found', robots: { index: false, follow: false } }
  }

  const pa = staticPracticeAreas.find((s) => s.slug === serviceSlug)
  if (!pa) {
    return { title: 'Not Found', robots: { index: false, follow: false } }
  }

  const zipMeta = await getZipMetadata(zipCode)
  if (!zipMeta) {
    // ZIP not in DB yet — still return indexable metadata with PA name
    return {
      title: `${pa.name} Lawyers near ${zipCode} | ${SITE_NAME}`,
      description: `Find experienced ${pa.name.toLowerCase()} attorneys near ZIP code ${zipCode}. Bar-verified lawyers, free consultation.`,
      robots: { index: false, follow: true },
    }
  }

  const { cityName, stateCode, stateName } = zipMeta
  const radiusCount = await getZipAttorneyCountByRadius(serviceSlug, zipCode, 25)

  const title = `Best ${pa.name} Lawyers near ${zipCode} (${cityName}, ${stateCode}) | ${SITE_NAME}`
  const description =
    radiusCount > 0
      ? `${radiusCount} bar-verified ${pa.name.toLowerCase()} attorneys near ${zipCode} in ${cityName}, ${stateName}. Compare profiles, fees, and reviews. Free consultation.`
      : `Find experienced ${pa.name.toLowerCase()} attorneys near ZIP code ${zipCode} in ${cityName}, ${stateName}. Free consultation, no obligation.`

  const canonical = `${SITE_URL}/practice-areas/${serviceSlug}/zip/${zipCode}`

  // Noindex if 0 attorneys within 25 miles
  const shouldIndex = radiusCount > 0

  return {
    title,
    description,
    robots: shouldIndex
      ? {
          index: true,
          follow: true,
          'max-snippet': -1 as const,
          'max-image-preview': 'large' as const,
          'max-video-preview': -1 as const,
        }
      : { index: false, follow: true },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_US',
      images: [{ url: getServiceImage(serviceSlug).src, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [getServiceImage(serviceSlug).src],
    },
    alternates: {
      canonical,
    },
  }
}

// ─── Census Data Display Component ──────────────────────────────────────────
function ZipCensusData({
  census,
  zipCode,
  cityName,
  stateCode,
}: {
  census: CensusData
  zipCode: string
  cityName: string
  stateCode: string
}) {
  const stats: { icon: typeof Users; label: string; value: string }[] = []

  if (census.population) {
    stats.push({ icon: Users, label: 'Population', value: census.population.toLocaleString() })
  }
  if (census.median_household_income) {
    stats.push({
      icon: DollarSign,
      label: 'Median Income',
      value: `$${census.median_household_income.toLocaleString()}`,
    })
  }
  if (census.unemployment_rate != null) {
    stats.push({
      icon: Scale,
      label: 'Unemployment',
      value: `${census.unemployment_rate.toFixed(1)}%`,
    })
  }
  if (census.median_age) {
    stats.push({ icon: Users, label: 'Median Age', value: census.median_age.toString() })
  }
  if (census.owner_occupied_pct != null) {
    stats.push({
      icon: Building2,
      label: 'Homeownership',
      value: `${census.owner_occupied_pct.toFixed(1)}%`,
    })
  }

  if (stats.length === 0) return null

  return (
    <section className="border-t border-stone-200/40 bg-white py-8 dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Demographics for {cityName} {zipCode}, {stateCode}
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-lg border border-stone-200/40 bg-sand-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <stat.icon className="h-5 w-5 flex-shrink-0 text-clay-400" aria-hidden="true" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Source: U.S. Census Bureau American Community Survey (ACS) 5-Year Estimates
        </p>
      </div>
    </section>
  )
}

// ─── Attorney Card Component ────────────────────────────────────────────────
function AttorneyCard({ attorney }: { attorney: Provider }) {
  const href = getAttorneyUrl({
    stable_id: attorney.stable_id,
    slug: attorney.slug,
    specialty: attorney.specialty?.name,
    city: attorney.address_city,
  })

  return (
    <Link
      href={href}
      className="block rounded-lg border border-stone-200/40 bg-white p-4 transition-all duration-200 hover:border-clay-200 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-clay-600"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{attorney.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {attorney.address_city}
            {attorney.address_state ? `, ${attorney.address_state}` : ''}
            {attorney.address_zip ? ` ${attorney.address_zip}` : ''}
          </p>
        </div>
        {attorney.rating_average != null && attorney.rating_average > 0 && (
          <div className="text-right">
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {attorney.rating_average.toFixed(1)}
            </span>
            {attorney.review_count != null && attorney.review_count > 0 && (
              <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
                ({attorney.review_count})
              </span>
            )}
          </div>
        )}
      </div>
      {attorney.is_verified && (
        <span className="mt-2 inline-block rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
          Bar Verified
        </span>
      )}
    </Link>
  )
}

// ─── Main Page Component ────────────────────────────────────────────────────
export default async function ZipCodePage({ params }: PageProps) {
  const { service: serviceSlug, code: zipCode } = await params

  // Validate
  if (!/^\d{5}$/.test(zipCode)) notFound()
  const pa = staticPracticeAreas.find((s) => s.slug === serviceSlug)
  if (!pa) notFound()

  // Fetch all ZIP page data in parallel
  const zipPageData = await getZipPageData(serviceSlug, zipCode)
  if (!zipPageData) notFound()

  const { zip, nearbyZips, attorneyCount } = zipPageData

  // Fetch attorneys for this ZIP
  const zipSlug = buildZipSlug(zipCode, zip.cityName, zip.stateCode)
  const attorneys = await getAttorneysByServiceAndLocation(serviceSlug, zipSlug, {
    limit: 20,
    offset: 0,
  })

  // Radius attorney count for "X attorneys within 25 miles"
  const radiusCount = await getZipAttorneyCountByRadius(serviceSlug, zipCode, 25)

  // ── JSON-LD Structured Data ──────────────────────────────────────────────
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/', semanticType: 'Organization' },
    { name: 'Practice Areas', url: '/practice-areas', semanticType: 'CollectionPage' },
    { name: pa.name, url: `/practice-areas/${serviceSlug}`, semanticType: 'LegalService' },
    {
      name: zip.cityName,
      url: `/practice-areas/${serviceSlug}/${zip.citySlug}`,
      semanticType: 'City',
    },
    { name: `ZIP ${zipCode}`, url: `/practice-areas/${serviceSlug}/zip/${zipCode}` },
  ])

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: `${pa.name} Lawyers near ${zipCode}`,
    description: `Find experienced ${pa.name.toLowerCase()} attorneys near ZIP code ${zipCode} in ${zip.cityName}, ${zip.stateCode}.`,
    url: `${SITE_URL}/practice-areas/${serviceSlug}/zip/${zipCode}`,
    areaServed: {
      '@type': 'PostalAddress',
      postalCode: zipCode,
      addressLocality: zip.cityName,
      addressRegion: zip.stateCode,
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: zip.latitude,
      longitude: zip.longitude,
    },
    provider: {
      '@id': `${SITE_URL}#organization`,
    },
  }

  const jsonLdSchemas = [breadcrumbSchema, localBusinessSchema]

  return (
    <>
      {/* JSON-LD */}
      {jsonLdSchemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonStringify(schema) }}
        />
      ))}

      {/* Breadcrumb */}
      <div className="border-b bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <Breadcrumb
            items={[
              { label: 'Practice Areas', href: '/practice-areas' },
              { label: pa.name, href: `/practice-areas/${serviceSlug}` },
              { label: zip.cityName, href: `/practice-areas/${serviceSlug}/${zip.citySlug}` },
              { label: `ZIP ${zipCode}` },
            ]}
          />
        </div>
      </div>

      {/* Hero Section */}
      <section className="border-b border-stone-200/40 bg-gradient-to-b from-sand-50 to-white dark:border-gray-800 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span>
              {zip.cityName}, {zip.stateName} {zipCode}
            </span>
            {zip.countyName && <span className="text-gray-300 dark:text-gray-600">|</span>}
            {zip.countyName && <span>{zip.countyName} County</span>}
          </div>

          <h1 className="mb-4 font-heading text-2xl font-bold text-gray-900 dark:text-gray-50 sm:text-3xl lg:text-4xl">
            {pa.name} Lawyers near {zipCode}
            <span className="mt-1 block text-lg font-normal text-gray-500 dark:text-gray-400 sm:text-xl">
              {zip.cityName}, {zip.stateCode}
            </span>
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            {attorneyCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <Users className="h-4 w-4" aria-hidden="true" />
                {attorneyCount} attorney{attorneyCount !== 1 ? 's' : ''} in {zipCode}
              </span>
            )}
            {radiusCount > attorneyCount && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {radiusCount} within 25 miles
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Attorney Listings */}
      <section className="bg-sand-50 py-8 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {attorneys.length > 0 ? (
            <>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                {pa.name} Attorneys in {zipCode}
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(attorneys as Provider[]).map((attorney) => (
                  <AttorneyCard key={attorney.stable_id || attorney.slug} attorney={attorney} />
                ))}
              </div>

              {/* Link to full city page for more results */}
              {zip.citySlug && (
                <div className="mt-6 text-center">
                  <Link
                    href={`/practice-areas/${serviceSlug}/${zip.citySlug}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-clay-400 px-6 py-3 font-medium text-white transition-colors hover:bg-clay-500"
                  >
                    View All {pa.name} Lawyers in {zip.cityName}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <MapPin
                className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600"
                aria-hidden="true"
              />
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                No {pa.name.toLowerCase()} attorneys found in {zipCode}
              </h2>
              <p className="mx-auto mb-6 max-w-md text-gray-500 dark:text-gray-400">
                {radiusCount > 0
                  ? `We found ${radiusCount} ${pa.name.toLowerCase()} attorney${radiusCount !== 1 ? 's' : ''} within 25 miles. Check nearby ZIP codes below or view the full city listing.`
                  : `Try browsing nearby ZIP codes or the ${zip.cityName} area for available attorneys.`}
              </p>
              {zip.citySlug && (
                <Link
                  href={`/practice-areas/${serviceSlug}/${zip.citySlug}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-clay-400 px-6 py-3 font-medium text-white transition-colors hover:bg-clay-500"
                >
                  Browse {pa.name} in {zip.cityName}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Census Demographics */}
      {zip.censusData && (
        <ZipCensusData
          census={zip.censusData}
          zipCode={zipCode}
          cityName={zip.cityName}
          stateCode={zip.stateCode}
        />
      )}

      {/* ZIP-Specific Content Section — unique per page */}
      <section className="border-t border-stone-200/40 bg-white py-8 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            About {pa.name} Legal Services near {zipCode}
          </h2>
          <div className="prose dark:prose-invert prose-stone max-w-none text-sm leading-relaxed">
            <p>
              ZIP code {zipCode} is located in {zip.cityName}, {zip.stateName} ({zip.stateCode})
              {zip.countyName ? ` within ${zip.countyName} County` : ''}.
              {zip.censusData?.population
                ? ` The area serves approximately ${zip.censusData.population.toLocaleString()} residents.`
                : ''}
              {zip.censusData?.median_household_income
                ? ` The median household income is $${zip.censusData.median_household_income.toLocaleString()}, which can influence the types of legal services most needed in the area.`
                : ''}
            </p>
            <p>
              Residents of {zipCode} seeking {pa.name.toLowerCase()} legal representation have
              access to{' '}
              {attorneyCount > 0
                ? `${attorneyCount} attorney${attorneyCount !== 1 ? 's' : ''} in their immediate area`
                : 'attorneys in nearby areas'}
              {radiusCount > attorneyCount ? ` and ${radiusCount} within a 25-mile radius` : ''}.
              {zip.citySlug
                ? ` For the broadest selection, consider viewing all ${pa.name.toLowerCase()} attorneys serving the greater ${zip.cityName} area.`
                : ''}
            </p>
          </div>
        </div>
      </section>

      {/* Nearby ZIP Codes */}
      <NearbyZips
        zipCode={zipCode}
        cityName={zip.cityName}
        stateCode={zip.stateCode}
        specialtySlug={serviceSlug}
        specialtyName={pa.name}
        nearbyZips={nearbyZips}
        citySlug={zip.citySlug}
        stateSlug={zip.stateSlug}
        stateName={zip.stateName}
        className="border-t border-stone-200/40 bg-sand-50 dark:border-gray-800 dark:bg-gray-950"
      />
    </>
  )
}
