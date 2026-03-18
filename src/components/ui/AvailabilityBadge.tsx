import { CalendarDays, Clock, CalendarX } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AvailabilitySlot } from '@/lib/availability'
import { formatAvailabilityShort } from '@/lib/availability'

interface AvailabilityBadgeProps {
  /** The availability slot, or null/undefined if no online booking. */
  slot: AvailabilitySlot | null | undefined
  /** Size variant */
  size?: 'sm' | 'md'
  /** Additional CSS classes */
  className?: string
}

/**
 * Doctolib-inspired availability badge.
 *
 * - Green "Available today at X" if slot is today
 * - Blue "Tomorrow at X" if slot is tomorrow
 * - Gray "Next: Mar 25" if further out
 * - Muted "No online booking" if no data
 */
export function AvailabilityBadge({ slot, size = 'sm', className }: AvailabilityBadgeProps) {
  const isSmall = size === 'sm'

  // No availability data
  if (!slot) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border font-medium',
          isSmall ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
          'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700',
          className
        )}
      >
        <CalendarX className={cn(isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5')} aria-hidden="true" />
        No online booking
      </span>
    )
  }

  // Available today - green
  if (slot.isToday) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border font-semibold',
          isSmall ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
          'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
          className
        )}
      >
        <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
        {formatAvailabilityShort(slot)}
      </span>
    )
  }

  // Tomorrow - blue
  if (slot.isTomorrow) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border font-semibold',
          isSmall ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
          'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
          className
        )}
      >
        <Clock className={cn(isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5')} aria-hidden="true" />
        {formatAvailabilityShort(slot)}
      </span>
    )
  }

  // Later date - neutral gray
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        isSmall ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        className
      )}
    >
      <CalendarDays className={cn(isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5')} aria-hidden="true" />
      Next: {formatAvailabilityShort(slot)}
    </span>
  )
}

export default AvailabilityBadge
