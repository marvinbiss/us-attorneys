import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'
import { createApiHandler } from '@/lib/api/handler'

// PATCH request schema
const updateUserSchema = z.object({
  full_name: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  user_type: z.enum(['client', 'attorney']).optional(),
  name: z.string().max(100).optional(),
  bar_number: z.string().max(20).optional(),
  description: z.string().max(1000).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  postal_code: z.string().max(10).optional(),
  is_verified: z.boolean().optional(),
})

export const dynamic = 'force-dynamic'

// GET - User details
export const GET = createApiHandler(async ({ params }) => {
  // Verify admin with users:read permission
  const authResult = await requirePermission('users', 'read')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  const userId = params?.id
  if (!userId || !isValidUuid(userId)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Get user from Supabase Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)

  if (authError || !authUser.user) {
    return NextResponse.json(
      { success: false, error: { message: 'User not found' } },
      { status: 404 }
    )
  }

  const user = authUser.user

  // Try to get profile if table exists
  let profile: Record<string, unknown> = {}
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, is_admin, role, phone_e164, average_rating, review_count')
      .eq('id', userId)
      .single()
    if (data) profile = data
  } catch {
    // profiles table doesn't exist
  }

  // Get provider data if exists
  let attorneyData = null
  try {
    const { data: provider } = await supabase
      .from('attorneys')
      .select('id, name, slug, email, phone, bar_number, is_verified, is_active, stable_id, noindex, address_city, address_zip, address_line1, address_state, rating_average, review_count, created_at, specialty:specialties!primary_specialty_id(name, slug)')
      .eq('user_id', userId)
      .maybeSingle()
    attorneyData = provider
  } catch {
    // No provider or table doesn't exist
  }

  // Get bookings count
  let bookingsCount = 0
  try {
    const { count } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .or(`attorney_id.eq.${userId},client_id.eq.${userId}`)
    bookingsCount = count || 0
  } catch {
    // bookings table doesn't exist
  }

  // Get reviews count (reviews has client_email, not client_id FK to profiles)
  let reviewsCount = 0
  try {
    const clientEmail = user.email
    if (clientEmail) {
      const { count } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('client_email', clientEmail)
      reviewsCount = count || 0
    }
  } catch {
    // reviews table doesn't exist
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      full_name: profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || null,
      phone: profile.phone_e164 || user.user_metadata?.phone || null,
      user_type: profile.role === 'attorney' ? 'attorney' : (user.user_metadata?.is_attorney ? 'attorney' : 'client'),
      is_verified: !!user.email_confirmed_at,
      is_banned: user.banned_until !== null,
      subscription_plan: null,
      subscription_status: null,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      provider: attorneyData,
      stats: {
        bookings: bookingsCount,
        reviews: reviewsCount,
      },
      ...profile,
    },
  })
})

// PATCH - Update a user
export const PATCH = createApiHandler(async ({ request, params }) => {
  // Verify admin with users:write permission
  const authResult = await requirePermission('users', 'write')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  const userId = params?.id
  if (!userId || !isValidUuid(userId)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const body = await request.json()
  const result = updateUserSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Validation error', details: result.error.flatten() } },
      { status: 400 }
    )
  }

  // Update user metadata in Supabase Auth
  const userMetadataUpdates: Record<string, unknown> = {}
  if (result.data.full_name !== undefined) userMetadataUpdates.full_name = result.data.full_name
  if (result.data.phone !== undefined) userMetadataUpdates.phone = result.data.phone
  if (result.data.user_type !== undefined) userMetadataUpdates.is_attorney = result.data.user_type === 'attorney'

  if (Object.keys(userMetadataUpdates).length > 0) {
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: userMetadataUpdates,
    })
    if (authError) {
      logger.error('Auth update error', authError)
    }
  }

  // Try to update profile if table exists
  try {
    // Only include columns that actually exist on profiles table
    const allowedFields = [
      'full_name',
    ]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in result.data) {
        updates[field] = result.data[field as keyof typeof result.data]
      }
    }
    // Sync profiles.role when user_type changes (attorney/client)
    if (result.data.user_type) {
      updates.role = result.data.user_type === 'attorney' ? 'attorney' : 'client'
    }
    updates.updated_at = new Date().toISOString()

    await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...updates,
      })
  } catch {
    // profiles table doesn't exist
  }

  // Log the action
  await logAdminAction(authResult.admin.id, 'user.update', 'user', userId, result.data)

  return NextResponse.json({
    success: true,
    message: 'User updated',
  })
})

// DELETE - Delete a user
export const DELETE = createApiHandler(async ({ params }) => {
  // Verify admin with users:delete permission
  const authResult = await requirePermission('users', 'delete')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  const userId = params?.id
  if (!userId || !isValidUuid(userId)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Log the deletion first
  await logAdminAction(authResult.admin.id, 'user.delete', 'user', userId)

  // Ban the user instead of hard delete (safer)
  const { error: banError } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: '876000h', // ~100 years
  })

  if (banError) {
    logger.error('User ban error', banError)
    throw banError
  }

  // Try to update profiles table if exists (only columns that exist)
  try {
    await supabase
      .from('profiles')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
  } catch {
    // profiles table doesn't exist
  }

  // Deactivate provider if exists
  try {
    await supabase
      .from('attorneys')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  } catch {
    // providers table doesn't exist or no provider
  }

  return NextResponse.json({
    success: true,
    message: 'Deleted user',
  })
})
