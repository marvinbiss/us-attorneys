import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

// PATCH request schema
// Note: client_name, client_email, client_phone, service_description are NOT columns on bookings
const updateBookingSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
  notes: z.string().max(1000).optional(),
})

export const dynamic = 'force-dynamic'

// GET - Détails d'une réservation
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin with services:read permission
    const authResult = await requirePermission('services', 'read')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    if (!isValidUuid(params.id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Identifiant invalide' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        provider:providers!attorney_id (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      logger.warn('Booking detail query failed', { code: error.code, message: error.message })
      return NextResponse.json(
        { success: false, error: { message: 'Réservation introuvable ou table inexistante' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, booking })
  } catch (error) {
    logger.error('Admin booking details error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour une réservation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin with services:write permission
    const authResult = await requirePermission('services', 'write')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    if (!isValidUuid(params.id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Identifiant invalide' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const result = updateBookingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Erreur de validation', details: result.error.flatten() } },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({
        ...result.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      logger.error('Booking update failed', { code: error.code, message: error.message })
      return NextResponse.json(
        { success: false, error: { message: 'Impossible de mettre à jour la réservation' } },
        { status: 500 }
      )
    }

    // Log d'audit
    await logAdminAction(authResult.admin.id, 'booking.update', 'booking', params.id, result.data)

    return NextResponse.json({
      success: true,
      booking: data,
      message: 'Réservation mise à jour',
    })
  } catch (error) {
    logger.error('Admin booking update error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}

// DELETE - Annuler une réservation
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin with services:delete permission
    const authResult = await requirePermission('services', 'delete')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    if (!isValidUuid(params.id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Identifiant invalide' } },
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
      .eq('id', params.id)

    if (error) {
      logger.error('Booking cancel failed', { code: error.code, message: error.message })
      return NextResponse.json(
        { success: false, error: { message: 'Impossible d\'annuler la réservation' } },
        { status: 500 }
      )
    }

    // Log d'audit
    await logAdminAction(authResult.admin.id, 'booking.cancel', 'booking', params.id)

    return NextResponse.json({
      success: true,
      message: 'Réservation annulée',
    })
  } catch (error) {
    logger.error('Admin booking cancel error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}
