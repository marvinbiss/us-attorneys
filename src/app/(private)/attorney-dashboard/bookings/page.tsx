'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  User,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  RefreshCw,
} from 'lucide-react'
import AttorneySidebar from '@/components/attorney-dashboard/AttorneySidebar'
import { StatCard } from '@/components/dashboard/StatCard'
import VideoConsultationButton from '@/components/booking/VideoConsultationButton'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { EmptyState } from '@/components/ui/EmptyState'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Booking {
  id: string
  attorney_id: string
  client_id: string | null
  specialty_id: string | null
  scheduled_at: string
  duration_minutes: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  daily_room_url: string | null
  booking_fee: number
  client_email: string
  client_name: string
  client_phone: string | null
  notes: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

interface Stats {
  total: number
  upcoming: number
  completed: number
  revenue: number
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

export default function AttorneyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [attorneyId, setAttorneyId] = useState<string | null>(null)

  // Fetch attorney profile to get attorney_id
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/attorney/profile')
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = '/login?redirect=/attorney-dashboard/bookings'
            return
          }
          throw new Error('Failed to load profile')
        }
        const data = await res.json()
        const id = data?.attorney?.id || data?.data?.attorney?.id || data?.provider?.id || data?.data?.provider?.id
        if (id) setAttorneyId(id)
      } catch {
        setError('Failed to load attorney profile')
      }
    }
    fetchProfile()
  }, [])

  const fetchBookings = useCallback(async () => {
    if (!attorneyId) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings?attorneyId=${attorneyId}`)
      if (!res.ok) throw new Error('Failed to load bookings')
      const data = await res.json()
      setBookings(data?.data?.bookings || data?.bookings || [])
    } catch {
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [attorneyId])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Cancel booking
  async function handleCancel(bookingId: string) {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    setCancellingId(bookingId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by attorney' }),
      })
      if (!res.ok) throw new Error('Failed to cancel')
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' as const } : b))
      )
    } catch {
      alert('Failed to cancel booking. Please try again.')
    } finally {
      setCancellingId(null)
    }
  }

  const now = new Date()
  const upcoming = bookings.filter(
    (b) => (b.status === 'confirmed' || b.status === 'pending') && new Date(b.scheduled_at) > now
  )
  const past = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled' || b.status === 'no_show' || new Date(b.scheduled_at) <= now
  )

  const stats: Stats = {
    total: bookings.length,
    upcoming: upcoming.length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    revenue: bookings
      .filter((b) => b.status === 'completed' || b.status === 'confirmed')
      .reduce((sum, b) => sum + (b.booking_fee || 0), 0),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Link href="/attorney-dashboard/dashboard" className="hover:text-gray-900">Attorney Dashboard</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">Bookings</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Video Consultation Bookings</h1>
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
          <AttorneySidebar activePage="bookings" />

          <ErrorBoundary>
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard title="Total Bookings" value={stats.total} icon={<Calendar className="w-5 h-5" />} color="blue" />
              <StatCard title="Upcoming" value={stats.upcoming} icon={<Clock className="w-5 h-5" />} color="yellow" />
              <StatCard title="Completed" value={stats.completed} icon={<CheckCircle className="w-5 h-5" />} color="green" />
              <StatCard title="Revenue" value={`$${stats.revenue.toFixed(0)}`} icon={<DollarSign className="w-5 h-5" />} color="indigo" />
            </div>

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
                <p className="text-sm text-gray-500 mt-2">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <EmptyState
                variant="inbox"
                title="No bookings yet"
                description="Video consultation bookings will appear here once clients schedule with you."
                action={{ label: 'View Profile', href: '/attorney-dashboard/profile' }}
              />
            ) : (
              <>
                {/* Upcoming Bookings */}
                {upcoming.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Bookings</h2>
                    <div className="space-y-3">
                      {upcoming.map((booking) => {
                        const { date, time } = formatDateTime(booking.scheduled_at)
                        return (
                          <div key={booking.id} className="bg-white rounded-xl border border-gray-200 p-5">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h3 className="font-semibold text-gray-900">{booking.client_name}</h3>
                                  {getStatusBadge(booking.status)}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                                    {booking.client_email}
                                  </span>
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
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <VideoConsultationButton
                                  bookingId={booking.id}
                                  scheduledAt={booking.scheduled_at}
                                  durationMinutes={booking.duration_minutes}
                                  status={booking.status}
                                />
                                <button
                                  onClick={() => handleCancel(booking.id)}
                                  disabled={cancellingId === booking.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 disabled:opacity-50 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" aria-hidden="true" />
                                  {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}

                {/* Past Bookings */}
                {past.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Bookings</h2>
                    <div className="space-y-3">
                      {past.map((booking) => {
                        const { date, time } = formatDateTime(booking.scheduled_at)
                        return (
                          <div key={booking.id} className="bg-white rounded-xl border border-gray-200 p-5 opacity-75">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-medium text-gray-900">{booking.client_name}</h3>
                                  {getStatusBadge(booking.status)}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5" aria-hidden="true" />
                                    {booking.client_email}
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
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}
