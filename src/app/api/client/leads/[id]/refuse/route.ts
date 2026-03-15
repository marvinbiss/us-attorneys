/**
 * Client Refuse Quote API
 * POST /api/client/leads/[id]/refuse
 * Body: { quote_id: string }
 *
 * - Verifies the quote belongs to this devis_request
 * - Marks quote.status = 'refused'
 * - Logs a 'refused' lead_event
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logLeadEvent } from '@/lib/dashboard/events'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const refuseSchema = z.object({
  quote_id: z.string().uuid(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: { message: 'Non authentifié' } }, { status: 401 })
    }

    // Parse body
    const body = await request.json()
    const result = refuseSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Paramètre quote_id invalide', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { quote_id } = result.data

    // Verify ownership of the devis_request via user client (RLS enforces client_id = auth.uid())
    const { data: lead, error: leadError } = await supabase
      .from('devis_requests')
      .select('id, status')
      .eq('id', leadId)
      .eq('client_id', user.id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ success: false, error: { message: 'Demande non trouvée' } }, { status: 404 })
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
      return NextResponse.json({ success: false, error: { message: 'Devis non trouvé pour cette demande' } }, { status: 404 })
    }

    if (quote.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: { message: `Ce devis ne peut plus être refusé (statut : ${quote.status})` } },
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
      return NextResponse.json({ success: false, error: { message: 'Erreur lors du refus du devis' } }, { status: 500 })
    }

    // Log the refused event
    await logLeadEvent(leadId, 'refused', {
      actorId: user.id,
      attorneyId: quote.attorney_id,
      metadata: { quote_id },
    })

    return NextResponse.json({
      success: true,
      message: 'Devis refusé',
    })
  } catch (error) {
    logger.error('Refuse quote POST error:', error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}
