/**
 * POST /api/payments/intent
 * Creates a Stripe PaymentIntent for the PaymentForm component.
 * Supports full payment, deposit, and split payment modes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { logger } from '@/lib/logger'

const intentSchema = z.object({
  bookingId: z.string().uuid(),
  attorneyId: z.string().uuid(),
  amount: z.number().int().positive().max(10000000), // In cents, max $100,000
  description: z.string().max(500).optional(),
  paymentType: z.enum(['full', 'deposit', 'split']).default('full'),
  depositPercentage: z.number().int().min(10).max(90).optional(),
  splitInstallments: z.enum([2, 3, 4] as unknown as [string, ...string[]]).optional(),
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
    const parsed = intentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues.map(i => i.message).join(', ') } },
        { status: 400 }
      )
    }

    const { bookingId, attorneyId, amount, description, paymentType, depositPercentage, splitInstallments } = parsed.data

    // Verify booking exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, attorney_id, client_id, status')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
        { status: 404 }
      )
    }

    // Verify attorney matches
    if (booking.attorney_id !== attorneyId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISMATCH', message: 'Attorney does not match booking' } },
        { status: 400 }
      )
    }

    // Calculate charge amount based on payment type
    let chargeAmount = amount
    const totalAmount = amount

    if (paymentType === 'deposit' && depositPercentage) {
      chargeAmount = Math.round(amount * (depositPercentage / 100))
    } else if (paymentType === 'split' && splitInstallments) {
      const installments = parseInt(splitInstallments as string, 10)
      chargeAmount = Math.round(amount / installments)
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        booking_id: bookingId,
        attorney_id: attorneyId,
        user_id: user.id,
        payment_type: paymentType,
        total_amount: totalAmount.toString(),
      },
      description: description || `Payment for consultation #${bookingId.slice(0, 8)}`,
      receipt_email: user.email || undefined,
    })

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: chargeAmount,
      totalAmount,
    })
  } catch (error) {
    logger.error('[api/payments/intent] PaymentIntent creation failed', {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create payment intent' } },
      { status: 500 }
    )
  }
}
