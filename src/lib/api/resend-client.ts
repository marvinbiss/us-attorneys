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
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'ServicesArtisans <noreply@servicesartisans.fr>'

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
  } catch (error) {
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
  } catch (error) {
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
  isArtisan?: boolean
}): Promise<EmailResult> {
  const { to, name, isArtisan } = params

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">ServicesArtisans</h1>
  </div>

  <h2>Bienvenue ${name} !</h2>

  <p>Nous sommes ravis de vous accueillir sur ServicesArtisans${isArtisan ? ', la plateforme qui connecte les artisans avec leurs clients' : ''}.</p>

  ${isArtisan ? `
  <p>Prochaines étapes pour démarrer :</p>
  <ul>
    <li>Complétez votre profil professionnel</li>
    <li>Ajoutez vos photos de réalisations</li>
    <li>Définissez votre zone d'intervention</li>
    <li>Configurez vos disponibilités</li>
  </ul>
  ` : `
  <p>Vous pouvez maintenant :</p>
  <ul>
    <li>Rechercher des artisans qualifies</li>
    <li>Demander des devis gratuits</li>
    <li>Prendre rendez-vous en ligne</li>
  </ul>
  `}

  <div style="text-align: center; margin: 30px 0;">
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
      Acceder a mon compte
    </a>
  </div>

  <p style="color: #666; font-size: 14px;">
    Si vous avez des questions, n'hesitez pas a nous contacter a support@servicesartisans.fr
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    ServicesArtisans - La plateforme des artisans qualifies
  </p>
</body>
</html>
  `

  return sendEmail({
    to,
    subject: `Bienvenue sur ServicesArtisans${isArtisan ? ' !' : ', ' + name}`,
    html,
    tags: [
      { name: 'type', value: 'welcome' },
      { name: 'user_type', value: isArtisan ? 'artisan' : 'client' },
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
    <h1 style="color: #2563eb; margin: 0;">ServicesArtisans</h1>
  </div>

  <h2>Reinitialisation de mot de passe</h2>

  <p>Bonjour ${name},</p>

  <p>Vous avez demande a reinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour creer un nouveau mot de passe :</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
      Reinitialiser mon mot de passe
    </a>
  </div>

  <p style="color: #666; font-size: 14px;">
    Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    ServicesArtisans - La plateforme des artisans qualifies
  </p>
</body>
</html>
  `

  return sendEmail({
    to,
    subject: 'Reinitialisation de votre mot de passe - ServicesArtisans',
    html,
    tags: [{ name: 'type', value: 'password_reset' }],
  })
}

/**
 * Send claim approved email (artisan sets password)
 */
export async function sendClaimApprovedEmail(params: {
  to: string
  name: string
  providerName: string
  passwordLink: string
}): Promise<EmailResult> {
  const { to, name, providerName, passwordLink } = params

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #f59e0b; margin: 0;">ServicesArtisans</h1>
  </div>

  <h2 style="color: #333;">Bonne nouvelle, ${name} !</h2>

  <p>Votre demande de revendication pour <strong>${providerName}</strong> a ete approuvee par notre equipe.</p>

  <p>Votre fiche artisan est desormais active. Pour acceder a votre espace et gerer vos leads, definissez votre mot de passe :</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${passwordLink}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Definir mon mot de passe
    </a>
  </div>

  <p style="color: #666; font-size: 14px;">
    Ce lien est valable pendant 24 heures. Apres ce delai, vous pourrez utiliser la fonction "Mot de passe oublie" pour en generer un nouveau.
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    ServicesArtisans - La plateforme des artisans qualifies<br>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://servicesartisans.fr'}" style="color: #999;">servicesartisans.fr</a>
  </p>
</body>
</html>
  `

  return sendEmail({
    to,
    subject: `Votre fiche "${providerName}" a ete validee - ServicesArtisans`,
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
  artisanName: string
  serviceName: string
  date: string
  time: string
  address: string
  bookingId: string
}): Promise<EmailResult> {
  const { to, clientName, artisanName, serviceName, date, time, address, bookingId } = params

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">ServicesArtisans</h1>
  </div>

  <h2>Reservation confirmee !</h2>

  <p>Bonjour ${clientName},</p>

  <p>Votre rendez-vous avec <strong>${artisanName}</strong> est confirme.</p>

  <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0;"><strong>Service :</strong> ${serviceName}</p>
    <p style="margin: 0 0 10px 0;"><strong>Date :</strong> ${date}</p>
    <p style="margin: 0 0 10px 0;"><strong>Heure :</strong> ${time}</p>
    <p style="margin: 0;"><strong>Adresse :</strong> ${address}</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/reservations/${bookingId}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
      Voir ma reservation
    </a>
  </div>

  <p style="color: #666; font-size: 14px;">
    Besoin de modifier ou annuler ? Rendez-vous dans votre espace client.
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    ServicesArtisans - La plateforme des artisans qualifies
  </p>
</body>
</html>
  `

  return sendEmail({
    to,
    subject: `Rendez-vous confirme avec ${artisanName} - ${date}`,
    html,
    tags: [
      { name: 'type', value: 'booking_confirmation' },
      { name: 'booking_id', value: bookingId },
    ],
  })
}

/**
 * Send quote request notification to artisan
 */
export async function sendQuoteRequestEmail(params: {
  to: string
  artisanName: string
  clientName: string
  serviceName: string
  description: string
  quoteId: string
}): Promise<EmailResult> {
  const { to, artisanName, clientName, serviceName, description, quoteId } = params

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">ServicesArtisans</h1>
  </div>

  <h2>Nouvelle demande de devis !</h2>

  <p>Bonjour ${artisanName},</p>

  <p>Vous avez reçu une nouvelle demande de devis de <strong>${clientName}</strong>.</p>

  <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0;"><strong>Service demandé :</strong> ${serviceName}</p>
    <p style="margin: 0;"><strong>Description :</strong></p>
    <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${description}</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/artisan/devis/${quoteId}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
      Repondre a la demande
    </a>
  </div>

  <p style="color: #666; font-size: 14px;">
    Repondez rapidement pour augmenter vos chances de decrocher ce projet !
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    ServicesArtisans - La plateforme des artisans qualifies
  </p>
</body>
</html>
  `

  return sendEmail({
    to,
    subject: `Nouvelle demande de devis - ${serviceName}`,
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
