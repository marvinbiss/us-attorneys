'use client'

import { BadgeCheck, ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthenticityBadgeProps {
  score?: number | null // 0-100
  isVerifiedPurchase?: boolean
  bookingDate?: string
  size?: 'sm' | 'md' | 'lg'
  showScore?: boolean
  className?: string
}

const getAuthenticityLevel = (score: number) => {
  if (score >= 90) return 'high'
  if (score >= 70) return 'medium'
  if (score >= 50) return 'low'
  return 'suspicious'
}

const AUTHENTICITY_CONFIG = {
  high: {
    icon: ShieldCheck,
    label: 'Authentic review',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  medium: {
    icon: BadgeCheck,
    label: 'Likely authentic',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  low: {
    icon: HelpCircle,
    label: 'Not listed',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  suspicious: {
    icon: AlertTriangle,
    label: 'Needs review',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
}

const SIZE_CONFIG = {
  sm: {
    container: 'px-1.5 py-0.5 gap-1',
    icon: 'w-3 h-3',
    text: 'text-xs',
  },
  md: {
    container: 'px-2 py-1 gap-1.5',
    icon: 'w-4 h-4',
    text: 'text-sm',
  },
  lg: {
    container: 'px-3 py-1.5 gap-2',
    icon: 'w-5 h-5',
    text: 'text-base',
  },
}

export function AuthenticityBadge({
  score,
  isVerifiedPurchase = false,
  bookingDate,
  size = 'md',
  showScore = false,
  className,
}: AuthenticityBadgeProps) {
  // If no authenticity data is available, don't render anything
  if (score == null && !isVerifiedPurchase) return null

  // If verified purchase, show highest trust level
  const effectiveScore = score ?? 0
  const level = isVerifiedPurchase ? 'high' : getAuthenticityLevel(effectiveScore)
  const config = AUTHENTICITY_CONFIG[level]
  const sizeConfig = SIZE_CONFIG[size]
  const Icon = config.icon

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border',
        config.bgColor,
        config.borderColor,
        sizeConfig.container,
        className
      )}
      title={
        isVerifiedPurchase && bookingDate
          ? `Service performed on ${formatDate(bookingDate)}`
          : `Authenticity score: ${effectiveScore}%`
      }
    >
      <Icon className={cn(sizeConfig.icon, config.color)} />
      <span className={cn(sizeConfig.text, config.color, 'font-medium')}>
        {isVerifiedPurchase ? 'Confirmed purchase' : config.label}
      </span>
      {showScore && !isVerifiedPurchase && (
        <span className={cn(sizeConfig.text, 'text-gray-400')}>
          ({effectiveScore}%)
        </span>
      )}
    </div>
  )
}

// Detailed authenticity display for admin/attorney view
interface AuthenticityDetailsProps {
  score: number
  isVerifiedPurchase: boolean
  bookingId?: string
  bookingDate?: string
  flags?: {
    suspected_fake?: boolean
    unusual_pattern?: boolean
    ip_match?: boolean
    review_velocity?: boolean
  }
  riskFactors?: string[]
  className?: string
}

export function AuthenticityDetails({
  score,
  isVerifiedPurchase,
  bookingId: _bookingId,
  bookingDate,
  flags,
  riskFactors = [],
  className,
}: AuthenticityDetailsProps) {
  return (
    <div className={cn('p-4 rounded-lg border', className)}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Review authenticity
        </h4>
        <AuthenticityBadge
          score={score}
          isVerifiedPurchase={isVerifiedPurchase}
          size="sm"
        />
      </div>

      {/* Score bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">Trust score</span>
          <span className="font-medium">{score}%</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              score >= 90 ? 'bg-green-500' : score >= 70 ? 'bg-blue-500' : score >= 50 ? 'bg-gray-400' : 'bg-yellow-500'
            )}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Verified purchase info */}
      {isVerifiedPurchase && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg mb-3">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-medium mb-1">
            <ShieldCheck className="w-4 h-4" />
            Confirmed purchase
          </div>
          {bookingDate && (
            <p className="text-sm text-green-600 dark:text-green-500">
              Service performed on {new Date(bookingDate).toLocaleDateString('en-US')}
            </p>
          )}
        </div>
      )}

      {/* Flags */}
      {flags && Object.values(flags).some(Boolean) && (
        <div className="space-y-1 mb-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Detected signals:</p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
            {flags.suspected_fake && (
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Potentially generated content
              </li>
            )}
            {flags.unusual_pattern && (
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                Unusual pattern detected
              </li>
            )}
            {flags.ip_match && (
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                IP matching other reviews
              </li>
            )}
            {flags.review_velocity && (
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                High posting frequency
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Risk factors */}
      {riskFactors.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Risk factors:</p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
            {riskFactors.map((factor) => (
              <li key={factor} className="flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default AuthenticityBadge
