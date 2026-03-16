/**
 * GET /api/attorney/leads/:id/history — Lead event history for authenticated attorney
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAttorney } from '@/lib/auth/attorney-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error: guardError, user, supabase } = await requireAttorney()
    if (guardError) return guardError

    // Get provider linked to this user
    const { data: provider } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user.id)
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
      logger.error('Lead history error:', eventsError)
      return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
    }

    return NextResponse.json({ events: events || [] })
  } catch (error) {
    logger.error('Lead history GET error:', error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
