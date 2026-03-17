import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

// POST request schema
const refundSchema = z.object({
  amount: z.number().int().positive().max(10000000).optional(), // optional = full refund
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional(),
})

// POST - Traiter un remboursement
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin with payments:refund permission
    const authResult = await requirePermission('payments', 'refund')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    if (!isValidUuid(params.id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    const paymentIntentId = params.id
    const body = await request.json()
    const result = refundSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Validation error', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { amount, reason } = result.data

    // Traiter le remboursement via Stripe (dynamic import to handle missing STRIPE_SECRET_KEY)
    let refund
    try {
      const { processRefund } = await import('@/lib/stripe-admin')
      refund = await processRefund(
        paymentIntentId,
        amount, // undefined = remboursement total
        reason as 'duplicate' | 'fraudulent' | 'requested_by_customer'
      )
    } catch (stripeError) {
      logger.error('Stripe refund failed', stripeError)
      return NextResponse.json(
        { success: false, error: { message: 'Stripe not configured or error during refund' } },
        { status: 503 }
      )
    }

    // Record in audit logs
    await logAdminAction(
      authResult.admin.id,
      'payment.refund',
      'payment',
      paymentIntentId,
      { refund_id: refund.id, amount: refund.amount, reason }
    )

    return NextResponse.json({
      success: true,
      refund,
      message: 'Refund processed successfully',
    })
  } catch (error) {
    logger.error('Admin refund error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error during refund' } },
      { status: 500 }
    )
  }
}
