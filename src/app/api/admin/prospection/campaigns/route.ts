import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(['all', 'draft', 'scheduled', 'sending', 'paused', 'completed', 'cancelled']).optional().default('all'),
  channel: z.enum(['all', 'email', 'sms', 'whatsapp']).optional().default('all'),
})

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  channel: z.enum(['email', 'sms', 'whatsapp']),
  audience_type: z.enum(['attorney', 'client', 'municipality']),
  template_id: z.string().uuid().optional(),
  list_id: z.string().uuid().optional(),
  scheduled_at: z.string().optional(),
  batch_size: z.number().int().min(1).max(1000).optional(),
  batch_delay_ms: z.number().int().min(100).max(60000).optional(),
  daily_send_limit: z.number().int().min(1).optional(),
  ab_test_enabled: z.boolean().optional(),
  ab_variant_b_template_id: z.string().uuid().optional(),
  ab_split_percent: z.number().int().min(10).max(90).optional(),
  ai_auto_reply: z.boolean().optional(),
  ai_provider: z.enum(['claude', 'openai']).optional(),
  ai_model: z.string().optional(),
  ai_system_prompt: z.string().optional(),
  ai_max_tokens: z.number().int().min(50).max(4000).optional(),
  ai_temperature: z.number().min(0).max(2).optional(),
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
        { success: false, error: { message: 'Invalid parameters' } },
        { status: 400 }
      )
    }

    const { page, limit, status, channel } = parsed.data
    const offset = (page - 1) * limit

    let query = supabase
      .from('prospection_campaigns')
      .select('*, template:prospection_templates(id,name,channel), list:prospection_lists(id,name,contact_count)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status !== 'all') query = query.eq('status', status)
    if (channel !== 'all') query = query.eq('channel', channel)

    const { data, count, error } = await query

    if (error) {
      logger.warn('List campaigns query failed, returning empty list', { code: error.code, message: error.message })
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page, pageSize: limit, total: 0, totalPages: 0 },
      })
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
    logger.error('Campaigns GET error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission('prospection', 'write')
    if (!authResult.success || !authResult.admin) return authResult.error

    const supabase = createAdminClient()
    const body = await request.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    // Strip HTML tags from text fields before storing
    const sanitizedData = { ...parsed.data }
    if (sanitizedData.name) sanitizedData.name = sanitizedData.name.replace(/<[^>]*>/g, '').trim()
    if (sanitizedData.description) sanitizedData.description = sanitizedData.description.replace(/<[^>]*>/g, '').trim()

    const { data, error } = await supabase
      .from('prospection_campaigns')
      .insert({
        ...sanitizedData,
        status: sanitizedData.scheduled_at ? 'scheduled' : 'draft',
        created_by: authResult.admin.id,
      })
      .select()
      .single()

    if (error) {
      logger.error('Create campaign error', error)
      return NextResponse.json({ success: false, error: { message: 'Error during creation' } }, { status: 500 })
    }

    await logAdminAction(authResult.admin.id, 'campaign.create', 'prospection_campaign', data.id, {
      name: sanitizedData.name,
      channel: sanitizedData.channel,
      audience_type: sanitizedData.audience_type,
    })

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    logger.error('Campaigns POST error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
