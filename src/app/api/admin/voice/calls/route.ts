import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  score: z.enum(['A', 'B', 'C', 'disqualified']).optional(),
  status: z.string().max(50).optional(),
})

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermission('prospection', 'read')
    if (!authResult.success) return authResult.error

    const supabase = createAdminClient()
    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = querySchema.safeParse(params)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Paramètres invalides', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const { page, limit, score, status } = parsed.data
    const offset = (page - 1) * limit

    let query = supabase
      .from('voice_calls')
      .select('*, contact:contact_id(id, contact_name, phone_e164, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (score) query = query.eq('qualification_score', score)
    if (status) query = query.eq('status', status)

    const { data, count, error } = await query

    if (error) {
      logger.error('Voice calls list error', error)
      return NextResponse.json(
        { success: false, error: { message: 'Erreur lors de la récupération des appels' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize: limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    logger.error('Voice calls GET error', error as Error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}
