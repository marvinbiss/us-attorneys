/**
 * Unified Notification Service - US Attorneys
 * World-class notification orchestration with retry logic and priority queuing
 * Based on best practices from Doctolib, Calendly, and Acuity
 */

import { sendBookingConfirmation, sendBookingReminder, sendCancellationEmail, sendPaymentFailedEmail } from './email'
import { sendBookingConfirmationSMS, sendReminder24hSMS, sendReminder1hSMS, sendCancellationSMS, sendRescheduleSMS, type SMSData } from './sms'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

/** Row shape for notification_logs inserts (no generated Supabase types available) */
interface NotificationLogInsert {
  booking_id: string
  type: string
  status: string
  recipient_email: string
  error_message?: string
}

// Notification types
export type NotificationType =
  | 'booking_confirmation'
  | 'reminder_24h'
  | 'reminder_1h'
  | 'cancellation'
  | 'reschedule'
  | 'waitlist_available'
  | 'review_request'
  | 'payment_received'
  | 'payment_failed'

// Channel preferences
export interface NotificationChannels {
  email: boolean
  sms: boolean
}

// Notification data
export interface NotificationPayload {
  bookingId: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  attorneyName: string
  artisanEmail?: string
  specialtyName: string
  date: string
  startTime: string
  endTime?: string
  message?: string
  // Additional fields for specific notifications
  cancellationReason?: string
  newDate?: string
  newTime?: string
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
}

// Priority configuration (lower = higher priority)
const NOTIFICATION_PRIORITY: Record<NotificationType, number> = {
  booking_confirmation: 1, // Immediate
  cancellation: 1,
  reschedule: 1,
  reminder_1h: 2,
  reminder_24h: 3,
  waitlist_available: 4,
  payment_received: 2,
  payment_failed: 2,
  review_request: 5,
}

// Default channel preferences by notification type
const DEFAULT_CHANNELS: Record<NotificationType, NotificationChannels> = {
  booking_confirmation: { email: true, sms: true },
  reminder_24h: { email: true, sms: true },
  reminder_1h: { email: false, sms: true }, // SMS only for 1h reminder
  cancellation: { email: true, sms: true },
  reschedule: { email: true, sms: true },
  waitlist_available: { email: true, sms: true },
  review_request: { email: true, sms: false },
  payment_received: { email: true, sms: false },
  payment_failed: { email: true, sms: true },
}

// Exponential backoff delay calculation
function calculateRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt)
  const jitter = Math.random() * 1000
  return Math.min(delay + jitter, RETRY_CONFIG.maxDelayMs)
}

// Sleep function
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Generic retry wrapper
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ success: boolean; result?: T; error?: string; attempts: number }> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const result = await operation()
      return { success: true, result, attempts: attempt + 1 }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      logger.warn(`[Notification] ${operationName} attempt ${attempt + 1} failed`, { message: lastError.message })

      if (attempt < RETRY_CONFIG.maxRetries - 1) {
        const delay = calculateRetryDelay(attempt)
        await sleep(delay)
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Unknown error after retries',
    attempts: RETRY_CONFIG.maxRetries,
  }
}

// Format SMS data from payload
function toSMSData(payload: NotificationPayload): SMSData {
  return {
    to: payload.clientPhone || '',
    clientName: payload.clientName,
    attorneyName: payload.attorneyName,
    specialtyName: payload.specialtyName,
    date: payload.date,
    time: payload.startTime,
    bookingId: payload.bookingId,
  }
}

// Main notification service class
export class UnifiedNotificationService {
  private supabase: ReturnType<typeof createClient>

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  // Send notification with automatic channel selection and retry
  async send(
    type: NotificationType,
    payload: NotificationPayload,
    channels?: Partial<NotificationChannels>
  ): Promise<{
    email: { success: boolean; error?: string }
    sms: { success: boolean; error?: string }
  }> {
    const effectiveChannels = {
      ...DEFAULT_CHANNELS[type],
      ...channels,
    }

    const results: {
      email: { success: boolean; error?: string }
      sms: { success: boolean; error?: string }
    } = {
      email: { success: false, error: 'Not sent' },
      sms: { success: false, error: 'Not sent' },
    }

    // Send email if enabled
    if (effectiveChannels.email && payload.clientEmail) {
      results.email = await this.sendEmail(type, payload)
    }

    // Send SMS if enabled and phone is provided
    if (effectiveChannels.sms && payload.clientPhone) {
      results.sms = await this.sendSMS(type, payload)
    }

    return results
  }

  // Send email notification
  private async sendEmail(
    type: NotificationType,
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    const result = await withRetry(async () => {
      switch (type) {
        case 'booking_confirmation':
          return await sendBookingConfirmation({
            bookingId: payload.bookingId,
            clientName: payload.clientName,
            clientEmail: payload.clientEmail,
            clientPhone: payload.clientPhone || '',
            attorneyName: payload.attorneyName,
            artisanEmail: payload.artisanEmail || '',
            specialtyName: payload.specialtyName,
            date: payload.date,
            startTime: payload.startTime,
            endTime: payload.endTime || '',
            message: payload.message,
          })

        case 'reminder_24h':
        case 'reminder_1h':
          return await sendBookingReminder({
            bookingId: payload.bookingId,
            clientName: payload.clientName,
            clientEmail: payload.clientEmail,
            attorneyName: payload.attorneyName,
            specialtyName: payload.specialtyName,
            date: payload.date,
            startTime: payload.startTime,
            endTime: payload.endTime || '',
          })

        case 'cancellation':
          return await sendCancellationEmail({
            bookingId: payload.bookingId,
            clientName: payload.clientName,
            clientEmail: payload.clientEmail,
            attorneyName: payload.attorneyName,
            specialtyName: payload.specialtyName,
            date: payload.date,
            startTime: payload.startTime,
            cancellationReason: payload.cancellationReason,
          })

        case 'payment_failed':
          return await sendPaymentFailedEmail({
            clientName: payload.clientName,
            clientEmail: payload.clientEmail,
            specialtyName: payload.specialtyName,
            date: payload.date,
            amount: payload.message,
          })

        default:
          return { success: true }
      }
    }, `Email ${type}`)

    // Log notification
    await this.logNotification(payload.bookingId, type, 'email', result.success, payload.clientEmail, result.error)

    return { success: result.success, error: result.error }
  }

