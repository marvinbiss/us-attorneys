/**
 * Review Request Cron Job - ServicesArtisans
 * Sends review request emails 2 hours after completed appointments
 * Best practice: Timing is crucial - 2h after is optimal for service businesses
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/notifications/email'
import { sendReviewRequestSMS, type SMSData } from '@/lib/notifications/sms'
import { logger } from '@/lib/logger'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://servicesartisans.fr'

// Review request email template
function getReviewEmailTemplate(data: {
  clientName: string
  artisanName: string
  serviceName: string
  reviewUrl: string
}) {
  return {
    subject: `Comment s'est passé votre RDV avec ${data.artisanName}?`,
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
              <h1 style="color: white; margin: 0; font-size: 24px;">Votre avis compte !</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Bonjour <strong>${data.clientName}</strong>,
              </p>
              <p style="color: #666; font-size: 15px; line-height: 1.6;">
                Comment s'est passé votre rendez-vous avec <strong>${data.artisanName}</strong> pour <strong>${data.serviceName}</strong> ?
              </p>
              <p style="color: #666; font-size: 15px; line-height: 1.6;">
                Votre avis aide d'autres personnes à trouver les meilleurs artisans et permet à ${data.artisanName} de s'améliorer.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.reviewUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 16px;">
                  ⭐ Laisser un avis
                </a>
              </div>

              <p style="color: #999; font-size: 13px; text-align: center;">
                Cela ne prend que 30 secondes
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

              <p style="color: #999; font-size: 12px; text-align: center;">
                ServicesArtisans - Trouvez des artisans qualifiés près de chez vous
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Bonjour ${data.clientName},

Comment s'est passé votre rendez-vous avec ${data.artisanName} pour ${data.serviceName} ?

Votre avis aide d'autres personnes à trouver les meilleurs artisans.

Laisser un avis: ${data.reviewUrl}

Cela ne prend que 30 secondes.

ServicesArtisans
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

    // Verify cron secret - REQUIRED in production
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('[Review Cron] Unauthorized access attempt')
      return NextResponse.json({ success: false, error: { message: 'Non autorisé' } }, { status: 401 })
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
        provider_id,
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

    // Fetch artisan details
    const artisanIds = Array.from(new Set(bookingsToRequest.map((b) => b.provider_id).filter(Boolean)))
    const { data: artisans } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', artisanIds)

    const artisanMap = new Map(artisans?.map((a) => [a.id, a]) || [])

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
          const artisan = artisanMap.get(booking.provider_id || '')
          const client = Array.isArray(booking.client) ? booking.client[0] : booking.client
          const artisanName = artisan?.full_name || 'Artisan'
          const reviewUrl = `${SITE_URL}/donner-avis/${booking.id.slice(0, 8)}`

          const emailTemplate = getReviewEmailTemplate({
            clientName: client?.full_name || '',
            artisanName,
            serviceName: booking.service_name || 'Service',
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
              artisanName,
              serviceName: booking.service_name || 'Service',
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
      { success: false, error: { message: 'Erreur lors de l\'envoi des demandes d\'avis' } },
      { status: 500 }
    )
  }
}
