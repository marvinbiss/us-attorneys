import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBookingConfirmation, logNotification } from '@/lib/notifications/email'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// POST request schema
const rescheduleBookingSchema = z.object({
  newSlotId: z.string().uuid(),
})

// POST /api/bookings/[id]/reschedule - Reschedule a booking to a new slot
export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Auth guard: require authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: { message: 'Not authenticated' } }, { status: 401 })
    }

    const body = await request.json()
    const result = rescheduleBookingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Validation error', details: result.error.flatten() } },
        { status: 400 }
      )
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
      .eq('id', params.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: { message: 'Booking not found' } },
        { status: 404 }
      )
    }

    // Ownership check: user must be the client or the assigned attorney
    const bookingSlotForAuth = Array.isArray(booking.slot) ? booking.slot[0] : booking.slot
    const isClient = booking.client_id === user.id
    const isAttorney = bookingSlotForAuth?.attorney_id === user.id
    const isEmailMatch = user.email?.toLowerCase() === booking.client_email?.toLowerCase()
    if (!isClient && !isAttorney && !isEmailMatch) {
      return NextResponse.json(
        { success: false, error: { message: 'You are not authorized to reschedule this booking' } },
        { status: 403 }
      )
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: { message: 'Cannot reschedule a cancelled booking' } },
        { status: 400 }
      )
    }

    // Verify new slot exists and is available
    const { data: newSlot, error: slotError } = await supabase
      .from('availability_slots')
      .select('id, attorney_id, date, start_time, end_time, is_available')
      .eq('id', newSlotId)
      .eq('is_available', true)
      .single()

    if (slotError || !newSlot) {
      return NextResponse.json(
        { success: false, error: { message: 'The new slot is no longer available' } },
        { status: 400 }
      )
    }

    // Verify new slot belongs to the same attorney
    const bookingSlot = Array.isArray(booking.slot) ? booking.slot[0] : booking.slot
    if (newSlot.attorney_id !== bookingSlot?.attorney_id) {
      return NextResponse.json(
        { success: false, error: { message: 'The slot must belong to the same attorney' } },
        { status: 400 }
      )
    }

    // Check that new slot is in the future
    const newSlotDate = new Date(`${newSlot.date}T${newSlot.start_time}`)
    if (newSlotDate <= new Date()) {
      return NextResponse.json(
        { success: false, error: { message: 'The new slot must be in the future' } },
        { status: 400 }
      )
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
      .eq('id', params.id)

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
        bookingId: params.id,
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
      }).then(async (result) => {
        await logNotification(supabase, {
          bookingId: params.id,
          type: 'reschedule',
          status: result.clientNotification.success ? 'sent' : 'failed',
          recipientEmail: booking.client_email,
          errorMessage: result.clientNotification.error,
        })
      }).catch((err) => {
        logger.error('Failed to send reschedule notifications:', err)
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Booking rescheduled successfully',
      newSlot: {
        date: newSlot.date,
        startTime: newSlot.start_time,
        endTime: newSlot.end_time,
      },
    })
  } catch (error) {
    logger.error('Error rescheduling booking:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error rescheduling' } },
      { status: 500 }
    )
  }
}
