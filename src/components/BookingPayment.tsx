'use client'

import { useState } from 'react'
import { CreditCard, Lock, Loader2, AlertCircle, Check } from 'lucide-react'

interface BookingPaymentProps {
  bookingId: string
  specialtyName: string
  attorneyName: string
  depositAmount?: number // In euros
  onPaymentComplete?: () => void
}

export default function BookingPayment({
  bookingId,
  specialtyName,
  attorneyName,
  depositAmount = 10,
  onPaymentComplete: _onPaymentComplete,
}: BookingPaymentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/bookings/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          depositAmountInCents: depositAmount * 100,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du paiement')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du paiement')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Paiement de l'acompte</h3>
          <p className="text-sm text-gray-500">Sécurisé par Stripe</p>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-600">Service</span>
          <span className="font-medium text-gray-900">{specialtyName}</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-600">Artisan</span>
          <span className="font-medium text-gray-900">{attorneyName}</span>
        </div>
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Acompte à payer</span>
            <span className="text-xl font-bold text-blue-600">{depositAmount.toFixed(2)} EUR</span>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg mb-6">
        <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-green-800 font-medium">Paiement sécurisé</p>
          <p className="text-xs text-green-700 mt-1">
            Vos informations de paiement sont chiffrées et sécurisées par Stripe.
            L'acompte sera déduit du montant total lors de la prestation.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Redirection vers le paiement...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Payer {depositAmount.toFixed(2)} EUR
          </>
        )}
      </button>

      {/* Terms */}
      <p className="text-xs text-gray-500 text-center mt-4">
        En procédant au paiement, vous acceptez nos{' '}
        <a href="/terms" className="text-blue-600 hover:underline">
          conditions générales
        </a>{' '}
        et notre{' '}
        <a href="/privacy" className="text-blue-600 hover:underline">
          politique de remboursement
        </a>.
      </p>
    </div>
  )
}

// Payment Success component
export function PaymentSuccess() {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Paiement réussi !
      </h3>
      <p className="text-gray-600">
        Votre acompte a été enregistré. Vous recevrez un email de confirmation.
      </p>
    </div>
  )
}

// Payment Cancelled component
export function PaymentCancelled() {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-yellow-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Paiement annulé
      </h3>
      <p className="text-gray-600">
        Votre réservation est maintenue mais l'acompte n'a pas été payé.
      </p>
    </div>
  )
}
