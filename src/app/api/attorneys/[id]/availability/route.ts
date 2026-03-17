/**
 * GET /api/attorneys/[id]/availability
 * Returns available time slots for video booking
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

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

interface Slot {
  date: string
  time: string
  datetime: string
  available: boolean
}

/**
 * Parse a "HH:MM:SS" or "HH:MM" time string into total minutes since midnight
 */
function timeToMinutes(time: string): number {
  const parts = time.split(':')
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
}

/**
 * Format minutes since midnight to "HH:MM"
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Format a date + time + timezone into an ISO-like datetime string with offset
 */
function formatDatetime(dateStr: string, timeStr: string, timezone: string): string {
  // Build a date in the attorney's timezone
  const dtStr = `${dateStr}T${timeStr}:00`
  try {
    const dt = new Date(dtStr)
    // Use Intl to get the UTC offset for the timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    })
    const parts = formatter.formatToParts(dt)
    const tzPart = parts.find((p) => p.type === 'timeZoneName')
    const offsetStr = tzPart?.value || ''
    // Convert "GMT-5" -> "-05:00", "GMT+5:30" -> "+05:30"
    const match = offsetStr.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
    if (match) {
      const sign = match[1]
      const hours = match[2].padStart(2, '0')
      const mins = match[3] || '00'
      return `${dateStr}T${timeStr}:00${sign}${hours}:${mins}`
    }
    // Fallback: return without offset
    return `${dateStr}T${timeStr}:00`
  } catch {
    return `${dateStr}T${timeStr}:00`
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid attorney ID format' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const daysParam = parseInt(searchParams.get('days') || '14', 10)
    const days = Math.min(Math.max(daysParam, 1), 60) // Clamp 1-60

    // Parse date param or default to today
    let startDate: Date
    const dateParam = searchParams.get('date')
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      startDate = new Date(dateParam + 'T00:00:00')
    } else {
      startDate = new Date()
    }

    const supabase = createAdminClient()

    // 1. Verify attorney exists
    const { data: attorney, error: attorneyError } = await supabase
      .from('attorneys')
      .select('id')
      .eq('id', id)
      .single()

    if (attorneyError || !attorney) {
      return NextResponse.json(
        { error: 'Attorney not found' },
        { status: 404 }
      )
    }

    // 2. Fetch weekly availability schedule
    const { data: availability, error: availError } = await supabase
      .from('attorney_availability')
      .select('day_of_week, start_time, end_time, is_active, timezone')
      .eq('attorney_id', id)
      .eq('is_active', true)

    if (availError) {
      logger.error('Error fetching availability', availError)
      return NextResponse.json(
        { error: 'Failed to fetch availability' },
        { status: 500 }
      )
    }

    const availabilityRows = (availability || []) as AvailabilityRow[]
    const timezone = availabilityRows[0]?.timezone || 'America/New_York'

    // If no availability configured, return empty
    if (availabilityRows.length === 0) {
      return NextResponse.json({
        attorney_id: id,
        timezone,
        slots: [],
        generated_at: new Date().toISOString(),
      })
    }

    // Build a map of day_of_week -> availability windows
    const availByDay = new Map<number, AvailabilityRow[]>()
    for (const row of availabilityRows) {
      const existing = availByDay.get(row.day_of_week) || []
      existing.push(row)
      availByDay.set(row.day_of_week, existing)
    }

    // Calculate date range
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + days - 1)

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // 3. Fetch blocked dates in range
    const { data: blockedRows } = await supabase
      .from('attorney_bookings_blocked')
      .select('blocked_date')
      .eq('attorney_id', id)
      .gte('blocked_date', startDateStr)
      .lte('blocked_date', endDateStr)

    const blockedDates = new Set(
      ((blockedRows || []) as BlockedRow[]).map((b) => b.blocked_date)
    )

    // 4. Fetch existing bookings (non-cancelled) in range
    const rangeStart = `${startDateStr}T00:00:00`
    const rangeEnd = `${endDateStr}T23:59:59`

    const { data: bookings } = await supabase
      .from('bookings')
      .select('scheduled_at, duration_minutes, status')
      .eq('attorney_id', id)
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

    // 5. Generate slots for each day in range
    const slots: Slot[] = []
    const current = new Date(startDate)

    for (let d = 0; d < days; d++) {
      const dateStr = current.toISOString().split('T')[0]
      const dayOfWeek = current.getDay() // 0=Sunday, 6=Saturday

      // Check if day has availability and is not blocked
      const dayAvail = availByDay.get(dayOfWeek)
      if (dayAvail && !blockedDates.has(dateStr)) {
        const dayBookings = bookingsByDate.get(dateStr) || []

        for (const window of dayAvail) {
          const windowStart = timeToMinutes(window.start_time)
          const windowEnd = timeToMinutes(window.end_time)

          // Generate 30-minute slots
          for (let slotStart = windowStart; slotStart + 30 <= windowEnd; slotStart += 30) {
            const slotEnd = slotStart + 30
            const timeStr = minutesToTime(slotStart)

            // Check if slot overlaps with any existing booking
            const isBooked = dayBookings.some((b) => {
              // Since scheduled_at is TIMESTAMPTZ, convert to attorney's timezone for comparison
              const bookingDateLocal = new Date(b.scheduled_at)
              const localTimeStr = bookingDateLocal.toLocaleTimeString('en-US', {
                timeZone: timezone,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
              })
              const bookingStartMin = timeToMinutes(localTimeStr)
              const bookingEndMin = bookingStartMin + (b.duration_minutes || 30)

              // Overlap check: slot [slotStart, slotEnd) vs booking [bookingStart, bookingEnd)
              return slotStart < bookingEndMin && slotEnd > bookingStartMin
            })

            slots.push({
              date: dateStr,
              time: timeStr,
              datetime: formatDatetime(dateStr, timeStr, timezone),
              available: !isBooked,
            })
          }
        }
      }

      current.setDate(current.getDate() + 1)
    }

    return NextResponse.json({
      attorney_id: id,
      timezone,
      slots,
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Availability API error', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
