import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createApiHandler } from '@/lib/api/handler'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

export const revalidate = 3600 // Cache for 1 hour

export const GET = createApiHandler(async ({ request }) => {
  const rateLimitResult = await rateLimit(request, RATE_LIMITS.api)
  if (!rateLimitResult.success) {
    return NextResponse.json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } }, { status: 429 })
  }

  // adminClient justified: public endpoint, no user session — RLS would block anonymous reads
  const supabase = createAdminClient()

  // Count quote requests in the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Table 'devis_requests' = consultation requests (legacy French name)
  const { count: monthlyDevis } = await supabase
    .from('devis_requests')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Count active providers
  const { count: activeProviders } = await supabase
    .from('attorneys')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Minimum display values for credibility
  const devisCount = Math.max(monthlyDevis || 0, 50)
  const attorneyCount = activeProviders || 0

  return NextResponse.json({
    requestsThisMonth: devisCount,
    activeProviders: attorneyCount,
    updatedAt: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}, {})
