'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Star, MapPin, ChevronLeft, ChevronRight, Users, BadgeCheck } from 'lucide-react'
import type { LegacyAttorney } from '@/types/legacy'
import { getAttorneyUrl } from '@/lib/utils'

interface SimilarAttorney {
  id: string
  stable_id?: string
  slug?: string
  name: string
  specialty: string
  rating: number
  reviews: number
  city: string
  is_verified?: boolean
}

interface AttorneySimilarProps {
  attorney: LegacyAttorney
  similarAttorneys?: SimilarAttorney[]
}

export function AttorneySimilar({ attorney: _attorney, similarAttorneys }: AttorneySimilarProps) {
  const reducedMotion = useReducedMotion()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fallback: show hub link when no similar attorneys available
  if (!similarAttorneys || similarAttorneys.length === 0) {
    const hubUrl = _attorney.specialty_slug && _attorney.city_slug
      ? `/practice-areas/${_attorney.specialty_slug}/${_attorney.city_slug}`
      : null
    if (!hubUrl) return null
    return (
      <div className="bg-[#FFFCF8] rounded-2xl shadow-soft border border-stone-200/60 p-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-clay-400" aria-hidden="true" />
          Similar Attorneys
        </h2>
        <p className="text-gray-600 mb-4">
          Discover other {_attorney.specialty?.toLowerCase() || 'attorneys'} in {_attorney.city}
        </p>
        <Link
          href={hubUrl}
          className="text-clay-400 hover:text-clay-600 font-medium"
        >
          See all {_attorney.specialty?.toLowerCase() || 'attorneys'} in {_attorney.city} →
        </Link>
      </div>
    )
  }

  const similar = similarAttorneys

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.6 }}
      className="bg-[#FFFCF8] rounded-2xl shadow-soft border border-stone-200/60 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-clay-400" aria-hidden="true" />
          Similar Attorneys
        </h2>

        {/* Navigation buttons */}
        <div className="flex gap-2" role="group" aria-label="Carousel navigation">
          <motion.button
            whileHover={reducedMotion ? undefined : { scale: 1.1 }}
            whileTap={reducedMotion ? undefined : { scale: 0.9 }}
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-clay-400"
            aria-label="View previous attorneys"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" aria-hidden="true" />
          </motion.button>
          <motion.button
            whileHover={reducedMotion ? undefined : { scale: 1.1 }}
            whileTap={reducedMotion ? undefined : { scale: 0.9 }}
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-clay-400"
            aria-label="View next attorneys"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" aria-hidden="true" />
          </motion.button>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2"
        style={{ scrollSnapType: 'x mandatory' }}
        role="list"
        aria-label="Similar attorneys list"
      >
        {similar.map((item, index) => (
          <motion.div
            key={item.id}
            role="listitem"
            initial={reducedMotion ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.3, delay: index * 0.05 }}
            style={{ scrollSnapAlign: 'start' }}
          >
            <Link
              href={getAttorneyUrl({ stable_id: item.stable_id, slug: item.slug, specialty: item.specialty, city: item.city })}
              aria-label={`View ${item.name}'s profile, ${item.specialty} in ${item.city}, rated ${item.rating} out of 5`}
            >
              <motion.article
                whileHover={reducedMotion ? undefined : { y: -4, boxShadow: '0 12px 24px -8px rgba(0,0,0,0.15)' }}
                className="w-72 bg-white rounded-xl border border-gray-100 p-4 transition-all cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-clay-400 to-clay-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    <span aria-hidden="true">{item.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.specialty}</p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {item.is_verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-clay-50 text-clay-700 text-xs font-medium">
                      <BadgeCheck className="w-3 h-3" aria-hidden="true" />
                      Verified
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1" aria-label={`Rating: ${item.rating} out of 5, ${item.reviews} reviews`}>
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" aria-hidden="true" />
                    <span className="font-semibold text-gray-900">{item.rating}</span>
                    <span className="text-gray-500 text-sm">({item.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{item.city}</span>
                  </div>
                </div>

              </motion.article>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
