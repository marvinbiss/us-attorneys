import Link from 'next/link'
import { MapPin, ChevronDown } from 'lucide-react'
import type { NearbyZip } from '@/lib/zip-pages'
import { zipToSlug } from '@/lib/zip-pages'

// ============================================================================
// NearbyZipCodes — ZIP-level internal linking component (Server Component)
//
// Shows 8-12 nearby ZIP codes as link chips with distance indicators.
// Includes an expandable "More ZIP codes in [City]" section.
// All links are SSR in the initial HTML for optimal crawlability.
// ============================================================================

interface NearbyZipCodesProps {
  nearbyZips: NearbyZip[]
  specialtySlug: string
  specialtyName: string
  cityName: string
  citySlug: string
  stateCode: string
  currentZipCode: string
  className?: string
}

export default function NearbyZipCodes({
  nearbyZips,
  specialtySlug,
  specialtyName,
  cityName,
  citySlug,
  stateCode,
  currentZipCode,
  className = '',
}: NearbyZipCodesProps) {
  if (nearbyZips.length === 0) return null

  // Split into primary (visible) and secondary (expandable)
  const primaryZips = nearbyZips.slice(0, 8)
  const secondaryZips = nearbyZips.slice(8)

  return (
    <section
      className={`py-8 border-t border-stone-200/40 dark:border-white/[0.06] ${className}`}
      aria-label={`Nearby ZIP codes for ${specialtyName} near ${currentZipCode}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-clay-400" aria-hidden="true" />
          {specialtyName} in Nearby ZIP Codes
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Find {specialtyName.toLowerCase()} attorneys near {cityName}, {stateCode} in these neighboring areas
        </p>

        {/* Primary ZIP chips */}
        <div className="flex flex-wrap gap-2">
          {primaryZips.map(zip => {
            const slug = zipToSlug(zip.code, zip.citySlug)
            return (
              <Link
                key={zip.code}
                href={`/practice-areas/${specialtySlug}/${slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-sand-100 hover:bg-clay-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-stone-700 hover:text-clay-600 dark:text-gray-400 dark:hover:text-white border border-stone-200/40 hover:border-clay-200 dark:border-white/[0.06] dark:hover:border-white/[0.12] rounded-lg text-sm transition-all duration-200"
              >
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
                <span className="font-medium">{zip.code}</span>
                <span className="text-gray-400 dark:text-gray-500">
                  {zip.cityName}
                </span>
                {zip.distanceMiles !== null && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-0.5">
                    ({zip.distanceMiles} mi)
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Expandable section for additional ZIPs */}
        {secondaryZips.length > 0 && (
          <details className="mt-4 group">
            <summary className="inline-flex items-center gap-1.5 text-sm text-clay-400 hover:text-clay-600 dark:text-clay-400 dark:hover:text-clay-300 cursor-pointer select-none">
              <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" aria-hidden="true" />
              More ZIP codes near {cityName} ({secondaryZips.length} more)
            </summary>
            <div className="flex flex-wrap gap-2 mt-3">
              {secondaryZips.map(zip => {
                const slug = zipToSlug(zip.code, zip.citySlug)
                return (
                  <Link
                    key={zip.code}
                    href={`/practice-areas/${specialtySlug}/${slug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-sand-100 hover:bg-clay-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-stone-700 hover:text-clay-600 dark:text-gray-400 dark:hover:text-white border border-stone-200/40 hover:border-clay-200 dark:border-white/[0.06] dark:hover:border-white/[0.12] rounded-lg text-sm transition-all duration-200"
                  >
                    <span className="font-medium">{zip.code}</span>
                    <span className="text-gray-400 dark:text-gray-500">{zip.cityName}</span>
                    {zip.distanceMiles !== null && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        ({zip.distanceMiles} mi)
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </details>
        )}

        {/* Link to parent city page */}
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href={`/practice-areas/${specialtySlug}/${citySlug}`}
            className="text-clay-400 hover:text-clay-600 dark:text-clay-400 dark:hover:text-clay-300 text-sm flex items-center gap-1 group"
          >
            All {specialtyName.toLowerCase()} in {cityName}
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
          <Link
            href={`/cities/${citySlug}`}
            className="text-clay-400 hover:text-clay-600 dark:text-clay-400 dark:hover:text-clay-300 text-sm flex items-center gap-1 group"
          >
            All attorneys in {cityName}
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
