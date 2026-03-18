/**
 * Availability Helpers - US Attorneys
 *
 * Server-side utilities for computing attorney availability slots.
 * Used by:
 *   - /api/attorneys/[id]/availability (calendar widget)
 *   - Inline "Next available" badges on search results
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { getCachedData } from '@/lib/cache'
import { logger } from '@/lib/logger'

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

/**
 * Availability slot info returned by the availability helpers.
 * `null` means no availability data (attorney has no online booking set up).
 */
export interface AvailabilitySlot {
  /** ISO date string YYYY-MM-DD in attorney's local timezone */
  date: string
  /** Display time e.g. "2:00 PM" in attorney's local timezone */
  time: string
  /** Full ISO datetime (UTC) for sorting / further logic */
  datetimeUtc: string
  /** Whether the slot is today in the attorney's timezone */
  isToday: boolean
  /** Whether the slot is tomorrow in the attorney's timezone */
  isTomorrow: boolean
  /** Attorney's IANA timezone */
  timezone: string
}

/** Calendar slot returned by getAvailableSlots (used by calendar widget API) */
export interface CalendarSlot {
  date: string
  time: string
  datetime: string
  duration: number
  available: boolean
}

/** Full availability result for the calendar API */
export interface AvailabilityResult {
  attorney_id: string
  timezone: string
  slots: CalendarSlot[]
  next_available: string | null
  generated_at: string
}

interface AvailabilityRow {
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
  timezone: string
}

interface BlockedRow {
  blocked_date: string
}

interface BookingRow {
  scheduled_at: string
  duration_minutes: number
  status: string
}

// ── Time Utilities ─────────────────────────────────────────────────────────

/** Parse "HH:MM:SS" or "HH:MM" into total minutes since midnight */
function timeToMinutes(time: string): number {
  const parts = time.split(':')
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
}

/** Format minutes since midnight to "HH:MM" */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Format a date + time + timezone into an ISO-like datetime string with offset */
function formatDatetimeWithOffset(dateStr: string, timeStr: string, timezone: string): string {
  const dtStr = `${dateStr}T${timeStr}:00`
  try {
    const dt = new Date(dtStr)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    })
    const parts = formatter.formatToParts(dt)
    const tzPart = parts.find((p) => p.type === 'timeZoneName')
    const offsetStr = tzPart?.value || ''
    const match = offsetStr.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
    if (match) {
      const sign = match[1]
      const hours = match[2].padStart(2, '0')
      const mins = match[3] || '00'
      return `${dateStr}T${timeStr}:00${sign}${hours}:${mins}`
    }
    return `${dateStr}T${timeStr}:00`
  } catch {
    return `${dateStr}T${timeStr}:00`
  }
}

/** Format YYYY-MM-DD from a Date */
function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ── Calendar Slot Generation (used by /api/attorneys/[id]/availability) ────

/**
 * Computes available time slots for an attorney over a date range.
 *
 * Logic:
 * 1. Load weekly recurring schedule from `attorney_availability`
 * 2. Subtract blocked dates from `attorney_bookings_blocked`
 * 3. Subtract confirmed/pending bookings from `bookings`
 * 4. Generate granular slots at the requested duration (30 or 60 min)
 *
 * Cached for 5 minutes (slots change with new bookings).
 */
