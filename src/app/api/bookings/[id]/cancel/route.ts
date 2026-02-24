import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCancellationNotification, logNotification } from '@/lib/notifications/email'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// POST request schema
const cancelBookingSchema = z.object({
  cancelledBy: z.enum(['client', 'artisan']),
  reason: z.string().max(500).optional(),
})

// POST /api/bookings/[id]/cancel - Cancel a booking
export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const result = cancelBookingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Erreur de validation', details: result.error.flatten() },
        { status: 400 }
      )
    }
    const { cancelledBy, reason } = result.data

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    // Fetch booking info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, client_id, provider_id, status, scheduled_date, client_name, client_email, service_description')
      .eq('id', id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Réservation introuvable' },
        { status: 404 }
      )
    }

    // Verify ownership: only the client or the provider can cancel
    if (booking.client_id !== user.id && booking.provider_id !== user.id) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à annuler cette réservation' },
        { status: 403 }
      )
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cette réservation est déjà annulée' },
        { status: 400 }
      )
    }

    // Check if cancellation is allowed (at least 24h before)
    const bookingDate = new Date(booking.scheduled_date)
    const now = new Date()
    const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilBooking < 24 && cancelledBy === 'client') {
      return NextResponse.json(
        { error: 'Les annulations doivent être effectuées au moins 24h à l\'avance' },
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

    // Fetch artisan details for notification
    // Uses admin client: RLS policy 328 restricts cross-user profile reads
    const adminSupabase = createAdminClient()
    const { data: artisan } = await adminSupabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', booking.provider_id)
      .single()

    // Format date for email
    const formattedDate = new Date(booking.scheduled_date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    // Send cancellation notification (non-blocking)
    if (artisan?.email) {
      sendCancellationNotification({
        bookingId: id,
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        artisanName: artisan.full_name || 'Artisan',
        artisanEmail: artisan.email,
        serviceName: booking.service_description || 'Service',
        date: formattedDate,
        startTime: new Date(booking.scheduled_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        endTime: '',
        cancelledBy,
        reason,
      }).then(async (result) => {
        await logNotification(supabase, {
          bookingId: id,
          type: 'cancellation',
          status: result.clientNotification.success ? 'sent' : 'failed',
          recipientEmail: booking.client_email,
          errorMessage: result.clientNotification.error,
        })
      }).catch((err) => {
        logger.error('Failed to send cancellation notifications:', err)
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Réservation annulée avec succès',
    })
  } catch (error) {
    logger.error('Error cancelling booking:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'annulation' },
      { status: 500 }
    )
  }
}
