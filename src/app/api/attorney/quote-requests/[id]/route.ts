/**
 * Attorney Quotes — per-quote operations
 * DELETE /api/attorney/quotes/[id] — retract a pending quote
 * PATCH  /api/attorney/quotes/[id] — update amount / description / valid_until of a pending quote
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { requireArtisan } from '@/lib/auth/artisan-guard'
import { z } from 'zod'

const patchQuoteSchema = z.object({
  amount: z.number().positive().optional(),
  description: z.string().min(1).max(5000).optional(),
  valid_until: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD required')
    .optional(),
})

// ---------------------------------------------------------------------------
// DELETE — retract a pending quote
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error: guardError, user, supabase } = await requireArtisan()
    if (guardError) return guardError

    const { data: provider } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user!.id)
      .single()

    if (!provider) {
      return NextResponse.json({ success: false, error: { message: 'Attorney profile not found' } }, { status: 404 })
    }

    // Fetch the quote and verify ownership
    const { data: quote } = await supabase
      .from('quotes')
      .select('id, status, attorney_id')
      .eq('id', id)
      .single()

    if (!quote || quote.attorney_id !== provider.id) {
      return NextResponse.json({ success: false, error: { message: 'Consultation not found' } }, { status: 404 })
    }

    if (quote.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: { message: 'Only a pending consultation can be retracted' } },
        { status: 403 }
      )
    }

    const { error: deleteError } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)
      .eq('attorney_id', provider.id)

    if (deleteError) {
      logger.error('Error deleting quote:', deleteError)
      return NextResponse.json(
        { success: false, error: { message: 'Error deleting the consultation' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Attorney quote DELETE error:', error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// PATCH — modify a pending quote
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error: guardError, user, supabase } = await requireArtisan()
    if (guardError) return guardError

    const { data: provider } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user!.id)
      .single()

    if (!provider) {
      return NextResponse.json({ success: false, error: { message: 'Attorney profile not found' } }, { status: 404 })
    }

    const body = await req.json()
    const result = patchQuoteSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Validation error', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { amount, description, valid_until } = result.data

    // Validate valid_until is in the future if provided
    if (valid_until !== undefined) {
      const validUntilDate = new Date(valid_until)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (validUntilDate < today) {
        return NextResponse.json(
          { success: false, error: { message: 'The expiration date must be in the future' } },
          { status: 400 }
        )
      }
    }

    // Fetch the quote and verify ownership
    const { data: existing } = await supabase
      .from('quotes')
      .select('id, status, attorney_id')
      .eq('id', id)
      .single()

    if (!existing || existing.attorney_id !== provider.id) {
      return NextResponse.json({ success: false, error: { message: 'Consultation not found' } }, { status: 404 })
    }

    if (existing.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: { message: 'Only a pending consultation can be modified' } },
        { status: 403 }
      )
    }

    const patch: Record<string, unknown> = {}
    if (amount !== undefined) patch.amount = amount
    if (description !== undefined) patch.description = description
    if (valid_until !== undefined) patch.valid_until = valid_until

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'No modifiable fields provided' } },
        { status: 400 }
      )
    }

    const { data: updated, error: updateError } = await supabase
      .from('quotes')
      .update(patch)
      .eq('id', id)
      .eq('attorney_id', provider.id)
      .select()
      .single()

    if (updateError) {
      logger.error('Error patching quote:', updateError)
      return NextResponse.json(
        { success: false, error: { message: 'Error updating the consultation' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, devis: updated })
  } catch (error) {
    logger.error('Attorney quote PATCH error:', error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
