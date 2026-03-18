/**
 * Web Push Notification Sending — US Attorneys
 *
 * Provides helpers to send push notifications to individual users or in batch.
 * Uses the web-push npm package with VAPID authentication.
 */

import webpush, { type PushSubscription as WebPushSubscription } from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { ensureVapidConfigured } from './vapid'

const pushLogger = logger.child({ component: 'push' })

// ---------------------------------------------------------------------------
// Payload types
// ---------------------------------------------------------------------------

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
  data?: Record<string, unknown>
  actions?: Array<{ action: string; title: string; icon?: string }>
  requireInteraction?: boolean
  silent?: boolean
  vibrate?: number[]
}

// ---------------------------------------------------------------------------
// Low-level: send to a single PushSubscription
// ---------------------------------------------------------------------------

export async function sendPushNotification(
  subscription: WebPushSubscription,
  payload: PushNotificationPayload,
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  ensureVapidConfigured()

  // Resolve URL from either top-level url or data.url
  const resolvedUrl = payload.url || (payload.data?.url as string) || '/'

  const jsonPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/badge-72x72.png',
    url: resolvedUrl,
    tag: payload.tag,
    data: payload.data,
    actions: payload.actions,
    requireInteraction: payload.requireInteraction,
    vibrate: payload.vibrate,
    silent: payload.silent,
  })

  try {
    const result = await webpush.sendNotification(subscription, jsonPayload, {
      TTL: 60 * 60, // 1 hour
      urgency: payload.requireInteraction ? 'high' : 'normal',
    })
    return { success: true, statusCode: result.statusCode }
  } catch (error: unknown) {
    const wpError = error as { statusCode?: number; body?: string }
    const statusCode = wpError.statusCode

    // 404 or 410 = subscription expired / unsubscribed — clean it up
    if (statusCode === 404 || statusCode === 410) {
      pushLogger.info('Subscription expired, will be cleaned up', {
        endpoint: subscription.endpoint.slice(0, 80),
      })
      await removeSubscriptionByEndpoint(subscription.endpoint)
      return { success: false, statusCode, error: 'subscription_expired' }
    }

    pushLogger.error('Push send failed', error, {
      statusCode: statusCode?.toString(),
      endpoint: subscription.endpoint.slice(0, 80),
    })
    return { success: false, statusCode, error: wpError.body || 'send_failed' }
  }
}

// ---------------------------------------------------------------------------
// Send to a single user (all their subscriptions)
// ---------------------------------------------------------------------------

export async function sendPushToUser(
  userId: string,
  notification: PushNotificationPayload,
): Promise<{ sent: number; failed: number }> {
  const supabase = createAdminClient()

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key')
    .eq('user_id', userId)

  if (error) {
    pushLogger.error('Failed to fetch subscriptions for user', error, { userId })
    return { sent: 0, failed: 0 }
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0

  for (const sub of subscriptions) {
    const pushSub: WebPushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth_key,
      },
    }

    const result = await sendPushNotification(pushSub, notification)
    if (result.success) {
      sent++
      // Update last_used_at
      await supabase
        .from('push_subscriptions')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', sub.id)
    } else {
      failed++
    }
  }

  pushLogger.info('Push sent to user', { userId, sent, failed })
  return { sent, failed }
}

// ---------------------------------------------------------------------------
// Batch send to multiple users
// ---------------------------------------------------------------------------

export async function sendPushBatch(
  userIds: string[],
  notification: PushNotificationPayload,
): Promise<{ totalSent: number; totalFailed: number; usersProcessed: number }> {
  let totalSent = 0
  let totalFailed = 0

  // Process in batches of 50 to avoid overwhelming the push service
  const BATCH_SIZE = 50

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map((userId) => sendPushToUser(userId, notification)),
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        totalSent += result.value.sent
        totalFailed += result.value.failed
      } else {
        totalFailed++
      }
    }
  }

  pushLogger.info('Batch push complete', {
    usersProcessed: userIds.length.toString(),
    totalSent: totalSent.toString(),
    totalFailed: totalFailed.toString(),
  })

  return { totalSent, totalFailed, usersProcessed: userIds.length }
}

// ---------------------------------------------------------------------------
// Internal: remove expired subscription by endpoint
// ---------------------------------------------------------------------------

async function removeSubscriptionByEndpoint(endpoint: string): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)

    if (error) {
      pushLogger.error('Failed to remove expired subscription', error)
    }
  } catch (error) {
    pushLogger.error('Error removing subscription', error)
  }
}
