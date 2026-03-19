'use client'

import { useState } from 'react'
import { Search, CreditCard, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react'
import { PaymentStatusBadge } from '@/components/admin/StatusBadge'
import { ErrorBanner } from '@/components/admin/ErrorBanner'
import { useAdminFetch } from '@/hooks/admin/useAdminFetch'

interface Payment {
  id: string
  attorney_id: string | null
  user_id: string | null
  amount: number
  currency: string
  status: string
  stripe_payment_id: string | null
  description: string | null
  created_at: string
  attorney?: {
    id: string
    name: string | null
  } | null
  profile?: {
    email: string | null
  } | null
}

interface PaymentsResponse {
  payments: Payment[]
  totalPages: number
  total: number
}

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'succeeded' | 'pending' | 'failed' | 'refunded'>(
    'all'
  )
  const [page, setPage] = useState(1)

  const url = `/api/admin/payments?page=${page}&limit=20&status=${status}&search=${encodeURIComponent(search)}`
  const { data, isLoading, error, mutate } = useAdminFetch<PaymentsResponse>(url)

  const payments = data?.payments || []
  const totalPages = data?.totalPages || 1
  const total = data?.total || 0

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatAmount = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="mt-1 text-gray-500">{total} total payments</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email, attorney, description..."
                aria-label="Search payments"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'succeeded', 'pending', 'failed', 'refunded'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s)
                    setPage(1)
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    status === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s === 'all'
                    ? 'All'
                    : s === 'succeeded'
                      ? 'Succeeded'
                      : s === 'pending'
                        ? 'Pending'
                        : s === 'failed'
                          ? 'Failed'
                          : 'Refunded'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && <ErrorBanner message={error.message} onRetry={() => mutate()} />}

        {/* Payments Table */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p>No payments found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]" aria-label="Payments list">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500"
                      >
                        Attorney
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500"
                      >
                        Amount
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500"
                      >
                        Stripe ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatDate(payment.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {payment.description || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {payment.attorney?.name || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold text-gray-900">
                              {formatAmount(payment.amount, payment.currency)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <PaymentStatusBadge status={payment.status} />
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                          {payment.stripe_payment_id
                            ? payment.stripe_payment_id.slice(0, 20) + '...'
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:px-6">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
