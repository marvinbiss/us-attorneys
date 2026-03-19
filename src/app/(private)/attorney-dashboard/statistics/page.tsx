'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import {
  TrendingUp,
  Star,
  ChevronLeft,
  Loader2,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Phone,
  FileText,
  Users,
} from 'lucide-react'

interface Stats {
  totalLeads: number
  totalLeadsChange: number
  quotesSent: number
  quotesSentChange: number
  averageRating: number
  totalReviews: number
  totalReviewsChange: number
  profileViewsCount: number
  profileViewsChangeNum: number
  phoneRevealsCount: number
  phoneRevealsChangeNum: number
  phoneClicksCount: number
  phoneClicksChangeNum: number
  monthlyTrend: { month: string; count: number }[]
  topServices: { name: string; count: number }[]
}

function ChangeIndicator({ value }: { value: number }) {
  if (value === 0) return <span className="text-sm text-gray-400">--</span>
  const isPositive = value > 0
  return (
    <span
      className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}
    >
      {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
      {Math.abs(value)}%
    </span>
  )
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [noProvider, setNoProvider] = useState(false)
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/attorney/stats?period=${period}`)

        if (res.status === 404) {
          setNoProvider(true)
          setIsLoading(false)
          return
        }

        if (!res.ok) {
          setIsLoading(false)
          return
        }

        const data = await res.json()

        if (!data.provider) {
          setNoProvider(true)
          setIsLoading(false)
          return
        }

        setStats(data.stats)
      } catch (err: unknown) {
        logger.error('Error fetching stats', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [period])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (noProvider) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <BarChart3 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h2 className="mb-2 text-xl font-semibold text-gray-700">No attorney profile found</h2>
          <p className="text-gray-500">
            You must create your attorney profile to access statistics.
          </p>
          <Link
            href="/attorney-dashboard/profile"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Create My Profile
          </Link>
        </div>
      </div>
    )
  }

  if (!stats)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        No data available
      </div>
    )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/attorney-dashboard" className="rounded-lg p-2 hover:bg-white/10">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Statistics</h1>
              <p className="text-blue-100">Analyze your practice performance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Period selector */}
        <div className="mb-6 flex gap-2">
          {[
            { id: 'week', label: 'Week' },
            { id: 'month', label: 'Month' },
            { id: 'year', label: 'Year' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as 'week' | 'month' | 'year')}
              className={`rounded-lg px-4 py-2 font-medium ${
                period === p.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Key metrics */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Leads received */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <Users className="h-8 w-8 text-blue-600" />
              <ChangeIndicator value={stats.totalLeadsChange} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalLeads}</div>
            <div className="text-sm text-gray-500">Cases Received</div>
          </div>

          {/* Quotes sent */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <FileText className="h-8 w-8 text-green-600" />
              <ChangeIndicator value={stats.quotesSentChange} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.quotesSent}</div>
            <div className="text-sm text-gray-500">Quotes Sent</div>
          </div>

          {/* Average rating */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <Star className="h-8 w-8 text-yellow-500" />
              <span className="text-sm text-gray-500">{stats.totalReviews} reviews</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
            </div>
            <div className="text-sm text-gray-500">Average Rating</div>
          </div>

          {/* Profile views */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <Eye className="h-8 w-8 text-purple-600" />
              <ChangeIndicator value={stats.profileViewsChangeNum} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.profileViewsCount}</div>
            <div className="text-sm text-gray-500">Profile Views</div>
          </div>
        </div>

        {/* Secondary metrics */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="h-6 w-6 text-emerald-600" />
                <div>
                  <div className="text-sm text-gray-500">Phone Reveals</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.phoneRevealsCount}</div>
                </div>
              </div>
              <ChangeIndicator value={stats.phoneRevealsChangeNum} />
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="h-6 w-6 text-teal-600" />
                <div>
                  <div className="text-sm text-gray-500">Phone Clicks</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.phoneClicksCount}</div>
                </div>
              </div>
              <ChangeIndicator value={stats.phoneClicksChangeNum} />
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Monthly trend chart */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Cases per Month (Last 6 Months)
            </h3>
            {stats.monthlyTrend.length === 0 ? (
              <p className="py-8 text-center text-gray-500">No data</p>
            ) : (
              <div className="flex h-32 items-end justify-between sm:h-40">
                {stats.monthlyTrend.map((month, i) => {
                  const maxCount = Math.max(...stats.monthlyTrend.map((m) => m.count), 1)
                  const height = (month.count / maxCount) * 100
                  return (
                    <div key={month.month} className="flex flex-1 flex-col items-center gap-2">
                      <div className="text-xs text-gray-600">{month.count}</div>
                      <div
                        className={`w-10 rounded-t transition-all ${
                          i === stats.monthlyTrend.length - 1 ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                      <div className="text-xs capitalize text-gray-500">{month.month}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Top services */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <PieChart className="h-5 w-5 text-purple-600" />
              Most Requested Services
            </h3>
            {stats.topServices.length === 0 ? (
              <p className="py-8 text-center text-gray-500">No data</p>
            ) : (
              <div className="space-y-4">
                {stats.topServices.map((service, i) => {
                  const maxCount = stats.topServices[0].count
                  const width = (service.count / maxCount) * 100
                  return (
                    <div key={i}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="truncate text-gray-700">{service.name}</span>
                        <span className="text-gray-500">{service.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-purple-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
