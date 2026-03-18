'use client'

import { useState, useMemo } from 'react'
import {
  Clock,
  User,
  Mail,
  X,
  CalendarCheck,
  Ban,
  Minus,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BookingPreview {
  id: string
  scheduled_at: string
  duration_minutes: number
  status: string
  client_name: string
  client_email: string
}

export interface AvailabilitySlot {
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

interface UpcomingBookingsPreviewProps {
  bookings: BookingPreview[]
  blockedDates: string[]  // YYYY-MM-DD
  availabilitySlots: AvailabilitySlot[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}



function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

// ─── Booking Detail Modal ────────────────────────────────────────────────────

function BookingDetailModal({
  booking,
  onClose,
}: {
  booking: BookingPreview
  onClose: () => void
}) {
  const scheduledDate = new Date(booking.scheduled_at)
  const endTime = new Date(scheduledDate.getTime() + booking.duration_minutes * 60000)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-500" />
            Booking Details
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="font-medium">{booking.client_name}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm">{booking.client_email}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">
                {scheduledDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                {scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                {' - '}
                {endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                {' '}({booking.duration_minutes} min)
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              booking.status === 'confirmed'
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : booking.status === 'pending'
                ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ─── Day Column ─────────────────────────────────────────────────────────────

function DayColumn({
  date,
  isToday,
  isBlocked,
  dayBookings,
  availableSlots,
  onBookingClick,
}: {
  date: Date
  isToday: boolean
  isBlocked: boolean
  dayBookings: BookingPreview[]
  availableSlots: AvailabilitySlot[]
  onBookingClick: (b: BookingPreview) => void
}) {
  // Timeline from 7 AM to 9 PM
  const HOUR_START = 7
  const HOUR_END = 21
  const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60

  function minutesToPercent(m: number): number {
    const offset = m - HOUR_START * 60
    return Math.max(0, Math.min(100, (offset / TOTAL_MINUTES) * 100))
  }

  return (
    <div className={`flex-1 min-w-0 ${isToday ? 'ring-2 ring-blue-400 dark:ring-blue-500 rounded-lg' : ''}`}>
      {/* Date header */}
      <div className={`text-center py-2 rounded-t-lg ${
        isToday
          ? 'bg-blue-50 dark:bg-blue-950/30'
          : isBlocked
          ? 'bg-red-50 dark:bg-red-950/20'
          : 'bg-gray-50 dark:bg-gray-800'
      }`}>
        <p className={`text-[10px] uppercase font-semibold ${
          isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
        }`}>
          {date.toLocaleDateString('en-US', { weekday: 'short' })}
        </p>
        <p className={`text-lg font-bold ${
          isToday ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'
        }`}>
          {date.getDate()}
        </p>
      </div>

      {/* Timeline */}
      <div className="relative bg-white dark:bg-gray-800 border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-lg" style={{ height: '200px' }}>
        {isBlocked ? (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50/50 dark:bg-red-950/20">
            <div className="text-center">
              <Ban className="w-5 h-5 text-red-400 dark:text-red-500 mx-auto mb-1" />
              <span className="text-[10px] text-red-500 dark:text-red-400 font-medium">Blocked</span>
            </div>
          </div>
        ) : (
          <>
            {/* Hour grid lines */}
            {Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => {
              const hour = HOUR_START + i
              const pct = minutesToPercent(hour * 60)
              return (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-700/50"
                  style={{ top: `${pct}%` }}
                />
              )
            })}

            {/* Available slots (green) */}
            {availableSlots.map((slot, idx) => {
              const startMin = timeToMinutes(slot.start_time)
              const endMin = timeToMinutes(slot.end_time)
              const top = minutesToPercent(startMin)
              const height = minutesToPercent(endMin) - top

              return (
                <div
                  key={`avail-${idx}`}
                  className="absolute left-0.5 right-0.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-sm"
                  style={{ top: `${top}%`, height: `${Math.max(height, 2)}%` }}
                  title={`Available: ${minutesToTime(startMin)} - ${minutesToTime(endMin)}`}
                />
              )
            })}

            {/* Bookings (blue) */}
            {dayBookings.map(booking => {
              const bookingDate = new Date(booking.scheduled_at)
              const startMin = bookingDate.getHours() * 60 + bookingDate.getMinutes()
              const endMin = startMin + booking.duration_minutes
              const top = minutesToPercent(startMin)
              const height = minutesToPercent(endMin) - top

              return (
                <button
                  key={booking.id}
                  onClick={() => onBookingClick(booking)}
                  className="absolute left-1 right-1 bg-blue-500 dark:bg-blue-600 text-white rounded-sm px-1 py-0.5 text-[9px] leading-tight font-medium overflow-hidden cursor-pointer hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors z-10 text-left"
                  style={{ top: `${top}%`, height: `${Math.max(height, 4)}%` }}
                  title={`${booking.client_name} - ${minutesToTime(startMin)}`}
                >
                  <span className="truncate block">{booking.client_name}</span>
                </button>
              )
            })}

            {/* No availability indicator */}
            {availableSlots.length === 0 && dayBookings.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Minus className="w-4 h-4 text-gray-300 dark:text-gray-600 mx-auto" />
                  <span className="text-[10px] text-gray-300 dark:text-gray-600">No slots</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function UpcomingBookingsPreview({
  bookings,
  blockedDates,
  availabilitySlots,
}: UpcomingBookingsPreviewProps) {
  const [selectedBooking, setSelectedBooking] = useState<BookingPreview | null>(null)

  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates])

  // Next 7 days
  const next7Days = useMemo(() => {
    const days: Date[] = []
    const now = new Date()
    for (let i = 0; i < 7; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() + i)
      days.push(d)
    }
    return days
  }, [])

  const today = toDateString(new Date())

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, BookingPreview[]>()
    for (const b of bookings) {
      const dateStr = b.scheduled_at.split('T')[0]
      const existing = map.get(dateStr) || []
      existing.push(b)
      map.set(dateStr, existing)
    }
    return map
  }, [bookings])

  // Map availability by day of week
  const availByDow = useMemo(() => {
    const map = new Map<number, AvailabilitySlot[]>()
    for (const s of availabilitySlots) {
      if (!s.is_active) continue
      const existing = map.get(s.day_of_week) || []
      existing.push(s)
      map.set(s.day_of_week, existing)
    }
    return map
  }, [availabilitySlots])

  // Count summaries
  const totalBookings = bookings.length
  const totalBlocked = next7Days.filter(d => blockedSet.has(toDateString(d))).length
  const totalAvailable = next7Days.filter(d => {
    const dateStr = toDateString(d)
    if (blockedSet.has(dateStr)) return false
    const dow = d.getDay()
    return (availByDow.get(dow) || []).length > 0
  }).length

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalBookings}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Booked</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{totalAvailable}</p>
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">Available days</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{totalBlocked}</p>
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">Blocked</p>
        </div>
      </div>

      {/* 7-day timeline */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {next7Days.map(date => {
          const dateStr = toDateString(date)
          const isToday = dateStr === today
          const isBlocked = blockedSet.has(dateStr)
          const dayBookings = bookingsByDate.get(dateStr) || []
          const dow = date.getDay()
          const dayAvail = availByDow.get(dow) || []

          return (
            <DayColumn
              key={dateStr}
              date={date}
              isToday={isToday}
              isBlocked={isBlocked}
              dayBookings={dayBookings}
              availableSlots={isBlocked ? [] : dayAvail}
              onBookingClick={setSelectedBooking}
            />
          )
        })}
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 px-1">
        <span>7 AM</span>
        <span>12 PM</span>
        <span>5 PM</span>
        <span>9 PM</span>
      </div>

      {/* Booking detail modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  )
}
