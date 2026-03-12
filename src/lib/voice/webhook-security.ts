import crypto from 'crypto'
import { logger } from '@/lib/logger'

/**
 * Verify Vapi webhook signature (HMAC-SHA256)
 * Pattern: identical to verifyResendSignature in prospection/webhook-security.ts
 */
export function verifyVapiSignature(payload: string, signature: string): boolean {
  const secret = process.env.VAPI_WEBHOOK_SECRET
  if (!secret) {
    logger.error('VAPI_WEBHOOK_SECRET not configured')
    return false
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    )
  } catch {
    return false
  }
}
