import { createClient } from '@/lib/supabase/server'
import { createApiHandler, apiSuccess, apiError } from '@/lib/api/handler'
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
export const POST = createApiHandler(async ({ request, user, params }) => {
  const id = params?.id
  if (!id) {
    return apiError('VALIDATION_ERROR', 'Missing booking ID', 400)
  }

  const body = await request.json()
  const result = cancelBookingSchema.safeParse(body)
  if (!result.success) {
    return apiError('VALIDATION_ERROR', 'Validation error', 400)
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
    return apiError('NOT_FOUND', 'Booking not found', 404)
  }

  // Verify ownership: only the client or the provider can cancel
  if (booking.client_id !== user!.id && booking.attorney_id !== user!.id) {
    return apiError('AUTHORIZATION_ERROR', 'You are not authorized to cancel this booking', 403)
  }

  if (booking.status === 'cancelled') {
    return apiError('VALIDATION_ERROR', 'This booking is already cancelled', 400)
  }

  // Check if cancellation is allowed (at least 24h before)
  const bookingDate = new Date(booking.scheduled_date)
  const now = new Date()
  const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilBooking < 24 && cancelledBy === 'client') {
    return apiError('CANCELLATION_TOO_LATE', 'Cancellations must be made at least 24 hours in advance', 400)
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

  return apiSuccess({ message: 'Booking cancelled successfully' })
}, { requireAuth: true })
