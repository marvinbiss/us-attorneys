import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const updateSchema = z.object({
  default_provider: z.enum(['claude', 'openai']).optional(),
  claude_model: z.string().max(100).optional(),
  claude_max_tokens: z.number().int().min(1).max(8000).optional(),
  claude_temperature: z.number().min(0).max(2).optional(),
  openai_model: z.string().max(100).optional(),
  openai_max_tokens: z.number().int().min(1).max(8000).optional(),
  openai_temperature: z.number().min(0).max(2).optional(),
  auto_reply_enabled: z.boolean().optional(),
  max_auto_replies: z.number().int().min(1).max(50).optional(),
  escalation_keywords: z.array(z.string().max(50)).max(50).optional(),
  attorney_system_prompt: z.string().max(5000).optional(),
  client_system_prompt: z.string().max(5000).optional(),
  municipality_system_prompt: z.string().max(5000).optional(),
}).strict()

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const authResult = await requirePermission('prospection', 'read')
    if (!authResult.success) return authResult.error

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('prospection_ai_settings')
      .select('id, default_provider, claude_model, claude_api_key_set, claude_max_tokens, claude_temperature, openai_model, openai_api_key_set, openai_max_tokens, openai_temperature, auto_reply_enabled, max_auto_replies, escalation_keywords, attorney_system_prompt, client_system_prompt, municipality_system_prompt, updated_by, updated_at')
      .limit(1)
      .single()

    if (error) {
      logger.error('Get AI settings error', error)
      return NextResponse.json({ success: false, error: { message: 'Error retrieving data' } }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('AI settings GET error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requirePermission('prospection', 'ai')
    if (!authResult.success || !authResult.admin) return authResult.error

    const supabase = createAdminClient()
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    // Retrieve the ID of the existing settings
    const { data: existing } = await supabase
      .from('prospection_ai_settings')
      .select('id')
      .limit(1)
      .single()

    if (!existing) {
      return NextResponse.json({ success: false, error: { message: 'Settings not found' } }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('prospection_ai_settings')
      .update({ ...parsed.data, updated_by: authResult.admin.id })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      logger.error('Update AI settings error', error)
      return NextResponse.json({ success: false, error: { message: 'Error during update' } }, { status: 500 })
    }

    await logAdminAction(authResult.admin.id, 'ai_settings.update', 'prospection_ai_settings', existing.id, {
      updated_fields: Object.keys(parsed.data),
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('AI settings PATCH error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
