/**
 * Contact API - US Attorneys
 * Handles contact form submissions and sends emails via Resend
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
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

// Lazy initialization to avoid build-time errors
const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Please select a subject'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export async function POST(request: Request) {
  try {
    // Rate limiting
    const rl = await rateLimit(request, RATE_LIMITS.contact)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = contactSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, subject, message } = validation.data

    // Sanitise email against SMTP header injection (defence-in-depth on top of Zod .email())
    const safeEmailHeader = email.replace(/[\r\n\t]/g, '').trim()

    // Map subject to readable text
    const subjectLabels: Record<string, string> = {
      consultation: 'Question about a consultation',
      attorney: 'Issue with an attorney',
      registration: 'Attorney registration',
      partnership: 'Partnership',
      other: 'Other',
    }

    // Sanitize all user inputs for HTML
    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeSubject = escapeHtml(subjectLabels[subject] || subject)
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br />')

    // Send email to support team
    const { error: sendError } = await getResend().emails.send({
      from: process.env.FROM_EMAIL || 'contact@us-attorneys.com',
      to: 'contact@us-attorneys.com',
      reply_to: safeEmailHeader,
      subject: `[Contact] ${safeSubject} - ${safeName}`,
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <hr />
        <h3>Message:</h3>
        <p>${safeMessage}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          Message sent from the US Attorneys contact form
        </p>
      `,
    })

    if (sendError) {
      logger.error('Error sending email', sendError)
      return NextResponse.json(
        { error: 'Error sending message' },
        { status: 500 }
      )
    }

    // Send confirmation email to user (non-critical — don't fail if this errors)
    try {
      await getResend().emails.send({
        from: process.env.FROM_EMAIL || 'noreply@us-attorneys.com',
        to: email,
        subject: 'Your message has been received - US Attorneys',
        html: `
          <h2>Hello ${safeName},</h2>
          <p>We have received your message and will get back to you as soon as possible.</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <hr />
          <p><strong>Your message:</strong></p>
          <p>${safeMessage}</p>
          <hr />
          <p>Best regards,<br />The US Attorneys Team</p>
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
      message: 'Message sent successfully',
    })
  } catch (error) {
    logger.error('Contact API error', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
