import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'
import { getNearbyCities, getCityBySlug, getStateByCode } from '@/lib/data/usa'

// ============================================================================
// NearbyCities — "Attorneys near [city]" internal linking component
// Server component: given a city slug and optional specialty, renders links
// to nearby cities. Uses static data (getNearbyCities) which sorts by
// population within same state/metro. No DB call needed.
// ============================================================================

interface NearbyCitiesProps {
  citySlug: string
  specialtySlug?: string
  specialtyName?: string
  limit?: number
  className?: string
}

export default function NearbyCities({
  citySlug,
  specialtySlug,
  specialtyName,
  limit = 8,
  className = '',
}: NearbyCitiesProps) {
  const city = getCityBySlug(citySlug)
  if (!city) return null

  const nearby = getNearbyCities(citySlug, limit)
  if (nearby.length === 0) return null

  const state = getStateByCode(city.stateCode)
  const cityLabel = city.name

  return (
    <section className={`py-8 ${className}`} aria-label={`Attorneys near ${cityLabel}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-clay-400" aria-hidden="true" />
          {specialtyName
            ? `${specialtyName} Attorneys Near ${cityLabel}`
            : `Attorneys Near ${cityLabel}`
          }
        </h2>

        <div className="flex flex-wrap gap-2">
          {nearby.map(nearbyCity => {
            const href = specialtySlug
              ? `/practice-areas/${specialtySlug}/${nearbyCity.slug}`
              : `/cities/${nearbyCity.slug}`

            return (
              <Link
                key={nearbyCity.slug}
                href={href}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-sand-100 hover:bg-clay-50 text-stone-700 hover:text-clay-600 rounded-lg text-sm border border-stone-200/40 hover:border-clay-200 transition-all duration-200"
              >
                <MapPin className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                {nearbyCity.name}, {nearbyCity.stateCode}
              </Link>
            )
          })}
        </div>

        {/* Link to state page for broader exploration */}
        {state && (
          <div className="mt-4 flex gap-4">
            <Link
              href={`/states/${state.slug}`}
              className="text-clay-400 hover:text-clay-600 text-sm flex items-center gap-1 group"
            >
              All attorneys in {state.name}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </Link>
            {specialtySlug && (
              <Link
                href={`/practice-areas/${specialtySlug}`}
                className="text-clay-400 hover:text-clay-600 text-sm flex items-center gap-1 group"
              >
                {specialtyName || 'This practice area'} nationwide
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
