/**
 * Attorney Registration API - US Attorneys
 * Handles attorney registration applications
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getResendClient } from '@/lib/api/resend-client'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

const getResend = () => getResendClient()

const artisanSchema = z.object({
  // Step 1 - Company
  entreprise: z.string().min(2, 'Business name is required'),
  siret: z.string().min(1, 'Bar number is required'),
  metier: z.string().min(1, 'Practice area is required'),
  autreMetier: z.string().optional(),
  // Step 2 - Contact
  nom: z.string().min(2, 'Name is required'),
  prenom: z.string().min(2, 'First name is required'),
  email: z.string().email('Invalid email'),
  telephone: z.string().min(10, 'Invalid phone number'),
  // Step 3 - Location
  adresse: z.string().min(5, 'Address is required'),
  codePostal: z.string().min(5, 'Invalid postal code'),
  ville: z.string().min(2, 'City is required'),
  rayonIntervention: z.string(),
  // Step 4 - Description
  description: z.string().optional(),
  experience: z.string().optional(),
  certifications: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const validation = artisanSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data
    const metierFinal = data.metier === 'Autre' ? data.autreMetier : data.metier

    // Send both emails in parallel (neither should crash the signup)
    const emailResults = await Promise.allSettled([
      getResend().emails.send({
        from: process.env.FROM_EMAIL || 'noreply@us-attorneys.com',
        to: data.email,
        subject: 'Your registration on US Attorneys - Confirmation',
        html: `
          <h2>Hello ${escapeHtml(data.prenom ?? '')} ${escapeHtml(data.nom ?? '')},</h2>
          <p>We have received your registration request as an attorney on US Attorneys.</p>
          <p><strong>Registration summary:</strong></p>
          <ul>
            <li><strong>Firm:</strong> ${escapeHtml(data.entreprise ?? '')}</li>
            <li><strong>Bar Number:</strong> ${escapeHtml(data.siret ?? '')}</li>
            <li><strong>Practice area:</strong> ${escapeHtml(metierFinal ?? '')}</li>
            <li><strong>Coverage area:</strong> ${escapeHtml(data.ville ?? '')} (${escapeHtml(data.rayonIntervention ?? '')} km)</li>
          </ul>
          <p>Our team will verify your information and you will receive a response within 24-48 hours.</p>
          <p>See you on US Attorneys!</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            <a href="https://us-attorneys.com">us-attorneys.com</a>
          </p>
        `,
      }),
      getResend().emails.send({
        from: process.env.FROM_EMAIL || 'noreply@us-attorneys.com',
        to: 'attorneys@us-attorneys.com',
        subject: `[New registration] ${escapeHtml(data.entreprise ?? '')} - ${escapeHtml(metierFinal ?? '')}`,
        html: `
          <h2>New attorney registration request</h2>
          <h3>Firm</h3>
          <ul>
            <li><strong>Name:</strong> ${escapeHtml(data.entreprise ?? '')}</li>
            <li><strong>Bar Number:</strong> ${escapeHtml(data.siret ?? '')}</li>
            <li><strong>Practice area:</strong> ${escapeHtml(metierFinal ?? '')}</li>
          </ul>
          <h3>Contact</h3>
          <ul>
            <li><strong>Name:</strong> ${escapeHtml(data.prenom ?? '')} ${escapeHtml(data.nom ?? '')}</li>
            <li><strong>Email:</strong> ${escapeHtml(data.email ?? '')}</li>
            <li><strong>Phone:</strong> ${escapeHtml(data.telephone ?? '')}</li>
          </ul>
          <h3>Location</h3>
          <ul>
            <li><strong>Address:</strong> ${escapeHtml(data.adresse ?? '')}</li>
            <li><strong>City:</strong> ${escapeHtml(data.codePostal ?? '')} ${escapeHtml(data.ville ?? '')}</li>
            <li><strong>Coverage radius:</strong> ${escapeHtml(data.rayonIntervention ?? '')} km</li>
          </ul>
          ${data.description ? `<h3>Description</h3><p>${escapeHtml(data.description)}</p>` : ''}
          ${data.experience ? `<p><strong>Experience:</strong> ${escapeHtml(data.experience)}</p>` : ''}
          ${data.certifications ? `<p><strong>Certifications :</strong> ${escapeHtml(data.certifications)}</p>` : ''}
          <hr />
          <p><a href="https://us-attorneys.com/admin">Access admin dashboard</a></p>
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
  } catch (error) {
    logger.error('Attorney registration API error', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
