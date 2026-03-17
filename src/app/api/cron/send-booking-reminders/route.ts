/**
 * Booking Reminder Cron Job - US Attorneys
 * Sends email reminders ~1 hour before video consultations
 * Schedule: every 30 minutes
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, emailTemplates } from '@/lib/services/email-service'
import { logger } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

// POST /api/cron/send-booking-reminders
export async function POST(request: Request) {
  // Verify cron secret (timing-safe comparison)
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    logger.warn('[Cron Booking Reminder] Unauthorized access attempt')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  let sent = 0
  let errors = 0

  try {
    const adminSupabase = createAdminClient()

    // Find bookings where:
    // - status = confirmed
    // - reminder_sent = false
    // - scheduled_at is between now and now + 90 minutes
    const now = new Date()
    const windowEnd = new Date(now.getTime() + 90 * 60 * 1000)

    const { data: bookings, error } = await adminSupabase
      .from('bookings')
      .select(`
        id,
        client_name,
        client_email,
        scheduled_at,
        duration_minutes,
        daily_room_url,
        attorney_id
      `)
      .eq('status', 'confirmed')
      .eq('reminder_sent', false)
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', windowEnd.toISOString())
      .limit(200)

    if (error) {
      logger.error('[Cron Booking Reminder] Error fetching bookings:', error)
      throw error
    }

    const bookingsToRemind = bookings || []

    logger.info(`[Cron Booking Reminder] Found ${bookingsToRemind.length} bookings needing reminders`)

    if (bookingsToRemind.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        errors: 0,
        message: 'No bookings need reminders',
      })
    }

    // Fetch attorney details for all bookings
    const attorneyIds = Array.from(new Set(bookingsToRemind.map((b) => b.attorney_id).filter(Boolean)))
    const { data: attorneys } = await adminSupabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', attorneyIds)

    const attorneyMap = new Map(attorneys?.map((a) => [a.id, a]) || [])

    // Process each booking
    for (const booking of bookingsToRemind) {
      const attorney = attorneyMap.get(booking.attorney_id)
      const scheduled = new Date(booking.scheduled_at)
      const dateStr = scheduled.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
      const timeStr = scheduled.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      const dailyUrl = booking.daily_room_url || ''

      // Send reminder to client
      try {
        await sendEmail({
          to: booking.client_email,
          template: emailTemplates.bookingReminder(
            booking.client_name,
            attorney?.full_name || 'Your Attorney',
            dateStr,
            timeStr,
            dailyUrl
          ),
        })
      } catch (emailError) {
        logger.error(`[Cron Booking Reminder] Failed to send client email for booking ${booking.id}:`, emailError)
        errors++
      }

      // Send reminder to attorney
      if (attorney?.email) {
        try {
          await sendEmail({
            to: attorney.email,
            template: emailTemplates.bookingReminder(
              attorney.full_name,
              booking.client_name,
              dateStr,
              timeStr,
              dailyUrl
            ),
          })
        } catch (emailError) {
          logger.error(`[Cron Booking Reminder] Failed to send attorney email for booking ${booking.id}:`, emailError)
          errors++
        }
      }

      // Mark reminder as sent
      const { error: updateError } = await adminSupabase
        .from('bookings')
        .update({ reminder_sent: true })
        .eq('id', booking.id)

      if (updateError) {
        logger.error(`[Cron Booking Reminder] Failed to update reminder_sent for booking ${booking.id}:`, updateError)
        errors++
      } else {
        sent++
      }
    }

    logger.info(`[Cron Booking Reminder] Completed: ${sent} sent, ${errors} errors`)

    return NextResponse.json({
      success: true,
      sent,
      errors,
    })
  } catch (error) {
    logger.error('[Cron Booking Reminder] Fatal error:', error)
    return NextResponse.json(
      { error: 'Failed to send booking reminders', sent, errors },
      { status: 500 }
    )
  }
}
