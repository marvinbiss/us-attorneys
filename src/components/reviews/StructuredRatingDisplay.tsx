import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingAxis {
  label: string
  value: number
  count: number
}

interface StructuredRatingDisplayProps {
  communication: number
  result: number
  responsiveness: number
  totalReviews: number
  /** Distribution of ratings per axis (optional, for detailed breakdown) */
  ratingDistribution?: Record<number, number>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CONFIG = {
  sm: {
    label: 'text-xs',
    value: 'text-xs font-semibold',
    barHeight: 'h-1.5',
    starSize: 'w-3 h-3',
    gap: 'gap-2',
    rowGap: 'gap-1.5',
  },
  md: {
    label: 'text-sm',
    value: 'text-sm font-semibold',
    barHeight: 'h-2',
    starSize: 'w-3.5 h-3.5',
    gap: 'gap-3',
    rowGap: 'gap-2',
  },
  lg: {
    label: 'text-base',
    value: 'text-base font-bold',
    barHeight: 'h-2.5',
    starSize: 'w-4 h-4',
    gap: 'gap-4',
    rowGap: 'gap-2.5',
  },
}

function RatingBar({
  axis,
  size = 'md',
}: {
  axis: RatingAxis
  size?: 'sm' | 'md' | 'lg'
}) {
  const config = SIZE_CONFIG[size]
  const percentage = (axis.value / 5) * 100

  return (
    <div className={cn('flex items-center', config.gap)} role="group" aria-label={`${axis.label}: ${axis.value.toFixed(1)} out of 5`}>
      <span className={cn(
        'text-gray-700 dark:text-gray-300 min-w-[120px] flex-shrink-0',
        config.label
      )}>
        {axis.label}
      </span>

      <div className="flex-1 min-w-0">
        <div className={cn(
          'w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden',
          config.barHeight
        )}>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              percentage >= 80
                ? 'bg-amber-500'
                : percentage >= 60
                ? 'bg-amber-400'
                : percentage >= 40
                ? 'bg-amber-300'
                : 'bg-amber-200'
            )}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={axis.value}
            aria-valuemin={0}
            aria-valuemax={5}
          />
        </div>
      </div>

      <div className={cn('flex items-center gap-1 flex-shrink-0 min-w-[60px] justify-end')}>
        <Star
          className={cn(config.starSize, 'text-amber-500 fill-amber-500')}
          aria-hidden="true"
        />
        <span className={cn(config.value, 'text-gray-900 dark:text-gray-100 tabular-nums')}>
          {axis.value.toFixed(1)}
        </span>
      </div>
    </div>
  )
}

/** Distribution bar chart showing count of 5-star, 4-star, etc. */
function RatingDistribution({
  distribution,
  totalReviews,
  size = 'md',
}: {
  distribution: Record<number, number>
  totalReviews: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const config = SIZE_CONFIG[size]

  return (
    <div className={cn('space-y-1', config.rowGap)}>
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = distribution[stars] || 0
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

        return (
          <div
            key={stars}
            className="flex items-center gap-2"
            role="group"
            aria-label={`${stars} star: ${count} reviews (${Math.round(percentage)}%)`}
          >
            <span className={cn(
              'text-gray-500 dark:text-gray-400 min-w-[24px] text-right tabular-nums',
              config.label
            )}>
              {stars}
            </span>
            <Star
              className={cn('w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0')}
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <div className={cn(
                'w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden',
                config.barHeight
              )}>
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
            <span className={cn(
              'text-gray-400 dark:text-gray-500 min-w-[32px] text-right tabular-nums',
              config.label
            )}>
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function StructuredRatingDisplay({
  communication,
  result,
  responsiveness,
  totalReviews,
  ratingDistribution,
  size = 'md',
  className,
}: StructuredRatingDisplayProps) {
  const config = SIZE_CONFIG[size]

  const axes: RatingAxis[] = [
    { label: 'Communication', value: communication, count: totalReviews },
    { label: 'Results', value: result, count: totalReviews },
    { label: 'Responsiveness', value: responsiveness, count: totalReviews },
  ]

  return (
    <div className={cn('space-y-3', className)} role="region" aria-label="Rating breakdown">
      {/* 3-axis breakdown */}
      <div className={cn('space-y-2', config.rowGap)}>
        {axes.map((axis) => (
          <RatingBar key={axis.label} axis={axis} size={size} />
        ))}
      </div>

      {/* Star distribution */}
      {ratingDistribution && totalReviews > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <h4 className={cn(
            'font-medium text-gray-700 dark:text-gray-300 mb-2',
            config.label
          )}>
            Rating distribution
          </h4>
          <RatingDistribution
            distribution={ratingDistribution}
            totalReviews={totalReviews}
            size={size}
          />
        </div>
      )}
    </div>
  )
}

/** Compact inline display of 3 sub-ratings as small tags */
export function SubRatingTags({
  communication,
  result,
  responsiveness,
  className,
}: {
  communication?: number
  result?: number
  responsiveness?: number
  className?: string
}) {
  if (!communication && !result && !responsiveness) return null

  const tags = [
    { label: 'Communication', value: communication },
    { label: 'Results', value: result },
    { label: 'Responsiveness', value: responsiveness },
  ].filter((t) => t.value != null)

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {tags.map((tag) => (
        <span
          key={tag.label}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border border-gray-150 dark:border-gray-600 px-2 py-0.5 rounded-full"
          title={`${tag.label}: ${tag.value!.toFixed(1)}/5`}
        >
          <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" aria-hidden="true" />
          <span className="text-gray-500 dark:text-gray-400">{tag.label}</span>
          <span className="text-gray-800 dark:text-gray-200 tabular-nums">{tag.value!.toFixed(1)}</span>
        </span>
      ))}
    </div>
  )
}

export default StructuredRatingDisplay
