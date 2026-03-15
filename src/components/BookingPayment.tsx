'use client'

import { useState } from 'react'
import { CreditCard, Lock, Loader2, AlertCircle, Check } from 'lucide-react'

interface BookingPaymentProps {
  bookingId: string
  specialtyName: string
  attorneyName: string
  depositAmount?: number // In dollars
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
        throw new Error(data.error || 'Payment error')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError(err instanceof Error ? err.message : 'Payment error')
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
          <h3 className="font-semibold text-gray-900">Deposit payment</h3>
          <p className="text-sm text-gray-500">Secured by Stripe</p>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-600">Service</span>
          <span className="font-medium text-gray-900">{specialtyName}</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-600">Attorney</span>
          <span className="font-medium text-gray-900">{attorneyName}</span>
        </div>
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Deposit to pay</span>
            <span className="text-xl font-bold text-blue-600">${depositAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg mb-6">
        <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-green-800 font-medium">Secure payment</p>
          <p className="text-xs text-green-700 mt-1">
            Your payment information is encrypted and secured by Stripe.
            The deposit will be deducted from the total amount at the time of service.
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
            Redirecting to payment...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay ${depositAmount.toFixed(2)}
          </>
        )}
      </button>

      {/* Terms */}
      <p className="text-xs text-gray-500 text-center mt-4">
        By proceeding with payment, you agree to our{' '}
        <a href="/terms" className="text-blue-600 hover:underline">
          terms of service
        </a>{' '}
        and our{' '}
        <a href="/privacy" className="text-blue-600 hover:underline">
          refund policy
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
        Payment successful!
      </h3>
      <p className="text-gray-600">
        Your deposit has been recorded. You will receive a confirmation email.
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
        Payment cancelled
      </h3>
      <p className="text-gray-600">
        Your booking has been kept but the deposit has not been paid.
      </p>
    </div>
  )
}
