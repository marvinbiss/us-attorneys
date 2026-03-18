'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Globe,
  Save,
  Loader2,
  AlertCircle,
  ChevronDown,
  RefreshCw,
  CalendarClock,
  ShieldBan,
  Eye,
} from 'lucide-react'
import AttorneySidebar from '@/components/attorney-dashboard/AttorneySidebar'
import WeeklyScheduleEditor, {
  type DaySchedule,
} from '@/components/attorney-dashboard/WeeklyScheduleEditor'
import BlockedDatesCalendar, {
  type BlockedDate,
  type BookingDate,
} from '@/components/attorney-dashboard/BlockedDatesCalendar'
import UpcomingBookingsPreview from '@/components/attorney-dashboard/UpcomingBookingsPreview'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AvailabilitySlot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
  timezone: string
}

interface UpcomingBooking {
  id: string
  scheduled_at: string
  duration_minutes: number
  status: string
  client_name: string
  client_email: string
}

interface AvailabilityData {
  attorney_id: string
  timezone: string
  availability: AvailabilitySlot[]
  blocked_dates: BlockedDate[]
  upcoming_bookings: UpcomingBooking[]
}

// ─── Timezone Data ───────────────────────────────────────────────────────────

const TIMEZONE_GROUPS: Record<string, string[]> = {
  'US / Canada': [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'America/Phoenix',
    'America/Indiana/Indianapolis',
    'America/Detroit',
    'America/Kentucky/Louisville',
    'America/Boise',
    'America/Juneau',
    'America/Adak',
    'America/Nome',
  ],
  'Other Americas': [
    'America/Toronto',
    'America/Vancouver',
    'America/Mexico_City',
    'America/Bogota',
    'America/Lima',
    'America/Sao_Paulo',
    'America/Argentina/Buenos_Aires',
    'America/Santiago',
  ],
  'Europe': [
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'Europe/Rome',
    'Europe/Amsterdam',
    'Europe/Zurich',
    'Europe/Moscow',
  ],
  'Asia / Pacific': [
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Asia/Singapore',
    'Asia/Hong_Kong',
    'Australia/Sydney',
    'Pacific/Auckland',
  ],
}

