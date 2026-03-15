/**
 * Contact API - ServicesArtisans
 * Handles contact form submissions and sends emails via Resend
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { Resend } from 'resend'
import { z } from 'zod'

// HTML escape function to prevent XSS
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  }
  return text.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char])
}

export const dynamic = 'force-dynamic'

// Lazy initialization to avoid build-time errors
const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

const contactSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  sujet: z.string().min(1, 'Veuillez sélectionner un sujet'),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const validation = contactSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { nom, email, sujet, message } = validation.data

    // Sanitise email against SMTP header injection (defence-in-depth on top of Zod .email())
    const safeEmailHeader = email.replace(/[\r\n\t]/g, '').trim()

    // Map subject to readable text
    const sujetTexte: Record<string, string> = {
      devis: 'Question sur un devis',
      artisan: 'Problème avec un artisan',
      inscription: 'Inscription artisan',
      partenariat: 'Partenariat',
      autre: 'Autre',
    }

    // Sanitize all user inputs for HTML
    const safeNom = escapeHtml(nom)
    const safeEmail = escapeHtml(email)
    const safeSujet = escapeHtml(sujetTexte[sujet] || sujet)
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br />')

    // Send email to support team
    const { error: sendError } = await getResend().emails.send({
      from: process.env.FROM_EMAIL || 'contact@us-attorneys.com',
      to: 'contact@us-attorneys.com',
      reply_to: safeEmailHeader,
      subject: `[Contact] ${safeSujet} - ${safeNom}`,
      html: `
        <h2>Nouveau message de contact</h2>
        <p><strong>Nom:</strong> ${safeNom}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Sujet:</strong> ${safeSujet}</p>
        <hr />
        <h3>Message:</h3>
        <p>${safeMessage}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          Message envoyé depuis le formulaire de contact de ServicesArtisans
        </p>
      `,
    })

    if (sendError) {
      logger.error('Error sending email', sendError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi du message' },
        { status: 500 }
      )
    }

    // Send confirmation email to user (non-critical — don't fail if this errors)
    try {
      await getResend().emails.send({
        from: process.env.FROM_EMAIL || 'noreply@us-attorneys.com',
        to: email,
        subject: 'Votre message a bien été reçu - ServicesArtisans',
        html: `
          <h2>Bonjour ${safeNom},</h2>
          <p>Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.</p>
          <p><strong>Sujet:</strong> ${safeSujet}</p>
          <hr />
          <p><strong>Votre message:</strong></p>
          <p>${safeMessage}</p>
          <hr />
          <p>Cordialement,<br />L'équipe ServicesArtisans</p>
          <p style="color: #666; font-size: 12px;">
            <a href="https://us-attorneys.com">us-attorneys.com</a>
          </p>
        `,
      })
    } catch (confirmError) {
      logger.error('Confirmation email failed', confirmError)
    }

    return NextResponse.json({
      success: true,
      message: 'Message envoyé avec succès',
    })
  } catch (error) {
    logger.error('Contact API error', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
