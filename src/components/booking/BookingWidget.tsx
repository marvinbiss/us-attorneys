'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Video,
  Calendar,
  Clock,
  CheckCircle,
  Phone,
  Mail,
  User,
  MessageSquare,
  Loader2,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────

interface BookingWidgetProps {
  attorneyId: string
  attorneyName: string
  specialty?: string
  consultationFee?: number
}

interface TimeSlot {
  time: string
  available: boolean
}

interface AvailabilityDay {
  date: string
  slots: TimeSlot[]
}

interface BookingResponse {
  id: string
  scheduled_at: string
  room_url?: string
  status: string
}

type Step = 'date' | 'time' | 'info' | 'confirm' | 'success'

// ── Helpers ─────────────────────────────────────────────────────────

function getNext14Days(): Date[] {
  const days: Date[] = []
  const today = new Date()
  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d)
  }
  return days
}

function formatDateISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatDayName(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

function formatDayNumber(d: Date): number {
  return d.getDate()
}

function formatMonthName(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short' })
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

// ── Component ───────────────────────────────────────────────────────

export default function BookingWidget({
  attorneyId,
  attorneyName,
  specialty,
  consultationFee = 19,
}: BookingWidgetProps) {
  const [step, setStep] = useState<Step>('date')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availability, setAvailability] = useState<AvailabilityDay[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null)

  // Form fields
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientMessage, setClientMessage] = useState('')

  const days = getNext14Days()

  // Fetch availability
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/attorneys/${attorneyId}/availability`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load availability')
        return res.json()
      })
      .then((data: { availability: AvailabilityDay[] }) => {
        if (!cancelled) {
          setAvailability(data.availability ?? [])
          setLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [attorneyId])

  // Check if a date has available slots
  const getAvailableSlots = useCallback(
    (dateStr: string): TimeSlot[] => {
      const day = availability.find((d) => d.date === dateStr)
      return day?.slots.filter((s) => s.available) ?? []
    },
    [availability]
  )

  const isDateAvailable = useCallback(
    (dateStr: string): boolean => {
      return getAvailableSlots(dateStr).length > 0
    },
    [getAvailableSlots]
  )

  // Step navigation
  const goBack = () => {
    if (step === 'time') setStep('date')
    else if (step === 'info') setStep('time')
    else if (step === 'confirm') setStep('info')
  }

  // Handle date selection
  const handleDateSelect = (dateStr: string) => {
    if (!isDateAvailable(dateStr)) return
    setSelectedDate(dateStr)
    setSelectedTime(null)
    setStep('time')
  }

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep('info')
  }

  // Handle form submission -> confirmation
  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName.trim() || !clientEmail.trim()) return
    setStep('confirm')
  }

  // Handle booking creation
  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attorney_id: attorneyId,
          date: selectedDate,
          time: selectedTime,
          client_name: clientName.trim(),
          client_email: clientEmail.trim(),
          client_phone: clientPhone.trim() || undefined,
          message: clientMessage.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(
          (errData as { error?: string }).error || 'Failed to create booking'
        )
      }

      const data = (await res.json()) as BookingResponse
      setBookingResult(data)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Video className="w-5 h-5" aria-hidden="true" />
              Schedule a Video Consultation
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              with {attorneyName}
              {specialty ? ` — ${specialty}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
            <Clock className="w-4 h-4 text-white" aria-hidden="true" />
            <span className="text-white text-sm font-semibold">
              ${consultationFee} · 30 min
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Error banner */}
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Step indicator */}
        {step !== 'success' && (
          <div className="flex items-center gap-1.5 mb-5">
            {(['date', 'time', 'info', 'confirm'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full transition-colors ${
                    s === step
                      ? 'bg-blue-600'
                      : ['date', 'time', 'info', 'confirm'].indexOf(s) <
                          ['date', 'time', 'info', 'confirm'].indexOf(step)
                        ? 'bg-blue-300'
                        : 'bg-gray-200'
                  }`}
                />
                {i < 3 && <div className="w-6 h-px bg-gray-200" />}
              </div>
            ))}
          </div>
        )}

        {/* Back button */}
        {step !== 'date' && step !== 'success' && (
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* ── Step 1: Date Selection ─────────────────────────── */}
        {step === 'date' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" aria-hidden="true" />
              Select a date
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="ml-2 text-sm text-slate-500">
                  Loading availability...
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1.5">
                {days.map((day) => {
                  const dateStr = formatDateISO(day)
                  const available = isDateAvailable(dateStr)
                  const isSelected = selectedDate === dateStr

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => handleDateSelect(dateStr)}
                      disabled={!available}
                      className={`flex flex-col items-center py-2.5 px-1 rounded-xl text-xs transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md'
                          : available
                            ? 'bg-blue-50 text-gray-900 hover:bg-blue-100 border border-blue-200'
                            : 'bg-gray-50 text-gray-300 cursor-not-allowed border border-transparent'
                      }`}
                      aria-label={`${formatDayName(day)} ${formatDayNumber(day)} ${formatMonthName(day)}${available ? '' : ' — unavailable'}`}
                    >
                      <span className="font-medium">{formatDayName(day)}</span>
                      <span className="text-lg font-bold leading-tight">
                        {formatDayNumber(day)}
                      </span>
                      <span className="text-[10px] opacity-70">
                        {formatMonthName(day)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Time Slot Selection ─────────────────────── */}
        {step === 'time' && selectedDate && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" aria-hidden="true" />
              Select a time
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {formatFullDate(selectedDate)}
            </p>

            <div className="grid grid-cols-3 gap-2">
              {getAvailableSlots(selectedDate).map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => handleTimeSelect(slot.time)}
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                    selectedTime === slot.time
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>

            {getAvailableSlots(selectedDate).length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">
                No available slots for this date.
              </p>
            )}
          </div>
        )}

        {/* ── Step 3: Client Info Form ─────────────────────── */}
        {step === 'info' && (
          <form onSubmit={handleInfoSubmit}>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" aria-hidden="true" />
              Your information
            </h3>

            <div className="space-y-3">
              {/* Name */}
              <div>
                <label
                  htmlFor="booking-name"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Full name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    aria-hidden="true"
                  />
                  <input
                    id="booking-name"
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="booking-email"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    aria-hidden="true"
                  />
                  <input
                    id="booking-email"
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Phone (optional) */}
              <div>
                <label
                  htmlFor="booking-phone"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Phone <span className="text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    aria-hidden="true"
                  />
                  <input
                    id="booking-phone"
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="booking-message"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Brief description of your case{' '}
                  <span className="text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <MessageSquare
                    className="absolute left-3 top-3 w-4 h-4 text-gray-400"
                    aria-hidden="true"
                  />
                  <textarea
                    id="booking-message"
                    rows={3}
                    value={clientMessage}
                    onChange={(e) => setClientMessage(e.target.value)}
                    placeholder="What would you like to discuss?"
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-5 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Continue to confirmation
            </button>
          </form>
        )}

        {/* ── Step 4: Confirmation ────────────────────────────── */}
        {step === 'confirm' && selectedDate && selectedTime && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" aria-hidden="true" />
              Confirm your booking
            </h3>

            <div className="bg-blue-50 rounded-xl p-4 space-y-3 mb-5">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatFullDate(selectedDate)}
                  </p>
                  <p className="text-xs text-slate-500">at {selectedTime}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Video className="w-4 h-4 text-blue-600 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    30 min video consultation
                  </p>
                  <p className="text-xs text-slate-500">
                    with {attorneyName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-blue-600 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {clientName}
                  </p>
                  <p className="text-xs text-slate-500">{clientEmail}</p>
                </div>
              </div>

              {clientMessage && (
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-xs text-slate-600">{clientMessage}</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 mb-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Video consultation fee</span>
                <span className="text-lg font-bold text-gray-900">
                  ${consultationFee}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBooking}
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" aria-hidden="true" />
                  Book &amp; Pay ${consultationFee}
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Step 5: Success ──────────────────────────────────── */}
        {step === 'success' && bookingResult && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Booking confirmed!
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              A confirmation email has been sent to{' '}
              <span className="font-medium text-gray-700">{clientEmail}</span>.
            </p>

            {selectedDate && selectedTime && (
              <div className="bg-green-50 rounded-xl p-4 text-left space-y-2 mb-5">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-green-600" aria-hidden="true" />
                  <span className="font-medium text-gray-900">
                    {formatFullDate(selectedDate)} at {selectedTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Video className="w-4 h-4 text-green-600" aria-hidden="true" />
                  <span className="text-gray-700">
                    30 min video call with {attorneyName}
                  </span>
                </div>
              </div>
            )}

            {bookingResult.room_url && (
              <a
                href={bookingResult.room_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 text-white font-medium text-sm hover:bg-green-700 transition-colors"
              >
                <Video className="w-4 h-4" />
                Save video call link
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
