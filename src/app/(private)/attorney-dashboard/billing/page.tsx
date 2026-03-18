'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Crown,
  Star,
  Zap,
  Check,
  ArrowUpRight,
} from 'lucide-react'
import AttorneySidebar from '@/components/attorney-dashboard/AttorneySidebar'
import BillingCard from '@/components/attorney-dashboard/BillingCard'
import InvoiceTable from '@/components/attorney-dashboard/InvoiceTable'
import Breadcrumb from '@/components/Breadcrumb'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlanInfo {
  id: string
  name: string
  price: number
  features: readonly string[]
}

interface Subscription {
  id: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  trialStart: string | null
  trialEnd: string | null
  planName: string
  planPrice: number
  interval: string | null
}

interface Usage {
  leadsUsed: number
  leadsLimit: number
  leadsRemaining: number
  profileViews: number
  totalCostUsd: number
  breakdown: Record<string, { count: number; totalCents: number; totalUsd: number }>
}

interface PaymentMethodInfo {
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

interface Invoice {
  id: string
  number: string | null
  amount: number
  currency: string
  status: string | null
  pdfUrl: string | null
  description: string | null
  created: string
}

interface BillingData {
  plan: PlanInfo
  subscription: Subscription | null
  usage: Usage
  invoices: Invoice[]
  paymentMethod: PaymentMethodInfo | null
  memberSince: string | null
  isVerified: boolean
}

interface FetchError {
  status: number
  message?: string
}

// ─── Fetcher ─────────────────────────────────────────────────────────────────

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error: FetchError = { status: res.status }
    try {
      const data = await res.json()
      error.message = data.error?.message || data.error || 'Failed to fetch'
    } catch {
      error.message = 'Failed to fetch billing data'
    }
    throw error
  }
  const json = await res.json()
  return json.data as BillingData
}

// ─── Plan Comparison Data ────────────────────────────────────────────────────

const PLANS_DISPLAY = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Get started with basic features',
    icon: Zap,
    gradient: 'from-gray-500 to-gray-600',
    borderColor: 'border-gray-200 dark:border-gray-700',
    features: [
      'Basic profile listing',
      '5 leads per month',
      'Standard messaging',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    description: 'Everything you need to grow',
    icon: Star,
    gradient: 'from-blue-500 to-indigo-600',
    borderColor: 'border-blue-300 dark:border-blue-700',
    popular: true,
    features: [
      'Enhanced profile + badge',
      '50 leads per month',
      'Priority messaging',
      'Basic statistics',
      'Priority support',
      'Calendar integration',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 99,
    description: 'Maximum visibility and unlimited leads',
    icon: Crown,
    gradient: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-300 dark:border-amber-700',
    features: [
      'Premium profile + badge',
      'Unlimited leads',
      'Priority placement in search',
      'Advanced analytics',
      'Dedicated 24/7 support',
      'Free training sessions',
      'Video consultation tools',
      'Custom branding',
    ],
  },
]

// ─── Main Component ──────────────────────────────────────────────────────────

