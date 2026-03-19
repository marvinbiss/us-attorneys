'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  X,
  Check,
  AlertCircle,
  Settings,
  FileText,
  MessageSquare,
  Star,
  Euro,
  TrendingUp,
  Users,
  Loader2,
  ExternalLink,
  Search,
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { QuickSiteLinks } from '@/components/InternalLinks'
import LogoutButton from '@/components/LogoutButton'
import { getAttorneyUrl } from '@/lib/utils'

// Types
interface TimeSlot {
  id: string
  start: string
  end: string
  available: boolean
  booking?: {
    id: string
    clientName: string
    service: string
    phone?: string
    email?: string
    status: string
  }
}

interface DaySchedule {
  date: string
  slots: TimeSlot[]
}

interface BookingEntry {
  id: string
  client_name: string
  service_description: string
  status: string
  slot?: {
    date: string
    start_time: string
    end_time: string
  }
}

interface UserProfile {
  id: string
  full_name: string
  subscription_plan: 'free' | 'pro' | 'premium'
}

interface ProviderInfo {
  stable_id: string | null
  slug: string | null
  specialty: string | null
  address_city: string | null
}

// Format date as local YYYY-MM-DD (avoids UTC timezone shift)
const formatDateLocal = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Generate days of the month
function getDaysInMonth(year: number, month: number) {
  const date = new Date(year, month, 1)
  const days = []
  while (date.getMonth() === month) {
    days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  return days
}

// Default time slots
const defaultSlots = [
  { start: '08:00', end: '10:00' },
  { start: '10:00', end: '12:00' },
  { start: '14:00', end: '16:00' },
  { start: '16:00', end: '18:00' },
]

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showSlotModal, setShowSlotModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [schedule, setSchedule] = useState<DaySchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [provider, setProvider] = useState<ProviderInfo | null>(null)
  const [upcomingBookings, setUpcomingBookings] = useState<BookingEntry[]>([])
  const [stats, setStats] = useState({ monthlyBookings: 0, fillRate: 0, avgRating: 0 })

  // New slot form state
  const [newSlotStart, setNewSlotStart] = useState('08:00')
  const [newSlotEnd, setNewSlotEnd] = useState('10:00')
  const [repeatWeekly, setRepeatWeekly] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsReminders: true,
    serviceRadius: 'Local area (20 miles)',
  })

  const [settingsSaved, setSettingsSaved] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('calendar-settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        setSettings((prev) => ({ ...prev, ...parsed }))
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  // Fetch user profile and subscription via API routes
  useEffect(() => {
    async function fetchProfile() {
      try {
        const [subRes, statsRes] = await Promise.all([
          fetch('/api/attorney/subscription'),
          fetch('/api/attorney/stats'),
        ])

        if (!subRes.ok || !statsRes.ok) {
          setIsLoading(false)
          return
        }

        const subData = await subRes.json()
        const statsData = await statsRes.json()

        const plan: 'free' | 'pro' | 'premium' = subData.plan ?? 'free'

        if (statsData?.profile) {
          setProfile({
            id: statsData.profile.id,
            full_name: statsData.profile.full_name ?? '',
            subscription_plan: plan,
          })
        }

        if (statsData?.provider) {
          setProvider({
            stable_id: statsData.provider?.stable_id ?? null,
            slug: statsData.provider?.slug ?? null,
            specialty: statsData.provider?.specialty ?? null,
            address_city: statsData.provider?.address_city ?? null,
          })
        }
      } catch (err: unknown) {
        logger.error('Error fetching profile', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [])

  // Fetch schedule for the current month
  const fetchSchedule = useCallback(
    async (year: number, month: number) => {
      if (!profile) return

      setIsLoadingSlots(true)
      setError(null)

      try {
        const startDate = new Date(year, month, 1)
        const endDate = new Date(year, month + 1, 0)

        const response = await fetch(
          `/api/availability?attorneyId=${profile.id}&startDate=${formatDateLocal(startDate)}&endDate=${formatDateLocal(endDate)}`
        )

        if (!response.ok) {
          throw new Error('Error loading calendar')
        }

        const data = await response.json()

        // Transform API data to DaySchedule format
        const scheduleByDate: Record<string, TimeSlot[]> = {}

        if (data.slots) {
          for (const slot of data.slots) {
            if (!scheduleByDate[slot.date]) {
              scheduleByDate[slot.date] = []
            }
            scheduleByDate[slot.date].push({
              id: slot.id,
              start: slot.start_time,
              end: slot.end_time,
              available: slot.is_available,
              booking: slot.booking
                ? {
                    id: slot.booking.id,
                    clientName: slot.booking.client_name,
                    service: slot.booking.service_description,
                    phone: slot.booking.client_phone,
                    email: slot.booking.client_email,
                    status: slot.booking.status,
                  }
                : undefined,
            })
          }
        }

        const scheduleArray: DaySchedule[] = Object.entries(scheduleByDate).map(
          ([date, slots]) => ({
            date,
            slots: slots.sort((a, b) => a.start.localeCompare(b.start)),
          })
        )

        setSchedule(scheduleArray)
      } catch (err: unknown) {
        logger.error('Error fetching schedule', err)
        setError('Unable to load calendar')
      } finally {
        setIsLoadingSlots(false)
      }
    },
    [profile]
  )

  // Fetch upcoming bookings
  const fetchUpcomingBookings = useCallback(async () => {
    if (!profile) return

    try {
      const response = await fetch(`/api/bookings?attorneyId=${profile.id}`)
      const data = await response.json()

      if (data.bookings) {
        const upcoming = data.bookings
          .filter(
            (b: BookingEntry) =>
              b.status === 'confirmed' && new Date(b.slot?.date ?? 0) >= new Date()
          )
          .slice(0, 5)
        setUpcomingBookings(upcoming)

        // Calculate stats
        const thisMonth = new Date().getMonth()
        const thisYear = new Date().getFullYear()
        const monthlyBookings = data.bookings.filter((b: BookingEntry) => {
          const bookingDate = new Date(b.slot?.date ?? 0)
          return bookingDate.getMonth() === thisMonth && bookingDate.getFullYear() === thisYear
        }).length

        setStats((prev) => ({ ...prev, monthlyBookings }))
      }
    } catch (err: unknown) {
      logger.error('Error fetching bookings', err)
    }
  }, [profile])

  // Load data when profile is available
  useEffect(() => {
    if (profile) {
      fetchSchedule(currentDate.getFullYear(), currentDate.getMonth())
      fetchUpcomingBookings()
    }
  }, [profile, currentDate, fetchSchedule, fetchUpcomingBookings])

  // Add new slot
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !selectedDate) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attorneyId: profile.id,
          date: formatDateLocal(selectedDate),
          startTime: newSlotStart,
          endTime: newSlotEnd,
          repeatWeekly,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error adding time slot')
      }

      // Refresh schedule
      await fetchSchedule(currentDate.getFullYear(), currentDate.getMonth())
      setShowSlotModal(false)
      setNewSlotStart('08:00')
      setNewSlotEnd('10:00')
      setRepeatWeekly(false)
    } catch (err: unknown) {
      logger.error('Error adding slot', err)
      setError(err instanceof Error ? err.message : 'Error adding slot')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete slot
  const handleDeleteSlot = async (slotId: string) => {
    if (!profile) return

    try {
      const response = await fetch(`/api/availability?slotId=${slotId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error deleting slot')
      }

      // Refresh schedule
      await fetchSchedule(currentDate.getFullYear(), currentDate.getMonth())
    } catch (err: unknown) {
      logger.error('Error deleting slot', err)
      setError(err instanceof Error ? err.message : 'Error deleting slot')
    }
  }

  // Save settings
  // TODO: Persist to API when endpoint is available
  const handleSaveSettings = async () => {
    if (!profile) return

    setIsSaving(true)
    try {
      // Save to localStorage as temporary persistence
      const settingsToSave = {
        emailNotifications: settings.emailNotifications,
        smsReminders: settings.smsReminders,
        serviceRadius: settings.serviceRadius,
      }
      localStorage.setItem('calendar-settings', JSON.stringify(settingsToSave))

      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 3000)
      setShowSettingsModal(false)
    } catch (err: unknown) {
      logger.error('Error saving settings', err)
      setError(err instanceof Error ? err.message : 'Error saving settings')
    } finally {
      setIsSaving(false)
    }
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const days = getDaysInMonth(year, month)
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getScheduleForDate = (date: Date) => {
    const dateStr = formatDateLocal(date)
    return schedule.find((s) => s.date === dateStr)
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPast = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: 'Attorney Dashboard', href: '/attorney-dashboard' },
              { label: 'Calendar' },
            ]}
          />
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Attorney Dashboard</h1>
              <p className="text-blue-100">{profile?.full_name}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="rounded-full bg-yellow-500 px-3 py-1 text-sm font-medium capitalize text-white">
                {profile?.subscription_plan}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1 rounded-xl bg-white p-4 shadow-sm">
              <Link
                href="/attorney-dashboard/dashboard"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-50"
              >
                <TrendingUp className="h-5 w-5" />
                Dashboard
              </Link>
              <Link
                href="/attorney-dashboard/calendar"
                className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 font-medium text-blue-600"
              >
                <Calendar className="h-5 w-5" />
                Calendar
              </Link>
              <Link
                href="/attorney-dashboard/received-cases"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-50"
              >
                <FileText className="h-5 w-5" />
                Cases
              </Link>
              <Link
                href="/attorney-dashboard/messages"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-50"
              >
                <MessageSquare className="h-5 w-5" />
                Messages
              </Link>
              <Link
                href="/attorney-dashboard/reviews-received"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-50"
              >
                <Star className="h-5 w-5" />
                Reviews
              </Link>
              <Link
                href="/attorney-dashboard/profile"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-5 w-5" />
                My Profile
              </Link>
              <Link
                href="/attorney-dashboard/subscription"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-50"
              >
                <Euro className="h-5 w-5" />
                My Account
              </Link>
              <LogoutButton />
            </nav>

            {/* View public profile */}
            {provider && (
              <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
                <Link
                  href={getAttorneyUrl({
                    stable_id: provider.stable_id,
                    slug: provider.slug,
                    specialty: provider.specialty,
                    city: provider.address_city,
                  })}
                  className="flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  View my public profile
                </Link>
              </div>
            )}

            {/* Quick links */}
            <div className="mt-4">
              <QuickSiteLinks />
            </div>

            {/* Additional links */}
            <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
              <h4 className="mb-3 font-medium text-gray-900">Useful Links</h4>
              <div className="space-y-2 text-sm">
                <Link
                  href="/services"
                  className="flex items-center gap-2 py-1 text-gray-600 hover:text-blue-600"
                >
                  <Search className="h-4 w-4" />
                  Browse Services
                </Link>
                <Link
                  href="/search"
                  className="flex items-center gap-2 py-1 text-gray-600 hover:text-blue-600"
                >
                  <Search className="h-4 w-4" />
                  Find an Attorney
                </Link>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="space-y-6 lg:col-span-3">
            {/* Settings saved toast */}
            {settingsSaved && (
              <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
                <p className="text-sm font-medium text-green-700">Settings saved successfully</p>
              </div>
            )}

            {/* Calendar Header */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-gray-900">My Calendar</h2>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                    Online booking enabled
                  </span>
                </div>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </button>
              </div>

              {/* Month navigation */}
              <div className="mb-6 flex items-center justify-between">
                <button onClick={previousMonth} className="rounded-lg p-2 hover:bg-gray-100">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">
                  {monthNames[month]} {year}
                </h3>
                <button onClick={nextMonth} className="rounded-lg p-2 hover:bg-gray-100">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Slots loading indicator */}
              {isLoadingSlots && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-gray-500">Loading time slots...</span>
                </div>
              )}

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-px sm:gap-1">
                {/* Day headers */}
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="py-1 text-center text-xs font-medium text-gray-500 sm:py-2 sm:text-sm"
                  >
                    {day}
                  </div>
                ))}

                {/* Empty cells for days before the first of the month */}
                {Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }).map(
                  (_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  )
                )}

                {/* Days of the month */}
                {days.map((date) => {
                  const daySchedule = getScheduleForDate(date)
                  const hasBookings = daySchedule?.slots.some((s) => !s.available)
                  const hasAvailable = daySchedule?.slots.some((s) => s.available)
                  const past = isPast(date)

                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => !past && setSelectedDate(date)}
                      disabled={past}
                      className={`aspect-square rounded-lg border-2 p-1 transition-all ${
                        selectedDate?.toDateString() === date.toDateString()
                          ? 'border-blue-500 bg-blue-50'
                          : isToday(date)
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-transparent hover:bg-gray-50'
                      } ${past ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                    >
                      <div
                        className={`text-sm font-medium ${
                          isToday(date) ? 'text-blue-600' : 'text-gray-900'
                        }`}
                      >
                        {date.getDate()}
                      </div>
                      {!past && (
                        <div className="mt-1 flex justify-center gap-0.5">
                          {hasBookings && (
                            <div
                              className="h-1.5 w-1.5 rounded-full bg-red-500"
                              title="Confirmed appointments"
                            />
                          )}
                          {hasAvailable && (
                            <div
                              className="h-1.5 w-1.5 rounded-full bg-green-500"
                              title="Available slots"
                            />
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4 text-sm sm:gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-gray-600">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-gray-600">Booked</span>
                </div>
              </div>
            </div>

            {/* Selected Day Detail */}
            {selectedDate && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h3>
                  <button
                    onClick={() => setShowSlotModal(true)}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Time Slot
                  </button>
                </div>

                <div className="space-y-3">
                  {(
                    getScheduleForDate(selectedDate)?.slots ||
                    defaultSlots.map((s, i) => ({
                      id: `default-${i}`,
                      ...s,
                      available: true as const,
                      booking: undefined,
                    }))
                  ).map((slot) => (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between rounded-lg border-2 p-4 ${
                        slot.available
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Clock
                          className={`h-5 w-5 ${slot.available ? 'text-green-600' : 'text-gray-400'}`}
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {slot.start} - {slot.end}
                          </div>
                          {'booking' in slot && slot.booking && (
                            <div className="mt-1 text-sm text-gray-500">
                              <span className="font-medium">{slot.booking.clientName}</span>
                              {' - '}
                              {slot.booking.service}
                              {slot.booking.phone && (
                                <span className="ml-2 text-blue-600">{slot.booking.phone}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {slot.available ? (
                          <>
                            <span className="text-sm font-medium text-green-600">Available</span>
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                              title="Delete this slot"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                              Booked
                            </span>
                            <button className="rounded-lg p-2 text-gray-400 hover:text-gray-600">
                              <Users className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming bookings */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
              <div className="space-y-3">
                {upcomingBookings.length === 0 ? (
                  <p className="py-4 text-center text-gray-500">No upcoming appointments</p>
                ) : (
                  upcomingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                          <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{booking.client_name}</div>
                          <div className="text-sm text-gray-500">{booking.service_description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {booking.slot?.date &&
                            new Date(booking.slot.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.slot?.start_time} - {booking.slot?.end_time}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <div className="rounded-xl bg-white p-4 text-center shadow-sm sm:p-6">
                <div className="text-2xl font-bold text-blue-600 sm:text-3xl">
                  {stats.monthlyBookings}
                </div>
                <div className="text-sm text-gray-500">Bookings this month</div>
              </div>
              <div className="rounded-xl bg-white p-4 text-center shadow-sm sm:p-6">
                <div className="text-2xl font-bold text-green-600 sm:text-3xl">
                  {stats.fillRate}%
                </div>
                <div className="text-sm text-gray-500">Fill rate</div>
              </div>
              <div className="rounded-xl bg-white p-4 text-center shadow-sm sm:p-6">
                <div className="text-2xl font-bold text-yellow-600 sm:text-3xl">
                  {stats.avgRating || '-'}
                </div>
                <div className="text-sm text-gray-500">Average rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add Time Slot</h3>
              <button
                onClick={() => setShowSlotModal(false)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <form onSubmit={handleAddSlot} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="time"
                    value={newSlotStart}
                    onChange={(e) => setNewSlotStart(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="time"
                    value={newSlotEnd}
                    onChange={(e) => setNewSlotEnd(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={repeatWeekly}
                    onChange={(e) => setRepeatWeekly(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Repeat weekly (4 weeks)</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSlotModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-[95vw] rounded-xl bg-white p-6 sm:max-w-lg">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Calendar Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="mb-3 font-medium text-gray-900">Default Slots</h4>
                <div className="space-y-2">
                  {defaultSlots.map((slot, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2"
                    >
                      <span className="text-gray-700">
                        {slot.start} - {slot.end}
                      </span>
                      <button className="text-red-500 hover:text-red-700">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-3 font-medium text-gray-900">Notifications</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Email for new bookings</span>
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) =>
                        setSettings({ ...settings, emailNotifications: e.target.checked })
                      }
                      className="rounded border-gray-300"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">SMS reminder (1 day before)</span>
                    <input
                      type="checkbox"
                      checked={settings.smsReminders}
                      onChange={(e) => setSettings({ ...settings, smsReminders: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                  </label>
                  <div className="flex items-center justify-between opacity-60">
                    <span className="text-gray-500">Google Calendar Sync — Coming Soon</span>
                    <input
                      type="checkbox"
                      checked={false}
                      disabled
                      className="cursor-not-allowed rounded border-gray-300"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="mb-3 font-medium text-gray-900">Service Area</h4>
                <input
                  type="text"
                  placeholder="E.g.: Local area (20 miles)"
                  value={settings.serviceRadius}
                  onChange={(e) => setSettings({ ...settings, serviceRadius: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
