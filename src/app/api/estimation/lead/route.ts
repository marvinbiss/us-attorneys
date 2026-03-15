/**
 * Estimation Lead API - US Attorneys
 * Handles lead submissions from chat and callback estimation flows
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { headers } from 'next/headers'
import { sendEmail } from '@/lib/api/resend-client'
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const estimationLeadSchema = z.object({
  nom: z.string().optional(),
  telephone: z.string().min(10, 'Invalid phone number (min 10 characters)'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  metier: z.string().min(1, 'Practice area is required'),
  ville: z.string().min(1, 'City is required'),
  departement: z.string().default(''),
  description_projet: z.string().optional(),
  estimation_min: z.number().optional(),
  estimation_max: z.number().optional(),
  source: z.enum(['chat', 'callback'], { message: 'Source is required' }),
  conversation_history: z.array(z.unknown()).optional(),
  page_url: z.string().optional(),
  artisan_public_id: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    // 0. Rate limiting (5 submissions per hour per IP)
    const headersList = await headers()
    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      'unknown'
    const rateLimitResult = rateLimit(ip, 5, 3_600_000)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) },
      )
    }

    const body = await request.json()

    // Validate input
    const validation = estimationLeadSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    // Sanitize page_url: must start with "/" or "https://us-attorneys.com"
    if (data.page_url && !data.page_url.startsWith('/') && !data.page_url.startsWith('https://us-attorneys.com')) {
      data.page_url = undefined
    }
    const supabase = createAdminClient()

    // Normalize empty email to null
    const email = data.email && data.email.length > 0 ? data.email : null

    // Insert into estimation_leads
    const { data: lead, error: dbError } = await supabase
      .from('estimation_leads')
      .insert({
        nom: data.nom || null,
        telephone: data.telephone,
        email,
        metier: data.metier,
        ville: data.ville,
        departement: data.departement,
        description_projet: data.description_projet || null,
        estimation_min: data.estimation_min ?? null,
        estimation_max: data.estimation_max ?? null,
        source: data.source,
        conversation_history: data.conversation_history ?? null,
        page_url: data.page_url || null,
        artisan_public_id: data.artisan_public_id || null,
      })
      .select('id')
      .single()

    if (dbError) {
      logger.error('Estimation lead DB error', dbError)
      return NextResponse.json(
        { error: 'Error saving record' },
        { status: 500 }
      )
    }

    // Log in audit_logs via admin client (no user session required)
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      null
    const userAgent = headersList.get('user-agent') || null

    supabase
      .from('audit_logs')
      .insert({
        action: 'estimation_lead.create',
        resource_type: 'estimation_lead',
        resource_id: lead.id,
        new_value: {
          metier: data.metier,
          ville: data.ville,
          departement: data.departement,
          source: data.source,
          artisan_public_id: data.artisan_public_id || null,
        },
        metadata: {
          ip_address: ipAddress,
          user_agent: userAgent,
          page_url: data.page_url || null,
        },
        created_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) {
          logger.error('Failed to log estimation lead audit event', error)
        }
      })

    // Fire-and-forget: notify admin + confirm client
    notifyAdminNewEstimationLead(data, lead.id).catch((err) => {
      logger.error('Failed to send estimation lead notification email', err)
    })

    if (email) {
      sendClientConfirmationEmail(data, lead.id).catch((err) => {
        logger.error('Failed to send estimation lead client confirmation email', err)
      })
    }

    return NextResponse.json({ success: true, id: lead.id })
  } catch (error) {
    logger.error('Estimation lead API error', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// ============================================================
// Admin notification
// ============================================================

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://us-attorneys.com'

async function notifyAdminNewEstimationLead(
  data: z.infer<typeof estimationLeadSchema>,
  leadId: string,
): Promise<void> {
  const adminEmails = process.env.ADMIN_EMAILS
  if (!adminEmails) return

  const recipients = adminEmails.split(',').map((e) => e.trim()).filter(Boolean)
  if (recipients.length === 0) return

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const estimation =
    data.estimation_min && data.estimation_max
      ? `$${data.estimation_min} – $${data.estimation_max}`
      : 'Not calculated'

  const sourceLabel = data.source === 'chat' ? 'AI Chat' : 'Phone callback'

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #059669; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 22px;">New estimation lead IA</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <p style="color: #333; font-size: 16px; margin-bottom: 16px;">A visitor just submitted their contact information via the estimation widget.</p>
      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Date :</strong> ${dateStr}</p>
        <p style="margin: 0 0 10px 0;"><strong>Source :</strong> ${sourceLabel}</p>
        <p style="margin: 0 0 10px 0;"><strong>Nom :</strong> ${data.nom || '—'}</p>
        <p style="margin: 0 0 10px 0;"><strong>Phone:</strong> ${data.telephone}</p>
        <p style="margin: 0 0 10px 0;"><strong>Email :</strong> ${data.email || '—'}</p>
        <p style="margin: 0 0 10px 0;"><strong>Practice area:</strong> ${data.metier}</p>
        <p style="margin: 0 0 10px 0;"><strong>City:</strong> ${data.ville} (${data.departement})</p>
        <p style="margin: 0 0 10px 0;"><strong>Estimation :</strong> ${estimation}</p>
        ${data.artisan_public_id ? `<p style="margin: 0 0 10px 0;"><strong>Attorney :</strong> ${htmlEscape(data.artisan_public_id)}</p>` : ''}
        ${data.page_url ? `<p style="margin: 0;"><strong>Page :</strong> <a href="${htmlEscape(data.page_url)}" style="color: #059669;">${htmlEscape(data.page_url)}</a></p>` : ''}
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${SITE_URL}/admin/estimation-leads" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Voir dans l'admin</a>
      </div>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #aaa; font-size: 12px; text-align: center;">US Attorneys – Notification automatique (lead #${leadId})</p>
    </div>
  </div>
</body>
</html>`

  await sendEmail({
    to: recipients,
    subject: `🔔 New estimation lead – ${data.metier} in ${data.ville}`,
    html,
    tags: [
      { name: 'type', value: 'estimation_lead_admin' },
      { name: 'lead_id', value: leadId },
    ],
  })
}

// ============================================================
// Client confirmation
// ============================================================

/** Escape HTML special chars to prevent XSS in email templates */
function htmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function sendClientConfirmationEmail(
  data: z.infer<typeof estimationLeadSchema>,
  leadId: string,
): Promise<void> {
  const clientEmail = data.email
  if (!clientEmail || clientEmail.length === 0) return

  const prenom = data.nom ? htmlEscape(data.nom.split(' ')[0]) : ''
  const salutation = prenom ? `Bonjour ${prenom}` : 'Bonjour'
  const metier = htmlEscape(data.metier.toLowerCase())
  const ville = htmlEscape(data.ville)
  const isAttorneyPage = !!data.artisan_public_id

  const nextSteps = isAttorneyPage
    ? `<p style="color: #333; font-size: 15px; line-height: 1.6;">
        The attorney you contacted will receive your request and will contact you
        as soon as possible by phone or email.
      </p>`
    : `<p style="color: #333; font-size: 15px; line-height: 1.6;">
        We will forward your request to qualified and verified ${metier} professionals
        in <strong>${ville}</strong>. You will be contacted as soon as possible
        by phone or email.
      </p>`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #E07040; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 22px;">Your request has been received</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <p style="color: #333; font-size: 16px; margin-bottom: 4px;">${salutation},</p>
      <p style="color: #333; font-size: 15px; line-height: 1.6;">
        Merci pour votre demande d'estimation pour un <strong>${metier}</strong>
        in <strong>${ville}</strong>. We have recorded your contact information.
      </p>

      <div style="background: #fef7f4; border-left: 4px solid #E07040; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0;">
        <p style="margin: 0 0 6px 0; font-size: 14px; color: #555;"><strong>Summary:</strong></p>
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #333;">Service : <strong>${htmlEscape(data.metier)}</strong></p>
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #333;">City : <strong>${ville}${data.departement ? ` (${htmlEscape(data.departement)})` : ''}</strong></p>
        <p style="margin: 0; font-size: 14px; color: #333;">Phone: <strong>${htmlEscape(data.telephone)}</strong></p>
      </div>

      <h3 style="color: #333; font-size: 16px; margin: 24px 0 8px 0;">Que se passe-t-il maintenant ?</h3>
      ${nextSteps}

      <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #166534; line-height: 1.5;">
          <strong>Our commitments:</strong> 100% free service, verified attorneys, no obligation on your part.
        </p>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${SITE_URL}/services" style="display: inline-block; background: #E07040; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Browse our attorneys</a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #aaa; font-size: 12px; text-align: center;">
        US Attorneys.fr – The qualified attorneys platform<br>
        <a href="${SITE_URL}" style="color: #aaa;">us-attorneys.com</a>
      </p>
    </div>
  </div>
</body>
</html>`

  await sendEmail({
    to: clientEmail,
    subject: `Your ${metier} request in ${ville} – US Attorneys`,
    html,
    tags: [
      { name: 'type', value: 'estimation_lead_client' },
      { name: 'lead_id', value: leadId },
    ],
  })
}
