/**
 * POST /api/bookings/confirm
 * Confirm a pending booking (after payment)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, emailTemplates } from '@/lib/services/email-service'
import { logger } from '@/lib/logger'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

const confirmBookingSchema = z.object({
  booking_id: z.string().uuid(),
  payment_intent_id: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Rate limiting — booking category (10/min)
    const rl = await rateLimit(request, RATE_LIMITS.booking)
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMIT_ERROR', message: 'Too many requests. Please try again later.' } },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
      )
    }

    // 1. Parse and validate body
    let body: z.infer<typeof confirmBookingSchema>
    try {
      const rawBody = await request.json()
      body = confirmBookingSchema.parse(rawBody)
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation error', details: messages } },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request body' } },
        { status: 400 }
      )
    }

    const { booking_id, payment_intent_id } = body

    // Admin client needed for cross-user booking reads and updates
    const adminSupabase = createAdminClient()

    // 2. Fetch the booking and verify it's pending
    const { data: booking, error: fetchError } = await adminSupabase
      .from('bookings')
      .select('id, attorney_id, scheduled_at, duration_minutes, status, daily_room_url, daily_room_name, client_name, client_email, client_phone, client_id, notes')
      .eq('id', booking_id)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
        { status: 404 }
      )
    }

    // Authorization check: only the client who created the booking can confirm it
    const isOwner = booking.client_id === user.id
    const isEmailMatch = user.email?.toLowerCase() === booking.client_email?.toLowerCase()
    if (!isOwner && !isEmailMatch) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You are not authorized to confirm this booking' } },
        { status: 403 }
      )
    }

    if (booking.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: `Booking cannot be confirmed (current status: ${booking.status})` } },
        { status: 409 }
      )
    }

    // 3. Create Daily.co room if not yet created
    let dailyRoomUrl = booking.daily_room_url
    let dailyRoomName = booking.daily_room_name

    if (!dailyRoomUrl) {
      try {
        const { createDailyRoom } = await import('@/lib/daily')
        const expiresAt = new Date(new Date(booking.scheduled_at).getTime() + 2 * 60 * 60 * 1000)
        const room = await createDailyRoom(booking.id, expiresAt)
        dailyRoomUrl = room.url
        dailyRoomName = room.name
      } catch (dailyError) {
        logger.warn('Daily.co room creation failed during confirm (non-blocking)', { error: String(dailyError) })
      }
    }

    // 4. Update booking to confirmed
    const { data: updatedBooking, error: updateError } = await adminSupabase
      .from('bookings')
      .update({
        status: 'confirmed',
        stripe_payment_intent_id: payment_intent_id,
        daily_room_url: dailyRoomUrl,
        daily_room_name: dailyRoomName,
      })
      .eq('id', booking_id)
      .select()
      .single()

    if (updateError || !updatedBooking) {
      logger.error('Failed to update booking', updateError)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to confirm booking' } },
        { status: 500 }
      )
    }

    // 5. Send confirmation email (non-blocking)
    try {
      const { data: attorney } = await adminSupabase
        .from('attorneys')
        .select('name, email')
        .eq('id', booking.attorney_id)
        .single()

      const attorneyName = attorney?.name || 'Attorney'
      const scheduledDate = new Date(booking.scheduled_at)
      const dateStr = scheduledDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
      const timeStr = scheduledDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })

      // Client confirmation
      const clientTemplate = emailTemplates.bookingConfirmationClient(
        booking.client_name,
        attorneyName,
        'Video Consultation',
        dateStr,
        timeStr,
        dailyRoomUrl || 'Link will be provided before your consultation'
      )
      sendEmail({ to: booking.client_email, template: clientTemplate }).catch((err) => {
        logger.error('Failed to send confirmation email to client', err as Error)
      })

      // Attorney notification
      if (attorney?.email) {
        const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://lawtendr.com'}/attorney-dashboard/bookings`
        const attorneyTemplate = emailTemplates.bookingNotificationAttorney(
          attorneyName,
          booking.client_name,
          booking.client_email,
          'Video Consultation',
          dateStr,
          timeStr,
          booking.notes || '',
          dashboardUrl
        )
        sendEmail({ to: attorney.email, template: attorneyTemplate }).catch((err) => {
          logger.error('Failed to send confirmation email to attorney', err as Error)
        })
      }
    } catch (emailError) {
      logger.error('Error sending confirmation emails', emailError as Error)
    }

    // 6. Return updated booking
    return NextResponse.json({
      success: true,
      data: {
        booking: {
          id: updatedBooking.id,
          attorney_id: updatedBooking.attorney_id,
          scheduled_at: updatedBooking.scheduled_at,
          duration_minutes: updatedBooking.duration_minutes,
          status: updatedBooking.status,
          daily_room_url: updatedBooking.daily_room_url,
          stripe_payment_intent_id: updatedBooking.stripe_payment_intent_id,
          client_name: updatedBooking.client_name,
          client_email: updatedBooking.client_email,
          updated_at: updatedBooking.updated_at,
        },
      },
    })
  } catch (error: unknown) {
    logger.error('Booking confirm error', error as Error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
