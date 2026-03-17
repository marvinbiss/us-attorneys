import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAdminAction } from '@/lib/admin-auth'
import { createApiHandler } from '@/lib/api/handler'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  template_id: z.string().uuid().optional(),
  list_id: z.string().uuid().optional(),
  batch_size: z.number().int().min(1).max(10000).optional(),
  batch_delay_ms: z.number().int().min(0).max(60000).optional(),
  daily_send_limit: z.number().int().min(1).max(100000).optional(),
  ai_auto_reply: z.boolean().optional(),
  ai_provider: z.enum(['claude', 'openai']).optional(),
  ai_model: z.string().max(100).optional(),
  ai_system_prompt: z.string().max(5000).optional(),
  ai_max_tokens: z.number().int().min(1).max(8000).optional(),
  ai_temperature: z.number().min(0).max(2).optional(),
  scheduled_at: z.string().datetime().optional(),
}).strict()

export const dynamic = 'force-dynamic'

export const GET = createApiHandler(async (ctx) => {
  const id = ctx.params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('prospection_campaigns')
    .select('id, name, description, channel, audience_type, status, template_id, list_id, scheduled_at, started_at, completed_at, batch_size, ai_auto_reply, ai_provider, total_recipients, sent_count, delivered_count, replied_count, failed_count, estimated_cost, actual_cost, created_at, template:prospection_templates(id, name, channel), list:prospection_lists(id, name, contact_count)')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ success: false, error: { message: 'Campaign not found' } }, { status: 404 })
  }

  return NextResponse.json({ success: true, data })
}, { requireAdmin: true })

export const PATCH = createApiHandler(async (ctx) => {
  const id = ctx.params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const body = ctx.body

  // Strip HTML tags from text fields before storing
  const sanitizedData = { ...body }
  if (sanitizedData.name) sanitizedData.name = sanitizedData.name.replace(/<[^>]*>/g, '').trim()
  if (sanitizedData.description) sanitizedData.description = sanitizedData.description.replace(/<[^>]*>/g, '').trim()

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('prospection_campaigns')
    .update(sanitizedData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ success: false, error: { message: 'Resource not found' } }, { status: 404 })
    }
    logger.error('Update campaign error', error)
    return NextResponse.json({ success: false, error: { message: 'Error during update' } }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ success: false, error: { message: 'Resource not found' } }, { status: 404 })
  }

  await logAdminAction(ctx.user!.id, 'campaign.update', 'prospection_campaign', id, {
    updated_fields: Object.keys(body),
  })

  return NextResponse.json({ success: true, data })
}, { requireAdmin: true, bodySchema: updateSchema })

export const DELETE = createApiHandler(async (ctx) => {
  const id = ctx.params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Only delete campaigns in draft status
  const { data: campaign } = await supabase
    .from('prospection_campaigns')
    .select('status')
    .eq('id', id)
    .single()

  if (campaign?.status !== 'draft') {
    return NextResponse.json(
      { success: false, error: { message: 'Only draft campaigns can be deleted' } },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('prospection_campaigns')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('Delete campaign error', error)
    return NextResponse.json({ success: false, error: { message: 'Error during deletion' } }, { status: 500 })
  }

  await logAdminAction(ctx.user!.id, 'campaign.delete', 'prospection_campaign', id)

  return NextResponse.json({ success: true })
}, { requireAdmin: true })
