'use client'

import { useState, useEffect } from 'react'
import { Star, ThumbsUp, MessageCircle, ChevronDown, Filter, User, CheckCircle } from 'lucide-react'

interface Review {
  id: string
  rating: number
  comment: string | null
  would_recommend: boolean
  client_name: string
  created_at: string
  attorney_response: string | null
  attorney_responded_at: string | null
  helpful_count: number
  booking_id?: string | null
  user_id?: string | null
  is_verified?: boolean
}

interface ReviewStats {
  total: number
  average: number
  recommendRate: number
  distribution: number[]
}

interface ReviewsSectionProps {
  attorneyId: string
  attorneyName?: string
}

export default function ReviewsSection({ attorneyId, attorneyName }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'highest' | 'lowest'>('recent')
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [votedReviews, setVotedReviews] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/reviews?attorneyId=${attorneyId}`)
        if (!response.ok) throw new Error('Failed to fetch reviews')
        const data = await response.json()
        setReviews(data.reviews || [])
        setStats(data.stats || null)
      } catch (error: unknown) {
        console.error('Error fetching reviews:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [attorneyId])

  const handleVoteHelpful = async (reviewId: string) => {
    if (votedReviews.has(reviewId)) return

    try {
      await fetch('/api/reviews/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, isHelpful: true }),
      })

      setVotedReviews((prev) => new Set(prev).add(reviewId))
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r))
      )
    } catch (error: unknown) {
      console.error('Error voting:', error)
    }
  }

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter((r) => filterRating === null || r.rating === filterRating)
    .sort((a, b) => {
      switch (sortBy) {
        case 'helpful':
          return b.helpful_count - a.helpful_count
        case 'highest':
          return b.rating - a.rating
        case 'lowest':
          return a.rating - b.rating
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  const displayedReviews = showAll ? filteredReviews : filteredReviews.slice(0, 5)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    }

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded bg-gray-200"></div>
        <div className="h-24 rounded bg-gray-200"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded bg-gray-200"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="rounded-xl bg-gray-50 p-8 text-center">
        <MessageCircle className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <h3 className="mb-2 text-lg font-semibold text-gray-700">No reviews yet</h3>
        <p className="text-gray-500">Be the first to leave a review after your consultation!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats summary */}
      <div className="rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          {/* Average rating */}
          <div className="text-center md:text-left">
            <div className="text-5xl font-bold text-gray-900">{stats.average}</div>
            <div className="mt-1 flex justify-center md:justify-start">
              {renderStars(Math.round(stats.average), 'lg')}
            </div>
            <p className="mt-1 text-sm text-gray-600">{stats.total} reviews</p>
          </div>

          {/* Rating distribution */}
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.distribution[rating - 1]
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0

              return (
                <button
                  key={rating}
                  onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                  className={`group flex w-full items-center gap-2 ${
                    filterRating === rating ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <span className="w-3 text-sm text-gray-600">{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-xs text-gray-500">{count}</span>
                </button>
              )
            })}
          </div>

          {/* Recommendation rate */}
          <div className="text-center md:border-l md:pl-6">
            <div className="text-3xl font-bold text-green-600">{stats.recommendRate}%</div>
            <p className="text-sm text-gray-600">recommend</p>
            <p className="text-xs text-gray-500">{attorneyName || 'this attorney'}</p>
          </div>
        </div>
      </div>

      {/* Filters and sort */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {filterRating ? `${filterRating} star${filterRating > 1 ? 's' : ''}` : 'All reviews'}
          </span>
          {filterRating && (
            <button
              onClick={() => setFilterRating(null)}
              className="flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center px-2 text-xs text-violet-600 hover:text-violet-700"
            >
              Clear
            </button>
          )}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="min-h-[44px] touch-manipulation rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400"
        >
          <option value="recent">Most recent</option>
          <option value="helpful">Most helpful</option>
          <option value="highest">Highest rated</option>
          <option value="lowest">Lowest rated</option>
        </select>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {displayedReviews.map((review) => (
          <div key={review.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            {/* Header */}
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
                  <User className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{review.client_name}</p>
                  <p className="text-xs text-gray-500">{formatDate(review.created_at)}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {renderStars(review.rating)}
                {(review.booking_id || review.user_id || review.is_verified) && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700"
                    title="This review is from a verified client who used the platform"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Verified review
                  </span>
                )}
                {review.would_recommend && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    Recommends
                  </span>
                )}
              </div>
            </div>

            {/* Comment */}
            {review.comment && <p className="mb-4 text-gray-700">{review.comment}</p>}

            {/* Attorney response */}
            {review.attorney_response && (
              <div className="mb-4 rounded-lg bg-violet-50 p-4">
                <p className="mb-1 text-xs font-medium text-violet-700">
                  Response from {attorneyName || 'the attorney'}
                </p>
                <p className="text-sm text-gray-700">{review.attorney_response}</p>
                {review.attorney_responded_at && (
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDate(review.attorney_responded_at)}
                  </p>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleVoteHelpful(review.id)}
                disabled={votedReviews.has(review.id)}
                className={`flex min-h-[44px] min-w-[44px] touch-manipulation items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${
                  votedReviews.has(review.id)
                    ? 'text-violet-600'
                    : 'text-gray-500 hover:bg-violet-50 hover:text-violet-600'
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>Helpful ({review.helpful_count})</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Show more button */}
      {filteredReviews.length > 5 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 py-3 font-medium text-violet-600 hover:text-violet-700"
        >
          <span>View all reviews ({filteredReviews.length})</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
