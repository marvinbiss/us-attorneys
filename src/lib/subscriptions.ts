/**
 * Attorney Subscription System
 * Core monetization logic: plan management, feature gating, lead tracking.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { getCachedData } from '@/lib/cache'

// ─── Types ───────────────────────────────────────────────────────────

export interface SubscriptionPlan {
  id: string
  name: string
  slug: 'free' | 'pro' | 'premium'
  stripe_price_id: string | null
  price_monthly: number  // cents
  price_yearly: number   // cents
  features: string[]
  max_leads_per_month: number  // -1 = unlimited
  priority_boost: number
  is_active: boolean
}

export interface AttorneySubscription {
  tier: 'free' | 'pro' | 'premium'
  plan: SubscriptionPlan | null
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  subscription_started_at: string | null
  subscription_ends_at: string | null
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none'
}

export type SubscriptionFeature =
  | 'enhanced_profile'
  | 'video_intro'
  | 'priority_badge'
  | 'premium_badge'
  | 'analytics_dashboard'
  | 'advanced_analytics'
  | 'priority_support'
  | 'dedicated_manager'
  | 'review_solicitation'
  | 'custom_intake_forms'
  | 'featured_placement'
  | 'competitor_insights'
  | 'unlimited_leads'

/**
 * Feature access matrix: which tier unlocks which features
 */
const FEATURE_MATRIX: Record<SubscriptionFeature, ('free' | 'pro' | 'premium')[]> = {
  enhanced_profile:    ['pro', 'premium'],
  video_intro:         ['premium'],
  priority_badge:      ['pro', 'premium'],
  premium_badge:       ['premium'],
  analytics_dashboard: ['pro', 'premium'],
  advanced_analytics:  ['premium'],
  priority_support:    ['pro', 'premium'],
  dedicated_manager:   ['premium'],
  review_solicitation: ['pro', 'premium'],
  custom_intake_forms: ['premium'],
  featured_placement:  ['premium'],
  competitor_insights: ['premium'],
  unlimited_leads:     ['premium'],
}

// ─── Plan Queries ────────────────────────────────────────────────────

/**
 * Fetch all active subscription plans, cached for 1 hour
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return getCachedData(
    'subscription_plans:active',
    async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true })

      if (error) {
        logger.error('Failed to fetch subscription plans', error)
        return getDefaultPlans()
      }

      return (data || []) as SubscriptionPlan[]
    },
    3600 // 1 hour cache
  )
}

/**
 * Get a specific plan by slug
 */
export async function getPlanBySlug(slug: string): Promise<SubscriptionPlan | null> {
  const plans = await getSubscriptionPlans()
  return plans.find(p => p.slug === slug) || null
}

// ─── Attorney Subscription ──────────────────────────────────────────

/**
 * Get an attorney's current subscription status
 */
export async function getAttorneySubscription(attorneyId: string): Promise<AttorneySubscription> {
  const supabase = createAdminClient()

  const { data: attorney, error } = await supabase
    .from('attorneys')
    .select('subscription_tier, stripe_subscription_id, stripe_customer_id, subscription_started_at, subscription_ends_at')
    .eq('id', attorneyId)
    .single()

  if (error || !attorney) {
    logger.error(`Failed to fetch subscription for attorney ${attorneyId}`, error)
    return {
      tier: 'free',
      plan: null,
      stripe_subscription_id: null,
      stripe_customer_id: null,
      subscription_started_at: null,
      subscription_ends_at: null,
      status: 'none',
    }
  }

  const tier = (attorney.subscription_tier || 'free') as 'free' | 'pro' | 'premium'
  const plan = await getPlanBySlug(tier)

  // Determine status
  let status: AttorneySubscription['status'] = 'none'
  if (tier === 'free') {
    status = 'none'
  } else if (attorney.subscription_ends_at) {
    const endsAt = new Date(attorney.subscription_ends_at)
    status = endsAt > new Date() ? 'active' : 'canceled'
  } else if (attorney.stripe_subscription_id) {
    status = 'active'
  }

  return {
    tier,
    plan,
    stripe_subscription_id: attorney.stripe_subscription_id,
    stripe_customer_id: attorney.stripe_customer_id,
    subscription_started_at: attorney.subscription_started_at,
    subscription_ends_at: attorney.subscription_ends_at,
    status,
  }
}

// ─── Feature Gating ──────────────────────────────────────────────────

/**
 * Check if an attorney can access a specific feature based on their tier
 */
export async function canAccessFeature(
  attorneyId: string,
  feature: SubscriptionFeature
): Promise<boolean> {
  const subscription = await getAttorneySubscription(attorneyId)
  const allowedTiers = FEATURE_MATRIX[feature]

  if (!allowedTiers) {
    logger.warn(`Unknown feature: ${feature}`)
    return false
  }

  return allowedTiers.includes(subscription.tier)
}

