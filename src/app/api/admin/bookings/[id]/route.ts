import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { createApiHandler } from '@/lib/api/handler'
import { z } from 'zod'

// PATCH request schema
// Note: client_name, client_email, client_phone, service_description are NOT columns on bookings
const updateBookingSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
  notes: z.string().max(1000).optional(),
})

export const dynamic = 'force-dynamic'

// GET - Booking details
export const GET = createApiHandler(async ({ params }) => {
  // Verify admin with services:read permission
  const authResult = await requirePermission('services', 'read')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  const id = params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      attorney:attorneys!attorney_id (
        id,
        name,
        email,
        phone
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    logger.warn('Booking detail query failed', { code: error.code, message: error.message })
    return NextResponse.json(
      { success: false, error: { message: 'Booking not found or table does not exist' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, booking })
})

// PATCH - Update a booking
export const PATCH = createApiHandler(async ({ request, params }) => {
  // Verify admin with services:write permission
  const authResult = await requirePermission('services', 'write')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  const id = params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const body = await request.json()
  const result = updateBookingSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Validation error', details: result.error.flatten() } },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({
      ...result.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Booking update failed', { code: error.code, message: error.message })
    return NextResponse.json(
      { success: false, error: { message: 'Unable to update the booking' } },
      { status: 500 }
    )
  }

  // Audit log
  await logAdminAction(authResult.admin.id, 'booking.update', 'booking', id, result.data)

  return NextResponse.json({
    success: true,
    booking: data,
    message: 'Booking updated',
  })
})

// DELETE - Cancel a booking
export const DELETE = createApiHandler(async ({ params }) => {
  // Verify admin with services:delete permission
  const authResult = await requirePermission('services', 'delete')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  const id = params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    logger.error('Booking cancel failed', { code: error.code, message: error.message })
    return NextResponse.json(
      { success: false, error: { message: 'Unable to cancel the booking' } },
      { status: 500 }
    )
  }

  // Audit log
  await logAdminAction(authResult.admin.id, 'booking.cancel', 'booking', id)

  return NextResponse.json({
    success: true,
    message: 'Booking cancelled',
  })
})
