'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  User,
  Phone,
  Mail,
  MessageSquare,
  AlertCircle,
  Loader2,
} from 'lucide-react'

interface TimeSlot {
  id: string
  start: string
  end: string
  available: boolean
}

interface BookingCalendarProps {
  attorneyId: string
  attorneyName: string
  specialtyName: string
  onBookingComplete?: (booking: BookingData) => void
}

interface BookingData {
  slotId: string
  date: string
  clientName: string
  clientPhone: string
  clientEmail: string
  message?: string
}

function getDaysInMonth(year: number, month: number) {
  const date = new Date(year, month, 1)
  const days = []
  while (date.getMonth() === month) {
    days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  return days
}

export default function BookingCalendar({
  attorneyId,
  attorneyName,
  specialtyName,
  onBookingComplete,
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [step, setStep] = useState<'calendar' | 'form' | 'confirmation'>('calendar')
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<Record<string, TimeSlot[]>>({})
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const days = getDaysInMonth(year, month)
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Fetch available slots from API when month changes
  const fetchAvailableSlots = useCallback(async (year: number, month: number) => {
    setIsLoadingSlots(true)
    setError(null)
    try {
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const response = await fetch(`/api/bookings?attorneyId=${attorneyId}&month=${monthStr}`)

      if (!response.ok) {
        throw new Error('Failed to load availability')
      }

      const data = await response.json()
      setAvailableSlots(data.slots || {})
    } catch (err) {
      console.error('Error fetching slots:', err)
      setError('Unable to load availability. Please try again.')
    } finally {
      setIsLoadingSlots(false)
    }
  }, [attorneyId])

  // Load slots when component mounts or month changes
  useEffect(() => {
    fetchAvailableSlots(currentDate.getFullYear(), currentDate.getMonth())
  }, [currentDate.getFullYear(), currentDate.getMonth(), fetchAvailableSlots])

  const getAvailableSlots = (date: Date): TimeSlot[] => {
    const dateStr = date.toISOString().split('T')[0]
    return availableSlots[dateStr] || []
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedSlot) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attorneyId,
          slotId: selectedSlot.id,
          clientName: formData.clientName,
          clientPhone: formData.clientPhone,
          clientEmail: formData.clientEmail,
          serviceDescription: formData.message || specialtyName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Booking failed')
      }

      const bookingData: BookingData = {
        slotId: selectedSlot.id,
        date: selectedDate.toISOString().split('T')[0],
        ...formData,
      }

      onBookingComplete?.(bookingData)
      setStep('confirmation')
    } catch (err) {
      console.error('Booking error:', err)
      setError(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'confirmation') {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Booking confirmed!
        </h3>
        <p className="text-gray-600 mb-6">
          Your appointment with {attorneyName} is confirmed.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">
              {selectedDate?.toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">
              {selectedSlot?.start} - {selectedSlot?.end}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">
              {specialtyName}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          A confirmation email has been sent to {formData.clientEmail}
        </p>
        <button
          onClick={() => {
            setStep('calendar')
            setSelectedDate(null)
            setSelectedSlot(null)
            setFormData({ clientName: '', clientPhone: '', clientEmail: '', message: '' })
          }}
          className="text-blue-600 hover:underline"
        >
          Book another appointment
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <h3 className="text-lg font-semibold mb-1">Book an appointment</h3>
        <p className="text-blue-100 text-sm">{attorneyName} - {specialtyName}</p>
      </div>

      {step === 'calendar' && (
        <div className="p-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h4 className="font-semibold text-gray-900">
              {monthNames[month]} {year}
            </h4>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}

            {Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {days.map(date => {
              const available = hasAvailableSlots(date)
              const past = isPast(date)
              const selected = selectedDate?.toDateString() === date.toDateString()

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => available && !past && setSelectedDate(date)}
                  disabled={!available || past}
                  className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                    selected
                      ? 'bg-blue-600 text-white'
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

          {/* Loading indicator */}
          {isLoadingSlots && (
            <div className="flex items-center justify-center py-4 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading availability...</span>
            </div>
          )}

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
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Available slots on {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {getAvailableSlots(selectedDate).map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      selectedSlot?.id === slot.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    {slot.start} - {slot.end}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Continue button */}
          {selectedSlot && (
            <button
              onClick={() => setStep('form')}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      )}

      {step === 'form' && (
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Selected slot summary */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 text-blue-700">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">
                {selectedDate?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
              <span>-</span>
              <Clock className="w-5 h-5" />
              <span className="font-medium">
                {selectedSlot?.start} - {selectedSlot?.end}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Smith"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message (optional)
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Briefly describe your needs..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 mt-4 p-3 bg-yellow-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700">
              By confirming, you agree to be contacted by {attorneyName} to finalize appointment details.
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setStep('calendar')}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Confirming...' : 'Confirm booking'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
