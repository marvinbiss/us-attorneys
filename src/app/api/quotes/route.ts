import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
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
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 1001, message: 'Authentification requise' }
        },
        { status: 401 }
      )
    }

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
        .eq('user_id', user.id)
        .single()

      if (!provider) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 1003, message: 'Profil artisan non trouve' }
          },
          { status: 404 }
        )
      }

      query = query.eq('attorney_id', provider.id)
    } else {
      query = query.eq('client_id', user.id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    query = query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    const { data: quotes, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: quotes,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    logger.error('Quotes fetch error', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 9999, message: 'Erreur serveur' }
      },
      { status: 500 }
    )
  }
}

// POST - Create a new quote (provider only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 1001, message: 'Authentification requise' }
        },
        { status: 401 }
      )
    }

    // Verify user is a provider
    const { data: provider } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 1003, message: 'Seuls les artisans peuvent creer des devis' }
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = quoteSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 2001,
            message: 'Donnees invalides',
            details: validation.error.issues,
          }
        },
        { status: 400 }
      )
    }

    const { booking_id, amount, description, valid_until, items } = validation.data

    // Verify booking exists and belongs to this provider
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, client_id, attorney_id')
      .eq('id', booking_id)
      .eq('attorney_id', provider.id)
      .single()

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 2002, message: 'Reservation non trouvee' }
        },
        { status: 404 }
      )
    }

    // Create quote
    const { data: quote, error } = await supabase
      .from('quotes')
      .insert({
        booking_id,
        attorney_id: provider.id,
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

    return NextResponse.json({
      success: true,
      data: quote,
    }, { status: 201 })
  } catch (error) {
    logger.error('Quote creation error', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 9999, message: 'Erreur serveur' }
      },
      { status: 500 }
    )
  }
}
