'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { dispatchLead } from './dispatch'
import { logLeadEvent } from '@/lib/dashboard/events'
import { logger } from '@/lib/logger'

const leadSchema = z.object({
  providerId: z.string().min(1).optional(),
  serviceName: z.string().min(1),
  name: z.string().min(1, 'Votre nom est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().regex(
    /^(?:\+33|0)[1-9](?:[0-9]{8})$/,
    'Numero de telephone invalide'
  ),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  description: z.string().min(20, 'Description trop courte (min 20 caracteres)'),
  urgency: z.enum(['normal', 'urgent', 'flexible']).default('normal'),
})

export type LeadFormState = {
  success: boolean
  error?: string
}

export async function submitLead(
  _prevState: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const raw = {
    providerId: formData.get('providerId'),
    serviceName: formData.get('serviceName'),
    name: formData.get('name'),
    email: formData.get('email'),
    phone: String(formData.get('phone') || '').replace(/\s/g, ''),
    postalCode: formData.get('postalCode') || undefined,
    city: formData.get('city') || undefined,
    description: formData.get('description'),
    urgency: formData.get('urgency') || 'normal',
  }

  const validation = leadSchema.safeParse(raw)
  if (!validation.success) {
    const firstError = validation.error.issues[0]
    return { success: false, error: firstError?.message || 'Donnees invalides' }
  }

  const data = validation.data

  try {
    const supabase = await createClient()

    // Resolve authenticated user (null if anonymous submission)
    const { data: { user } } = await supabase.auth.getUser()

    // Map urgency to DB enum
    const urgencyMap: Record<string, string> = {
      urgent: 'urgent',
      normal: 'normal',
      flexible: 'normal',
    }

    const { data: inserted, error } = await supabase.from('devis_requests').insert({
      client_id: user?.id ?? null,
      service_name: data.serviceName,
      postal_code: data.postalCode || '',
      city: data.city || null,
      description: data.description,
      urgency: urgencyMap[data.urgency] || 'normal',
      status: 'pending',
      client_name: data.name,
      client_email: data.email,
      client_phone: data.phone,
    }).select('id').single()

    if (error || !inserted) {
      logger.error('Lead insert error:', error)
      return { success: false, error: 'Erreur lors de l\'envoi. Reessayez.' }
    }

    // Log 'created' event — triggers "Demande bien reçue" notification to client
    logLeadEvent(inserted.id, 'created', { actorId: user?.id ?? undefined }).catch(() => {})

    // Determine whether to use direct dispatch or algorithmic dispatch.
    // If a providerId was given, verify the provider exists and is active.
    // If the provider is inactive (e.g. deactivated between page load and submission),
    // fall back to algorithmic dispatch instead of returning an error.
    let useDirectDispatch = false
    if (data.providerId) {
      const adminClient = createAdminClient()

      const { data: provider } = await adminClient
        .from('providers')
        .select('id, is_active')
        .eq('id', data.providerId)
        .single()

      if (provider && provider.is_active) {
        useDirectDispatch = true
        const { error: assignError } = await adminClient.from('lead_assignments').insert({
          lead_id: inserted.id,
          provider_id: data.providerId,
          source_table: 'devis_requests',
        })
        if (!assignError) {
          logLeadEvent(inserted.id, 'dispatched', { providerId: data.providerId }).catch(() => {})
        }
      }
    }

    if (!useDirectDispatch) {
      dispatchLead(inserted.id, {
        serviceName: data.serviceName,
        city: data.city,
        postalCode: data.postalCode,
        urgency: data.urgency,
        sourceTable: 'devis_requests',
      }).catch((err) =>
        logger.error('Dispatch failed (non-blocking):', err)
      )
    }

    return { success: true }
  } catch (err) {
    logger.error('Lead action error:', err)
    return { success: false, error: 'Erreur serveur. Reessayez.' }
  }
}
