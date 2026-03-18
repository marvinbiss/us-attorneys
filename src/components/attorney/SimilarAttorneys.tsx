import Link from 'next/link'
import { Star, MapPin, Users, BadgeCheck, ArrowRight } from 'lucide-react'
import { getAttorneyUrl } from '@/lib/utils'
import { getSimilarAttorneys } from '@/lib/supabase'

// ============================================================================
// SimilarAttorneys — Server component for internal linking on attorney profiles
// Fetches attorneys sharing the same primary specialty and city/state.
// Renders card links for maximum internal linking density.
// ============================================================================

interface SimilarAttorneysProps {
  attorneyId: string
  specialtyName: string
  specialtySlug: string
  city: string
  citySlug?: string
  stateCode?: string
  limit?: number
  className?: string
}

export default async function SimilarAttorneys({
  attorneyId,
  specialtyName,
  specialtySlug,
  city,
  citySlug,
  stateCode,
  limit = 6,
  className = '',
}: SimilarAttorneysProps) {
  const similar = await getSimilarAttorneys(attorneyId, specialtyName, stateCode, limit)

  // Fallback: always show hub link even if no similar attorneys
  if (similar.length === 0) {
    const hubUrl = specialtySlug && citySlug
      ? `/practice-areas/${specialtySlug}/${citySlug}`
      : specialtySlug
        ? `/practice-areas/${specialtySlug}`
        : null

    if (!hubUrl) return null

    return (
      <section className={`py-8 ${className}`} aria-label={`Similar attorneys in ${city}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-clay-400" aria-hidden="true" />
            Similar {specialtyName} Attorneys
          </h2>
          <p className="text-gray-600 mb-3">
            Find more {specialtyName.toLowerCase()} attorneys in {city} and surrounding areas.
          </p>
          <Link
            href={hubUrl}
            className="text-clay-400 hover:text-clay-600 font-medium text-sm flex items-center gap-1 group"
          >
            Browse all {specialtyName.toLowerCase()} attorneys in {city}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className={`py-8 ${className}`} aria-label={`Similar ${specialtyName} attorneys`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-clay-400" aria-hidden="true" />
            Similar {specialtyName} Attorneys in {city}
          </h2>
          {citySlug && specialtySlug && (
            <Link
              href={`/practice-areas/${specialtySlug}/${citySlug}`}
              className="text-clay-400 hover:text-clay-600 text-sm flex items-center gap-1 group"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {similar.map((attorney) => (
            <Link
              key={attorney.id}
              href={getAttorneyUrl({
                stable_id: attorney.stable_id || undefined,
                slug: attorney.slug || undefined,
                specialty: attorney.specialty,
                city: attorney.city,
              })}
              className="block bg-white rounded-xl border border-gray-100 hover:border-clay-200 hover:shadow-md p-4 transition-all duration-200"
              aria-label={`View ${attorney.name}'s profile`}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-clay-400 to-clay-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                  <span aria-hidden="true">{attorney.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate text-sm">{attorney.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{attorney.specialty}</p>

                  <div className="flex items-center gap-3 mt-2">
                    {attorney.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" aria-hidden="true" />
                        <span className="text-xs font-medium text-gray-900">{attorney.rating.toFixed(1)}</span>
                        {attorney.reviews > 0 && (
                          <span className="text-xs text-gray-500">({attorney.reviews})</span>
                        )}
                      </div>
                    )}
                    {attorney.city && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" aria-hidden="true" />
                        <span>{attorney.city}</span>
                      </div>
                    )}
                    {attorney.is_verified && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-clay-600">
                        <BadgeCheck className="w-3 h-3" aria-hidden="true" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
