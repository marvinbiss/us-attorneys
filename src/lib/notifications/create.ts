/**
 * Unified Notification Creator — US Attorneys
 *
 * Central entry point for creating in-app notifications.
 * Inserts into the `notifications` table AND triggers a push notification
 * (if the user has a push subscription).
 *
 * Usage:
 *   import { createNotification, createNotificationBatch } from '@/lib/notifications/create'
 *
 *   await createNotification(userId, 'booking_confirmed', 'Consultation Confirmed', 'Your consultation is scheduled...', {
 *     link: '/client-dashboard/consultations',
 *     bookingId: '...',
 *   })
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToUser } from '@/lib/push/send'
import { logger } from '@/lib/logger'

const notifLogger = logger.child({ component: 'notifications' })

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType =
  | 'lead_created' | 'lead_dispatched' | 'lead_viewed'
  | 'quote_received' | 'lead_closed' | 'system'
  | 'booking_confirmed' | 'booking_reminder' | 'booking_cancelled' | 'booking_rescheduled'
  | 'new_message' | 'new_lead'
  | 'review_received' | 'review_request'
  | 'payment_success' | 'payment_failed'
  | 'deadline_reminder' | 'profile_view'
  | 'claim_approved' | 'claim_rejected'

export interface NotificationData {
  /** Link to navigate to when notification is clicked */
  link?: string
  /** Any extra structured data */
  [key: string]: unknown
}

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  body: string
  data?: NotificationData
  /** Optional expiration (ISO string). Defaults to 90 days from now. */
  expiresAt?: string
  /** Whether to also send a push notification. Defaults to true. */
  sendPush?: boolean
}

// ---------------------------------------------------------------------------
// URL mapping: notification type -> default navigation link
// ---------------------------------------------------------------------------

const DEFAULT_LINKS: Partial<Record<NotificationType, string>> = {
  booking_confirmed: '/client-dashboard/consultations',
  booking_reminder: '/client-dashboard/consultations',
  booking_cancelled: '/client-dashboard/consultations',
  booking_rescheduled: '/client-dashboard/consultations',
  new_message: '/client-dashboard/messages',
  new_lead: '/attorney-dashboard/leads',
  review_received: '/attorney-dashboard/reviews',
  review_request: '/client-dashboard/consultations',
  payment_success: '/attorney-dashboard/billing',
  payment_failed: '/attorney-dashboard/billing',
  deadline_reminder: '/attorney-dashboard',
  profile_view: '/attorney-dashboard/stats',
  lead_created: '/attorney-dashboard/leads',
  lead_dispatched: '/attorney-dashboard/leads',
  quote_received: '/attorney-dashboard/quotes',
  claim_approved: '/attorney-dashboard',
  claim_rejected: '/attorney-dashboard',
  system: '/notifications',
}

// ---------------------------------------------------------------------------
// Create a single notification
// ---------------------------------------------------------------------------

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: NotificationData,
  options?: { expiresAt?: string; sendPush?: boolean },
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  const { expiresAt, sendPush = true } = options ?? {}

  try {
    const supabase = createAdminClient()

    const link = data?.link ?? DEFAULT_LINKS[type] ?? '/notifications'

    const { data: inserted, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message: body, // backward compat column
        body,
        link,
        read: false,
        metadata: data ?? {},
        data: data ?? {},
        expires_at: expiresAt ?? null,
      })
      .select('id')
      .single()

    if (error) {
      notifLogger.error('Failed to create notification', error, { userId, type })
      return { success: false, error: error.message }
    }

    // Fire-and-forget push notification
    if (sendPush) {
      sendPushToUser(userId, {
        title,
        body,
        url: link,
        tag: type,
        data: data as Record<string, unknown>,
      }).catch((pushError) => {
        notifLogger.warn('Push notification failed (non-blocking)', { error: String(pushError), userId, type })
      })
    }

    notifLogger.info('Notification created', { userId, type, notificationId: inserted?.id })
    return { success: true, notificationId: inserted?.id }
  } catch (error: unknown) {
    notifLogger.error('createNotification error', error, { userId, type })
    return { success: false, error: 'Internal error creating notification' }
  }
}

// ---------------------------------------------------------------------------
// Batch create notifications
// ---------------------------------------------------------------------------

export interface BatchNotificationInput {
  userId: string
  type: NotificationType
  title: string
  body: string
  data?: NotificationData
  expiresAt?: string
}

export async function createNotificationBatch(
  notifications: BatchNotificationInput[],
  options?: { sendPush?: boolean },
): Promise<{ success: boolean; inserted: number; errors: number }> {
  const { sendPush = true } = options ?? {}

  if (notifications.length === 0) {
    return { success: true, inserted: 0, errors: 0 }
  }

  try {
    const supabase = createAdminClient()

    const rows = notifications.map((n) => {
      const link = n.data?.link ?? DEFAULT_LINKS[n.type] ?? '/notifications'
      return {
        user_id: n.userId,
        type: n.type,
        title: n.title,
        message: n.body,
        body: n.body,
        link,
        read: false,
        metadata: n.data ?? {},
        data: n.data ?? {},
        expires_at: n.expiresAt ?? null,
      }
    })

    const { error } = await supabase
      .from('notifications')
      .insert(rows)

    if (error) {
      notifLogger.error('Batch insert failed', error, { count: notifications.length })
      return { success: false, inserted: 0, errors: notifications.length }
    }

    // Fire-and-forget push for each unique user
    if (sendPush) {
      const uniqueUsers = Array.from(new Set(notifications.map((n) => n.userId)))
      for (const userId of uniqueUsers) {
        const userNotifs = notifications.filter((n) => n.userId === userId)
        const first = userNotifs[0]
        const pushBody = userNotifs.length === 1
          ? first.body
          : `You have ${userNotifs.length} new notifications`

        sendPushToUser(userId, {
          title: userNotifs.length === 1 ? first.title : 'New Notifications',
          body: pushBody,
          url: '/notifications',
          tag: 'batch-notification',
        }).catch((pushError) => {
          notifLogger.warn('Batch push failed (non-blocking)', { error: String(pushError), userId })
        })
      }
    }

    notifLogger.info('Batch notifications created', { count: notifications.length })
    return { success: true, inserted: notifications.length, errors: 0 }
  } catch (error: unknown) {
    notifLogger.error('createNotificationBatch error', error)
    return { success: false, inserted: 0, errors: notifications.length }
  }
}
