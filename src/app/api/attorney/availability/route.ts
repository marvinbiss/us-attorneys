/**
 * GET/PUT/POST/DELETE /api/attorney/availability
 * Manage attorney weekly schedule + blocked dates
 * All endpoints are auth-protected (attorney only)
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAttorney } from '@/lib/auth/attorney-guard'
import { apiSuccess, apiError } from '@/lib/api/handler'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// ─── Validation Schemas ─────────────────────────────────────────────────────

const timeSlotSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time format must be HH:MM or HH:MM:SS'),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time format must be HH:MM or HH:MM:SS'),
  is_active: z.boolean().default(true),
})

const updateScheduleSchema = z.object({
  timezone: z.string().min(1).max(100),
  slot_duration: z.number().int().min(15).max(120).default(30),
  slots: z.array(timeSlotSchema).max(100),
})

const addBlockedDatesSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')).min(1).max(365),
  reason: z.string().max(255).optional(),
})

const deleteBlockedDatesSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')).min(1).max(365),
})

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizeTime(t: string): string {
  // Ensure HH:MM:SS format
  return t.length === 5 ? `${t}:00` : t
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function validateNoOverlap(slots: Array<{ day_of_week: number; start_time: string; end_time: string }>): string | null {
  const byDay = new Map<number, Array<{ start: number; end: number }>>()

  for (const slot of slots) {
    const startMin = timeToMinutes(slot.start_time)
    const endMin = timeToMinutes(slot.end_time)

    if (endMin <= startMin) {
      return `Day ${slot.day_of_week}: end time must be after start time (${slot.start_time} - ${slot.end_time})`
    }

    const existing = byDay.get(slot.day_of_week) || []
    for (const ex of existing) {
      if (startMin < ex.end && endMin > ex.start) {
        return `Day ${slot.day_of_week}: overlapping time slots detected`
      }
    }
    existing.push({ start: startMin, end: endMin })
    byDay.set(slot.day_of_week, existing)
  }

  return null
}

// ─── GET: Current weekly schedule + blocked dates + upcoming bookings ────────

export async function GET(request: NextRequest) {
  try {
    const { error, user, supabase } = await requireAttorney()
    if (error) return error

    // Get attorney ID
    const { data: attorney } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user!.id)
      .single()

    if (!attorney) {
      return apiError('NOT_FOUND', 'Attorney profile not found', 404)
    }

    const { searchParams } = new URL(request.url)
    const includeBookings = searchParams.get('includeBookings') !== 'false'

    // Fetch availability slots
    const { data: availability, error: availError } = await supabase
      .from('attorney_availability')
      .select('id, day_of_week, start_time, end_time, is_active, timezone')
      .eq('attorney_id', attorney.id)
      .order('day_of_week')
      .order('start_time')

    if (availError) {
      logger.error('Availability GET error:', availError)
      return apiError('DATABASE_ERROR', 'Failed to load availability', 500)
    }

    // Fetch blocked dates (next 365 days)
    const today = new Date().toISOString().split('T')[0]
    const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]

    const { data: blockedDates, error: blockedError } = await supabase
      .from('attorney_bookings_blocked')
      .select('id, blocked_date, reason')
      .eq('attorney_id', attorney.id)
      .gte('blocked_date', today)
      .lte('blocked_date', nextYear)
      .order('blocked_date')

    if (blockedError) {
      logger.error('Blocked dates GET error:', blockedError)
      return apiError('DATABASE_ERROR', 'Failed to load blocked dates', 500)
    }

    // Fetch upcoming bookings (next 30 days)
    let upcomingBookings: Array<{
      id: string
      scheduled_at: string
      duration_minutes: number
      status: string
      client_name: string
      client_email: string
    }> = []

    if (includeBookings) {
      const next30 = new Date(Date.now() + 30 * 86400000).toISOString()
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, scheduled_at, duration_minutes, status, client_name, client_email')
        .eq('attorney_id', attorney.id)
        .in('status', ['pending', 'confirmed'])
        .gte('scheduled_at', new Date().toISOString())
        .lte('scheduled_at', next30)
        .order('scheduled_at')

      if (bookingsError) {
        logger.error('Bookings GET error:', bookingsError)
        // Non-critical, don't fail the whole request
      } else {
        upcomingBookings = bookings || []
      }
    }

    // Detect timezone from first slot or default
    const timezone = availability?.[0]?.timezone || 'America/New_York'

    return apiSuccess({
      attorney_id: attorney.id,
      timezone,
      availability: availability || [],
      blocked_dates: blockedDates || [],
      upcoming_bookings: upcomingBookings,
    })
  } catch (err: unknown) {
    logger.error('Availability GET error:', err)
    return apiError('INTERNAL_ERROR', 'Server error', 500)
  }
}

// ─── PUT: Update weekly schedule (upsert attorney_availability rows) ─────────

export async function PUT(request: NextRequest) {
  try {
    const { error, user, supabase } = await requireAttorney()
    if (error) return error

    const body = await request.json()
    const result = updateScheduleSchema.safeParse(body)
    if (!result.success) {
      const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
      return apiError('VALIDATION_ERROR', issues, 400)
    }

    const { timezone, slots } = result.data

    // Get attorney ID
    const { data: attorney } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user!.id)
      .single()

    if (!attorney) {
      return apiError('NOT_FOUND', 'Attorney profile not found', 404)
    }

    // Validate no overlapping slots
    const overlapError = validateNoOverlap(slots)
    if (overlapError) {
      return apiError('VALIDATION_ERROR', overlapError, 400)
    }

    // Delete existing availability then insert new ones (transactional approach)
    const { error: deleteError } = await supabase
      .from('attorney_availability')
      .delete()
      .eq('attorney_id', attorney.id)

    if (deleteError) {
      logger.error('Availability delete error:', deleteError)
      return apiError('DATABASE_ERROR', 'Failed to update schedule', 500)
    }

    // Insert new slots (if any)
    if (slots.length > 0) {
      const rows = slots.map(slot => ({
        attorney_id: attorney.id,
        day_of_week: slot.day_of_week,
        start_time: normalizeTime(slot.start_time),
        end_time: normalizeTime(slot.end_time),
        is_active: slot.is_active,
        timezone,
      }))

      const { error: insertError } = await supabase
        .from('attorney_availability')
        .insert(rows)

      if (insertError) {
        logger.error('Availability insert error:', insertError)
        return apiError('DATABASE_ERROR', 'Failed to save schedule', 500)
      }
    }

    return apiSuccess({ message: 'Schedule updated successfully' })
  } catch (err: unknown) {
    logger.error('Availability PUT error:', err)
    return apiError('INTERNAL_ERROR', 'Server error', 500)
  }
}

// ─── POST: Add blocked dates ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { error, user, supabase } = await requireAttorney()
    if (error) return error

    const body = await request.json()
    const result = addBlockedDatesSchema.safeParse(body)
    if (!result.success) {
      const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
      return apiError('VALIDATION_ERROR', issues, 400)
    }

    const { dates, reason } = result.data

    // Get attorney ID
    const { data: attorney } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user!.id)
      .single()

    if (!attorney) {
      return apiError('NOT_FOUND', 'Attorney profile not found', 404)
    }

    // Upsert blocked dates (ignore conflicts on existing dates)
    const rows = dates.map(d => ({
      attorney_id: attorney.id,
      blocked_date: d,
      reason: reason || null,
    }))

    const { error: insertError } = await supabase
      .from('attorney_bookings_blocked')
      .upsert(rows, { onConflict: 'attorney_id,blocked_date' })

    if (insertError) {
      logger.error('Blocked dates insert error:', insertError)
      return apiError('DATABASE_ERROR', 'Failed to add blocked dates', 500)
    }

    return apiSuccess({ message: `${dates.length} date(s) blocked successfully` })
  } catch (err: unknown) {
    logger.error('Blocked dates POST error:', err)
    return apiError('INTERNAL_ERROR', 'Server error', 500)
  }
}

// ─── DELETE: Remove blocked dates ────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const { error, user, supabase } = await requireAttorney()
    if (error) return error

    const body = await request.json()
    const result = deleteBlockedDatesSchema.safeParse(body)
    if (!result.success) {
      const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
      return apiError('VALIDATION_ERROR', issues, 400)
    }

    const { dates } = result.data

    // Get attorney ID
    const { data: attorney } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user!.id)
      .single()

    if (!attorney) {
      return apiError('NOT_FOUND', 'Attorney profile not found', 404)
    }

    const { error: deleteError } = await supabase
      .from('attorney_bookings_blocked')
      .delete()
      .eq('attorney_id', attorney.id)
      .in('blocked_date', dates)

    if (deleteError) {
      logger.error('Blocked dates delete error:', deleteError)
      return apiError('DATABASE_ERROR', 'Failed to remove blocked dates', 500)
    }

    return apiSuccess({ message: `${dates.length} date(s) unblocked successfully` })
  } catch (err: unknown) {
    logger.error('Blocked dates DELETE error:', err)
    return apiError('INTERNAL_ERROR', 'Server error', 500)
  }
}
