import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { createApiHandler } from '@/lib/api/handler'

// GET query params schema
const paymentsQuerySchema = z.object({
  type: z.enum(['overview', 'subscriptions']).optional().default('overview'),
  status: z.enum(['all', 'active', 'canceled', 'past_due']).optional().default('all'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  cursor: z.string().max(100).optional(),
})

export const dynamic = 'force-dynamic'

// GET - Statistiques et liste des paiements
export const GET = createApiHandler(async ({ request }) => {
  // Verify admin with payments:read permission
  const authResult = await requirePermission('payments', 'read')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  const supabase = createAdminClient()

  const searchParams = new URL(request.url).searchParams
  const queryParams = {
    type: searchParams.get('type') || 'overview',
    status: searchParams.get('status') || 'all',
    limit: searchParams.get('limit') || '20',
    cursor: searchParams.get('cursor') || undefined,
  }
  const result = paymentsQuerySchema.safeParse(queryParams)
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid parameters', details: result.error.flatten() } },
      { status: 400 }
    )
  }
  const { type, status, limit } = result.data

  if (type === 'overview') {
    // Try to get Stripe revenue stats, fall back to mock data
    let stats = {
      totalRevenue: 0,
      totalRefunded: 0,
      netRevenue: 0,
      chargesCount: 0,
      refundsCount: 0,
      period: '30 derniers jours',
    }
    try {
      const { getRevenueStats } = await import('@/lib/stripe-admin')
      stats = await getRevenueStats(30)
    } catch {
      logger.warn('Stripe not configured or unavailable, using default stats')
    }

    // Try to count users (profiles table should always exist)
    let totalUsers = 0
    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      totalUsers = count || 0
    } catch {
      logger.warn('Could not count profiles')
    }

    // Try to count active subscriptions via providers table
    let activeSubscriptions = 0
    try {
      const { count } = await supabase
        .from('attorneys')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      activeSubscriptions = count || 0
    } catch {
      logger.warn('Could not count active providers')
    }

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        activeSubscriptions,
        totalUsers,
      },
    })
  }

  if (type === 'subscriptions') {
    // Try to list Stripe subscriptions, fall back to empty list
    try {
      const { listAllSubscriptions } = await import('@/lib/stripe-admin')
      const subscriptions = await listAllSubscriptions(
        limit,
        undefined,
        status as 'active' | 'canceled' | 'past_due' | 'all'
      )

      // Enrich with user data (use email from Stripe since profiles may not have stripe_customer_id)
      const enrichedData = (subscriptions?.data ?? []).map((sub) => ({
        ...sub,
        userId: null,
        userName: null,
        userEmail: sub.customerEmail,
      }))

      return NextResponse.json({
        success: true,
        subscriptions: enrichedData,
        hasMore: subscriptions.hasMore,
      })
    } catch {
      logger.warn('Stripe not configured, returning empty subscriptions list')
      return NextResponse.json({
        success: true,
        subscriptions: [],
        hasMore: false,
      })
    }
  }

  return NextResponse.json({
    success: false,
    error: { message: 'Invalid type' },
  }, { status: 400 })
})
