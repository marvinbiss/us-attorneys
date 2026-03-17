import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAdminAction } from '@/lib/admin-auth'
import { createApiHandler } from '@/lib/api/handler'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['open', 'ai_handling', 'human_required', 'resolved', 'archived']).optional(),
  assigned_to: z.string().uuid().optional(),
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

  const { data: conversation, error: convError } = await supabase
    .from('prospection_conversations')
    .select('id, campaign_id, contact_id, channel, status, ai_provider, ai_replies_count, assigned_to, last_message_at, created_at, contact:prospection_contacts(id, contact_name, company_name, email, phone, contact_type, city), campaign:prospection_campaigns(id, name, channel)')
    .eq('id', id)
    .single()

  if (convError || !conversation) {
    return NextResponse.json({ success: false, error: { message: 'Conversation not found' } }, { status: 404 })
  }

  const { data: messages, error: msgError } = await supabase
    .from('prospection_conversation_messages')
    .select('id, direction, sender_type, content, ai_provider, ai_model, ai_prompt_tokens, ai_completion_tokens, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  if (msgError) {
    logger.error('Get conversation messages error', msgError)
  }

  return NextResponse.json({
    success: true,
    data: { ...conversation, messages: messages || [] },
  })
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

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('prospection_conversations')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ success: false, error: { message: 'Resource not found' } }, { status: 404 })
    }
    logger.error('Update conversation error', error)
    return NextResponse.json({ success: false, error: { message: 'Error during update' } }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ success: false, error: { message: 'Resource not found' } }, { status: 404 })
  }

  await logAdminAction(ctx.user!.id, 'conversation.update', 'prospection_conversation', id, {
    updated_fields: Object.keys(body),
    status: body.status,
  })

  return NextResponse.json({ success: true, data })
}, { requireAdmin: true, bodySchema: updateSchema })
