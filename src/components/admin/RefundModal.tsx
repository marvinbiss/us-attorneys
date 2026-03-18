'use client'

import { useState } from 'react'
import { X, CreditCard, AlertTriangle } from 'lucide-react'

interface RefundModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (amount: number, reason: string) => Promise<void>
  paymentId: string
  maxAmount: number
  currency?: string
}

const REFUND_REASONS = [
  { value: 'requested_by_customer', label: 'Customer request' },
  { value: 'duplicate', label: 'Duplicate payment' },
  { value: 'fraudulent', label: 'Fraud detected' },
  { value: 'service_not_provided', label: 'Service not provided' },
  { value: 'other', label: 'Other' },
]

export function RefundModal({
  isOpen,
  onClose,
  onConfirm,
  paymentId,
  maxAmount,
  currency = 'USD',
}: RefundModalProps) {
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full')
  const [amount, setAmount] = useState(maxAmount)
  const [reason, setReason] = useState('requested_by_customer')
  const [customReason, setCustomReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const refundAmount = refundType === 'full' ? maxAmount : amount

    if (refundAmount <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    if (refundAmount > maxAmount) {
      setError(`Amount cannot exceed ${formatAmount(maxAmount)}`)
      return
    }

    setLoading(true)
    try {
      const finalReason = reason === 'other' ? customReason : reason
      await onConfirm(refundAmount, finalReason)
      onClose()
    } catch (err: unknown) {
      setError('Refund failed. Please try again.')
      console.error('Refund error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value / 100)
  }

  const handleClose = () => {
    setRefundType('full')
    setAmount(maxAmount)
    setReason('requested_by_customer')
    setCustomReason('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div role="dialog" aria-modal="true" aria-labelledby="refund-modal-title" className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 id="refund-modal-title" className="text-lg font-semibold text-gray-900">Refund</h3>
                <p className="text-sm text-gray-500">ID: {paymentId.slice(0, 20)}...</p>
              </div>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600" aria-label="Close dialog">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Amount info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Maximum refundable amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatAmount(maxAmount)}</p>
            </div>

            {/* Refund type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="refundType"
                    value="full"
                    checked={refundType === 'full'}
                    onChange={() => setRefundType('full')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Full refund</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="refundType"
                    value="partial"
                    checked={refundType === 'partial'}
                    onChange={() => setRefundType('partial')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Partial refund</span>
                </label>
              </div>
            </div>

            {/* Partial amount input */}
            {refundType === 'partial' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund amount (in cents)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    max={maxAmount}
                    min={1}
                    className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    = {formatAmount(amount)}
                  </span>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {REFUND_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom reason */}
            {reason === 'other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specify reason
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  rows={2}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe the reason..."
                />
              </div>
            )}

            {/* Warning */}
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                This action is irreversible. The refund will be processed via Stripe and may take 5-10 business days to appear on the customer's account.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (reason === 'other' && !customReason)}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Refund ${refundType === 'full' ? formatAmount(maxAmount) : formatAmount(amount)}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
