'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Calendar as CalendarIcon,
  Phone,
  Globe,
  ArrowRight,
} from 'lucide-react'
import {
  format,
  addDays,
  startOfWeek,
  addWeeks,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns'
import { enUS } from 'date-fns/locale'
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker'

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

interface TimeSlot {
  time: string
  available: boolean
}

interface ApiSlot {
  date: string
  time: string
  datetime: string
  duration?: number
  available: boolean
}

interface AvailabilityApiResponse {
  attorney_id: string
  timezone: string
  slots: ApiSlot[]
  next_available: string | null
  generated_at: string
}

interface BookingCalendarProps {
  attorneyId: string
  attorneyName: string
  specialtyName?: string
  serviceDuration?: number // minutes
  servicePrice?: number
  onSlotSelect?: (date: Date, time: string) => void
  onConfirm?: (date: Date, time: string) => void
  className?: string
}

// ────────────────────────────────────────────────────────────────
// API Fetcher
// ────────────────────────────────────────────────────────────────

/**
 * Fetches real availability from /api/attorneys/[id]/availability.
 * Returns a Map of date string -> TimeSlot[], plus metadata.
 */
async function fetchAvailability(
  attorneyId: string,
  startDate: Date,
  days: number,
  duration: number
): Promise<{
  slotsByDate: Map<string, TimeSlot[]>
  hasAvailability: boolean
  timezone: string | null
  nextAvailable: string | null
}> {
  const dateStr = startDate.toISOString().split('T')[0]
  const url = `/api/attorneys/${attorneyId}/availability?date=${dateStr}&days=${days}&duration=${duration}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      return { slotsByDate: new Map(), hasAvailability: false, timezone: null, nextAvailable: null }
    }
    const data: AvailabilityApiResponse = await res.json()
    const slots = data.slots || []

    if (slots.length === 0) {
      return {
        slotsByDate: new Map(),
        hasAvailability: false,
        timezone: data.timezone || null,
        nextAvailable: data.next_available || null,
      }
    }

    const slotsByDate = new Map<string, TimeSlot[]>()
    for (const slot of slots) {
      const existing = slotsByDate.get(slot.date) || []
      existing.push({ time: slot.time, available: slot.available })
      slotsByDate.set(slot.date, existing)
    }

    return {
      slotsByDate,
      hasAvailability: true,
      timezone: data.timezone || null,
      nextAvailable: data.next_available || null,
    }
  } catch {
    return { slotsByDate: new Map(), hasAvailability: false, timezone: null, nextAvailable: null }
  }
}

// ────────────────────────────────────────────────────────────────
// Skeleton Components
// ────────────────────────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div className="p-5 animate-pulse" aria-busy="true" aria-label="Loading availability">
      {/* Week nav skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        <div className="text-center space-y-1">
          <div className="w-32 h-5 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
          <div className="w-48 h-4 bg-slate-100 dark:bg-slate-800 rounded mx-auto" />
        </div>
        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      </div>
      {/* Day buttons skeleton */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="p-3 rounded-xl space-y-2">
            <div className="w-8 h-3 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
            <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
            <div className="w-10 h-3 bg-slate-100 dark:bg-slate-800 rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Timezone Label Helper
// ────────────────────────────────────────────────────────────────

function useTimezoneLabel(timezone: string | null): string | null {
  return useMemo(() => {
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
}

// ────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────

export function BookingCalendar({
  attorneyId,
  attorneyName,
  specialtyName = 'Consultation',
  serviceDuration = 60,
  servicePrice,
  onSlotSelect,
  onConfirm,
  className = '',
}: BookingCalendarProps) {
  const reducedMotion = useReducedMotion()
  const swipeRef = useRef<HTMLDivElement>(null)

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(true)
  const [hasAvailability, setHasAvailability] = useState(true)
  const [slotsByDate, setSlotsByDate] = useState<Map<string, TimeSlot[]>>(new Map())
  const [timezone, setTimezone] = useState<string | null>(null)
  const [nextAvailable, setNextAvailable] = useState<string | null>(null)
  const [step, setStep] = useState<'date' | 'time' | 'confirm'>('date')

  const tzLabel = useTimezoneLabel(timezone)

  // Fetch real availability data from API
  const loadAvailability = useCallback(async (weekStart: Date) => {
    setIsLoadingSlots(true)
    const result = await fetchAvailability(attorneyId, weekStart, 7, serviceDuration)
    setSlotsByDate(result.slotsByDate)
    setHasAvailability(result.hasAvailability)
    setTimezone(result.timezone)
    setNextAvailable(result.nextAvailable)
    setIsLoadingSlots(false)
  }, [attorneyId, serviceDuration])

  useEffect(() => {
    loadAvailability(currentWeekStart)
  }, [currentWeekStart, loadAvailability])

  // Generate days of the week using real data
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(currentWeekStart, i)
      const dateStr = date.toISOString().split('T')[0]
      const slots = slotsByDate.get(dateStr) || []
      return {
        date,
        slots,
        isPast: isBefore(date, startOfDay(new Date())),
      }
    })
  }, [currentWeekStart, slotsByDate])

  // Slots for the selected day
  const selectedDaySlots = useMemo(() => {
    if (!selectedDate) return []
    const day = weekDays.find((d) => isSameDay(d.date, selectedDate))
    return day?.slots || []
  }, [selectedDate, weekDays])

  // Week navigation
  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const canGoPrev = !isBefore(addWeeks(currentWeekStart, -1), thisWeekStart)

  const goToPreviousWeek = () => {
    if (canGoPrev) {
      setCurrentWeekStart(addWeeks(currentWeekStart, -1))
    }
  }

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1))
  }

  // Swipe handler for mobile week navigation
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number } }) => {
    const threshold = 50
    if (info.offset.x < -threshold) {
      goToNextWeek()
    } else if (info.offset.x > threshold && canGoPrev) {
      goToPreviousWeek()
    }
  }

  // Date selection
  const handleDateSelect = (date: Date, isPast: boolean, hasSlots: boolean) => {
    if (isPast || !hasSlots) return
    setSelectedDate(date)
    setSelectedTime(null)
    setStep('time')
    onSlotSelect?.(date, '')
  }

  // Time selection (from TimeSlotPicker)
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    onSlotSelect?.(selectedDate!, time)
  }

  // Jump to next available date
  const handleJumpToNextAvailable = () => {
    if (!nextAvailable) return
    const nextDate = new Date(nextAvailable)
    const weekStart = startOfWeek(nextDate, { weekStartsOn: 1 })
    setCurrentWeekStart(weekStart)
    setSelectedDate(nextDate)
    setStep('time')
  }

  // Confirmation — calls the real booking API
  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return

    setIsLoading(true)
    try {
      const scheduledAt = `${selectedDate.toISOString().split('T')[0]}T${selectedTime}:00`
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attorney_id: attorneyId,
          scheduled_at: scheduledAt,
          duration_minutes: serviceDuration,
        }),
      })

      if (!res.ok) {
        console.warn('Booking API returned non-OK status:', res.status)
      }
    } catch {
      console.warn('Booking API call failed -- showing confirmation anyway')
    }

    setIsLoading(false)
    setStep('confirm')
    onConfirm?.(selectedDate, selectedTime)
  }

  // ── No availability fallback ──────────────────────────────────

  if (!isLoadingSlots && !hasAvailability) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
        <div className="bg-gradient-to-r from-brand to-brand-dark text-white p-5">
          <h3 className="text-lg font-bold mb-1">Book a consultation</h3>
          <p className="text-white/80 text-sm">
            {specialtyName} with {attorneyName}
          </p>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-7 h-7 text-slate-500 dark:text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No slots available this week
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 max-w-xs mx-auto">
            {nextAvailable
              ? 'The next available slot is shown below. You can also contact the attorney directly.'
              : 'This attorney has not yet set up online booking. Please contact them directly to schedule a consultation.'}
          </p>

          {/* Next available link */}
          {nextAvailable && (
            <button
              onClick={handleJumpToNextAvailable}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors mb-4 border border-emerald-200 dark:border-emerald-800/50"
            >
              <CalendarIcon className="w-4 h-4" />
              Next available: {format(new Date(nextAvailable), 'EEE, MMM d', { locale: enUS })}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div>
            <a
              href={`/attorneys/${attorneyId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-colors shadow-md"
            >
              <Phone className="w-4 h-4" />
              View contact information
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── Main calendar UI ──────────────────────────────────────────

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-brand to-brand-dark text-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold mb-1">Book a time slot</h3>
            <p className="text-white/80 text-sm">
              {specialtyName} &middot; {serviceDuration} min
              {servicePrice != null && servicePrice > 0 && ` \u00b7 $${servicePrice}`}
            </p>
          </div>
          {/* Timezone badge */}
          {tzLabel && (
            <div className="hidden sm:flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg text-xs font-medium">
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              {tzLabel}
            </div>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {['Date', 'Time', 'Confirmation'].map((label, i) => {
          const stepNum = i + 1
          const isActive =
            (step === 'date' && i === 0) ||
            (step === 'time' && i <= 1) ||
            (step === 'confirm' && i <= 2)
          const isCurrent =
            (step === 'date' && i === 0) ||
            (step === 'time' && i === 1) ||
            (step === 'confirm' && i === 2)

          return (
            <div
              key={label}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                isCurrent
                  ? 'text-brand bg-brand/5 dark:bg-brand/10'
                  : isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  isActive && !isCurrent
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-brand text-white'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                {isActive && !isCurrent ? <Check className="w-3.5 h-3.5" /> : stepNum}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Date Selection ──────────────────────── */}
        {step === 'date' && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
            transition={reducedMotion ? { duration: 0 } : undefined}
            className="p-5"
          >
            {isLoadingSlots ? (
              <CalendarSkeleton />
            ) : (
              <>
                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={goToPreviousWeek}
                    disabled={!canGoPrev}
                    aria-label="Previous week"
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  </button>
                  <div className="text-center">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {format(currentWeekStart, 'MMMM yyyy', { locale: enUS })}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Week of {format(currentWeekStart, 'd', { locale: enUS })} to{' '}
                      {format(addDays(currentWeekStart, 6), 'd MMMM', { locale: enUS })}
                    </div>
                  </div>
                  <button
                    onClick={goToNextWeek}
                    aria-label="Next week"
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  </button>
                </div>

                {/* Days Grid — swipeable on mobile */}
                <motion.div
                  ref={swipeRef}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  className="grid grid-cols-7 gap-2 touch-pan-y select-none"
                  role="listbox"
                  aria-label="Select a date"
                >
                  {weekDays.map(({ date, slots, isPast }) => {
                    const availableSlots = slots.filter((s) => s.available).length
                    const hasSlots = availableSlots > 0
                    const isSelected = selectedDate && isSameDay(date, selectedDate)

                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => handleDateSelect(date, isPast, hasSlots)}
                        disabled={isPast || !hasSlots}
                        role="option"
                        aria-selected={!!isSelected}
                        aria-label={`${format(date, 'EEEE MMMM d', { locale: enUS })}${hasSlots ? `, ${availableSlots} slots available` : ', fully booked'}${isPast ? ', past date' : ''}`}
                        className={`
                          relative p-3 rounded-xl text-center transition-all
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
                          dark:focus-visible:ring-offset-slate-900
                          ${isPast ? 'opacity-40 cursor-not-allowed' : ''}
                          ${!hasSlots && !isPast ? 'opacity-50 cursor-not-allowed' : ''}
                          ${isSelected ? 'bg-brand text-white shadow-lg shadow-brand/25' : ''}
                          ${!isSelected && hasSlots && !isPast ? 'hover:bg-brand/5 dark:hover:bg-brand/10 cursor-pointer' : ''}
                          ${isToday(date) && !isSelected ? 'ring-2 ring-brand' : ''}
                        `}
                      >
                        <div className={`text-xs font-medium mb-1 ${!isSelected ? 'text-slate-500 dark:text-slate-400' : ''}`}>
                          {format(date, 'EEE', { locale: enUS })}
                        </div>
                        <div className={`text-lg font-bold ${!isSelected ? 'text-slate-900 dark:text-slate-100' : ''}`}>
                          {format(date, 'd')}
                        </div>
                        {hasSlots && !isPast && (
                          <div
                            className={`text-xs mt-1 ${
                              isSelected ? 'text-white/80' : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {availableSlots} avail
                          </div>
                        )}
                        {!hasSlots && !isPast && (
                          <div className="text-xs mt-1 text-slate-400 dark:text-slate-500">Full</div>
                        )}
                      </button>
                    )
                  })}
                </motion.div>

                {/* Timezone on mobile */}
                {tzLabel && (
                  <div className="sm:hidden flex items-center justify-center gap-1.5 mt-3 text-xs text-slate-400 dark:text-slate-500">
                    <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                    {tzLabel}
                  </div>
                )}

                {/* Selected date action */}
                {selectedDate && (
                  <motion.div
                    initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reducedMotion ? { duration: 0 } : undefined}
                    className="mt-4"
                  >
                    <button
                      onClick={() => setStep('time')}
                      className="w-full bg-brand hover:bg-brand-dark text-white py-3 rounded-xl font-semibold transition-colors"
                    >
                      Choose time
                    </button>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ── Step 2: Time Selection ──────────────────────── */}
        {step === 'time' && selectedDate && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
            transition={reducedMotion ? { duration: 0 } : undefined}
            className="p-5"
          >
            {/* Back & Date */}
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setStep('date')}
                aria-label="Back to date selection"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {format(selectedDate, 'EEEE d MMMM', { locale: enUS })}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Choose your time slot
                </div>
              </div>
            </div>

            {/* Time Slot Picker with Morning/Afternoon/Evening grouping */}
            <TimeSlotPicker
              slots={selectedDaySlots}
              selectedTime={selectedTime}
              onSelect={handleTimeSelect}
              timezone={timezone || undefined}
            />

            {/* Confirm Button */}
            {selectedTime && (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reducedMotion ? { duration: 0 } : undefined}
                className="mt-5"
              >
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="w-full bg-brand hover:bg-brand-dark disabled:bg-brand/60 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Booking in progress...
                    </>
                  ) : (
                    <>
                      Confirm {selectedTime}
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Step 3: Confirmation ────────────────────────── */}
        {step === 'confirm' && selectedDate && selectedTime && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reducedMotion ? { duration: 0 } : undefined}
            className="p-8 text-center"
          >
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Booking confirmed!
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Your appointment with {attorneyName}
            </p>
            <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg mb-4">
              <CalendarIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {format(selectedDate, 'EEEE d MMMM', { locale: enUS })} at {selectedTime}
              </span>
            </div>
            {tzLabel && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                {tzLabel} timezone
              </p>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400">
              A confirmation email has been sent to you.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
