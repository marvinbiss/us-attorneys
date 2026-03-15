'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, CheckCircle, ChevronDown } from 'lucide-react'
import { Artisan, Review } from './types'

const MAX_VISIBLE_REVIEWS = 3

/** Format a date string to French locale (e.g. "12 mars 2025") */
function formatDateFr(raw: string): string {
  try {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return raw
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return raw
  }
}

/** Render star icons for a given rating */
function ReviewStars({ rating, size = 'w-4 h-4' }: { rating: number; size?: string }) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.5
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = s <= full
        const half = !filled && s === full + 1 && hasHalf
        return (
          <Star
            key={s}
            className={`${size} ${
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
  )
}

/** Single review card */
function ReviewCard({ review, index }: { review: Review; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: index * 0.1 }}
      className="bg-[#FFFCF8] rounded-xl border border-sand-200 p-4"
    >
      {/* Header: author + rating + date */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800 text-sm truncate">{review.author}</span>
            {review.verified && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"
                title="Cet avis provient d'un client ayant utilisé la plateforme"
              >
                <CheckCircle className="w-3 h-3" aria-hidden="true" />
                Avis vérifié
              </span>
            )}
          </div>
          <ReviewStars rating={review.rating} />
        </div>
        <time
          className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0"
          dateTime={review.dateISO || review.date}
        >
          {formatDateFr(review.dateISO || review.date)}
        </time>
      </div>

      {/* Comment */}
      <p
        className={`text-sm text-gray-700 leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}
      >
        {review.comment}
      </p>
      {review.comment.length > 180 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-clay-500 hover:text-clay-600 text-xs font-medium mt-1 inline-flex items-center gap-0.5 transition-colors"
        >
          Lire plus
          <ChevronDown className="w-3 h-3" aria-hidden="true" />
        </button>
      )}

      {/* Service tag */}
      {review.service && (
        <div className="mt-2.5">
          <span className="inline-block text-xs font-medium text-stone-600 bg-sand-200 px-2 py-0.5 rounded-full">
            {review.service}
          </span>
        </div>
      )}
    </motion.div>
  )
}

interface AttorneyReviewsProps {
  artisan: Artisan
  reviews: Review[]
}

export function AttorneyReviews({ artisan, reviews }: AttorneyReviewsProps) {
  const rating = artisan.average_rating
  const count = artisan.review_count

  // Nothing to show if no aggregate rating
  if (!rating || rating === 0) return null

  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.5

  const visibleReviews = reviews.slice(0, MAX_VISIBLE_REVIEWS)
  const hasMoreReviews = reviews.length > MAX_VISIBLE_REVIEWS

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-[#FFFCF8] rounded-2xl shadow-soft border border-stone-200/60 p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" aria-hidden="true" />
          Réputation
        </h2>
        {/* Source attribution badge */}
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-500"
          title="Note observée sur Google"
        >
          <span
            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-stone-700 text-white font-bold leading-none"
            style={{ fontSize: '9px' }}
            aria-hidden="true"
          >
            G
          </span>
          Observé sur Google
        </span>
      </div>

      {/* Aggregate rating block */}
      <div className="flex items-center gap-5">
        <div className="text-center flex-shrink-0">
          <div
            className="text-5xl font-bold text-gray-900 leading-none"
            aria-label={`Note de ${rating.toFixed(1)} sur 5`}
          >
            {rating.toFixed(1)}
          </div>
          {/* Stars */}
          <div className="flex items-center justify-center gap-0.5 mt-2" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = star <= fullStars
              const half = !filled && star === fullStars + 1 && hasHalf
              return (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    filled
                      ? 'text-amber-500 fill-amber-500'
                      : half
                      ? 'text-amber-400 fill-amber-200'
                      : 'text-gray-200 fill-gray-200'
                  }`}
                />
              )
            })}
          </div>
          {count > 0 && (
            <div className="text-sm text-gray-500 mt-1.5">
              {count.toLocaleString('fr-FR')} avis
            </div>
          )}
        </div>

        {/* Contextual note */}
        <div className="flex-1 pl-5 border-l border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed">
            Note consolidée basée sur les avis clients collectés en ligne.
          </p>
          {count > 0 && (
            <p className="text-xs text-gray-400 mt-1.5">
              Source : Google Business Profile
            </p>
          )}
        </div>
      </div>

      {/* Individual reviews */}
      {visibleReviews.length > 0 && (
        <div className="mt-6 pt-6 border-t border-sand-200">
          <h3 className="text-base font-semibold text-stone-800 mb-4">
            Derniers avis clients
          </h3>
          <div className="space-y-3">
            {visibleReviews.map((review, i) => (
              <ReviewCard key={review.id} review={review} index={i} />
            ))}
          </div>

          {hasMoreReviews && (
            <div className="mt-4 text-center">
              <a
                href="#reviews"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-clay-500 hover:text-clay-600 transition-colors"
              >
                Voir tous les avis ({reviews.length})
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
