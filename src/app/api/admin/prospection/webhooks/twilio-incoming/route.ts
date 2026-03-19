import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { createApiHandler } from '@/lib/api/handler'
import { verifyTwilioSignature } from '@/lib/prospection/webhook-security'
import { maskPhone } from '@/lib/prospection/message-queue'
import {
  generateWithFallback,
  shouldEscalate,
  validateAIOutput,
} from '@/lib/prospection/ai-response'
import { sendWhatsAppReply } from '@/lib/prospection/channels/whatsapp'
import { sendProspectionSMS } from '@/lib/prospection/channels/sms'
import type { ProspectionContact, ProspectionConversationMessage } from '@/types/prospection'

/**
 * Twilio Webhook - Incoming messages (SMS and WhatsApp)
 * Handles contact responses and triggers AI if configured
 */
// SECURITY: CSRF exemption — this endpoint is authenticated via webhook signature verification
// (Stripe-Signature header / HMAC validation), not session cookies. External service POST.
export const POST = createApiHandler(async (ctx) => {
  const formData = await ctx.request.formData()
  const params: Record<string, string> = {}
  formData.forEach((value, key) => {
    params[key] = value.toString()
  })

  // Verify the signature
  const signature = ctx.request.headers.get('x-twilio-signature') || ''
  if (!verifyTwilioSignature(signature, ctx.request.url, params)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid signature' } },
      { status: 403 }
    )
  }

  const from = params.From?.replace('whatsapp:', '') || ''
  const body = params.Body || ''
  const isWhatsApp = params.From?.startsWith('whatsapp:')
  const channel = isWhatsApp ? 'whatsapp' : 'sms'

  if (!from || !body) {
    return new NextResponse('OK', { status: 200 })
  }

  const supabase = createAdminClient()

  // Find contact by phone number
  const { data: contact } = await supabase
    .from('prospection_contacts')
    .select(
      'id, contact_type, company_name, contact_name, email, phone, phone_e164, address, postal_code, city, department, region, location_code, tags, custom_fields, consent_status, opted_out_at, is_active, created_at, updated_at'
    )
    .eq('phone_e164', from)
    .eq('is_active', true)
    .single()

  if (!contact) {
    logger.warn('Incoming message from unknown number', { from: maskPhone(from) })
    return new NextResponse('OK', { status: 200 })
  }

  // Check if this is an opt-out (STOP)
  if (
    [
      'stop',
      'unsubscribe',
      'cancel',
      'opt out',
      'quit',
      'arret',
      'arrêt',
      'desabonner',
      'désabonner',
    ].includes(body.trim().toLowerCase())
  ) {
    await supabase
      .from('prospection_contacts')
      .update({ consent_status: 'opted_out', opted_out_at: new Date().toISOString() })
      .eq('id', contact.id)

    return new NextResponse('OK', { status: 200 })
  }

  // Find or create conversation
  let { data: conversation } = await supabase
    .from('prospection_conversations')
    .select(
      'id, campaign_id, contact_id, message_id, channel, status, ai_provider, ai_model, ai_replies_count, assigned_to, last_message_at, created_at, updated_at'
    )
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

  // Save the incoming message
  await supabase.from('prospection_conversation_messages').insert({
    conversation_id: conversation.id,
    direction: 'inbound',
    sender_type: 'contact',
    content: body,
  })

  // Update the conversation
  await supabase
    .from('prospection_conversations')
    .update({
      last_message_at: new Date().toISOString(),
      status: 'open',
    })
    .eq('id', conversation.id)

  // Update the original message as "replied"
  if (conversation.campaign_id) {
    await supabase
      .from('prospection_messages')
      .update({ status: 'replied', replied_at: new Date().toISOString() })
      .eq('campaign_id', conversation.campaign_id)
      .eq('contact_id', contact.id)
      .in('status', ['sent', 'delivered', 'read'])

    // Increment the campaign replied counter
    try {
      await supabase.rpc('increment', {
        table_name: 'prospection_campaigns',
        column_name: 'replied_count',
        row_id: conversation.campaign_id,
      })
    } catch {
      // Fallback if the RPC function does not exist
    }
  }

  // Check if AI auto-reply is enabled
  const { data: aiSettings } = await supabase
    .from('prospection_ai_settings')
    .select(
      'id, default_provider, claude_model, claude_max_tokens, claude_temperature, openai_model, openai_max_tokens, openai_temperature, auto_reply_enabled, max_auto_replies, escalation_keywords, attorney_system_prompt, client_system_prompt, municipality_system_prompt'
    )
    .limit(1)
    .single()

  if (aiSettings?.auto_reply_enabled) {
    // Check for escalation
    if (shouldEscalate(body, aiSettings.escalation_keywords || [])) {
      await supabase
        .from('prospection_conversations')
        .update({ status: 'human_required' })
        .eq('id', conversation.id)

      return new NextResponse('OK', { status: 200 })
    }

    // Check auto-reply limit
    if ((conversation.ai_replies_count || 0) < (aiSettings.max_auto_replies || 3)) {
      try {
        // Load conversation history
        const { data: history } = await supabase
          .from('prospection_conversation_messages')
          .select(
            'id, conversation_id, direction, sender_type, content, ai_provider, ai_model, ai_prompt_tokens, ai_completion_tokens, ai_cost, external_id, created_at'
          )
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true })

        const provider = aiSettings.default_provider as 'claude' | 'openai'
        const model = provider === 'claude' ? aiSettings.claude_model : aiSettings.openai_model

        let systemPrompt = ''
        switch ((contact as ProspectionContact).contact_type) {
          case 'attorney':
            systemPrompt = aiSettings.attorney_system_prompt
            break
          case 'client':
            systemPrompt = aiSettings.client_system_prompt
            break
          case 'municipality':
            systemPrompt = aiSettings.municipality_system_prompt
            break
        }

        const aiResult = await generateWithFallback({
          provider,
          model: model || 'claude-sonnet-4-20250514',
          systemPrompt,
          conversationHistory: (history || []) as ProspectionConversationMessage[],
          contactContext: contact as ProspectionContact,
          maxTokens:
            provider === 'claude' ? aiSettings.claude_max_tokens : aiSettings.openai_max_tokens,
          temperature:
            provider === 'claude' ? aiSettings.claude_temperature : aiSettings.openai_temperature,
        })

        // Validate AI output before sending
        const outputValidation = validateAIOutput(aiResult.content)
        const replyContent = outputValidation.valid
          ? aiResult.content
          : 'Thank you for your message. An advisor will get back to you shortly.'

        // Send the AI response
        if (channel === 'whatsapp') {
          await sendWhatsAppReply(from, replyContent)
        } else {
          await sendProspectionSMS({ to: from, body: replyContent })
        }

        // Save the AI response
        await supabase.from('prospection_conversation_messages').insert({
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

        // Update the AI counter
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
      // Limit reached → human escalation
      await supabase
        .from('prospection_conversations')
        .update({ status: 'human_required' })
        .eq('id', conversation.id)
    }
  }

  return new NextResponse('OK', { status: 200 })
}, {})
