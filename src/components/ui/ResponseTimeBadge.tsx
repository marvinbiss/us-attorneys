import { Zap, Clock, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResponseTimeBadgeProps {
  /** Average response time in hours. If null/undefined, uses fallback or hides. */
  responseTimeHours?: number | null
  /** Size variant */
  size?: 'sm' | 'md'
  /** Additional CSS classes */
  className?: string
}

type ResponseTier = {
  label: string
  icon: typeof Zap
  colorClasses: string
}

function getResponseTier(hours: number): ResponseTier | null {
  if (hours <= 2) {
    return {
      label: 'Usually responds within 2 hours',
      icon: Zap,
      colorClasses:
        'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
    }
  }
  if (hours <= 12) {
    return {
      label: 'Usually responds within 12 hours',
      icon: Clock,
      colorClasses:
        'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    }
  }
  if (hours <= 48) {
    return {
      label: 'Usually responds within 48 hours',
      icon: Timer,
      colorClasses:
        'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    }
  }
  // > 48h: hidden
  return null
}

/**
 * "Usually responds within X hours" badge.
 *
 * Color coding:
 * - Green: < 2h (fast responder)
 * - Blue: < 12h (responsive)
 * - Gray: < 48h (moderate)
 * - Hidden: > 48h or no data
 */
export function ResponseTimeBadge({
  responseTimeHours,
  size = 'sm',
  className,
}: ResponseTimeBadgeProps) {
  // No data -> do not fabricate, hide
  if (responseTimeHours == null) return null

  const tier = getResponseTier(responseTimeHours)
  if (!tier) return null

  const Icon = tier.icon
  const isSmall = size === 'sm'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        isSmall ? 'px-2 py-0.5 text-xs gap-1' : 'px-2.5 py-1 text-xs gap-1.5',
        tier.colorClasses,
        className
      )}
      role="status"
      aria-label={tier.label}
    >
      <Icon
        className={cn(isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5')}
        aria-hidden="true"
      />
      <span>{tier.label}</span>
    </span>
  )
}

export default ResponseTimeBadge
