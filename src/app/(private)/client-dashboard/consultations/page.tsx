'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Video,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import ClientSidebar from '@/components/client/ClientSidebar'
import VideoConsultationButton from '@/components/booking/VideoConsultationButton'

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
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.classes}`} role="status">
      {meta.label}
    </span>
  )
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return {
    date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
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
    (b) => b.status === 'completed' || b.status === 'cancelled' || b.status === 'no_show' || new Date(b.scheduled_at) <= now
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Link href="/client-dashboard" className="hover:text-gray-900">Client Dashboard</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">Consultations</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">My Video Consultations</h1>
            </div>
            <button
              onClick={fetchBookings}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <ClientSidebar activePage="consultations" />

          <div className="lg:col-span-3 space-y-6">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-sm text-gray-500 mt-2">Loading consultations...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-lg">No consultations yet</p>
                <p className="text-gray-400 text-sm mt-2">
                  Book a video consultation with an attorney to get started.
                </p>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Find an Attorney
                </Link>
              </div>
            ) : (
              <>
                {/* Active Consultations */}
                {active.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Consultations</h2>
                    <div className="space-y-3">
                      {active.map((booking) => {
                        const { date, time } = formatDateTime(booking.scheduled_at)
                        return (
                          <div key={booking.id} className="bg-white rounded-xl border border-gray-200 p-5">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h3 className="font-semibold text-gray-900">{booking.attorney_name}</h3>
                                  {getStatusBadge(booking.status)}
                                  {booking.specialty_name && (
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 font-medium">
                                      {booking.specialty_name}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                                    {date}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                                    {time} ({booking.duration_minutes} min)
                                  </span>
                                </div>
                                {booking.notes && (
                                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{booking.notes}</p>
                                )}
                              </div>
                              <div className="flex-shrink-0 w-full sm:w-48">
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
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Consultations</h2>
                    <div className="space-y-3">
                      {past.map((booking) => {
                        const { date, time } = formatDateTime(booking.scheduled_at)
                        return (
                          <div key={booking.id} className="bg-white rounded-xl border border-gray-200 p-5 opacity-75">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-medium text-gray-900">{booking.attorney_name}</h3>
                                  {getStatusBadge(booking.status)}
                                  {booking.specialty_name && (
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 font-medium">
                                      {booking.specialty_name}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5" aria-hidden="true" />
                                    {booking.attorney_name}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                                    {date} at {time}
                                  </span>
                                  <span className="text-gray-400">${booking.booking_fee}</span>
                                </div>
                                {booking.cancellation_reason && (
                                  <p className="text-sm text-red-600 mt-1">Reason: {booking.cancellation_reason}</p>
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
        </div>
      </div>
    </div>
  )
}
