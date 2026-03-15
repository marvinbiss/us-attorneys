/**
 * GET/PUT /api/attorney/settings — Attorney private settings
 * No SEO, INSEE, Pappers, or Google reviews data.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireArtisan } from '@/lib/auth/artisan-guard'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const settingsUpdateSchema = z.object({
  phone: z.string().max(20).optional(),
  name: z.string().min(1).max(100).optional(),
})

export async function GET() {
  try {
    const { error, user, supabase } = await requireArtisan()
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

    return NextResponse.json({
      profile: profile || null,
      provider: provider || null,
    })
  } catch (error) {
    logger.error('Settings GET error:', error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, user, supabase } = await requireArtisan()
    if (error) return error

    const body = await request.json()
    const result = settingsUpdateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Validation error', details: result.error.flatten() } },
        { status: 400 }
      )
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
          return NextResponse.json({ success: false, error: { message: 'Update error' } }, { status: 500 })
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
        return NextResponse.json({ success: false, error: { message: 'Profile update error' } }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Settings PUT error:', error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
