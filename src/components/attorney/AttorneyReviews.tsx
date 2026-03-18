'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Star, CheckCircle, ChevronDown } from 'lucide-react'
import { Artisan, Review } from './types'

const MAX_VISIBLE_REVIEWS = 3

/** Format a date string to US locale (e.g. "March 12, 2025") */
function formatDate(raw: string): string {
  try {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return raw
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return raw
  }
}

/** Render star icons for a given rating */
function ReviewStars({ rating, size = 'w-4 h-4' }: { rating: number; size?: string }) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.5
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
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
                : 'text-gray-200 dark:text-gray-600 fill-gray-200 dark:fill-gray-600'
            }`}
            aria-hidden="true"
          />
        )
      })}
    </div>
  )
}

/** Single review card */
function ReviewCard({ review, index, reducedMotion }: { review: Review; index: number; reducedMotion: boolean }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.35, delay: index * 0.1 }}
      className="bg-[#FFFCF8] dark:bg-gray-700/50 rounded-xl border border-sand-200 dark:border-gray-600 p-4"
    >
      {/* Header: author + rating + date */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800 dark:text-gray-100 text-sm truncate">{review.author}</span>
            {review.verified && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 px-2 py-0.5 rounded-full"
                title="This review is from a client who used the platform"
              >
                <CheckCircle className="w-3 h-3" aria-hidden="true" />
                Verified review
              </span>
            )}
          </div>
          <ReviewStars rating={review.rating} />
        </div>
        <time
          className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0"
          dateTime={review.dateISO || review.date}
        >
          {formatDate(review.dateISO || review.date)}
        </time>
      </div>

      {/* Comment */}
      <p
        className={`text-sm text-gray-700 dark:text-gray-300 leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}
      >
        {review.comment}
      </p>
      {review.comment.length > 180 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-clay-500 dark:text-clay-300 hover:text-clay-600 dark:hover:text-clay-200 text-xs font-medium mt-1 inline-flex items-center gap-0.5 transition-colors"
        >
          Read more
          <ChevronDown className="w-3 h-3" aria-hidden="true" />
        </button>
      )}

      {/* Service tag */}
      {review.service && (
        <div className="mt-2.5">
          <span className="inline-block text-xs font-medium text-stone-600 dark:text-gray-300 bg-sand-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
            {review.service}
          </span>
        </div>
      )}
    </motion.div>
  )
}

interface AttorneyReviewsProps {
  attorney: Artisan
  reviews: Review[]
}

export function AttorneyReviews({ attorney, reviews }: AttorneyReviewsProps) {
  const reducedMotion = useReducedMotion()
  const rating = attorney.average_rating
  const count = attorney.review_count

  // Nothing to show if no aggregate rating
  if (!rating || rating === 0) return null

  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.5

  const visibleReviews = reviews.slice(0, MAX_VISIBLE_REVIEWS)
  const hasMoreReviews = reviews.length > MAX_VISIBLE_REVIEWS

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.3 }}
      className="bg-[#FFFCF8] dark:bg-gray-800 rounded-2xl shadow-soft border border-stone-200/60 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
            <Star className="w-4.5 h-4.5 text-amber-500 fill-amber-500" aria-hidden="true" />
          </div>
          Reviews
        </h2>
        {/* Source attribution badge */}
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs font-medium text-gray-500 dark:text-gray-400"
          title="Rating observed on Google"
        >
          <span
            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-stone-700 dark:bg-gray-500 text-white font-bold leading-none"
            style={{ fontSize: '9px' }}
            aria-hidden="true"
          >
            G
          </span>
          Observed on Google
        </span>
      </div>

      {/* Aggregate rating block */}
      <div className="flex items-center gap-5">
        <div className="text-center flex-shrink-0">
          <div
            className="text-5xl font-bold text-gray-900 dark:text-gray-100 leading-none"
            aria-label={`Rating ${rating.toFixed(1)} out of 5`}
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
                      : 'text-gray-200 dark:text-gray-600 fill-gray-200 dark:fill-gray-600'
                  }`}
                />
              )
            })}
          </div>
          {count > 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
              {count.toLocaleString('en-US')} reviews
            </div>
          )}
        </div>

        {/* Contextual note */}
        <div className="flex-1 pl-5 border-l border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Consolidated rating based on client reviews collected online.
          </p>
          {count > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              Source: Google Business Profile
            </p>
          )}
        </div>
      </div>

      {/* Individual reviews */}
      {visibleReviews.length > 0 && (
        <div className="mt-6 pt-6 border-t border-sand-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-stone-800 dark:text-gray-100 mb-4">
            Latest client reviews
          </h3>
          <div className="space-y-3">
            {visibleReviews.map((review, i) => (
              <ReviewCard key={review.id} review={review} index={i} reducedMotion={reducedMotion} />
            ))}
          </div>

          {hasMoreReviews && (
            <div className="mt-4 text-center">
              <a
                href="#reviews"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-clay-500 dark:text-clay-300 hover:text-clay-600 dark:hover:text-clay-200 transition-colors"
              >
                See all reviews ({reviews.length})
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
