/**
 * POST /api/bookings/payment
 * Creates a Stripe Checkout session for a booking deposit payment.
 * Called by BookingPayment components to redirect user to Stripe.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { logger } from '@/lib/logger'

const paymentSchema = z.object({
  bookingId: z.string().uuid(),
  depositAmountInCents: z.number().int().positive().max(1000000), // Max $10,000
})

export async function POST(request: NextRequest) {
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
    const parsed = paymentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues.map(i => i.message).join(', ') } },
        { status: 400 }
      )
    }

    const { bookingId, depositAmountInCents } = parsed.data

    // Verify booking exists and belongs to this user
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, attorney_id, client_id, client_email, client_name, status, booking_fee, stripe_payment_intent_id')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
        { status: 404 }
      )
    }

    // Verify ownership: either the client_id matches or the client_email matches
    if (booking.client_id && booking.client_id !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Not authorized for this booking' } },
        { status: 403 }
      )
    }

    // Prevent double payment
    if (booking.stripe_payment_intent_id) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_PAID', message: 'This booking already has a payment' } },
        { status: 409 }
      )
    }

    // Only allow payment for pending/confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: 'Cannot pay for a booking with status: ' + booking.status } },
        { status: 400 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email || booking.client_email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Consultation Deposit',
              description: `Booking deposit for consultation #${bookingId.slice(0, 8)}`,
            },
            unit_amount: depositAmountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        booking_id: bookingId,
        user_id: user.id,
        type: 'booking_deposit',
      },
      success_url: `${siteUrl}/client-dashboard/consultations?payment=success&booking=${bookingId}`,
      cancel_url: `${siteUrl}/client-dashboard/consultations?payment=cancelled&booking=${bookingId}`,
    })

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    logger.error('[api/bookings/payment] Payment session creation failed', {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create payment session' } },
      { status: 500 }
    )
  }
}
