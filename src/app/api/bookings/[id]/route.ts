import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Booking ID schema - must be valid UUID
const bookingIdSchema = z.string().uuid('Invalid booking ID')

// PATCH request schema
const bookingPatchSchema = z.object({
  status: z.enum(['confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  notes: z.string().max(1000).optional(),
})

// GET /api/bookings/[id] - Get booking details
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id

    // Validate booking ID format (must be full UUID)
    const idValidation = bookingIdSchema.safeParse(bookingId)
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid booking ID' } },
        { status: 400 }
      )
    }

    // Get authenticated user (optional for booking lookup by ID)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Use admin client for booking lookup
    const adminSupabase = createAdminClient()

    // Query booking by exact ID only (no partial matching for security)
    const { data: booking, error } = await adminSupabase
      .from('bookings')
      .select(`
        id,
        client_name,
        client_phone,
        client_email,
        service_description,
        status,
        created_at,
        cancelled_at,
        cancelled_by,
        cancellation_reason,
        rescheduled_at,
        payment_status,
        deposit_amount,
        client_id,
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

    if (error || !booking) {
      return NextResponse.json(
        { success: false, error: { message: 'Booking not found' } },
        { status: 404 }
      )
    }

    const slotData = booking.slot as Array<{ id: string; date: string; start_time: string; end_time: string; attorney_id: string }> | null
    const slot = slotData?.[0] || null

    // Security check: If user is authenticated, verify they have access to this booking
    // (either as the client who made it, or as the attorney)
    if (user) {
      const isOwner = booking.client_id === user.id
      const isAttorney = slot?.attorney_id === user.id

      // For authenticated users, they must be the owner or the attorney
      if (!isOwner && !isAttorney) {
        // Check if user email matches booking email (for non-registered users who made booking)
        if (user.email?.toLowerCase() !== booking.client_email?.toLowerCase()) {
          return NextResponse.json(
            { success: false, error: { message: 'Unauthorized access to this booking' } },
            { status: 403 }
          )
        }
      }
    }

    // Fetch attorney details (limited info for non-owners)
    let artisan = null
    if (slot?.attorney_id) {
      const { data: attorneyData } = await adminSupabase
        .from('profiles')
        .select('id, full_name, phone_e164, email')
        .eq('id', slot.attorney_id)
        .single()
      artisan = attorneyData
    }

    // Format response for confirmation page
    return NextResponse.json({
      booking: {
        id: booking.id,
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        clientPhone: booking.client_phone,
        specialtyName: booking.service_description || 'Service',
        status: booking.status,
        createdAt: booking.created_at,
        cancelledAt: booking.cancelled_at,
        cancelledBy: booking.cancelled_by,
        cancellationReason: booking.cancellation_reason,
        rescheduledAt: booking.rescheduled_at,
        paymentStatus: booking.payment_status,
        depositAmount: booking.deposit_amount,
        date: slot?.date,
        startTime: slot?.start_time,
        endTime: slot?.end_time,
        slotId: slot?.id,
        attorneyId: artisan?.id || slot?.attorney_id,
        attorneyName: artisan?.full_name || 'Attorney',
        artisanPhone: artisan?.phone_e164 ?? null,
        artisanEmail: artisan?.email,
        artisanAvatar: null,
        // Legacy format for backward compatibility
        client_name: booking.client_name,
        client_phone: booking.client_phone,
        client_email: booking.client_email,
        service_description: booking.service_description,
        slot: booking.slot,
        artisan: artisan || { id: slot?.attorney_id, full_name: 'Attorney' },
      },
    })
  } catch (error) {
    logger.error('Error fetching booking:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error loading booking' } },
      { status: 500 }
    )
  }
}

// PATCH /api/bookings/[id] - Update booking status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id

    // Validate booking ID format
    const idValidation = bookingIdSchema.safeParse(bookingId)
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid booking ID' } },
        { status: 400 }
      )
    }

    // Verify authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = bookingPatchSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ success: false, error: { message: 'Invalid request', details: result.error.flatten() } }, { status: 400 })
    }
    const { status, notes } = result.data

    // Verify user has access to this booking
    const adminSupabase = createAdminClient()
    const { data: existingBooking, error: fetchError } = await adminSupabase
      .from('bookings')
      .select('id, client_id, client_email, slot:availability_slots(attorney_id)')
      .eq('id', bookingId)
      .single()

    if (fetchError || !existingBooking) {
      return NextResponse.json(
        { success: false, error: { message: 'Booking not found' } },
        { status: 404 }
      )
    }

    // Check authorization: must be owner or attorney
    const slotData = existingBooking.slot as Array<{ attorney_id: string }> | null
    const isOwner = existingBooking.client_id === user.id
    const isAttorney = slotData?.[0]?.attorney_id === user.id
    const isEmailMatch = user.email?.toLowerCase() === existingBooking.client_email?.toLowerCase()

    if (!isOwner && !isAttorney && !isEmailMatch) {
      return NextResponse.json(
        { success: false, error: { message: 'You are not authorized to modify this booking' } },
        { status: 403 }
      )
    }

    const updateData: Record<string, string | undefined> = {}
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await adminSupabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select()
      .single()

    if (error) {
      logger.error('Booking update error:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      booking: data,
    })
  } catch (error) {
    logger.error('Booking PATCH error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error during update' } },
      { status: 500 }
    )
  }
}
