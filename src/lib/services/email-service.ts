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

const DEFAULT_FROM = 'ServicesArtisans <noreply@us-attorneys.com>'

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
    subject: 'Bienvenue sur ServicesArtisans !',
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
              <h1>Bienvenue ${name} !</h1>
            </div>
            <div class="content">
              <p>Nous sommes ravis de vous accueillir sur ServicesArtisans.</p>
              <p>Vous pouvez maintenant :</p>
              <ul>
                <li>Rechercher des artisans qualifiés près de chez vous</li>
                <li>Comparer les avis et les tarifs</li>
                <li>Demander des devis gratuits</li>
                <li>Réserver directement en ligne</li>
              </ul>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/search" class="button">
                Trouver un artisan
              </a>
            </div>
            <div class="footer">
              <p>ServicesArtisans - Trouvez des artisans qualifiés près de chez vous</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  // Welcome email for new artisans
  welcomeArtisan: (name: string): EmailTemplate => ({
    subject: 'Bienvenue sur ServicesArtisans - Votre espace artisan est prêt !',
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
              <h1>Bienvenue ${name} !</h1>
              <p>Votre espace artisan est prêt</p>
            </div>
            <div class="content">
              <p>Félicitations ! Vous faites maintenant partie de la communauté ServicesArtisans.</p>

              <h3>Prochaines étapes :</h3>

              <div class="step">
                <span class="step-number">1</span>
                <strong>Complétez votre profil</strong>
                <p style="margin-left: 40px;">Ajoutez vos spécialités, photos et tarifs</p>
              </div>

              <div class="step">
                <span class="step-number">2</span>
                <strong>Ajoutez votre portfolio</strong>
                <p style="margin-left: 40px;">Montrez vos réalisations avec des photos avant/après</p>
              </div>

              <div class="step">
                <span class="step-number">3</span>
                <strong>Configurez votre calendrier</strong>
                <p style="margin-left: 40px;">Définissez vos disponibilités pour recevoir des demandes</p>
              </div>

              <a href="${process.env.NEXT_PUBLIC_APP_URL}/attorney-dashboard" class="button">
                Accéder à mon espace
              </a>
            </div>
            <div class="footer">
              <p>ServicesArtisans - Trouvez des artisans qualifiés près de chez vous</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  // New booking notification
  newBooking: (attorneyName: string, clientName: string, service: string, date: string): EmailTemplate => ({
    subject: `Nouvelle réservation de ${clientName}`,
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
              <h1>Nouvelle réservation !</h1>
            </div>
            <div class="content">
              <p>Bonjour ${attorneyName},</p>
              <p>Vous avez reçu une nouvelle demande de réservation.</p>

              <div class="info">
                <p><strong>Client :</strong> ${clientName}</p>
                <p><strong>Service :</strong> ${service}</p>
                <p><strong>Date souhaitée :</strong> ${date}</p>
              </div>

              <p>Répondez rapidement pour augmenter vos chances de conversion !</p>

              <a href="${process.env.NEXT_PUBLIC_APP_URL}/attorney-dashboard/demandes" class="button">
                Voir la demande
              </a>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  // Review request
  reviewRequest: (clientName: string, attorneyName: string, bookingId: string): EmailTemplate => ({
    subject: `Donnez votre avis sur ${attorneyName}`,
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
              <h1>Comment s'est passée votre intervention ?</h1>
            </div>
            <div class="content">
              <p>Bonjour ${clientName},</p>
              <p>Votre intervention avec <strong>${attorneyName}</strong> est terminée.</p>
              <p>Prenez 2 minutes pour laisser un avis et aider d'autres clients à choisir.</p>

              <div class="stars">⭐⭐⭐⭐⭐</div>

              <p style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/leave-review/${bookingId}" class="button">
                  Donner mon avis
                </a>
              </p>

              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Votre avis est important pour la communauté et aide les artisans à améliorer leurs services.
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  // Password reset
  passwordReset: (name: string, resetLink: string): EmailTemplate => ({
    subject: 'Réinitialisation de votre mot de passe',
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
              <h1>Réinitialisation du mot de passe</h1>
            </div>
            <div class="content">
              <p>Bonjour ${name},</p>
              <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
              <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>

              <p style="text-align: center;">
                <a href="${resetLink}" class="button">
                  Réinitialiser mon mot de passe
                </a>
              </p>

              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
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
