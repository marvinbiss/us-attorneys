import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

// PATCH request schema
const changeSubscriptionSchema = z.object({
  newPlan: z.enum(['pro', 'premium']),
  proration: z.enum(['create_prorations', 'none', 'always_invoice']).optional().default('create_prorations'),
})

export const dynamic = 'force-dynamic'

// GET - Subscription details
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin with payments:read permission
    const authResult = await requirePermission('payments', 'read')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    if (!isValidUuid(params.id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    // The subscriptions table doesn't exist in public schema.
    // Try to fetch from Stripe directly if configured.
    try {
      const { getSubscription } = await import('@/lib/stripe-admin')
      const subscription = await getSubscription(params.id)
      return NextResponse.json({
        success: true,
        subscription,
      })
    } catch {
      logger.warn('Stripe not configured or subscription not found')
      return NextResponse.json(
        { success: false, error: { message: 'Stripe subscriptions not available. Check STRIPE_SECRET_KEY configuration.' } },
        { status: 503 }
      )
    }
  } catch (error) {
    logger.error('Admin subscription details error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}

// PATCH - Update a subscription (change plan)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin with payments:write permission (changing plans)
    const authResult = await requirePermission('payments', 'write')
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
    const validation = changeSubscriptionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Validation error', details: validation.error.flatten() } },
        { status: 400 }
      )
    }
    const { newPlan, proration } = validation.data

    // Try to change the plan via Stripe
    try {
      const { changeSubscriptionPlan, PRICE_IDS } = await import('@/lib/stripe-admin')

      // Determine the price ID
      const newPriceId = newPlan === 'pro' ? PRICE_IDS.pro : PRICE_IDS.premium

      if (!newPriceId) {
        return NextResponse.json(
          { success: false, error: { message: 'Missing Stripe configuration for this plan' } },
          { status: 500 }
        )
      }

      const result = await changeSubscriptionPlan(
        params.id,
        newPriceId,
        proration as 'create_prorations' | 'none' | 'always_invoice'
      )

      // Audit log
      await logAdminAction(
        authResult.admin.id,
        'subscription.change_plan',
        'subscription',
        params.id,
        { newPlan, newPriceId }
      )

      return NextResponse.json({
        success: true,
        result,
        message: `Plan changed to ${newPlan}`,
      })
    } catch (stripeError) {
      logger.error('Stripe subscription change failed', stripeError)
      return NextResponse.json(
        { success: false, error: { message: 'Stripe not configured or error changing plan' } },
        { status: 503 }
      )
    }
  } catch (error) {
    logger.error('Admin subscription change error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error changing plan' } },
      { status: 500 }
    )
  }
}
