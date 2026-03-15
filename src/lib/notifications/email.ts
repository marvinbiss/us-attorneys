import type { SupabaseClientType } from '@/types'
import { logger } from '@/lib/logger'
import { getResendClient } from '@/lib/api/resend-client'

// Lazy getter for Resend client
const getResend = () => getResendClient()

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@us-attorneys.com'
const SITE_NAME = 'US Attorneys'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://us-attorneys.com'

export interface BookingEmailData {
  bookingId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  attorneyName: string
  artisanEmail: string
  specialtyName: string
  date: string
  startTime: string
  endTime: string
  message?: string
}

export interface ReminderEmailData {
  bookingId: string
  clientName: string
  clientEmail: string
  attorneyName: string
  specialtyName: string
  date: string
  startTime: string
  endTime: string
}

export interface CancellationEmailData {
  bookingId: string
  clientName: string
  clientEmail: string
  attorneyName: string
  artisanEmail: string
  specialtyName: string
  date: string
  startTime: string
  endTime: string
  cancelledBy: 'client' | 'attorney'
  reason?: string
}

export interface PaymentFailedEmailData {
  clientName: string
  clientEmail: string
  specialtyName: string
  date: string
  amount?: string
}

// Email templates
const templates = {
  bookingConfirmationClient: (data: BookingEmailData) => ({
    subject: `Confirmation de votre rendez-vous - ${data.specialtyName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Appointment Confirmed</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Bonjour <strong>${data.clientName}</strong>,
              </p>
              <p style="color: #666; font-size: 15px; line-height: 1.6;">
                Your appointment with <strong>${data.attorneyName}</strong> has been confirmed.
              </p>

              <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #2563eb;">
                <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px;">Appointment Details</h3>
                <table style="width: 100%; font-size: 14px;">
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Service:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.specialtyName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Date:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Horaire:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.startTime} - ${data.endTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Artisan:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.attorneyName}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${SITE_URL}/booking/${data.bookingId}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                  Manage my booking
                </a>
              </div>

              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Besoin de modifier ou annuler votre rendez-vous ? Utilisez le lien ci-dessus ou contactez directement the attorney.
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

              <p style="color: #999; font-size: 12px; text-align: center;">
                ${SITE_NAME} - Find qualified attorneys near you
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Bonjour ${data.clientName},

Your appointment with ${data.attorneyName} has been confirmed.

APPOINTMENT DETAILS
Service: ${data.specialtyName}
Date: ${data.date}
Horaire: ${data.startTime} - ${data.endTime}
Artisan: ${data.attorneyName}

Manage your booking: ${SITE_URL}/booking/${data.bookingId}

Besoin de modifier ou annuler ? Utilisez le lien ci-dessus ou contactez directement the attorney.

${SITE_NAME}
    `,
  }),

  bookingNotificationArtisan: (data: BookingEmailData) => ({
    subject: `New booking - ${data.clientName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Booking</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Bonjour <strong>${data.attorneyName}</strong>,
              </p>
              <p style="color: #666; font-size: 15px; line-height: 1.6;">
                You have received a new booking from <strong>${data.clientName}</strong>.
              </p>

              <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #059669;">
                <h3 style="margin: 0 0 15px 0; color: #047857; font-size: 16px;">Appointment Details</h3>
                <table style="width: 100%; font-size: 14px;">
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Client:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.clientName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Phone:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.clientPhone}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Email:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.clientEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Service:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.specialtyName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Date:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Horaire:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.startTime} - ${data.endTime}</td>
                  </tr>
                </table>
                ${data.message ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #d1fae5;">
                  <p style="color: #666; font-size: 13px; margin: 0 0 5px 0;">Message du client:</p>
                  <p style="color: #333; font-size: 14px; margin: 0; font-style: italic;">"${data.message}"</p>
                </div>
                ` : ''}
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${SITE_URL}/attorney-dashboard/calendrier" style="display: inline-block; background: #059669; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                  Voir mon calendrier
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

              <p style="color: #999; font-size: 12px; text-align: center;">
                ${SITE_NAME} - Your partner for growing your practice
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Bonjour ${data.attorneyName},

You have received a new booking.

APPOINTMENT DETAILS
Client: ${data.clientName}
Phone: ${data.clientPhone}
Email: ${data.clientEmail}
Service: ${data.specialtyName}
Date: ${data.date}
Horaire: ${data.startTime} - ${data.endTime}
${data.message ? `Message: ${data.message}` : ''}

Voir votre calendrier: ${SITE_URL}/attorney-dashboard/calendrier

${SITE_NAME}
    `,
  }),

  reminderClient: (data: ReminderEmailData) => ({
    subject: `Rappel: Votre RDV demain avec ${data.attorneyName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Rappel de rendez-vous</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Bonjour <strong>${data.clientName}</strong>,
              </p>
              <p style="color: #666; font-size: 15px; line-height: 1.6;">
                This is a reminder for your appointment <strong>tomorrow</strong> with <strong>${data.attorneyName}</strong>.
              </p>

              <div style="background: #fffbeb; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                <table style="width: 100%; font-size: 14px;">
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Service:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.specialtyName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Date:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Horaire:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.startTime} - ${data.endTime}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${SITE_URL}/booking/${data.bookingId}" style="display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                  Manage my booking
                </a>
              </div>

              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                If you can no longer attend this appointment, please cancel it as soon as possible.
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

              <p style="color: #999; font-size: 12px; text-align: center;">
                ${SITE_NAME}
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Bonjour ${data.clientName},

Rappel: Vous avez un rendez-vous DEMAIN avec ${data.attorneyName}.

Service: ${data.specialtyName}
Date: ${data.date}
Horaire: ${data.startTime} - ${data.endTime}

Manage your booking: ${SITE_URL}/booking/${data.bookingId}

If you can no longer attend this appointment, please cancel it as soon as possible.

${SITE_NAME}
    `,
  }),

  cancellationNotification: (data: CancellationEmailData) => ({
    subject: `Annulation de rendez-vous - ${data.date}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Appointment Cancelled</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Bonjour,
              </p>
              <p style="color: #666; font-size: 15px; line-height: 1.6;">
                The appointment scheduled for <strong>${data.date}</strong> has been cancelled by ${data.cancelledBy === 'client' ? 'the client' : 'the attorney'}.
              </p>

              <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #dc2626;">
                <h3 style="margin: 0 0 15px 0; color: #b91c1c; font-size: 16px;">Cancellation Details</h3>
                <table style="width: 100%; font-size: 14px;">
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Service:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.specialtyName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Scheduled date:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Horaire:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.startTime} - ${data.endTime}</td>
                  </tr>
                  ${data.reason ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Raison:</td>
                    <td style="padding: 8px 0; color: #333;">${data.reason}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

              <p style="color: #999; font-size: 12px; text-align: center;">
                ${SITE_NAME}
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
The appointment scheduled for ${data.date} has been cancelled by ${data.cancelledBy === 'client' ? 'the client' : 'the attorney'}.

Service: ${data.specialtyName}
Scheduled date: ${data.date}
Horaire: ${data.startTime} - ${data.endTime}
${data.reason ? `Raison: ${data.reason}` : ''}

${SITE_NAME}
    `,
  }),

  paymentFailed: (data: PaymentFailedEmailData) => ({
    subject: `Action required: Payment failed - ${SITE_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Payment Failed</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Bonjour <strong>${data.clientName}</strong>,
              </p>
              <p style="color: #666; font-size: 15px; line-height: 1.6;">
                Nous n'avons pas pu traiter votre paiement pour votre abonnement ${SITE_NAME}.
              </p>

              <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #dc2626;">
                <h3 style="margin: 0 0 15px 0; color: #b91c1c; font-size: 16px;">Details</h3>
                <table style="width: 100%; font-size: 14px;">
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Service:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.specialtyName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Date:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.date}</td>
                  </tr>
                  ${data.amount ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Montant:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.amount}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <p style="color: #666; font-size: 15px; line-height: 1.6;">
                Please update your payment information to continue your subscription.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${SITE_URL}/attorney-dashboard/parametres/facturation" style="display: inline-block; background: #3366FF; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                  Update payment
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

              <p style="color: #999; font-size: 12px; text-align: center;">
                ${SITE_NAME} - Si vous avez des questions, contactez notre support.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Bonjour ${data.clientName},

Nous n'avons pas pu traiter votre paiement pour votre abonnement ${SITE_NAME}.

Service: ${data.specialtyName}
Date: ${data.date}
${data.amount ? `Montant: ${data.amount}` : ''}

Please update your payment information to continue your subscription.

Update: ${SITE_URL}/attorney-dashboard/parametres/facturation

${SITE_NAME}
    `,
  }),
}

// Send email function
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    })

    if (error) {
      logger.error('Email send error', error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  } catch (err) {
    logger.error('Email error', err as Error)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// High-level email functions
export async function sendBookingConfirmation(data: BookingEmailData) {
  const clientEmail = templates.bookingConfirmationClient(data)
  const artisanEmail = templates.bookingNotificationArtisan(data)

  const results = await Promise.all([
    sendEmail({ to: data.clientEmail, ...clientEmail }),
    sendEmail({ to: data.artisanEmail, ...artisanEmail }),
  ])

  return {
    clientNotification: results[0],
    artisanNotification: results[1],
  }
}

export async function sendBookingReminder(data: ReminderEmailData) {
  const reminder = templates.reminderClient(data)
  return sendEmail({ to: data.clientEmail, ...reminder })
}

export async function sendCancellationNotification(data: CancellationEmailData) {
  const notification = templates.cancellationNotification(data)

  // Send to both client and artisan
  const results = await Promise.all([
    sendEmail({ to: data.clientEmail, ...notification }),
    sendEmail({ to: data.artisanEmail, ...notification }),
  ])

  return {
    clientNotification: results[0],
    artisanNotification: results[1],
  }
}

// Send payment failed email
export async function sendPaymentFailedEmail(data: PaymentFailedEmailData) {
  const email = templates.paymentFailed(data)
  return sendEmail({ to: data.clientEmail, ...email })
}

// Simplified cancellation email (for unified notification service)
export async function sendCancellationEmail(data: {
  bookingId: string
  clientName: string
  clientEmail: string
  attorneyName: string
  specialtyName: string
  date: string
  startTime: string
  cancellationReason?: string
}) {
  const notification = templates.cancellationNotification({
    bookingId: data.bookingId,
    clientName: data.clientName,
    clientEmail: data.clientEmail,
    attorneyName: data.attorneyName,
    artisanEmail: '', // Not needed for client notification
    specialtyName: data.specialtyName,
    date: data.date,
    startTime: data.startTime,
    endTime: '',
    cancelledBy: 'client',
    reason: data.cancellationReason,
  })

  return sendEmail({ to: data.clientEmail, ...notification })
}

// Log notification to database
export async function logNotification(
  supabase: SupabaseClientType,
  {
    bookingId,
    type,
    status,
    recipientEmail,
    errorMessage,
  }: {
    bookingId: string
    type: 'confirmation' | 'reminder' | 'cancellation' | 'reschedule'
    status: 'sent' | 'failed'
    recipientEmail: string
    errorMessage?: string
  }
) {
  const { error } = await supabase.from('notification_logs').insert({
    booking_id: bookingId,
    type,
    status,
    recipient_email: recipientEmail,
    error_message: errorMessage,
    sent_at: new Date().toISOString(),
  })

  if (error) {
    logger.error('Failed to log notification', error)
  }
}
