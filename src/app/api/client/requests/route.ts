/**
 * Client Demandes (Quote Requests) API
 * GET: Fetch quote requests submitted by the client
 */

import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api/handler'
import { logger } from '@/lib/logger'
import { withTimeout, isTimeoutError } from '@/lib/api/timeout'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return apiError('AUTHENTICATION_ERROR', 'Not authenticated', 401)
    }

    // Fetch consultation requests for this client
    // Table 'devis_requests' = consultation requests (legacy French name)
    const { data: requests, error: requestsError } = await withTimeout(
      supabase
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
    )

    if (requestsError) {
      logger.error('Error fetching requests:', requestsError)
      return apiError('DATABASE_ERROR', 'Error retrieving claims', 500)
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

    return apiSuccess({
      requests: requests || [],
      stats,
    })
  } catch (error: unknown) {
    if (isTimeoutError(error)) {
      logger.error('Client requests GET timeout:', error)
      return apiError('GATEWAY_TIMEOUT', 'The request timed out. Please try again.', 504)
    }
    logger.error('Client requests GET error:', error)
    return apiError('INTERNAL_ERROR', 'Server error', 500)
  }
}
