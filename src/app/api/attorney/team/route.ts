/**
 * Artisan Equipe API
 * GET:  List team members for the connected artisan
 * POST: Add a new team member (Zod validation)
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireArtisan } from '@/lib/auth/artisan-guard'
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
    const { error: guardError, user, supabase } = await requireArtisan()
    if (guardError) return guardError

    const { data, error } = await supabase
      .from('team_members')
      .select('id, name, email, phone, role, color, avatar_url, is_active, created_at')
      .eq('attorney_id', user!.id)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Error fetching team members:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Erreur lors du chargement de l\'équipe' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ members: data ?? [] })
  } catch (error) {
    logger.error('Equipe GET error:', error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { error: guardError, user, supabase } = await requireArtisan()
    if (guardError) return guardError

    const body: unknown = await request.json()
    const validation = memberSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Données invalides', details: validation.error.flatten() } },
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
        { success: false, error: { message: 'Erreur lors de l\'ajout du membre' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ member: data }, { status: 201 })
  } catch (error) {
    logger.error('Equipe POST error:', error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}