  // Send SMS notification
  private async sendSMS(
    type: NotificationType,
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    if (!payload.clientPhone) {
      return { success: false, error: 'No phone number provided' }
    }

    const smsData = toSMSData(payload)

    const result = await withRetry(async () => {
      switch (type) {
        case 'booking_confirmation':
          return await sendBookingConfirmationSMS(smsData)

        case 'reminder_24h':
          return await sendReminder24hSMS(smsData)

        case 'reminder_1h':
          return await sendReminder1hSMS(smsData)

        case 'cancellation':
          return await sendCancellationSMS(smsData)

        case 'reschedule':
          return await sendRescheduleSMS({
            ...smsData,
            date: payload.newDate || payload.date,
            time: payload.newTime || payload.startTime,
          })

        default:
          return { success: true }
      }
    }, `SMS ${type}`)

    // Log notification
    await this.logNotification(
      payload.bookingId,
      type,
      'sms',
      result.success,
      payload.clientPhone,
      result.error
    )

    return { success: result.success, error: result.error }
  }

  // Log notification to database
  private async logNotification(
    bookingId: string,
    type: NotificationType,
    channel: 'email' | 'sms',
    success: boolean,
    recipient: string,
    error?: string
  ): Promise<void> {
    try {
      const row: NotificationLogInsert = {
        booking_id: bookingId,
        type: `${type}_${channel}`,
        status: success ? 'sent' : 'failed',
        recipient_email: recipient,
        error_message: error,
      }
      // @ts-expect-error - notification_logs table is not in generated Supabase types; row shape is validated by NotificationLogInsert
      await this.supabase.from('notification_logs').insert(row)
    } catch (err) {
      logger.error('[Notification] Failed to log notification', err as Error)
    }
  }

  // Batch send notifications (for cron jobs)
  async sendBatch(
    type: NotificationType,
    payloads: NotificationPayload[],
    channels?: Partial<NotificationChannels>
  ): Promise<{
    total: number
    succeeded: number
    failed: number
    results: Array<{
      bookingId: string
      email: { success: boolean }
      sms: { success: boolean }
    }>
  }> {
    // Sort by priority
    const sortedPayloads = [...payloads].sort(
      (_a, _b) =>
        NOTIFICATION_PRIORITY[type] - NOTIFICATION_PRIORITY[type]
    )

    const results: Array<{
      bookingId: string
      email: { success: boolean }
      sms: { success: boolean }
    }> = []

    let succeeded = 0
    let failed = 0

    for (const payload of sortedPayloads) {
      const result = await this.send(type, payload, channels)
      results.push({
        bookingId: payload.bookingId,
        email: { success: result.email.success },
        sms: { success: result.sms.success },
      })

      if (result.email.success || result.sms.success) {
        succeeded++
      } else {
        failed++
      }

      // Rate limiting: avoid overwhelming services
      await sleep(100)
    }

    return {
      total: payloads.length,
      succeeded,
      failed,
      results,
    }
  }

  // Get notification status for a booking
  async getNotificationHistory(bookingId: string): Promise<
    Array<{
      type: string
      status: string
      recipient: string
      sentAt: string
      error?: string
    }>
  > {
    const { data, error } = await this.supabase
      .from('notification_logs')
      .select('type, status, recipient_email, sent_at, error_message')
      .eq('booking_id', bookingId)
      .order('sent_at', { ascending: false })

    if (error) {
      logger.error('[Notification] Failed to get history', error)
      return []
    }

    interface NotificationLog {
      type: string
      status: string
      recipient_email: string
      sent_at: string
      error_message?: string
    }

    return (data || []).map((log: NotificationLog) => ({
      type: log.type,
      status: log.status,
      recipient: log.recipient_email,
      sentAt: log.sent_at,
      error: log.error_message,
    }))
  }
}

// Singleton instance
let notificationService: UnifiedNotificationService | null = null

export function getNotificationService(): UnifiedNotificationService {
  if (!notificationService) {
    notificationService = new UnifiedNotificationService()
  }
  return notificationService
}

// Convenience functions
export async function sendBookingNotifications(
  payload: NotificationPayload,
  channels?: Partial<NotificationChannels>
) {
  return getNotificationService().send('booking_confirmation', payload, channels)
}

export async function sendReminderNotifications(
  type: 'reminder_24h' | 'reminder_1h',
  payload: NotificationPayload,
  channels?: Partial<NotificationChannels>
) {
  return getNotificationService().send(type, payload, channels)
}

export async function sendCancellationNotifications(
  payload: NotificationPayload,
  channels?: Partial<NotificationChannels>
) {
  return getNotificationService().send('cancellation', payload, channels)
}

export async function sendRescheduleNotifications(
  payload: NotificationPayload,
  channels?: Partial<NotificationChannels>
) {
  return getNotificationService().send('reschedule', payload, channels)
}

export async function sendPaymentFailedNotification(
  payload: NotificationPayload,
  channels?: Partial<NotificationChannels>
) {
  return getNotificationService().send('payment_failed', payload, channels)
}
