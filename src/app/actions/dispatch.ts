'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { trackLeadCharge } from '@/lib/billing/lead-billing'
import { calculateLeadCost, getAttorneyTier } from '@/lib/billing/cpa-model'

export interface DispatchOptions {
  specialtyName?: string
  city?: string
  postalCode?: string
  urgency?: string
  latitude?: number
  longitude?: number
  sourceTable?: 'devis_requests' | 'leads' // Table 'devis_requests' = consultation requests (legacy French name)
}

/**
 * Dispatch a lead to eligible attorneys using the configurable algorithm.
 *
 * ACTIVE SCHEMA: public (NOT app)
 * - Calls `public.dispatch_lead` from migration 202_configurable_dispatch.sql
 * - Reads config from `public.algorithm_config` (201_algorithm_config.sql)
 * - Writes to `public.lead_assignments` and `public.providers`
 *
 * The v3 `app.distribute_lead` function (110_v3_full_schema.sql) is NOT used
 * by any active code path. It is an aspirational/future schema.
 *
 * Uses service_role (bypasses RLS) — server-only.
 *
 * Returns array of assigned provider IDs (up to max_attorneys_per_lead).
 */
export async function dispatchLead(
  leadId: string,
  opts?: DispatchOptions
): Promise<string[]> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase.rpc('dispatch_lead', {
      p_lead_id: leadId,
      p_service_name: opts?.specialtyName || null,
      p_city: opts?.city || null,
      p_postal_code: opts?.postalCode || null,
      p_urgency: opts?.urgency || 'normal',
      p_latitude: opts?.latitude ?? null,
      p_longitude: opts?.longitude ?? null,
      p_source_table: opts?.sourceTable || 'devis_requests',
    })

    if (error) {
      logger.error('Dispatch error', error)
      return []
    }

    const assignedIds = (data as string[]) || []

    // Track billing charges for each dispatched attorney (non-blocking)
    for (const attorneyId of assignedIds) {
      getAttorneyTier(attorneyId)
        .then((tier) => {
          const cost = calculateLeadCost(tier, 'standard', opts?.city)
          return trackLeadCharge(attorneyId, leadId, 'standard', cost.finalCents)
        })
        .catch((err) =>
          logger.error('Failed to track lead charge in dispatch', { attorneyId, leadId, err })
        )
    }

    return assignedIds
  } catch (err: unknown) {
    logger.error('Dispatch action error', err)
    return []
  }
}
