import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { verifyTwilioSignature } from '@/lib/prospection/webhook-security'
import { z } from 'zod'

const webhookSchema = z.object({
  MessageSid: z.string().min(1, 'MessageSid required'),
  MessageStatus: z.string().min(1, 'MessageStatus required'),
  ErrorCode: z.string().optional(),
  ErrorMessage: z.string().optional(),
}).passthrough()

export const dynamic = 'force-dynamic'

/**
 * Webhook Twilio - Status callbacks pour SMS et WhatsApp
 * Receives status updates: queued, sent, delivered, read, failed
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const params: Record<string, string> = {}
    formData.forEach((value, key) => { params[key] = value.toString() })

    // Verify the Twilio signature
    const signature = request.headers.get('x-twilio-signature') || ''
    const url = request.url
    if (!verifyTwilioSignature(signature, url, params)) {
      logger.warn('Invalid Twilio webhook signature')
      return NextResponse.json({ success: false, error: { message: 'Invalid signature' } }, { status: 403 })
    }

    const validated = webhookSchema.safeParse(params)
    if (!validated.success) {
      return NextResponse.json({ success: false, error: { message: 'Missing or invalid parameters', details: validated.error.flatten() } }, { status: 400 })
    }

    const messageSid = validated.data.MessageSid
    const messageStatus = validated.data.MessageStatus
    const errorCode = validated.data.ErrorCode
    const errorMessage = validated.data.ErrorMessage

    const supabase = createAdminClient()

    // Mapper les statuts Twilio → statuts prospection
    const statusMap: Record<string, string> = {
      queued: 'sending',
      sent: 'sent',
      delivered: 'delivered',
      read: 'read',
      failed: 'failed',
      undelivered: 'failed',
    }

    const newStatus = statusMap[messageStatus]
    if (!newStatus) {
      return new NextResponse('OK', { status: 200 })
    }

    const updateData: Record<string, unknown> = { status: newStatus }

    switch (newStatus) {
      case 'sent':
        updateData.sent_at = new Date().toISOString()
        break
      case 'delivered':
        updateData.delivered_at = new Date().toISOString()
        break
      case 'read':
        updateData.read_at = new Date().toISOString()
        break
      case 'failed':
        updateData.failed_at = new Date().toISOString()
        updateData.error_code = errorCode
        updateData.error_message = errorMessage
        break
    }

    await supabase
      .from('prospection_messages')
      .update(updateData)
      .eq('external_id', messageSid)

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    logger.error('Twilio webhook error', error as Error)
    return new NextResponse('OK', { status: 200 })
  }
}
