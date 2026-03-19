/**
 * Resend Email API Client
 * Transactional email with world-class reliability
 * Documentation: https://resend.com/docs
 */

import { Resend } from 'resend'
import { retry } from '../utils/retry'
import { APIError, ErrorCode, AppError, ValidationError } from '../utils/errors'
import { apiLogger } from '@/lib/logger'

// Lazy-loaded Resend client
let resendClient: Resend | null = null

export function getResendClient(): Resend {
  if (resendClient) return resendClient

  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new APIError('Resend', 'API key not configured', {
      code: ErrorCode.API_UNAUTHORIZED,
    })
  }

  resendClient = new Resend(apiKey)
  return resendClient
}

// Default sender
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'US Attorneys <noreply@lawtendr.com>'

// Types
export interface EmailParams {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  tags?: { name: string; value: string }[]
  headers?: Record<string, string>
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
}

export interface EmailResult {
  id: string
  from: string
  to: string[]
  createdAt: Date
}

export interface BatchEmailParams {
  emails: EmailParams[]
}

// ============================================
// EMAIL SENDING
// ============================================

/**
 * Send a single email
 */
export async function sendEmail(params: EmailParams): Promise<EmailResult> {
  const logger = apiLogger.child({ action: 'sendEmail' })
  const start = Date.now()

  // Validate
  if (!params.to) {
    throw new ValidationError('Recipient email is required', { field: 'to' })
  }
  if (!params.subject) {
    throw new ValidationError('Email subject is required', { field: 'subject' })
  }
  if (!params.html && !params.text) {
    throw new ValidationError('Email content (html or text) is required')
  }

  try {
    const resend = getResendClient()

    type ResendSendParams = Parameters<typeof resend.emails.send>[0]

    const result = await retry(
      async () => {
        const emailData = {
          from: params.from || DEFAULT_FROM,
          to: Array.isArray(params.to) ? params.to : [params.to],
          subject: params.subject,
          ...(params.html ? { html: params.html } : {}),
          ...(params.text ? { text: params.text } : {}),
          ...(params.replyTo ? { reply_to: params.replyTo } : {}),
          ...(params.cc ? { cc: Array.isArray(params.cc) ? params.cc : [params.cc] } : {}),
          ...(params.bcc ? { bcc: Array.isArray(params.bcc) ? params.bcc : [params.bcc] } : {}),
          ...(params.tags ? { tags: params.tags } : {}),
          ...(params.headers ? { headers: params.headers } : {}),
          ...(params.attachments?.length ? {
            attachments: params.attachments.map(a => ({
              filename: a.filename,
              content: typeof a.content === 'string' ? Buffer.from(a.content) : a.content,
            })),
          } : {}),
        } as ResendSendParams

        const response = await resend.emails.send(emailData)

        if (response.error) {
          throw new APIError('Resend', response.error.message, {
            code: ErrorCode.API_ERROR,
            retryable: true,
          })
        }

        return response.data
      },
      {
        maxAttempts: 3,
        initialDelay: 1000,
        onRetry: (error, attempt) => {
          logger.warn(`Retry attempt ${attempt}`, { error, to: params.to })
        },
      }
    )

    logger.info('Email sent', {
      emailId: result?.id,
      to: params.to,
      subject: params.subject,
      duration: Date.now() - start,
    })

    return {
      id: result?.id || '',
      from: params.from || DEFAULT_FROM,
      to: Array.isArray(params.to) ? params.to : [params.to],
      createdAt: new Date(),
    }
  } catch (error: unknown) {
    logger.error('Failed to send email', error as Error, {
      to: params.to,
      subject: params.subject,
    })
    throw normalizeResendError(error)
  }
}

/**
 * Send batch emails
 */
