'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { motion } from 'framer-motion'
import { Check, AlertCircle, Lock } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  bookingId: string
  attorneyId: string
  amount: number
  description?: string
  onSuccess?: (paymentIntentId: string) => void
  onError?: (error: string) => void
  showSplitPayment?: boolean
  showDeposit?: boolean
}

type PaymentType = 'full' | 'deposit' | 'split'

export default function PaymentForm(props: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentType, setPaymentType] = useState<PaymentType>('full')
  const [splitInstallments, setSplitInstallments] = useState<2 | 3 | 4>(3)
  const [depositPercentage, setDepositPercentage] = useState(30)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState<{
    amount: number
    totalAmount: number
  } | null>(null)

  const { bookingId, attorneyId, amount, description } = props

  const createPaymentIntent = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/payments/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          attorneyId,
          amount,
          description,
          paymentType,
          depositPercentage: paymentType === 'deposit' ? depositPercentage : undefined,
          splitInstallments: paymentType === 'split' ? splitInstallments : undefined,
        }),
      })

      if (!response.ok) throw new Error('Failed to create payment intent')

      const data = await response.json()
      setClientSecret(data.clientSecret)
      setPaymentDetails({
        amount: data.amount,
        totalAmount: data.totalAmount,
      })
    } catch (error) {
      console.error('Payment intent error:', error)
      props.onError?.('Failed to initialize payment')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    createPaymentIntent()
  }, [paymentType, splitInstallments, depositPercentage])

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100)
  }

  return (
    <div className="space-y-6">
      {/* Payment Type Selection */}
      {(props.showSplitPayment || props.showDeposit) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Mode de paiement</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Full Payment */}
            <button
              onClick={() => setPaymentType('full')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                paymentType === 'full'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentType === 'full' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                  {paymentType === 'full' && <Check className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <div className="font-medium text-gray-900">Paiement complet</div>
                  <div className="text-sm text-gray-500">{formatPrice(amount)}</div>
                </div>
              </div>
            </button>

            {/* Deposit */}
            {props.showDeposit && (
              <button
                onClick={() => setPaymentType('deposit')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  paymentType === 'deposit'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentType === 'deposit' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {paymentType === 'deposit' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Acompte</div>
                    <div className="text-sm text-gray-500">
                      {formatPrice(Math.round(amount * (depositPercentage / 100)))} maintenant
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* Split Payment */}
            {props.showSplitPayment && (
              <button
                onClick={() => setPaymentType('split')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  paymentType === 'split'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentType === 'split' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {paymentType === 'split' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Paiement fractionne</div>
                    <div className="text-sm text-gray-500">
                      {splitInstallments}x {formatPrice(Math.round(amount / splitInstallments))}
                    </div>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Split Payment Options */}
          {paymentType === 'split' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-gray-50 rounded-xl"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de mensualites
              </label>
              <div className="flex gap-2">
                {([2, 3, 4] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setSplitInstallments(n)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      splitInstallments === n
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {n}x
                  </button>
                ))}
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Premiere echeance (aujourd'hui)</span>
                  <span className="font-medium">
                    {formatPrice(Math.round(amount / splitInstallments))}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Puis {splitInstallments - 1} echeances de</span>
                  <span className="font-medium">
                    {formatPrice(Math.round(amount / splitInstallments))}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Deposit Options */}
          {paymentType === 'deposit' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-gray-50 rounded-xl"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pourcentage de l'acompte
              </label>
              <div className="flex gap-2">
                {[20, 30, 50].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setDepositPercentage(pct)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      depositPercentage === pct
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Acompte (aujourd'hui)</span>
                  <span className="font-medium">
                    {formatPrice(Math.round(amount * (depositPercentage / 100)))}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Reste a payer (sur place)</span>
                  <span className="font-medium">
                    {formatPrice(amount - Math.round(amount * (depositPercentage / 100)))}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between text-lg">
          <span className="font-medium text-gray-700">
            {paymentType === 'full' ? 'Total a payer' :
             paymentType === 'deposit' ? 'Acompte a payer' :
             'Premiere echeance'}
          </span>
          <span className="font-bold text-gray-900">
            {paymentDetails ? formatPrice(paymentDetails.amount) : formatPrice(amount)}
          </span>
        </div>
        {paymentType !== 'full' && paymentDetails && (
          <div className="text-sm text-gray-500 text-right mt-1">
            Total: {formatPrice(paymentDetails.totalAmount)}
          </div>
        )}
      </div>

      {/* Stripe Payment Element */}
      {clientSecret && !isLoading ? (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#2563eb',
                colorBackground: '#ffffff',
                colorText: '#1f2937',
                colorDanger: '#ef4444',
                fontFamily: 'system-ui, sans-serif',
                borderRadius: '12px',
              },
            },
          }}
        >
          <CheckoutForm
            onSuccess={props.onSuccess}
            onError={props.onError}
          />
        </Elements>
      ) : (
        <div className="h-48 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      )}

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Lock className="w-4 h-4" />
        Paiement sécurisé par Stripe
      </div>
    </div>
  )
}

// Checkout Form Component (inside Elements provider)
function CheckoutForm({
  onSuccess,
  onError,
}: {
  onSuccess?: (paymentIntentId: string) => void
  onError?: (error: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/confirmation`,
        },
        redirect: 'if_required',
      })

      if (error) {
        setErrorMessage(error.message || 'Payment failed')
        onError?.(error.message || 'Payment failed')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess?.(paymentIntent.id)
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred')
      onError?.('An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: {
            applePay: 'auto',
            googlePay: 'auto',
          },
        }}
      />

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            Traitement en cours...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Payer maintenant
          </>
        )}
      </button>
    </form>
  )
}
