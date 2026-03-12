/**
 * Voice Lead Routing — ServicesArtisans
 *
 * Creates a lead (devis_request) from a qualified voice call,
 * dispatches it to a matching artisan, and notifies via SMS.
 *
 * Server-side only — uses createAdminClient() (service_role, bypasses RLS).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSMS } from '@/lib/notifications/sms'
import { logLeadEvent } from '@/lib/dashboard/events'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VoiceCallWithQualification {
  id: string
  contact_id: string | null
  conversation_id: string | null
  qualification_score: string | null
  qualification_data: Record<string, unknown> | null
  caller_phone: string
}

// ---------------------------------------------------------------------------
// Vertical → French service name mapping
// ---------------------------------------------------------------------------

const VERTICAL_SERVICE_MAP: Record<string, string> = {
  pac: 'Installation Pompe à Chaleur',
  toiture: 'Travaux de Toiture',
  isolation: 'Isolation Thermique',
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Create a devis_request from a qualified voice call, find a matching artisan,
 * assign the lead, and notify the artisan via SMS.
 */
export async function createVoiceLead(
  _supabase: SupabaseClient,
  voiceCall: VoiceCallWithQualification
): Promise<void> {
  const log = logger.child({ action: 'voice_lead_routing', voiceCallId: voiceCall.id })
  const admin = createAdminClient()

  const qualData = voiceCall.qualification_data ?? {}
  const projectType = (qualData.project_type as string) ?? null
  const postalCode = (qualData.postal_code as string) ?? null
  const callerName = (qualData.caller_name as string) ?? 'Prospect vocal'
  const budgetRange = (qualData.budget_range as string) ?? null
  const urgency = (qualData.urgency as string) ?? 'normal'

  // Map vertical to French service name
  const serviceName = projectType ? VERTICAL_SERVICE_MAP[projectType] ?? projectType : 'Rénovation énergétique'

  // ------------------------------------------------------------------
  // 1. Create the devis_request (lead)
  // ------------------------------------------------------------------
  log.info('Creating devis_request from voice call', { projectType, postalCode })

  const validUrgency = ['normal', 'urgent', 'tres_urgent'].includes(urgency) ? urgency : 'normal'

  const { data: lead, error: leadError } = await admin
    .from('devis_requests')
    .insert({
      service_name: serviceName,
      postal_code: postalCode || '00000',
      city: (qualData.city as string) ?? null,
      description: `Demande générée par qualification vocale (score ${voiceCall.qualification_score ?? 'N/A'}). Projet : ${serviceName}.`,
      budget: budgetRange,
      urgency: validUrgency,
      status: 'pending',
      client_name: callerName,
      client_email: (qualData.email as string) ?? `voice+${voiceCall.id.slice(0, 8)}@servicesartisans.fr`,
      client_phone: voiceCall.caller_phone,
    })
    .select('id')
    .single()

  if (leadError || !lead) {
    log.error('Failed to create devis_request', leadError)
    return
  }

  log.info('Devis request created', { leadId: lead.id })

  // ------------------------------------------------------------------
  // 2. Link voice_call → lead
  // ------------------------------------------------------------------
  const { error: linkError } = await admin
    .from('voice_calls')
    .update({ lead_id: lead.id })
    .eq('id', voiceCall.id)

  if (linkError) {
    log.warn('Failed to link voice_call to lead', { error: linkError.message })
  }

  // ------------------------------------------------------------------
  // 3. Log the lead creation event
  // ------------------------------------------------------------------
  await logLeadEvent(lead.id, 'created', {
    metadata: {
      source: 'voice',
      voice_call_id: voiceCall.id,
      qualification_score: voiceCall.qualification_score,
      project_type: projectType,
    },
  })

  // ------------------------------------------------------------------
  // 4. Find matching artisan (specialty + department from postal code)
  // ------------------------------------------------------------------
  const department = postalCode ? postalCode.slice(0, 2) : null

  let matchQuery = admin
    .from('providers')
    .select('id, name, phone, email, user_id')
    .eq('is_active', true)

  if (serviceName) {
    matchQuery = matchQuery.ilike('specialty', `%${serviceName}%`)
  }

  if (department) {
    // Match providers whose address_postal_code starts with the same department
    matchQuery = matchQuery.ilike('address_postal_code', `${department}%`)
  }

  // Round-robin: prefer providers who haven't received a lead recently
  matchQuery = matchQuery
    .order('last_lead_assigned_at', { ascending: true, nullsFirst: true })
    .limit(1)

  const { data: providers, error: providerError } = await matchQuery

  if (providerError) {
    log.error('Failed to query matching providers', providerError)
    return
  }

  if (!providers || providers.length === 0) {
    log.warn('No matching artisan found', { serviceName, department })
    return
  }

  const artisan = providers[0]
  log.info('Matched artisan', { artisanId: artisan.id, artisanName: artisan.name })

  // ------------------------------------------------------------------
  // 5. Create lead_assignment
  // ------------------------------------------------------------------
  const { error: assignError } = await admin
    .from('lead_assignments')
    .insert({
      lead_id: lead.id,
      provider_id: artisan.id,
      status: 'pending',
      source_table: 'devis_requests',
    })

  if (assignError) {
    log.error('Failed to create lead_assignment', assignError)
    return
  }

  // Update round-robin counter
  await admin
    .from('providers')
    .update({ last_lead_assigned_at: new Date().toISOString() })
    .eq('id', artisan.id)

  // Log the dispatch event
  await logLeadEvent(lead.id, 'dispatched', {
    providerId: artisan.id,
    metadata: {
      source: 'voice',
      voice_call_id: voiceCall.id,
    },
  })

  log.info('Lead assigned to artisan', { leadId: lead.id, artisanId: artisan.id })

  // ------------------------------------------------------------------
  // 6. Notify artisan via SMS
  // ------------------------------------------------------------------
  if (artisan.phone) {
    const location = postalCode ? ` (${postalCode})` : ''
    const smsMessage =
      `Nouveau lead ServicesArtisans !\n` +
      `${serviceName}${location}\n` +
      `Client : ${callerName}\n` +
      `Connectez-vous pour répondre : servicesartisans.fr/espace-artisan/leads`

    const smsResult = await sendSMS(artisan.phone, smsMessage)

    if (smsResult.success) {
      log.info('Artisan notified via SMS', { artisanId: artisan.id, messageId: smsResult.messageId })
    } else {
      log.warn('SMS notification failed', { artisanId: artisan.id, error: smsResult.error })
    }
  } else {
    log.warn('Artisan has no phone number, SMS skipped', { artisanId: artisan.id })
  }
}
