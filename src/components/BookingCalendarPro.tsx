'use client'

/**
 * BookingCalendarPro - ServicesArtisans
 * World-class booking calendar with all premium features
 * Based on best practices from Doctolib, Booksy, Calendly
 */

import { useState, useEffect } from 'react'
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
  Sparkles,
  Star,
  TrendingUp,
  CreditCard,
} from 'lucide-react'
import { useRealTimeAvailability, type Slot } from '@/hooks/useRealTimeAvailability'
import { BookingFunnel } from '@/lib/analytics/tracking'
import {
  getRecommendedSlots,
  type SuggestedSlot,
} from '@/lib/booking/smart-suggestions'

interface BookingCalendarProProps {
  attorneyId: string
  attorneyName: string
  specialtyName: string
  servicePrice?: number
  requireDeposit?: boolean
  depositPercentage?: number
  onBookingComplete?: (booking: BookingData) => void
}

interface BookingData {
  bookingId?: string
  slotId: string
  date: string
  startTime: string
  endTime: string
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

export default function BookingCalendarPro({
  attorneyId,
  attorneyName,
  specialtyName,
  servicePrice,
  requireDeposit = false,
  depositPercentage = 30,
  onBookingComplete: _onBookingComplete,
}: BookingCalendarProProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [step, setStep] = useState<'calendar' | 'form' | 'payment' | 'confirmation'>('calendar')
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendedSlots, setRecommendedSlots] = useState<SuggestedSlot[]>([])
  const [bookingResult, setBookingResult] = useState<{ bookingId: string } | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  // Real-time availability
  const {
    slots,
    isLoading,
    error: slotsError,
    refresh: _refresh,
    optimisticallyReserve,
    cancelOptimisticReservation,
  } = useRealTimeAvailability({
    attorneyId,
    month: monthStr,
    enabled: true,
  })

  const days = getDaysInMonth(year, month)
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Calculate recommended slots
  useEffect(() => {
    const allSlots = Object.entries(slots).flatMap(([date, dateSlots]) =>
      dateSlots
        .filter((s) => s.isAvailable)
        .map((s) => ({
          id: s.id,
          date,
          startTime: s.startTime,
          endTime: s.endTime,
        }))
    )

    if (allSlots.length > 0) {
      const recommendations = getRecommendedSlots(allSlots, undefined, {
        popularSlots: ['10:00', '14:00', '16:00'],
        highDemandDays: [2, 3, 4], // Tue, Wed, Thu
      })
      setRecommendedSlots(recommendations)
    }
  }, [slots])

