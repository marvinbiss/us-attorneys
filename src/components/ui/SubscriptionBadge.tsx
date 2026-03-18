'use client'

import { useState } from 'react'
import { Crown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SubscriptionTier } from '@/lib/billing/cpa-model'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SubscriptionBadgeProps {
  tier: SubscriptionTier
  /** sm = inline badge, md = profile badge */
  size?: 'sm' | 'md'
  className?: string
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

const TOOLTIP_TEXT: Record<Exclude<SubscriptionTier, 'free'>, string> = {
  pro: 'Pro member — priority placement in search results',
  premium: 'Premium member — featured attorney with top placement',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SubscriptionBadge({ tier, size = 'sm', className }: SubscriptionBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (tier === 'free') return null

  const isPremium = tier === 'premium'

  return (
    <span
      className={cn(
        'relative inline-flex items-center gap-1 font-semibold rounded-full select-none cursor-default',
        // Size variants
        size === 'sm' && 'text-[10px] px-2 py-0.5',
        size === 'md' && 'text-xs px-2.5 py-1',
        // Pro styling
        !isPremium && [
          'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
          'border border-blue-200 dark:border-blue-700',
        ],
        // Premium styling with animated glow
        isPremium && [
          'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30',
          'text-amber-700 dark:text-amber-300',
          'border border-amber-300 dark:border-amber-600',
          'shadow-sm shadow-amber-200/50 dark:shadow-amber-800/30',
        ],
        className,
      )}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={0}
      role="status"
      aria-label={isPremium ? 'Premium member' : 'Pro member'}
    >
      {/* Animated glow ring for premium */}
      {isPremium && (
        <span
          className="absolute -inset-[1px] rounded-full bg-gradient-to-r from-amber-400/20 via-yellow-300/20 to-amber-400/20 animate-pulse pointer-events-none"
          aria-hidden="true"
        />
      )}

      {isPremium ? (
        <Crown className={cn('relative', size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} aria-hidden="true" />
      ) : (
        <Zap className={cn('relative', size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} aria-hidden="true" />
      )}

      <span className="relative">{isPremium ? 'Premium' : 'Pro'}</span>

      {/* Tooltip */}
      {showTooltip && (
        <span
          className={cn(
            'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2',
            'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap',
            'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
            'shadow-lg pointer-events-none',
            // Arrow
            'after:absolute after:top-full after:left-1/2 after:-translate-x-1/2',
            'after:border-4 after:border-transparent after:border-t-gray-900 dark:after:border-t-gray-100',
          )}
          role="tooltip"
        >
          {TOOLTIP_TEXT[tier]}
        </span>
      )}
    </span>
  )
}

export default SubscriptionBadge