export default function BillingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reducedMotion = useReducedMotion()

  const [isUpgrading, setIsUpgrading] = useState(false)
  const [isManaging, setIsManaging] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const { data, error, isLoading, mutate } = useSWR<BillingData, FetchError>(
    '/api/attorney/billing/portal',
    fetcher,
    { revalidateOnFocus: false }
  )

  // Handle success/cancel query params from Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    const plan = searchParams.get('plan')

    if (success === 'true') {
      setToast({
        type: 'success',
        message: plan
          ? `Successfully subscribed to the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan!`
          : 'Subscription updated successfully!',
      })
      // Remove query params
      router.replace('/attorney-dashboard/billing', { scroll: false })
      // Refresh data
      mutate()
    } else if (canceled === 'true') {
      setToast({ type: 'error', message: 'Checkout was cancelled.' })
      router.replace('/attorney-dashboard/billing', { scroll: false })
    }
  }, [searchParams, router, mutate])

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleUpgrade = useCallback(async (planId: string) => {
    setIsUpgrading(true)
    try {
      const res = await fetch('/api/attorney/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      })
      const json = await res.json()

      if (!res.ok) {
        setToast({ type: 'error', message: json.error?.message || json.error || 'Failed to upgrade' })
        return
      }

      if (json.data?.type === 'checkout' && json.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = json.data.url
        return
      }

      if (json.data?.type === 'upgrade') {
        setToast({ type: 'success', message: json.data.message || 'Plan updated successfully!' })
        mutate()
      }
    } catch {
      setToast({ type: 'error', message: 'Something went wrong. Please try again.' })
    } finally {
      setIsUpgrading(false)
    }
  }, [mutate])

  const handleManageBilling = useCallback(async () => {
    setIsManaging(true)
    try {
      const res = await fetch('/api/stripe/create-portal', { method: 'POST' })
      const json = await res.json()

      if (!res.ok) {
        setToast({ type: 'error', message: json.error || 'Failed to open billing portal' })
        return
      }

      if (json.url) {
        window.location.href = json.url
      }
    } catch {
      setToast({ type: 'error', message: 'Something went wrong. Please try again.' })
    } finally {
      setIsManaging(false)
    }
  }, [])

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/attorney-dashboard/dashboard' },
            { label: 'Billing' },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-4">
          <AttorneySidebar activePage="subscription" />

          <div className="lg:col-span-3 space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Billing & Subscription
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your subscription plan, view invoices, and update payment methods.
              </p>
            </div>

            {/* Toast Notification */}
            {toast && (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                  toast.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                    : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                }`}
                role="alert"
              >
                {toast.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                {toast.message}
                <button
                  onClick={() => setToast(null)}
                  className="ml-auto text-current opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current rounded"
                  aria-label="Dismiss notification"
                >
                  &times;
                </button>
              </motion.div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" aria-hidden="true" />
                <span className="sr-only">Loading billing data...</span>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Failed to load billing data
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {error.message || 'Please try again later.'}
                </p>
                <button
                  onClick={() => mutate()}
                  className="mt-3 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Main Content */}
            {data && !isLoading && (
              <>
                {/* Billing Card (plan, trial, usage, payment method) */}
                <BillingCard
                  plan={data.plan}
                  subscription={data.subscription}
                  usage={data.usage}
                  paymentMethod={data.paymentMethod}
                  onUpgrade={handleUpgrade}
                  onManageBilling={handleManageBilling}
                  isUpgrading={isUpgrading}
                  isManaging={isManaging}
                />

                {/* Plan Comparison */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Compare Plans
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PLANS_DISPLAY.map((plan, index) => {
                      const isCurrent = data.plan.id === plan.id
                      const PlanIcon = plan.icon
                      return (
                        <motion.div
                          key={plan.id}
                          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={
                            reducedMotion
                              ? { duration: 0 }
                              : { delay: 0.1 * index, duration: 0.4 }
                          }
                          className={`relative bg-white dark:bg-gray-900 rounded-xl border-2 p-5 transition-shadow ${
                            isCurrent
                              ? plan.borderColor + ' shadow-md'
                              : 'border-gray-200 dark:border-gray-800 hover:shadow-md'
                          }`}
                        >
                          {plan.popular && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
                              Most Popular
                            </span>
                          )}
                          {isCurrent && (
                            <span className="absolute -top-3 right-4 px-3 py-0.5 bg-green-600 text-white text-xs font-semibold rounded-full">
                              Current Plan
                            </span>
                          )}

                          <div className="flex items-center gap-2 mb-3 mt-1">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${plan.gradient} text-white`}>
                              <PlanIcon className="w-4 h-4" aria-hidden="true" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              {plan.name}
                            </h3>
                          </div>

                          <div className="mb-3">
                            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                              ${plan.price}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">/month</span>
                          </div>

                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {plan.description}
                          </p>

                          <ul className="space-y-2 mb-5" aria-label={`${plan.name} plan features`}>
                            {plan.features.map((feature) => (
                              <li key={feature} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" aria-hidden="true" />
                                {feature}
                              </li>
                            ))}
                          </ul>

                          {isCurrent ? (
                            <button
                              disabled
                              className="w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
                              aria-label="Current plan"
                            >
                              Current Plan
                            </button>
                          ) : plan.price > (data.plan.price || 0) ? (
                            <button
                              onClick={() => handleUpgrade(plan.id)}
                              disabled={isUpgrading}
                              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex items-center justify-center gap-2"
                            >
                              {isUpgrading ? (
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                              )}
                              Upgrade to {plan.name}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpgrade(plan.id)}
                              disabled={isUpgrading || plan.id === 'free'}
                              className="w-full py-2.5 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                            >
                              {plan.id === 'free' ? 'Free Plan' : `Switch to ${plan.name}`}
                            </button>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* Invoice History */}
                <InvoiceTable invoices={data.invoices} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
