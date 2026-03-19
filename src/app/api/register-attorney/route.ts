/**
 * Attorney Registration API - US Attorneys
 * Handles attorney registration applications
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getResendClient } from '@/lib/api/resend-client'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { z } from 'zod'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

const getResend = () => getResendClient()

const attorneyRegistrationSchema = z.object({
  // Step 1 - Firm
  firmName: z.string().min(2, 'Firm name is required'),
  barNumber: z.string().min(1, 'Bar number is required'),
  practiceArea: z.string().min(1, 'Practice area is required'),
  otherPracticeArea: z.string().optional(),
  // Step 2 - Contact
  lastName: z.string().min(2, 'Last name is required'),
  firstName: z.string().min(2, 'First name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Invalid phone number'),
  // Step 3 - Location
  address: z.string().min(5, 'Address is required'),
  zipCode: z.string().min(5, 'Invalid ZIP code'),
  city: z.string().min(2, 'City is required'),
  serviceRadius: z.string(),
  // Step 4 - Description
  description: z.string().optional(),
  experience: z.string().optional(),
  certifications: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    // Rate limiting: 3 per 5 minutes (registration preset)
    const rl = await rateLimit(request, RATE_LIMITS.registration)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = attorneyRegistrationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data
    const practiceAreaFinal = data.practiceArea === 'Other' ? data.otherPracticeArea : data.practiceArea

    // Send both emails in parallel (neither should crash the signup)
    const emailResults = await Promise.allSettled([
      getResend().emails.send({
        from: process.env.FROM_EMAIL || 'noreply@lawtendr.com',
        to: data.email,
        subject: 'Your registration on US Attorneys - Confirmation',
        html: `
          <h2>Hello ${escapeHtml(data.firstName ?? '')} ${escapeHtml(data.lastName ?? '')},</h2>
          <p>We have received your registration request as an attorney on US Attorneys.</p>
          <p><strong>Registration summary:</strong></p>
          <ul>
            <li><strong>Firm:</strong> ${escapeHtml(data.firmName ?? '')}</li>
            <li><strong>Bar Number:</strong> ${escapeHtml(data.barNumber ?? '')}</li>
            <li><strong>Practice area:</strong> ${escapeHtml(practiceAreaFinal ?? '')}</li>
            <li><strong>Coverage area:</strong> ${escapeHtml(data.city ?? '')} (${escapeHtml(data.serviceRadius ?? '')} miles)</li>
          </ul>
          <p>Our team will verify your information and you will receive a response within 24-48 hours.</p>
          <p>Welcome to US Attorneys!</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            <a href="https://lawtendr.com">lawtendr.com</a>
          </p>
        `,
      }),
      getResend().emails.send({
        from: process.env.FROM_EMAIL || 'noreply@lawtendr.com',
        to: 'attorneys@lawtendr.com',
        subject: `[New registration] ${escapeHtml(data.firmName ?? '')} - ${escapeHtml(practiceAreaFinal ?? '')}`,
        html: `
          <h2>New attorney registration request</h2>
          <h3>Firm</h3>
          <ul>
            <li><strong>Name:</strong> ${escapeHtml(data.firmName ?? '')}</li>
            <li><strong>Bar Number:</strong> ${escapeHtml(data.barNumber ?? '')}</li>
            <li><strong>Practice area:</strong> ${escapeHtml(practiceAreaFinal ?? '')}</li>
          </ul>
          <h3>Contact</h3>
          <ul>
            <li><strong>Name:</strong> ${escapeHtml(data.firstName ?? '')} ${escapeHtml(data.lastName ?? '')}</li>
            <li><strong>Email:</strong> ${escapeHtml(data.email ?? '')}</li>
            <li><strong>Phone:</strong> ${escapeHtml(data.phone ?? '')}</li>
          </ul>
          <h3>Location</h3>
          <ul>
            <li><strong>Address:</strong> ${escapeHtml(data.address ?? '')}</li>
            <li><strong>City:</strong> ${escapeHtml(data.zipCode ?? '')} ${escapeHtml(data.city ?? '')}</li>
            <li><strong>Coverage radius:</strong> ${escapeHtml(data.serviceRadius ?? '')} miles</li>
          </ul>
          ${data.description ? `<h3>Description</h3><p>${escapeHtml(data.description)}</p>` : ''}
          ${data.experience ? `<p><strong>Experience:</strong> ${escapeHtml(data.experience)}</p>` : ''}
          ${data.certifications ? `<p><strong>Certifications:</strong> ${escapeHtml(data.certifications)}</p>` : ''}
          <hr />
          <p><a href="https://lawtendr.com/admin">Access admin dashboard</a></p>
        `,
      }),
    ])

    // Log any email failures
    emailResults.forEach((result, i) => {
      if (result.status === 'rejected') {
        logger.error(`Email ${i} failed:`, result.reason)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Registration recorded successfully',
    })
  } catch (error: unknown) {
    logger.error('Attorney registration API error', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
