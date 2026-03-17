import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiHandler } from '@/lib/api/handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCancellationNotification, logNotification } from '@/lib/notifications/email'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// POST request schema
const cancelBookingSchema = z.object({
  cancelledBy: z.enum(['client', 'attorney']),
  reason: z.string().max(500).optional(),
})

// POST /api/bookings/[id]/cancel - Cancel a booking
export const dynamic = 'force-dynamic'

export const POST = createApiHandler(async ({ request, user, params }) => {
  const id = params?.id
  if (!id) {
    return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 })
  }

  const body = await request.json()
  const result = cancelBookingSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation error', details: result.error.flatten() },
      { status: 400 }
    )
  }
  const { cancelledBy, reason } = result.data

  const supabase = await createClient()

  // Fetch booking info
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, client_id, attorney_id, status, scheduled_date, client_name, client_email, service_description')
    .eq('id', id)
    .single()

  if (bookingError || !booking) {
    return NextResponse.json(
      { error: 'Booking not found' },
      { status: 404 }
    )
  }

  // Verify ownership: only the client or the provider can cancel
  if (booking.client_id !== user!.id && booking.attorney_id !== user!.id) {
    return NextResponse.json(
      { error: 'You are not authorized to cancel this booking' },
      { status: 403 }
    )
  }

  if (booking.status === 'cancelled') {
    return NextResponse.json(
      { error: 'This booking is already cancelled' },
      { status: 400 }
    )
  }

  // Check if cancellation is allowed (at least 24h before)
  const bookingDate = new Date(booking.scheduled_date)
  const now = new Date()
  const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilBooking < 24 && cancelledBy === 'client') {
    return NextResponse.json(
      { error: 'Cancellations must be made at least 24 hours in advance' },
      { status: 400 }
    )
  }

  // Update booking status
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
      cancellation_reason: reason,
    })
    .eq('id', id)

  if (updateError) throw updateError

  // Fetch attorney details for notification
  // Uses admin client: RLS policy 328 restricts cross-user profile reads
  const adminSupabase = createAdminClient()
  const { data: attorneyProfile } = await adminSupabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', booking.attorney_id)
    .single()

  // Format date for email
  const formattedDate = new Date(booking.scheduled_date).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Send cancellation notification (non-blocking)
  if (attorneyProfile?.email) {
    sendCancellationNotification({
      bookingId: id,
      clientName: booking.client_name,
      clientEmail: booking.client_email,
      attorneyName: attorneyProfile.full_name || 'Attorney',
      attorneyEmail: attorneyProfile.email,
      specialtyName: booking.service_description || 'Service',
      date: formattedDate,
      startTime: new Date(booking.scheduled_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      endTime: '',
      cancelledBy,
      reason,
    }).then(async (notifResult) => {
      await logNotification(supabase, {
        bookingId: id,
        type: 'cancellation',
        status: notifResult.clientNotification.success ? 'sent' : 'failed',
        recipientEmail: booking.client_email,
        errorMessage: notifResult.clientNotification.error,
      })
    }).catch((err) => {
      logger.error('Failed to send cancellation notifications:', err)
    })
  }

  return NextResponse.json({
    success: true,
    message: 'Booking cancelled successfully',
  })
}, { requireAuth: true })
