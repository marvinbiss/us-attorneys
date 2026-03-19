/**
 * VAPID Key Management for Web Push Notifications
 *
 * Environment variables:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  — base64url-encoded public key (exposed to client)
 *   VAPID_PRIVATE_KEY             — base64url-encoded private key (server only)
 *
 * Generate keys once with: npx tsx -e "import{generateVAPIDKeys}from'web-push';console.log(generateVAPIDKeys())"
 * Then store them in .env.local and Vercel environment.
 */

import webpush from 'web-push'
import { logger } from '@/lib/logger'

const pushLogger = logger.child({ component: 'push' })

// ---------------------------------------------------------------------------
// Public key (safe to send to browsers)
// ---------------------------------------------------------------------------
export function getVapidPublicKey(): string {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!key) {
    throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set')
  }
  return key
}

// ---------------------------------------------------------------------------
// Private key (server-side only — never expose)
// ---------------------------------------------------------------------------
function getVapidPrivateKey(): string {
  const key = process.env.VAPID_PRIVATE_KEY
  if (!key) {
    throw new Error('VAPID_PRIVATE_KEY is not set')
  }
  return key
}

// ---------------------------------------------------------------------------
// Configure web-push with VAPID credentials (lazy, once per cold start)
// ---------------------------------------------------------------------------
let configured = false

export function ensureVapidConfigured(): void {
  if (configured) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lawtendr.com'
  const mailto = `mailto:push@${new URL(siteUrl).hostname}`

  try {
    webpush.setVapidDetails(mailto, getVapidPublicKey(), getVapidPrivateKey())
    configured = true
    pushLogger.info('VAPID configured successfully')
  } catch (error) {
    pushLogger.error('Failed to configure VAPID', error)
    throw error
  }
}

// ---------------------------------------------------------------------------
// Utility: generate a fresh VAPID key pair (for initial project setup)
// ---------------------------------------------------------------------------
export function generateVAPIDKeys(): { publicKey: string; privateKey: string } {
  return webpush.generateVAPIDKeys()
}
