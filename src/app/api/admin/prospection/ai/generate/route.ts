import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { generateWithFallback } from '@/lib/prospection/ai-response'
import type { ProspectionContact, ProspectionConversationMessage } from '@/types/prospection'
import { z } from 'zod'

const generateSchema = z.object({
  conversation_id: z.string().uuid(),
})

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission('prospection', 'ai')
    if (!authResult.success) return authResult.error

    const body = await request.json()
    const parsed = generateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { message: 'Données invalides' } }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Charger la conversation, le contact et les messages
    const { data: conversation } = await supabase
      .from('prospection_conversations')
      .select('*, contact:prospection_contacts(*), campaign:prospection_campaigns(*)')
      .eq('id', parsed.data.conversation_id)
      .single()

    if (!conversation) {
      return NextResponse.json({ success: false, error: { message: 'Conversation non trouvée' } }, { status: 404 })
    }

    const { data: messages } = await supabase
      .from('prospection_conversation_messages')
      .select('id, conversation_id, direction, sender_type, content, ai_provider, ai_model, ai_prompt_tokens, ai_completion_tokens, ai_cost, external_id, created_at')
      .eq('conversation_id', parsed.data.conversation_id)
      .order('created_at', { ascending: true })

    // Charger les settings IA
    const { data: aiSettings } = await supabase
      .from('prospection_ai_settings')
      .select('id, default_provider, claude_model, claude_max_tokens, claude_temperature, openai_model, openai_max_tokens, openai_temperature, auto_reply_enabled, max_auto_replies, escalation_keywords, artisan_system_prompt, client_system_prompt, mairie_system_prompt, updated_by, updated_at')
      .limit(1)
      .single()

    const contact = conversation.contact as ProspectionContact
    const provider = conversation.ai_provider || aiSettings?.default_provider || 'claude'
    const model = conversation.ai_model ||
      (provider === 'claude' ? aiSettings?.claude_model : aiSettings?.openai_model) ||
      'claude-sonnet-4-20250514'

    // Choisir le prompt système selon le type de contact
    let systemPrompt = conversation.campaign?.ai_system_prompt || ''
    if (!systemPrompt && aiSettings) {
      switch (contact.contact_type) {
        case 'artisan': systemPrompt = aiSettings.artisan_system_prompt; break
        case 'client': systemPrompt = aiSettings.client_system_prompt; break
        case 'mairie': systemPrompt = aiSettings.mairie_system_prompt; break
      }
    }

    const result = await generateWithFallback({
      provider: provider as 'claude' | 'openai',
      model,
      systemPrompt,
      conversationHistory: (messages || []) as ProspectionConversationMessage[],
      contactContext: contact,
      campaignContext: conversation.campaign,
      maxTokens: provider === 'claude'
        ? (aiSettings?.claude_max_tokens || 500)
        : (aiSettings?.openai_max_tokens || 500),
      temperature: provider === 'claude'
        ? (aiSettings?.claude_temperature || 0.7)
        : (aiSettings?.openai_temperature || 0.7),
    })

    return NextResponse.json({
      success: true,
      data: {
        content: result.content,
        provider: result.provider,
        model: result.model,
        tokens: result.tokens,
        cost: result.cost,
      },
    })
  } catch (error) {
    logger.error('AI generate error', error as Error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}
