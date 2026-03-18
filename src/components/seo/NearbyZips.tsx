import Link from 'next/link'
import { MapPin, ArrowRight, Navigation } from 'lucide-react'

// ============================================================================
// NearbyZips — "Also serving these areas" internal linking component
// Server component: renders links to nearby ZIP code pages.
// Used on ZIP-level pages to create a dense internal link mesh.
// ============================================================================

interface NearbyZipItem {
  code: string
  cityName: string
  stateCode: string
  distanceMiles: number | null
}

interface NearbyZipsProps {
  zipCode: string
  cityName: string
  stateCode: string
  specialtySlug: string
  specialtyName: string
  nearbyZips: NearbyZipItem[]
  /** City-level page slug for upward link */
  citySlug?: string
  /** State slug for state-level link */
  stateSlug?: string
  stateName?: string
  className?: string
}

export default function NearbyZips({
  zipCode,
  cityName,
  stateCode,
  specialtySlug,
  specialtyName,
  nearbyZips,
  citySlug,
  stateSlug,
  stateName,
  className = '',
}: NearbyZipsProps) {
  if (nearbyZips.length === 0) return null

  return (
    <section
      className={`py-8 ${className}`}
      aria-label={`${specialtyName} attorneys near ZIP ${zipCode}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-clay-400" aria-hidden="true" />
          Also Serving These Areas
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {specialtyName} attorneys near {cityName}, {stateCode} {zipCode}
        </p>

        <div className="flex flex-wrap gap-2">
          {nearbyZips.map(zip => (
            <Link
              key={zip.code}
              href={`/practice-areas/${specialtySlug}/zip/${zip.code}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-sand-100 dark:bg-gray-800 hover:bg-clay-50 dark:hover:bg-gray-700 text-stone-700 dark:text-gray-300 hover:text-clay-600 dark:hover:text-clay-400 rounded-lg text-sm border border-stone-200/40 dark:border-gray-700 hover:border-clay-200 dark:hover:border-clay-600 transition-all duration-200"
            >
              <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              <span>{zip.cityName} {zip.code}</span>
              {zip.distanceMiles !== null && (
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-0.5">
                  ({zip.distanceMiles} mi)
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Upward links: city page + state page */}
        <div className="mt-4 flex flex-wrap gap-4">
          {citySlug && (
            <Link
              href={`/practice-areas/${specialtySlug}/${citySlug}`}
              className="text-clay-400 hover:text-clay-600 dark:text-clay-300 dark:hover:text-clay-400 text-sm flex items-center gap-1 group"
            >
              {specialtyName} in {cityName}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </Link>
          )}
          {stateSlug && (
            <Link
              href={`/states/${stateSlug}`}
              className="text-clay-400 hover:text-clay-600 dark:text-clay-300 dark:hover:text-clay-400 text-sm flex items-center gap-1 group"
            >
              All attorneys in {stateName || stateCode}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </Link>
          )}
          <Link
            href={`/practice-areas/${specialtySlug}`}
            className="text-clay-400 hover:text-clay-600 dark:text-clay-300 dark:hover:text-clay-400 text-sm flex items-center gap-1 group"
          >
            {specialtyName} nationwide
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
