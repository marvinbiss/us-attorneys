/**
 * Email Channel Sender - Prospection
 * Send emails via Resend for prospection campaigns
 */

import { sendEmail, sendBatchEmails } from '@/lib/api/resend-client'
import { logger } from '@/lib/logger'

export interface EmailProspectionParams {
  to: string
  subject: string
  html: string
  text?: string
  tags?: { name: string; value: string }[]
}

export interface EmailResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Send a prospection email
 */
export async function sendProspectionEmail(params: EmailProspectionParams): Promise<EmailResult> {
  try {
    const result = await sendEmail({
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      tags: [
        { name: 'type', value: 'prospection' },
        ...(params.tags || []),
      ],
    })

    return { success: true, id: result.id }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Prospection email error', error as Error)
    return { success: false, error: errMsg }
  }
}

/**
 * Send a batch of prospection emails
 */
export async function sendProspectionEmailBatch(
  emails: EmailProspectionParams[]
): Promise<{ sent: number; failed: number; results: EmailResult[] }> {
  try {
    const batchParams = emails.map(e => ({
      to: e.to,
      subject: e.subject,
      html: e.html,
      text: e.text,
      tags: [
        { name: 'type', value: 'prospection' },
        ...(e.tags || []),
      ],
    }))

    const results = await sendBatchEmails({ emails: batchParams })

    return {
      sent: results.length,
      failed: emails.length - results.length,
      results: results.map(r => ({ success: true, id: r.id })),
    }
  } catch (error: unknown) {
    logger.error('Prospection email batch error', error as Error)
    return {
      sent: 0,
      failed: emails.length,
      results: emails.map(() => ({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })),
    }
  }
}
