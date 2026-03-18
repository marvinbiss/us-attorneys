'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Star, ChevronDown, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import { Artisan, Review } from './types'
import { StructuredRatingDisplay } from '@/components/reviews/StructuredRatingDisplay'
import { ReviewCard } from '@/components/reviews/ReviewCard'

const PAGE_SIZE = 5

type SortOption = 'recent' | 'highest' | 'lowest' | 'helpful'
type FilterOption = 'all' | '5' | '4' | '3' | '2' | '1'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'helpful', label: 'Most helpful' },
  { value: 'highest', label: 'Highest rated' },
  { value: 'lowest', label: 'Lowest rated' },
]

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All ratings' },
  { value: '5', label: '5 stars' },
  { value: '4', label: '4 stars' },
  { value: '3', label: '3 stars' },
  { value: '2', label: '2 stars' },
  { value: '1', label: '1 star' },
]

/** Compute averages for each sub-rating axis across all reviews */
function computeAxisAverages(reviews: Review[]) {
  const withSubRatings = reviews.filter(
    (r) =>
      r.rating_communication != null &&
      r.rating_result != null &&
      r.rating_responsiveness != null
  )

  if (withSubRatings.length === 0) {
    return null
  }

  const sum = withSubRatings.reduce(
    (acc, r) => ({
      communication: acc.communication + (r.rating_communication || 0),
      result: acc.result + (r.rating_result || 0),
      responsiveness: acc.responsiveness + (r.rating_responsiveness || 0),
    }),
    { communication: 0, result: 0, responsiveness: 0 }
  )

  const count = withSubRatings.length
  return {
    communication: Number((sum.communication / count).toFixed(1)),
    result: Number((sum.result / count).toFixed(1)),
    responsiveness: Number((sum.responsiveness / count).toFixed(1)),
  }
}

/** Compute distribution of star ratings */
function computeDistribution(reviews: Review[]): Record<number, number> {
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of reviews) {
    const rounded = Math.round(r.rating)
    if (rounded >= 1 && rounded <= 5) {
      dist[rounded] = (dist[rounded] || 0) + 1
    }
  }
  return dist
}

interface AttorneyReviewsProps {
  attorney: Artisan
  reviews: Review[]
}

export function AttorneyReviews({ attorney, reviews }: AttorneyReviewsProps) {
  const reducedMotion = useReducedMotion()
  const rating = attorney.average_rating
  const count = attorney.review_count

  const [sort, setSort] = useState<SortOption>('recent')
  const [filter, setFilter] = useState<FilterOption>('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [showControls, setShowControls] = useState(false)

  // Compute axis averages and distribution
  const axisAverages = useMemo(() => computeAxisAverages(reviews), [reviews])
  const distribution = useMemo(() => computeDistribution(reviews), [reviews])

  // Filter reviews
  const filteredReviews = useMemo(() => {
    let result = [...reviews]

    // Rating filter
    if (filter !== 'all') {
      const target = parseInt(filter, 10)
      result = result.filter((r) => Math.round(r.rating) === target)
    }

    // Sort
    switch (sort) {
      case 'recent':
        result.sort((a, b) => {
          const da = new Date(a.dateISO || a.date).getTime()
          const db = new Date(b.dateISO || b.date).getTime()
          return db - da
        })
        break
      case 'helpful':
        result.sort(
          (a, b) => (b.helpful_count || 0) - (a.helpful_count || 0)
        )
        break
      case 'highest':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'lowest':
        result.sort((a, b) => a.rating - b.rating)
        break
    }

    return result
  }, [reviews, filter, sort])

  const visibleReviews = filteredReviews.slice(0, visibleCount)
  const hasMore = filteredReviews.length > visibleCount

  // Nothing to show if no aggregate rating
  if (!rating || rating === 0) return null

  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.5

  return (
    <motion.section
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-stone-200/60 dark:border-gray-700 p-6"
      aria-labelledby="reviews-heading"
      id="reviews"
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <h2
          id="reviews-heading"
          className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2.5"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
            <Star
              className="w-4.5 h-4.5 text-amber-500 fill-amber-500"
              aria-hidden="true"
            />
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
      <div className="flex flex-col sm:flex-row items-start gap-6">
        {/* Overall score */}
        <div className="text-center flex-shrink-0">
          <div
            className="text-5xl font-bold text-gray-900 dark:text-gray-100 leading-none"
            aria-label={`Rating ${rating.toFixed(1)} out of 5`}
          >
            {rating.toFixed(1)}
          </div>
          {/* Stars */}
          <div
            className="flex items-center justify-center gap-0.5 mt-2"
            aria-hidden="true"
          >
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
              {count.toLocaleString('en-US')} review{count !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Composite breakdown */}
        <div className="flex-1 w-full min-w-0">
          {axisAverages ? (
            <StructuredRatingDisplay
              communication={axisAverages.communication}
              result={axisAverages.result}
              responsiveness={axisAverages.responsiveness}
              totalReviews={reviews.length}
              ratingDistribution={distribution}
              size="md"
            />
          ) : (
            <div className="pl-0 sm:pl-5 sm:border-l border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Consolidated rating based on client reviews collected online.
              </p>
              {count > 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                  Source: Google Business Profile
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Individual reviews */}
      {reviews.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          {/* Controls row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-base font-semibold text-stone-800 dark:text-gray-100">
              Client reviews
              {filter !== 'all' && (
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({filteredReviews.length} of {reviews.length})
                </span>
              )}
            </h3>

            <button
              type="button"
              onClick={() => setShowControls((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 rounded px-2 py-1 sm:hidden"
              aria-expanded={showControls}
              aria-controls="review-controls"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              Filter & Sort
            </button>

            <div
              id="review-controls"
              className={`flex flex-wrap items-center gap-2 w-full sm:w-auto ${
                showControls ? '' : 'hidden sm:flex'
              }`}
            >
              {/* Rating filter pills */}
              <div className="flex items-center gap-1 flex-wrap" role="group" aria-label="Filter by rating">
                {FILTER_OPTIONS.map((opt) => {
                  const isActive = filter === opt.value
                  const filterCount =
                    opt.value === 'all'
                      ? reviews.length
                      : distribution[parseInt(opt.value, 10)] || 0

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setFilter(opt.value)
                        setVisibleCount(PAGE_SIZE)
                      }}
                      disabled={opt.value !== 'all' && filterCount === 0}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 focus-visible:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                        isActive
                          ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                      aria-pressed={isActive}
                    >
                      {opt.value !== 'all' && (
                        <Star
                          className="w-3 h-3 text-amber-500 fill-amber-500"
                          aria-hidden="true"
                        />
                      )}
                      {opt.label}
                      <span className="text-gray-400 dark:text-gray-500 tabular-nums">
                        {filterCount}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <label htmlFor="review-sort" className="sr-only">
                  Sort reviews
                </label>
                <div className="relative">
                  <ArrowUpDown
                    className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <select
                    id="review-sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    className="appearance-none text-xs font-medium pl-7 pr-6 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 cursor-pointer"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Review list */}
          {filteredReviews.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No reviews match this filter.
            </p>
          ) : (
            <div className="space-y-3" role="list" aria-label="Review list">
              {visibleReviews.map((review, i) => (
                <div key={review.id} role="listitem">
                  <ReviewCard
                    review={review}
                    index={i}
                    reducedMotion={reducedMotion}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-clay-500 dark:text-clay-300 hover:text-clay-600 dark:hover:text-clay-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 rounded px-3 py-1.5"
              >
                Show more reviews ({filteredReviews.length - visibleCount}{' '}
                remaining)
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}
    </motion.section>
  )
}
