/**
 * SMS Channel Sender - Prospection
 * Send SMS via Twilio for prospection campaigns
 */

import { sendSMS } from '@/lib/notifications/sms'
import { logger } from '@/lib/logger'

export interface SMSProspectionParams {
  to: string  // phone_e164 format (+1...)
  body: string
}

export interface SMSResult {
  success: boolean
  sid?: string
  error?: string
  errorCode?: string
}

/**
 * Send a prospection SMS
 */
export async function sendProspectionSMS(params: SMSProspectionParams): Promise<SMSResult> {
  try {
    const result = await sendSMS(params.to, params.body)

    if (result.success) {
      return { success: true, sid: result.messageId }
    }

    return { success: false, error: result.error }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Prospection SMS error', error as Error)
    return { success: false, error: errMsg }
  }
}