export async function sendBatchEmails(params: BatchEmailParams): Promise<EmailResult[]> {
  const logger = apiLogger.child({ action: 'sendBatchEmails' })
  const start = Date.now()

  if (!params.emails.length) {
    return []
  }

  try {
    const resend = getResendClient()

    type ResendBatchParams = Parameters<typeof resend.batch.send>[0]

    const batchParams = params.emails.map(email => ({
      from: email.from || DEFAULT_FROM,
      to: Array.isArray(email.to) ? email.to : [email.to],
      subject: email.subject,
      ...(email.html ? { html: email.html } : {}),
      ...(email.text ? { text: email.text } : {}),
      ...(email.replyTo ? { reply_to: email.replyTo } : {}),
    })) as ResendBatchParams

    const response = await resend.batch.send(batchParams)

    if (response.error) {
      throw new APIError('Resend', response.error.message, {
        code: ErrorCode.API_ERROR,
        retryable: true,
      })
    }

    logger.info('Batch emails sent', {
      count: params.emails.length,
      duration: Date.now() - start,
    })

    return (response.data?.data || []).map((result: { id: string }, index: number) => ({
      id: result.id,
      from: params.emails[index].from || DEFAULT_FROM,
      to: Array.isArray(params.emails[index].to)
        ? params.emails[index].to as string[]
        : [params.emails[index].to as string],
      createdAt: new Date(),
    }))
  } catch (error: unknown) {
    logger.error('Failed to send batch emails', error as Error, {
      count: params.emails.length,
    })
    throw normalizeResendError(error)
  }
}

// ============================================
// EMAIL TEMPLATES
// ============================================

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(params: {
  to: string
  name: string
  isAttorney?: boolean
}): Promise<EmailResult> {
  const { to, name, isAttorney } = params

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">US Attorneys</h1>
  </div>

  <h2>Welcome ${name}!</h2>

  <p>We're glad to have you on US Attorneys${isAttorney ? ', the platform that connects attorneys with their clients' : ''}.</p>

  ${isAttorney ? `
  <p>Next steps to get started:</p>
  <ul>
    <li>Complete your professional profile</li>
    <li>Add photos of your work</li>
    <li>Define your service area</li>
    <li>Set up your availability</li>
  </ul>
  ` : `
  <p>You can now:</p>
  <ul>
    <li>Search for qualified attorneys</li>
    <li>Request free consultations</li>
    <li>Book appointments online</li>
  </ul>
  `}

  <div style="text-align: center; margin: 30px 0;">
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
      Go to my account
    </a>
  </div>

  <p style="color: #666; font-size: 14px;">
    If you have any questions, feel free to contact us at support@lawtendr.com
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    US Attorneys - Find qualified attorneys near you
  </p>
</body>
</html>
  `

  return sendEmail({
    to,
    subject: `Welcome to US Attorneys${isAttorney ? '!' : ', ' + name}`,
    html,
    tags: [
      { name: 'type', value: 'welcome' },
      { name: 'user_type', value: isAttorney ? 'attorney' : 'client' },
    ],
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(params: {
  to: string
  name: string
  resetLink: string
}): Promise<EmailResult> {
  const { to, name, resetLink } = params

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">US Attorneys</h1>
  </div>

  <h2>Password Reset</h2>

  <p>Hello ${name},</p>

  <p>You requested to reset your password. Click the button below to create a new password:</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
      Reset my password
    </a>
  </div>

  <p style="color: #666; font-size: 14px;">
    This link expires in 1 hour. If you did not make this request, please ignore this email.
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    US Attorneys - Find qualified attorneys near you
  </p>
</body>
</html>
  `

  return sendEmail({
    to,
    subject: 'Password Reset - US Attorneys',
    html,
    tags: [{ name: 'type', value: 'password_reset' }],
  })
}

/**
 * Send claim approved email (attorney sets password)
 */
