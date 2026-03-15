import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin-auth'
import { z } from 'zod'

// GET query params schema
const subscriptionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  filter: z.enum(['all', 'active', 'past_due', 'canceled']).optional().default('all'),
})

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify admin with payments:read permission
    const authResult = await requirePermission('payments', 'read')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      filter: searchParams.get('filter') || 'all',
    }
    const result = subscriptionsQuerySchema.safeParse(queryParams)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid parameters', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { page } = result.data

    // The subscriptions table does not exist in the public schema.
    // Return empty data gracefully so the admin UI does not crash.
    const stats = {
      totalRevenue: 0,
      activeSubscriptions: 0,
      premiumCount: 0,
      basicCount: 0,
      freeCount: 0,
      churnRate: 0,
    }

    return NextResponse.json({
      success: true,
      subscriptions: [],
      stats,
      total: 0,
      page,
      totalPages: 0,
    })
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
