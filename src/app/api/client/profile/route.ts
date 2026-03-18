/**
 * Client Profile API
 * GET: Fetch client profile
 * PUT: Update client profile
 */

import { createClient } from '@/lib/supabase/server'
import { createApiHandler, apiSuccess, apiError } from '@/lib/api/handler'
import { logger } from '@/lib/logger'
import { withTimeout } from '@/lib/api/timeout'
import { z } from 'zod'

// PUT request schema
const updateClientProfileSchema = z.object({
  full_name: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
})

export const dynamic = 'force-dynamic'

export const GET = createApiHandler(
  async ({ user }) => {
    const supabase = await createClient()

    // Fetch profile
    const { data: profile, error: profileError } = await withTimeout(
      supabase
        .from('profiles')
        .select('id, email, full_name, phone_e164, average_rating, review_count, created_at, updated_at')
        .eq('id', user!.id)
        .single()
    )

    if (profileError) {
      logger.error('Error fetching profile:', profileError)
      return apiError('DATABASE_ERROR', 'Error retrieving profile', 500)
    }

    return apiSuccess({ profile })
  },
  { requireAuth: true }
)

export const PUT = createApiHandler<z.infer<typeof updateClientProfileSchema>>(
  async ({ user, body }) => {
    const supabase = await createClient()
    const { full_name, phone } = body

    // Build update object with only defined fields
    const updateData: Record<string, string | undefined> = {
      updated_at: new Date().toISOString(),
    }
    if (full_name !== undefined) updateData.full_name = full_name
    if (phone !== undefined) updateData.phone_e164 = phone

    // Update profile — only columns that exist on profiles table
    const { data: profile, error: updateError } = await withTimeout(
      supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user!.id)
        .select()
        .single()
    )

    if (updateError) {
      logger.error('Error updating profile:', updateError)
      return apiError('DATABASE_ERROR', 'Error updating profile', 500)
    }

    return apiSuccess({
      profile,
      message: 'Profile updated successfully',
    })
  },
  { requireAuth: true, bodySchema: updateClientProfileSchema }
)
