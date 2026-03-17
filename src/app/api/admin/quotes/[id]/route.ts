import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'
import { createApiHandler } from '@/lib/api/handler'

// PATCH request schema
const updateQuoteSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected', 'expired']).optional(),
  amount: z.number().positive().max(1000000).optional(),
  notes: z.string().max(1000).optional(),
  valid_until: z.string().datetime().optional(),
})

export const dynamic = 'force-dynamic'

export const GET = createApiHandler(async ({ params }) => {
  // Verify admin with services:read permission
  const authResult = await requirePermission('services', 'read')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  const id = params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data: quote, error } = await supabase
    .from('quotes')
    .select('id, request_id, attorney_id, amount, description, valid_until, status, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Quote fetch error', error)
    return NextResponse.json({ success: false, error: { message: 'Consultation not found' } }, { status: 404 })
  }

  return NextResponse.json({ quote })
})

export const PATCH = createApiHandler(async ({ request, params }) => {
  // Verify admin with services:write permission
  const authResult = await requirePermission('services', 'write')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  const id = params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const body = await request.json()
  const result = updateQuoteSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Validation error', details: result.error.flatten() } },
      { status: 400 }
    )
  }
  const updates = result.data

  // Get old data for audit
  const { data: _oldQuote } = await supabase
    .from('quotes')
    .select('id, request_id, attorney_id, amount, description, valid_until, status, created_at, updated_at')
    .eq('id', id)
    .single()

  const { data: quote, error } = await supabase
    .from('quotes')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Quote operation error', error)
    return NextResponse.json({ success: false, error: { message: 'Error during operation' } }, { status: 500 })
  }

  // Audit log
  await logAdminAction(authResult.admin.id, 'quote_updated', 'booking', id, updates)

  return NextResponse.json({ quote })
})

export const DELETE = createApiHandler(async ({ params }) => {
  // Verify admin with services:delete permission
  const authResult = await requirePermission('services', 'delete')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  const id = params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Get quote data for audit
  const { data: _quoteToDelete } = await supabase
    .from('quotes')
    .select('id, request_id, attorney_id, amount, description, valid_until, status, created_at, updated_at')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('Quote operation error', error)
    return NextResponse.json({ success: false, error: { message: 'Error during operation' } }, { status: 500 })
  }

  // Audit log
  await logAdminAction(authResult.admin.id, 'quote_deleted', 'booking', id)

  return NextResponse.json({ success: true })
})
