import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const bookingIdSchema = z.string().uuid('Invalid booking ID')

export const dynamic = 'force-dynamic'

// GET /api/bookings/[id]/join - Get video room URL for a confirmed booking
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params

    // Validate booking ID format
    const idValidation = bookingIdSchema.safeParse(bookingId)
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // Fetch booking
    const { data: booking, error } = await adminSupabase
      .from('bookings')
      .select('id, status, scheduled_at, duration_minutes, daily_room_url, daily_room_name')
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify status is confirmed
    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'This booking is not confirmed. Only confirmed bookings can be joined.' },
        { status: 403 }
      )
    }

    // Verify current time is within allowed window
    const now = new Date()
    const scheduled = new Date(booking.scheduled_at)
    const diffMinutes = (scheduled.getTime() - now.getTime()) / (1000 * 60)

    // Allow join from 15 min before to (duration + 15) min after
    if (diffMinutes > 15 || diffMinutes < -(booking.duration_minutes + 15)) {
      return NextResponse.json(
        { error: 'Video call not available yet. You can join 15 minutes before your scheduled time.' },
        { status: 403 }
      )
    }

    // Verify room URL exists
    if (!booking.daily_room_url) {
      return NextResponse.json(
        { error: 'Video room not yet created for this booking. Please try again shortly.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      room_url: booking.daily_room_url,
      room_name: booking.daily_room_name,
      booking_id: booking.id,
      scheduled_at: booking.scheduled_at,
      duration_minutes: booking.duration_minutes,
    })
  } catch (error) {
    logger.error('[Video Join] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