/**
 * Synchronous feature check when you already have the tier
 */
export function canTierAccessFeature(
  tier: 'free' | 'pro' | 'premium',
  feature: SubscriptionFeature
): boolean {
  const allowedTiers = FEATURE_MATRIX[feature]
  return allowedTiers ? allowedTiers.includes(tier) : false
}

// ─── Lead Usage Tracking ─────────────────────────────────────────────

/**
 * Get remaining leads for an attorney this month
 * Returns { used, limit, remaining } — limit=-1 means unlimited
 */
export async function getRemainingLeads(attorneyId: string): Promise<{
  used: number
  limit: number
  remaining: number
  isUnlimited: boolean
}> {
  const supabase = createAdminClient()

  // Get attorney's subscription tier
  const { data: attorney } = await supabase
    .from('attorneys')
    .select('subscription_tier')
    .eq('id', attorneyId)
    .single()

  const tier = (attorney?.subscription_tier || 'free') as string

  // Get plan limits
  const plan = await getPlanBySlug(tier)
  const limit = plan?.max_leads_per_month ?? 5

  if (limit === -1) {
    return { used: 0, limit: -1, remaining: -1, isUnlimited: true }
  }

  // Get current month usage
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]

  const { data: usage } = await supabase
    .from('lead_usage')
    .select('lead_count')
    .eq('attorney_id', attorneyId)
    .eq('month', monthStart)
    .single()

  const used = usage?.lead_count ?? 0
  const remaining = Math.max(0, limit - used)

  return { used, limit, remaining, isUnlimited: false }
}

/**
 * Increment lead usage for an attorney (called when a lead is dispatched)
 * Returns false if the attorney has exceeded their monthly limit
 */
export async function incrementLeadUsage(attorneyId: string): Promise<{
  success: boolean
  used: number
  limit: number
}> {
  const { used, limit, isUnlimited } = await getRemainingLeads(attorneyId)

  if (isUnlimited) {
    await upsertLeadCount(attorneyId, used + 1)
    return { success: true, used: used + 1, limit: -1 }
  }

  if (used >= limit) {
    return { success: false, used, limit }
  }

  await upsertLeadCount(attorneyId, used + 1)
  return { success: true, used: used + 1, limit }
}

async function upsertLeadCount(attorneyId: string, newCount: number): Promise<void> {
  const supabase = createAdminClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]

  const { error } = await supabase
    .from('lead_usage')
    .upsert(
      {
        attorney_id: attorneyId,
        month: monthStart,
        lead_count: newCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'attorney_id,month' }
    )

  if (error) {
    logger.error(`Failed to update lead usage for attorney ${attorneyId}`, error)
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Default plans used as fallback when DB is unreachable
 */
function getDefaultPlans(): SubscriptionPlan[] {
  return [
    {
      id: 'default-free',
      name: 'Free',
      slug: 'free',
      stripe_price_id: null,
      price_monthly: 0,
      price_yearly: 0,
      features: ['Basic profile listing', 'Up to 5 leads per month', 'Standard search placement', 'Email notifications', 'Client messaging'],
      max_leads_per_month: 5,
      priority_boost: 1.0,
      is_active: true,
    },
    {
      id: 'default-pro',
      name: 'Pro',
      slug: 'pro',
      stripe_price_id: null,
      price_monthly: 9900,
      price_yearly: 95000,
      features: ['Enhanced profile with photo & bio', 'Up to 50 leads per month', '2x search priority boost', 'Priority badge on profile', 'Detailed analytics dashboard', 'Priority email & chat support', 'Client review solicitation tools', 'Monthly performance reports'],
      max_leads_per_month: 50,
      priority_boost: 2.0,
      is_active: true,
    },
    {
      id: 'default-premium',
      name: 'Premium',
      slug: 'premium',
      stripe_price_id: null,
      price_monthly: 19900,
      price_yearly: 190000,
      features: ['Premium profile with video intro', 'Unlimited leads per month', '5x search priority boost', 'Premium verified badge', 'Featured placement in search results', 'Advanced analytics & competitor insights', 'Dedicated account manager', 'Priority placement in directory', 'Custom intake forms', 'Monthly ROI reports', '24/7 priority support'],
      max_leads_per_month: -1,
      priority_boost: 5.0,
      is_active: true,
    },
  ]
}

/**
 * Format price in cents to display string
 */
export function formatPrice(cents: number): string {
  if (cents === 0) return 'Free'
  return `$${(cents / 100).toFixed(0)}`
}

/**
 * Get the priority boost for an attorney's tier (for search ranking)
 */
export async function getAttorneyPriorityBoost(attorneyId: string): Promise<number> {
  const subscription = await getAttorneySubscription(attorneyId)
  return subscription.plan?.priority_boost ?? 1.0
}
