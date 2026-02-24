/**
 * GDPR Account Deletion API - ServicesArtisans
 * Allows users to request account deletion
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const deletePostSchema = z.object({
  reason: z.string().max(500).optional(),
  password: z.string().min(1),
  confirmText: z.literal('SUPPRIMER MON COMPTE'),
})

// POST /api/gdpr/delete - Request account deletion
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentification requise' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = deletePostSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ success: false, error: { message: 'Requête invalide', details: result.error.flatten() } }, { status: 400 })
    }
    const { reason, password, confirmText: _confirmText } = result.data

    // Verify password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    })

    if (signInError) {
      return NextResponse.json(
        { success: false, error: { message: 'Mot de passe invalide' } },
        { status: 401 }
      )
    }

    const adminSupabase = createAdminClient()

    // Check for existing pending request
    const { data: existingRequest } = await adminSupabase
      .from('deletion_requests')
      .select('id, user_id, reason, status, scheduled_deletion_at, created_at')
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .single()

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false, error: { message: 'Vous avez déjà une demande de suppression en cours' },
          scheduledDate: existingRequest.scheduled_deletion_at,
        },
        { status: 400 }
      )
    }

    // Check for pending bookings
    const { data: pendingBookings } = await adminSupabase
      .from('bookings')
      .select('id')
      .eq('provider_id', user.id)
      .in('status', ['pending', 'confirmed'])
      .gte('scheduled_date', new Date().toISOString().split('T')[0])

    if (pendingBookings && pendingBookings.length > 0) {
      return NextResponse.json(
        {
          success: false, error: { message: 'Vous avez des réservations en cours. Veuillez les annuler ou les terminer avant de supprimer votre compte.' },
          pendingBookingsCount: pendingBookings.length,
        },
        { status: 400 }
      )
    }

    // Schedule deletion for 30 days (GDPR grace period)
    const scheduledDate = new Date()
    scheduledDate.setDate(scheduledDate.getDate() + 30)

    const { data: deletionRequest, error } = await adminSupabase
      .from('deletion_requests')
      .insert({
        user_id: user.id,
        reason,
        status: 'scheduled',
        scheduled_deletion_at: scheduledDate.toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      requestId: deletionRequest.id,
      scheduledDate: scheduledDate.toISOString(),
      message: `Votre compte est programmé pour suppression le ${scheduledDate.toLocaleDateString('fr-FR')}. Vous pouvez annuler cette demande avant cette date.`,
    })
  } catch (error) {
    logger.error('GDPR deletion error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Échec du traitement de la demande de suppression' } },
      { status: 500 }
    )
  }
}

// DELETE /api/gdpr/delete - Cancel deletion request
export async function DELETE() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentification requise' } },
        { status: 401 }
      )
    }

    const adminSupabase = createAdminClient()

    const { data: deletionRequest, error } = await adminSupabase
      .from('deletion_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .select()
      .single()

    if (error || !deletionRequest) {
      return NextResponse.json(
        { success: false, error: { message: 'Aucune demande de suppression en cours trouvée' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Votre demande de suppression a été annulée',
    })
  } catch (error) {
    logger.error('GDPR cancel deletion error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Échec de l\'annulation de la demande de suppression' } },
      { status: 500 }
    )
  }
}

// GET /api/gdpr/delete - Get deletion status
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentification requise' } },
        { status: 401 }
      )
    }

    const adminSupabase = createAdminClient()

    const { data: deletionRequest } = await adminSupabase
      .from('deletion_requests')
      .select('id, user_id, reason, status, scheduled_deletion_at, cancelled_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      deletionRequest: deletionRequest || null,
    })
  } catch (error) {
    logger.error('GDPR deletion status error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Échec de la récupération du statut de suppression' } },
      { status: 500 }
    )
  }
}
