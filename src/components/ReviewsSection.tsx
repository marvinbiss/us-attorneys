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
  artisan_response: string | null
  artisan_responded_at: string | null
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
      } catch (error) {
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
        prev.map((r) =>
          r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
        )
      )
    } catch (error) {
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
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No reviews yet
        </h3>
        <p className="text-gray-500">
          Be the first to leave a review after your consultation!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats summary */}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Average rating */}
          <div className="text-center md:text-left">
            <div className="text-5xl font-bold text-gray-900">{stats.average}</div>
            <div className="flex justify-center md:justify-start mt-1">
              {renderStars(Math.round(stats.average), 'lg')}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {stats.total} reviews
            </p>
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
                  className={`flex items-center gap-2 w-full group ${
                    filterRating === rating ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <span className="text-sm text-gray-600 w-3">{rating}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8">{count}</span>
                </button>
              )
            })}
          </div>

          {/* Recommendation rate */}
          <div className="text-center md:border-l md:pl-6">
            <div className="text-3xl font-bold text-green-600">
              {stats.recommendRate}%
            </div>
            <p className="text-sm text-gray-600">
              recommend
            </p>
            <p className="text-xs text-gray-500">
              {attorneyName || 'this attorney'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters and sort */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {filterRating
              ? `${filterRating} star${filterRating > 1 ? 's' : ''}`
              : 'All reviews'}
          </span>
          {filterRating && (
            <button
              onClick={() => setFilterRating(null)}
              className="text-xs text-violet-600 hover:text-violet-700"
            >
              Clear
            </button>
          )}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
          <div
            key={review.id}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{review.client_name}</p>
                  <p className="text-xs text-gray-500">{formatDate(review.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {renderStars(review.rating)}
                {(review.booking_id || review.user_id || review.is_verified) && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"
                    title="This review is from a verified client who used the platform"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Verified review
                  </span>
                )}
                {review.would_recommend && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Recommends
                  </span>
                )}
              </div>
            </div>

            {/* Comment */}
            {review.comment && (
              <p className="text-gray-700 mb-4">{review.comment}</p>
            )}

            {/* Attorney response */}
            {review.attorney_response && (
              <div className="bg-violet-50 rounded-lg p-4 mb-4">
                <p className="text-xs font-medium text-violet-700 mb-1">
                  Response from {attorneyName || 'the attorney'}
                </p>
                <p className="text-sm text-gray-700">{review.attorney_response}</p>
                {review.attorney_responded_at && (
                  <p className="text-xs text-gray-500 mt-1">
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
                className={`flex items-center gap-1.5 text-sm transition ${
                  votedReviews.has(review.id)
                    ? 'text-violet-600'
                    : 'text-gray-500 hover:text-violet-600'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>
                  Helpful ({review.helpful_count})
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Show more button */}
      {filteredReviews.length > 5 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full flex items-center justify-center gap-2 py-3 text-violet-600 hover:text-violet-700 font-medium"
        >
          <span>View all reviews ({filteredReviews.length})</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
