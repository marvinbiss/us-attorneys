'use client'

import { useState } from 'react'
import { Search, Calendar, ChevronLeft, ChevronRight, XCircle, User, Briefcase } from 'lucide-react'
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmationModal } from '@/components/admin/ConfirmationModal'
import { ErrorBanner } from '@/components/admin/ErrorBanner'
import { useAdminFetch, adminMutate } from '@/hooks/admin/useAdminFetch'

interface Booking {
  id: string
  attorney_id: string
  client_id: string
  client_name: string
  client_email: string
  service_name: string
  scheduled_at: string
  status: string
  payment_status: string
  deposit_amount: number | null
  created_at: string
  provider?: {
    id: string
    name: string | null
    email: string
  }
}

interface BookingsResponse {
  bookings: Booking[]
  totalPages: number
  total: number
}

export default function AdminReservationsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>(
    'all'
  )
  const [page, setPage] = useState(1)
  const [actionError, setActionError] = useState<string | null>(null)

  const [cancelModal, setCancelModal] = useState<{ open: boolean; bookingId: string }>({
    open: false,
    bookingId: '',
  })

  const url = `/api/admin/bookings?page=${page}&limit=20&status=${status}&search=${encodeURIComponent(search)}`
  const { data, isLoading, error, mutate } = useAdminFetch<BookingsResponse>(url)

  const bookings = data?.bookings || []
  const totalPages = data?.totalPages || 1
  const total = data?.total || 0

  const handleCancel = async () => {
    try {
      setActionError(null)
      await adminMutate(`/api/admin/bookings/${cancelModal.bookingId}`, {
        method: 'PUT',
        body: { status: 'cancelled' },
      })
      setCancelModal({ open: false, bookingId: '' })
      mutate()
    } catch {
      setActionError('Error cancelling booking')
    }
  }

  const displayError = actionError || (error ? error.message : null)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatAmount = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
          <p className="mt-1 text-gray-500">{total} total bookings</p>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email, service..."
                aria-label="Search bookings"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((s) => (
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
                    : s === 'pending'
                      ? 'Pending'
                      : s === 'confirmed'
                        ? 'Confirmed'
                        : s === 'completed'
                          ? 'Completed'
                          : 'Cancelled'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {displayError && (
          <ErrorBanner
            message={displayError}
            onDismiss={() => setActionError(null)}
            onRetry={() => mutate()}
          />
        )}

        {/* Bookings Table */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p>No bookings found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]" aria-label="Bookings list">
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
                        Client
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
                        Service
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
                        Payment
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <p className="font-medium text-gray-900">
                              {formatDate(booking.scheduled_at)}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-gray-900">{booking.client_name || 'No name'}</p>
                              <p className="text-sm text-gray-500">{booking.client_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-gray-900">{booking.provider?.name || '-'}</p>
                              <p className="text-sm text-gray-500">{booking.provider?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-900">{booking.service_name}</td>
                        <td className="px-6 py-4">
                          <BookingStatusBadge status={booking.status} />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <PaymentStatusBadge status={booking.payment_status} />
                            {booking.deposit_amount && (
                              <p className="mt-1 text-xs text-gray-500">
                                Deposit: {formatAmount(booking.deposit_amount)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                              <button
                                onClick={() =>
                                  setCancelModal({ open: true, bookingId: booking.id })
                                }
                                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                title="Cancel"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            )}
                          </div>
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

      {/* Cancel Modal */}
      <ConfirmationModal
        isOpen={cancelModal.open}
        onClose={() => setCancelModal({ open: false, bookingId: '' })}
        onConfirm={handleCancel}
        title="Cancel booking"
        message="Are you sure you want to cancel this booking? The client and the attorney will be notified."
        confirmText="Cancel booking"
        variant="danger"
      />
    </div>
  )
}
