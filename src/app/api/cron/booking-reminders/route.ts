/**
 * Cron: Booking Reminders — US Attorneys
 *
 * Runs every 15 minutes (Vercel cron or external scheduler).
 * Sends push notifications + email/SMS reminders for upcoming bookings:
 *   - 24h reminder: bookings starting in 23-25h window
 *   - 1h reminder:  bookings starting in 55-65min window
 *
 * Protected by CRON_SECRET Bearer token.
 * Push/notification failures never cause a 500 — the cron always succeeds.
 */

import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToUser } from '@/lib/push/send'
import { NOTIFICATION_TEMPLATES } from '@/lib/push/notifications'
import { sendReminderNotifications } from '@/lib/notifications/unified-notification-service'
import type { NotificationPayload } from '@/lib/notifications/unified-notification-service'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // seconds

// ── Interfaces for raw DB rows ──────────────────────────────────────────────

interface BookingRow {
  id: string
  client_id: string | null
  client_name: string
  client_email: string
  client_phone: string | null
  scheduled_at: string
  notes: string | null
  attorney_id: string
}

interface AttorneyRow {
  id: string
  name: string
  user_id: string | null
}

// ── Main handler ────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // Auth check
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()

  const stats = {
    reminder24h: { found: 0, sent: 0, failed: 0 },
    reminder1h: { found: 0, sent: 0, failed: 0 },
  }

  try {
    // ── 24h reminders (bookings starting in 23h-25h) ──────────────────────

    const window24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000)
    const window24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    const { data: bookings24h, error: err24h } = await supabase
      .from('bookings')
      .select('id, client_id, client_name, client_email, client_phone, scheduled_at, notes, attorney_id')
      .eq('status', 'confirmed')
      .eq('reminder_24h_sent', false)
      .gte('scheduled_at', window24hStart.toISOString())
      .lte('scheduled_at', window24hEnd.toISOString())
      .limit(200)

    if (err24h) {
      logger.error('[Cron:Reminders] Failed to query 24h bookings', err24h)
    } else if (bookings24h && bookings24h.length > 0) {
      stats.reminder24h.found = bookings24h.length

      // Fetch attorney names for all bookings in one query
      const attorneyIds = Array.from(new Set((bookings24h as BookingRow[]).map((b) => b.attorney_id)))
      const { data: attorneys } = await supabase
        .from('attorneys')
        .select('id, name, user_id')
        .in('id', attorneyIds)

      const attorneyMap = new Map((attorneys as AttorneyRow[] || []).map((a) => [a.id, a]))

      for (const booking of bookings24h as BookingRow[]) {
        try {
          const attorney = attorneyMap.get(booking.attorney_id)
          const attorneyName = attorney?.name || 'Your Attorney'
          const scheduledAt = new Date(booking.scheduled_at)
          const date = scheduledAt.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })
          const time = scheduledAt.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })

          // Send push notification to client (if they have a user account)
          if (booking.client_id) {
            const pushPayload = NOTIFICATION_TEMPLATES.BOOKING_REMINDER_24H(attorneyName, date, time)
            sendPushToUser(booking.client_id, pushPayload).catch((err) => {
              logger.warn('[Cron:Reminders] Push 24h failed', { bookingId: booking.id, error: String(err) })
            })
          }

          // Send email/SMS via unified notification service
          const notifPayload: NotificationPayload = {
            bookingId: booking.id,
            clientName: booking.client_name,
            clientEmail: booking.client_email,
            clientPhone: booking.client_phone || undefined,
            attorneyName,
            specialtyName: booking.notes || 'Consultation',
            date,
            startTime: time,
          }

          sendReminderNotifications('reminder_24h', notifPayload).catch((err) => {
            logger.warn('[Cron:Reminders] Email/SMS 24h failed', { bookingId: booking.id, error: String(err) })
          })

          // Mark reminder as sent (even if push/email fails — avoid resending)
          const { error: updateErr } = await supabase
            .from('bookings')
            .update({
              reminder_24h_sent: true,
              notification_sent_at: new Date().toISOString(),
            })
            .eq('id', booking.id)

          if (updateErr) {
            logger.error('[Cron:Reminders] Failed to mark 24h sent', { bookingId: booking.id, error: updateErr })
            stats.reminder24h.failed++
          } else {
            stats.reminder24h.sent++
          }

          // Send push to attorney too
          if (attorney?.user_id) {
            const attorneyPush = NOTIFICATION_TEMPLATES.BOOKING_REMINDER_24H(
              booking.client_name,
              date,
              time,
            )
            sendPushToUser(attorney.user_id, {
              ...attorneyPush,
              title: 'Client Appointment Tomorrow',
              body: `${booking.client_name} has an appointment tomorrow at ${time}`,
              data: { url: '/attorney-dashboard/bookings' },
            }).catch(() => { /* best effort */ })
          }
        } catch (err) {
          logger.error('[Cron:Reminders] Error processing 24h booking', {
            bookingId: booking.id,
            error: String(err),
          })
          stats.reminder24h.failed++
        }
      }
    }

    // ── 1h reminders (bookings starting in 55min-65min) ──────────────────

    const window1hStart = new Date(now.getTime() + 55 * 60 * 1000)
    const window1hEnd = new Date(now.getTime() + 65 * 60 * 1000)

    const { data: bookings1h, error: err1h } = await supabase
      .from('bookings')
      .select('id, client_id, client_name, client_email, client_phone, scheduled_at, notes, attorney_id')
      .eq('status', 'confirmed')
      .eq('reminder_1h_sent', false)
      .gte('scheduled_at', window1hStart.toISOString())
      .lte('scheduled_at', window1hEnd.toISOString())
      .limit(200)

    if (err1h) {
      logger.error('[Cron:Reminders] Failed to query 1h bookings', err1h)
    } else if (bookings1h && bookings1h.length > 0) {
      stats.reminder1h.found = bookings1h.length

      const attorneyIds = Array.from(new Set((bookings1h as BookingRow[]).map((b) => b.attorney_id)))
      const { data: attorneys } = await supabase
        .from('attorneys')
        .select('id, name, user_id')
        .in('id', attorneyIds)

      const attorneyMap = new Map((attorneys as AttorneyRow[] || []).map((a) => [a.id, a]))

      for (const booking of bookings1h as BookingRow[]) {
        try {
          const attorney = attorneyMap.get(booking.attorney_id)
          const attorneyName = attorney?.name || 'Your Attorney'
          const scheduledAt = new Date(booking.scheduled_at)
          const time = scheduledAt.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })

          // Send push notification to client
          if (booking.client_id) {
            const pushPayload = NOTIFICATION_TEMPLATES.BOOKING_REMINDER_1H(attorneyName, time)
            sendPushToUser(booking.client_id, pushPayload).catch((err) => {
              logger.warn('[Cron:Reminders] Push 1h failed', { bookingId: booking.id, error: String(err) })
            })
          }

          // Send SMS (1h reminder = SMS only by default in unified service)
          const notifPayload: NotificationPayload = {
            bookingId: booking.id,
            clientName: booking.client_name,
            clientEmail: booking.client_email,
            clientPhone: booking.client_phone || undefined,
            attorneyName,
            specialtyName: booking.notes || 'Consultation',
            date: scheduledAt.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            }),
            startTime: time,
          }

          sendReminderNotifications('reminder_1h', notifPayload).catch((err) => {
            logger.warn('[Cron:Reminders] Email/SMS 1h failed', { bookingId: booking.id, error: String(err) })
          })

          // Mark reminder as sent
          const { error: updateErr } = await supabase
            .from('bookings')
            .update({
              reminder_1h_sent: true,
              notification_sent_at: new Date().toISOString(),
            })
            .eq('id', booking.id)

          if (updateErr) {
            logger.error('[Cron:Reminders] Failed to mark 1h sent', { bookingId: booking.id, error: updateErr })
            stats.reminder1h.failed++
          } else {
            stats.reminder1h.sent++
          }

          // Send push to attorney
          if (attorney?.user_id) {
            const attorneyPush = NOTIFICATION_TEMPLATES.BOOKING_REMINDER_1H(booking.client_name, time)
            sendPushToUser(attorney.user_id, {
              ...attorneyPush,
              title: 'Client Appointment in 1 Hour',
              body: `${booking.client_name} appointment starts at ${time}`,
              data: { url: '/attorney-dashboard/bookings' },
            }).catch(() => { /* best effort */ })
          }
        } catch (err) {
          logger.error('[Cron:Reminders] Error processing 1h booking', {
            bookingId: booking.id,
            error: String(err),
          })
          stats.reminder1h.failed++
        }
      }
    }

    logger.info('[Cron:Reminders] Completed', stats)

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      stats,
    })
  } catch (err) {
    logger.error('[Cron:Reminders] Unexpected error', err instanceof Error ? err : new Error(String(err)))
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 },
    )
  }
}