  // Track calendar open
  useEffect(() => {
    BookingFunnel.openCalendar(attorneyId)
  }, [attorneyId])

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

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    BookingFunnel.selectDate(attorneyId, date.toISOString().split('T')[0])
  }

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot)
    BookingFunnel.selectSlot(attorneyId, slot.date, slot.startTime, slot.id)
  }

  const handleFormChange = (field: string, value: string) => {
    if (Object.keys(formData).every((k) => !formData[k as keyof typeof formData])) {
      BookingFunnel.startForm(attorneyId)
    }
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedSlot) return

    BookingFunnel.completeForm(attorneyId, !!formData.message)
    BookingFunnel.initiateBooking(attorneyId, specialtyName)

    setIsSubmitting(true)
    setError(null)

    // Optimistic update
    optimisticallyReserve(selectedSlot.id)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error(data.error || 'Error during booking')
      }

      setBookingResult({ bookingId: data.booking.id })

      // Track successful booking
      BookingFunnel.completeBooking(
        data.booking.id,
        attorneyId,
        specialtyName,
        selectedSlot.date,
        selectedSlot.startTime,
        servicePrice ? servicePrice * (depositPercentage / 100) : undefined
      )

      if (requireDeposit && servicePrice) {
        setStep('payment')
      } else {
        setStep('confirmation')
      }
    } catch (err) {
      console.error('Booking error:', err)
      cancelOptimisticReservation(selectedSlot.id)
      setError(err instanceof Error ? err.message : 'Error during booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  const depositAmount = servicePrice ? Math.round(servicePrice * (depositPercentage / 100)) : 0

  // Recommended slot badge
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

  // Confirmation screen
  if (step === 'confirmation') {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
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
            <span className="font-medium text-gray-900 capitalize">
              {selectedDate?.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">
              {selectedSlot?.startTime} - {selectedSlot?.endTime}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">{specialtyName}</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          A confirmation email has been sent to {formData.clientEmail}
        </p>

        {bookingResult && (
          <a
            href={`/booking/${bookingResult.bookingId}`}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors mb-4"
          >
            Manage my booking
          </a>
        )}

        <button
          onClick={() => {
            setStep('calendar')
            setSelectedDate(null)
            setSelectedSlot(null)
            setFormData({ clientName: '', clientPhone: '', clientEmail: '', message: '' })
            setBookingResult(null)
          }}
          className="block w-full text-blue-600 hover:underline mt-4"
        >
          Make another booking
        </button>
      </div>
    )
  }

  // Payment screen
  if (step === 'payment' && bookingResult) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center mb-6">
          <CreditCard className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-900">Deposit payment</h3>
          <p className="text-gray-600">Secure your booking</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Service</span>
            <span className="font-medium">{specialtyName}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Total price</span>
            <span className="font-medium">${servicePrice}</span>
          </div>
          <div className="flex justify-between pt-2 border-t mt-2">
            <span className="font-semibold">Deposit ({depositPercentage}%)</span>
            <span className="font-bold text-blue-600">${depositAmount}</span>
          </div>
        </div>

        <button
          onClick={async () => {
            const response = await fetch('/api/bookings/payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId: bookingResult.bookingId,
                depositAmountInCents: depositAmount * 100,
              }),
            })
            const data = await response.json()
            if (data.url) {
              window.location.href = data.url
            }
          }}
          className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <CreditCard className="w-5 h-5" />
          Pay ${depositAmount}
        </button>

        <button
          onClick={() => setStep('confirmation')}
          className="w-full text-gray-600 py-3 mt-2 hover:text-gray-800"
        >
          Pay later
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
        {servicePrice && (
          <p className="text-blue-200 text-sm mt-1">Starting at ${servicePrice}</p>
        )}
      </div>

      {step === 'calendar' && (
        <div className="p-6">
          {/* Error message */}
          {(error || slotsError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
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
                      setSelectedDate(date)
                      const slot = slots[rec.date]?.find((s) => s.id === rec.slotId)
                      if (slot) setSelectedSlot(slot)
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
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h4 className="font-semibold text-gray-900">
              {monthNames[month]} {year}
            </h4>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
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
                  onClick={() => available && !past && handleDateSelect(date)}
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
                    onClick={() => handleSlotSelect(slot)}
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
              onClick={() => setStep('form')}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
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
            <div className="flex items-center gap-3 text-blue-700 flex-wrap">
              <Calendar className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium capitalize">
                {selectedDate?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span className="text-blue-400">-</span>
              <Clock className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">
                {selectedSlot?.startTime} - {selectedSlot?.endTime}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                Your name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  id="clientName"
                  type="text"
                  required
                  autoComplete="name"
                  value={formData.clientName}
                  onChange={(e) => handleFormChange('clientName', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Smith"
                />
              </div>
            </div>

            <div>
              <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  id="clientPhone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={formData.clientPhone}
                  onChange={(e) => handleFormChange('clientPhone', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  id="clientEmail"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.clientEmail}
                  onChange={(e) => handleFormChange('clientEmail', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message (optional)
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" aria-hidden="true" />
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleFormChange('message', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Briefly describe your legal matter..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 mt-4 p-3 bg-yellow-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-yellow-700">
              By confirming, you agree to be contacted by {attorneyName} to confirm the appointment details.
            </p>
          </div>

          {/* Deposit notice */}
          {requireDeposit && servicePrice && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Deposit required:</strong> ${depositAmount} ({depositPercentage}% of the price) will be requested after confirmation.
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setStep('calendar')}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Confirming...
                </>
              ) : (
                'Confirm appointment'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
