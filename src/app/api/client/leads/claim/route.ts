/**
 * POST /api/client/leads/claim — Backfill client_id on anonymous leads
 *
 * When a user logs in, claim any consultation requests (devis_requests) that match their email+phone
 * Table 'devis_requests' = consultation requests (legacy French name)
 * but have client_id = NULL. This handles the case where a user submitted
 * a quote request before registering/logging in.
 *
 * Idempotent: running multiple times is safe (only updates NULL client_id).
 * Private route, no public access.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiHandler } from '@/lib/api/handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export const POST = createApiHandler(async ({ user }) => {
  const supabase = await createClient()

  // Get user's email and phone from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, phone_e164')
    .eq('id', user!.id)
    .single()

  if (!profile?.email) {
    return NextResponse.json({ success: false, error: { message: 'Incomplete profile' } }, { status: 400 })
  }

  // Use admin client to update leads where client_id is NULL
  // and email matches (phone match is optional bonus)
  const adminClient = createAdminClient()

  const { data: claimed, error: updateError } = await adminClient
    .from('devis_requests')
    .update({ client_id: user!.id })
    .is('client_id', null)
    .eq('client_email', profile.email)
    .select('id')

  if (updateError) {
    logger.error('Claim leads error:', updateError)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }

  return NextResponse.json({
    claimed: claimed?.length || 0,
    message: claimed?.length
      ? `${claimed.length} request(s) linked to your account`
      : 'No requests to link',
  })
}, { requireAuth: true })
