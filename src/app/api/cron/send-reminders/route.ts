import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getNotificationService, type NotificationPayload } from '@/lib/notifications/unified-notification-service'
import { logger } from '@/lib/logger'

// GET /api/cron/send-reminders - Send reminder emails for tomorrow's bookings
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
      logger.warn('[Cron] Unauthorized access attempt to send-reminders')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Calculate tomorrow's date range
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    logger.info(`[Cron] Fetching bookings for ${tomorrowStr}`)

    // Fetch all confirmed bookings for tomorrow using scheduled_date (availability_slots has no FK on bookings)
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        service_name,
        status,
        scheduled_date,
        attorney_id,
        client:profiles!client_id(full_name, email, phone_e164)
      `)
      .eq('status', 'confirmed')
      .limit(500)

    if (error) {
      logger.error('[Cron] Error fetching bookings:', error)
      throw error
    }

    // Filter bookings for tomorrow using scheduled_date
    const tomorrowBookings = bookings?.filter(
      (b) => b.scheduled_date && b.scheduled_date.startsWith(tomorrowStr)
    ) || []

    logger.info(`[Cron] Found ${tomorrowBookings.length} bookings for tomorrow`)

    if (tomorrowBookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bookings for tomorrow',
        sentCount: 0,
      })
    }

    // Check which bookings haven't received a reminder yet
    const { data: sentReminders } = await supabase
      .from('notification_logs')
      .select('booking_id')
      .in('booking_id', tomorrowBookings.map((b) => b.id))
      .eq('type', 'reminder')
      .eq('status', 'sent')

    const sentBookingIds = new Set(sentReminders?.map((r) => r.booking_id) || [])

    // Filter out bookings that already received reminders
    const bookingsToRemind = tomorrowBookings.filter(
      (b) => !sentBookingIds.has(b.id)
    )

    logger.info(`[Cron] ${bookingsToRemind.length} bookings need reminders`)

    // Fetch attorney details for all bookings
    const attorneyIds = Array.from(new Set(bookingsToRemind.map((b) => b.attorney_id).filter(Boolean)))
    const { data: attorneys } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', attorneyIds)

    const attorneyMap = new Map(attorneys?.map((a) => [a.id, a]) || [])

    // Prepare notification payloads
    const payloads: NotificationPayload[] = bookingsToRemind.map((booking) => {
      const attorney = attorneyMap.get(booking.attorney_id || '')
      const client = Array.isArray(booking.client) ? booking.client[0] : booking.client
      const formattedDate = booking.scheduled_date ? new Date(booking.scheduled_date).toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }) : ''

      return {
        bookingId: booking.id,
        clientName: client?.full_name || '',
        clientEmail: client?.email || '',
        clientPhone: client?.phone_e164 || '',
        attorneyName: attorney?.full_name || 'Attorney',
        specialtyName: booking.service_name || 'Service',
        date: formattedDate,
        startTime: '',
        endTime: '',
      }
    })

    // Send reminders using unified notification service (email + SMS)
    const notificationService = getNotificationService()
    const result = await notificationService.sendBatch('reminder_24h', payloads)

    const sentCount = result.succeeded
    const failedCount = result.failed

    logger.info(`[Cron] Reminders sent: ${sentCount} succeeded, ${failedCount} failed`)

    logger.info(`[Cron] Completed: ${sentCount} sent, ${failedCount} failed`)

    return NextResponse.json({
      success: true,
      message: `Reminders processed`,
      sentCount,
      failedCount,
      totalBookings: tomorrowBookings.length,
    })
  } catch (error) {
    logger.error('[Cron] Error in send-reminders:', error)
    return NextResponse.json(
      { error: 'Failed to send reminders' },
      { status: 500 }
    )
  }
}
