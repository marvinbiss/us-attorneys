'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, MessageSquare, Star, Settings, ArrowLeft, Edit2, Trash2, Loader2 } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { QuickSiteLinks } from '@/components/InternalLinks'
import LogoutButton from '@/components/LogoutButton'

interface PublishedReview {
  id: string
  attorney: string // API field name (attorney name)
  attorney_id: string
  service: string | null
  date: string
  rating: number
  comment: string
  response?: string
}

interface PendingReview {
  id: string
  attorney: string // API field name (attorney name)
  attorney_id: string
  service: string | null
  date: string
  booking_id: string
}

export default function MyReviewsPage() {
  const [publishedReviews, setPublishedReviews] = useState<PublishedReview[]>([])
  const [pendingReviews, setPendingReview] = useState<PendingReview[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null)
  const [editingReview, setEditingReview] = useState<PublishedReview | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/client/reviews')
      if (response.ok) {
        const data = await response.json()
        setPublishedReviews(data.publishedReviews || [])
        setPendingReview(data.pendingReviews || [])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReview && !editingReview) return

    setSubmitting(true)
    try {
      if (editingReview) {
        // Update existing review
        const response = await fetch('/api/client/reviews', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            review_id: editingReview.id,
            rating: rating,
            comment: comment,
          }),
        })

        if (response.ok) {
          await fetchReviews()
          setShowModal(false)
          setEditingReview(null)
        }
      } else if (selectedReview) {
        // Create new review
        const response = await fetch('/api/client/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attorney_id: selectedReview.attorney_id,
            booking_id: selectedReview.booking_id,
            rating: rating,
            comment: comment,
          }),
        })

        if (response.ok) {
          await fetchReviews()
          setShowModal(false)
          setSelectedReview(null)
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setSubmitting(false)
      setRating(5)
      setComment('')
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return

    try {
      const response = await fetch(`/api/client/reviews?id=${reviewId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchReviews()
      }
    } catch (error) {
      console.error('Error deleting review:', error)
    }
  }

  const openModal = (review: PendingReview) => {
    setSelectedReview(review)
    setEditingReview(null)
    setRating(5)
    setComment('')
    setShowModal(true)
  }

  const openEditModal = (review: PublishedReview) => {
    setEditingReview(review)
    setSelectedReview(null)
    setRating(review.rating)
    setComment(review.comment)
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumb
            items={[
              { label: 'Client Dashboard', href: '/client-dashboard' },
              { label: 'My Reviews' }
            ]}
            className="mb-4"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/client-dashboard/my-cases" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
                <p className="text-gray-600">Manage your reviews of attorneys</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <nav className="bg-white rounded-xl shadow-sm p-4 space-y-1">
              <Link
                href="/client-dashboard/my-cases"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <FileText className="w-5 h-5" />
                My Cases
              </Link>
              <Link
                href="/client-dashboard/messages"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <MessageSquare className="w-5 h-5" />
                Messages
              </Link>
              <Link
                href="/client-dashboard/my-reviews"
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-600 font-medium"
              >
                <Star className="w-5 h-5" />
                My Reviews
              </Link>
              <Link
                href="/client-dashboard/settings"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
              <LogoutButton />
            </nav>
            <QuickSiteLinks />
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Pending */}
            {pendingReviews.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Pending Reviews ({pendingReviews.length})
                </h2>
                <div className="space-y-4">
                  {pendingReviews.map((item) => (
                    <div
                      key={item.id}
                      className="border border-yellow-200 bg-yellow-50 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{item.attorney}</h3>
                          <p className="text-sm text-gray-600">{item.service}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Service on {new Date(item.date).toLocaleDateString('en-US')}
                          </p>
                        </div>
                        <button
                          onClick={() => openModal(item)}
                          className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
                        >
                          Leave a Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Published reviews */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Published Reviews ({publishedReviews.length})
              </h2>
              {publishedReviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  You haven&apos;t published any reviews yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {publishedReviews.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900">{item.attorney}</h3>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{item.service}</p>
                          <p className="text-gray-700">{item.comment}</p>
                          {item.response && (
                            <div className="mt-3 bg-gray-50 rounded-lg p-3">
                              <p className="text-sm font-medium text-gray-700 mb-1">Attorney&apos;s response:</p>
                              <p className="text-sm text-gray-600">{item.response}</p>
                            </div>
                          )}
                          <p className="text-sm text-gray-500 mt-2">
                            Published on {new Date(item.date).toLocaleDateString('en-US')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(item.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (selectedReview || editingReview) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingReview ? 'Edit Your Review' : `Leave a Review for ${selectedReview?.attorney}`}
            </h2>
            <p className="text-gray-600 mb-6">
              Service: {editingReview?.service || selectedReview?.service}
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="p-1"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          value <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Comment
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your experience with this attorney..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedReview(null)
                    setEditingReview(null)
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingReview ? 'Update' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
