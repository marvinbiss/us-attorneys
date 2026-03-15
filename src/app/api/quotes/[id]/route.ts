import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// PATCH request schema
const quoteUpdateSchema = z.object({
  action: z.enum(['accept', 'reject', 'cancel']),
})

export const dynamic = 'force-dynamic'

// GET - Get single quote
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 1001, message: 'Authentication required' }
        },
        { status: 401 }
      )
    }

    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`
        id, request_id, attorney_id, amount, description, valid_until, status, created_at, updated_at
      `)
      .eq('id', params.id)
      .single()

    if (error || !quote) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 2002, message: 'Devis non trouve' }
        },
        { status: 404 }
      )
    }

    // Check authorization: is user the provider of this quote?
    const { data: provider } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const isProvider = provider?.id === quote.attorney_id

    // Check if user is the client via the devis_request
    const { data: devisRequest } = await supabase
      .from('devis_requests')
      .select('client_id')
      .eq('id', quote.request_id)
      .single()

    const isClient = devisRequest?.client_id === user.id

    if (!isProvider && !isClient) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 1002, message: 'Acces non autorise' }
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: quote,
    })
  } catch (error) {
    logger.error('Quote fetch error', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 9999, message: 'Server error' }
      },
      { status: 500 }
    )
  }
}

// PATCH - Update quote status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 1001, message: 'Authentication required' }
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = quoteUpdateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 2001, message: 'Validation error', details: result.error.flatten() }
        },
        { status: 400 }
      )
    }
    const { action } = result.data

    const { data: quote } = await supabase
      .from('quotes')
      .select('id, request_id, attorney_id, amount, description, valid_until, status, created_at, updated_at')
      .eq('id', params.id)
      .single()

    if (!quote) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 2002, message: 'Devis non trouve' }
        },
        { status: 404 }
      )
    }

    // Check authorization and validate action
    const { data: provider } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const isProvider = provider?.id === quote.attorney_id

    const { data: devisRequest } = await supabase
      .from('devis_requests')
      .select('client_id')
      .eq('id', quote.request_id)
      .single()

    const isClient = devisRequest?.client_id === user.id

    let newStatus: string

    switch (action) {
      case 'accept':
        if (!isClient) {
          return NextResponse.json(
            {
              success: false,
              error: { code: 1002, message: 'Seul le client peut accepter the consultation' }
            },
            { status: 403 }
          )
        }
        newStatus = 'accepted'
        break

      case 'reject':
        if (!isClient) {
          return NextResponse.json(
            {
              success: false,
              error: { code: 1002, message: 'Seul le client peut refuser the consultation' }
            },
            { status: 403 }
          )
        }
        newStatus = 'rejected'
        break

      case 'cancel':
        if (!isProvider) {
          return NextResponse.json(
            {
              success: false,
              error: { code: 1002, message: 'Only the attorney can cancel the consultation' }
            },
            { status: 403 }
          )
        }
        newStatus = 'cancelled'
        break
    }

    const { data: updatedQuote, error } = await supabase
      .from('quotes')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: updatedQuote,
    })
  } catch (error) {
    logger.error('Quote update error', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 9999, message: 'Server error' }
      },
      { status: 500 }
    )
  }
}
