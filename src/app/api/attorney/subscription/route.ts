/**
 * Attorney Subscription API
 * GET: Fetch current subscription info + member date
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { requireAttorney } from '@/lib/auth/attorney-guard'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await requireAttorney()
    if (result.error) return result.error

    const { user, supabase } = result

    // Fetch provider claimed_at for "Membre depuis"
    const { data: provider } = await supabase
      .from('attorneys')
      .select('id, claimed_at, created_at, is_verified, name')
      .eq('user_id', user.id)
      .single()

    const memberSince = provider?.claimed_at ?? provider?.created_at ?? null

    const hasUpgradePlans = !!(
      process.env.STRIPE_PRO_PRICE_ID && process.env.STRIPE_PREMIUM_PRICE_ID
    )

    return NextResponse.json({
      subscription: null,
      plan: 'free',
      memberSince,
      isVerified: provider?.is_verified ?? false,
      attorneyName: provider?.name ?? null,
      hasUpgradePlans,
    })
  } catch (error: unknown) {
    logger.error('Subscription GET error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
