import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid booking ID' } },
        { status: 400 }
      )
    }

    // Authentication check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Admin client needed for cross-user booking reads
    const adminSupabase = createAdminClient()

    // Fetch booking
    const { data: booking, error } = await adminSupabase
      .from('bookings')
      .select('id, status, scheduled_at, duration_minutes, daily_room_url, daily_room_name, client_id, client_email, attorney_id')
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
        { status: 404 }
      )
    }

    // Authorization check: only the client or the attorney can join
    const isClient = booking.client_id === user.id
    const isEmailMatch = user.email?.toLowerCase() === booking.client_email?.toLowerCase()

    // Check if user is the attorney
    const { data: attorneyRecord } = await adminSupabase
      .from('attorneys')
      .select('id')
      .eq('id', booking.attorney_id)
      .eq('user_id', user.id)
      .single()

    const isAttorney = !!attorneyRecord

    if (!isClient && !isEmailMatch && !isAttorney) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You are not authorized to join this booking' } },
        { status: 403 }
      )
    }

    // Verify status is confirmed
    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { success: false, error: { code: 'BOOKING_NOT_CONFIRMED', message: 'This booking is not confirmed. Only confirmed bookings can be joined.' } },
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
        { success: false, error: { code: 'NOT_YET_AVAILABLE', message: 'Video call not available yet. You can join 15 minutes before your scheduled time.' } },
        { status: 403 }
      )
    }

    // Verify room URL exists
    if (!booking.daily_room_url) {
      return NextResponse.json(
        { success: false, error: { code: 'ROOM_NOT_READY', message: 'Video room not yet created for this booking. Please try again shortly.' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        room_url: booking.daily_room_url,
        room_name: booking.daily_room_name,
        booking_id: booking.id,
        scheduled_at: booking.scheduled_at,
        duration_minutes: booking.duration_minutes,
      },
    })
  } catch (error: unknown) {
    logger.error('[Video Join] Error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
