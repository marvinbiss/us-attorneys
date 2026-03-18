import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MessageSquare,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import type { Slot } from '@/hooks/useRealTimeAvailability'

interface BookingFormData {
  clientName: string
  clientPhone: string
  clientEmail: string
  message: string
}

interface BookingFormProps {
  selectedDate: Date | null
  selectedSlot: Slot | null
  formData: BookingFormData
  isSubmitting: boolean
  error: string | null
  attorneyName: string
  requireDeposit: boolean
  servicePrice?: number
  depositPercentage: number
  onFormChange: (field: string, value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
}

export function BookingForm({
  selectedDate,
  selectedSlot,
  formData,
  isSubmitting,
  error,
  attorneyName,
  requireDeposit,
  servicePrice,
  depositPercentage,
  onFormChange,
  onSubmit,
  onBack,
}: BookingFormProps) {
  const depositAmount = servicePrice ? Math.round(servicePrice * (depositPercentage / 100)) : 0

  return (
    <form onSubmit={onSubmit} className="p-6">
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
              onChange={(e) => onFormChange('clientName', e.target.value)}
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
              onChange={(e) => onFormChange('clientPhone', e.target.value)}
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
              onChange={(e) => onFormChange('clientEmail', e.target.value)}
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
              onChange={(e) => onFormChange('message', e.target.value)}
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
          onClick={onBack}
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
  )
}
