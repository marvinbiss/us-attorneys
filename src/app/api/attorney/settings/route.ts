/**
 * GET/PUT /api/attorney/settings — Attorney private settings
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAttorney } from '@/lib/auth/attorney-guard'
import { apiSuccess, apiError } from '@/lib/api/handler'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const settingsUpdateSchema = z.object({
  phone: z.string().max(20).optional(),
  name: z.string().min(1).max(100).optional(),
})

export async function GET() {
  try {
    const { error, user, supabase } = await requireAttorney()
    if (error) return error

    const { data: provider } = await supabase
      .from('attorneys')
      .select('id, name, phone, email, is_active, is_verified')
      .eq('user_id', user.id)
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .eq('id', user.id)
      .single()

    return apiSuccess({
      profile: profile || null,
      provider: provider || null,
    })
  } catch (error: unknown) {
    logger.error('Settings GET error:', error)
    return apiError('INTERNAL_ERROR', 'Server error', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, user, supabase } = await requireAttorney()
    if (error) return error

    const body = await request.json()
    const result = settingsUpdateSchema.safeParse(body)
    if (!result.success) {
      return apiError('VALIDATION_ERROR', 'Validation error', 400)
    }
    const { phone, name } = result.data

    // Update provider if linked
    const { data: provider } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (provider) {
      const updates: Record<string, string> = {}
      if (phone !== undefined) updates.phone = phone
      if (name !== undefined) updates.name = name

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('attorneys')
          .update(updates)
          .eq('id', provider.id)

        if (updateError) {
          logger.error('Settings PUT provider update error:', updateError)
          return apiError('DATABASE_ERROR', 'Update error', 500)
        }
      }
    }

    // Update profile name
    if (name !== undefined) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: name })
        .eq('id', user.id)

      if (profileError) {
        logger.error('Settings PUT profile update error:', profileError)
        return apiError('DATABASE_ERROR', 'Profile update error', 500)
      }
    }

    return apiSuccess({ message: 'Settings updated successfully' })
  } catch (error: unknown) {
    logger.error('Settings PUT error:', error)
    return apiError('INTERNAL_ERROR', 'Server error', 500)
  }
}
