'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Ban,
  CalendarCheck,
  CalendarX2,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BlockedDate {
  id?: string
  blocked_date: string  // YYYY-MM-DD
  reason?: string | null
}

export interface BookingDate {
  id: string
  scheduled_at: string  // ISO datetime
  client_name: string
  status: string
}

interface BlockedDatesCalendarProps {
  blockedDates: BlockedDate[]
  bookings: BookingDate[]
  onBlockDates: (dates: string[]) => void
  onUnblockDates: (dates: string[]) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getCalendarDays(year: number, month: number): Array<Date | null> {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPadding = firstDay.getDay() // 0=Sun
  const totalDays = lastDay.getDate()

  const days: Array<Date | null> = []

  // Padding at start
  for (let i = 0; i < startPadding; i++) {
    days.push(null)
  }

  // Actual days
  for (let d = 1; d <= totalDays; d++) {
    days.push(new Date(year, month, d))
  }

  return days
}

function getDateRange(start: string, end: string): string[] {
  const dates: string[] = []
  const startDate = new Date(start + 'T12:00:00')
  const endDate = new Date(end + 'T12:00:00')

  const [first, last] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate]

  const current = new Date(first)
  while (current <= last) {
    dates.push(toDateString(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BlockedDatesCalendar({
  blockedDates,
  bookings,
  onBlockDates,
  onUnblockDates,
}: BlockedDatesCalendarProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [dragStart, setDragStart] = useState<string | null>(null)
  const [dragEnd, setDragEnd] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  const todayStr = toDateString(today)

  // Build lookup sets
  const blockedSet = useMemo(
    () => new Set(blockedDates.map(d => d.blocked_date)),
    [blockedDates]
  )

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, BookingDate[]>()
    for (const b of bookings) {
      const dateStr = b.scheduled_at.split('T')[0]
      const existing = map.get(dateStr) || []
      existing.push(b)
      map.set(dateStr, existing)
    }
    return map
  }, [bookings])

  // Calendar grid
  const calendarDays = useMemo(
    () => getCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  )

  // Drag selection range
  const dragRange = useMemo(() => {
    if (!dragStart || !dragEnd) return new Set<string>()
    return new Set(getDateRange(dragStart, dragEnd))
  }, [dragStart, dragEnd])

  // Navigation
  const goToPrev = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1)
      setViewMonth(11)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const goToNext = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1)
      setViewMonth(0)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const goToToday = () => {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }

  // Date interaction
  const handleDateMouseDown = useCallback((dateStr: string) => {
    // Don't allow blocking dates with bookings
    if (bookingsByDate.has(dateStr)) return
    // Don't allow blocking past dates
    if (dateStr < todayStr) return

    setDragStart(dateStr)
    setDragEnd(dateStr)
    setIsDragging(true)
  }, [bookingsByDate, todayStr])

  const handleDateMouseEnter = useCallback((dateStr: string) => {
    if (!isDragging) return
    setDragEnd(dateStr)
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false)
      setDragStart(null)
      setDragEnd(null)
      return
    }

    const range = getDateRange(dragStart, dragEnd)
    // Filter out past dates and dates with bookings
    const validDates = range.filter(d => d >= todayStr && !bookingsByDate.has(d))

