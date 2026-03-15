/**
 * Push Subscription API - US Attorneys
 *
 * NOTE: push_subscriptions table was dropped in migration 100.
 * All endpoints return 503 until the table is re-created.
 * The frontend hook (usePushNotifications) already returns isSupported: false,
 * so the UI hides the push toggle. These 503s are a safety net for any
 * direct API callers.
 */

import { NextResponse } from 'next/server'
import { getVapidPublicKey } from '@/lib/notifications/push'

const UNAVAILABLE_RESPONSE = {
  success: false,
  error: {
    code: 'PUSH_UNAVAILABLE',
    message: 'Les notifications push sont temporairement indisponibles.',
  },
} as const

export const dynamic = 'force-dynamic'

// GET /api/push/subscribe - Get VAPID public key
export async function GET() {
  const vapidKey = getVapidPublicKey()

  if (!vapidKey) {
    return NextResponse.json(UNAVAILABLE_RESPONSE, { status: 503 })
  }

  // VAPID key can still be returned for feature-detection,
  // but subscribe/unsubscribe will reject until the table is restored.
  return NextResponse.json({ vapidPublicKey: vapidKey })
}

// POST /api/push/subscribe - Subscribe to push notifications
export async function POST() {
  return NextResponse.json(UNAVAILABLE_RESPONSE, { status: 503 })
}

// DELETE /api/push/subscribe - Unsubscribe from push notifications
export async function DELETE() {
  return NextResponse.json(UNAVAILABLE_RESPONSE, { status: 503 })
}
