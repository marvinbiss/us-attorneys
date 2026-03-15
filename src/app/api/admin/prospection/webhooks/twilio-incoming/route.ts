import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { verifyTwilioSignature } from '@/lib/prospection/webhook-security'
import { maskPhone } from '@/lib/prospection/message-queue'
import { generateWithFallback, shouldEscalate, validateAIOutput } from '@/lib/prospection/ai-response'
import { sendWhatsAppReply } from '@/lib/prospection/channels/whatsapp'
import { sendProspectionSMS } from '@/lib/prospection/channels/sms'
import type { ProspectionContact, ProspectionConversationMessage } from '@/types/prospection'

export const dynamic = 'force-dynamic'

/**
 * Webhook Twilio - Messages entrants (SMS et WhatsApp)
 * Gère les réponses des contacts et déclenche l'IA si configurée
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const params: Record<string, string> = {}
    formData.forEach((value, key) => { params[key] = value.toString() })

    // Vérifier la signature
    const signature = request.headers.get('x-twilio-signature') || ''
    if (!verifyTwilioSignature(signature, request.url, params)) {
      return NextResponse.json({ success: false, error: { message: 'Signature invalide' } }, { status: 403 })
    }

    const from = params.From?.replace('whatsapp:', '') || ''
    const body = params.Body || ''
    const isWhatsApp = params.From?.startsWith('whatsapp:')
    const channel = isWhatsApp ? 'whatsapp' : 'sms'

    if (!from || !body) {
      return new NextResponse('OK', { status: 200 })
    }

    const supabase = createAdminClient()

    // Trouver le contact par numéro de téléphone
    const { data: contact } = await supabase
      .from('prospection_contacts')
      .select('id, contact_type, company_name, contact_name, email, phone, phone_e164, address, postal_code, city, department, region, location_code, tags, custom_fields, consent_status, opted_out_at, is_active, created_at, updated_at')
      .eq('phone_e164', from)
      .eq('is_active', true)
      .single()

    if (!contact) {
      logger.warn('Incoming message from unknown number', { from: maskPhone(from) })
      return new NextResponse('OK', { status: 200 })
    }

    // Vérifier si c'est un opt-out (STOP)
    if (['stop', 'arret', 'arrêt', 'desabonner', 'désabonner'].includes(body.trim().toLowerCase())) {
      await supabase
        .from('prospection_contacts')
        .update({ consent_status: 'opted_out', opted_out_at: new Date().toISOString() })
        .eq('id', contact.id)

      return new NextResponse('OK', { status: 200 })
    }

    // Trouver ou créer la conversation
    let { data: conversation } = await supabase
      .from('prospection_conversations')
      .select('id, campaign_id, contact_id, message_id, channel, status, ai_provider, ai_model, ai_replies_count, assigned_to, last_message_at, created_at, updated_at')
      .eq('contact_id', contact.id)
      .eq('channel', channel)
      .in('status', ['open', 'ai_handling'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!conversation) {
      const { data: newConv } = await supabase
        .from('prospection_conversations')
        .insert({
          contact_id: contact.id,
          channel,
          status: 'open',
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single()

      conversation = newConv
    }

    if (!conversation) {
      return new NextResponse('OK', { status: 200 })
    }

    // Sauvegarder le message entrant
    await supabase
      .from('prospection_conversation_messages')
      .insert({
        conversation_id: conversation.id,
        direction: 'inbound',
        sender_type: 'contact',
        content: body,
      })

    // Mettre à jour la conversation
    await supabase
      .from('prospection_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        status: 'open',
      })
      .eq('id', conversation.id)

    // Mettre à jour le message original comme "replied"
    if (conversation.campaign_id) {
      await supabase
        .from('prospection_messages')
        .update({ status: 'replied', replied_at: new Date().toISOString() })
        .eq('campaign_id', conversation.campaign_id)
        .eq('contact_id', contact.id)
        .in('status', ['sent', 'delivered', 'read'])

      // Incrémenter le compteur replied de la campagne
      try {
        await supabase.rpc('increment', {
          table_name: 'prospection_campaigns',
          column_name: 'replied_count',
          row_id: conversation.campaign_id,
        })
      } catch {
        // Fallback si la fonction RPC n'existe pas
      }
    }

    // Vérifier si auto-reply IA est activée
    const { data: aiSettings } = await supabase
      .from('prospection_ai_settings')
      .select('id, default_provider, claude_model, claude_max_tokens, claude_temperature, openai_model, openai_max_tokens, openai_temperature, auto_reply_enabled, max_auto_replies, escalation_keywords, artisan_system_prompt, client_system_prompt, mairie_system_prompt')
      .limit(1)
      .single()

    if (aiSettings?.auto_reply_enabled) {
      // Vérifier l'escalade
      if (shouldEscalate(body, aiSettings.escalation_keywords || [])) {
        await supabase
          .from('prospection_conversations')
          .update({ status: 'human_required' })
          .eq('id', conversation.id)

        return new NextResponse('OK', { status: 200 })
      }

      // Vérifier limite de réponses auto
      if ((conversation.ai_replies_count || 0) < (aiSettings.max_auto_replies || 3)) {
        try {
          // Charger l'historique
          const { data: history } = await supabase
            .from('prospection_conversation_messages')
            .select('id, conversation_id, direction, sender_type, content, ai_provider, ai_model, ai_prompt_tokens, ai_completion_tokens, ai_cost, external_id, created_at')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true })

          const provider = aiSettings.default_provider as 'claude' | 'openai'
          const model = provider === 'claude' ? aiSettings.claude_model : aiSettings.openai_model

          let systemPrompt = ''
          switch ((contact as ProspectionContact).contact_type) {
            case 'artisan': systemPrompt = aiSettings.artisan_system_prompt; break
            case 'client': systemPrompt = aiSettings.client_system_prompt; break
            case 'mairie': systemPrompt = aiSettings.mairie_system_prompt; break
          }

          const aiResult = await generateWithFallback({
            provider,
            model: model || 'claude-sonnet-4-20250514',
            systemPrompt,
            conversationHistory: (history || []) as ProspectionConversationMessage[],
            contactContext: contact as ProspectionContact,
            maxTokens: provider === 'claude' ? aiSettings.claude_max_tokens : aiSettings.openai_max_tokens,
            temperature: provider === 'claude' ? aiSettings.claude_temperature : aiSettings.openai_temperature,
          })

          // Validate AI output before sending
          const outputValidation = validateAIOutput(aiResult.content)
          const replyContent = outputValidation.valid
            ? aiResult.content
            : 'Merci pour votre message. Un conseiller va vous recontacter rapidement.'

          // Envoyer la réponse IA
          if (channel === 'whatsapp') {
            await sendWhatsAppReply(from, replyContent)
          } else {
            await sendProspectionSMS({ to: from, body: replyContent })
          }

          // Sauvegarder la réponse IA
          await supabase
            .from('prospection_conversation_messages')
            .insert({
              conversation_id: conversation.id,
              direction: 'outbound',
              sender_type: 'ai',
              content: replyContent,
              ai_provider: aiResult.provider,
              ai_model: aiResult.model,
              ai_prompt_tokens: aiResult.tokens.prompt,
              ai_completion_tokens: aiResult.tokens.completion,
              ai_cost: aiResult.cost,
            })

          // Mettre à jour le compteur IA
          await supabase
            .from('prospection_conversations')
            .update({
              ai_replies_count: (conversation.ai_replies_count || 0) + 1,
              ai_provider: aiResult.provider,
              ai_model: aiResult.model,
              status: 'ai_handling',
              last_message_at: new Date().toISOString(),
            })
            .eq('id', conversation.id)
        } catch (aiError) {
          logger.error('AI auto-reply failed', aiError as Error)
          await supabase
            .from('prospection_conversations')
            .update({ status: 'human_required' })
            .eq('id', conversation.id)
        }
      } else {
        // Limite atteinte → escalade humaine
        await supabase
          .from('prospection_conversations')
          .update({ status: 'human_required' })
          .eq('id', conversation.id)
      }
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    logger.error('Twilio incoming webhook error', error as Error)
    return new NextResponse('OK', { status: 200 })
  }
}
