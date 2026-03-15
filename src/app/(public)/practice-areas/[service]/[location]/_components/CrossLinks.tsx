import Link from 'next/link'
import { PopularServicesLinks } from '@/components/InternalLinks'
import { slugify } from '@/lib/utils'
import { getStateByCode, getRegionSlugByName } from '@/lib/data/usa'
import type { LocationContent } from '@/lib/seo/location-content'
import type { LocationData } from '@/lib/data/commune-data'
import type { Service, Location as LocationType } from '@/types'
import { GSC_BOOST_PAGES } from '@/lib/seo/gsc-priority-cities'
import { getProblemsByService } from '@/lib/data/problems'
import { relatedServices } from '@/lib/constants/navigation'
import { tradeContent } from '@/lib/data/trade-content'

interface NearbyCity {
  slug: string
  name: string
}

interface OtherService {
  slug: string
  name: string
  icon: string
}

interface Props {
  service: Service
  location: LocationType
  specialtySlug: string
  locationSlug: string
  otherServices: OtherService[]
  nearbyCities: NearbyCity[]
  deptCities: NearbyCity[]
  locationContent: LocationContent | null
  locationData: LocationData | null
}

export default function CrossLinks({
  service,
  location,
  specialtySlug,
  locationSlug,
  otherServices,
  nearbyCities,
  deptCities,
  locationContent,
  locationData,
}: Props) {
  return (
    <>
      {/* Voir aussi */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 border-l-4 border-amber-500 pl-4">See Also</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Autres services dans cette ville */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Other Attorneys in {location.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {otherServices.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/practice-areas/${s.slug}/${locationSlug}`}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-50 hover:bg-amber-50 text-gray-700 hover:text-amber-800 rounded-full text-sm font-medium border border-gray-100 hover:border-amber-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
              <Link
                href={`/cities/${locationSlug}`}
                className="inline-flex items-center gap-1 mt-4 text-clay-400 hover:text-clay-600 text-sm font-medium group"
              >
                All attorneys in {location.name}
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>

            {/* Ce service dans les cities proches */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {service.name} Near {location.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {nearbyCities.map((city) => (
                  <Link
                    key={city.slug}
                    href={`/practice-areas/${specialtySlug}/${city.slug}`}
                    className="inline-flex items-center gap-1 px-3.5 py-2 bg-gray-50 hover:bg-clay-50 text-gray-700 hover:text-clay-600 rounded-full text-sm font-medium border border-gray-100 hover:border-clay-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
              <Link
                href={`/practice-areas/${specialtySlug}`}
                className="inline-flex items-center gap-1 mt-4 text-clay-400 hover:text-clay-600 text-sm font-medium group"
              >
                View all cities
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>

            {/* Navigation régionale */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Browse by Area</h3>
              <div className="space-y-2">
                {location.region_name && (
                  <Link
                    href={`/regions/${getRegionSlugByName(location.region_name) || slugify(location.region_name)}`}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-clay-50 text-gray-700 hover:text-clay-600 rounded-xl text-sm font-medium border border-gray-100 hover:border-clay-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Attorneys in {location.region_name}
                  </Link>
                )}
                {location.department_name && location.department_code && (
                  <Link
                    href={`/states/${getStateByCode(location.department_code)?.slug || slugify(location.department_name)}`}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-clay-50 text-gray-700 hover:text-clay-600 rounded-xl text-sm font-medium border border-gray-100 hover:border-clay-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Attorneys in {location.department_name} ({location.department_code})
                  </Link>
                )}
              </div>
            </div>

            {/* Intent variants */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {service.name} in {location.name}
              </h3>
              <div className="space-y-2">
                <Link href={`/quotes/${specialtySlug}/${locationSlug}`} className="flex items-center gap-2 px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-sm font-medium border border-amber-100 hover:border-amber-200 transition-all">
                  {service.name.toLowerCase()} Consultation in {location.name}
                </Link>
                <Link href={`/reviews/${specialtySlug}/${locationSlug}`} className="flex items-center gap-2 px-4 py-3 bg-clay-50 hover:bg-clay-100 text-clay-700 rounded-xl text-sm font-medium border border-clay-100 hover:border-clay-200 transition-all">
                  {service.name.toLowerCase()} Reviews in {location.name}
                </Link>
                <Link href={`/pricing/${specialtySlug}/${locationSlug}`} className="flex items-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-sm font-medium border border-emerald-100 hover:border-emerald-200 transition-all">
                  {service.name.toLowerCase()} Fees in {location.name}
                </Link>
                <Link href={`/emergency/${specialtySlug}/${locationSlug}`} className="flex items-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-800 rounded-xl text-sm font-medium border border-red-100 hover:border-red-200 transition-all">
                  Emergency {service.name} in {location.name}
                </Link>
              </div>
            </div>

            {/* Related problems */}
            {(() => {
              const problems = getProblemsByService(specialtySlug).slice(0, 4)
              if (problems.length === 0) return null
              return (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Common Issues
                  </h3>
                  <div className="space-y-2">
                    {problems.map((p) => (
                      <Link
                        key={p.slug}
                        href={`/issues/${p.slug}/${locationSlug}`}
                        className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-800 rounded-xl text-sm font-medium border border-gray-100 hover:border-orange-200 transition-all"
                      >
                        {p.name} in {location.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Cross-service callouts */}
            {otherServices.slice(0, 3).map((s) => (
              <Link
                key={`cross-${s.slug}`}
                href={`/practice-areas/${s.slug}/${locationSlug}`}
                className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100 hover:border-amber-200 transition-all group"
              >
                <span className="text-sm text-amber-800 font-medium">
                  Besoin d&apos;un {s.name.toLowerCase()} in {location.name} ?
                </span>
                <svg className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            ))}

            {/* Villes du département */}
            {deptCities.length > 3 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:col-span-2 lg:col-span-3">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {service.name} in {location.department_name || 'the State'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {deptCities.map((city) => (
                    <Link
                      key={city.slug}
                      href={`/practice-areas/${specialtySlug}/${city.slug}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-clay-50 text-gray-600 hover:text-clay-400 rounded-full text-sm border border-gray-100 hover:border-clay-200 transition-colors"
                    >
                      {city.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Services complémentaires dans cette ville */}
            {(() => {
              const complementarySlugs = relatedServices[specialtySlug] || []
              const complementaryServices = complementarySlugs
                .filter((slug) => slug !== specialtySlug && tradeContent[slug])
                .slice(0, 6)

              if (complementaryServices.length === 0) return null

              return (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:col-span-2 lg:col-span-3">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Complementary Services in {location.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Need another attorney in {location.name}? These services are often requested with {service.name.toLowerCase()}.
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {complementaryServices.map((slug) => {
                      const t = tradeContent[slug]
                      if (!t) return null
                      return (
                        <div key={slug} className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-2">
                          <div className="font-medium text-gray-900 text-sm">{t.name}</div>
                          <div className="flex flex-wrap gap-1.5">
                            <Link
                              href={`/practice-areas/${slug}/${locationSlug}`}
                              className="inline-flex items-center px-2.5 py-1 bg-white hover:bg-amber-50 text-gray-600 hover:text-amber-800 rounded-lg text-xs font-medium border border-gray-200 hover:border-amber-200 transition-all"
                            >
                              Attorneys
                            </Link>
                            <Link
                              href={`/quotes/${slug}/${locationSlug}`}
                              className="inline-flex items-center px-2.5 py-1 bg-white hover:bg-amber-50 text-gray-600 hover:text-amber-800 rounded-lg text-xs font-medium border border-gray-200 hover:border-amber-200 transition-all"
                            >
                              Consultation
                            </Link>
                            <Link
                              href={`/pricing/${slug}/${locationSlug}`}
                              className="inline-flex items-center px-2.5 py-1 bg-white hover:bg-emerald-50 text-gray-600 hover:text-emerald-800 rounded-lg text-xs font-medium border border-gray-200 hover:border-emerald-200 transition-all"
                            >
                              Fees
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* GSC boost links — pages with promising positions */}
            {(() => {
              const currentPath = `/practice-areas/${specialtySlug}/${locationSlug}`
              const boostLinks = GSC_BOOST_PAGES
                .filter(path => path !== currentPath)
                .slice(0, 3)

              if (boostLinks.length === 0) return null

              return (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:col-span-2 lg:col-span-3">
                  <h3 className="font-semibold text-gray-900 mb-4">Also Discover</h3>
                  <div className="flex flex-wrap gap-2">
                    {boostLinks.map((path) => {
                      const parts = path.split('/')
                      const svc = parts[2]?.replace(/-/g, ' ') ?? ''
                      const city = parts[3]?.replace(/-/g, ' ') ?? ''
                      return (
                        <Link
                          key={path}
                          href={path}
                          className="inline-flex items-center gap-1 px-3.5 py-2 bg-gray-50 hover:bg-amber-50 text-gray-700 hover:text-amber-800 rounded-full text-sm font-medium border border-gray-100 hover:border-amber-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                        >
                          {svc} in {city}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-8 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Trust &amp; Safety
          </h2>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/verification-process" className="text-clay-400 hover:text-clay-700">
              How We Verify Attorneys
            </Link>
            <Link href="/review-policy" className="text-clay-400 hover:text-clay-700">
              Our Review Policy
            </Link>
            <Link href="/mediation" className="text-clay-400 hover:text-clay-700">
              Mediation Service
            </Link>
          </nav>
        </div>
      </section>

      {/* E-E-A-T editorial note */}
      <section className="py-6 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-gray-400 leading-relaxed max-w-3xl">
            The {service.name.toLowerCase()}s listed in {location.name} are registered professionals, verified via bar records.
            The fees displayed are indicative and based on market averages in {location.region_name || 'the US'} for a {service.name.toLowerCase()} in {location.name} ({location.department_code}).
            This is an independent directory — we do not provide legal services and do not collect commissions.
          </p>
          {locationContent?.dataDriven?.dataSources && locationContent.dataDriven.dataSources.length > 0 && (
            <p className="text-xs text-gray-400 mt-2 max-w-3xl">
              <strong className="text-gray-500">Local data sources:</strong>{' '}
              {locationContent.dataDriven.dataSources.join(' · ')}.
              Data updated periodically. Last update{' '}
              {locationData?.enriched_at
                ? new Date(locationData.enriched_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : 'recent'}.
            </p>
          )}
        </div>
      </section>

      {/* Popular services footer */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PopularServicesLinks showTitle={true} limit={8} />
        </div>
      </section>
    </>
  )
}
