/**
 * Estimation Lead API - ServicesArtisans
 * Handles lead submissions from chat and callback estimation flows
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { headers } from 'next/headers'
import { sendEmail } from '@/lib/api/resend-client'

export const dynamic = 'force-dynamic'

const estimationLeadSchema = z.object({
  nom: z.string().optional(),
  telephone: z.string().min(10, 'Numéro de téléphone invalide (min 10 caractères)'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  metier: z.string().min(1, 'Le métier est requis'),
  ville: z.string().min(1, 'La ville est requise'),
  departement: z.string().min(1, 'Le département est requis'),
  description_projet: z.string().optional(),
  estimation_min: z.number().optional(),
  estimation_max: z.number().optional(),
  source: z.enum(['chat', 'callback'], { message: 'La source est requise' }),
  conversation_history: z.array(z.unknown()).optional(),
  page_url: z.string().optional(),
  artisan_public_id: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const validation = estimationLeadSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data
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
        { error: 'Erreur lors de l\'enregistrement' },
        { status: 500 }
      )
    }

    // Log in audit_logs via admin client (no user session required)
    const headersList = await headers()
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

    // Fire-and-forget: notify admin by email
    notifyAdminNewEstimationLead(data, lead.id).catch((err) => {
      logger.error('Failed to send estimation lead notification email', err)
    })

    return NextResponse.json({ success: true, id: lead.id })
  } catch (error) {
    logger.error('Estimation lead API error', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// ============================================================
// Admin notification
// ============================================================

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://servicesartisans.fr'

async function notifyAdminNewEstimationLead(
  data: z.infer<typeof estimationLeadSchema>,
  leadId: string,
): Promise<void> {
  const adminEmails = process.env.ADMIN_EMAILS
  if (!adminEmails) return

  const recipients = adminEmails.split(',').map((e) => e.trim()).filter(Boolean)
  if (recipients.length === 0) return

  const now = new Date()
  const dateStr = now.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const estimation =
    data.estimation_min && data.estimation_max
      ? `${data.estimation_min}€ – ${data.estimation_max}€`
      : 'Non calculée'

  const sourceLabel = data.source === 'chat' ? 'Chat IA' : 'Rappel téléphonique'

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #059669; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 22px;">Nouveau lead estimation IA</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <p style="color: #333; font-size: 16px; margin-bottom: 16px;">Un visiteur vient de soumettre ses coordonnées via le widget estimation.</p>
      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Date :</strong> ${dateStr}</p>
        <p style="margin: 0 0 10px 0;"><strong>Source :</strong> ${sourceLabel}</p>
        <p style="margin: 0 0 10px 0;"><strong>Nom :</strong> ${data.nom || '—'}</p>
        <p style="margin: 0 0 10px 0;"><strong>Téléphone :</strong> ${data.telephone}</p>
        <p style="margin: 0 0 10px 0;"><strong>Email :</strong> ${data.email || '—'}</p>
        <p style="margin: 0 0 10px 0;"><strong>Métier :</strong> ${data.metier}</p>
        <p style="margin: 0 0 10px 0;"><strong>Ville :</strong> ${data.ville} (${data.departement})</p>
        <p style="margin: 0 0 10px 0;"><strong>Estimation :</strong> ${estimation}</p>
        ${data.artisan_public_id ? `<p style="margin: 0 0 10px 0;"><strong>Artisan :</strong> ${data.artisan_public_id}</p>` : ''}
        ${data.page_url ? `<p style="margin: 0;"><strong>Page :</strong> <a href="${data.page_url}" style="color: #059669;">${data.page_url}</a></p>` : ''}
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${SITE_URL}/admin/estimation-leads" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Voir dans l'admin</a>
      </div>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #aaa; font-size: 12px; text-align: center;">ServicesArtisans – Notification automatique (lead #${leadId})</p>
    </div>
  </div>
</body>
</html>`

  await sendEmail({
    to: recipients,
    subject: `🔔 Nouveau lead estimation – ${data.metier} à ${data.ville}`,
    html,
    tags: [
      { name: 'type', value: 'estimation_lead_admin' },
      { name: 'lead_id', value: leadId },
    ],
  })
}
