/**
 * Quote Request API - US Attorneys
 * Handles quote request submissions
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getResendClient } from '@/lib/api/resend-client'
import { z } from 'zod'
import { dispatchLead } from '@/app/actions/dispatch'
import { logLeadEvent } from '@/lib/dashboard/events'

export const dynamic = 'force-dynamic'

/** Escape HTML special chars to prevent XSS in email templates */
function htmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const getResend = () => getResendClient()


const devisSchema = z.object({
  service: z.string().min(1, 'Please select a service'),
  urgency: z.string().min(1, 'Please select the urgency'),
  budget: z.string().optional(),
  description: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  nom: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  telephone: z.string().min(10, 'Invalid phone number'),
})

const specialtyNames: Record<string, string> = {
  plombier: 'Plombier',
  electricien: 'Electrician',
  serrurier: 'Serrurier',
  chauffagiste: 'Chauffagiste',
  'peintre-en-batiment': 'Painter',
  couvreur: 'Couvreur',
  menuisier: 'Menuisier',
  macon: 'Mason',
  carreleur: 'Carreleur',
  jardinier: 'Jardinier-paysagiste',
  vitrier: 'Vitrier',
  climaticien: 'Climaticien',
  cuisiniste: 'Cuisiniste',
  solier: 'Solier-moquettiste',
  nettoyage: 'Nettoyage professionnel',
}

const urgencyLabels: Record<string, string> = {
  urgent: 'Urgent (within 24h)',
  semaine: 'This week',
  mois: 'This month',
  flexible: 'Flexible',
}


export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    // Resolve authenticated user if present (null for anonymous submissions)
    let clientId: string | null = null
    try {
      const serverSupabase = await createServerClient()
      const { data: { user } } = await serverSupabase.auth.getUser()
      clientId = user?.id ?? null
    } catch {
      // Anonymous submission — no session cookie
    }

    // Validate input
    const validation = devisSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    // Map urgency to devis_requests CHECK values
    const urgencyDbMap: Record<string, string> = {
      urgent: 'urgent',
      semaine: 'normal',
      mois: 'normal',
      flexible: 'normal',
    }

    // Store in devis_requests table
    const { data: lead, error: dbError } = await supabase
      .from('devis_requests')
      .insert({
        client_id: clientId,
        client_name: data.nom,
        client_email: data.email,
        client_phone: data.telephone,
        service_name: specialtyNames[data.service] || data.service,
        description: data.description || 'Consultation request',
        budget: data.budget || null,
        urgency: urgencyDbMap[data.urgency] || 'normal',
        city: data.ville || null,
        postal_code: data.codePostal || '',
        status: 'pending',
      })
      .select()
      .single()

    if (dbError) {
      logger.error('Database error', dbError)
      // Continue even if DB fails - we'll still send emails
    }

    // Log 'created' event — triggers "Request received" notification to client
    if (lead) {
      logLeadEvent(lead.id, 'created', { actorId: clientId ?? undefined }).catch((err) => logger.error('Failed to log lead created event', err))
    }

    // Dispatch to eligible attorneys
    let assignedProviders: string[] = []
    if (lead) {
      const urgencyMap: Record<string, string> = {
        urgent: 'urgent',
        semaine: 'normal',
        mois: 'normal',
        flexible: 'flexible',
      }
      assignedProviders = await dispatchLead(lead.id, {
        specialtyName: specialtyNames[data.service] || data.service,
        city: data.ville,
        postalCode: data.codePostal,
        urgency: urgencyMap[data.urgency] || 'normal',
        sourceTable: 'devis_requests',
      }).catch((err) => {
        logger.error('Failed to dispatch lead', err)
        return []
      })
      if (assignedProviders.length > 0) {
        logLeadEvent(lead.id, 'dispatched', { metadata: { count: assignedProviders.length } }).catch((err) => logger.error('Failed to log lead dispatched event', err))
      }
    }

    // Send both confirmation emails in parallel (use allSettled so one failure doesn't block the other)
    const resend = getResend()
    const fromEmail = process.env.FROM_EMAIL || 'noreply@us-attorneys.com'

    const emailResults = await Promise.allSettled([
      // Confirmation to client
      resend.emails.send({
        from: fromEmail,
        to: data.email,
        subject: 'Your consultation request - US Attorneys',
        html: `
          <h2>Hello ${htmlEscape(data.nom)},</h2>
          <p>We have received your consultation request. Here is the summary:</p>
          <ul>
            <li><strong>Service:</strong> ${htmlEscape(specialtyNames[data.service] || data.service)}</li>
            <li><strong>Timeline:</strong> ${htmlEscape(urgencyLabels[data.urgency] || data.urgency)}</li>
            ${data.ville ? `<li><strong>City:</strong> ${htmlEscape(data.ville)}</li>` : ''}
            ${data.description ? `<li><strong>Description:</strong> ${htmlEscape(data.description)}</li>` : ''}
          </ul>
          <p><strong>What happens next?</strong></p>
          <p>We will forward your request to available attorneys in your area. You will receive up to 3 free consultations as soon as possible.</p>
          <p>Best regards,<br />The US Attorneys Team</p>
          <p style="color: #666; font-size: 12px;">
            <a href="https://us-attorneys.com">us-attorneys.com</a>
          </p>
        `,
      }),
      // Notification to admin
      resend.emails.send({
        from: fromEmail,
        to: 'contact@us-attorneys.com',
        subject: `[New Consultation] ${specialtyNames[data.service] || data.service} - ${data.ville || 'USA'}`,
        html: `
          <h2>New consultation request</h2>
          <h3>Client</h3>
          <ul>
            <li><strong>Name:</strong> ${htmlEscape(data.nom)}</li>
            <li><strong>Email:</strong> ${htmlEscape(data.email)}</li>
            <li><strong>Phone:</strong> ${htmlEscape(data.telephone)}</li>
          </ul>
          <h3>Request</h3>
          <ul>
            <li><strong>Service:</strong> ${htmlEscape(specialtyNames[data.service] || data.service)}</li>
            <li><strong>Timeline:</strong> ${htmlEscape(urgencyLabels[data.urgency] || data.urgency)}</li>
            <li><strong>City:</strong> ${htmlEscape(data.ville || 'Not specified')}</li>
            <li><strong>ZIP code:</strong> ${htmlEscape(data.codePostal || 'Not specified')}</li>
            <li><strong>Budget:</strong> ${htmlEscape(data.budget || 'Not specified')}</li>
            <li><strong>Description:</strong> ${htmlEscape(data.description || 'Not specified')}</li>
          </ul>
          ${lead ? `<p>ID: ${lead.id}</p>` : ''}
        `,
      }),
    ])

    // Log any email failures (request is already saved in DB, so we still return success)
    const emailLabels = ['client confirmation', 'admin notification']
    emailResults.forEach((result, i) => {
      if (result.status === 'rejected') {
        logger.error(`Failed to send ${emailLabels[i]} email`, result.reason)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Consultation request sent successfully',
      id: lead?.id,
      artisans_notified: assignedProviders.length,
      ...(assignedProviders.length === 0 && { artisans_found: false }),
    })
  } catch (error) {
    logger.error('Quote request API error', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
