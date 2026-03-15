import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

// PATCH request schema
const updateQuoteSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected', 'expired']).optional(),
  amount: z.number().positive().max(1000000).optional(),
  notes: z.string().max(1000).optional(),
  valid_until: z.string().datetime().optional(),
})

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin with services:read permission
    const authResult = await requirePermission('services', 'read')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    if (!isValidUuid(params.id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Identifiant invalide' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data: quote, error } = await supabase
      .from('quotes')
      .select('id, request_id, attorney_id, amount, description, valid_until, status, created_at, updated_at')
      .eq('id', params.id)
      .single()

    if (error) {
      logger.error('Quote fetch error', error)
      return NextResponse.json({ success: false, error: { message: 'Devis non trouvé' } }, { status: 404 })
    }

    return NextResponse.json({ quote })
  } catch (error) {
    logger.error('Quote fetch error', error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin with services:write permission
    const authResult = await requirePermission('services', 'write')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    if (!isValidUuid(params.id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Identifiant invalide' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const result = updateQuoteSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Erreur de validation', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const updates = result.data

    // Get old data for audit
    const { data: _oldQuote } = await supabase
      .from('quotes')
      .select('id, request_id, attorney_id, amount, description, valid_until, status, created_at, updated_at')
      .eq('id', params.id)
      .single()

    const { data: quote, error } = await supabase
      .from('quotes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      logger.error('Quote operation error', error)
      return NextResponse.json({ success: false, error: { message: 'Erreur lors de l\'opération' } }, { status: 500 })
    }

    // Log audit
    await logAdminAction(authResult.admin.id, 'quote_updated', 'booking', params.id, updates)

    return NextResponse.json({ quote })
  } catch (error) {
    logger.error('Quote update error', error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin with services:delete permission
    const authResult = await requirePermission('services', 'delete')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    if (!isValidUuid(params.id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Identifiant invalide' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get quote data for audit
    const { data: _quoteToDelete } = await supabase
      .from('quotes')
      .select('id, request_id, attorney_id, amount, description, valid_until, status, created_at, updated_at')
      .eq('id', params.id)
      .single()

    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', params.id)

    if (error) {
      logger.error('Quote operation error', error)
      return NextResponse.json({ success: false, error: { message: 'Erreur lors de l\'opération' } }, { status: 500 })
    }

    // Log audit
    await logAdminAction(authResult.admin.id, 'quote_deleted', 'booking', params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Quote delete error', error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}
