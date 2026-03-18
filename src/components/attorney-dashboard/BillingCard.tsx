'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  CreditCard,
  Crown,
  Zap,
  Star,
  ArrowUpRight,
  Settings,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
} from 'lucide-react'

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
}

interface PaymentMethodInfo {
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

interface BillingCardProps {
  plan: PlanInfo
  subscription: Subscription | null
  usage: Usage
  paymentMethod: PaymentMethodInfo | null
  onUpgrade: (planId: string) => void
  onManageBilling: () => void
  isUpgrading: boolean
  isManaging: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusConfig(status: string, cancelAtPeriodEnd: boolean) {
  if (cancelAtPeriodEnd) {
    return {
      label: 'Cancelling',
      icon: XCircle,
      classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    }
  }
  const map: Record<string, { label: string; icon: typeof CheckCircle; classes: string }> = {
    active: {
      label: 'Active',
      icon: CheckCircle,
      classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    trialing: {
      label: 'Trial',
      icon: Clock,
      classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    past_due: {
      label: 'Past Due',
      icon: AlertTriangle,
      classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
    canceled: {
      label: 'Cancelled',
      icon: XCircle,
      classes: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    },
    incomplete: {
      label: 'Incomplete',
      icon: AlertTriangle,
      classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
  }
  return map[status] || { label: status, icon: Clock, classes: 'bg-gray-100 text-gray-600' }
}

const tierGradients: Record<string, string> = {
  free: 'from-gray-500 to-gray-700',
  pro: 'from-blue-500 to-indigo-600',
  premium: 'from-amber-500 to-orange-600',
}

const tierIcons: Record<string, typeof Star> = {
  free: Zap,
  pro: Star,
  premium: Crown,
}

function getTrialDaysLeft(trialEnd: string | null): number | null {
  if (!trialEnd) return null
  const end = new Date(trialEnd)
  const now = new Date()
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : null
}

// ─── Usage Meter ─────────────────────────────────────────────────────────────

function UsageMeter({
  used,
  limit,
  label,
  color = 'blue',
}: {
  used: number
  limit: number
  label: string
  color?: 'blue' | 'green' | 'amber'
}) {
  const reducedMotion = useReducedMotion()
  const isUnlimited = limit === -1
  const percentage = isUnlimited ? 30 : Math.min(100, (used / limit) * 100)
  const isNearLimit = !isUnlimited && percentage >= 80
  const barColor = isNearLimit
    ? 'bg-red-500'
    : color === 'green'
      ? 'bg-green-500'
      : color === 'amber'
        ? 'bg-amber-500'
        : 'bg-blue-500'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
          {used.toLocaleString()}{isUnlimited ? '' : `/${limit.toLocaleString()}`}
        </span>
      </div>
      <div
        className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={isUnlimited ? undefined : limit}
        aria-label={`${label}: ${used}${isUnlimited ? '' : ` of ${limit}`}`}
      >
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={reducedMotion ? { width: `${percentage}%` } : { width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      {isNearLimit && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" aria-hidden="true" />
          Approaching limit — consider upgrading
        </p>
      )}
    </div>
  )
}

// ─── Trial Countdown ─────────────────────────────────────────────────────────

function TrialCountdown({ trialEnd }: { trialEnd: string }) {
  const reducedMotion = useReducedMotion()
  const daysLeft = getTrialDaysLeft(trialEnd)
  if (daysLeft === null) return null

  const totalTrialDays = 14
  const progress = ((totalTrialDays - daysLeft) / totalTrialDays) * 100

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
          {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in your free trial
        </span>
      </div>
      <div
        className="h-2 bg-blue-100 dark:bg-blue-800 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={totalTrialDays - daysLeft}
        aria-valuemax={totalTrialDays}
        aria-label={`Trial progress: ${daysLeft} days remaining`}
      >
        <motion.div
          className="h-full bg-blue-500 rounded-full"
          initial={reducedMotion ? { width: `${progress}%` } : { width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5">
        Your trial ends on {new Date(trialEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </p>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function BillingCard({
  plan,
  subscription,
  usage,
  paymentMethod,
  onUpgrade,
  onManageBilling,
  isUpgrading,
  isManaging,
}: BillingCardProps) {
  const reducedMotion = useReducedMotion()
  const [upgradeTarget, setUpgradeTarget] = useState<string | null>(null)

  const gradient = tierGradients[plan.id] || tierGradients.free
  const TierIcon = tierIcons[plan.id] || Zap

  const statusConfig = subscription
    ? getStatusConfig(subscription.status, subscription.cancelAtPeriodEnd)
    : null
  const StatusIcon = statusConfig?.icon || CheckCircle

  const renewalDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const handleUpgrade = (planId: string) => {
    setUpgradeTarget(planId)
    onUpgrade(planId)
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.4 }}
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} text-white p-6 shadow-lg`}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" aria-hidden="true" />

        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <TierIcon className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{plan.name} Plan</h3>
                <p className="text-sm text-white/80">
                  {plan.price > 0
                    ? `$${plan.price}/month`
                    : 'Free forever'}
                </p>
              </div>
            </div>
            {statusConfig && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.classes}`}
                role="status"
                aria-label={`Subscription status: ${statusConfig.label}`}
              >
                <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                {statusConfig.label}
              </span>
            )}
          </div>

          {renewalDate && (
            <p className="mt-4 text-sm text-white/70">
              {subscription?.cancelAtPeriodEnd
                ? `Access until ${renewalDate}`
                : `Renews on ${renewalDate}`}
            </p>
          )}

          <div className="mt-5 flex items-center gap-3 flex-wrap">
            {plan.id === 'free' && (
              <button
                onClick={() => handleUpgrade('pro')}
                disabled={isUpgrading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
              >
                {isUpgrading && upgradeTarget === 'pro' ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                )}
                Upgrade to Pro
              </button>
            )}
            {plan.id !== 'premium' && plan.id !== 'free' && (
              <button
                onClick={() => handleUpgrade('premium')}
                disabled={isUpgrading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
              >
                {isUpgrading && upgradeTarget === 'premium' ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Crown className="w-4 h-4" aria-hidden="true" />
                )}
                Upgrade to Premium
              </button>
            )}
            {subscription && (
              <button
                onClick={onManageBilling}
                disabled={isManaging}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium text-sm hover:bg-white/30 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
              >
                {isManaging ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Settings className="w-4 h-4" aria-hidden="true" />
                )}
                Manage Billing
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Trial Countdown */}
      {subscription?.status === 'trialing' && subscription.trialEnd && (
        <TrialCountdown trialEnd={subscription.trialEnd} />
      )}

      {/* Usage Stats */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0 } : { delay: 0.1, duration: 0.4 }}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Usage This Month
        </h3>
        <div className="space-y-4">
          <UsageMeter
            used={usage.leadsUsed}
            limit={usage.leadsLimit}
            label="Leads"
            color="blue"
          />
          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Profile views</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
              {usage.profileViews.toLocaleString()}
            </span>
          </div>
          {usage.totalCostUsd > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total charges</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                ${usage.totalCostUsd.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Payment Method */}
      {paymentMethod && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : { delay: 0.2, duration: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Payment Method
          </h3>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                {paymentMethod.brand} ending in {paymentMethod.last4}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Expires {String(paymentMethod.expMonth).padStart(2, '0')}/{paymentMethod.expYear}
              </p>
            </div>
            <button
              onClick={onManageBilling}
              disabled={isManaging}
              className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
            >
              Update
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
