import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAdminAction } from '@/lib/admin-auth'
import { createApiHandler } from '@/lib/api/handler'
import { logger } from '@/lib/logger'
import { sendWhatsAppReply } from '@/lib/prospection/channels/whatsapp'
import { sendProspectionSMS } from '@/lib/prospection/channels/sms'
import { sendProspectionEmail } from '@/lib/prospection/channels/email'
import { sanitizeHtml, isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

const replySchema = z.object({
  content: z.string().min(1).max(5000),
  sender_type: z.enum(['human', 'ai']).optional().default('human'),
})

export const dynamic = 'force-dynamic'

export const POST = createApiHandler(async (ctx) => {
  const id = ctx.params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const body = ctx.body

  const supabase = createAdminClient()

  // Load the conversation with the contact
  const { data: conversation } = await supabase
    .from('prospection_conversations')
    .select('*, contact:prospection_contacts(*)')
    .eq('id', id)
    .single()

  if (!conversation) {
    return NextResponse.json({ success: false, error: { message: 'Conversation not found' } }, { status: 404 })
  }

  const contact = conversation.contact as { phone_e164?: string; email?: string }

  // Send via the appropriate channel
  let externalId: string | undefined

  switch (conversation.channel) {
    case 'whatsapp':
      if (contact.phone_e164) {
        const result = await sendWhatsAppReply(contact.phone_e164, body.content)
        externalId = result.sid
      }
      break
    case 'sms':
      if (contact.phone_e164) {
        const result = await sendProspectionSMS({ to: contact.phone_e164, body: body.content })
        externalId = result.sid
      }
      break
    case 'email':
      if (contact.email) {
        // Sanitize content to prevent XSS in HTML email
        const safeContent = sanitizeHtml(body.content).replace(/\n/g, '<br>')
        const result = await sendProspectionEmail({
          to: contact.email,
          subject: 'Re: US Attorneys',
          html: `<p>${safeContent}</p>`,
        })
        externalId = result.id
      }
      break
  }

  // Save the message in the conversation
  const { data: msg, error: msgError } = await supabase
    .from('prospection_conversation_messages')
    .insert({
      conversation_id: id,
      direction: 'outbound',
      sender_type: body.sender_type,
      content: body.content,
      external_id: externalId,
    })
    .select()
    .single()

  if (msgError) {
    logger.error('Save reply error', msgError)
  }

  // Update the conversation
  await supabase
    .from('prospection_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', id)

  await logAdminAction(ctx.user!.id, 'conversation.reply', 'prospection_conversation', id, {
    channel: conversation.channel,
    sender_type: body.sender_type,
  })

  return NextResponse.json({ success: true, data: msg })
}, { requireAdmin: true, bodySchema: replySchema })
