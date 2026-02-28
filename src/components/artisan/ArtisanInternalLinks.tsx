import Link from 'next/link'
import { MapPin, Wrench, Compass } from 'lucide-react'
import {
  services as staticServicesList,
  villes,
  getDepartementByCode,
  getRegionSlugByName,
} from '@/lib/data/france'
import { slugify } from '@/lib/utils'

interface ArtisanInternalLinksProps {
  serviceSlug: string
  locationSlug: string
  serviceName: string
  cityName: string
  regionName?: string
  departmentName?: string
  departmentCode?: string
}

export default function ArtisanInternalLinks({
  serviceSlug,
  locationSlug,
  serviceName,
  cityName,
  regionName,
  departmentName,
  departmentCode,
}: ArtisanInternalLinksProps) {
  // Find current city data to get region/department for nearby filtering
  const currentVille = villes.find(v => v.slug === locationSlug)
  const region = regionName || currentVille?.region
  const deptCode = departmentCode || currentVille?.departementCode

  // Column 1: Same service in nearby cities (same region, prioritize same department)
  const sameDeptCities = villes
    .filter(v => v.slug !== locationSlug && v.departementCode === deptCode)
    .slice(0, 4)
  const sameRegionCities = villes
    .filter(v => v.slug !== locationSlug && v.region === region && v.departementCode !== deptCode)
    .slice(0, 8 - sameDeptCities.length)
  const nearbyCities = [...sameDeptCities, ...sameRegionCities].slice(0, 8)

  // Column 2: Other services in same city
  const otherServices = staticServicesList
    .filter(s => s.slug !== serviceSlug)
    .slice(0, 8)

  // Column 3: Geographic navigation
  const dept = deptCode ? getDepartementByCode(deptCode) : undefined
  const regionSlug = region ? getRegionSlugByName(region) : undefined

  return (
    <section className="py-12 bg-sand-100 border-t border-stone-200/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Voir aussi</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Column 1: Same service, nearby cities */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-clay-400" />
              {serviceName} dans d&apos;autres villes
            </h3>
            {nearbyCities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {nearbyCities.map(city => (
                  <Link
                    key={city.slug}
                    href={`/services/${serviceSlug}/${city.slug}`}
                    className="inline-flex items-center px-3 py-1.5 bg-sand-200 hover:bg-clay-50 text-stone-700 hover:text-clay-600 rounded-full text-sm transition-colors"
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucune ville proche disponible</p>
            )}
            <Link
              href={`/services/${serviceSlug}`}
              className="inline-block mt-3 text-clay-400 hover:text-clay-600 text-sm font-medium"
            >
              Toutes les villes →
            </Link>
          </div>

          {/* Column 2: Other services in this city */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-clay-400" />
              Autres artisans à {cityName}
            </h3>
            <div className="flex flex-wrap gap-2">
              {otherServices.map(s => (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}/${locationSlug}`}
                  className="inline-flex items-center px-3 py-1.5 bg-sand-200 hover:bg-clay-50 text-stone-700 hover:text-clay-600 rounded-full text-sm transition-colors"
                >
                  {s.name}
                </Link>
              ))}
            </div>
            <Link
              href={`/villes/${locationSlug}`}
              className="inline-block mt-3 text-clay-400 hover:text-clay-600 text-sm font-medium"
            >
              Tous les artisans à {cityName} →
            </Link>
          </div>

          {/* Column 3: Geographic navigation + cross-links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Compass className="w-4 h-4 text-clay-400" />
              Explorer par zone
            </h3>
            <div className="space-y-2">
              {region && (
                <Link
                  href={`/regions/${regionSlug || slugify(region)}`}
                  className="block px-3 py-2 bg-sand-200 hover:bg-clay-50 text-stone-700 hover:text-clay-600 rounded-lg text-sm transition-colors"
                >
                  Artisans en {region}
                </Link>
              )}
              {dept && (
                <Link
                  href={`/departements/${dept.slug}`}
                  className="block px-3 py-2 bg-sand-200 hover:bg-clay-50 text-stone-700 hover:text-clay-600 rounded-lg text-sm transition-colors"
                >
                  Artisans dans {departmentName || dept.name} ({dept.code})
                </Link>
              )}
              {dept && (
                <Link
                  href={`/departements/${dept.slug}/${serviceSlug}`}
                  className="block px-3 py-2 bg-sand-200 hover:bg-clay-50 text-stone-700 hover:text-clay-600 rounded-lg text-sm transition-colors"
                >
                  {serviceName} dans le {dept.code}
                </Link>
              )}
              <Link
                href={`/villes/${locationSlug}`}
                className="block px-3 py-2 bg-sand-200 hover:bg-clay-50 text-stone-700 hover:text-clay-600 rounded-lg text-sm transition-colors"
              >
                Tous les artisans à {cityName}
              </Link>
              <Link
                href={`/services/${serviceSlug}`}
                className="block px-3 py-2 bg-sand-200 hover:bg-clay-50 text-stone-700 hover:text-clay-600 rounded-lg text-sm transition-colors"
              >
                {serviceName} en France
              </Link>
              <Link
                href={`/tarifs/${serviceSlug}`}
                className="block px-3 py-2 bg-sand-200 hover:bg-clay-50 text-stone-700 hover:text-clay-600 rounded-lg text-sm transition-colors"
              >
                Tarifs {serviceName} en France
              </Link>
              {['plombier', 'electricien', 'serrurier', 'chauffagiste', 'vitrier', 'couvreur'].includes(serviceSlug) && (
                <Link
                  href={`/urgence/${serviceSlug}`}
                  className="block px-3 py-2 bg-sand-200 hover:bg-clay-50 text-stone-700 hover:text-clay-600 rounded-lg text-sm transition-colors"
                >
                  Urgence {serviceName}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
