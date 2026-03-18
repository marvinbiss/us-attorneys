import { createClient } from '@/lib/supabase/server'
import { createApiHandler, apiSuccess, apiError } from '@/lib/api/handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBookingConfirmation, logNotification } from '@/lib/notifications/email'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// POST request schema
const rescheduleBookingSchema = z.object({
  newSlotId: z.string().uuid(),
})

// POST /api/bookings/[id]/reschedule - Reschedule a booking to a new slot
export const POST = createApiHandler(async ({ request, user, params }) => {
  const bookingId = params?.id
  if (!bookingId) {
    return apiError('VALIDATION_ERROR', 'Missing booking ID', 400)
  }

  const supabase = await createClient()

  const body = await request.json()
  const result = rescheduleBookingSchema.safeParse(body)
  if (!result.success) {
    return apiError('VALIDATION_ERROR', 'Validation error', 400)
  }
  const { newSlotId } = result.data

  // Fetch current booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      id, status, client_id, client_name, client_email, client_phone, service_description,
      slot:availability_slots(
        id,
        date,
        start_time,
        end_time,
        attorney_id
      )
    `)
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return apiError('NOT_FOUND', 'Booking not found', 404)
  }

  // Ownership check: user must be the client or the assigned attorney
  const bookingSlotForAuth = Array.isArray(booking.slot) ? booking.slot[0] : booking.slot
  const isClient = booking.client_id === user!.id
  const isAttorney = bookingSlotForAuth?.attorney_id === user!.id
  const isEmailMatch = user!.email?.toLowerCase() === booking.client_email?.toLowerCase()
  if (!isClient && !isAttorney && !isEmailMatch) {
    return apiError('AUTHORIZATION_ERROR', 'You are not authorized to reschedule this booking', 403)
  }

  if (booking.status === 'cancelled') {
    return apiError('VALIDATION_ERROR', 'Cannot reschedule a cancelled booking', 400)
  }

  // Verify new slot exists and is available
  const { data: newSlot, error: slotError } = await supabase
    .from('availability_slots')
    .select('id, attorney_id, date, start_time, end_time, is_available')
    .eq('id', newSlotId)
    .eq('is_available', true)
    .single()

  if (slotError || !newSlot) {
    return apiError('SLOT_UNAVAILABLE', 'The new slot is no longer available', 400)
  }

  // Verify new slot belongs to the same attorney
  const bookingSlot = Array.isArray(booking.slot) ? booking.slot[0] : booking.slot
  if (newSlot.attorney_id !== bookingSlot?.attorney_id) {
    return apiError('VALIDATION_ERROR', 'The slot must belong to the same attorney', 400)
  }

  // Check that new slot is in the future
  const newSlotDate = new Date(`${newSlot.date}T${newSlot.start_time}`)
  if (newSlotDate <= new Date()) {
    return apiError('VALIDATION_ERROR', 'The new slot must be in the future', 400)
  }

  // Update booking with new slot
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      scheduled_date: newSlot.start_time
        ? `${newSlot.date}T${newSlot.start_time}`
        : newSlot.date,
      rescheduled_at: new Date().toISOString(),
      rescheduled_from_slot_id: bookingSlot?.id,
    })
    .eq('id', bookingId)

  if (updateError) throw updateError

  // Make old slot available again
  await supabase
    .from('availability_slots')
    .update({ is_available: true })
    .eq('id', bookingSlot?.id)

  // Mark new slot as unavailable
  await supabase
    .from('availability_slots')
    .update({ is_available: false })
    .eq('id', newSlotId)

  // Fetch attorney details for notification
  // Uses admin client: RLS policy 328 restricts cross-user profile reads
  const adminSupabase = createAdminClient()
  const { data: attorneyProfile } = await adminSupabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', bookingSlot?.attorney_id)
    .single()

  // Format new date for email
  const formattedDate = new Date(newSlot.date).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Send confirmation of rescheduled booking (non-blocking)
  if (attorneyProfile?.email) {
    sendBookingConfirmation({
      bookingId,
      clientName: booking.client_name,
      clientEmail: booking.client_email,
      clientPhone: booking.client_phone,
      attorneyName: attorneyProfile.full_name || 'Attorney',
      attorneyEmail: attorneyProfile.email,
      specialtyName: booking.service_description || 'Service',
      date: formattedDate,
      startTime: newSlot.start_time,
      endTime: newSlot.end_time,
      message: `Booking rescheduled - Previous slot: ${bookingSlot?.date} ${bookingSlot?.start_time}`,
    }).then(async (notifResult) => {
      await logNotification(supabase, {
        bookingId,
        type: 'reschedule',
        status: notifResult.clientNotification.success ? 'sent' : 'failed',
        recipientEmail: booking.client_email,
        errorMessage: notifResult.clientNotification.error,
      })
    }).catch((err) => {
      logger.error('Failed to send reschedule notifications:', err)
    })
  }

  return apiSuccess({
    message: 'Booking rescheduled successfully',
    newSlot: {
      date: newSlot.date,
      startTime: newSlot.start_time,
      endTime: newSlot.end_time,
    },
  })
}, { requireAuth: true })
