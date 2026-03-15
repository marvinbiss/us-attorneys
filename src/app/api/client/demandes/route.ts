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

    // Fetch quote requests for this client
    const { data: demandes, error: demandesError } = await supabase
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

    if (demandesError) {
      logger.error('Error fetching demandes:', demandesError)
      return NextResponse.json(
        { error: 'Error retrieving claims' },
        { status: 500 }
      )
    }

    // Calculate stats
    const stats = {
      total: demandes?.length || 0,
      pending: demandes?.filter(d => d.status === 'pending').length || 0,
      quotesReceived: demandes?.filter(d => d.status === 'sent').length || 0,
      accepted: demandes?.filter(d => d.status === 'accepted').length || 0,
      declined: demandes?.filter(d => d.status === 'refused').length || 0,
      completed: demandes?.filter(d => d.status === 'completed').length || 0,
    }

    return NextResponse.json({
      requests: demandes || [],
      stats
    })
  } catch (error) {
    logger.error('Client demandes GET error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
