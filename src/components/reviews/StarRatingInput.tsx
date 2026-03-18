'use client'

import { useState, useCallback, useRef } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingInputProps {
  /** Current value (1-5, 0 = unset) */
  value: number
  /** Callback when value changes */
  onChange: (value: number) => void
  /** Label displayed above the stars */
  label: string
  /** Unique name for ARIA identification */
  name: string
  /** Whether the input is disabled */
  disabled?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Optional error message */
  error?: string
  /** Additional class names */
  className?: string
}

const SIZE_CONFIG = {
  sm: {
    star: 'w-7 h-7',
    button: 'p-0.5',
    label: 'text-xs',
    hint: 'text-[10px]',
  },
  md: {
    star: 'w-9 h-9',
    button: 'p-1',
    label: 'text-sm',
    hint: 'text-xs',
  },
  lg: {
    star: 'w-11 h-11',
    button: 'p-1',
    label: 'text-base',
    hint: 'text-sm',
  },
}

const RATING_LABELS: Record<number, string> = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
}

export function StarRatingInput({
  value,
  onChange,
  label,
  name,
  disabled = false,
  size = 'md',
  error,
  className,
}: StarRatingInputProps) {
  const [hoveredStar, setHoveredStar] = useState(0)
  const groupRef = useRef<HTMLDivElement>(null)
  const config = SIZE_CONFIG[size]
  const displayValue = hoveredStar || value

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return

      let newValue = value
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault()
          newValue = Math.min(5, value + 1)
          break
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault()
          newValue = Math.max(1, value - 1)
          break
        case 'Home':
          e.preventDefault()
          newValue = 1
          break
        case 'End':
          e.preventDefault()
          newValue = 5
          break
        default:
          return
      }
      if (newValue !== value) {
        onChange(newValue)
      }
    },
    [value, onChange, disabled]
  )

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Label */}
      <label
        id={`${name}-label`}
        className={cn(
          'block font-medium text-gray-700 dark:text-gray-300',
          config.label
        )}
      >
        {label} <span className="text-red-500">*</span>
      </label>

      {/* Star group */}
      <div
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={`${name}-label`}
        aria-required="true"
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHoveredStar(0)}
        onKeyDown={handleKeyDown}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isSelected = star <= value
          const isHovered = star <= hoveredStar
          const isCurrent = star === value

          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${star} star${star > 1 ? 's' : ''} - ${RATING_LABELS[star]}`}
              tabIndex={isCurrent || (value === 0 && star === 1) ? 0 : -1}
              disabled={disabled}
              onClick={() => {
                if (!disabled) onChange(star)
              }}
              onMouseEnter={() => {
                if (!disabled) setHoveredStar(star)
              }}
              onFocus={() => {
                if (!disabled) setHoveredStar(star)
              }}
              onBlur={() => setHoveredStar(0)}
              className={cn(
                'transition-all duration-150 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
                config.button,
                disabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer hover:scale-110 active:scale-95'
              )}
            >
              <Star
                className={cn(
                  config.star,
                  'transition-colors duration-150',
                  isHovered
                    ? 'text-amber-400 fill-amber-400'
                    : isSelected
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-gray-300 dark:text-gray-600'
                )}
                aria-hidden="true"
              />
            </button>
          )
        })}

        {/* Rating hint text */}
        {displayValue > 0 && (
          <span
            className={cn(
              'ml-2 text-gray-500 dark:text-gray-400 transition-opacity duration-150',
              config.hint
            )}
            aria-live="polite"
          >
            {RATING_LABELS[displayValue]}
          </span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p
          id={`${name}-error`}
          className="text-xs text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}

export default StarRatingInput
