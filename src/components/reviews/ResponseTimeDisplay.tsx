'use client'

import { Clock, Zap, Timer, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResponseTimeDisplayProps {
  avgResponseTimeHours: number
  responseRate: number // 0-100
  totalReviews?: number
  reviewsWithResponse?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'badge' | 'card' | 'inline'
  className?: string
}

const getResponseSpeedLevel = (hours: number) => {
  if (hours <= 1) return 'instant'
  if (hours <= 4) return 'fast'
  if (hours <= 24) return 'normal'
  return 'slow'
}

const SPEED_CONFIG = {
  instant: {
    icon: Zap,
    label: 'Lightning fast',
    sublabel: '< 1h',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  fast: {
    icon: Clock,
    label: 'Fast',
    sublabel: '< 4h',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  normal: {
    icon: Timer,
    label: 'Normal',
    sublabel: '< 24h',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  slow: {
    icon: Timer,
    label: 'Slow',
    sublabel: '> 24h',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
}

const SIZE_CONFIG = {
  sm: {
    container: 'px-2 py-1 gap-1',
    icon: 'w-3 h-3',
    text: 'text-xs',
  },
  md: {
    container: 'px-2.5 py-1.5 gap-1.5',
    icon: 'w-4 h-4',
    text: 'text-sm',
  },
  lg: {
    container: 'px-3 py-2 gap-2',
    icon: 'w-5 h-5',
    text: 'text-base',
  },
}

export function ResponseTimeDisplay({
  avgResponseTimeHours,
  responseRate,
  totalReviews,
  reviewsWithResponse,
  size = 'md',
  variant = 'badge',
  className,
}: ResponseTimeDisplayProps) {
  const speedLevel = getResponseSpeedLevel(avgResponseTimeHours)
  const speedConfig = SPEED_CONFIG[speedLevel]
  const sizeConfig = SIZE_CONFIG[size]
  const Icon = speedConfig.icon

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`
    if (hours < 24) return `${Math.round(hours)}h`
    return `${Math.round(hours / 24)}d`
  }

  // Badge variant
  if (variant === 'badge') {
    return (
      <div
        className={cn(
          'inline-flex items-center rounded-full border',
          speedConfig.bgColor,
          speedConfig.borderColor,
          sizeConfig.container,
          className
        )}
        title={`Average response time: ${formatTime(avgResponseTimeHours)}`}
      >
        <Icon className={cn(sizeConfig.icon, speedConfig.color)} />
        <span className={cn(sizeConfig.text, speedConfig.color, 'font-medium')}>
          {speedConfig.label}
        </span>
      </div>
    )
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-1">
          <Icon className={cn('w-4 h-4', speedConfig.color)} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Responds in ~{formatTime(avgResponseTimeHours)}
          </span>
        </div>
        {responseRate >= 90 && (
          <span className="text-sm text-green-600 font-medium">
            {responseRate}% response rate
          </span>
        )}
      </div>
    )
  }

  // Card variant
  return (
    <div className={cn('p-4 rounded-lg border bg-white dark:bg-gray-800', className)}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Review responsiveness
        </h4>
        <div
          className={cn(
            'inline-flex items-center rounded-full border px-2 py-0.5',
            speedConfig.bgColor,
            speedConfig.borderColor
          )}
        >
          <Icon className={cn('w-3 h-3 mr-1', speedConfig.color)} />
          <span className={cn('text-xs font-medium', speedConfig.color)}>
            {speedConfig.label}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Response time */}
        <div>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm mb-1">
            <Clock className="w-4 h-4" />
            Avg. time
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatTime(avgResponseTimeHours)}
          </div>
        </div>

        {/* Response rate */}
        <div>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            Response rate
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {responseRate}%
          </div>
        </div>
      </div>

      {/* Progress bar for response rate */}
      <div className="mt-4">
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              responseRate >= 90 ? 'bg-green-500' :
              responseRate >= 70 ? 'bg-blue-500' :
              responseRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${responseRate}%` }}
          />
        </div>
      </div>

      {/* Review count */}
      {totalReviews !== undefined && reviewsWithResponse !== undefined && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {reviewsWithResponse} responses out of {totalReviews} reviews
        </p>
      )}
    </div>
  )
}

export default ResponseTimeDisplay
