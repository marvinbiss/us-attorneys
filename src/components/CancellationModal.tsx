'use client'

import { useState } from 'react'
import { X, AlertTriangle, Loader2, Calendar, Clock } from 'lucide-react'

interface CancellationModalProps {
  bookingId: string
  bookingDate: string
  bookingTime: string
  attorneyName: string
  specialtyName: string
  onClose: () => void
  onCancelled: () => void
}

export default function CancellationModal({
  bookingId,
  bookingDate,
  bookingTime,
  attorneyName,
  specialtyName,
  onClose,
  onCancelled,
}: CancellationModalProps) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCancel = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancelledBy: 'client',
          reason: reason.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'annulation')
      }

      onCancelled()
    } catch (err) {
      console.error('Cancellation error:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'annulation')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Annuler la réservation
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning */}
          <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg mb-6">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Attention</p>
              <p className="text-sm text-yellow-700 mt-1">
                Les annulations doivent être effectuées au moins 24h avant le rendez-vous.
                Des frais peuvent s'appliquer en cas d'annulation tardive.
              </p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Détails du rendez-vous</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{bookingDate}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{bookingTime}</span>
              </div>
              <div className="text-gray-700">
                <span className="font-medium">{attorneyName}</span> - {specialtyName}
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Reason input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison de l'annulation (optionnel)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Indiquez la raison de votre annulation..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Conserver le RDV
            </button>
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmer l'annulation
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
