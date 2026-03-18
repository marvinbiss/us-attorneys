'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  devisSent: number
  devisSentChange: number
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
    <span className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
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
        console.error('Error fetching stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [period])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (noProvider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No attorney profile found</h2>
          <p className="text-gray-500">You must create your attorney profile to access statistics.</p>
          <Link
            href="/attorney-dashboard/profile"
            className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create My Profile
          </Link>
        </div>
      </div>
    )
  }

  if (!stats) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">No data available</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <Link
              href="/attorney-dashboard"
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Statistics</h1>
              <p className="text-blue-100">Analyze your practice performance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period selector */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'week', label: 'Week' },
            { id: 'month', label: 'Month' },
            { id: 'year', label: 'Year' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as 'week' | 'month' | 'year')}
              className={`px-4 py-2 rounded-lg font-medium ${
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Leads received */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-600" />
              <ChangeIndicator value={stats.totalLeadsChange} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalLeads}</div>
            <div className="text-sm text-gray-500">Cases Received</div>
          </div>

          {/* Quotes sent */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-8 h-8 text-green-600" />
              <ChangeIndicator value={stats.devisSentChange} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.devisSent}</div>
            <div className="text-sm text-gray-500">Quotes Sent</div>
          </div>

          {/* Average rating */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <Star className="w-8 h-8 text-yellow-500" />
              <span className="text-sm text-gray-500">{stats.totalReviews} reviews</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
            </div>
            <div className="text-sm text-gray-500">Average Rating</div>
          </div>

          {/* Profile views */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <Eye className="w-8 h-8 text-purple-600" />
              <ChangeIndicator value={stats.profileViewsChangeNum} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.profileViewsCount}</div>
            <div className="text-sm text-gray-500">Profile Views</div>
          </div>
        </div>

        {/* Secondary metrics */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="w-6 h-6 text-emerald-600" />
                <div>
                  <div className="text-sm text-gray-500">Phone Reveals</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.phoneRevealsCount}</div>
                </div>
              </div>
              <ChangeIndicator value={stats.phoneRevealsChangeNum} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="w-6 h-6 text-teal-600" />
                <div>
                  <div className="text-sm text-gray-500">Phone Clicks</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.phoneClicksCount}</div>
                </div>
              </div>
              <ChangeIndicator value={stats.phoneClicksChangeNum} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly trend chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Cases per Month (Last 6 Months)
            </h3>
            {stats.monthlyTrend.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No data</p>
            ) : (
              <div className="flex items-end justify-between h-32 sm:h-40">
                {stats.monthlyTrend.map((month, i) => {
                  const maxCount = Math.max(...stats.monthlyTrend.map(m => m.count), 1)
                  const height = (month.count / maxCount) * 100
                  return (
                    <div key={month.month} className="flex flex-col items-center gap-2 flex-1">
                      <div className="text-xs text-gray-600">{month.count}</div>
                      <div
                        className={`w-10 rounded-t transition-all ${
                          i === stats.monthlyTrend.length - 1 ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                      <div className="text-xs text-gray-500 capitalize">{month.month}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Top services */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              Most Requested Services
            </h3>
            {stats.topServices.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No data</p>
            ) : (
              <div className="space-y-4">
                {stats.topServices.map((service, i) => {
                  const maxCount = stats.topServices[0].count
                  const width = (service.count / maxCount) * 100
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 truncate">{service.name}</span>
                        <span className="text-gray-500">{service.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
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
