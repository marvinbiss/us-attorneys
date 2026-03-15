import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(['all', 'open', 'ai_handling', 'human_required', 'resolved', 'archived']).optional().default('all'),
  channel: z.enum(['all', 'email', 'sms', 'whatsapp']).optional().default('all'),
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
      return NextResponse.json({ success: false, error: { message: 'Invalid parameters' } }, { status: 400 })
    }

    const { page, limit, status, channel } = parsed.data
    const offset = (page - 1) * limit

    let query = supabase
      .from('prospection_conversations')
      .select('*, contact:prospection_contacts(id,contact_name,company_name,email,phone,contact_type)', { count: 'exact' })
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (status !== 'all') query = query.eq('status', status)
    if (channel !== 'all') query = query.eq('channel', channel)

    const { data, count, error } = await query

    if (error) {
      logger.error('List conversations error', error)
      return NextResponse.json({ success: false, error: { message: 'Error retrieving data' } }, { status: 500 })
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
    logger.error('Conversations GET error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