export async function sendClaimApprovedEmail(params: {
  to: string
  name: string
  attorneyName: string
  passwordLink: string
}): Promise<EmailResult> {
  const { to, name, attorneyName, passwordLink } = params

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #f59e0b; margin: 0;">US Attorneys</h1>
  </div>

  <h2 style="color: #333;">Great news, ${name}!</h2>

  <p>Your claim request for <strong>${attorneyName}</strong> has been approved by our team.</p>

  <p>Your attorney profile is now active. To access your dashboard and manage your leads, set your password:</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${passwordLink}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Set my password
    </a>
  </div>

  <p style="color: #666; font-size: 14px;">
    This link is valid for 24 hours. After that, you can use the "Forgot password" feature to generate a new one.
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    US Attorneys - Find qualified attorneys near you<br>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://lawtendr.com'}" style="color: #999;">lawtendr.com</a>
  </p>
</body>
</html>
  `

  return sendEmail({
    to,
    subject: `Your profile "${attorneyName}" has been approved - US Attorneys`,
    html,
    tags: [
      { name: 'type', value: 'claim_approved' },
    ],
  })
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(params: {
  to: string
  clientName: string
  attorneyName: string
  specialtyName: string
  date: string
  time: string
  address: string
  bookingId: string
}): Promise<EmailResult> {
  const { to, clientName, attorneyName, specialtyName, date, time, address, bookingId } = params

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">US Attorneys</h1>
  </div>

  <h2>Appointment Confirmed!</h2>

  <p>Hello ${clientName},</p>

  <p>Your appointment with <strong>${attorneyName}</strong> is confirmed.</p>

  <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0;"><strong>Service:</strong> ${specialtyName}</p>
    <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${date}</p>
    <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${time}</p>
    <p style="margin: 0;"><strong>Address:</strong> ${address}</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/reservations/${bookingId}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
      View my appointment
    </a>
  </div>

  <p style="color: #666; font-size: 14px;">
    Need to reschedule or cancel? Visit your client dashboard.
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    US Attorneys - Find qualified attorneys near you
  </p>
</body>
</html>
  `

  return sendEmail({
    to,
    subject: `Appointment confirmed with ${attorneyName} - ${date}`,
    html,
    tags: [
      { name: 'type', value: 'booking_confirmation' },
      { name: 'booking_id', value: bookingId },
    ],
  })
}

/**
 * Send quote request notification to attorney
 */
export async function sendQuoteRequestEmail(params: {
  to: string
  attorneyName: string
  clientName: string
  specialtyName: string
  description: string
  quoteId: string
}): Promise<EmailResult> {
  const { to, attorneyName, clientName, specialtyName, description, quoteId } = params

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">US Attorneys</h1>
  </div>

  <h2>New Consultation Request!</h2>

  <p>Hello ${attorneyName},</p>

  <p>You have received a new consultation request from <strong>${clientName}</strong>.</p>

  <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0;"><strong>Requested service:</strong> ${specialtyName}</p>
    <p style="margin: 0;"><strong>Description:</strong></p>
    <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${description}</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/attorney-dashboard/quotes/${quoteId}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
      Respond to the request
    </a>
  </div>

  <p style="color: #666; font-size: 14px;">
    Respond quickly to increase your chances of winning this case!
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    US Attorneys - Find qualified attorneys near you
  </p>
</body>
</html>
  `

  return sendEmail({
    to,
    subject: `New consultation request - ${specialtyName}`,
    html,
    tags: [
      { name: 'type', value: 'quote_request' },
      { name: 'quote_id', value: quoteId },
    ],
  })
}

// ============================================
// ERROR HANDLING
// ============================================

function normalizeResendError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  const message = error instanceof Error ? error.message : String(error)

  // Check for specific error patterns
  if (message.includes('rate limit')) {
    return new APIError('Resend', 'Rate limit exceeded', {
      code: ErrorCode.API_RATE_LIMIT,
      statusCode: 429,
      retryable: true,
    })
  }

  if (message.includes('unauthorized') || message.includes('API key')) {
    return new APIError('Resend', 'Authentication failed', {
      code: ErrorCode.API_UNAUTHORIZED,
      statusCode: 401,
      retryable: false,
    })
  }

  if (message.includes('validation')) {
    return new ValidationError(message)
  }

  return new APIError('Resend', message, {
    code: ErrorCode.API_ERROR,
    retryable: true,
    originalError: error instanceof Error ? error : undefined,
  })
}