export async function getAvailableSlots(
  attorneyId: string,
  startDate: Date,
  endDate: Date,
  duration: 30 | 60 = 30
): Promise<AvailabilityResult> {
  const startStr = toDateStr(startDate)
  const endStr = toDateStr(endDate)
  const cacheKey = `avail:${attorneyId}:${startStr}:${endStr}:${duration}`

  return getCachedData(cacheKey, async () => {
    const supabase = createAdminClient()

    // 1. Fetch weekly availability schedule
    const { data: availability, error: availError } = await supabase
      .from('attorney_availability')
      .select('day_of_week, start_time, end_time, is_active, timezone')
      .eq('attorney_id', attorneyId)
      .eq('is_active', true)

    if (availError) {
      logger.error('Error fetching availability', availError)
      return emptyCalendarResult(attorneyId)
    }

    const rows = (availability || []) as AvailabilityRow[]
    const timezone = rows[0]?.timezone || 'America/New_York'

    if (rows.length === 0) {
      return emptyCalendarResult(attorneyId, timezone)
    }

    // Build day_of_week -> windows map
    const availByDay = new Map<number, AvailabilityRow[]>()
    for (const row of rows) {
      const existing = availByDay.get(row.day_of_week) || []
      existing.push(row)
      availByDay.set(row.day_of_week, existing)
    }

    // 2. Fetch blocked dates in range
    const { data: blockedRows } = await supabase
      .from('attorney_bookings_blocked')
      .select('blocked_date')
      .eq('attorney_id', attorneyId)
      .gte('blocked_date', startStr)
      .lte('blocked_date', endStr)

    const blockedDates = new Set(
      ((blockedRows || []) as BlockedRow[]).map((b) => b.blocked_date)
    )

    // 3. Fetch existing bookings (non-cancelled) in range
    const rangeStart = `${startStr}T00:00:00`
    const rangeEnd = `${endStr}T23:59:59`

    const { data: bookings } = await supabase
      .from('bookings')
      .select('scheduled_at, duration_minutes, status')
      .eq('attorney_id', attorneyId)
      .neq('status', 'cancelled')
      .gte('scheduled_at', rangeStart)
      .lte('scheduled_at', rangeEnd)

    const bookingRows = (bookings || []) as BookingRow[]

    // Index bookings by date for fast lookup
    const bookingsByDate = new Map<string, BookingRow[]>()
    for (const b of bookingRows) {
      const bDate = b.scheduled_at.split('T')[0]
      const existing = bookingsByDate.get(bDate) || []
      existing.push(b)
      bookingsByDate.set(bDate, existing)
    }

    // 4. Generate slots for each day in range
    const calendarSlots: CalendarSlot[] = []
    let nextAvailable: string | null = null
    const now = new Date()

    const current = new Date(startDate)
    const end = new Date(endDate)

    while (current <= end) {
      const dateStr = toDateStr(current)
      const dayOfWeek = current.getDay() // 0=Sunday

      const dayAvail = availByDay.get(dayOfWeek)
      if (dayAvail && !blockedDates.has(dateStr)) {
        const dayBookings = bookingsByDate.get(dateStr) || []

        for (const win of dayAvail) {
          const windowStart = timeToMinutes(win.start_time)
          const windowEnd = timeToMinutes(win.end_time)

          for (let slotStart = windowStart; slotStart + duration <= windowEnd; slotStart += duration) {
            const slotEnd = slotStart + duration
            const timeStr = minutesToTime(slotStart)

            // Skip past slots (today only)
            if (toDateStr(now) === dateStr) {
              const nowMinutes = now.getHours() * 60 + now.getMinutes()
              if (slotStart <= nowMinutes) continue
            }

            // Check overlap with existing bookings
            const isBooked = dayBookings.some((b) => {
              const bookingDateLocal = new Date(b.scheduled_at)
              const localTimeStr = bookingDateLocal.toLocaleTimeString('en-US', {
                timeZone: timezone,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
              })
              const bookingStartMin = timeToMinutes(localTimeStr)
              const bookingEndMin = bookingStartMin + (b.duration_minutes || 30)
              return slotStart < bookingEndMin && slotEnd > bookingStartMin
            })

            const available = !isBooked

            if (available && !nextAvailable) {
              nextAvailable = formatDatetimeWithOffset(dateStr, timeStr, timezone)
            }

            calendarSlots.push({
              date: dateStr,
              time: timeStr,
              datetime: formatDatetimeWithOffset(dateStr, timeStr, timezone),
              duration,
              available,
            })
          }
        }
      }

      current.setDate(current.getDate() + 1)
    }

    return {
      attorney_id: attorneyId,
      timezone,
      slots: calendarSlots,
      next_available: nextAvailable,
      generated_at: new Date().toISOString(),
    }
  }, 300) // 5 min cache
}

