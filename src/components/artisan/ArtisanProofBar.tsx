'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Star, CheckCircle } from 'lucide-react'
import { getDisplayName } from './types'
import type { LegacyArtisan } from '@/types/legacy'

interface ArtisanProofBarProps {
  artisan: LegacyArtisan
  visible: boolean
}

export function ArtisanProofBar({ artisan, visible }: ArtisanProofBarProps) {
  const displayName = getDisplayName(artisan)
  const rating = artisan.average_rating
  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.5

  function handleCTA() {
    window.dispatchEvent(new Event('sa:open-estimation'))
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed top-[57px] left-0 right-0 z-30 bg-[#FFFCF8]/95 backdrop-blur-md border-b border-stone-200/50 shadow-sm"
        >
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
            {/* Left: name + rating (desktop) / name only (mobile) */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-semibold text-stone-800 text-sm truncate">
                {displayName}
              </span>

              {/* Rating stars — hidden on mobile */}
              {rating > 0 && (
                <div className="hidden sm:flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} sur 5`}>
                    {[1, 2, 3, 4, 5].map((s) => {
                      const filled = s <= fullStars
                      const half = !filled && s === fullStars + 1 && hasHalf
                      return (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            filled
                              ? 'text-amber-500 fill-amber-500'
                              : half
                              ? 'text-amber-400 fill-amber-200'
                              : 'text-gray-200 fill-gray-200'
                          }`}
                          aria-hidden="true"
                        />
                      )
                    })}
                  </div>
                  <span className="text-xs text-gray-500">{rating.toFixed(1)}</span>
                </div>
              )}

              {/* SIRET verified badge — hidden on mobile */}
              {artisan.is_verified && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  <CheckCircle className="w-3 h-3" aria-hidden="true" />
                  Vérifié SIRET
                </span>
              )}
            </div>

            {/* CTA button */}
            <button
              onClick={handleCTA}
              className="flex-shrink-0 px-4 py-1.5 bg-clay-400 hover:bg-clay-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-glow-clay"
            >
              Devis gratuit
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
