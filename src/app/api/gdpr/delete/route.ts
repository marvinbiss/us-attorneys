/**
 * GDPR Account Deletion API - US Attorneys
 * Allows users to request account deletion
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiHandler } from '@/lib/api/handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const deletePostSchema = z.object({
  reason: z.string().max(500).optional(),
  password: z.string().min(1),
  confirmText: z.literal('SUPPRIMER MON COMPTE'),
})

// POST /api/gdpr/delete - Request account deletion
export const dynamic = 'force-dynamic'

export const POST = createApiHandler(async ({ request, user }) => {
  const supabase = await createClient()

  const body = await request.json()
  const result = deletePostSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ success: false, error: { message: 'Invalid request', details: result.error.flatten() } }, { status: 400 })
  }
  const { reason, password, confirmText: _confirmText } = result.data

  // Verify password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user!.email!,
    password,
  })

  if (signInError) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid password' } },
      { status: 401 }
    )
  }

  const adminSupabase = createAdminClient()

  // Check for existing pending request
  const { data: existingRequest } = await adminSupabase
    .from('deletion_requests')
    .select('id, user_id, reason, status, scheduled_deletion_at, created_at')
    .eq('user_id', user!.id)
    .eq('status', 'scheduled')
    .single()

  if (existingRequest) {
    return NextResponse.json(
      {
        success: false, error: { message: 'You already have a deletion request in progress' },
        scheduledDate: existingRequest.scheduled_deletion_at,
      },
      { status: 400 }
    )
  }

  // Check for pending bookings
  const { data: pendingBookings } = await adminSupabase
    .from('bookings')
    .select('id')
    .eq('attorney_id', user!.id)
    .in('status', ['pending', 'confirmed'])
    .gte('scheduled_date', new Date().toISOString().split('T')[0])

  if (pendingBookings && pendingBookings.length > 0) {
    return NextResponse.json(
      {
        success: false, error: { message: 'You have active bookings. Please cancel or complete them before deleting your account.' },
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
      user_id: user!.id,
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
    message: `Your account is scheduled for deletion on ${scheduledDate.toLocaleDateString('en-US')}. You can cancel this request before that date.`,
  })
}, { requireAuth: true })

// DELETE /api/gdpr/delete - Cancel deletion request
export const DELETE = createApiHandler(async ({ user }) => {
  const adminSupabase = createAdminClient()

  const { data: deletionRequest, error } = await adminSupabase
    .from('deletion_requests')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('user_id', user!.id)
    .eq('status', 'scheduled')
    .select()
    .single()

  if (error || !deletionRequest) {
    return NextResponse.json(
      { success: false, error: { message: 'No pending deletion request found' } },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Your deletion request has been cancelled',
  })
}, { requireAuth: true })

// GET /api/gdpr/delete - Get deletion status
export const GET = createApiHandler(async ({ user }) => {
  const adminSupabase = createAdminClient()

  const { data: deletionRequest } = await adminSupabase
    .from('deletion_requests')
    .select('id, user_id, reason, status, scheduled_deletion_at, cancelled_at, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({
    deletionRequest: deletionRequest || null,
  })
}, { requireAuth: true })
