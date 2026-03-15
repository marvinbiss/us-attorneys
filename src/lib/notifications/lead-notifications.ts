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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://us-attorneys.com'
const SITE_NAME = 'US Attorneys'

// ============================================================
// Types
// ============================================================

interface LeadEventPayload {
  id: string            // lead_events.id
  lead_id: string
  event_type: LeadEventType
  attorney_id: string | null
  actor_id: string | null
  metadata: Record<string, unknown>
}

interface NotificationTarget {
  userId: string
  email: string | null
  name: string
  role: 'client' | 'attorney'
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
  targetRoles: ('client' | 'attorney')[]
}> = {
  created:    { channels: ['email', 'in_app'], targetRoles: ['client'] },
  dispatched: { channels: ['email', 'in_app'], targetRoles: ['attorney'] },
  viewed:     { channels: ['in_app'],          targetRoles: ['client'] },
  quoted:     { channels: ['email', 'in_app'], targetRoles: ['client'] },
  accepted:   { channels: ['email', 'in_app'], targetRoles: ['attorney'] },
  refused:    { channels: ['in_app'],          targetRoles: ['attorney'] },
  completed:  { channels: ['email', 'in_app'], targetRoles: ['client', 'attorney'] },
  expired:    { channels: ['email', 'in_app'], targetRoles: ['client', 'attorney'] },
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

  if (config.targetRoles.includes('attorney') && event.attorney_id) {
    const { data: provider } = await supabase
      .from('attorneys')
      .select('id, user_id, name, email')
      .eq('id', event.attorney_id)
      .single()

    if (provider?.user_id) {
      targets.push({
        userId: provider.user_id,
        email: provider.email,
        name: provider.name,
        role: 'attorney',
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
        title: 'Request received',
        message: `Your request for "${lead.service_name}" in ${location} has been registered. We are searching for the best attorneys.`,
        link: '/client-dashboard/mes-demandes',
        emailSubject: `Request received – ${lead.service_name}`,
        emailHtml: emailTemplate({
          heading: 'Request registered',
          color: '#2563eb',
          greeting: `Bonjour ${target.name}`,
          body: `Your consultation request for <strong>${lead.service_name}</strong> in ${location} has been registered. We will contact qualified attorneys in your area.`,
          ctaUrl: `${SITE_URL}/client-dashboard/mes-demandes`,
          ctaLabel: 'Suivre ma demande',
          footer: 'You will receive a notification as soon as an attorney sends you a consultation.',
        }),
      }

    case 'dispatched':
      return {
        type: 'lead_dispatched',
        title: 'New lead received',
        message: `Request from ${lead.client_name} for "${lead.service_name}" in ${location}.`,
        link: '/attorney-dashboard/leads',
        emailSubject: `New lead – ${lead.service_name} in ${location}`,
        emailHtml: emailTemplate({
          heading: 'Nouveau lead disponible',
          color: '#059669',
          greeting: `Bonjour ${target.name}`,
          body: `You have received a new request from <strong>${lead.client_name}</strong> for <strong>${lead.service_name}</strong> in ${location}. Review it and send your consultation.`,
          ctaUrl: `${SITE_URL}/attorney-dashboard/leads`,
          ctaLabel: 'Voir le lead',
          footer: 'Respond quickly to maximize your chances.',
        }),
      }

    case 'viewed':
      return {
        type: 'lead_viewed',
        title: 'An attorney has viewed your request',
        message: `An attorney a pris connaissance de votre demande pour "${lead.service_name}".`,
        link: `/client-dashboard/mes-demandes/${lead.id}`,
        emailSubject: '',
        emailHtml: '',
      }

    case 'quoted': {
      const amount = event.metadata.amount ? ` – ${event.metadata.amount} $` : ''
      return {
        type: 'quote_received',
        title: 'New consultation received',
        message: `An attorney has sent you a consultation for "${lead.service_name}"${amount}.`,
        link: `/client-dashboard/mes-demandes/${lead.id}`,
        emailSubject: `Consultation received – ${lead.service_name}`,
        emailHtml: emailTemplate({
          heading: 'You have received a consultation',
          color: '#059669',
          greeting: `Bonjour ${target.name}`,
          body: `An attorney has sent you a consultation for <strong>${lead.service_name}</strong> in ${location}${amount ? `.<br><br>Proposed amount: <strong>$${event.metadata.amount}</strong>` : ''}.`,
          ctaUrl: `${SITE_URL}/client-dashboard/mes-demandes/${lead.id}`,
          ctaLabel: 'Voir the consultation',
          footer: 'View the details and compare received offers.',
        }),
      }
    }

    case 'accepted':
      return {
        type: 'lead_closed',
        title: 'Consultation accepted!',
        message: `${lead.client_name} accepted your consultation for "${lead.service_name}".`,
        link: '/attorney-dashboard/leads',
        emailSubject: `Consultation accepted – ${lead.service_name}`,
        emailHtml: emailTemplate({
          heading: 'Your consultation has been accepted',
          color: '#059669',
          greeting: `Bonjour ${target.name}`,
          body: `Great news! <strong>${lead.client_name}</strong> accepted your consultation for <strong>${lead.service_name}</strong>. You can contact them to arrange the engagement.`,
          ctaUrl: `${SITE_URL}/attorney-dashboard/leads`,
          ctaLabel: 'Voir le lead',
          footer: '',
        }),
      }

    case 'refused':
      return {
        type: 'lead_closed',
        title: 'Consultation declined',
        message: `Your consultation for "${lead.service_name}" was not selected.`,
        link: '/attorney-dashboard/leads',
        emailSubject: '',
        emailHtml: '',
      }

    case 'completed':
      if (target.role === 'client') {
        return {
          type: 'lead_closed',
          title: 'Case completed',
          message: `The case for "${lead.service_name}" is complete. Thank you for your trust!`,
          link: `/client-dashboard/mes-demandes/${lead.id}`,
          emailSubject: `Case completed – ${lead.service_name}`,
          emailHtml: emailTemplate({
            heading: 'Case completed',
            color: '#059669',
            greeting: `Bonjour ${target.name}`,
            body: `The case for <strong>${lead.service_name}</strong> in ${location} is complete. Thank you for your trust!`,
            ctaUrl: `${SITE_URL}/client-dashboard/mes-demandes/${lead.id}`,
            ctaLabel: 'View details',
            footer: 'Feel free to leave a review to help other clients.',
          }),
        }
      }
      return {
        type: 'lead_closed',
        title: 'Case completed',
        message: `The case "${lead.service_name}" for ${lead.client_name} is complete.`,
        link: '/attorney-dashboard/leads',
        emailSubject: `Case completed – ${lead.service_name}`,
        emailHtml: emailTemplate({
          heading: 'Case completed',
          color: '#059669',
          greeting: `Bonjour ${target.name}`,
          body: `The case <strong>${lead.service_name}</strong> for ${lead.client_name} is complete. Well done!`,
          ctaUrl: `${SITE_URL}/attorney-dashboard/leads`,
          ctaLabel: 'Voir mes leads',
          footer: '',
        }),
      }

    case 'expired':
      if (target.role === 'client') {
        return {
          type: 'lead_closed',
          title: 'Request expired',
          message: `Your request for "${lead.service_name}" has expired without a response.`,
          link: `/client-dashboard/mes-demandes/${lead.id}`,
          emailSubject: `Request expired – ${lead.service_name}`,
          emailHtml: emailTemplate({
            heading: 'Request expired',
            color: '#d97706',
            greeting: `Bonjour ${target.name}`,
            body: `Your request for <strong>${lead.service_name}</strong> in ${location} has expired. You can create a new one at any time.`,
            ctaUrl: `${SITE_URL}/client-dashboard/mes-demandes`,
            ctaLabel: 'Mes demandes',
            footer: '',
          }),
        }
      }
      return {
        type: 'lead_closed',
        title: 'Lead expired',
        message: `The lead "${lead.service_name}" from ${lead.client_name} has expired.`,
        link: '/attorney-dashboard/leads',
        emailSubject: `Lead expiré – ${lead.service_name}`,
        emailHtml: emailTemplate({
          heading: 'Lead expired',
          color: '#d97706',
          greeting: `Bonjour ${target.name}`,
          body: `The lead <strong>${lead.service_name}</strong> from ${lead.client_name} has expired.`,
          ctaUrl: `${SITE_URL}/attorney-dashboard/leads`,
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
      <p style="color: #aaa; font-size: 12px; text-align: center;">${SITE_NAME} – The qualified attorneys platform</p>
    </div>
  </div>
</body>
</html>`
}
