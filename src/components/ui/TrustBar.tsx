import {
  CheckCircle,
  Zap,
  Clock,
  Timer,
  Star,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrustBarProps {
  /** Whether the attorney is bar-verified */
  isVerified: boolean
  /** Average response time in hours (null = no data, hide that signal) */
  responseTimeHours?: number | null
  /** Average rating (0-5) */
  ratingAverage?: number | null
  /** Total review count */
  reviewCount?: number | null
  /** Years of experience (computed from bar admission or member_since) */
  yearsExperience?: number | null
  /** Additional CSS classes */
  className?: string
}

/**
 * Horizontal trust signal bar for attorney profiles.
 * Shows a row of trust indicators below the hero section.
 * Responsive: wraps on mobile, single row on desktop.
 * Only renders signals that have real data — never fabricates.
 */
export function TrustBar({
  isVerified,
  responseTimeHours,
  ratingAverage,
  reviewCount,
  yearsExperience,
  className,
}: TrustBarProps) {
  const signals: Array<{
    key: string
    icon: typeof CheckCircle
    label: string
    colorClasses: string
  }> = []

  // Verified signal
  if (isVerified) {
    signals.push({
      key: 'verified',
      icon: ShieldCheck,
      label: 'Verified',
      colorClasses: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    })
  }

  // Response time signal
  if (responseTimeHours != null && responseTimeHours <= 48) {
    const rtIcon = responseTimeHours <= 2 ? Zap : responseTimeHours <= 12 ? Clock : Timer
    const rtLabel =
      responseTimeHours <= 2
        ? 'Responds < 2h'
        : responseTimeHours <= 12
          ? 'Responds < 12h'
          : 'Responds < 48h'
    const rtColor =
      responseTimeHours <= 2
        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
        : responseTimeHours <= 12
          ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'

    signals.push({
      key: 'response',
      icon: rtIcon,
      label: rtLabel,
      colorClasses: rtColor,
    })
  }

  // Rating signal
  if (ratingAverage != null && ratingAverage > 0 && reviewCount != null && reviewCount > 0) {
    signals.push({
      key: 'rating',
      icon: Star,
      label: `${ratingAverage.toFixed(1)} (${reviewCount.toLocaleString('en-US')} review${reviewCount !== 1 ? 's' : ''})`,
      colorClasses: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    })
  }

  // Experience signal
  if (yearsExperience != null && yearsExperience > 0) {
    signals.push({
      key: 'experience',
      icon: GraduationCap,
      label: `${yearsExperience} year${yearsExperience !== 1 ? 's' : ''} exp.`,
      colorClasses: 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',
    })
  }

  // Nothing to show
  if (signals.length === 0) return null

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2',
        className
      )}
      role="list"
      aria-label="Attorney trust signals"
    >
      {signals.map((signal) => {
        const Icon = signal.icon
        return (
          <span
            key={signal.key}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
              signal.colorClasses
            )}
            role="listitem"
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            {signal.label}
          </span>
        )
      })}
    </div>
  )
}

export default TrustBar
