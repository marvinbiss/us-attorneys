import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Sparkles,
  TrendingUp,
  Star,
} from 'lucide-react'
import type { Slot } from '@/hooks/useRealTimeAvailability'
import type { SuggestedSlot } from '@/lib/booking/smart-suggestions'

function getDaysInMonth(year: number, month: number) {
  const date = new Date(year, month, 1)
  const days = []
  while (date.getMonth() === month) {
    days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  return days
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface CalendarGridProps {
  currentDate: Date
  selectedDate: Date | null
  selectedSlot: Slot | null
  slots: Record<string, Slot[]>
  isLoading: boolean
  error: string | null
  slotsError: string | null
  recommendedSlots: SuggestedSlot[]
  onMonthChange: (date: Date) => void
  onDateSelect: (date: Date) => void
  onSlotSelect: (slot: Slot) => void
  onContinue: () => void
}

export function CalendarGrid({
  currentDate,
  selectedDate,
  selectedSlot,
  slots,
  isLoading,
  error,
  slotsError,
  recommendedSlots,
  onMonthChange,
  onDateSelect,
  onSlotSelect,
  onContinue,
}: CalendarGridProps) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const days = getDaysInMonth(year, month)
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  const getAvailableSlots = (date: Date): Slot[] => {
    const dateStr = date.toISOString().split('T')[0]
    return slots[dateStr]?.filter((s) => s.isAvailable) || []
  }

  const hasAvailableSlots = (date: Date): boolean => {
    return getAvailableSlots(date).length > 0
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPast = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const getSlotBadge = (slot: Slot) => {
    const recommendation = recommendedSlots.find((r) => r.slotId === slot.id)
    if (!recommendation) return null

    const badges: Record<string, { icon: React.ComponentType<{ className?: string }>; text: string; color: string }> = {
      popular: { icon: TrendingUp, text: 'Popular', color: 'bg-orange-100 text-orange-700' },
      recommended: { icon: Sparkles, text: 'Recommended', color: 'bg-blue-100 text-blue-700' },
      last_minute: { icon: Clock, text: 'Last minute', color: 'bg-green-100 text-green-700' },
      best_value: { icon: Star, text: 'Best value', color: 'bg-purple-100 text-purple-700' },
    }

    const badge = recommendation.badge ? badges[recommendation.badge] : null
    if (!badge) return null

    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    )
  }

  return (
    <div className="p-6">
      {/* Error message */}
      {(error || slotsError) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <p className="text-sm text-red-700">{error || slotsError}</p>
        </div>
      )}

      {/* Recommended slots */}
      {recommendedSlots.length > 0 && !selectedDate && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Recommended slots
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {recommendedSlots.slice(0, 3).map((rec) => (
              <button
                key={rec.slotId}
                onClick={() => {
                  const date = new Date(rec.date)
                  onDateSelect(date)
                  const slot = slots[rec.date]?.find((s) => s.id === rec.slotId)
                  if (slot) onSlotSelect(slot)
                }}
                className="p-3 bg-white rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-colors text-left"
              >
                <div className="text-sm font-medium text-gray-900 capitalize">
                  {new Date(rec.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="text-blue-600 font-semibold">
                  {rec.startTime}
                </div>
                {rec.badge && (
                  <span className="text-xs text-blue-500">{rec.badgeText}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onMonthChange(new Date(year, month - 1, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h4 className="font-semibold text-gray-900">
          {monthNames[month]} {year}
        </h4>
        <button
          onClick={() => onMonthChange(new Date(year, month + 1, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-4 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Loading availability...</span>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4" role="grid" aria-label="Calendar">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2" role="columnheader">
            {day}
          </div>
        ))}

        {Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" role="gridcell" />
        ))}

        {days.map((date) => {
          const available = hasAvailableSlots(date)
          const past = isPast(date)
          const selected = selectedDate?.toDateString() === date.toDateString()

          return (
            <button
              key={date.toISOString()}
              onClick={() => available && !past && onDateSelect(date)}
              disabled={!available || past}
              role="gridcell"
              aria-selected={selected}
              aria-disabled={!available || past}
              aria-label={`${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}${available ? ', available' : ', unavailable'}`}
              className={`aspect-square rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                selected
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : available && !past
                  ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                  : isToday(date)
                  ? 'bg-blue-50 text-blue-600'
                  : past
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-6">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-100" />
          <span>Unavailable</span>
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="border-t pt-4" role="region" aria-label="Time slots">
          <h4 className="font-medium text-gray-900 mb-3">
            Available slots on{' '}
            <span className="capitalize">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {getAvailableSlots(selectedDate).map((slot) => (
              <button
                key={slot.id}
                onClick={() => onSlotSelect(slot)}
                aria-pressed={selectedSlot?.id === slot.id}
                className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  selectedSlot?.id === slot.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
                {getSlotBadge(slot)}
                {slot.teamMemberName && (
                  <span className="text-xs text-gray-500">{slot.teamMemberName}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Continue button */}
      {selectedSlot && (
        <button
          onClick={onContinue}
          className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
        >
          Continue
        </button>
      )}
    </div>
  )
}
