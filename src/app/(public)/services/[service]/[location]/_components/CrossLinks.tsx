import Link from 'next/link'
import { PopularServicesLinks } from '@/components/InternalLinks'
import { slugify } from '@/lib/utils'
import { getDepartementByCode, getRegionSlugByName } from '@/lib/data/france'
import type { LocationContent } from '@/lib/seo/location-content'
import type { CommuneData } from '@/lib/data/commune-data'
import type { Service, Location as LocationType } from '@/types'
import { GSC_BOOST_PAGES } from '@/lib/seo/gsc-priority-cities'

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
  serviceSlug: string
  locationSlug: string
  otherServices: OtherService[]
  nearbyCities: NearbyCity[]
  deptCities: NearbyCity[]
  locationContent: LocationContent | null
  communeData: CommuneData | null
}

export default function CrossLinks({
  service,
  location,
  serviceSlug,
  locationSlug,
  otherServices,
  nearbyCities,
  deptCities,
  locationContent,
  communeData,
}: Props) {
  return (
    <>
      {/* Voir aussi */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 border-l-4 border-amber-500 pl-4">Voir aussi</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Autres services dans cette ville */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Autres artisans à {location.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {otherServices.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/services/${s.slug}/${locationSlug}`}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-50 hover:bg-amber-50 text-gray-700 hover:text-amber-800 rounded-full text-sm font-medium border border-gray-100 hover:border-amber-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
              <Link
                href={`/villes/${locationSlug}`}
                className="inline-flex items-center gap-1 mt-4 text-clay-400 hover:text-clay-600 text-sm font-medium group"
              >
                Tous les artisans à {location.name}
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>

            {/* Ce service dans les villes proches */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {service.name} près de {location.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {nearbyCities.map((city) => (
                  <Link
                    key={city.slug}
                    href={`/services/${serviceSlug}/${city.slug}`}
                    className="inline-flex items-center gap-1 px-3.5 py-2 bg-gray-50 hover:bg-clay-50 text-gray-700 hover:text-clay-600 rounded-full text-sm font-medium border border-gray-100 hover:border-clay-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
              <Link
                href={`/services/${serviceSlug}`}
                className="inline-flex items-center gap-1 mt-4 text-clay-400 hover:text-clay-600 text-sm font-medium group"
              >
                Voir toutes les villes
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>

            {/* Navigation régionale */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Explorer par zone</h3>
              <div className="space-y-2">
                {location.region_name && (
                  <Link
                    href={`/regions/${getRegionSlugByName(location.region_name) || slugify(location.region_name)}`}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-clay-50 text-gray-700 hover:text-clay-600 rounded-xl text-sm font-medium border border-gray-100 hover:border-clay-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Artisans en {location.region_name}
                  </Link>
                )}
                {location.department_name && location.department_code && (
                  <Link
                    href={`/departements/${getDepartementByCode(location.department_code)?.slug || slugify(location.department_name)}`}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-clay-50 text-gray-700 hover:text-clay-600 rounded-xl text-sm font-medium border border-gray-100 hover:border-clay-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Artisans dans {location.department_name} ({location.department_code})
                  </Link>
                )}
              </div>
            </div>

            {/* Intent variants */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {service.name} à {location.name}
              </h3>
              <div className="space-y-2">
                <Link href={`/devis/${serviceSlug}/${locationSlug}`} className="flex items-center gap-2 px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-sm font-medium border border-amber-100 hover:border-amber-200 transition-all">
                  Devis {service.name.toLowerCase()} à {location.name}
                </Link>
                <Link href={`/avis/${serviceSlug}/${locationSlug}`} className="flex items-center gap-2 px-4 py-3 bg-clay-50 hover:bg-clay-100 text-clay-700 rounded-xl text-sm font-medium border border-clay-100 hover:border-clay-200 transition-all">
                  Avis {service.name.toLowerCase()} à {location.name}
                </Link>
                <Link href={`/tarifs/${serviceSlug}/${locationSlug}`} className="flex items-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-sm font-medium border border-emerald-100 hover:border-emerald-200 transition-all">
                  Tarifs {service.name.toLowerCase()} à {location.name}
                </Link>
              </div>
            </div>

            {/* Cross-service callouts */}
            {otherServices.slice(0, 3).map((s) => (
              <Link
                key={`cross-${s.slug}`}
                href={`/services/${s.slug}/${locationSlug}`}
                className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100 hover:border-amber-200 transition-all group"
              >
                <span className="text-sm text-amber-800 font-medium">
                  Besoin d&apos;un {s.name.toLowerCase()} à {location.name} ?
                </span>
                <svg className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            ))}

            {/* Villes du département */}
            {deptCities.length > 3 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:col-span-2 lg:col-span-3">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {service.name} dans {location.department_name ? `le ${location.department_name}` : 'le département'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {deptCities.map((city) => (
                    <Link
                      key={city.slug}
                      href={`/services/${serviceSlug}/${city.slug}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-clay-50 text-gray-600 hover:text-clay-400 rounded-full text-sm border border-gray-100 hover:border-clay-200 transition-colors"
                    >
                      {city.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* GSC boost links — pages with promising positions */}
            {(() => {
              const currentPath = `/services/${serviceSlug}/${locationSlug}`
              const boostLinks = GSC_BOOST_PAGES
                .filter(path => path !== currentPath)
                .slice(0, 3)

              if (boostLinks.length === 0) return null

              return (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:col-span-2 lg:col-span-3">
                  <h3 className="font-semibold text-gray-900 mb-4">À découvrir aussi</h3>
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
                          {svc} à {city}
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
            Confiance &amp; Sécurité
          </h2>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/notre-processus-de-verification" className="text-clay-400 hover:text-clay-700">
              Comment nous référençons les artisans
            </Link>
            <Link href="/politique-avis" className="text-clay-400 hover:text-clay-700">
              Notre politique des avis
            </Link>
            <Link href="/mediation" className="text-clay-400 hover:text-clay-700">
              Service de médiation
            </Link>
          </nav>
        </div>
      </section>

      {/* E-E-A-T editorial note */}
      <section className="py-6 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-gray-400 leading-relaxed max-w-3xl">
            Les {service.name.toLowerCase()}s référencés à {location.name} sont des entreprises immatriculées, vérifiées via l&apos;API SIRENE de l&apos;INSEE.
            Les tarifs affichés sont indicatifs et basés sur les moyennes du marché en {location.region_name || 'France'} pour un {service.name.toLowerCase()} à {location.name} ({location.department_code}).
            ServicesArtisans est un annuaire indépendant — nous ne réalisons pas de travaux et ne percevons aucune commission.
          </p>
          {locationContent?.dataDriven?.dataSources && locationContent.dataDriven.dataSources.length > 0 && (
            <p className="text-xs text-gray-400 mt-2 max-w-3xl">
              <strong className="text-gray-500">Sources des données locales :</strong>{' '}
              {locationContent.dataDriven.dataSources.join(' · ')}.
              Données mises à jour périodiquement. Dernière actualisation{' '}
              {communeData?.enriched_at
                ? new Date(communeData.enriched_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                : 'récente'}.
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
