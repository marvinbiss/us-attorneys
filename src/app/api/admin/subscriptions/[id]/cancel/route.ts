import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

// POST request schema
const cancelSubscriptionSchema = z.object({
  action: z.enum(['cancel', 'reactivate']),
  immediately: z.boolean().optional().default(false),
})

export const dynamic = 'force-dynamic'

// POST - Cancel or reactivate a subscription
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin with payments:cancel permission
    const authResult = await requirePermission('payments', 'cancel')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    if (!isValidUuid(params.id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    const body = await request.json()
    const result = cancelSubscriptionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Validation error', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { action, immediately } = result.data

    // Try Stripe operations via dynamic import to handle missing STRIPE_SECRET_KEY
    let stripeResult
    try {
      if (action === 'cancel') {
        const { cancelSubscription } = await import('@/lib/stripe-admin')
        stripeResult = await cancelSubscription(params.id, immediately)
      } else {
        const { reactivateSubscription } = await import('@/lib/stripe-admin')
        stripeResult = await reactivateSubscription(params.id)
      }
    } catch (stripeError) {
      logger.error('Stripe subscription operation failed', stripeError)
      return NextResponse.json(
        { success: false, error: { message: 'Stripe not configured or error during operation' } },
        { status: 503 }
      )
    }

    // Audit log
    await logAdminAction(
      authResult.admin.id,
      `subscription.${action}`,
      'subscription',
      params.id,
      { action, immediately }
    )

    return NextResponse.json({
      success: true,
      result: stripeResult,
      message: action === 'cancel' ? 'Subscription cancelled' : 'Subscription reactivated',
    })
  } catch (error) {
    logger.error('Admin subscription cancel error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
