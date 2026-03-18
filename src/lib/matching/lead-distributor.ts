/**
 * Lead Distributor — US Attorneys
 *
 * Assigns incoming leads (consultation requests) to the best-matching attorney.
 * Features:
 *   - Calls matchLeadToAttorneys() for scored ranking
 *   - Round-robin within same-score tier (prevents one attorney hogging leads)
 *   - Enforces monthly lead limits per subscription plan
 *   - Records assignment in attorney_lead_assignments table
 *   - Increments lead_usage counter
 *   - Sends push notification to assigned attorney
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToUser } from '@/lib/push/send'
import { logger } from '@/lib/logger'
import { matchLeadToAttorneys, type LeadInput, type MatchResult } from './lead-matcher'

const distLogger = logger.child({ component: 'lead-distributor' })

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DistributionResult {
  success: boolean
  assignedAttorneyId: string | null
  assignedAttorneyName: string | null
  score: number
  matchReasons: string[]
  totalCandidates: number
  status: 'assigned' | 'no_match' | 'error'
  error?: string
}

// ---------------------------------------------------------------------------
// Main distribution function
// ---------------------------------------------------------------------------

/**
 * Distribute a lead (booking/consultation request) to the best-matching attorney.
 *
 * Flow:
 *   1. Fetch booking details to build LeadInput
 *   2. Run matchLeadToAttorneys() for ranked candidates
 *   3. Assign to top match (respecting lead limits and round-robin)
 *   4. Record assignment, update counters, send notification
 *   5. If no match found, mark booking for manual review
 */