    if (validDates.length > 0) {
      // Check if the first date in range is blocked -> unblock all, else block all
      const firstBlocked = blockedSet.has(validDates[0])
      if (firstBlocked) {
        const toUnblock = validDates.filter(d => blockedSet.has(d))
        if (toUnblock.length > 0) onUnblockDates(toUnblock)
      } else {
        const toBlock = validDates.filter(d => !blockedSet.has(d))
        if (toBlock.length > 0) onBlockDates(toBlock)
      }
    }

    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }, [isDragging, dragStart, dragEnd, todayStr, bookingsByDate, blockedSet, onBlockDates, onUnblockDates])

  // Block entire week
  const blockEntireWeek = useCallback(() => {
    // Get all dates in the current view month
    const dates: string[] = []
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = toDateString(new Date(viewYear, viewMonth, d))
      if (dateStr >= todayStr && !bookingsByDate.has(dateStr) && !blockedSet.has(dateStr)) {
        dates.push(dateStr)
      }
    }

    // Block the first 7 available dates
    const firstWeek = dates.slice(0, 7)
    if (firstWeek.length > 0) {
      onBlockDates(firstWeek)
    }
  }, [viewYear, viewMonth, todayStr, bookingsByDate, blockedSet, onBlockDates])

  // Date cell styling
  function getDateClasses(dateStr: string) {
    const isPast = dateStr < todayStr
    const isToday = dateStr === todayStr
    const isBlocked = blockedSet.has(dateStr)
    const hasBooking = bookingsByDate.has(dateStr)
    const isInDragRange = dragRange.has(dateStr)

    let base = 'relative w-full aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all select-none'

    if (isPast) {
      return `${base} text-gray-300 dark:text-gray-600 cursor-not-allowed`
    }

    if (hasBooking) {
      return `${base} bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 cursor-not-allowed ring-1 ring-blue-200 dark:ring-blue-800`
    }

    if (isBlocked) {
      if (isInDragRange) {
        return `${base} bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 ring-2 ring-green-400 dark:ring-green-600 cursor-pointer`
      }
      return `${base} bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800 cursor-pointer hover:bg-red-200 dark:hover:bg-red-900/60`
    }

    if (isInDragRange) {
      return `${base} bg-red-200 dark:bg-red-800/40 text-red-800 dark:text-red-200 ring-2 ring-red-400 dark:ring-red-600 cursor-pointer`
    }

    if (isToday) {
      return `${base} bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400 dark:ring-blue-600 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/30`
    }

    return `${base} text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/30 hover:ring-1 hover:ring-green-300 dark:hover:ring-green-700`
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Count stats for current month
  const monthBlockedCount = calendarDays.filter(d => d && blockedSet.has(toDateString(d))).length
  const monthBookingCount = calendarDays.filter(d => d && bookingsByDate.has(toDateString(d))).length

  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPrev}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 min-w-[180px] text-center">
            {formatMonthYear(viewYear, viewMonth)}
          </h3>
          <button
            type="button"
            onClick={goToNext}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={blockEntireWeek}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            <Ban className="w-3.5 h-3.5" />
            Block week
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/40 ring-1 ring-green-300 dark:ring-green-700" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/40 ring-1 ring-red-200 dark:ring-red-800" />
          Blocked ({monthBlockedCount})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/40 ring-1 ring-blue-200 dark:ring-blue-800" />
          Booked ({monthBookingCount})
        </span>
      </div>

      {/* Calendar grid */}
      <div
        ref={calendarRef}
        className="select-none"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map(d => (
            <div
              key={d}
              className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, i) => {
            if (!date) {
              return <div key={`pad-${i}`} className="aspect-square" />
            }

            const dateStr = toDateString(date)
            const hasBooking = bookingsByDate.has(dateStr)
            const isBlocked = blockedSet.has(dateStr)
            const bookingsForDate = bookingsByDate.get(dateStr) || []

            return (
              <div
                key={dateStr}
                className={getDateClasses(dateStr)}
                onMouseDown={() => handleDateMouseDown(dateStr)}
                onMouseEnter={() => handleDateMouseEnter(dateStr)}
                title={
                  hasBooking
                    ? `Booked: ${bookingsForDate.map(b => b.client_name).join(', ')}`
                    : isBlocked
                    ? 'Blocked - click to unblock'
                    : 'Available - click to block'
                }
              >
                <span className="text-sm">{date.getDate()}</span>
                {/* Indicators */}
                <div className="flex gap-0.5 mt-0.5">
                  {hasBooking && (
                    <CalendarCheck className="w-2.5 h-2.5 text-blue-500 dark:text-blue-400" />
                  )}
                  {isBlocked && (
                    <CalendarX2 className="w-2.5 h-2.5 text-red-500 dark:text-red-400" />
                  )}
                </div>
                {/* Booking count badge */}
                {bookingsForDate.length > 1 && (
                  <span className="absolute top-0.5 right-0.5 bg-blue-600 text-white text-[9px] leading-none font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {bookingsForDate.length}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Drag instructions */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Click a date to toggle, or click and drag to select a range. Booked dates cannot be blocked.
      </p>
    </div>
  )
}
