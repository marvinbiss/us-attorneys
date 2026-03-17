/**
 * POST /api/attorney/leads/:id/action — Lead actions for authenticated attorney
 * Actions: view, quote, decline
 *
 * RLS note: lead_assignments has policy "lead_assignments_provider_update" (migration 103)
 * allowing attorneys to UPDATE their own assignments. The authenticated `supabase` client
 * is therefore used for mutations instead of adminClient, which would bypass RLS.
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createApiHandler } from '@/lib/api/handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { logLeadEvent } from '@/lib/dashboard/events'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('view') }),
  z.object({
    action: z.literal('quote'),
    amount: z.number().positive(),
    description: z.string().max(2000).optional(),
    validDays: z.number().int().positive().optional(),
  }),
  z.object({
    action: z.literal('decline'),
    reason: z.string().max(500).optional(),
  }),
])

export const POST = createApiHandler(async ({ request, user, params }) => {
  const id = params?.id
  if (!id) {
    return NextResponse.json({ success: false, error: { message: 'Missing lead ID' } }, { status: 400 })
  }

  const supabase = await createClient()

  const rawBody = await request.json()
  const result = actionSchema.safeParse(rawBody)
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid action. Valid values: view, quote, decline', details: result.error.flatten() } },
      { status: 400 }
    )
  }
  const body = result.data

  // Get provider linked to this user
  const { data: provider } = await supabase
    .from('attorneys')
    .select('id')
    .eq('user_id', user!.id)
    .eq('is_active', true)
    .single()

  if (!provider) {
    return NextResponse.json({ success: false, error: { message: 'No attorney profile found' } }, { status: 403 })
  }

  // Verify assignment exists and belongs to this provider.
  // adminClient used for SELECT only (read across RLS boundary is harmless here;
  // the attorney_id check ensures the attorney only sees their own record).
  const adminClient = createAdminClient()
  const { data: assignment, error: assignError } = await adminClient
    .from('lead_assignments')
    .select('id, lead_id, status')
    .eq('id', id)
    .eq('attorney_id', provider.id)
    .single()

  if (assignError || !assignment) {
    return NextResponse.json({ success: false, error: { message: 'Lead not found' } }, { status: 404 })
  }

  const now = new Date().toISOString()

  if (body.action === 'view') {
    // Bug 2 fix: only advance to 'viewed' from 'pending'.
    // Any other status (quoted, declined, viewed) must not be downgraded.
    if (!['pending'].includes(assignment.status)) {
      // Just log the view event without mutating the status.
      await logLeadEvent(assignment.lead_id, 'viewed', {
        attorneyId: provider.id,
        actorId: user!.id,
      })
      return NextResponse.json({ success: true, action: body.action })
    }

    // Bug 1 fix: use authenticated supabase client (RLS policy "lead_assignments_provider_update"
    // from migration 103 allows the attorney to UPDATE their own assignments).
    const { error: updateError } = await supabase
      .from('lead_assignments')
      .update({ status: 'viewed', viewed_at: now })
      .eq('id', id)

    if (updateError) {
      logger.error('Lead view update error:', updateError)
      return NextResponse.json({ success: false, error: { message: 'Error updating lead' } }, { status: 500 })
    }

    await logLeadEvent(assignment.lead_id, 'viewed', {
      attorneyId: provider.id,
      actorId: user!.id,
    })
  } else if (body.action === 'quote') {
    const { amount, description: quoteDesc, validDays } = body

    // Check for duplicate quote (409 Conflict)
    const { data: existingQuote } = await adminClient
      .from('quotes')
      .select('id')
      .eq('request_id', assignment.lead_id)
      .eq('attorney_id', provider.id)
      .limit(1)
      .single()

    if (existingQuote) {
      return NextResponse.json(
        { success: false, error: { message: 'A consultation already exists for this lead' } },
        { status: 409 }
      )
    }

    // validDays is validated as positive integer by Zod; default 30
    const days = validDays ?? 30
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + days)

    // Bug 3 fix: UPDATE lead_assignment FIRST, then INSERT quote.
    // If the UPDATE fails we bail out before creating an orphan quote row.
    // If the INSERT fails after the UPDATE, we roll back the status to 'viewed'
    // (the most recent prior state for a quoted action) to keep a consistent state.

    // Step 1: UPDATE assignment status -> 'quoted'
    const { error: updateError } = await supabase
      .from('lead_assignments')
      .update({ status: 'quoted' })
      .eq('id', id)

    if (updateError) {
      logger.error('Lead quote status update error:', updateError)
      return NextResponse.json({ success: false, error: { message: 'Error updating lead' } }, { status: 500 })
    }

    // Step 2: INSERT quote — if this fails, roll back assignment status
    const { error: insertError } = await supabase
      .from('quotes')
      .insert({
        request_id: assignment.lead_id,
        attorney_id: provider.id,
        amount,
        description: quoteDesc || '',
        valid_until: validUntil.toISOString().split('T')[0],
        status: 'pending',
      })

    if (insertError) {
      logger.error('Lead quote insert error (rolling back assignment status):', insertError)
      // Rollback: restore previous status
      await supabase
        .from('lead_assignments')
        .update({ status: assignment.status })
        .eq('id', id)
      return NextResponse.json({ success: false, error: { message: 'Error creating the consultation' } }, { status: 500 })
    }

    await logLeadEvent(assignment.lead_id, 'quoted', {
      attorneyId: provider.id,
      actorId: user!.id,
      metadata: { amount, validDays: days },
    })
  } else if (body.action === 'decline') {
    const { reason } = body

    // Bug 1 fix: use authenticated supabase client for mutation
    const { error: updateError } = await supabase
      .from('lead_assignments')
      .update({ status: 'declined' })
      .eq('id', id)

    if (updateError) {
      logger.error('Lead decline update error:', updateError)
      return NextResponse.json({ success: false, error: { message: 'Error updating lead' } }, { status: 500 })
    }

    await logLeadEvent(assignment.lead_id, 'declined', {
      attorneyId: provider.id,
      actorId: user!.id,
      metadata: { reason: reason || '' },
    })
  }

  return NextResponse.json({ success: true, action: body.action })
}, { requireAttorney: true })
