/**
 * 1-Hour Reminder Cron Job - ServicesArtisans
 * Sends SMS reminders 1 hour before appointments
 * Best practice: SMS has 98% open rate, ideal for last-minute reminders
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getNotificationService, type NotificationPayload } from '@/lib/notifications/unified-notification-service'
import { logger } from '@/lib/logger'

// GET /api/cron/send-reminders-1h - Send 1h reminder SMS
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Use service role for cron jobs to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    // Verify cron secret - REQUIRED in production
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('[Cron 1h] Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Calculate time window: appointments between now+55min and now+65min
    const now = new Date()
    const windowStart = new Date(now.getTime() + 55 * 60 * 1000)
    const windowEnd = new Date(now.getTime() + 65 * 60 * 1000)

    const windowStartTime = windowStart.toTimeString().slice(0, 5) // HH:MM
    const windowEndTime = windowEnd.toTimeString().slice(0, 5)

    logger.info(`[Cron 1h] Looking for appointments between ${windowStartTime} and ${windowEndTime}`)

    // Fetch bookings in the time window using scheduled_date (availability_slots has no FK on bookings)
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        service_name,
        status,
        scheduled_date,
        provider_id,
        client:profiles!client_id(full_name, email, phone_e164)
      `)
      .eq('status', 'confirmed')
      .gte('scheduled_date', windowStart.toISOString())
      .lte('scheduled_date', windowEnd.toISOString())
      .limit(500)

    if (error) {
      logger.error('[Cron 1h] Error fetching bookings:', error)
      throw error
    }

    // All returned bookings are already in the time window via the DB filter
    const upcomingBookings = bookings || []

    logger.info(`[Cron 1h] Found ${upcomingBookings.length} bookings starting in ~1 hour`)

    if (upcomingBookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No appointments in the next hour',
        sentCount: 0,
      })
    }

    // Check which bookings haven't received 1h reminder yet
    const { data: sentReminders } = await supabase
      .from('notification_logs')
      .select('booking_id')
      .in('booking_id', upcomingBookings.map((b) => b.id))
      .eq('type', 'reminder_1h_sms')
      .eq('status', 'sent')

    const sentBookingIds = new Set(sentReminders?.map((r) => r.booking_id) || [])

    // Filter out bookings that already received 1h reminder (SMS only, requires phone)
    const bookingsToRemind = upcomingBookings.filter((b) => {
      if (sentBookingIds.has(b.id)) return false
      const client = Array.isArray(b.client) ? b.client[0] : b.client
      return !!client?.phone_e164
    })

    logger.info(`[Cron 1h] ${bookingsToRemind.length} bookings need 1h reminder`)

    if (bookingsToRemind.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All reminders already sent',
        sentCount: 0,
      })
    }

    // Fetch artisan details
    const artisanIds = Array.from(new Set(bookingsToRemind.map((b) => b.provider_id).filter(Boolean)))
    const { data: artisans } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', artisanIds)

    const artisanMap = new Map(artisans?.map((a) => [a.id, a]) || [])

    // Prepare notification payloads
    const payloads: NotificationPayload[] = bookingsToRemind.map((booking) => {
      const artisan = artisanMap.get(booking.provider_id || '')
      const client = Array.isArray(booking.client) ? booking.client[0] : booking.client

      return {
        bookingId: booking.id,
        clientName: client?.full_name || '',
        clientEmail: client?.email || '',
        clientPhone: client?.phone_e164 || '',
        artisanName: artisan?.full_name || 'Artisan',
        serviceName: booking.service_name || 'Service',
        date: booking.scheduled_date ? new Date(booking.scheduled_date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }) : '',
        startTime: '',
        endTime: '',
      }
    })

    // Send reminders using unified service (SMS only for 1h reminder)
    const notificationService = getNotificationService()
    const result = await notificationService.sendBatch(
      'reminder_1h',
      payloads,
      { email: false, sms: true }
    )

    logger.info(`[Cron 1h] Completed: ${result.succeeded} sent, ${result.failed} failed`)

    return NextResponse.json({
      success: true,
      message: '1h reminders processed',
      sentCount: result.succeeded,
      failedCount: result.failed,
      totalBookings: upcomingBookings.length,
    })
  } catch (error) {
    logger.error('[Cron 1h] Error in send-reminders-1h:', error)
    return NextResponse.json(
      { error: 'Failed to send 1h reminders' },
      { status: 500 }
    )
  }
}
