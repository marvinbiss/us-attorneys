/**
 * Web Push Notifications - US Attorneys
 * VAPID-based push notifications
 */

import webpush from 'web-push'
import { logger } from '@/lib/logger'

// Lazy VAPID configuration to avoid build-time errors
let vapidConfigured = false

function getVapidKeys() {
  const publicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim()
  const privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim()
  return { publicKey, privateKey }
}

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true

  const { publicKey, privateKey } = getVapidKeys()

  if (!publicKey || !privateKey) {
    return false
  }

  try {
    webpush.setVapidDetails(
      'mailto:support@us-attorneys.com',
      publicKey,
      privateKey
    )
    vapidConfigured = true
    return true
  } catch (err: unknown) {
    logger.error('Failed to configure VAPID', err as Error)
    return false
  }
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  data?: Record<string, unknown>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  requireInteraction?: boolean
  silent?: boolean
  vibrate?: number[]
}

// Notification templates
export const pushTemplates = {
  bookingConfirmed: (attorneyName: string, date: string): PushNotificationPayload => ({
    title: 'Booking confirmed ✓',
    body: `Your appointment with ${attorneyName} on ${date} is confirmed`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'booking-confirmed',
    vibrate: [100, 50, 100],
    actions: [
      { action: 'view', title: 'View details' },
      { action: 'calendar', title: 'Add to calendar' },
    ],
  }),

  bookingReminder: (attorneyName: string, time: string): PushNotificationPayload => ({
    title: 'Appointment reminder',
    body: `Don't forget your appointment with ${attorneyName} at ${time}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'booking-reminder',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'view', title: 'View' },
      { action: 'directions', title: 'Directions' },
    ],
  }),

  bookingCancelled: (attorneyName: string): PushNotificationPayload => ({
    title: 'Booking cancelled',
    body: `Your appointment with ${attorneyName} has been cancelled`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'booking-cancelled',
    actions: [{ action: 'rebook', title: 'Rebook appointment' }],
  }),

  newMessage: (senderName: string): PushNotificationPayload => ({
    title: 'New message',
    body: `${senderName} sent you a message`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'new-message',
    actions: [{ action: 'reply', title: 'Reply' }],
  }),

  newReview: (rating: number, clientName: string): PushNotificationPayload => ({
    title: `New review ${'⭐'.repeat(rating)}`,
    body: `${clientName} left a review`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'new-review',
  }),

  newBookingRequest: (clientName: string, service: string): PushNotificationPayload => ({
    title: 'New booking!',
    body: `${clientName} booked: ${service}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'new-booking',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    actions: [
      { action: 'accept', title: 'Accept' },
      { action: 'view', title: 'View' },
    ],
  }),

  videoCallStarting: (clientName: string): PushNotificationPayload => ({
    title: 'Video consultation',
    body: `${clientName} is waiting in the waiting room`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'video-call',
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 300],
    actions: [{ action: 'join', title: 'Join' }],
  }),

  slotAvailable: (attorneyName: string, date: string): PushNotificationPayload => ({
    title: 'Slot available!',
    body: `${attorneyName} has a slot on ${date}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'slot-available',
    actions: [{ action: 'book', title: 'Book' }],
  }),
}

// Send push notification
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!ensureVapidConfigured()) {
      logger.warn('VAPID keys not configured')
      return { success: false, error: 'Push notifications not configured' }
    }

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(payload),
      {
        TTL: 60 * 60 * 24, // 24 hours
        urgency: payload.requireInteraction ? 'high' : 'normal',
      }
    )

    return { success: true }
  } catch (err: unknown) {
    logger.error('Push notification error', err as Error)

    // Handle expired subscriptions
    const error = err as { statusCode?: number; message?: string }
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { success: false, error: 'subscription_expired' }
    }

    return {
      success: false,
      error: error.message || 'Failed to send push notification',
    }
  }
}

// Send to multiple subscriptions
export async function sendPushToUser(
  subscriptions: PushSubscription[],
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number; expiredEndpoints: string[] }> {
  const results = await Promise.all(
    subscriptions.map((sub) => sendPushNotification(sub, payload))
  )

  const expiredEndpoints: string[] = []
  let sent = 0
  let failed = 0

  results.forEach((result, index) => {
    if (result.success) {
      sent++
    } else {
      failed++
      if (result.error === 'subscription_expired') {
        expiredEndpoints.push(subscriptions[index].endpoint)
      }
    }
  })

  return { sent, failed, expiredEndpoints }
}

// Get VAPID public key for client
export function getVapidPublicKey(): string | null {
  const { publicKey } = getVapidKeys()
  return publicKey || null
}
