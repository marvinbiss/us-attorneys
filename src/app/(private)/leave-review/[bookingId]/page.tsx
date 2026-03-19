'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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

      // Redirect to client dashboard reviews after 3 seconds
      setTimeout(() => {
        router.push('/client-dashboard/my-reviews')
      }, 3000)
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Error state (booking not found)
  // ---------------------------------------------------------------------------
  if (error && !bookingInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Invalid Link</h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">{error}</p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-violet-600 px-6 py-3 text-white transition hover:bg-violet-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Success state (already reviewed or just submitted)
  // ---------------------------------------------------------------------------
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Thank You for Your Review!
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Your detailed feedback helps {bookingInfo?.attorneyName} improve and helps other clients
            make informed decisions.
          </p>
          <div className="space-y-3">
            <Link
              href="/client-dashboard/my-reviews"
              className="inline-block w-full rounded-lg bg-violet-600 px-6 py-3 text-white transition hover:bg-violet-700"
            >
              View My Reviews
            </Link>
            <Link
              href="/"
              className="inline-block px-6 py-3 font-medium text-violet-600 transition hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
            >
              Browse Attorneys
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Review form
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Leave a Review</h1>
          <p className="text-gray-600 dark:text-gray-400">How was your consultation?</p>
        </div>

        {/* Booking info card */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
              <span className="text-lg font-bold text-violet-600 dark:text-violet-400">
                {bookingInfo?.attorneyName?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-gray-900 dark:text-white">
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
