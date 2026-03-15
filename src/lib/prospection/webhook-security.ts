/**
 * Webhook Security - Prospection
 * Vérification des signatures pour Twilio et Resend
 */

import crypto from 'crypto'
import twilio from 'twilio'
import { logger } from '@/lib/logger'

/**
 * Vérifier la signature Twilio (X-Twilio-Signature)
 */
export function verifyTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) {
    logger.error('TWILIO_AUTH_TOKEN not configured for webhook verification')
    return false
  }

  try {
    return twilio.validateRequest(authToken, signature, url, params)
  } catch (error) {
    logger.error('Twilio signature verification error', error as Error)
    return false
  }
}

/**
 * Vérifier la signature Resend (webhook svix)
 * Performs actual HMAC-SHA256 verification instead of just checking header presence.
 */
export function verifyResendSignature(
  payload: string,
  headers: {
    'svix-id'?: string
    'svix-timestamp'?: string
    'svix-signature'?: string
  }
): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    logger.warn('RESEND_WEBHOOK_SECRET not configured')
    return false
  }

  try {
    const svixId = headers['svix-id']
    const svixTimestamp = headers['svix-timestamp']
    const svixSignature = headers['svix-signature']

    if (!svixId || !svixTimestamp || !svixSignature) {
      return false
    }

    // Verify le timestamp (max 5 minutes de différence)
    const timestamp = parseInt(svixTimestamp, 10)
    const now = Math.floor(Date.now() / 1000)
    if (Math.abs(now - timestamp) > 300) {
      logger.warn('Resend webhook timestamp too old')
      return false
    }

    // Compute expected HMAC-SHA256 signature
    const signedContent = `${svixId}.${svixTimestamp}.${payload}`
    // Svix secrets are prefixed with "whsec_" — strip the prefix and decode base64
    const secretBytes = Buffer.from(secret.split('_').pop() || secret, 'base64')
    const expectedSignature = crypto
      .createHmac('sha256', secretBytes)
      .update(signedContent)
      .digest('base64')

    // Svix may send multiple signatures space-separated (versioned: "v1,<sig>")
    const signatures = svixSignature.split(' ')
    return signatures.some(sig => {
      const sigValue = sig.split(',').pop() || sig
      try {
        return crypto.timingSafeEqual(
          Buffer.from(expectedSignature),
          Buffer.from(sigValue)
        )
      } catch {
        // timingSafeEqual throws if buffers differ in length
        return false
      }
    })
  } catch (error) {
    logger.error('Resend signature verification error', error as Error)
    return false
  }
}
