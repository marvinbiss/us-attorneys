/**
 * GDPR Data Export API - ServicesArtisans
 * Allows users to request and download their personal data
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const exportPostSchema = z.object({
  format: z.enum(['json', 'csv']).optional().default('json'),
})

// POST /api/gdpr/export - Request data export
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
    const result = exportPostSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ success: false, error: { message: 'Requête invalide', details: result.error.flatten() } }, { status: 400 })
    }
    const { format } = result.data

    const adminSupabase = createAdminClient()

    // Check for existing pending request
    const { data: existingRequest } = await adminSupabase
      .from('data_export_requests')
      .select('id, user_id, format, status, completed_at, created_at')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: { message: 'Vous avez déjà une demande d\'export en cours' }, requestId: existingRequest.id },
        { status: 400 }
      )
    }

    // Create export request
    const { data: exportRequest, error } = await adminSupabase
      .from('data_export_requests')
      .insert({
        user_id: user.id,
        format,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    // Process immediately for small datasets
    const exportData = await collectUserData(user.id)

    // Update request with data
    const { error: updateError } = await adminSupabase
      .from('data_export_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        download_url: null,
      })
      .eq('id', exportRequest.id)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      requestId: exportRequest.id,
      data: exportData,
      message: 'Votre export de données est prêt',
    })
  } catch (error) {
    logger.error('GDPR export error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Échec du traitement de la demande d\'export' } },
      { status: 500 }
    )
  }
}

// GET /api/gdpr/export - Get export status or download
export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('requestId')

    if (requestId) {
      const { data: exportRequest } = await adminSupabase
        .from('data_export_requests')
        .select('id, user_id, format, status, completed_at, created_at')
        .eq('id', requestId)
        .eq('user_id', user.id)
        .single()

      if (!exportRequest) {
        return NextResponse.json(
          { success: false, error: { message: 'Demande d\'export introuvable' } },
          { status: 404 }
        )
      }

      return NextResponse.json(exportRequest)
    }

    // Get all requests for user
    const { data: requests } = await adminSupabase
      .from('data_export_requests')
      .select('id, user_id, format, status, completed_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ requests: requests || [] })
  } catch (error) {
    logger.error('GDPR export status error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Échec de la récupération du statut d\'export' } },
      { status: 500 }
    )
  }
}

// Collect all user data for export
async function collectUserData(userId: string) {
  const adminSupabase = createAdminClient()

  // Fetch profile first to get user email
  const profileResult = await adminSupabase
    .from('profiles')
    .select('id, email, full_name, phone_e164, role, subscription_plan, created_at, updated_at')
    .eq('id', userId)
    .single()

  const userEmail: string | null = profileResult.data?.email ?? null

  const [
    bookingsResult,
    reviewsReceivedResult,
    reviewsWrittenResult,
    messagesResult,
    preferencesResult,
  ] = await Promise.all([
    adminSupabase
      .from('bookings')
      .select('id, client_id, provider_id, status, scheduled_date, address, city, postal_code, total_amount, payment_status, created_at')
      .or(`client_id.eq.${userId},provider_id.eq.${userId}`),

    adminSupabase
      .from('reviews')
      .select('id, rating, comment, created_at, artisan_id')
      .eq('artisan_id', userId),

    userEmail
      ? adminSupabase
          .from('reviews')
          .select('id, rating, comment, created_at, artisan_id')
          .eq('client_email', userEmail)
      : Promise.resolve({ data: [] }),

    adminSupabase
      .from('messages')
      .select('id, conversation_id, sender_id, sender_type, content, read_at, created_at')
      .eq('sender_id', userId),

    adminSupabase
      .from('user_preferences')
      .select('id, user_id, created_at')
      .eq('user_id', userId)
      .single(),
  ])

  return {
    exportDate: new Date().toISOString(),
    profile: profileResult.data || null,
    bookings: bookingsResult.data || [],
    reviews_received: reviewsReceivedResult.data || [],
    reviews_written: reviewsWrittenResult.data || [],
    messages: messagesResult.data || [],
    preferences: preferencesResult.data || null,
  }
}
