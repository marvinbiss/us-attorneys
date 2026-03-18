import Stripe from 'stripe'

// Lazy initialize Stripe to avoid build-time errors
let stripeInstance: Stripe | null = null

function getStripeInstance(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    })
  }
  return stripeInstance
}

// Export getter function instead of direct instance
export const stripe = new Proxy({} as Stripe, {
  get(_, prop: keyof Stripe) {
    return getStripeInstance()[prop]
  }
})

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      'Basic profile listing',
      '5 leads/month',
      'Client messaging',
      'Email notifications',
    ],
    limits: {
      leadsPerMonth: 5,
      photos: 3,
      priority: 0,
      priorityBoost: 1.0,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 99,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      'Enhanced profile with photo & bio',
      '50 leads/month',
      '2x search priority boost',
      'Priority badge',
      'Analytics dashboard',
      'Review solicitation tools',
      'Priority support',
    ],
    limits: {
      leadsPerMonth: 50,
      photos: 20,
      priority: 1,
      priorityBoost: 2.0,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 199,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    features: [
      'Premium profile with video intro',
      'Unlimited leads',
      '5x search priority boost',
      'Premium verified badge',
      'Featured search placement',
      'Advanced analytics & competitor insights',
      'Dedicated account manager',
      'Custom intake forms',
      '24/7 priority support',
    ],
    limits: {
      leadsPerMonth: -1, // unlimited
      photos: 50,
      priority: 2,
      priorityBoost: 5.0,
    },
  },
} as const

export type PlanId = keyof typeof PLANS
