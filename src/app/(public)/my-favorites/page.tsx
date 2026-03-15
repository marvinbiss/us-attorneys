'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, Search, MapPin, Star, BadgeCheck, Loader2 } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import { getSupabaseClient } from '@/lib/supabase/client'
import { FavoriteButton } from '@/components/ui/FavoriteButton'
import { getAttorneyUrl } from '@/lib/utils'

interface FavoriteProvider {
  id: string
  stable_id: string
  name: string
  slug: string
  specialty?: string
  address_city?: string
  address_region?: string
  is_verified: boolean
  rating_average?: number
  review_count?: number
}

export default function MesFavorisPage() {
  const { favorites, count, clearFavorites } = useFavorites()
  const [providers, setProviders] = useState<FavoriteProvider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAttorneys() {
      if (favorites.length === 0) {
        setProviders([])
        setLoading(false)
        return
      }

      setLoading(true)

      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('attorneys')
        .select(
          'id, stable_id, name, slug, specialty, address_city, address_region, is_verified, rating_average, review_count',
        )
        .in('stable_id', favorites)
        .eq('is_active', true)

      if (!error && data) {
        // Maintain the favorites order
        const mapped = data as FavoriteProvider[]
        const ordered = favorites
          .map((fid) => mapped.find((p) => p.stable_id === fid))
          .filter(Boolean) as FavoriteProvider[]
        setProviders(ordered)
      } else {
        setProviders([])
      }

      setLoading(false)
    }

    fetchAttorneys()
  }, [favorites])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-900">
              My Favorite Attorneys
            </h1>
            <p className="text-slate-500 mt-1">
              {count === 0
                ? 'No saved attorneys'
                : `${count} saved attorney${count > 1 ? 's' : ''}`}
            </p>
          </div>

          {count > 0 && (
            <button
              type="button"
              onClick={clearFavorites}
              className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Remove all
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && count === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
              <Heart className="w-10 h-10 text-red-300" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">
              You have no favorite attorneys yet
            </h2>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              Browse attorneys and click{' '}
              <Heart className="inline w-4 h-4 text-red-400" /> to
              save them here.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all duration-200"
            >
              <Search className="w-5 h-5" />
              Search attorneys
            </Link>
          </div>
        )}

        {/* Providers grid */}
        {!loading && providers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => {
              const href = getAttorneyUrl({
                stable_id: provider.stable_id,
                slug: provider.slug,
                specialty: provider.specialty,
                city: provider.address_city,
              })

              return (
                <div
                  key={provider.id}
                  className="relative group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* Favorite button */}
                  <div className="absolute top-3 right-3 z-10">
                    <FavoriteButton
                      attorneyId={provider.stable_id}
                      attorneyName={provider.name}
                      size="sm"
                    />
                  </div>

                  <Link href={href} className="block p-5">
                    {/* Avatar + Name */}
                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-sm flex-shrink-0">
                        {provider.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-lg text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {provider.name}
                          </h3>
                          {provider.is_verified && (
                            <BadgeCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        {provider.specialty && (
                          <p className="text-sm text-slate-500 mt-0.5">
                            {provider.specialty}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    {provider.address_city && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {provider.address_city}
                          {provider.address_region &&
                            `, ${provider.address_region}`}
                        </span>
                      </div>
                    )}

                    {/* Rating */}
                    {typeof provider.rating_average === 'number' &&
                      provider.rating_average > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="font-medium text-sm text-slate-900">
                            {provider.rating_average.toFixed(1)}
                          </span>
                          {typeof provider.review_count === 'number' &&
                            provider.review_count > 0 && (
                              <span className="text-sm text-slate-500">
                                ({provider.review_count} reviews)
                              </span>
                            )}
                        </div>
                      )}
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        {/* No results for favorites that were deleted/deactivated */}
        {!loading && count > 0 && providers.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500">
              The saved attorneys are no longer available.
            </p>
            <button
              type="button"
              onClick={clearFavorites}
              className="mt-4 text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Clear favorites
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
