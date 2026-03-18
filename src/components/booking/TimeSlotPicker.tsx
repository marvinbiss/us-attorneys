'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Sun, Sunset, Moon, Check } from 'lucide-react'

interface TimeSlot {
  time: string
  available: boolean
}

interface TimeSlotPickerProps {
  /** Array of time slots for the selected date */
  slots: TimeSlot[]
  /** Currently selected time (HH:MM format) */
  selectedTime: string | null
  /** Called when a slot is selected */
  onSelect: (time: string) => void
  /** Attorney's IANA timezone for display */
  timezone?: string
  /** Optional additional CSS classes */
  className?: string
}

/** Group label: Morning (before 12), Afternoon (12-17), Evening (17+) */
type TimeGroup = 'morning' | 'afternoon' | 'evening'

function getTimeGroup(time: string): TimeGroup {
  const hour = parseInt(time.split(':')[0], 10)
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

const GROUP_CONFIG: Record<TimeGroup, { label: string; icon: typeof Sun }> = {
  morning: { label: 'Morning', icon: Sun },
  afternoon: { label: 'Afternoon', icon: Sunset },
  evening: { label: 'Evening', icon: Moon },
}

const GROUP_ORDER: TimeGroup[] = ['morning', 'afternoon', 'evening']

/**
 * TimeSlotPicker — grid of available time slots for a selected date.
 *
 * Features:
 * - Morning / Afternoon / Evening grouping
 * - Selected state with check mark
 * - Disabled state for booked slots
 * - Dark mode support
 * - Accessible (ARIA labels, keyboard navigation)
 */
export function TimeSlotPicker({
  slots,
  selectedTime,
  onSelect,
  timezone,
  className = '',
}: TimeSlotPickerProps) {
  const reducedMotion = useReducedMotion()

  // Group slots by time of day
  const grouped = useMemo(() => {
    const groups = new Map<TimeGroup, TimeSlot[]>()
    for (const slot of slots) {
      const group = getTimeGroup(slot.time)
      const existing = groups.get(group) || []
      existing.push(slot)
      groups.set(group, existing)
    }
    return groups
  }, [slots])

  // Format HH:MM to 12h display
  const formatTime12h = (time: string): string => {
    const [h, m] = time.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`
  }

  // Friendly timezone label
  const tzLabel = useMemo(() => {
    if (!timezone) return null
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short',
      })
      const parts = formatter.formatToParts(new Date())
      return parts.find((p) => p.type === 'timeZoneName')?.value || timezone
    } catch {
      return timezone
    }
  }, [timezone])

  if (slots.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          No time slots available for this date.
        </p>
      </div>
    )
  }

  return (
    <div className={className} role="listbox" aria-label="Available time slots">
      {/* Timezone indicator */}
      {tzLabel && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 text-right">
          Times shown in {tzLabel}
        </p>
      )}

      {GROUP_ORDER.map((groupKey) => {
        const groupSlots = grouped.get(groupKey)
        if (!groupSlots || groupSlots.length === 0) return null

        const { label, icon: Icon } = GROUP_CONFIG[groupKey]
        const availableCount = groupSlots.filter((s) => s.available).length

        return (
          <div key={groupKey} className="mb-5 last:mb-0">
            {/* Group header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
              </div>
              {availableCount > 0 && (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {availableCount} available
                </span>
              )}
            </div>

            {/* Slot grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {groupSlots.map((slot) => {
                const isSelected = selectedTime === slot.time
                const isAvailable = slot.available

                return (
                  <motion.button
                    key={slot.time}
                    onClick={() => isAvailable && onSelect(slot.time)}
                    disabled={!isAvailable}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={!isAvailable}
                    aria-label={`${formatTime12h(slot.time)}${isAvailable ? '' : ', booked'}${isSelected ? ', selected' : ''}`}
                    whileTap={reducedMotion || !isAvailable ? undefined : { scale: 0.95 }}
                    className={`
                      relative py-2.5 px-3 rounded-lg text-sm font-medium transition-all
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
                      dark:focus-visible:ring-offset-slate-800
                      ${!isAvailable
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed line-through'
                        : ''
                      }
                      ${isAvailable && !isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 cursor-pointer border border-emerald-200 dark:border-emerald-800/50'
                        : ''
                      }
                      ${isSelected
                        ? 'bg-brand text-white shadow-lg shadow-brand/25 dark:shadow-brand/40 border border-brand'
                        : ''
                      }
                    `}
                  >
                    <span className="flex items-center justify-center gap-1">
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      )}
                      {slot.time}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