export async function distributeLead(bookingId: string): Promise<DistributionResult> {
  const supabase = createAdminClient()

  try {
    // --- 1. Fetch booking details ---
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        attorney_id,
        client_name,
        client_email,
        notes,
        practice_area_slug,
        client_state,
        client_city,
        client_zip
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      distLogger.error('Booking not found for distribution', { bookingId, error: bookingError })
      return {
        success: false,
        assignedAttorneyId: null,
        assignedAttorneyName: null,
        score: 0,
        matchReasons: [],
        totalCandidates: 0,
        status: 'error',
        error: 'Booking not found',
      }
    }

    // If the booking already has an attorney assigned directly, skip matching
    if (booking.attorney_id) {
      distLogger.info('Booking already has a direct attorney, skipping matching', {
        bookingId,
        attorneyId: booking.attorney_id,
      })
      return {
        success: true,
        assignedAttorneyId: booking.attorney_id,
        assignedAttorneyName: null,
        score: 100,
        matchReasons: ['direct_request'],
        totalCandidates: 1,
        status: 'assigned',
      }
    }

    // --- 2. Build lead input ---
    const leadInput: LeadInput = {
      bookingId,
      practiceAreaSlug: booking.practice_area_slug || null,
      city: booking.client_city || null,
      state: booking.client_state || null,
      zip: booking.client_zip || null,
      attorneyId: booking.attorney_id || null,
    }

    // --- 3. Run matching algorithm ---
    const matches = await matchLeadToAttorneys(leadInput)

    if (matches.length === 0) {
      distLogger.warn('No matching attorneys found for lead', { bookingId })

      // Mark booking for manual review
      await supabase
        .from('bookings')
        .update({ matching_status: 'manual_review' })
        .eq('id', bookingId)

      return {
        success: false,
        assignedAttorneyId: null,
        assignedAttorneyName: null,
        score: 0,
        matchReasons: [],
        totalCandidates: 0,
        status: 'no_match',
      }
    }

    // --- 4. Attempt assignment starting from the top match ---
    const assignResult = await attemptAssignment(supabase, bookingId, matches)

    if (!assignResult) {
      // All top candidates were exhausted (e.g., hit limits during assignment)
      await supabase
        .from('bookings')
        .update({ matching_status: 'manual_review' })
        .eq('id', bookingId)

      return {
        success: false,
        assignedAttorneyId: null,
        assignedAttorneyName: null,
        score: 0,
        matchReasons: [],
        totalCandidates: matches.length,
        status: 'no_match',
      }
    }

    // --- 5. Update booking with match info ---
    await supabase
      .from('bookings')
      .update({
        matching_status: 'assigned',
        matched_attorney_id: assignResult.attorneyId,
      })
      .eq('id', bookingId)

    // --- 6. Send push notification to the assigned attorney ---
    await notifyAttorney(supabase, assignResult.attorneyId, bookingId, booking.client_name)

    distLogger.info('Lead distributed successfully', {
      bookingId,
      attorneyId: assignResult.attorneyId,
      score: assignResult.score,
      position: assignResult.position,
    })

    return {
      success: true,
      assignedAttorneyId: assignResult.attorneyId,
      assignedAttorneyName: assignResult.attorneyName,
      score: assignResult.score,
      matchReasons: assignResult.matchReasons.map((r) => r.type),
      totalCandidates: matches.length,
      status: 'assigned',
    }
  } catch (error) {
    distLogger.error('Lead distribution failed', error)
    return {
      success: false,
      assignedAttorneyId: null,
      assignedAttorneyName: null,
      score: 0,
      matchReasons: [],
      totalCandidates: 0,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ---------------------------------------------------------------------------
// Manual reassignment (for admin)
// ---------------------------------------------------------------------------

/**
 * Manually reassign a lead to a specific attorney.
 * Used by admins when the automatic matching is incorrect or for manual review cases.
 */
export async function reassignLead(
  bookingId: string,
  newAttorneyId: string,
  adminId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  try {
    // Verify the attorney exists and is active
    const { data: attorney, error: attyError } = await supabase
      .from('attorneys')
      .select('id, name, user_id, subscription_tier')
      .eq('id', newAttorneyId)
      .eq('is_active', true)
      .single()

    if (attyError || !attorney) {
      return { success: false, error: 'Attorney not found or inactive' }
    }

    // Expire any existing pending assignments for this lead
    await supabase
      .from('attorney_lead_assignments')
      .update({ status: 'expired' })
      .eq('lead_id', bookingId)
      .eq('status', 'pending')

    // Create new assignment
    const { error: insertError } = await supabase
      .from('attorney_lead_assignments')
      .upsert({
        lead_id: bookingId,
        attorney_id: newAttorneyId,
        score: 0,
        match_reasons: [{ type: 'manual_assignment', points: 0, detail: `Assigned by admin ${adminId}` }],
        status: 'pending',
        position: 1,
        assigned_at: new Date().toISOString(),
      }, {
        onConflict: 'lead_id,attorney_id',
      })

    if (insertError) {
      distLogger.error('Manual reassignment insert failed', insertError)
      return { success: false, error: 'Failed to create assignment' }
    }

    // Update booking
    await supabase
      .from('bookings')
      .update({
        matching_status: 'assigned',
        matched_attorney_id: newAttorneyId,
      })
      .eq('id', bookingId)

    // Update lead usage
    await incrementLeadUsage(supabase, newAttorneyId)

    // Update round-robin counter
    await supabase
      .from('attorneys')
      .update({ last_lead_assigned_at: new Date().toISOString() })
      .eq('id', newAttorneyId)

    // Notify the new attorney
    const { data: booking } = await supabase
      .from('bookings')
      .select('client_name')
      .eq('id', bookingId)
      .single()

    await notifyAttorney(supabase, newAttorneyId, bookingId, booking?.client_name || 'A client')

    distLogger.info('Lead manually reassigned', {
      bookingId,
      newAttorneyId,
      adminId,
    })

    return { success: true }
  } catch (error) {
    distLogger.error('Manual reassignment failed', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface AssignmentSuccess {
  attorneyId: string
  attorneyName: string
  score: number
  position: number
  matchReasons: MatchResult['matchReasons']
}

/**
 * Attempt to assign the lead to the first available attorney from the ranked list.
 * Handles race conditions via UNIQUE constraint.
 */
async function attemptAssignment(
  supabase: ReturnType<typeof createAdminClient>,
  bookingId: string,
  matches: MatchResult[],
): Promise<AssignmentSuccess | null> {
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const position = i + 1

    // Insert assignment (UNIQUE constraint prevents double-assignment)
    const { error: insertError } = await supabase
      .from('attorney_lead_assignments')
      .insert({
        lead_id: bookingId,
        attorney_id: match.attorneyId,
        score: match.score,
        match_reasons: match.matchReasons,
        status: 'pending',
        position,
      })

    if (insertError) {
      // Likely a unique constraint violation — this attorney was already assigned
      distLogger.warn('Assignment insert failed, trying next candidate', {
        bookingId,
        attorneyId: match.attorneyId,
        error: insertError.message,
      })
      continue
    }

    // Increment lead usage counter
    await incrementLeadUsage(supabase, match.attorneyId)

    // Update round-robin counter
    await supabase
      .from('attorneys')
      .update({ last_lead_assigned_at: new Date().toISOString() })
      .eq('id', match.attorneyId)

    return {
      attorneyId: match.attorneyId,
      attorneyName: match.attorneyName,
      score: match.score,
      position,
      matchReasons: match.matchReasons,
    }
  }

  return null
}

/**
 * Increment the monthly lead usage counter for an attorney.
 * Uses upsert to create the row if it does not exist.
 */
async function incrementLeadUsage(
  supabase: ReturnType<typeof createAdminClient>,
  attorneyId: string,
): Promise<void> {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  // Try to increment existing row
  const { data: existing } = await supabase
    .from('lead_usage')
    .select('id, lead_count')
    .eq('attorney_id', attorneyId)
    .eq('month', month)
    .single()

  if (existing) {
    await supabase
      .from('lead_usage')
      .update({
        lead_count: existing.lead_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('lead_usage')
      .insert({
        attorney_id: attorneyId,
        month,
        lead_count: 1,
      })
  }
}

/**
 * Send push notification to the assigned attorney.
 * Non-blocking — errors are logged but do not fail the assignment.
 */
async function notifyAttorney(
  supabase: ReturnType<typeof createAdminClient>,
  attorneyId: string,
  bookingId: string,
  clientName: string,
): Promise<void> {
  try {
    // Get the attorney's user_id for push notification
    const { data: attorney } = await supabase
      .from('attorneys')
      .select('user_id, name')
      .eq('id', attorneyId)
      .single()

    if (!attorney?.user_id) {
      distLogger.info('Attorney has no user_id, skipping push notification', { attorneyId })
      return
    }

    await sendPushToUser(attorney.user_id, {
      title: 'New Lead Assigned',
      body: `${clientName} is looking for legal help. Review and respond to secure this client.`,
      icon: '/icons/icon-192x192.png',
      url: `/attorney-dashboard/leads`,
      tag: `lead-${bookingId}`,
      requireInteraction: true,
      data: {
        type: 'new_lead',
        bookingId,
        attorneyId,
      },
    })

    distLogger.info('Push notification sent to attorney', {
      attorneyId,
      userId: attorney.user_id,
    })
  } catch (error) {
    // Non-blocking — log and continue
    distLogger.error('Failed to send push notification', error)
  }
}
