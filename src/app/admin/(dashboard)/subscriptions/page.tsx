'use client'

import { useState } from 'react'
import { Search, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react'
import { SubscriptionBadge, PaymentStatusBadge } from '@/components/admin/StatusBadge'
import { ErrorBanner } from '@/components/admin/ErrorBanner'
import { useAdminFetch } from '@/hooks/admin/useAdminFetch'

interface Subscription {
  id: string
  user_id: string
  attorney_id: string | null
  plan: string
  status: string
  stripe_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  attorney?: {
    id: string
    name: string | null
  } | null
  profile?: {
    email: string | null
    full_name: string | null
  } | null
}

interface SubscriptionsResponse {
  subscriptions: Subscription[]
  totalPages: number
  total: number
}

export default function AdminSubscriptionsPage() {
  const [search, setSearch] = useState('')
  const [plan, setPlan] = useState<'all' | 'free' | 'pro' | 'premium'>('all')
  const [page, setPage] = useState(1)

  const url = `/api/admin/subscriptions?page=${page}&limit=20&plan=${plan}&search=${encodeURIComponent(search)}`
  const { data, isLoading, error, mutate } = useAdminFetch<SubscriptionsResponse>(url)

  const subscriptions = data?.subscriptions || []
  const totalPages = data?.totalPages || 1
  const total = data?.total || 0

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
          <p className="mt-1 text-gray-500">{total} total subscriptions</p>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email, name, attorney..."
                aria-label="Search subscriptions"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'free', 'pro', 'premium'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPlan(p)
                    setPage(1)
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    plan === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && <ErrorBanner message={error.message} onRetry={() => mutate()} />}

        {/* Subscriptions Table */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p>No subscriptions found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]" aria-label="Subscriptions list">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500"
                      >
                        Attorney
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500"
                      >
                        Plan
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
                        Period
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500"
                      >
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {sub.profile?.full_name || '-'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {sub.profile?.email || sub.user_id}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {sub.attorney?.name || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <SubscriptionBadge plan={sub.plan} />
                        </td>
                        <td className="px-6 py-4">
                          <PaymentStatusBadge status={sub.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {sub.current_period_start || sub.current_period_end ? (
                            <>
                              {formatDate(sub.current_period_start)}
                              {' — '}
                              {formatDate(sub.current_period_end)}
                            </>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(sub.created_at)}
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
