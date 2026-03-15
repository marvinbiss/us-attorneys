import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// GET query params schema
const messagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(['all', 'active', 'archived', 'blocked']).optional().default('all'),
})

export const dynamic = 'force-dynamic'

// GET - Liste des conversations
export async function GET(request: NextRequest) {
  try {
    // Verify admin with users:read permission
    const authResult = await requirePermission('users', 'read')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    const supabase = createAdminClient()

    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      status: searchParams.get('status') || 'all',
    }
    const result = messagesQuerySchema.safeParse(queryParams)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid parameters', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { page, limit } = result.data

    const offset = (page - 1) * limit

    let query = supabase
      .from('conversations')
      .select(`
        *,
        client:profiles!client_id (
          id,
          email,
          full_name
        ),
        attorney:attorneys!attorney_id (
          id,
          name
        )
      `, { count: 'exact' })

    const { data: conversations, count, error } = await query
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      // If the conversations table doesn't exist or FK fails, return empty
      logger.warn('Conversations query failed, returning empty list')
      return NextResponse.json({
        success: true,
        conversations: [],
        total: 0,
        page,
        totalPages: 0,
      })
    }

    return NextResponse.json({
      success: true,
      conversations: conversations || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    logger.error('Admin messages list error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
