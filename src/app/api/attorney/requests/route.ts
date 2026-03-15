/**
 * Attorney Quote Requests API
 * GET: Fetch quote requests for the attorney
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { requireArtisan } from '@/lib/auth/artisan-guard'
import { z } from 'zod'

// GET query params schema
const demandesQuerySchema = z.object({
  status: z.enum(['all', 'pending', 'sent', 'accepted', 'refused']).optional().default('all'),
})

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { error: guardError, user, supabase } = await requireArtisan()
    if (guardError) return guardError

    const { searchParams } = new URL(request.url)
    const queryParams = {
      status: searchParams.get('status') || 'all',
    }
    const result = demandesQuerySchema.safeParse(queryParams)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: result.error.flatten() },
        { status: 400 }
      )
    }
    const { status } = result.data

    // Resolve provider for this attorney
    const { data: provider } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user!.id)
      .maybeSingle()

    if (!provider) {
      return NextResponse.json({ requests: [], stats: { total: 0, new: 0, quotes_sent: 0, accepted: 0, declined: 0 } })
    }

    // Get lead IDs assigned to this provider via lead_assignments
    const { data: assignments } = await supabase
      .from('lead_assignments')
      .select('lead_id')
      .eq('attorney_id', provider.id)

    const leadIds = (assignments || []).map(a => a.lead_id)

    if (leadIds.length === 0) {
      return NextResponse.json({ requests: [], stats: { total: 0, new: 0, quotes_sent: 0, accepted: 0, declined: 0 } })
    }

    // Fetch ALL devis_requests assigned to this provider (unfiltered) for accurate stats
    const { data: allDemandes, error: allDemandesError } = await supabase
      .from('devis_requests')
      .select('id, status')
      .in('id', leadIds)

    if (allDemandesError) {
      logger.error('Error fetching demandes for stats:', allDemandesError)
      return NextResponse.json(
        { error: 'Error retrieving claims' },
        { status: 500 }
      )
    }

    // Stats calculated on ALL demandes (not filtered by status)
    const stats = {
      total: allDemandes?.length || 0,
      new: allDemandes?.filter(d => d.status === 'pending').length || 0,
      quotes_sent: allDemandes?.filter(d => d.status === 'sent').length || 0,
      accepted: allDemandes?.filter(d => d.status === 'accepted').length || 0,
      declined: allDemandes?.filter(d => d.status === 'refused').length || 0,
    }

    // Fetch only devis_requests assigned to this provider, filtered by status if requested
    let query = supabase
      .from('devis_requests')
      .select('id, client_id, service_id, service_name, postal_code, city, description, budget, urgency, status, client_name, client_email, client_phone, created_at, updated_at')
      .in('id', leadIds)
      .order('created_at', { ascending: false })

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: demandes, error: demandesError } = await query

    if (demandesError) {
      logger.error('Error fetching demandes:', demandesError)
      return NextResponse.json(
        { error: 'Error retrieving claims' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      requests: demandes || [],
      stats
    })
  } catch (error) {
    logger.error('Demandes GET error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
