/**
 * WhatsApp Channel Sender - Prospection
 * Send WhatsApp messages via Twilio WhatsApp Business API
 */

import twilio from 'twilio'
import { logger } from '@/lib/logger'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+10000000000'

let twilioClient: twilio.Twilio | null = null

function getTwilioClient(): twilio.Twilio {
  if (!twilioClient) {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured')
    }
    twilioClient = twilio(accountSid, authToken)
  }
  return twilioClient
}

export interface WhatsAppSendParams {
  to: string  // phone_e164 format (+1...)
  body?: string
  contentSid?: string  // Twilio Content SID for approved templates
  contentVariables?: Record<string, string>
}

export interface WhatsAppResult {
  success: boolean
  sid?: string
  error?: string
  errorCode?: string
}

/**
 * Send a WhatsApp message via Twilio
 */
export async function sendWhatsApp(params: WhatsAppSendParams): Promise<WhatsAppResult> {
  try {
    const client = getTwilioClient()
    const to = `whatsapp:${params.to}`
    const from = whatsappFrom.startsWith('whatsapp:') ? whatsappFrom : `whatsapp:${whatsappFrom}`

    const messageParams: Record<string, unknown> = { from, to }

    if (params.contentSid) {
      // Meta-approved template (required for business-initiated messages)
      messageParams.contentSid = params.contentSid
      if (params.contentVariables) {
        messageParams.contentVariables = JSON.stringify(params.contentVariables)
      }
    } else if (params.body) {
      // Free-form message (only within 24h window after contact reply)
      messageParams.body = params.body
    } else {
      return { success: false, error: 'body or contentSid required' }
    }

    // Add callback URL for tracking
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (siteUrl) {
      messageParams.statusCallback = `${siteUrl}/api/admin/prospection/webhooks/twilio`
    }

    const result = await client.messages.create(messageParams as unknown as Parameters<typeof client.messages.create>[0])

    logger.info('WhatsApp sent', { to: params.to, sid: result.sid })
    return { success: true, sid: result.sid }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    const errCode = (error as { code?: number })?.code?.toString()
    logger.error('WhatsApp send error', error as Error)
    return { success: false, error: errMsg, errorCode: errCode }
  }
}

/**
 * Send a WhatsApp reply (within the 24h window)
 */
export async function sendWhatsAppReply(to: string, body: string): Promise<WhatsAppResult> {
  return sendWhatsApp({ to, body })
}
