/**
 * GET /api/attorney/leads/:id — Single lead detail for authenticated attorney
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAttorney } from '@/lib/auth/attorney-guard'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      return NextResponse.json(
        { success: false, error: { message: 'No attorney profile found' } },
        { status: 403 }
      )
    }

    // Fetch assignment with full lead data

    const { data: assignment, error: assignError } = await supabase
      .from('lead_assignments')
      .select(
        `
        id,
        status,
        assigned_at,
        viewed_at,
        lead:quote_requests (
          id,
          service_name,
          city,
          postal_code,
          description,
          budget,
          urgency,
          client_name,
          client_email,
          client_phone,
          created_at,
          status
        )
      `
      )
      .eq('id', id)
      .eq('attorney_id', provider.id)
      .single()

    if (assignError || !assignment) {
      return NextResponse.json(
        { success: false, error: { message: 'Lead not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ assignment })
  } catch (error: unknown) {
    logger.error('Lead detail GET error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
