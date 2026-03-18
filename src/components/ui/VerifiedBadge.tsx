'use client'

import { useState } from 'react'
import { CheckCircle, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerifiedBadgeProps {
  /** Whether the attorney is verified */
  isVerified: boolean
  /** Date the bar license was last verified (ISO string) */
  verificationDate?: string | null
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
}

const sizeConfig = {
  sm: {
    icon: 'w-3 h-3',
    text: 'text-xs',
    padding: 'px-2 py-0.5',
    gap: 'gap-1',
  },
  md: {
    icon: 'w-3.5 h-3.5',
    text: 'text-xs',
    padding: 'px-2.5 py-1',
    gap: 'gap-1.5',
  },
  lg: {
    icon: 'w-5 h-5',
    text: 'text-sm',
    padding: 'px-3.5 py-1.5',
    gap: 'gap-2',
  },
}

/**
 * Verified attorney badge with tooltip showing verification date.
 * Uses attorney's is_verified field and bar_admissions verification date.
 *
 * Variants:
 * - sm: inline text (search result cards)
 * - md: card-level badge
 * - lg: profile hero badge
 */
export function VerifiedAttorneyBadge({
  isVerified,
  verificationDate,
  size = 'md',
  className,
}: VerifiedBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (!isVerified) return null

  const config = sizeConfig[size]
  const Icon = size === 'lg' ? ShieldCheck : CheckCircle

  const formattedDate = verificationDate
    ? new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(verificationDate))
    : null

  const tooltipText = formattedDate
    ? `Bar license verified by US Attorneys on ${formattedDate}`
    : 'Bar license verified by US Attorneys'

  return (
    <span
      className={cn(
        'relative inline-flex items-center rounded-full border font-medium',
        config.padding,
        config.gap,
        config.text,
        'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
        className
      )}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      role="status"
      aria-label={tooltipText}
      tabIndex={0}
    >
      <Icon className={cn(config.icon, 'text-emerald-600 dark:text-emerald-400')} aria-hidden="true" />
      <span>Verified</span>

      {/* Tooltip */}
      {showTooltip && (
        <span
          className={cn(
            'absolute z-50 px-3 py-2 text-xs font-normal leading-snug',
            'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
            'rounded-lg shadow-lg whitespace-nowrap',
            'bottom-full left-1/2 -translate-x-1/2 mb-2',
            'pointer-events-none'
          )}
          role="tooltip"
        >
          {tooltipText}
          {/* Arrow */}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  )
}

export default VerifiedAttorneyBadge
