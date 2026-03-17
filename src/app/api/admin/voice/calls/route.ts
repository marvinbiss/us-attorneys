import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { createApiHandler } from '@/lib/api/handler'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  score: z.enum(['A', 'B', 'C', 'disqualified']).optional(),
  status: z.string().max(50).optional(),
})

export const dynamic = 'force-dynamic'

export const GET = createApiHandler(async ({ request }) => {
  const authResult = await requirePermission('prospection', 'read')
  if (!authResult.success) return authResult.error!

  const supabase = createAdminClient()
  const searchParams = Object.fromEntries(new URL(request.url).searchParams)
  const parsed = querySchema.safeParse(searchParams)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid parameters', details: parsed.error.flatten() } },
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
      { success: false, error: { message: 'Error retrieving calls' } },
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
})
