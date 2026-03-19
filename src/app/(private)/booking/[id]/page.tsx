'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Check,
  X,
  AlertCircle,
  Loader2,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import CancellationModal from '@/components/CancellationModal'

interface BookingDetails {
  id: string
  client_name: string
  client_phone: string
  client_email: string
  service_description: string
  status: 'confirmed' | 'cancelled' | 'completed'
  created_at: string
  cancelled_at?: string
  cancellation_reason?: string
  slot: {
    id: string
    date: string
    start_time: string
    end_time: string
  }
  attorney: {
    id: string
    name: string
    full_name: string
    phone?: string
    email?: string
  }
}

interface AvailableSlot {
  id: string
  date: string
  start_time: string
  end_time: string
}

export default function BookingPage() {
  const params = useParams()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [selectedNewSlot, setSelectedNewSlot] = useState<string | null>(null)

  // Fetch booking details
  const fetchBooking = useCallback(async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Booking not found')
        }
        throw new Error('Error loading data')
      }

      const json = await response.json()
      setBooking(json.data?.booking || json.booking)
    } catch (err: unknown) {
      logger.error('Error fetching booking', err)
      setError(err instanceof Error ? err.message : 'Error loading data')
    } finally {
      setIsLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking])

  // Fetch available slots for rescheduling
  const fetchAvailableSlots = async () => {
    if (!booking) return

    setIsLoadingSlots(true)
    try {
      const now = new Date()
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

      const response = await fetch(
        `/api/bookings?attorneyId=${booking.attorney.id}&month=${monthStr}`
      )

      if (!response.ok) throw new Error('Error loading available slots')

      const data = await response.json()

      // Flatten slots from all dates
      const allSlots: AvailableSlot[] = []
      for (const [date, slots] of Object.entries(data.slots || {})) {
        for (const slot of slots as Array<{ id: string; start: string; end: string; available: boolean }>) {
          if (slot.available && new Date(`${date}T${slot.start}`) > new Date()) {
            allSlots.push({
              id: slot.id,
              date,
              start_time: slot.start,
              end_time: slot.end,
            })
          }
        }
      }

      setAvailableSlots(allSlots.sort((a, b) =>
        new Date(`${a.date}T${a.start_time}`).getTime() -
        new Date(`${b.date}T${b.start_time}`).getTime()
      ))
    } catch (err: unknown) {
      logger.error('Error fetching slots', err)
    } finally {
      setIsLoadingSlots(false)
    }
  }

  // Handle reschedule
  const handleReschedule = async () => {
    if (!selectedNewSlot) return

    setIsRescheduling(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newSlotId: selectedNewSlot }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error rescheduling')
      }

      // Refresh booking details
      await fetchBooking()
      setShowRescheduleModal(false)
      setSelectedNewSlot(null)
    } catch (err: unknown) {
      logger.error('Reschedule error', err)
      setError(err instanceof Error ? err.message : 'Error rescheduling')
    } finally {
      setIsRescheduling(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <Check className="w-4 h-4" />
            Confirmed
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <X className="w-4 h-4" />
            Cancelled
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            <Check className="w-4 h-4" />
            Completed
          </span>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {error || 'Booking not found'}
          </h1>
          <p className="text-gray-600 mb-6">
            The booking you are looking for does not exist or has been deleted.
          </p>
          <Link
            href="/"
            className="text-blue-600 hover:underline"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-2">My Booking</h1>
          <p className="text-blue-100">
            Manage your appointment with {booking.attorney.name || booking.attorney.full_name}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Status</h2>
            {getStatusBadge(booking.status)}
          </div>

          {booking.status === 'cancelled' && booking.cancellation_reason && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Cancellation reason:</span>{' '}
                {booking.cancellation_reason}
              </p>
            </div>
          )}
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Appointment Details
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium text-gray-900 capitalize">
                  {formatDate(booking.slot.date)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium text-gray-900">
                  {booking.slot.start_time} - {booking.slot.end_time}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Attorney</p>
                <p className="font-medium text-gray-900">
                  {booking.attorney.name || booking.attorney.full_name}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Service</p>
                <p className="font-medium text-gray-900">
                  {booking.service_description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Your Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Your Information
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">{booking.client_name}</span>
            </div>
            <div className="flex items-center gap-4">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">{booking.client_phone}</span>
            </div>
            <div className="flex items-center gap-4">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">{booking.client_email}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {booking.status === 'confirmed' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Actions
            </h2>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowRescheduleModal(true)
                  fetchAvailableSlots()
                }}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Reschedule Appointment</p>
                    <p className="text-sm text-gray-500">Choose a different time slot</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full flex items-center justify-between p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-600" />
                  <div className="text-left">
                    <p className="font-medium text-red-700">Cancel Appointment</p>
                    <p className="text-sm text-red-500">Cancellation requires 24h notice</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>
        )}

        {/* Contact Attorney */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm mb-2">
            Need help?
          </p>
          {booking.attorney.phone && (
            <a
              href={`tel:${booking.attorney.phone}`}
              className="text-blue-600 hover:underline font-medium"
            >
              Contact Attorney
            </a>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <CancellationModal
          bookingId={bookingId}
          bookingDate={formatDate(booking.slot.date)}
          bookingTime={`${booking.slot.start_time} - ${booking.slot.end_time}`}
          attorneyName={booking.attorney.name || booking.attorney.full_name}
          specialtyName={booking.service_description}
          onClose={() => setShowCancelModal(false)}
          onCancelled={() => {
            setShowCancelModal(false)
            fetchBooking()
          }}
        />
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Choose a New Time Slot
              </h3>
              <button
                onClick={() => {
                  setShowRescheduleModal(false)
                  setSelectedNewSlot(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {isLoadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No available slots at the moment
                </p>
              ) : (
                <div className="space-y-2">
                  {availableSlots.slice(0, 10).map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedNewSlot(slot.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                        selectedNewSlot === slot.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 capitalize">
                        {formatDate(slot.date)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {slot.start_time} - {slot.end_time}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRescheduleModal(false)
                    setSelectedNewSlot(null)
                  }}
                  disabled={isRescheduling}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={!selectedNewSlot || isRescheduling}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isRescheduling && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
