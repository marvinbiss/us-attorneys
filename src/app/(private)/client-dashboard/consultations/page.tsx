'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Calendar, Clock, User, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import ClientSidebar from '@/components/client/ClientSidebar'
import VideoConsultationButton from '@/components/booking/VideoConsultationButton'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { EmptyState } from '@/components/ui/EmptyState'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Booking {
  id: string
  attorney_id: string
  attorney_name: string
  specialty_id: string | null
  specialty_name: string | null
  scheduled_at: string
  duration_minutes: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  daily_room_url: string | null
  booking_fee: number
  client_email: string
  client_name: string
  notes: string | null
  cancellation_reason: string | null
  created_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; classes: string }> = {
    pending: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Confirmed', classes: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Completed', classes: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelled', classes: 'bg-red-100 text-red-700' },
    no_show: { label: 'No Show', classes: 'bg-gray-100 text-gray-700' },
  }
  const meta = map[status] || { label: status, classes: 'bg-gray-100 text-gray-600' }
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.classes}`}
      role="status"
    >
      {meta.label}
    </span>
  )
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return {
    date: d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ClientConsultationsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/bookings/my-bookings')
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login?redirect=/client-dashboard/consultations'
          return
        }
        throw new Error('Failed to load consultations')
      }
      const data = await res.json()
      setBookings(data?.data?.bookings || data?.bookings || [])
    } catch {
      setError('Failed to load consultations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const now = new Date()
  const active = bookings.filter(
    (b) => (b.status === 'confirmed' || b.status === 'pending') && new Date(b.scheduled_at) > now
  )
  const past = bookings.filter(
    (b) =>
      b.status === 'completed' ||
      b.status === 'cancelled' ||
      b.status === 'no_show' ||
      new Date(b.scheduled_at) <= now
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                <Link href="/client-dashboard" className="hover:text-gray-900">
                  Client Dashboard
                </Link>
                <span>/</span>
                <span className="font-medium text-gray-900">Consultations</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">My Video Consultations</h1>
            </div>
            <button
              onClick={fetchBookings}
              className="flex min-h-[44px] min-w-[44px] touch-manipulation items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-4">
          <ClientSidebar activePage="consultations" />

          <ErrorBoundary>
            <div className="space-y-6 lg:col-span-3">
              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Loading */}
              {loading ? (
                <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                  <p className="mt-2 text-sm text-gray-500">Loading consultations...</p>
                </div>
              ) : bookings.length === 0 ? (
                <EmptyState
                  variant="inbox"
                  title="No consultations yet"
                  description="Book a video consultation with an attorney to get started."
                  action={{ label: 'Find an Attorney', href: '/attorneys' }}
                />
              ) : (
                <>
                  {/* Active Consultations */}
                  {active.length > 0 && (
                    <section>
                      <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        Upcoming Consultations
                      </h2>
                      <div className="space-y-3">
                        {active.map((booking) => {
                          const { date, time } = formatDateTime(booking.scheduled_at)
                          return (
                            <div
                              key={booking.id}
                              className="rounded-xl border border-gray-200 bg-white p-5"
                            >
                              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                <div className="min-w-0 flex-1">
                                  <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <h3 className="font-semibold text-gray-900">
                                      {booking.attorney_name}
                                    </h3>
                                    {getStatusBadge(booking.status)}
                                    {booking.specialty_name && (
                                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                        {booking.specialty_name}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                                      {date}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                      {time} ({booking.duration_minutes} min)
                                    </span>
                                  </div>
                                  {booking.notes && (
                                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                                      {booking.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="w-full flex-shrink-0 sm:w-48">
                                  <VideoConsultationButton
                                    bookingId={booking.id}
                                    scheduledAt={booking.scheduled_at}
                                    durationMinutes={booking.duration_minutes}
                                    status={booking.status}
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )}

                  {/* Past Consultations */}
                  {past.length > 0 && (
                    <section>
                      <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        Past Consultations
                      </h2>
                      <div className="space-y-3">
                        {past.map((booking) => {
                          const { date, time } = formatDateTime(booking.scheduled_at)
                          return (
                            <div
                              key={booking.id}
                              className="rounded-xl border border-gray-200 bg-white p-5 opacity-75"
                            >
                              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div className="min-w-0 flex-1">
                                  <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <h3 className="font-medium text-gray-900">
                                      {booking.attorney_name}
                                    </h3>
                                    {getStatusBadge(booking.status)}
                                    {booking.specialty_name && (
                                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                        {booking.specialty_name}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <User className="h-3.5 w-3.5" aria-hidden="true" />
                                      {booking.attorney_name}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                                      {date} at {time}
                                    </span>
                                    <span className="text-gray-400">${booking.booking_fee}</span>
                                  </div>
                                  {booking.cancellation_reason && (
                                    <p className="mt-1 text-sm text-red-600">
                                      Reason: {booking.cancellation_reason}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}
