import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const revalidate = 3600 // Cache for 1 hour

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Count quote requests in the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

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
  } catch (error) {
    logger.error('Social proof API error', error)
    // Fallback values so the banner always renders
    return NextResponse.json({
      requestsThisMonth: 150,
      activeProviders: 500,
      updatedAt: new Date().toISOString(),
    })
  }
}
