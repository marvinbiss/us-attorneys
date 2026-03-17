/**
 * Review Request Cron Job - US Attorneys
 * Sends review request emails 2 hours after completed appointments
 * Best practice: Timing is crucial - 2h after is optimal for service businesses
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/notifications/email'
import { sendReviewRequestSMS, type SMSData } from '@/lib/notifications/sms'
import { logger } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/cron-auth'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://us-attorneys.com'

// Review request email template
function getReviewEmailTemplate(data: {
  clientName: string
  attorneyName: string
  specialtyName: string
  reviewUrl: string
}) {
  return {
    subject: `How was your appointment with ${data.attorneyName}?`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Your opinion matters!</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Hello <strong>${data.clientName}</strong>,
              </p>
              <p style="color: #666; font-size: 15px; line-height: 1.6;">
                How was your appointment with <strong>${data.attorneyName}</strong> for <strong>${data.specialtyName}</strong>?
              </p>
              <p style="color: #666; font-size: 15px; line-height: 1.6;">
                Your review helps others find the best attorneys and helps ${data.attorneyName} improve.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.reviewUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 16px;">
                  ⭐ Leave a review
                </a>
              </div>

              <p style="color: #999; font-size: 13px; text-align: center;">
                It only takes 30 seconds
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

              <p style="color: #999; font-size: 12px; text-align: center;">
                US Attorneys - Find qualified attorneys near you
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hello ${data.clientName},

How was your appointment with ${data.attorneyName} for ${data.specialtyName}?

Your review helps others find the best attorneys.

Leave a review: ${data.reviewUrl}

It only takes 30 seconds.

US Attorneys
    `,
  }
}

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify cron secret (timing-safe comparison)
    if (!verifyCronSecret(request.headers.get('authorization'))) {
      logger.warn('[Review Cron] Unauthorized access attempt')
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
    }

    // Calculate time window: appointments that started 2-3 hours ago (availability_slots has no FK on bookings)
    const now = new Date()
    const windowStart = new Date(now.getTime() - 3 * 60 * 60 * 1000) // 3h ago
    const windowEnd = new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2h ago

    logger.info(`[Review Cron] Looking for completed appointments between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`)

    // Fetch completed bookings in the time window using scheduled_date
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
      .in('status', ['confirmed', 'completed'])
      .gte('scheduled_date', windowStart.toISOString())
      .lte('scheduled_date', windowEnd.toISOString())
      .limit(500)

    if (error) {
      logger.error('[Review Cron] Error fetching bookings:', error)
      throw error
    }

    // All returned bookings are already in the time window via the DB filter
    const completedBookings = bookings || []

    logger.info(`[Review Cron] Found ${completedBookings.length} completed appointments`)

    if (completedBookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No completed appointments in window',
        sentCount: 0,
      })
    }

    // Check which haven't received review request yet
    const { data: sentRequests } = await supabase
      .from('notification_logs')
      .select('booking_id')
      .in('booking_id', completedBookings.map((b) => b.id))
      .eq('type', 'review_request')
      .eq('status', 'sent')

    const sentBookingIds = new Set(sentRequests?.map((r) => r.booking_id) || [])

    const bookingsToRequest = completedBookings.filter(
      (b) => !sentBookingIds.has(b.id)
    )

    logger.info(`[Review Cron] ${bookingsToRequest.length} need review requests`)

    // Fetch attorney details
    const attorneyIds = Array.from(new Set(bookingsToRequest.map((b) => b.attorney_id).filter(Boolean)))
    const { data: attorneys } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', attorneyIds)

    const attorneyMap = new Map(attorneys?.map((a) => [a.id, a]) || [])

    let sentCount = 0
    let failedCount = 0

    // Process in parallel batches of 5 (instead of sequential with 100ms delay)
    const BATCH_CONCURRENCY = 5
    const notificationLogs: Array<{
      booking_id: string
      type: string
      status: string
      recipient_email: string
      error_message?: string
    }> = []

    for (let i = 0; i < bookingsToRequest.length; i += BATCH_CONCURRENCY) {
      const batch = bookingsToRequest.slice(i, i + BATCH_CONCURRENCY)

      const results = await Promise.allSettled(
        batch.map(async (booking) => {
          const attorney = attorneyMap.get(booking.attorney_id || '')
          const client = Array.isArray(booking.client) ? booking.client[0] : booking.client
          const attorneyName = attorney?.full_name || 'Attorney'
          const reviewUrl = `${SITE_URL}/leave-review/${booking.id.slice(0, 8)}`

          const emailTemplate = getReviewEmailTemplate({
            clientName: client?.full_name || '',
            attorneyName,
            specialtyName: booking.service_name || 'Service',
            reviewUrl,
          })

          const emailResult = await sendEmail({
            to: client?.email || '',
            ...emailTemplate,
          })

          let smsResult = { success: false }
          if (client?.phone_e164) {
            const smsData: SMSData = {
              to: client.phone_e164,
              clientName: client?.full_name || '',
              attorneyName,
              specialtyName: booking.service_name || 'Service',
              date: '',
              time: '',
              bookingId: booking.id,
            }
            smsResult = await sendReviewRequestSMS(smsData)
          }

          notificationLogs.push({
            booking_id: booking.id,
            type: 'review_request',
            status: emailResult.success || smsResult.success ? 'sent' : 'failed',
            recipient_email: client?.email || '',
            error_message: emailResult.error,
          })

          return emailResult.success || smsResult.success
        })
      )

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          sentCount++
        } else {
          failedCount++
          if (result.status === 'rejected') {
            logger.error(`[Review Cron] Batch error:`, result.reason)
          }
        }
      }
    }

    // Batch-insert notification logs
    if (notificationLogs.length > 0) {
      const { error: logError } = await supabase.from('notification_logs').insert(notificationLogs)
      if (logError) {
        logger.error('[Review Cron] Error batch-inserting notification logs:', logError)
      }
    }

    // Mark bookings as completed if they were confirmed
    const confirmedIds = bookingsToRequest
      .filter((b) => b.status === 'confirmed')
      .map((b) => b.id)

    if (confirmedIds.length > 0) {
      await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .in('id', confirmedIds)
    }

    logger.info(`[Review Cron] Completed: ${sentCount} sent, ${failedCount} failed`)

    return NextResponse.json({
      success: true,
      message: 'Review requests processed',
      sentCount,
      failedCount,
      markedCompleted: confirmedIds.length,
    })
  } catch (error) {
    logger.error('[Review Cron] Error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error sending review requests' } },
      { status: 500 }
    )
  }
}
