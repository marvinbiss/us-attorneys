'use client'

import { useState, useMemo, useCallback } from 'react'
import { Send, Loader2, Star, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StarRatingInput } from './StarRatingInput'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReviewFormData {
  ratingCommunication: number
  ratingResult: number
  ratingResponsiveness: number
  comment: string
  wouldRecommend: boolean | null
  isAnonymous: boolean
}

interface ReviewFormProps {
  /** Pre-filled attorney name (displayed in header) */
  attorneyName: string
  /** Consultation date string for context */
  consultationDate?: string
  /** Called when user submits valid form */
  onSubmit: (data: ReviewFormData) => Promise<void>
  /** Whether submission is in progress (disables form) */
  submitting?: boolean
  /** External error message from API */
  externalError?: string | null
  /** Additional class names */
  className?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMMENT_MIN = 20
const COMMENT_MAX = 2000

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewForm({
  attorneyName,
  consultationDate,
  onSubmit,
  submitting = false,
  externalError = null,
  className,
}: ReviewFormProps) {
  // Form state
  const [ratingCommunication, setRatingCommunication] = useState(0)
  const [ratingResult, setRatingResult] = useState(0)
  const [ratingResponsiveness, setRatingResponsiveness] = useState(0)
  const [comment, setComment] = useState('')
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(false)

  // Validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------

  const overallRating = useMemo(() => {
    if (ratingCommunication === 0 || ratingResult === 0 || ratingResponsiveness === 0) {
      return 0
    }
    return Math.round(((ratingCommunication + ratingResult + ratingResponsiveness) / 3) * 10) / 10
  }, [ratingCommunication, ratingResult, ratingResponsiveness])

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (ratingCommunication === 0) e.ratingCommunication = 'Please rate communication'
    if (ratingResult === 0) e.ratingResult = 'Please rate results'
    if (ratingResponsiveness === 0) e.ratingResponsiveness = 'Please rate responsiveness'
    if (comment.trim().length > 0 && comment.trim().length < COMMENT_MIN) {
      e.comment = `Please write at least ${COMMENT_MIN} characters (${comment.trim().length}/${COMMENT_MIN})`
    }
    if (comment.trim().length > COMMENT_MAX) {
      e.comment = `Comment is too long (${comment.trim().length}/${COMMENT_MAX})`
    }
    if (comment.trim().length === 0) {
      e.comment = `Please write at least ${COMMENT_MIN} characters to describe your experience`
    }
    if (wouldRecommend === null) e.wouldRecommend = 'Please indicate if you would recommend this attorney'
    return e
  }, [ratingCommunication, ratingResult, ratingResponsiveness, comment, wouldRecommend])

  const isValid = Object.keys(errors).length === 0

  const shouldShowError = useCallback(
    (field: string) => {
      return (submitAttempted || touched[field]) && !!errors[field]
    },
    [submitAttempted, touched, errors]
  )

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)

    if (!isValid) return

    await onSubmit({
      ratingCommunication,
      ratingResult,
      ratingResponsiveness,
      comment: comment.trim(),
      wouldRecommend,
      isAnonymous,
    })
  }

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderOverallRating = () => {
    if (overallRating === 0) return null

    return (
      <div
        className="flex items-center justify-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => {
            const filled = s <= Math.floor(overallRating)
            const partial = !filled && s === Math.ceil(overallRating) && overallRating % 1 >= 0.3
            return (
              <Star
                key={s}
                className={cn(
                  'w-5 h-5',
                  filled
                    ? 'text-amber-500 fill-amber-500'
                    : partial
                    ? 'text-amber-400 fill-amber-200'
                    : 'text-gray-300 dark:text-gray-600'
                )}
                aria-hidden="true"
              />
            )
          })}
        </div>
        <span className="text-lg font-bold text-amber-700 dark:text-amber-300 tabular-nums">
          {overallRating.toFixed(1)}
        </span>
        <span className="text-sm text-amber-600 dark:text-amber-400">
          Overall Rating
        </span>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700',
        className
      )}
      noValidate
    >
      {/* Header */}
      <div className="p-6 pb-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Rate your experience with {attorneyName}
        </h2>
        {consultationDate && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Consultation on {consultationDate}
          </p>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* ----------------------------------------------------------------- */}
        {/* 3-axis ratings                                                    */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-4">
          <StarRatingInput
            name="rating-communication"
            label="Communication"
            value={ratingCommunication}
            onChange={(v) => {
              setRatingCommunication(v)
              markTouched('ratingCommunication')
            }}
            disabled={submitting}
            error={shouldShowError('ratingCommunication') ? errors.ratingCommunication : undefined}
          />

          <StarRatingInput
            name="rating-result"
            label="Results"
            value={ratingResult}
            onChange={(v) => {
              setRatingResult(v)
              markTouched('ratingResult')
            }}
            disabled={submitting}
            error={shouldShowError('ratingResult') ? errors.ratingResult : undefined}
          />

          <StarRatingInput
            name="rating-responsiveness"
            label="Responsiveness"
            value={ratingResponsiveness}
            onChange={(v) => {
              setRatingResponsiveness(v)
              markTouched('ratingResponsiveness')
            }}
            disabled={submitting}
            error={shouldShowError('ratingResponsiveness') ? errors.ratingResponsiveness : undefined}
          />
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Overall rating (auto-calculated, read-only)                       */}
        {/* ----------------------------------------------------------------- */}
        {renderOverallRating()}

        {/* ----------------------------------------------------------------- */}
        {/* Would you recommend? Yes/No toggle                                */}
        {/* ----------------------------------------------------------------- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Would you recommend this attorney? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3" role="radiogroup" aria-label="Would you recommend this attorney?">
            <button
              type="button"
              role="radio"
              aria-checked={wouldRecommend === true}
              onClick={() => {
                setWouldRecommend(true)
                markTouched('wouldRecommend')
              }}
              disabled={submitting}
              className={cn(
                'flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
                wouldRecommend === true
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400',
                submitting && 'opacity-50 cursor-not-allowed'
              )}
            >
              Yes, I recommend
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={wouldRecommend === false}
              onClick={() => {
                setWouldRecommend(false)
                markTouched('wouldRecommend')
              }}
              disabled={submitting}
              className={cn(
                'flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
                wouldRecommend === false
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400',
                submitting && 'opacity-50 cursor-not-allowed'
              )}
            >
              No
            </button>
          </div>
          {shouldShowError('wouldRecommend') && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
              {errors.wouldRecommend}
            </p>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Comment textarea                                                  */}
        {/* ----------------------------------------------------------------- */}
        <div>
          <label
            htmlFor="review-comment"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Describe your experience <span className="text-red-500">*</span>
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onBlur={() => markTouched('comment')}
            rows={5}
            placeholder="What went well? What could be improved? Your detailed feedback helps other clients make informed decisions..."
            disabled={submitting}
            aria-invalid={shouldShowError('comment')}
            aria-describedby="review-comment-hint review-comment-error"
            className={cn(
              'w-full px-4 py-3 border rounded-lg resize-none transition-colors',
              'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
              'placeholder-gray-400 dark:placeholder-gray-500',
              'focus:ring-2 focus:ring-violet-500 focus:border-transparent',
              shouldShowError('comment')
                ? 'border-red-300 dark:border-red-600'
                : 'border-gray-300 dark:border-gray-600',
              submitting && 'opacity-50 cursor-not-allowed'
            )}
          />
          <div className="flex items-center justify-between mt-1.5">
            <p
              id="review-comment-hint"
              className="text-xs text-gray-500 dark:text-gray-400"
            >
              {COMMENT_MIN}-{COMMENT_MAX} characters
            </p>
            <p
              className={cn(
                'text-xs tabular-nums',
                comment.trim().length < COMMENT_MIN
                  ? 'text-gray-400 dark:text-gray-500'
                  : comment.trim().length > COMMENT_MAX
                  ? 'text-red-500'
                  : 'text-green-600 dark:text-green-400'
              )}
            >
              {comment.trim().length}/{COMMENT_MAX}
            </p>
          </div>
          {shouldShowError('comment') && (
            <p
              id="review-comment-error"
              className="mt-1 text-xs text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.comment}
            </p>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Anonymous toggle                                                   */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {isAnonymous ? (
              <EyeOff className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            ) : (
              <Eye className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isAnonymous ? 'Anonymous review' : 'Public review'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isAnonymous
                  ? 'Displayed as "Verified Client" instead of your name'
                  : 'Your name will appear on the review'}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isAnonymous}
            aria-label="Post review anonymously"
            onClick={() => setIsAnonymous(!isAnonymous)}
            disabled={submitting}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
              isAnonymous
                ? 'bg-violet-600'
                : 'bg-gray-300 dark:bg-gray-600',
              submitting && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                isAnonymous && 'translate-x-5'
              )}
            />
          </button>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* External error (from API)                                          */}
        {/* ----------------------------------------------------------------- */}
        {externalError && (
          <div
            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300"
            role="alert"
          >
            {externalError}
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Submit button                                                      */}
        {/* ----------------------------------------------------------------- */}
        <button
          type="submit"
          disabled={submitting}
          className={cn(
            'w-full py-3 px-6 rounded-lg font-medium transition-all',
            'flex items-center justify-center gap-2',
            'bg-violet-600 text-white hover:bg-violet-700',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" aria-hidden="true" />
              Submit Review
            </>
          )}
        </button>

        {/* ----------------------------------------------------------------- */}
        {/* Footer note                                                        */}
        {/* ----------------------------------------------------------------- */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Your review will be publicly visible after verification. Reviews must comply with our{' '}
          <a href="/terms" className="text-violet-600 dark:text-violet-400 hover:underline">
            terms of service
          </a>
          .
        </p>
      </div>
    </form>
  )
}

export default ReviewForm
