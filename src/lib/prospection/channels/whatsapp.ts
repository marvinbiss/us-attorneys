/**
 * WhatsApp Channel Sender - Prospection
 * Envoi WhatsApp via Twilio WhatsApp Business API
 */

import twilio from 'twilio'
import { logger } from '@/lib/logger'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+33100000000'

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
  to: string  // phone_e164 format (+33...)
  body?: string
  contentSid?: string  // Twilio Content SID pour templates approuvés
  contentVariables?: Record<string, string>
}

export interface WhatsAppResult {
  success: boolean
  sid?: string
  error?: string
  errorCode?: string
}

/**
 * Envoyer un message WhatsApp via Twilio
 */
export async function sendWhatsApp(params: WhatsAppSendParams): Promise<WhatsAppResult> {
  try {
    const client = getTwilioClient()
    const to = `whatsapp:${params.to}`
    const from = whatsappFrom.startsWith('whatsapp:') ? whatsappFrom : `whatsapp:${whatsappFrom}`

    const messageParams: Record<string, unknown> = { from, to }

    if (params.contentSid) {
      // Template approuvé par Meta (obligatoire pour messages initiés par l'entreprise)
      messageParams.contentSid = params.contentSid
      if (params.contentVariables) {
        messageParams.contentVariables = JSON.stringify(params.contentVariables)
      }
    } else if (params.body) {
      // Message libre (uniquement dans une fenêtre de 24h après réponse du contact)
      messageParams.body = params.body
    } else {
      return { success: false, error: 'body ou contentSid requis' }
    }

    // Add callback URL pour le tracking
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (siteUrl) {
      messageParams.statusCallback = `${siteUrl}/api/admin/prospection/webhooks/twilio`
    }

    const result = await client.messages.create(messageParams as unknown as Parameters<typeof client.messages.create>[0])

    logger.info('WhatsApp sent', { to: params.to, sid: result.sid })
    return { success: true, sid: result.sid }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    const errCode = (error as { code?: number })?.code?.toString()
    logger.error('WhatsApp send error', error as Error)
    return { success: false, error: errMsg, errorCode: errCode }
  }
}

/**
 * Envoyer une réponse WhatsApp (dans la fenêtre de 24h)
 */
export async function sendWhatsAppReply(to: string, body: string): Promise<WhatsAppResult> {
  return sendWhatsApp({ to, body })
}
