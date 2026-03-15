import Link from 'next/link'
import { MapPin, Wrench, Compass } from 'lucide-react'
import {
  practiceAreas as staticPracticeAreas,
  cities,
  getStateByCode,
  getRegionSlugByName,
} from '@/lib/data/usa'
import { slugify } from '@/lib/utils'

interface AttorneyInternalLinksProps {
  specialtySlug: string
  locationSlug: string
  specialtyName: string
  cityName: string
  regionName?: string
  departmentName?: string
  departmentCode?: string
}

export default function AttorneyInternalLinks({
  specialtySlug,
  locationSlug,
  specialtyName,
  cityName,
  regionName,
  departmentName,
  departmentCode,
}: AttorneyInternalLinksProps) {
  // Find current city data to get region/department for nearby filtering
  const currentVille = cities.find(v => v.slug === locationSlug)
  const deptCode = departmentCode || currentVille?.stateCode
  const region = regionName || (deptCode ? getStateByCode(deptCode)?.region : undefined)

  // Column 1: Same service in nearby cities (same state, then same region)
  const sameDeptCities = cities
    .filter(v => v.slug !== locationSlug && v.stateCode === deptCode)
    .slice(0, 4)
  const sameRegionCities = cities
    .filter(v => v.slug !== locationSlug && getStateByCode(v.stateCode)?.region === region && v.stateCode !== deptCode)
    .slice(0, 8 - sameDeptCities.length)
  const nearbyCities = [...sameDeptCities, ...sameRegionCities].slice(0, 8)

  // Column 2: Other services in same city
  const otherServices = staticPracticeAreas
    .filter(s => s.slug !== specialtySlug)
    .slice(0, 8)

  // Column 3: Geographic navigation
  const dept = deptCode ? getStateByCode(deptCode) : undefined
  const regionSlug = region ? getRegionSlugByName(region) : undefined

  return (
    <section className="py-12 bg-sand-100 border-t border-stone-200/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">See also</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Column 1: Same service, nearby cities */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-clay-400" />
              {specialtyName} in other cities
            </h3>
            {nearbyCities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {nearbyCities.map(city => (
                  <Link
                    key={city.slug}
                    href={`/practice-areas/${specialtySlug}/${city.slug}`}
                    className="inline-flex items-center px-3 py-1.5 bg-sand-200 hover:bg-clay-50 text-stone-700 hover:text-clay-600 rounded-full text-sm transition-colors"
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No nearby cities available</p>
            )}
            <Link
              href={`/practice-areas/${specialtySlug}`}
              className="inline-block mt-3 text-clay-400 hover:text-clay-600 text-sm font-medium"
            >
              All cities →
            </Link>
          </div>

          {/* Column 2: Other services in this city */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-clay-400" />
              Other attorneys in {cityName}
            </h3>
            <div className="flex flex-wrap gap-2">
              {otherServices.map(s => (
                <Link
                  key={s.slug}
                  href={`/practice-areas/${s.slug}/${locationSlug}`}
                  className="inline-flex items-center px-3 py-1.5 bg-sand-200 hover:bg-clay-50 text-stone-700 hover:text-clay-600 rounded-full text-sm transition-colors"
                >
                  {s.name}
                </Link>
              ))}
            </div>
            <Link
              href={`/cities/${locationSlug}`}
              className="inline-block mt-3 text-clay-400 hover:text-clay-600 text-sm font-medium"
            >
              All attorneys in {cityName} →
            </Link>
          </div>

          {/* Column 3: Geographic navigation + cross-links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Compass className="w-4 h-4 text-clay-400" />
              Explore by area
            </h3>
            <div className="space-y-2">
              {region && (
                <Link
                  href={`/regions/${regionSlug || slugify(region)}`}
                  className="block px-3 py-2 bg-sand-200 hover:bg-clay-50 text-stone-700 hover:text-clay-600 rounded-lg text-sm transition-colors"
                >
                  Attorneys in {region}
                </Link>
              )}
              {dept && (
                <Link
                  href={`/states/${dept.slug}`}
                  className="block px-3 py-2 bg-sand-200 hover:bg-clay-50 text-stone-700 hover:text-clay-600 rounded-lg text-sm transition-colors"
                >
                  Attorneys in {departmentName || dept.name} ({dept.code})
                </Link>
              )}
              {dept && (
                <Link
                  href={`/states/${dept.slug}/${specialtySlug}`}
                  className="block px-3 py-2 bg-sand-200 hover:bg-clay-50 text-stone-700 hover:text-clay-600 rounded-lg text-sm transition-colors"
                >
                  {specialtyName} in {dept.code}
                </Link>
              )}
              <Link
                href={`/cities/${locationSlug}`}
                className="block px-3 py-2 bg-sand-200 hover:bg-clay-50 text-stone-700 hover:text-clay-600 rounded-lg text-sm transition-colors"
              >
                All attorneys in {cityName}
              </Link>
              <Link
                href={`/practice-areas/${specialtySlug}`}
                className="block px-3 py-2 bg-sand-200 hover:bg-clay-50 text-stone-700 hover:text-clay-600 rounded-lg text-sm transition-colors"
              >
                {specialtyName} nationwide
              </Link>
              <Link
                href={`/pricing/${specialtySlug}`}
                className="block px-3 py-2 bg-sand-200 hover:bg-clay-50 text-stone-700 hover:text-clay-600 rounded-lg text-sm transition-colors"
              >
                {specialtyName} fees nationwide
              </Link>
              {['criminal-defense', 'personal-injury', 'family-law', 'immigration', 'dui-dwi', 'bankruptcy'].includes(specialtySlug) && (
                <Link
                  href={`/emergency/${specialtySlug}`}
                  className="block px-3 py-2 bg-sand-200 hover:bg-clay-50 text-stone-700 hover:text-clay-600 rounded-lg text-sm transition-colors"
                >
                  Emergency {specialtyName}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