function emptyCalendarResult(attorneyId: string, timezone = 'America/New_York'): AvailabilityResult {
  return {
    attorney_id: attorneyId,
    timezone,
    slots: [],
    next_available: null,
    generated_at: new Date().toISOString(),
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Get the current date parts in a given IANA timezone.
 */
function getDateInTz(tz: string, refDate: Date = new Date()): { year: number; month: number; day: number; weekday: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(refDate)

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
    weekday: weekdayMap[get('weekday')] ?? 0,
  }
}

/**
 * Format a Date to "h:mm A" in a given timezone.
 */
function formatTimeInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

/**
 * Build a UTC Date from a local date + time in a timezone.
 * `localDate` is "YYYY-MM-DD", `localTime` is "HH:MM:SS" or "HH:MM".
 */
function localToUtc(localDate: string, localTime: string, tz: string): Date {
  // Build an ISO-like string and resolve via the timezone
  const isoish = `${localDate}T${localTime}`
  // Use a trick: format in the target tz, then compute offset
  const guess = new Date(isoish + 'Z')
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(guess)

  const g = (type: Intl.DateTimeFormatPartTypes) => formatted.find((p) => p.type === type)?.value ?? '0'
  const tzDate = new Date(`${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}:${g('second')}Z`)
  const offsetMs = tzDate.getTime() - guess.getTime()

  // The actual UTC time is the local time minus the offset
  return new Date(new Date(isoish + 'Z').getTime() - offsetMs)
}

// ── Single attorney ────────────────────────────────────────────────────────

/**
 * Get the next available slot for a single attorney.
 * Queries `attorney_availability` (weekly schedule) and excludes:
 *   - `attorney_bookings_blocked` dates
 *   - `bookings` that already occupy a slot
 * Looks up to 14 days ahead.
 */
export async function getNextAvailableSlot(attorneyId: string): Promise<AvailabilitySlot | null> {
  const result = await getNextAvailableBatch([attorneyId])
  return result.get(attorneyId) ?? null
}

// ── Batch version (N+1 safe) ───────────────────────────────────────────────

/**
 * Batch-fetch the next available slot for multiple attorneys in a single
 * set of queries. Returns a Map keyed by attorney ID.
 */
export async function getNextAvailableBatch(
  attorneyIds: string[]
): Promise<Map<string, AvailabilitySlot | null>> {
  const result = new Map<string, AvailabilitySlot | null>()
  if (attorneyIds.length === 0) return result

  // Default all to null (no online booking)
  for (const id of attorneyIds) {
    result.set(id, null)
  }

  try {
    const supabase = createAdminClient()
    const now = new Date()
    const lookAheadDays = 14

    // 1. Fetch all active availability slots for these attorneys
    const { data: availSlots, error: availError } = await supabase
      .from('attorney_availability')
      .select('attorney_id, day_of_week, start_time, end_time, timezone, is_active')
      .in('attorney_id', attorneyIds)
      .eq('is_active', true)

    if (availError) {
      logger.error('Failed to fetch attorney availability', { error: availError })
      return result
    }

    if (!availSlots || availSlots.length === 0) {
      return result
    }

    // Group availability by attorney
    const availByAttorney = new Map<string, typeof availSlots>()
    for (const slot of availSlots) {
      const existing = availByAttorney.get(slot.attorney_id) ?? []
      existing.push(slot)
      availByAttorney.set(slot.attorney_id, existing)
    }

    // 2. Fetch blocked dates for the next 14 days
    const futureDate = new Date(now)
    futureDate.setDate(futureDate.getDate() + lookAheadDays)
    const todayStr = now.toISOString().split('T')[0]
    const futureStr = futureDate.toISOString().split('T')[0]

    const relevantAttorneyIds = Array.from(availByAttorney.keys())

    const { data: blockedDates, error: blockedError } = await supabase
      .from('attorney_bookings_blocked')
      .select('attorney_id, blocked_date')
      .in('attorney_id', relevantAttorneyIds)
      .gte('blocked_date', todayStr)
      .lte('blocked_date', futureStr)

    if (blockedError) {
      logger.warn('Failed to fetch blocked dates', { error: blockedError })
    }

    // Build blocked set: "attorneyId:YYYY-MM-DD"
    const blockedSet = new Set<string>()
    if (blockedDates) {
      for (const b of blockedDates) {
        blockedSet.add(`${b.attorney_id}:${b.blocked_date}`)
      }
    }

    // 3. Fetch existing confirmed/pending bookings in the window
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('attorney_id, scheduled_at, duration_minutes')
      .in('attorney_id', relevantAttorneyIds)
      .in('status', ['pending', 'confirmed'])
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', futureDate.toISOString())

    if (bookingsError) {
      logger.warn('Failed to fetch existing bookings', { error: bookingsError })
    }

    // Build booking occupied ranges per attorney
    const bookingsByAttorney = new Map<string, { start: number; end: number }[]>()
    if (existingBookings) {
      for (const b of existingBookings) {
        const ranges = bookingsByAttorney.get(b.attorney_id) ?? []
        const start = new Date(b.scheduled_at).getTime()
        const end = start + (b.duration_minutes ?? 30) * 60 * 1000
        ranges.push({ start, end })
        bookingsByAttorney.set(b.attorney_id, ranges)
      }
    }

    // 4. For each attorney, find the earliest available slot
    availByAttorney.forEach((slots, attorneyId) => {
      const tz = slots[0]?.timezone ?? 'America/New_York'

      // Build day-of-week -> time slots mapping
      const daySlots = new Map<number, { start: string; end: string }[]>()
      for (const s of slots) {
        const existing = daySlots.get(s.day_of_week) ?? []
        existing.push({ start: s.start_time, end: s.end_time })
        daySlots.set(s.day_of_week, existing)
      }

      // Sort each day's slots by start time
      daySlots.forEach((times) => {
        times.sort((a, b) => a.start.localeCompare(b.start))
      })

      const attorneyBookings = bookingsByAttorney.get(attorneyId) ?? []
      const todayInTz = getDateInTz(tz, now)
      let found = false

      // Iterate through the next 14 days
      for (let dayOffset = 0; dayOffset < lookAheadDays && !found; dayOffset++) {
        const checkDate = new Date(now)
        checkDate.setDate(checkDate.getDate() + dayOffset)
        const dateInTz = getDateInTz(tz, checkDate)
        const dateStr = `${dateInTz.year}-${String(dateInTz.month).padStart(2, '0')}-${String(dateInTz.day).padStart(2, '0')}`

        // Skip blocked dates
        if (blockedSet.has(`${attorneyId}:${dateStr}`)) continue

        // Get slots for this weekday
        const timeSlotsForDay = daySlots.get(dateInTz.weekday)
        if (!timeSlotsForDay || timeSlotsForDay.length === 0) continue

        // Check each time slot
        for (const timeSlot of timeSlotsForDay) {
          const slotUtc = localToUtc(dateStr, timeSlot.start, tz)

          // Skip slots in the past (add 5 min buffer)
          if (slotUtc.getTime() <= now.getTime() + 5 * 60 * 1000) continue

          // Check if occupied by an existing booking (30-min slot default)
          const slotStart = slotUtc.getTime()
          const slotEnd = slotStart + 30 * 60 * 1000
          const isOccupied = attorneyBookings.some(
            (b) => b.start < slotEnd && b.end > slotStart
          )
          if (isOccupied) continue

          // Found a valid slot
          const isToday =
            dateInTz.year === todayInTz.year &&
            dateInTz.month === todayInTz.month &&
            dateInTz.day === todayInTz.day

          const tomorrowDate = new Date(now)
          tomorrowDate.setDate(tomorrowDate.getDate() + 1)
          const tomorrowInTz = getDateInTz(tz, tomorrowDate)
          const isTomorrow =
            dateInTz.year === tomorrowInTz.year &&
            dateInTz.month === tomorrowInTz.month &&
            dateInTz.day === tomorrowInTz.day

          result.set(attorneyId, {
            date: dateStr,
            time: formatTimeInTz(slotUtc, tz),
            datetimeUtc: slotUtc.toISOString(),
            isToday,
            isTomorrow,
            timezone: tz,
          })

          found = true
          break
        }
      }
    })

    return result
  } catch (err) {
    logger.error('getNextAvailableBatch unexpected error', { error: err })
    return result
  }
}

/**
 * Format an availability slot for display.
 * Returns a human-readable string like "Today at 2:00 PM", "Tomorrow at 10:30 AM", "Mar 25 at 3:00 PM".
 */
export function formatAvailability(slot: AvailabilitySlot): string {
  if (slot.isToday) return `Today at ${slot.time}`
  if (slot.isTomorrow) return `Tomorrow at ${slot.time}`

  // Format as "Mar 25"
  const d = new Date(slot.date + 'T00:00:00')
  const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${monthDay} at ${slot.time}`
}

/**
 * Short format for badges: "Today", "Tomorrow at 2:00 PM", "Mar 25".
 */
export function formatAvailabilityShort(slot: AvailabilitySlot): string {
  if (slot.isToday) return `Today at ${slot.time}`
  if (slot.isTomorrow) return `Tomorrow at ${slot.time}`

  const d = new Date(slot.date + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
