import { NextRequest, NextResponse } from 'next/server'
import { createApiHandler, jsonResponse, paginatedResponse } from '@/lib/api/handler'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const quoteSchema = z.object({
  booking_id: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().min(10).max(2000),
  valid_until: z.string().datetime().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unit_price: z.number().positive(),
  })).optional(),
})

// GET - List quotes for authenticated user
export const GET = createApiHandler(
  async ({ user, request }) => {
    const supabase = await createClient()

    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role') || 'client'
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    let query = supabase
      .from('quotes')
      .select(`
        *,
        booking:bookings(
          id,
          service_name,
          scheduled_date,
          client:profiles!client_id(full_name, email),
          provider:providers(name)
        )
      `, { count: 'exact' })

    if (role === 'provider') {
      const { data: provider } = await supabase
        .from('attorneys')
        .select('id')
        .eq('user_id', user!.id)
        .single()

      if (!provider) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 1003, message: 'Attorney profile not found' }
          },
          { status: 404 }
        )
      }

      query = query.eq('attorney_id', provider.id)
    } else {
      query = query.eq('client_id', user!.id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    query = query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    const { data: quotes, error, count } = await query

    if (error) throw error

    return paginatedResponse(quotes || [], {
      page,
      limit,
      total: count || 0,
    })
  },
  { requireAuth: true }
)

// POST - Create a new quote (attorney only)
export const POST = createApiHandler<z.infer<typeof quoteSchema>>(
  async ({ body, attorney }) => {
    const supabase = await createClient()
    const { booking_id, amount, description, valid_until, items } = body

    // Verify booking exists and belongs to this attorney
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, client_id, attorney_id')
      .eq('id', booking_id)
      .eq('attorney_id', attorney!.attorney_id)
      .single()

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 2002, message: 'Booking not found' }
        },
        { status: 404 }
      )
    }

    // Create quote
    const { data: quote, error } = await supabase
      .from('quotes')
      .insert({
        booking_id,
        attorney_id: attorney!.attorney_id,
        client_id: booking.client_id,
        amount,
        description,
        valid_until: valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        items: items || [],
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    return jsonResponse(quote, 201)
  },
  { requireAuth: true, requireAttorney: true, bodySchema: quoteSchema }
)
