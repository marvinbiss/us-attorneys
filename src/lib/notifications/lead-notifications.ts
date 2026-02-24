/**
 * Lead Event → Notification Processor (server-side only)
 *
 * Maps lead_events to transactional notifications (email + in-app).
 * Idempotent: uses notification_deliveries to prevent duplicates.
 * Based exclusively on lead_events (append-only source of truth).
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/api/resend-client'
import type { LeadEventType } from '@/lib/dashboard/events'
import { logger } from '@/lib/logger'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://servicesartisans.fr'
const SITE_NAME = 'ServicesArtisans'

// ============================================================
// Types
// ============================================================

interface LeadEventPayload {
  id: string            // lead_events.id
  lead_id: string
  event_type: LeadEventType
  provider_id: string | null
  actor_id: string | null
  metadata: Record<string, unknown>
}

interface NotificationTarget {
  userId: string
  email: string | null
  name: string
  role: 'client' | 'artisan'
}

interface NotificationSpec {
  type: string
  title: string
  message: string
  link: string
  emailSubject: string
  emailHtml: string
}

// ============================================================
// Event → Notification mapping
// ============================================================

const EVENT_CONFIG: Record<string, {
  channels: ('email' | 'in_app')[]
  targetRoles: ('client' | 'artisan')[]
}> = {
  created:    { channels: ['email', 'in_app'], targetRoles: ['client'] },
  dispatched: { channels: ['email', 'in_app'], targetRoles: ['artisan'] },
  viewed:     { channels: ['in_app'],          targetRoles: ['client'] },
  quoted:     { channels: ['email', 'in_app'], targetRoles: ['client'] },
  accepted:   { channels: ['email', 'in_app'], targetRoles: ['artisan'] },
  refused:    { channels: ['in_app'],          targetRoles: ['artisan'] },
  completed:  { channels: ['email', 'in_app'], targetRoles: ['client', 'artisan'] },
  expired:    { channels: ['email', 'in_app'], targetRoles: ['client', 'artisan'] },
}

// ============================================================
// Main processor
// ============================================================

export async function processLeadEvent(event: LeadEventPayload): Promise<void> {
  const config = EVENT_CONFIG[event.event_type]
  if (!config) return // Not a notifiable event type

  const supabase = createAdminClient()

  // Resolve lead details (try devis_requests first, then leads table)
  let lead: LeadData & { client_email?: string; client_phone?: string; client_id?: string | null } | null = null

  const { data: devisLead } = await supabase
    .from('devis_requests')
    .select('id, service_name, city, postal_code, client_name, client_email, client_phone, client_id')
    .eq('id', event.lead_id)
    .single()

  if (devisLead) {
    lead = devisLead
  }

  if (!lead) return

  // Build target list
  const targets: NotificationTarget[] = []

  if (config.targetRoles.includes('client') && lead.client_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', lead.client_id)
      .single()

    if (profile) {
      targets.push({
        userId: profile.id,
        email: profile.email || lead.client_email,
        name: profile.full_name || lead.client_name,
        role: 'client',
      })
    }
  }

  if (config.targetRoles.includes('artisan') && event.provider_id) {
    const { data: provider } = await supabase
      .from('providers')
      .select('id, user_id, name, email')
      .eq('id', event.provider_id)
      .single()

    if (provider?.user_id) {
      targets.push({
        userId: provider.user_id,
        email: provider.email,
        name: provider.name,
        role: 'artisan',
      })
    }
  }

  // Process each target
  for (const target of targets) {
    const spec = buildNotificationSpec(event, lead, target)
    if (!spec) continue

    for (const channel of config.channels) {
      await deliverNotification(supabase, event.id, channel, target, spec)
    }
  }
}

// ============================================================
// Idempotent delivery
// ============================================================

async function deliverNotification(
  supabase: SupabaseClient,
  eventId: string,
  channel: 'email' | 'in_app',
  target: NotificationTarget,
  spec: NotificationSpec,
): Promise<void> {
  // Idempotency check: skip if already delivered
  const { data: existing } = await supabase
    .from('notification_deliveries')
    .select('id')
    .eq('event_id', eventId)
    .eq('channel', channel)
    .eq('recipient_id', target.userId)
    .maybeSingle()

  if (existing) return // Already processed

  let status: 'sent' | 'failed' = 'sent'
  let errorMessage: string | null = null

  try {
    if (channel === 'email' && target.email) {
      await sendEmail({
        to: target.email,
        subject: spec.emailSubject,
        html: spec.emailHtml,
        tags: [
          { name: 'type', value: spec.type },
          { name: 'event_id', value: eventId },
        ],
      })
    } else if (channel === 'in_app') {
      await supabase.from('notifications').insert({
        user_id: target.userId,
        type: spec.type,
        title: spec.title,
        message: spec.message,
        link: spec.link,
        metadata: { event_id: eventId },
      })
    }
  } catch (err) {
    status = 'failed'
    errorMessage = err instanceof Error ? err.message : String(err)
    logger.error(`Notification delivery failed [${channel}/${spec.type}]:`, { error: errorMessage })
  }

  // Record delivery (idempotency key)
  try {
    await supabase.from('notification_deliveries').insert({
      event_id: eventId,
      channel,
      recipient_id: target.userId,
      status,
      error_message: errorMessage,
    })
  } catch {
    // Unique constraint violation = already recorded by concurrent request
  }
}

// ============================================================
// Notification spec builders
// ============================================================

interface LeadData {
  id: string
  service_name: string
  city: string | null
  postal_code: string | null
  client_name: string
}

function buildNotificationSpec(
  event: LeadEventPayload,
  lead: LeadData,
  target: NotificationTarget,
): NotificationSpec | null {
  const location = lead.city
    ? `${lead.city}${lead.postal_code ? ` (${lead.postal_code})` : ''}`
    : lead.postal_code || ''

  switch (event.event_type) {
    case 'created':
      return {
        type: 'lead_created',
        title: 'Demande bien reçue',
        message: `Votre demande pour "${lead.service_name}" à ${location} a été enregistrée. Nous recherchons les meilleurs artisans.`,
        link: '/espace-client/mes-demandes',
        emailSubject: `Demande reçue – ${lead.service_name}`,
        emailHtml: emailTemplate({
          heading: 'Demande enregistrée',
          color: '#2563eb',
          greeting: `Bonjour ${target.name}`,
          body: `Votre demande de devis pour <strong>${lead.service_name}</strong> à ${location} a bien été enregistrée. Nous allons contacter les artisans qualifiés de votre zone.`,
          ctaUrl: `${SITE_URL}/espace-client/mes-demandes`,
          ctaLabel: 'Suivre ma demande',
          footer: 'Vous recevrez une notification dès qu\'un artisan vous enverra un devis.',
        }),
      }

    case 'dispatched':
      return {
        type: 'lead_dispatched',
        title: 'Nouveau lead reçu',
        message: `Demande de ${lead.client_name} pour "${lead.service_name}" à ${location}.`,
        link: '/espace-artisan/leads',
        emailSubject: `Nouveau lead – ${lead.service_name} à ${location}`,
        emailHtml: emailTemplate({
          heading: 'Nouveau lead disponible',
          color: '#059669',
          greeting: `Bonjour ${target.name}`,
          body: `Vous avez reçu une nouvelle demande de <strong>${lead.client_name}</strong> pour <strong>${lead.service_name}</strong> à ${location}. Consultez-la et envoyez votre devis.`,
          ctaUrl: `${SITE_URL}/espace-artisan/leads`,
          ctaLabel: 'Voir le lead',
          footer: 'Répondez rapidement pour maximiser vos chances.',
        }),
      }

    case 'viewed':
      return {
        type: 'lead_viewed',
        title: 'Un artisan a consulté votre demande',
        message: `Un artisan a pris connaissance de votre demande pour "${lead.service_name}".`,
        link: `/espace-client/mes-demandes/${lead.id}`,
        emailSubject: '',
        emailHtml: '',
      }

    case 'quoted': {
      const amount = event.metadata.amount ? ` – ${event.metadata.amount} €` : ''
      return {
        type: 'quote_received',
        title: 'Nouveau devis reçu',
        message: `Un artisan vous a envoyé un devis pour "${lead.service_name}"${amount}.`,
        link: `/espace-client/mes-demandes/${lead.id}`,
        emailSubject: `Devis reçu – ${lead.service_name}`,
        emailHtml: emailTemplate({
          heading: 'Vous avez reçu un devis',
          color: '#059669',
          greeting: `Bonjour ${target.name}`,
          body: `Un artisan vous a envoyé un devis pour <strong>${lead.service_name}</strong> à ${location}${amount ? `.<br><br>Montant proposé : <strong>${event.metadata.amount} €</strong>` : ''}.`,
          ctaUrl: `${SITE_URL}/espace-client/mes-demandes/${lead.id}`,
          ctaLabel: 'Voir le devis',
          footer: 'Consultez le détail et comparez les offres reçues.',
        }),
      }
    }

    case 'accepted':
      return {
        type: 'lead_closed',
        title: 'Devis accepté !',
        message: `${lead.client_name} a accepté votre devis pour "${lead.service_name}".`,
        link: '/espace-artisan/leads',
        emailSubject: `Devis accepté – ${lead.service_name}`,
        emailHtml: emailTemplate({
          heading: 'Votre devis a été accepté',
          color: '#059669',
          greeting: `Bonjour ${target.name}`,
          body: `Bonne nouvelle ! <strong>${lead.client_name}</strong> a accepté votre devis pour <strong>${lead.service_name}</strong>. Vous pouvez le contacter pour organiser l'intervention.`,
          ctaUrl: `${SITE_URL}/espace-artisan/leads`,
          ctaLabel: 'Voir le lead',
          footer: '',
        }),
      }

    case 'refused':
      return {
        type: 'lead_closed',
        title: 'Devis refusé',
        message: `Votre devis pour "${lead.service_name}" n'a pas été retenu.`,
        link: '/espace-artisan/leads',
        emailSubject: '',
        emailHtml: '',
      }

    case 'completed':
      if (target.role === 'client') {
        return {
          type: 'lead_closed',
          title: 'Mission terminée',
          message: `La mission pour "${lead.service_name}" est terminée. Merci de votre confiance !`,
          link: `/espace-client/mes-demandes/${lead.id}`,
          emailSubject: `Mission terminée – ${lead.service_name}`,
          emailHtml: emailTemplate({
            heading: 'Mission terminée',
            color: '#059669',
            greeting: `Bonjour ${target.name}`,
            body: `La mission pour <strong>${lead.service_name}</strong> à ${location} est terminée. Merci de votre confiance !`,
            ctaUrl: `${SITE_URL}/espace-client/mes-demandes/${lead.id}`,
            ctaLabel: 'Voir le détail',
            footer: 'N\'hésitez pas à laisser un avis pour aider d\'autres clients.',
          }),
        }
      }
      return {
        type: 'lead_closed',
        title: 'Mission terminée',
        message: `La mission "${lead.service_name}" pour ${lead.client_name} est terminée.`,
        link: '/espace-artisan/leads',
        emailSubject: `Mission terminée – ${lead.service_name}`,
        emailHtml: emailTemplate({
          heading: 'Mission terminée',
          color: '#059669',
          greeting: `Bonjour ${target.name}`,
          body: `La mission <strong>${lead.service_name}</strong> pour ${lead.client_name} est terminée. Bravo !`,
          ctaUrl: `${SITE_URL}/espace-artisan/leads`,
          ctaLabel: 'Voir mes leads',
          footer: '',
        }),
      }

    case 'expired':
      if (target.role === 'client') {
        return {
          type: 'lead_closed',
          title: 'Demande expirée',
          message: `Votre demande pour "${lead.service_name}" a expiré sans réponse.`,
          link: `/espace-client/mes-demandes/${lead.id}`,
          emailSubject: `Demande expirée – ${lead.service_name}`,
          emailHtml: emailTemplate({
            heading: 'Demande expirée',
            color: '#d97706',
            greeting: `Bonjour ${target.name}`,
            body: `Votre demande pour <strong>${lead.service_name}</strong> à ${location} a expiré. Vous pouvez en créer une nouvelle à tout moment.`,
            ctaUrl: `${SITE_URL}/espace-client/mes-demandes`,
            ctaLabel: 'Mes demandes',
            footer: '',
          }),
        }
      }
      return {
        type: 'lead_closed',
        title: 'Lead expiré',
        message: `Le lead "${lead.service_name}" de ${lead.client_name} a expiré.`,
        link: '/espace-artisan/leads',
        emailSubject: `Lead expiré – ${lead.service_name}`,
        emailHtml: emailTemplate({
          heading: 'Lead expiré',
          color: '#d97706',
          greeting: `Bonjour ${target.name}`,
          body: `Le lead <strong>${lead.service_name}</strong> de ${lead.client_name} a expiré.`,
          ctaUrl: `${SITE_URL}/espace-artisan/leads`,
          ctaLabel: 'Voir mes leads',
          footer: '',
        }),
      }

    default:
      return null
  }
}

// ============================================================
// Email template
// ============================================================

function emailTemplate(opts: {
  heading: string
  color: string
  greeting: string
  body: string
  ctaUrl: string
  ctaLabel: string
  footer: string
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: ${opts.color}; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 22px;">${opts.heading}</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <p style="color: #333; font-size: 16px; margin-bottom: 16px;">${opts.greeting},</p>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">${opts.body}</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${opts.ctaUrl}" style="display: inline-block; background: ${opts.color}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">${opts.ctaLabel}</a>
      </div>
      ${opts.footer ? `<p style="color: #888; font-size: 13px; line-height: 1.5;">${opts.footer}</p>` : ''}
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #aaa; font-size: 12px; text-align: center;">${SITE_NAME} – La plateforme des artisans qualifiés</p>
    </div>
  </div>
</body>
</html>`
}
