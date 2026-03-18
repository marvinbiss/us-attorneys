import { Calendar, Clock, User, Check } from 'lucide-react'
import type { Slot } from '@/hooks/useRealTimeAvailability'

interface BookingConfirmationProps {
  attorneyName: string
  specialtyName: string
  selectedDate: Date | null
  selectedSlot: Slot | null
  clientEmail: string
  bookingId: string | null
  onReset: () => void
}

export function BookingConfirmation({
  attorneyName,
  specialtyName,
  selectedDate,
  selectedSlot,
  clientEmail,
  bookingId,
  onReset,
}: BookingConfirmationProps) {
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
        A confirmation email has been sent to {clientEmail}
      </p>

      {bookingId && (
        <a
          href={`/booking/${bookingId}`}
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors mb-4"
        >
          Manage my booking
        </a>
      )}

      <button
        onClick={onReset}
        className="block w-full text-blue-600 hover:underline mt-4"
      >
        Make another booking
      </button>
    </div>
  )
}
