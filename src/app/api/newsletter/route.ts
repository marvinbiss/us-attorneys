/**
 * Newsletter API - US Attorneys
 * Handles newsletter subscriptions
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getResendClient } from '@/lib/api/resend-client'
import { z } from 'zod'

const getResend = () => getResendClient()

const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const validation = newsletterSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // Send welcome email (non-blocking — don't crash signup if email fails)
    try {
      await getResend().emails.send({
        from: process.env.FROM_EMAIL || 'noreply@us-attorneys.com',
        to: email,
        subject: 'Welcome to the US Attorneys Newsletter!',
        html: `
          <h2>Welcome!</h2>
          <p>Thank you for subscribing to our newsletter.</p>
          <p>You will regularly receive our best articles and insights on legal matters:</p>
          <ul>
            <li>Practical legal guides</li>
            <li>Expert advice</li>
            <li>Legal industry trends</li>
            <li>Know your rights</li>
          </ul>
          <p>See you soon on US Attorneys!</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            To unsubscribe, simply reply to this email.<br />
            <a href="https://us-attorneys.com">us-attorneys.com</a>
          </p>
        `,
      })
    } catch (emailError) {
      logger.error('Newsletter welcome email failed', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription confirmed',
    })
  } catch (error: unknown) {
    logger.error('Newsletter API error', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
