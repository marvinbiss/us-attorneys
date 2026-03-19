/**
 * POST /api/stripe/create-portal
 * Creates a Stripe Customer Portal session for managing billing.
 * Allows attorneys to update payment methods, view invoices, cancel subscription.
 */

import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Verify the authenticated user has an attorney profile (ownership check)
    const { data: attorneyProfile } = await admin
      .from('attorneys')
      .select('id, user_id')
      .eq('user_id', user.id)
      .single()

    if (!attorneyProfile) {
      return NextResponse.json(
        { error: 'No attorney profile found. Only verified attorneys can manage billing.' },
        { status: 403 }
      )
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe to a plan first.' },
        { status: 404 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl}/attorney-dashboard/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    logger.error('Stripe portal session error:', error)
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
}
