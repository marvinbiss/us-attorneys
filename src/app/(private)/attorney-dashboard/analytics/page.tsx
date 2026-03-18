'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Eye,
  Phone,
  CalendarCheck,
  Star,
  Loader2,
  AlertCircle,
  RefreshCw,
  BarChart3,
} from 'lucide-react'
import { KPICard } from '@/components/attorney-dashboard/KPICard'
import type { TrendDirection } from '@/components/attorney-dashboard/KPICard'
import {
  ViewsChart,
  LeadFunnel,
  PracticeAreaBreakdown,
  MarketComparison,
  RecentActivity,
} from '@/components/attorney-dashboard/AnalyticsCharts'
import type { ActivityItem } from '@/components/attorney-dashboard/AnalyticsCharts'

// ─── Types ───────────────────────────────────────────────────────────────────

type DateRange = '7d' | '30d' | '90d' | '1y'

interface AnalyticsData {
  kpis: {
    profileViews: { value: number; trend: number; label: string }
    contactRate: { value: number; trend: number; label: string }
    bookingConversion: { value: number; trend: number; label: string }
    averageRating: { value: number; total: number; label: string }
  }
  viewsTrend: Array<{ date: string; count: number }>
  funnel: { views: number; contacts: number; bookings: number; completed: number }
  marketComparison: {
    practiceArea: string
    state: string
    yourRate: number
    marketRate: number
    metric: string
  }
  practiceAreas: Array<{ name: string; views: number; contacts: number }>
  recentActivity: ActivityItem[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RANGES: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '1y', label: '1 year' },
]

function getTrendDirection(value: number): TrendDirection {
  if (value > 0) return 'up'
  if (value < 0) return 'down'
  return 'flat'
}

function getTrendVariant(value: number): 'green' | 'red' | 'gray' {
  if (value > 0) return 'green'
  if (value < 0) return 'red'
  return 'gray'
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range, setRange] = useState<DateRange>('30d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async (selectedRange: DateRange) => {
    try {
      setError(null)
      setLoading(true)

      const response = await fetch(`/api/attorney/analytics?range=${selectedRange}`)
      const result = await response.json()

      if (response.ok) {
        setData(result)
      } else if (response.status === 401) {
        window.location.href = '/login?redirect=/attorney-dashboard/analytics'
        return
      } else {
        setError(result.error || 'Failed to load analytics')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics(range)
  }, [range, fetchAnalytics])

  const handleRangeChange = (newRange: DateRange) => {
    setRange(newRange)
  }

  // ── Loading State ──────────────────────────────────────────────────────────

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Loading analytics...</p>
        </div>
      </div>
    )
  }

  // ── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link
              href="/attorney-dashboard"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Attorney Dashboard
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-medium">Analytics</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
                <BarChart3 className="w-7 h-7" />
                Analytics
              </h1>
              <p className="text-blue-100 text-sm mt-1">
                Track your profile performance and client acquisition
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Refresh button */}
              <button
                onClick={() => fetchAnalytics(range)}
                disabled={loading}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
                title="Refresh"
                aria-label="Refresh analytics"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Date range selector */}
              <div className="flex items-center bg-white/10 rounded-lg p-1">
                {RANGES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => handleRangeChange(r.value)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      range === r.value
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={() => fetchAnalytics(range)}
              className="text-sm text-red-600 dark:text-red-400 hover:underline font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {data && (
          <>
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <KPICard
                icon={<Eye className="w-5 h-5" />}
                value={data.kpis.profileViews.value}
                label="Profile Views"
                format="number"
                trend={{
                  direction: getTrendDirection(data.kpis.profileViews.trend),
                  value: Math.abs(data.kpis.profileViews.trend),
                  label: data.kpis.profileViews.label,
                }}
                variant={getTrendVariant(data.kpis.profileViews.trend)}
                delay={0}
              />
              <KPICard
                icon={<Phone className="w-5 h-5" />}
                value={data.kpis.contactRate.value}
                label="Contact Rate"
                format="percent"
                trend={{
                  direction: getTrendDirection(data.kpis.contactRate.trend),
                  value: Math.abs(data.kpis.contactRate.trend),
                  label: data.kpis.contactRate.label,
                }}
                variant={getTrendVariant(data.kpis.contactRate.trend)}
                delay={0.05}
              />
              <KPICard
                icon={<CalendarCheck className="w-5 h-5" />}
                value={data.kpis.bookingConversion.value}
                label="Booking Conversion"
                format="percent"
                trend={{
                  direction: getTrendDirection(data.kpis.bookingConversion.trend),
                  value: Math.abs(data.kpis.bookingConversion.trend),
                  label: data.kpis.bookingConversion.label,
                }}
                variant={getTrendVariant(data.kpis.bookingConversion.trend)}
                delay={0.1}
              />
              <KPICard
                icon={<Star className="w-5 h-5" />}
                value={data.kpis.averageRating.value > 0 ? `${data.kpis.averageRating.value}/5` : 'N/A'}
                label="Average Rating"
                comparison={data.kpis.averageRating.label}
                variant="gray"
                delay={0.15}
              />
            </div>

            {/* Views Chart + Market Comparison */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <ViewsChart
                  data={data.viewsTrend.map((d) => ({
                    date: d.date,
                    views: d.count,
                  }))}
                />
              </div>
              <div className="space-y-6">
                <MarketComparison
                  practiceArea={data.marketComparison.practiceArea}
                  state={data.marketComparison.state}
                  yourRate={data.marketComparison.yourRate}
                  marketRate={data.marketComparison.marketRate}
                  metric={data.marketComparison.metric}
                />
                {/* Quick funnel summary */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Quick Funnel Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                        {data.funnel.views}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Views</p>
                    </div>
                    <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                      <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                        {data.funnel.contacts}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Contacts</p>
                    </div>
                    <div className="text-center p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                      <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                        {data.funnel.bookings}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Bookings</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <p className="text-lg font-bold text-green-700 dark:text-green-400">
                        {data.funnel.completed}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lead Funnel */}
            <div className="mb-8">
              <LeadFunnel
                views={data.funnel.views}
                contacts={data.funnel.contacts}
                bookings={data.funnel.bookings}
                completed={data.funnel.completed}
              />
            </div>

            {/* Practice Areas + Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              {data.practiceAreas.length > 0 && (
                <PracticeAreaBreakdown data={data.practiceAreas} />
              )}
              <RecentActivity items={data.recentActivity} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