function formatTimezone(tz: string): string {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
    })
    const parts = formatter.formatToParts(now)
    const tzName = parts.find(p => p.type === 'timeZoneName')?.value || ''
    const city = tz.split('/').pop()?.replace(/_/g, ' ') || tz
    return `${city} (${tzName})`
  } catch {
    return tz
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateSlotId(): string {
  return `slot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function buildScheduleFromSlots(slots: AvailabilitySlot[]): DaySchedule[] {
  const days: DaySchedule[] = Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i,
    enabled: false,
    slots: [],
  }))

  for (const slot of slots) {
    const day = days[slot.day_of_week]
    day.enabled = true
    day.slots.push({
      id: slot.id || generateSlotId(),
      start_time: slot.start_time.substring(0, 5), // HH:MM from HH:MM:SS
      end_time: slot.end_time.substring(0, 5),
      is_active: slot.is_active,
    })
  }

  return days
}

function scheduleToApiSlots(schedule: DaySchedule[]): Array<{
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}> {
  const slots: Array<{
    day_of_week: number
    start_time: string
    end_time: string
    is_active: boolean
  }> = []

  for (const day of schedule) {
    if (!day.enabled) continue
    for (const slot of day.slots) {
      slots.push({
        day_of_week: day.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_active: slot.is_active,
      })
    }
  }

  return slots
}

// ─── Active Tab ─────────────────────────────────────────────────────────────

type Tab = 'schedule' | 'blocked' | 'preview'

// ─── Page Component ─────────────────────────────────────────────────────────

export default function AttorneyAvailabilityPage() {
  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('schedule')

  // Data
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i,
      enabled: false,
      slots: [],
    }))
  )
  const [timezone, setTimezone] = useState('America/New_York')
  const [slotDuration, setSlotDuration] = useState<30 | 60>(30)
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Timezone selector
  const [tzOpen, setTzOpen] = useState(false)

  // Toast
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast()

  // ─── Data Fetching ──────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/attorney/availability')
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login?redirect=/attorney-dashboard/availability'
          return
        }
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message || 'Failed to load availability')
      }

      const { data }: { data: AvailabilityData } = await res.json()

      setTimezone(data.timezone || 'America/New_York')
      setSchedule(buildScheduleFromSlots(data.availability))
      setBlockedDates(data.blocked_dates)
      setUpcomingBookings(data.upcoming_bookings)
      setHasUnsavedChanges(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─── Save Schedule ──────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true)

    // Optimistic: show success immediately
    const previousSchedule = [...schedule]
    const previousTimezone = timezone

    try {
      const slots = scheduleToApiSlots(schedule)

      const res = await fetch('/api/attorney/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timezone,
          slot_duration: slotDuration,
          slots,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message || 'Failed to save schedule')
      }

      setHasUnsavedChanges(false)
      toastSuccess('Schedule saved', 'Your availability has been updated successfully.')
    } catch (err: unknown) {
      // Rollback on error
      setSchedule(previousSchedule)
      setTimezone(previousTimezone)
      const message = err instanceof Error ? err.message : 'Failed to save'
      toastError('Save failed', message)
    } finally {
      setSaving(false)
    }
  }

  // ─── Block/Unblock Dates ───────────────────────────────────────────────

  const handleBlockDates = async (dates: string[]) => {
    // Optimistic update
    const newBlocked = dates.map(d => ({ blocked_date: d, reason: null }))
    setBlockedDates(prev => [...prev, ...newBlocked])

    try {
      const res = await fetch('/api/attorney/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates }),
      })

      if (!res.ok) {
        // Rollback
        setBlockedDates(prev => prev.filter(b => !dates.includes(b.blocked_date)))
        const body = await res.json().catch(() => ({}))
        toastError('Error', body?.error?.message || 'Failed to block dates')
        return
      }

      toastSuccess('Dates blocked', `${dates.length} date(s) blocked successfully.`)
    } catch {
      // Rollback
      setBlockedDates(prev => prev.filter(b => !dates.includes(b.blocked_date)))
      toastError('Error', 'Connection error')
    }
  }

  const handleUnblockDates = async (dates: string[]) => {
    // Optimistic update
    const dateSet = new Set(dates)
    const previousBlocked = [...blockedDates]
    setBlockedDates(prev => prev.filter(b => !dateSet.has(b.blocked_date)))

    try {
      const res = await fetch('/api/attorney/availability', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates }),
      })

      if (!res.ok) {
        // Rollback
        setBlockedDates(previousBlocked)
        const body = await res.json().catch(() => ({}))
        toastError('Error', body?.error?.message || 'Failed to unblock dates')
        return
      }

      toastSuccess('Dates unblocked', `${dates.length} date(s) unblocked successfully.`)
    } catch {
      // Rollback
      setBlockedDates(previousBlocked)
      toastError('Error', 'Connection error')
    }
  }

  // ─── Schedule Change Tracking ──────────────────────────────────────────

  const handleScheduleChange = useCallback((newSchedule: DaySchedule[]) => {
    setSchedule(newSchedule)
    setHasUnsavedChanges(true)
  }, [])

  const handleTimezoneChange = useCallback((tz: string) => {
    setTimezone(tz)
    setTzOpen(false)
    setHasUnsavedChanges(true)
  }, [])

  const handleSlotDurationChange = useCallback((d: 30 | 60) => {
    setSlotDuration(d)
    setHasUnsavedChanges(true)
  }, [])

  // ─── Validation ────────────────────────────────────────────────────────

  const hasValidationErrors = useMemo(() => {
    return schedule.some(day => {
      if (!day.enabled) return false
      // Check end > start
      for (const slot of day.slots) {
        const [sh, sm] = slot.start_time.split(':').map(Number)
        const [eh, em] = slot.end_time.split(':').map(Number)
        if (eh * 60 + em <= sh * 60 + sm) return true
      }
      // Check overlap
      const activeSlots = day.slots.filter(s => s.is_active)
      for (let i = 0; i < activeSlots.length; i++) {
        for (let j = i + 1; j < activeSlots.length; j++) {
          const [as, ae] = [activeSlots[i].start_time, activeSlots[i].end_time].map(t => {
            const [h, m] = t.split(':').map(Number)
            return h * 60 + m
          })
          const [bs, be] = [activeSlots[j].start_time, activeSlots[j].end_time].map(t => {
            const [h, m] = t.split(':').map(Number)
            return h * 60 + m
          })
          if (as < be && ae > bs) return true
        }
      }
      return false
    })
  }, [schedule])

  // Bookings as BookingDate format for calendar
  const calendarBookings: BookingDate[] = useMemo(
    () => upcomingBookings.map(b => ({
      id: b.id,
      scheduled_at: b.scheduled_at,
      client_name: b.client_name,
      status: b.status,
    })),
    [upcomingBookings]
  )

  // ─── Render ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">Loading availability...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tabs: { key: Tab; label: string; icon: typeof CalendarClock }[] = [
    { key: 'schedule', label: 'Weekly Schedule', icon: CalendarClock },
    { key: 'blocked', label: 'Blocked Dates', icon: ShieldBan },
    { key: 'preview', label: 'Upcoming (7 days)', icon: Eye },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <Link href="/attorney-dashboard/dashboard" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                  Attorney Dashboard
                </Link>
                <span>/</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">Availability</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Calendar className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                Availability Management
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Set your weekly schedule, block dates, and manage your calendar.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>

              {hasUnsavedChanges && (
                <button
                  onClick={handleSave}
                  disabled={saving || hasValidationErrors}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Schedule
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <AttorneySidebar activePage="availability" />

          <div className="lg:col-span-3 space-y-6">
            {/* Error banner */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                <button
                  onClick={fetchData}
                  className="ml-auto text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Unsaved changes banner */}
            {hasUnsavedChanges && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-amber-700 dark:text-amber-400 text-sm flex-1">
                  You have unsaved changes to your weekly schedule.
                </p>
                <button
                  onClick={handleSave}
                  disabled={saving || hasValidationErrors}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Save
                </button>
              </div>
            )}

            {/* Timezone selector */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Timezone:
                  </label>
                </div>
                <div className="relative flex-1 max-w-md">
                  <button
                    type="button"
                    onClick={() => setTzOpen(!tzOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <span>{formatTimezone(timezone)}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${tzOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {tzOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                      {Object.entries(TIMEZONE_GROUPS).map(([group, zones]) => (
                        <div key={group}>
                          <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                            {group}
                          </p>
                          {zones.map(tz => (
                            <button
                              key={tz}
                              type="button"
                              onClick={() => handleTimezoneChange(tz)}
                              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                tz === timezone
                                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              {formatTimezone(tz)}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              {activeTab === 'schedule' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <CalendarClock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Weekly Schedule
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Set your recurring availability for each day of the week.
                      </p>
                    </div>

                    {hasUnsavedChanges && (
                      <button
                        onClick={handleSave}
                        disabled={saving || hasValidationErrors}
                        className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save
                      </button>
                    )}
                  </div>

                  <WeeklyScheduleEditor
                    schedule={schedule}
                    onChange={handleScheduleChange}
                    slotDuration={slotDuration}
                    onSlotDurationChange={handleSlotDurationChange}
                  />

                  {/* Save button (mobile) */}
                  {hasUnsavedChanges && (
                    <div className="mt-6 sm:hidden">
                      <button
                        onClick={handleSave}
                        disabled={saving || hasValidationErrors}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Schedule
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'blocked' && (
                <div>
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <ShieldBan className="w-5 h-5 text-red-500" />
                      Blocked Dates
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      Block specific dates for vacations, holidays, or personal time. Click or drag to select.
                    </p>
                  </div>

                  <BlockedDatesCalendar
                    blockedDates={blockedDates}
                    bookings={calendarBookings}
                    onBlockDates={handleBlockDates}
                    onUnblockDates={handleUnblockDates}
                  />
                </div>
              )}

              {activeTab === 'preview' && (
                <div>
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Upcoming 7 Days
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      Preview your availability and bookings for the next week.
                    </p>
                  </div>

                  <UpcomingBookingsPreview
                    bookings={upcomingBookings}
                    blockedDates={blockedDates.map(d => d.blocked_date)}
                    availabilitySlots={schedule.flatMap(day =>
                      day.enabled
                        ? day.slots.map(s => ({
                            day_of_week: day.day_of_week,
                            start_time: s.start_time,
                            end_time: s.end_time,
                            is_active: s.is_active,
                          }))
                        : []
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  )
}
