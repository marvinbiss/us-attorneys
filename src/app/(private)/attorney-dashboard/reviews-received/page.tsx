'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import { Star, ArrowLeft, ThumbsUp, MessageCircle, Loader2, X } from 'lucide-react'
import AttorneySidebar from '@/components/attorney-dashboard/AttorneySidebar'
import { EmptyState } from '@/components/ui/EmptyState'

interface ReviewItem {
  id: string
  client_name: string
  created_at: string
  rating: number
  comment: string | null
  attorney_response: string | null
}

interface ReviewStats {
  average: number
  total: number
  distribution: { rating: number; count: number }[]
}

export default function ReviewsReceivedPage() {
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [stats, setStats] = useState<ReviewStats>({
    average: 0,
    total: 0,
    distribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: 0 })),
  })
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/attorney/reviews')
      const data = await response.json()

      if (response.ok) {
        setReviews(data.reviews || [])
        setStats(data.stats || stats)
      }
    } catch (error: unknown) {
      logger.error('Error fetching reviews', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return

    setSubmitting(true)
    setReplyError(null)
    try {
      const response = await fetch(`/api/attorney/reviews/${reviewId}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: replyText.trim() }),
      })

      if (response.ok) {
        // Update local state
        setReviews((prev) =>
          prev.map((a) => (a.id === reviewId ? { ...a, attorney_response: replyText.trim() } : a))
        )
        setReplyingTo(null)
        setReplyText('')
      } else {
        const data = await response.json()
        setReplyError(data.error || 'Error sending response')
      }
    } catch {
      setReplyError('Error sending response')
    } finally {
      setSubmitting(false)
    }
  }
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/attorney-dashboard/dashboard"
              className="text-white/80 hover:text-white"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Reviews Received</h1>
              <p className="text-blue-100">View and respond to client reviews</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <AttorneySidebar activePage="reviews-received" />

          {/* Content */}
          <div className="space-y-8 lg:col-span-3">
            {/* Stats */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="text-center">
                  <div className="mb-2 text-5xl font-bold text-gray-900">
                    {Number(stats.average).toFixed(1)}
                  </div>
                  <div
                    className="mb-2 flex justify-center"
                    aria-label={`Rating: ${Number(stats.average).toFixed(1)} out of 5`}
                    role="img"
                  >
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        aria-hidden="true"
                        className={`h-6 w-6 ${
                          i < Math.round(stats.average)
                            ? 'fill-current text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-500">Based on {stats.total} reviews</p>
                </div>
                <div className="space-y-2">
                  {stats.distribution.map((item) => (
                    <div key={item.rating} className="flex items-center gap-3">
                      <span className="w-12 text-sm text-gray-600">{item.rating} stars</span>
                      <div className="h-2 flex-1 rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-yellow-400"
                          style={{
                            width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-sm text-gray-500">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews list */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-gray-900">Latest Reviews</h2>
              {reviews.length === 0 ? (
                <EmptyState
                  variant="inbox"
                  title="No reviews yet"
                  description="Reviews from your clients will appear here. Provide excellent service to start building your reputation."
                  action={{ label: 'View Dashboard', href: '/attorney-dashboard/dashboard' }}
                />
              ) : (
                <div className="space-y-6">
                  {reviews.map((item) => (
                    <div
                      key={item.id}
                      className="border-b border-gray-100 pb-6 last:border-0 last:pb-0"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <div className="mb-1 flex items-center gap-3">
                            <span className="font-medium text-gray-900">{item.client_name}</span>
                            <div
                              className="flex"
                              aria-label={`Rating: ${item.rating} out of 5`}
                              role="img"
                            >
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  aria-hidden="true"
                                  className={`h-4 w-4 ${
                                    i < item.rating
                                      ? 'fill-current text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(item.created_at).toLocaleDateString('en-US')}
                          </p>
                        </div>
                        {!item.attorney_response && (
                          <button
                            onClick={() => setReplyingTo(item.id)}
                            aria-label="Reply to this review"
                            title="Reply"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Reply
                          </button>
                        )}
                      </div>
                      <p className="mb-3 text-gray-700">{item.comment}</p>

                      {/* Reply form */}
                      {replyingTo === item.id && (
                        <div className="mb-3 ml-4 rounded-lg bg-gray-50 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-600">Your Response:</p>
                            <button
                              onClick={() => {
                                setReplyingTo(null)
                                setReplyText('')
                                setReplyError(null)
                              }}
                              aria-label="Cancel reply"
                              title="Cancel"
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your reply..."
                            className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            rows={3}
                          />
                          {replyError && <p className="mb-2 text-sm text-red-600">{replyError}</p>}
                          <button
                            onClick={() => handleReply(item.id)}
                            disabled={submitting || !replyText.trim()}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                          >
                            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            Send
                          </button>
                        </div>
                      )}

                      {item.attorney_response && (
                        <div className="ml-4 rounded-lg bg-blue-50 p-4">
                          <p className="mb-1 text-sm font-medium text-blue-600">Your Response:</p>
                          <p className="text-sm text-gray-700">{item.attorney_response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
              <div className="flex items-start gap-4">
                <ThumbsUp className="h-8 w-8 flex-shrink-0" />
                <div>
                  <h3 className="mb-2 font-semibold">Tips to Improve Your Reviews</h3>
                  <p className="text-sm text-green-100">
                    Respond quickly to client reviews, even positive ones. This demonstrates your
                    professionalism and encourages other clients to leave reviews. Attorneys who
                    respond to reviews tend to receive more case inquiries.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
