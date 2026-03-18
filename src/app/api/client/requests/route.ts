/**
 * Client Demandes (Quote Requests) API
 * GET: Fetch quote requests submitted by the client
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch consultation requests for this client
    // Table 'devis_requests' = consultation requests (legacy French name)
    const { data: requests, error: requestsError } = await supabase
      .from('devis_requests')
      .select(`
        *,
        quotes(
          id,
          amount,
          description,
          valid_until,
          status,
          created_at,
          attorney:attorneys!attorney_id(id, name)
        )
      `)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })

    if (requestsError) {
      logger.error('Error fetching requests:', requestsError)
      return NextResponse.json(
        { error: 'Error retrieving claims' },
        { status: 500 }
      )
    }

    // Calculate stats
    const stats = {
      total: requests?.length || 0,
      pending: requests?.filter(d => d.status === 'pending').length || 0,
      quotesReceived: requests?.filter(d => d.status === 'sent').length || 0,
      accepted: requests?.filter(d => d.status === 'accepted').length || 0,
      declined: requests?.filter(d => d.status === 'refused').length || 0,
      completed: requests?.filter(d => d.status === 'completed').length || 0,
    }

    return NextResponse.json({
      requests: requests || [],
      stats
    })
  } catch (error: unknown) {
    logger.error('Client requests GET error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
