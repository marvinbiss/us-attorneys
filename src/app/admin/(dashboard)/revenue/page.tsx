'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAdminFetch } from '@/hooks/admin/useAdminFetch'
import { RevenueKPICard } from '@/components/admin/RevenueKPICard'
import {
  MRRChart,
  SubscriberGrowthChart,
  RevenuePieChart,
  ChurnChart,
  CohortHeatmap,
  TrialFunnel,
} from '@/components/admin/RevenueCharts'
import {
  DollarSign, Users, TrendingDown, UserCheck, Crown, Activity,
  Loader2, AlertCircle, ExternalLink, RefreshCw,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────

interface RevenueData {
  success: boolean
  kpis: {
    mrr: number
    arr: number
    totalSubscribers: number
    activePro: number
    activePremium: number
    activeFree: number
    trialing: number
    totalCancelled: number
    churnRate: number
    arpu: number
    ltv: number
    mrrGrowth: number
  }
  mrrTrend: Array<{ month: string; mrr: number; subscribers: number; pro: number; premium: number; free: number }>
  subscriberGrowth: Array<{ month: string; free: number; pro: number; premium: number }>
  churnAnalysis: Array<{ month: string; cancelled: number; churnRate: number }>
  revenueByPlan: Array<{ name: string; value: number; count: number; color: string }>
  topAttorneys: Array<{
    id: string
    name: string
    slug: string
    plan: string
    status: string
    tenure: number
    totalPaid: number
    monthlyRate: number
  }>
  trialFunnel: {
    started: number
    converted: number
    churned: number
    conversionRate: number
  }
  cohorts: Array<{
    cohort: string
    total: number
    retained: number[]
  }>
  stripeRevenue: {
    last30Days: number
    charges: number
    refunds: number
    totalRefunded: number
  } | null
  mrrSparkline: number[]
}

type TabType = 'overview' | 'subscribers' | 'churn' | 'cohorts'

// ─── Currency formatters ────────────────────────────────────────

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

const fmtPct = (v: number) => `${v >= 0 ? '' : ''}${v}%`

// ─── Page ───────────────────────────────────────────────────────

export default function RevenueDashboardPage() {
  const [tab, setTab] = useState<TabType>('overview')
  const { data, isLoading, error, mutate } = useAdminFetch<RevenueData>('/api/admin/revenue')

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg shadow-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h1>
          </div>
          <p className="text-sm text-gray-500 ml-12">
            MRR, subscriptions, churn, and lifetime value analytics
          </p>
        </div>
        <button
          onClick={() => mutate()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* ── Error ───────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm font-medium">{String(error)}</p>
        </div>
      )}

      {/* ── Loading ──────────────────────────────────────── */}
      {isLoading && !data && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm text-gray-400">Loading revenue data...</p>
        </div>
      )}

      {data?.success && (
        <>
          {/* ── KPI Cards ───────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <RevenueKPICard
              label="MRR"
              value={fmtCurrency(data.kpis.mrr)}
              trend={data.kpis.mrrGrowth}
              icon={<DollarSign className="w-5 h-5" />}
              color="emerald"
              sparkline={data.mrrSparkline}
              subtitle={`ARR: ${fmtCurrency(data.kpis.arr)}`}
            />
            <RevenueKPICard
              label="Total Subscribers"
              value={data.kpis.totalSubscribers.toLocaleString('en-US')}
              icon={<Users className="w-5 h-5" />}
              color="blue"
              subtitle={`${data.kpis.activePro} Pro + ${data.kpis.activePremium} Premium`}
            />
            <RevenueKPICard
              label="Churn Rate"
              value={fmtPct(data.kpis.churnRate)}
              icon={<TrendingDown className="w-5 h-5" />}
              color="rose"
              subtitle={`${data.kpis.totalCancelled} total cancelled`}
            />
            <RevenueKPICard
              label="ARPU"
              value={fmtCurrency(data.kpis.arpu)}
              icon={<UserCheck className="w-5 h-5" />}
              color="violet"
              subtitle="Average Revenue Per User"
            />
            <RevenueKPICard
              label="LTV"
              value={fmtCurrency(data.kpis.ltv)}
              icon={<Crown className="w-5 h-5" />}
              color="amber"
              subtitle="Customer Lifetime Value"
            />
          </div>

          {/* ── Stripe Revenue Card (if available) ──────── */}
          {data.stripeRevenue && (
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-gray-200">Stripe Revenue (Last 30 Days)</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-2xl font-extrabold text-emerald-400">{fmtCurrency(data.stripeRevenue.last30Days)}</p>
                  <p className="text-xs text-gray-400">Net Revenue</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold">{data.stripeRevenue.charges}</p>
                  <p className="text-xs text-gray-400">Charges</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold">{data.stripeRevenue.refunds}</p>
                  <p className="text-xs text-gray-400">Refunds</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-red-400">{fmtCurrency(data.stripeRevenue.totalRefunded)}</p>
                  <p className="text-xs text-gray-400">Total Refunded</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab Switcher ────────────────────────────── */}
          <div className="flex bg-gray-100/80 rounded-xl p-1 border border-gray-200/50 w-fit">
            {([
              { key: 'overview' as const, label: 'Overview' },
              { key: 'subscribers' as const, label: 'Subscribers' },
              { key: 'churn' as const, label: 'Churn' },
              { key: 'cohorts' as const, label: 'Cohorts' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  tab === key
                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Overview Tab ────────────────────────────── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MRRChart data={data.mrrTrend} />
                <RevenuePieChart data={data.revenueByPlan} />
              </div>
              <TrialFunnel funnel={data.trialFunnel} />
            </div>
          )}

          {/* ── Subscribers Tab ─────────────────────────── */}
          {tab === 'subscribers' && (
            <div className="space-y-6">
              <SubscriberGrowthChart data={data.subscriberGrowth} />

              {/* Top Attorneys by Revenue */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">Top Attorneys by Revenue</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Ranked by estimated total paid</p>
                </div>
                {data.topAttorneys.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No paid subscribers yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                          <th className="px-6 py-3">#</th>
                          <th className="px-4 py-3">Attorney</th>
                          <th className="px-4 py-3">Plan</th>
                          <th className="px-4 py-3 text-center">Tenure</th>
                          <th className="px-4 py-3 text-right">Monthly</th>
                          <th className="px-4 py-3 text-right">Total Paid</th>
                          <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {data.topAttorneys.map((att, i) => (
                          <tr key={att.id} className="group hover:bg-blue-50/30 transition-colors">
                            <td className="px-6 py-3">
                              <span className="text-xs font-bold text-gray-400">{i + 1}</span>
                            </td>
                            <td className="px-4 py-3">
                              <Link
                                href={`/admin/attorneys/${att.id}`}
                                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                              >
                                <span className="truncate max-w-[200px]">{att.name}</span>
                                <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-blue-400 flex-shrink-0" />
                              </Link>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${
                                att.plan === 'premium'
                                  ? 'bg-purple-50 text-purple-700 ring-purple-200/50'
                                  : 'bg-indigo-50 text-indigo-700 ring-indigo-200/50'
                              }`}>
                                {att.plan === 'premium' ? 'Premium' : 'Pro'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-600">
                              {att.tenure} mo{att.tenure > 1 ? 's' : ''}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                              {fmtCurrency(att.monthlyRate)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-bold text-emerald-600">{fmtCurrency(att.totalPaid)}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                att.status === 'active'
                                  ? 'bg-green-50 text-green-700'
                                  : att.status === 'trialing'
                                  ? 'bg-blue-50 text-blue-700'
                                  : att.status === 'past_due'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-red-50 text-red-700'
                              }`}>
                                {att.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Churn Tab ───────────────────────────────── */}
          {tab === 'churn' && (
            <div className="space-y-6">
              <ChurnChart data={data.churnAnalysis} />

              {/* Churn summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Current Churn Rate</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{data.kpis.churnRate}%</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {data.kpis.churnRate <= 5 ? 'Healthy' : data.kpis.churnRate <= 10 ? 'Needs attention' : 'Critical'}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Cancelled</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{data.kpis.totalCancelled}</p>
                  <p className="text-xs text-gray-400 mt-1">All time</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Currently Trialing</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{data.kpis.trialing}</p>
                  <p className="text-xs text-gray-400 mt-1">Active trial users</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Cohorts Tab ─────────────────────────────── */}
          {tab === 'cohorts' && (
            <div className="space-y-6">
              <CohortHeatmap cohorts={data.cohorts} />

              {/* Subscriber tier breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Current Subscriber Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Free', count: data.kpis.activeFree, color: 'bg-gray-400', total: data.kpis.activeFree + data.kpis.totalSubscribers },
                    { label: 'Pro ($99/mo)', count: data.kpis.activePro, color: 'bg-indigo-500', total: data.kpis.activeFree + data.kpis.totalSubscribers },
                    { label: 'Premium ($199/mo)', count: data.kpis.activePremium, color: 'bg-purple-500', total: data.kpis.activeFree + data.kpis.totalSubscribers },
                  ].map((tier) => {
                    const pct = tier.total > 0 ? (tier.count / tier.total) * 100 : 0
                    return (
                      <div key={tier.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-600">{tier.label}</span>
                          <span className="text-sm font-bold text-gray-900">{tier.count.toLocaleString('en-US')}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${tier.color} rounded-full transition-all duration-700`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
