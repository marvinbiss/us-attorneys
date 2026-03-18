/**
 * Attorney Team API
 * GET:  List team members for the connected attorney
 * POST: Add a new team member (Zod validation)
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAttorney } from '@/lib/auth/attorney-guard'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const memberSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  role: z.string().min(1).max(255),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export async function GET() {
  try {
    const { error: guardError, user, supabase } = await requireAttorney()
    if (guardError) return guardError

    const { data, error } = await supabase
      .from('team_members')
      .select('id, name, email, phone, role, color, avatar_url, is_active, created_at')
      .eq('attorney_id', user!.id)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Error fetching team members:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Error loading team' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ members: data ?? [] })
  } catch (error: unknown) {
    logger.error('Team GET error:', error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { error: guardError, user, supabase } = await requireAttorney()
    if (guardError) return guardError

    const body: unknown = await request.json()
    const validation = memberSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data', details: validation.error.flatten() } },
        { status: 400 }
      )
    }

    const { name, email, phone, role, color } = validation.data

    const { data, error } = await supabase
      .from('team_members')
      .insert({
        attorney_id: user!.id,
        name,
        email,
        phone: phone ?? null,
        role,
        color: color ?? '#3b82f6',
        is_active: true,
      })
      .select('id, name, email, phone, role, color, avatar_url, is_active, created_at')
      .single()

    if (error) {
      logger.error('Error inserting team member:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Error adding team member' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ member: data }, { status: 201 })
  } catch (error: unknown) {
    logger.error('Team POST error:', error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
