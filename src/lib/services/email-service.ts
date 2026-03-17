/**
 * Email Service
 * Centralized email sending with templates
 */

import { logger } from '@/lib/logger'

export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export interface EmailOptions {
  to: string | string[]
  template: EmailTemplate
  from?: string
}

const DEFAULT_FROM = 'US Attorneys <noreply@us-attorneys.com>'

/**
 * Send an email using Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    // Dev mode: log email details when API key not configured
    if (process.env.NODE_ENV === 'development') {
      logger.info('[Email Service] No RESEND_API_KEY — would send to:', { to: options.to, subject: options.template.subject })
    }
    return { success: true, id: 'dev-mode' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: options.from || DEFAULT_FROM,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.template.subject,
        html: options.template.html,
        text: options.template.text
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email')
    }

    return { success: true, id: data.id }
  } catch (error) {
    logger.error('[Email Service] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Email Templates
 */
export const emailTemplates = {
  // Welcome email for new users
  welcome: (name: string): EmailTemplate => ({
    subject: 'Welcome to US Attorneys!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome ${name}!</h1>
            </div>
            <div class="content">
              <p>We're glad to have you on US Attorneys.</p>
              <p>You can now:</p>
              <ul>
                <li>Search for qualified attorneys near you</li>
                <li>Compare reviews and rates</li>
                <li>Request free consultations</li>
                <li>Book appointments online</li>
              </ul>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/search" class="button">
                Find an attorney
              </a>
            </div>
            <div class="footer">
              <p>US Attorneys - Find qualified attorneys near you</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  // Welcome email for new attorneys
  welcomeAttorney: (name: string): EmailTemplate => ({
    subject: 'Welcome to US Attorneys - Your attorney dashboard is ready!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .step { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
            .step-number { display: inline-block; width: 30px; height: 30px; background: #059669; color: white; text-align: center; line-height: 30px; border-radius: 50%; margin-right: 10px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome ${name}!</h1>
              <p>Your attorney dashboard is ready</p>
            </div>
            <div class="content">
              <p>Congratulations! You are now part of the US Attorneys community.</p>

              <h3>Next steps:</h3>

              <div class="step">
                <span class="step-number">1</span>
                <strong>Complete your profile</strong>
                <p style="margin-left: 40px;">Add your practice areas, photos, and rates</p>
              </div>

              <div class="step">
                <span class="step-number">2</span>
                <strong>Add your portfolio</strong>
                <p style="margin-left: 40px;">Showcase your case results and credentials</p>
              </div>

              <div class="step">
                <span class="step-number">3</span>
                <strong>Set up your calendar</strong>
                <p style="margin-left: 40px;">Define your availability to receive consultation requests</p>
              </div>

              <a href="${process.env.NEXT_PUBLIC_APP_URL}/attorney-dashboard" class="button">
                Go to my dashboard
              </a>
            </div>
            <div class="footer">
              <p>US Attorneys - Find qualified attorneys near you</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  // New booking notification
  newBooking: (attorneyName: string, clientName: string, service: string, date: string): EmailTemplate => ({
    subject: `New booking from ${clientName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Booking!</h1>
            </div>
            <div class="content">
              <p>Hello ${attorneyName},</p>
              <p>You have received a new booking request.</p>

              <div class="info">
                <p><strong>Client:</strong> ${clientName}</p>
                <p><strong>Service:</strong> ${service}</p>
                <p><strong>Requested date:</strong> ${date}</p>
              </div>

              <p>Respond quickly to increase your conversion rate!</p>

              <a href="${process.env.NEXT_PUBLIC_APP_URL}/attorney-dashboard/requests" class="button">
                View request
              </a>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  // Review request
  reviewRequest: (clientName: string, attorneyName: string, bookingId: string): EmailTemplate => ({
    subject: `Leave a review for ${attorneyName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .stars { font-size: 32px; text-align: center; margin: 20px 0; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>How was your consultation?</h1>
            </div>
            <div class="content">
              <p>Hello ${clientName},</p>
              <p>Your consultation with <strong>${attorneyName}</strong> is complete.</p>
              <p>Take 2 minutes to leave a review and help other clients make their choice.</p>

              <div class="stars">⭐⭐⭐⭐⭐</div>

              <p style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/leave-review/${bookingId}" class="button">
                  Leave a review
                </a>
              </p>

              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Your review is important to the community and helps attorneys improve their services.
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  // Video booking confirmation for client
  bookingConfirmationClient: (clientName: string, attorneyName: string, specialty: string, date: string, time: string, dailyUrl: string): EmailTemplate => ({
    subject: `Your video consultation with ${attorneyName} is confirmed`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmed</h1>
            </div>
            <div class="content">
              <p>Hello ${clientName},</p>
              <p>Your video consultation has been confirmed. Here are the details:</p>

              <div class="info">
                <p><strong>Attorney:</strong> ${attorneyName}</p>
                <p><strong>Practice Area:</strong> ${specialty}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${time}</p>
              </div>

              <p>When it's time for your consultation, click the button below to join the video call:</p>

              <p style="text-align: center;">
                <a href="${dailyUrl}" class="button">
                  Join Video Consultation
                </a>
              </p>

              <p style="color: #666; font-size: 13px;">
                Please join 2-3 minutes before your scheduled time. Make sure your camera and microphone are working properly.
              </p>
            </div>
            <div class="footer">
              <p>US Attorneys - Find qualified attorneys near you</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  // Video booking notification for attorney
  bookingNotificationAttorney: (attorneyName: string, clientName: string, clientEmail: string, specialty: string, date: string, time: string, notes: string, dashboardUrl: string): EmailTemplate => ({
    subject: `New video consultation booked by ${clientName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .notes { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 15px 0; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Video Consultation</h1>
            </div>
            <div class="content">
              <p>Hello ${attorneyName},</p>
              <p>A new video consultation has been booked with you.</p>

              <div class="info">
                <p><strong>Client:</strong> ${clientName}</p>
                <p><strong>Email:</strong> ${clientEmail}</p>
                <p><strong>Practice Area:</strong> ${specialty}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${time}</p>
              </div>

              ${notes ? `
              <div class="notes">
                <p><strong>Client Notes:</strong></p>
                <p>${notes}</p>
              </div>
              ` : ''}

              <p style="text-align: center;">
                <a href="${dashboardUrl}" class="button">
                  View in Dashboard
                </a>
              </p>
            </div>
            <div class="footer">
              <p>US Attorneys - Find qualified attorneys near you</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  // 1-hour reminder before video consultation
  bookingReminder: (name: string, attorneyName: string, date: string, time: string, dailyUrl: string): EmailTemplate => ({
    subject: `Reminder: Video consultation with ${attorneyName} in 1 hour`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Consultation in 1 Hour</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>This is a reminder that your video consultation is starting soon.</p>

              <div class="info">
                <p><strong>Attorney:</strong> ${attorneyName}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${time}</p>
              </div>

              <p>Please make sure you are in a quiet place with a stable internet connection.</p>

              <p style="text-align: center;">
                <a href="${dailyUrl}" class="button">
                  Join Video Consultation
                </a>
              </p>

              <p style="color: #666; font-size: 13px;">
                We recommend joining 2-3 minutes early to test your camera and microphone.
              </p>
            </div>
            <div class="footer">
              <p>US Attorneys - Find qualified attorneys near you</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  // Password reset
  passwordReset: (name: string, resetLink: string): EmailTemplate => ({
    subject: 'Password Reset - US Attorneys',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>You requested to reset your password.</p>
              <p>Click the button below to create a new password:</p>

              <p style="text-align: center;">
                <a href="${resetLink}" class="button">
                  Reset my password
                </a>
              </p>

              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This link expires in 1 hour. If you did not request this reset, please ignore this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  })
}

export default {
  sendEmail,
  emailTemplates
}
