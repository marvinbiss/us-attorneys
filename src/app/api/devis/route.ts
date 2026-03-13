/**
 * Devis API - ServicesArtisans
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
  service: z.string().min(1, 'Veuillez sélectionner un service'),
  urgency: z.string().min(1, 'Veuillez sélectionner l\'urgence'),
  budget: z.string().optional(),
  description: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  nom: z.string().min(2, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  telephone: z.string().min(10, 'Numéro de téléphone invalide'),
})

const serviceNames: Record<string, string> = {
  plombier: 'Plombier',
  electricien: 'Électricien',
  serrurier: 'Serrurier',
  chauffagiste: 'Chauffagiste',
  'peintre-en-batiment': 'Peintre en bâtiment',
  couvreur: 'Couvreur',
  menuisier: 'Menuisier',
  macon: 'Maçon',
  carreleur: 'Carreleur',
  jardinier: 'Jardinier-paysagiste',
  vitrier: 'Vitrier',
  climaticien: 'Climaticien',
  cuisiniste: 'Cuisiniste',
  solier: 'Solier-moquettiste',
  nettoyage: 'Nettoyage professionnel',
}

const urgencyLabels: Record<string, string> = {
  urgent: 'Urgent (sous 24h)',
  semaine: 'Cette semaine',
  mois: 'Ce mois-ci',
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
        { error: 'Données invalides', details: validation.error.flatten() },
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
        service_name: serviceNames[data.service] || data.service,
        description: data.description || 'Demande de devis',
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

    // Log 'created' event — triggers "Demande bien reçue" notification to client
    if (lead) {
      logLeadEvent(lead.id, 'created', { actorId: clientId ?? undefined }).catch((err) => logger.error('Failed to log lead created event', err))
    }

    // Dispatch to eligible artisans
    let assignedProviders: string[] = []
    if (lead) {
      const urgencyMap: Record<string, string> = {
        urgent: 'urgent',
        semaine: 'normal',
        mois: 'normal',
        flexible: 'flexible',
      }
      assignedProviders = await dispatchLead(lead.id, {
        serviceName: serviceNames[data.service] || data.service,
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
    const fromEmail = process.env.FROM_EMAIL || 'noreply@servicesartisans.fr'

    const emailResults = await Promise.allSettled([
      // Confirmation to client
      resend.emails.send({
        from: fromEmail,
        to: data.email,
        subject: 'Votre demande de devis - ServicesArtisans',
        html: `
          <h2>Bonjour ${htmlEscape(data.nom)},</h2>
          <p>Nous avons bien reçu votre demande de devis. Voici le récapitulatif :</p>
          <ul>
            <li><strong>Service :</strong> ${htmlEscape(serviceNames[data.service] || data.service)}</li>
            <li><strong>Délai :</strong> ${htmlEscape(urgencyLabels[data.urgency] || data.urgency)}</li>
            ${data.ville ? `<li><strong>Ville :</strong> ${htmlEscape(data.ville)}</li>` : ''}
            ${data.description ? `<li><strong>Description :</strong> ${htmlEscape(data.description)}</li>` : ''}
          </ul>
          <p><strong>Que se passe-t-il maintenant ?</strong></p>
          <p>Nous allons transmettre votre demande aux artisans disponibles dans votre région. Vous recevrez jusqu’à 3 devis gratuits dans les meilleurs délais.</p>
          <p>Cordialement,<br />L’équipe ServicesArtisans</p>
          <p style="color: #666; font-size: 12px;">
            <a href="https://servicesartisans.fr">servicesartisans.fr</a>
          </p>
        `,
      }),
      // Notification to admin
      resend.emails.send({
        from: fromEmail,
        to: 'contact@servicesartisans.fr',
        subject: `[Nouveau Devis] ${serviceNames[data.service] || data.service} - ${data.ville || 'France'}`,
        html: `
          <h2>Nouvelle demande de devis</h2>
          <h3>Client</h3>
          <ul>
            <li><strong>Nom :</strong> ${htmlEscape(data.nom)}</li>
            <li><strong>Email :</strong> ${htmlEscape(data.email)}</li>
            <li><strong>Téléphone :</strong> ${htmlEscape(data.telephone)}</li>
          </ul>
          <h3>Demande</h3>
          <ul>
            <li><strong>Service :</strong> ${htmlEscape(serviceNames[data.service] || data.service)}</li>
            <li><strong>Délai :</strong> ${htmlEscape(urgencyLabels[data.urgency] || data.urgency)}</li>
            <li><strong>Ville :</strong> ${htmlEscape(data.ville || 'Non précisé')}</li>
            <li><strong>Code postal :</strong> ${htmlEscape(data.codePostal || 'Non précisé')}</li>
            <li><strong>Budget :</strong> ${htmlEscape(data.budget || 'Non précisé')}</li>
            <li><strong>Description :</strong> ${htmlEscape(data.description || 'Non précisé')}</li>
          </ul>
          ${lead ? `<p>ID: ${lead.id}</p>` : ''}
        `,
      }),
    ])

    // Log any email failures (devis is already saved in DB, so we still return success)
    const emailLabels = ['client confirmation', 'admin notification']
    emailResults.forEach((result, i) => {
      if (result.status === 'rejected') {
        logger.error(`Failed to send ${emailLabels[i]} email`, result.reason)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Demande de devis envoyée avec succès',
      id: lead?.id,
      artisans_notified: assignedProviders.length,
      ...(assignedProviders.length === 0 && { artisans_found: false }),
    })
  } catch (error) {
    logger.error('Devis API error', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
