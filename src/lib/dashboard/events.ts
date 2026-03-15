/**
 * Dashboard V2 — Event logging helpers (server-side only)
 * All functions use admin client (service_role) — bypasses RLS.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { processLeadEvent } from '@/lib/notifications/lead-notifications'
import { logger } from '@/lib/logger'

export type LeadEventType =
  | 'created'
  | 'dispatched'
  | 'viewed'
  | 'quoted'
  | 'declined'
  | 'accepted'
  | 'refused'
  | 'completed'
  | 'expired'
  | 'reassigned'

export async function logLeadEvent(
  leadId: string,
  eventType: LeadEventType,
  opts?: {
    attorneyId?: string
    actorId?: string
    metadata?: Record<string, unknown>
  }
) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('lead_events').insert({
    lead_id: leadId,
    event_type: eventType,
    attorney_id: opts?.attorneyId ?? null,
    actor_id: opts?.actorId ?? null,
    metadata: opts?.metadata ?? {},
  }).select('id').single()
  if (error) {
    logger.error('Failed to log lead event:', { error: error.message })
    return
  }

  // Fire-and-forget: process notifications (idempotent)
  processLeadEvent({
    id: data.id,
    lead_id: leadId,
    event_type: eventType,
    attorney_id: opts?.attorneyId ?? null,
    actor_id: opts?.actorId ?? null,
    metadata: opts?.metadata ?? {},
  }).catch((err) => {
    logger.error('Notification processing failed:', err)
  })
}

export async function logAccess(
  path: string,
  opts?: {
    userId?: string
    method?: string
    statusCode?: number
    ipAddress?: string
    userAgent?: string
  }
) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('access_logs').insert({
    path,
    user_id: opts?.userId ?? null,
    method: opts?.method ?? 'GET',
    status_code: opts?.statusCode ?? null,
    ip_address: opts?.ipAddress ?? null,
    user_agent: opts?.userAgent ?? null,
  })
  if (error) {
    logger.error('Failed to log access:', { error: error.message })
  }
}
