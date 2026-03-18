'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import { ReviewForm, type ReviewFormData } from '@/components/reviews/ReviewForm'

interface BookingInfo {
  attorneyName: string
  specialtyName: string
  date: string
  alreadyReviewed: boolean
  attorneySlug?: string
}

export default function LeaveReviewPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.bookingId as string

  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const { toasts, removeToast, success: toastSuccess } = useToast()

  // Fetch booking info
  useEffect(() => {
    const fetchBookingInfo = async () => {
      try {
        const response = await fetch(`/api/reviews?bookingId=${bookingId}`)
        if (!response.ok) {
          throw new Error('Booking not found')
        }
        const result = await response.json()
        const data = result.data || result
        setBookingInfo(data)
        if (data.alreadyReviewed) {
          setSubmitted(true)
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    if (bookingId) {
      fetchBookingInfo()
    }
  }, [bookingId])

  const handleSubmit = async (formData: ReviewFormData) => {
    setSubmitting(true)
    setApiError(null)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          ratingCommunication: formData.ratingCommunication,
          ratingResult: formData.ratingResult,
          ratingResponsiveness: formData.ratingResponsiveness,
          comment: formData.comment,
          wouldRecommend: formData.wouldRecommend,
          isAnonymous: formData.isAnonymous,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result.error?.message || result.error || 'Error submitting review'
        throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Error submitting review')
      }

      setSubmitted(true)
      toastSuccess('Review submitted!', 'Thank you for your feedback.')

      // Redirect to attorney profile after 3 seconds if slug is available
      if (bookingInfo?.attorneySlug) {
        setTimeout(() => {
          router.push(`/attorney/${bookingInfo.attorneySlug}`)
        }, 3000)
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Error state (booking not found)
  // ---------------------------------------------------------------------------
  if (error && !bookingInfo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid Link
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
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

  // ---------------------------------------------------------------------------
  // Success state (already reviewed or just submitted)
  // ---------------------------------------------------------------------------
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Thank You for Your Review!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your detailed feedback helps {bookingInfo?.attorneyName} improve and helps other clients make informed decisions.
          </p>
          <div className="space-y-3">
            {bookingInfo?.attorneySlug && (
              <a
                href={`/attorney/${bookingInfo.attorneySlug}`}
                className="inline-block bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 transition w-full"
              >
                View Attorney Profile
              </a>
            )}
            <a
              href="/"
              className="inline-block text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 px-6 py-3 transition font-medium"
            >
              Browse Attorneys
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Review form
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Leave a Review
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            How was your consultation?
          </p>
        </div>

        {/* Booking info card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-violet-600 dark:text-violet-400 font-bold text-lg">
                {bookingInfo?.attorneyName?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                {bookingInfo?.attorneyName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {bookingInfo?.specialtyName}
                {bookingInfo?.date && ` \u00B7 ${bookingInfo.date}`}
              </p>
            </div>
          </div>
        </div>

        {/* Review form component */}
        <ReviewForm
          attorneyName={bookingInfo?.attorneyName || 'Attorney'}
          consultationDate={bookingInfo?.date}
          onSubmit={handleSubmit}
          submitting={submitting}
          externalError={apiError}
        />
      </div>
    </div>
  )
}
