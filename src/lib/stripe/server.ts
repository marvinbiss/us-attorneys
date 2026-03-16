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
      'Basic profile',
      '5 requests/month',
      'Messaging',
      'Email support',
    ],
    limits: {
      requestsPerMonth: 5,
      photos: 3,
      priority: 0,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 49,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      'Full profile',
      '30 requests/month',
      'Priority messaging',
      'Listed badge',
      'Basic statistics',
      'Priority support',
    ],
    limits: {
      requestsPerMonth: 30,
      photos: 10,
      priority: 1,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 99,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    features: [
      'Premium profile',
      'Unlimited requests',
      'Priority messaging',
      'Premium badge',
      'Priority placement',
      'Advanced statistics',
      'Dedicated 24/7 support',
      'Free training',
    ],
    limits: {
      requestsPerMonth: -1, // unlimited
      photos: 50,
      priority: 2,
    },
  },
} as const

export type PlanId = keyof typeof PLANS
