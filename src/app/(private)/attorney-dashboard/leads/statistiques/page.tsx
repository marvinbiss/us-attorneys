'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Inbox,
  Clock,
  Send,
  Check,
  CheckCircle,
  TrendingUp,
  X,
  BarChart3,
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { FunnelChart } from '@/components/dashboard/FunnelChart'

interface LeadStats {
  total: number
  pending: number
  viewed: number
  quoted: number
  declined: number
  accepted: number
  completed: number
  conversionRate: number
  avgResponseMinutes: number
  thisMonth: number
  lastMonth: number
  monthlyGrowth: number
}

interface MonthlyData {
  month: string
  count: number
}

export default function ArtisanLeadStatsPage() {
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/attorney/leads/stats')
        const data = await res.json()
        if (res.ok) {
          setStats(data.stats)
          setMonthlyTrend(data.monthlyTrend || [])
        } else {
          setError(data.error || 'Error')
        }
      } catch {
        setError('Connection error')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Loading statistics...</p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-700">{error || 'Unknown error'}</p>
        </div>
      </div>
    )
  }

  const funnel = [
    { stage: 'dispatched', count: stats.total, rate: 100 },
    { stage: 'viewed', count: stats.viewed + stats.quoted + stats.accepted + stats.completed, rate: stats.total > 0 ? Math.round(((stats.viewed + stats.quoted + stats.accepted + stats.completed) / stats.total) * 100) : 0 },
    { stage: 'quoted', count: stats.quoted + stats.accepted + stats.completed, rate: stats.total > 0 ? Math.round(((stats.quoted + stats.accepted + stats.completed) / stats.total) * 100) : 0 },
    { stage: 'accepted', count: stats.accepted + stats.completed, rate: stats.total > 0 ? Math.round(((stats.accepted + stats.completed) / stats.total) * 100) : 0 },
    { stage: 'completed', count: stats.completed, rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0 },
  ]

  const maxMonthly = Math.max(...monthlyTrend.map((m) => m.count), 1)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/attorney-dashboard" className="hover:text-gray-900">Attorney Dashboard</Link>
            <span>/</span>
            <Link href="/attorney-dashboard/leads" className="hover:text-gray-900">Leads</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Statistics</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link
          href="/attorney-dashboard/leads"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Lead Statistics</h1>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard
            title="Total Received"
            value={stats.total}
            icon={<Inbox className="w-5 h-5" />}
            color="blue"
            trend={stats.monthlyGrowth !== 0 ? { value: stats.monthlyGrowth, isPositive: stats.monthlyGrowth > 0 } : undefined}
          />
          <StatCard
            title="Quotes Sent"
            value={stats.quoted}
            icon={<Send className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Conversion Rate"
            value={`${stats.conversionRate}%`}
            icon={<Check className="w-5 h-5" />}
            color="indigo"
          />
          <StatCard
            title="Response Time"
            value={stats.avgResponseMinutes > 0 ? `${stats.avgResponseMinutes} min` : '—'}
            icon={<Clock className="w-5 h-5" />}
            color="yellow"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Status Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: 'Pending', value: stats.pending, color: 'bg-blue-500', icon: <Clock className="w-4 h-4 text-blue-500" /> },
                { label: 'Viewed', value: stats.viewed, color: 'bg-yellow-500', icon: <TrendingUp className="w-4 h-4 text-yellow-500" /> },
                { label: 'Quote Sent', value: stats.quoted, color: 'bg-green-500', icon: <Send className="w-4 h-4 text-green-500" /> },
                { label: 'Declined', value: stats.declined, color: 'bg-gray-400', icon: <X className="w-4 h-4 text-gray-400" /> },
                { label: 'Accepted', value: stats.accepted, color: 'bg-emerald-500', icon: <Check className="w-4 h-4 text-emerald-500" /> },
                { label: 'Completed', value: stats.completed, color: 'bg-green-700', icon: <CheckCircle className="w-4 h-4 text-green-700" /> },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-sm text-gray-600 flex-1">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">{item.value}</span>
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${stats.total > 0 ? (item.value / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Funnel */}
          <FunnelChart steps={funnel} title="Conversion Funnel" />
        </div>

        {/* Monthly trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Trend (6 months)</h3>
          <div className="flex items-end gap-3 h-40">
            {monthlyTrend.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-gray-900 tabular-nums">{m.count}</span>
                <div className="w-full bg-gray-100 rounded-t-md overflow-hidden" style={{ height: '100%' }}>
                  <div
                    className="w-full bg-blue-500 rounded-t-md transition-all duration-500"
                    style={{
                      height: `${(m.count / maxMonthly) * 100}%`,
                      minHeight: m.count > 0 ? '4px' : '0px',
                      marginTop: 'auto',
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-500">This month: <strong className="text-gray-900">{stats.thisMonth}</strong></span>
            <span className="text-gray-500">Last month: <strong className="text-gray-900">{stats.lastMonth}</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}
