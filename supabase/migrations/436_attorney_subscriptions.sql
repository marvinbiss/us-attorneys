-- ============================================================================
-- Migration 436: Attorney Subscription Plans (Doctolib B2B SaaS model)
-- Monetization engine: attorneys pay $99-199/mo for premium placement & leads
-- ============================================================================

-- ============================================================================
-- 1. subscription_plans table
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT,  -- NULL for free plan
  price_monthly  INTEGER NOT NULL DEFAULT 0,  -- cents
  price_yearly   INTEGER NOT NULL DEFAULT 0,  -- cents (annual billing)
  features       JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_leads_per_month INTEGER NOT NULL DEFAULT 5,
  priority_boost NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can read active plans (public pricing page)
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- Admins can manage plans
CREATE POLICY "Admins can manage subscription plans"
  ON subscription_plans FOR ALL
  USING (is_admin());

-- ============================================================================
-- 2. Seed 3 plans: Free / Pro / Premium
-- ============================================================================
INSERT INTO subscription_plans (name, slug, stripe_price_id, price_monthly, price_yearly, features, max_leads_per_month, priority_boost, is_active)
VALUES
  (
    'Free',
    'free',
    NULL,
    0,
    0,
    '["Basic profile listing", "Up to 5 leads per month", "Standard search placement", "Email notifications", "Client messaging"]'::jsonb,
    5,
    1.0,
    true
  ),
  (
    'Pro',
    'pro',
    NULL, -- Set via UPDATE after creating Stripe price: UPDATE subscription_plans SET stripe_price_id='price_xxx' WHERE slug='pro';
    9900,
    95000,  -- $950/year (~20% discount)
    '["Enhanced profile with photo & bio", "Up to 50 leads per month", "2x search priority boost", "Priority badge on profile", "Detailed analytics dashboard", "Priority email & chat support", "Client review solicitation tools", "Monthly performance reports"]'::jsonb,
    50,
    2.0,
    true
  ),
  (
    'Premium',
    'premium',
    NULL, -- Set via UPDATE after creating Stripe price: UPDATE subscription_plans SET stripe_price_id='price_xxx' WHERE slug='premium';
    19900,
    190000,  -- $1,900/year (~20% discount)
    '["Premium profile with video intro", "Unlimited leads per month", "5x search priority boost", "Premium verified badge", "Featured placement in search results", "Advanced analytics & competitor insights", "Dedicated account manager", "Priority placement in directory", "Custom intake forms", "Monthly ROI reports", "24/7 priority support"]'::jsonb,
    -1,  -- -1 = unlimited
    5.0,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 3. Add subscription columns to attorneys table
-- ============================================================================
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free'
  CHECK (subscription_tier IN ('free', 'pro', 'premium'));

ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Indexes for subscription queries
CREATE INDEX IF NOT EXISTS idx_attorneys_subscription_tier ON attorneys(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_attorneys_stripe_sub ON attorneys(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attorneys_stripe_customer ON attorneys(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- ============================================================================
-- 4. lead_usage table — track monthly lead consumption per attorney
-- ============================================================================
CREATE TABLE IF NOT EXISTS lead_usage (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  month       DATE NOT NULL,  -- First day of the month (e.g., 2026-03-01)
  lead_count  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_lead_usage_attorney_month UNIQUE (attorney_id, month)
);

CREATE INDEX idx_lead_usage_attorney ON lead_usage(attorney_id, month DESC);

-- RLS
ALTER TABLE lead_usage ENABLE ROW LEVEL SECURITY;

-- Attorneys can view their own usage
CREATE POLICY "Attorneys can view own lead usage"
  ON lead_usage FOR SELECT
  USING (
    attorney_id IN (
      SELECT id FROM attorneys WHERE user_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can manage lead usage"
  ON lead_usage FOR ALL
  USING (is_admin());

-- ============================================================================
-- 5. Update profiles.subscription_plan CHECK to include 'free' (migration 309 used 'gratuit')
-- ============================================================================
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_plan_check
  CHECK (subscription_plan IN ('gratuit', 'free', 'pro', 'premium'));

-- Migrate existing 'gratuit' values to 'free'
UPDATE profiles SET subscription_plan = 'free' WHERE subscription_plan = 'gratuit';

-- ============================================================================
-- 6. Comments
-- ============================================================================
COMMENT ON TABLE subscription_plans IS 'Attorney subscription tiers (Free/Pro/Premium) with Stripe integration';
COMMENT ON TABLE lead_usage IS 'Monthly lead consumption tracking per attorney for plan enforcement';
COMMENT ON COLUMN subscription_plans.max_leads_per_month IS '-1 means unlimited';
COMMENT ON COLUMN subscription_plans.priority_boost IS 'Multiplier for search ranking (1.0=normal, 2.0=double, 5.0=5x)';
COMMENT ON COLUMN attorneys.subscription_tier IS 'Current subscription level: free, pro, or premium';
COMMENT ON COLUMN attorneys.subscription_ends_at IS 'When current billing period ends (NULL if free or never subscribed)';
