'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Star, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface BookingInfo {
  attorneyName: string
  specialtyName: string
  date: string
  alreadyReviewed: boolean
}

export default function ReviewPage() {
  const params = useParams()
  const bookingId = params.bookingId as string

  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Review form state
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null)

  // Fetch booking info
  useEffect(() => {
    const fetchBookingInfo = async () => {
      try {
        const response = await fetch(`/api/reviews?bookingId=${bookingId}`)
        if (!response.ok) {
          throw new Error('Booking not found')
        }
        const data = await response.json()
        setBookingInfo(data)
        if (data.alreadyReviewed) {
          setSubmitted(true)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    if (bookingId) {
      fetchBookingInfo()
    }
  }, [bookingId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          rating,
          comment,
          wouldRecommend,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error submitting review')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  const ratingLabels = [
    'Very Poor',
    'Poor',
    'Average',
    'Good',
    'Excellent',
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (error && !bookingInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Invalid Link
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 transition"
          >
            Back to Home
          </a>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Thank You for Your Review!
          </h1>
          <p className="text-gray-600 mb-6">
            Your feedback helps {bookingInfo?.attorneyName} improve and helps other clients make informed decisions.
          </p>
          <a
            href="/"
            className="inline-block bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 transition"
          >
            Browse Attorneys
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Leave a Review
          </h1>
          <p className="text-gray-600">
            How was your appointment?
          </p>
        </div>

        {/* Booking info card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
              <span className="text-violet-600 font-bold text-lg">
                {bookingInfo?.attorneyName.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                {bookingInfo?.attorneyName}
              </h2>
              <p className="text-sm text-gray-500">
                {bookingInfo?.specialtyName} • {bookingInfo?.date}
              </p>
            </div>
          </div>
        </div>

        {/* Review form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
          {/* Star rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Overall Rating *
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {(hoveredRating || rating) > 0 && (
              <p className="text-center text-sm text-gray-600 mt-2">
                {ratingLabels[(hoveredRating || rating) - 1]}
              </p>
            )}
          </div>

          {/* Would recommend */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Would you recommend this attorney?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setWouldRecommend(true)}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition ${
                  wouldRecommend === true
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                👍 Yes
              </button>
              <button
                type="button"
                onClick={() => setWouldRecommend(false)}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition ${
                  wouldRecommend === false
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                👎 No
              </button>
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Comment (optional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Share your experience..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="w-full bg-violet-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Review
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Your review will be publicly visible on the attorney's profile
          </p>
        </form>
      </div>
    </div>
  )
}
