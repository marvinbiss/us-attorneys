/**
 * SMS Notification System - US Attorneys
 * World-class SMS reminders using Twilio
 * Based on best practices: 98% open rate, responses within 90 seconds
 */

import twilio from 'twilio'
import { logger } from '@/lib/logger'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER

// Lazy initialize Twilio client
let twilioClient: twilio.Twilio | null = null

function getTwilioClient(): twilio.Twilio {
  if (!twilioClient) {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured')
    }
    twilioClient = twilio(accountSid, authToken)
  }
  return twilioClient
}

export interface SMSData {
  to: string
  clientName: string
  attorneyName: string
  specialtyName: string
  date: string
  time: string
  bookingId: string
}

// Format phone number for France
function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '')

  // Handle French numbers
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '33' + cleaned.substring(1)
  }

  // Add + prefix
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  }

  return cleaned
}

// SMS Templates - Keep under 160 chars for single message
const smsTemplates = {
  // Immediate confirmation
  bookingConfirmation: (data: SMSData) =>
    `Booking confirmed ✓
${data.date} at ${data.time}
${data.attorneyName}
Manage: us-attorneys.com/b/${data.bookingId.slice(0, 8)}`,

  // 24h reminder (highest impact)
  reminder24h: (data: SMSData) =>
    `Reminder: Appointment tomorrow
${data.date} at ${data.time}
${data.attorneyName}
Confirm/Cancel: us-attorneys.com/b/${data.bookingId.slice(0, 8)}`,

  // 1h reminder
  reminder1h: (data: SMSData) =>
    `Appointment in 1h
${data.time} - ${data.attorneyName}
${data.specialtyName}`,

  // Cancellation
  cancellation: (data: SMSData) =>
    `Appointment cancelled
${data.date} at ${data.time}
${data.attorneyName}
Reschedule: us-attorneys.com`,

  // Reschedule confirmation
  reschedule: (data: SMSData) =>
    `Appointment rescheduled ✓
New: ${data.date} at ${data.time}
${data.attorneyName}
Manage: us-attorneys.com/b/${data.bookingId.slice(0, 8)}`,

  // Waitlist notification
  waitlistAvailable: (data: SMSData) =>
    `Slot available!
${data.attorneyName}
${data.date}
Book now: us-attorneys.com`,

  // Review request (post-appointment)
  reviewRequest: (data: SMSData) =>
    `How was your appointment with ${data.attorneyName}?
Leave a review: us-attorneys.com/leave-review/${data.bookingId.slice(0, 8)}`,
}

// Send SMS function
export async function sendSMS(
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!fromNumber) {
      logger.warn('SMS sending disabled: TWILIO_PHONE_NUMBER not configured')
      return { success: false, error: 'SMS not configured' }
    }

    const client = getTwilioClient()
    const formattedTo = formatPhoneNumber(to)

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: formattedTo,
    })

    logger.info('SMS sent', { to: formattedTo, sid: result.sid })
    return { success: true, messageId: result.sid }
  } catch (error) {
    logger.error('SMS send error', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// High-level SMS functions
export async function sendBookingConfirmationSMS(data: SMSData) {
  const message = smsTemplates.bookingConfirmation(data)
  return sendSMS(data.to, message)
}

export async function sendReminder24hSMS(data: SMSData) {
  const message = smsTemplates.reminder24h(data)
  return sendSMS(data.to, message)
}

export async function sendReminder1hSMS(data: SMSData) {
  const message = smsTemplates.reminder1h(data)
  return sendSMS(data.to, message)
}

export async function sendCancellationSMS(data: SMSData) {
  const message = smsTemplates.cancellation(data)
  return sendSMS(data.to, message)
}

export async function sendRescheduleSMS(data: SMSData) {
  const message = smsTemplates.reschedule(data)
  return sendSMS(data.to, message)
}

export async function sendWaitlistNotificationSMS(data: SMSData) {
  const message = smsTemplates.waitlistAvailable(data)
  return sendSMS(data.to, message)
}

export async function sendReviewRequestSMS(data: SMSData) {
  const message = smsTemplates.reviewRequest(data)
  return sendSMS(data.to, message)
}

// Batch send for multiple recipients
export async function sendBatchSMS(
  recipients: { phone: string; message: string }[]
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (const recipient of recipients) {
    const result = await sendSMS(recipient.phone, recipient.message)
    if (result.success) {
      sent++
    } else {
      failed++
    }

    // Rate limiting: max 1 SMS per 100ms
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return { sent, failed }
}

// Calculate optimal reminder times
export function calculateReminderTimes(appointmentDate: Date): {
  reminder24h: Date
  reminder1h: Date
  reviewRequest: Date
} {
  const reminder24h = new Date(appointmentDate)
  reminder24h.setHours(reminder24h.getHours() - 24)

  // Send 24h reminder at 6 PM for best response rate
  if (reminder24h.getHours() < 18) {
    reminder24h.setHours(18, 0, 0, 0)
  }

  const reminder1h = new Date(appointmentDate)
  reminder1h.setHours(reminder1h.getHours() - 1)

  const reviewRequest = new Date(appointmentDate)
  reviewRequest.setHours(reviewRequest.getHours() + 2) // 2 hours after appointment

  return { reminder24h, reminder1h, reviewRequest }
}
