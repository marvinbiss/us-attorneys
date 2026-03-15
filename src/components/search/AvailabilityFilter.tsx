'use client'

import { Calendar, Clock, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type AvailabilityOption = 'any' | 'today' | 'tomorrow' | 'this_week'

interface AvailabilityFilterProps {
  value: AvailabilityOption
  onChange: (value: AvailabilityOption) => void
  className?: string
}

const OPTIONS: { value: AvailabilityOption; label: string; sublabel: string; icon: React.ElementType }[] = [
  {
    value: 'any',
    label: 'All',
    sublabel: 'No filter',
    icon: Calendar,
  },
  {
    value: 'today',
    label: 'Today',
    sublabel: 'Available now',
    icon: Clock,
  },
  {
    value: 'tomorrow',
    label: 'Tomorrow',
    sublabel: 'Available tomorrow',
    icon: Calendar,
  },
  {
    value: 'this_week',
    label: 'This week',
    sublabel: 'Within 7 days',
    icon: Calendar,
  },
]

export function AvailabilityFilter({
  value,
  onChange,
  className,
}: AvailabilityFilterProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {OPTIONS.map((option) => {
        const Icon = option.icon
        const isSelected = value === option.value

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
              isSelected
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                isSelected
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              )}
            >
              <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 text-left">
              <div
                className={cn(
                  'font-medium',
                  isSelected
                    ? 'text-purple-700 dark:text-purple-300'
                    : 'text-gray-900 dark:text-white'
                )}
              >
                {option.label}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {option.sublabel}
              </div>
            </div>

            {isSelected && (
              <Check className="w-5 h-5 text-purple-500" />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default AvailabilityFilter
