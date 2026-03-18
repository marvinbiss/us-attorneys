import { Users, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'

interface SocialProofProps {
  /** Number of consultations this month (from bookings table). Null = no data, hide. */
  consultationsThisMonth?: number | null
  /** ISO date of the last booking. Null = no data, hide. */
  lastBookedAt?: string | null
  /** Additional CSS classes */
  className?: string
}

/**
 * Social proof indicators based on real booking data.
 *
 * Shows:
 * - "X people consulted this attorney this month" (if > 0)
 * - "Last booked [relative time]" (if recent booking exists)
 *
 * CRITICAL: Only shows data that actually exists. Never fabricates numbers.
 */
export function SocialProof({
  consultationsThisMonth,
  lastBookedAt,
  className,
}: SocialProofProps) {
  const hasConsultations = consultationsThisMonth != null && consultationsThisMonth > 0
  const hasLastBooked = lastBookedAt != null

  if (!hasConsultations && !hasLastBooked) return null

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3',
        className
      )}
      role="status"
      aria-label="Social proof"
    >
      {hasConsultations && (
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
          <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          <span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {consultationsThisMonth}
            </span>{' '}
            {consultationsThisMonth === 1
              ? 'person consulted this attorney this month'
              : 'people consulted this attorney this month'}
          </span>
        </span>
      )}

      {hasLastBooked && (
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          <span>
            Last booked{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {formatRelativeTime(lastBookedAt)}
            </span>
          </span>
        </span>
      )}
    </div>
  )
}

export default SocialProof
