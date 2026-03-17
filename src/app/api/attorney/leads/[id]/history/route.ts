/**
 * GET /api/attorney/leads/:id/history — Lead event history for authenticated attorney
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiHandler } from '@/lib/api/handler'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export const GET = createApiHandler(async ({ user, params }) => {
  const id = params?.id
  if (!id) {
    return NextResponse.json({ success: false, error: { message: 'Missing lead ID' } }, { status: 400 })
  }

  const supabase = await createClient()

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

  // Verify assignment belongs to this provider
  const { data: assignment } = await supabase
    .from('lead_assignments')
    .select('lead_id')
    .eq('id', id)
    .eq('attorney_id', provider.id)
    .single()

  if (!assignment) {
    return NextResponse.json({ success: false, error: { message: 'Lead not found' } }, { status: 404 })
  }

  // Fetch events for this lead (admin client to read lead_events)
  const adminClient = createAdminClient()
  const { data: events, error: eventsError } = await adminClient
    .from('lead_events')
    .select('id, event_type, metadata, created_at')
    .eq('lead_id', assignment.lead_id)
    .eq('attorney_id', provider.id)
    .order('created_at', { ascending: true })

  if (eventsError) {
    throw eventsError
  }

  return NextResponse.json({ events: events || [] })
}, { requireAttorney: true })
