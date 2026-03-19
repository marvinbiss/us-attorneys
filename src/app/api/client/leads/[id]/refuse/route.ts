/**
 * Client Refuse Quote API
 * POST /api/client/leads/[id]/refuse
 * Body: { quote_id: string }
 *
 * - Verifies the quote belongs to this quote_request
 * - Marks quote.status = 'refused'
 * - Logs a 'refused' lead_event
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiHandler } from '@/lib/api/handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { logLeadEvent } from '@/lib/dashboard/events'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const refuseSchema = z.object({
  quote_id: z.string().uuid(),
})

export const POST = createApiHandler(
  async ({ request, user, params }) => {
    const leadId = params?.id
    if (!leadId) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing lead ID' } },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Parse body
    const body = await request.json()
    const result = refuseSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid quote_id parameter', details: result.error.flatten() },
        },
        { status: 400 }
      )
    }
    const { quote_id } = result.data

    // Verify ownership of the consultation request via user client (RLS enforces client_id = auth.uid())

    const { data: lead, error: leadError } = await supabase
      .from('quote_requests')
      .select('id, status')
      .eq('id', leadId)
      .eq('client_id', user?.id ?? '')
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { success: false, error: { message: 'Request not found' } },
        { status: 404 }
      )
    }

    // Use admin client for write operations on quotes (providers-only RLS)
    const adminClient = createAdminClient()

    // Verify the quote belongs to this lead and is still pending
    const { data: quote, error: quoteError } = await adminClient
      .from('quotes')
      .select('id, request_id, attorney_id, status')
      .eq('id', quote_id)
      .eq('request_id', leadId)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json(
        { success: false, error: { message: 'Consultation not found for this request' } },
        { status: 404 }
      )
    }

    if (quote.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `This consultation can no longer be declined (status: ${quote.status})`,
          },
        },
        { status: 409 }
      )
    }

    // Mark the quote as refused
    const { error: refuseError } = await adminClient
      .from('quotes')
      .update({ status: 'refused' })
      .eq('id', quote_id)

    if (refuseError) {
      logger.error('Refuse quote update error:', refuseError)
      return NextResponse.json(
        { success: false, error: { message: 'Error declining the consultation' } },
        { status: 500 }
      )
    }

    // Log the refused event
    await logLeadEvent(leadId, 'refused', {
      actorId: user?.id ?? '',
      attorneyId: quote.attorney_id,
      metadata: { quote_id },
    })

    return NextResponse.json({
      success: true,
      message: 'Consultation declined',
    })
  },
  { requireAuth: true }
)
