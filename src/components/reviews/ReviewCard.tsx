'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Star,
  CheckCircle,
  ChevronDown,
  ThumbsUp,
  MessageSquare,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Review } from '@/components/attorney/types'
import { SubRatingTags } from './StructuredRatingDisplay'

/** Format a date string to US locale (e.g. "March 12, 2025") */
function formatDate(raw: string): string {
  try {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return raw
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return raw
  }
}

/** Relative time (e.g. "2 months ago") */
function getRelativeTime(raw: string): string {
  try {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return ''
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  } catch {
    return ''
  }
}

/** Render star icons for a given rating */
function ReviewStars({
  rating,
  size = 'w-4 h-4',
}: {
  rating: number
  size?: string
}) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.5

  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = s <= full
        const half = !filled && s === full + 1 && hasHalf
        return (
          <Star
            key={s}
            className={cn(
              size,
              filled
                ? 'text-amber-500 fill-amber-500'
                : half
                ? 'text-amber-400 fill-amber-200'
                : 'text-gray-200 dark:text-gray-600 fill-gray-200 dark:fill-gray-600'
            )}
            aria-hidden="true"
          />
        )
      })}
    </div>
  )
}

interface ReviewCardProps {
  review: Review
  index?: number
  reducedMotion?: boolean
  className?: string
}

export function ReviewCard({
  review,
  index = 0,
  reducedMotion = false,
  className,
}: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false)
  const dateStr = review.dateISO || review.date
  const relativeTime = getRelativeTime(dateStr)

  return (
    <motion.article
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: 0.35, delay: index * 0.08 }
      }
      className={cn(
        'bg-white dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 p-4 transition-shadow hover:shadow-md',
        className
      )}
      aria-label={`Review by ${review.author}`}
    >
      {/* Header: author + verified badge + date */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Author avatar placeholder */}
            <div
              className="w-8 h-8 rounded-full bg-gradient-to-br from-clay-100 to-clay-200 dark:from-gray-600 dark:to-gray-500 flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              <span className="text-xs font-bold text-clay-600 dark:text-gray-200 uppercase">
                {review.author
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-800 dark:text-gray-100 text-sm truncate">
                  {review.author}
                </span>
                {review.verified && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 px-2 py-0.5 rounded-full"
                    title="This review is from a verified client"
                  >
                    <CheckCircle className="w-3 h-3" aria-hidden="true" />
                    Verified
                  </span>
                )}
              </div>
              <ReviewStars rating={review.rating} size="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <time
          className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0"
          dateTime={dateStr}
          title={formatDate(dateStr)}
        >
          {relativeTime || formatDate(dateStr)}
        </time>
      </div>

      {/* Sub-ratings tags */}
      <SubRatingTags
        communication={review.rating_communication}
        result={review.rating_result}
        responsiveness={review.rating_responsiveness}
        className="mb-2"
      />

      {/* Comment */}
      <p
        className={cn(
          'text-sm text-gray-700 dark:text-gray-300 leading-relaxed',
          !expanded && 'line-clamp-3'
        )}
      >
        {review.comment}
      </p>
      {review.comment.length > 180 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-clay-500 dark:text-clay-300 hover:text-clay-600 dark:hover:text-clay-200 text-xs font-medium mt-1 inline-flex items-center gap-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 focus-visible:ring-offset-1 rounded"
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

      {/* Attorney response */}
      {review.attorney_response && (
        <div className="mt-3 pl-4 border-l-2 border-clay-200 dark:border-clay-700">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare
              className="w-3.5 h-3.5 text-clay-500 dark:text-clay-400"
              aria-hidden="true"
            />
            <span className="text-xs font-semibold text-clay-600 dark:text-clay-300">
              Attorney response
            </span>
            {review.attorney_responded_at && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                <Clock className="w-2.5 h-2.5" aria-hidden="true" />
                {formatDate(review.attorney_responded_at)}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {review.attorney_response}
          </p>
        </div>
      )}

      {/* Footer: helpful button */}
      <div className="mt-3 pt-2 border-t border-gray-50 dark:border-gray-600/50 flex items-center justify-between">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 focus-visible:ring-offset-1 rounded px-2 py-1 -ml-2"
          aria-label={`Mark this review as helpful${review.helpful_count ? ` (${review.helpful_count} found this helpful)` : ''}`}
          title="Was this review helpful?"
        >
          <ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Helpful</span>
          {review.helpful_count != null && review.helpful_count > 0 && (
            <span className="text-gray-300 dark:text-gray-600 tabular-nums">
              ({review.helpful_count})
            </span>
          )}
        </button>
      </div>
    </motion.article>
  )
}

export default ReviewCard
