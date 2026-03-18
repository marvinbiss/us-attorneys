/**
 * GET /api/attorney/quotes
 * List quotes for the authenticated attorney.
 *
 * POST /api/attorney/quotes
 * Create a new quote for a lead/request.
 *
 * PUT /api/attorney/quotes
 * Update an existing quote.
 *
 * Note: The `quotes` table uses `provider_id` (legacy from ServicesArtisans),
 * which maps to the attorney's row in the `attorneys` table.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { createApiHandler, apiSuccess, apiError } from '@/lib/api/handler'

const createQuoteSchema = z.object({
  request_id: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().min(5).max(5000),
  valid_until: z.string().min(1), // Date string YYYY-MM-DD
})

const updateQuoteSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().min(5).max(5000),
  valid_until: z.string().min(1),
})

// GET - List attorney's quotes
export const GET = createApiHandler(
  async ({ user }) => {
    const supabase = await createClient()

    // Find attorney profile
    const { data: attorney } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user!.id)
      .single()

    if (!attorney) {
      return apiError('NOT_FOUND', 'Attorney profile not found', 404)
    }

    const { data: quotes, error } = await supabase
      .from('quotes')
      .select(`
        id,
        request_id,
        provider_id,
        amount,
        description,
        valid_until,
        status,
        created_at,
        updated_at,
        request:devis_requests(
          id,
          service_name,
          client_name,
          client_email,
          city,
          postal_code,
          description,
          urgency,
          status
        )
      `)
      .eq('provider_id', attorney.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('[api/attorney/quotes] GET failed', { error: error.message })
      throw error
    }

    return apiSuccess(quotes || [])
  },
  { requireAuth: true }
)

// POST - Create a new quote
export const POST = createApiHandler(
  async ({ user, request }) => {
    const supabase = await createClient()
    const body = await request.json()
    const parsed = createQuoteSchema.safeParse(body)

    if (!parsed.success) {
      return apiError(
        'VALIDATION_ERROR',
        parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
        400
      )
    }

    // Find attorney profile
    const { data: attorney } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user!.id)
      .single()

    if (!attorney) {
      return apiError('NOT_FOUND', 'Attorney profile not found', 404)
    }

    const { request_id, amount, description, valid_until } = parsed.data

    // Verify the request exists
    const { data: devisRequest } = await supabase
      .from('devis_requests')
      .select('id, status')
      .eq('id', request_id)
      .single()

    if (!devisRequest) {
      return apiError('NOT_FOUND', 'Request not found', 404)
    }

    // Check for duplicate quote from same attorney on same request
    const { data: existingQuote } = await supabase
      .from('quotes')
      .select('id')
      .eq('request_id', request_id)
      .eq('provider_id', attorney.id)
      .single()

    if (existingQuote) {
      return apiError('DUPLICATE', 'You already submitted a quote for this request', 409)
    }

    // Create the quote
    const { data: quote, error } = await supabase
      .from('quotes')
      .insert({
        request_id,
        provider_id: attorney.id,
        amount,
        description,
        valid_until,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      logger.error('[api/attorney/quotes] POST failed', { error: error.message })
      throw error
    }

    return apiSuccess(quote, 201)
  },
  { requireAuth: true }
)

// PUT - Update an existing quote
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = updateQuoteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues.map(i => i.message).join(', ') } },
        { status: 400 }
      )
    }

    // Find attorney profile
    const { data: attorney } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!attorney) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Attorney profile not found' } },
        { status: 404 }
      )
    }

    const { id, amount, description, valid_until } = parsed.data

    // Verify quote exists and belongs to this attorney
    const { data: existingQuote } = await supabase
      .from('quotes')
      .select('id, provider_id, status')
      .eq('id', id)
      .eq('provider_id', attorney.id)
      .single()

    if (!existingQuote) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quote not found or not yours' } },
        { status: 404 }
      )
    }

    // Only allow updating pending quotes
    if (existingQuote.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: `Cannot update a quote with status: ${existingQuote.status}` } },
        { status: 400 }
      )
    }

    // Update the quote
    const { data: updatedQuote, error } = await supabase
      .from('quotes')
      .update({ amount, description, valid_until })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('[api/attorney/quotes] PUT failed', { error: error.message })
      throw error
    }

    return NextResponse.json({ success: true, data: updatedQuote })
  } catch (error) {
    logger.error('[api/attorney/quotes] PUT error', {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update quote' } },
      { status: 500 }
    )
  }
}
