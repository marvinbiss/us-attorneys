/**
 * Attorney Team [id] API
 * PATCH:  Update a team member (Zod validation)
 * DELETE: Remove a team member
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAttorney } from '@/lib/auth/attorney-guard'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const memberUpdateSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  role: z.string().min(1).max(255),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  is_active: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error: guardError, user, supabase } = await requireAttorney()
    if (guardError) return guardError

    const body: unknown = await request.json()
    const validation = memberUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data', details: validation.error.flatten() } },
        { status: 400 }
      )
    }

    const { name, email, phone, role, color, is_active } = validation.data

    // Verify ownership before update
    const { data: existing, error: fetchError } = await supabase
      .from('team_members')
      .select('id')
      .eq('id', params.id)
      .eq('attorney_id', user!.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Team member not found' } },
        { status: 404 }
      )
    }

    const updatePayload: Record<string, unknown> = { name, email, role }
    if (phone !== undefined) updatePayload.phone = phone || null
    if (color !== undefined) updatePayload.color = color
    if (is_active !== undefined) updatePayload.is_active = is_active

    const { data, error } = await supabase
      .from('team_members')
      .update(updatePayload)
      .eq('id', params.id)
      .eq('attorney_id', user!.id)
      .select('id, name, email, phone, role, color, avatar_url, is_active, created_at')
      .single()

    if (error) {
      logger.error('Error updating team member:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Error updating team member' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ member: data })
  } catch (error: unknown) {
    logger.error('Team PATCH error:', error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error: guardError, user, supabase } = await requireAttorney()
    if (guardError) return guardError

    // Verify ownership before delete
    const { data: existing, error: fetchError } = await supabase
      .from('team_members')
      .select('id')
      .eq('id', params.id)
      .eq('attorney_id', user!.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Team member not found' } },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', params.id)
      .eq('attorney_id', user!.id)

    if (error) {
      logger.error('Error deleting team member:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Error deleting team member' } },
        { status: 500 }
      )
    }

    return new NextResponse(null, { status: 204 })
  } catch (error: unknown) {
    logger.error('Team DELETE error:', error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
