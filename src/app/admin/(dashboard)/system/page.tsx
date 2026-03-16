'use client'

import { useState, useEffect } from 'react'
import {
  Loader2,
  AlertCircle,
  Activity,
  Users,
  Inbox,
  Clock,
  Send,
  Eye,
  CheckCircle,
  TrendingUp,
  BarChart3,
  MapPin,
  Wrench,
  Shield,
  XCircle,
  RefreshCw,
  Gauge,
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { FunnelChart } from '@/components/dashboard/FunnelChart'

interface SystemData {
  leads: { total: number; today: number; thisWeek: number; thisMonth: number }
  events: { total: number; today: number }
  assignments: { total: number; pending: number; viewed: number; quoted: number; declined: number }
  providers: { total: number; active: number; withLeads: number }
  quality: { avgResponseMinutes: number; conversionRate: number; declineRate: number; expiredRate: number }
  funnel: Array<{ stage: string; count: number; rate: number }>
  dailyLeads: Array<{ date: string; label: string; count: number }>
  topServices: Array<{ service: string; count: number }>
  topCities: Array<{ city: string; count: number }>
}

export default function SystemDashboardPage() {
  const [data, setData] = useState<SystemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchData = async () => {
    try {
      setError(null)
      setLoading(true)
      const res = await fetch('/api/admin/system/kpis')
      if (res.ok) {
        setData(await res.json())
        setLastRefresh(new Date())
      } else {
        const err = await res.json()
        setError(err.error || 'Error')
      }
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Loading system dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-700">{error || 'Error'}</p>
          <button onClick={fetchData} className="text-blue-600 hover:underline text-sm mt-3">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const maxDaily = Math.max(...data.dailyLeads.map((d) => d.count), 1)
  const maxService = Math.max(...data.topServices.map((s) => s.count), 1)
  const maxCity = Math.max(...data.topCities.map((c) => c.count), 1)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Gauge className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System dashboard</h1>
                <p className="text-gray-500 text-sm mt-0.5">Internal KPIs, quality, monitoring</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              Updated: {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-white transition-colors"
              aria-label="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section 1: Volumes */}
        <div className="mb-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Volumes</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard title="Total leads" value={data.leads.total} icon={<Inbox className="w-5 h-5" />} color="blue" />
          <StatCard title="Today" value={data.leads.today} icon={<Clock className="w-5 h-5" />} color="yellow" />
          <StatCard title="This week" value={data.leads.thisWeek} icon={<TrendingUp className="w-5 h-5" />} color="green" />
          <StatCard title="This month" value={data.leads.thisMonth} icon={<BarChart3 className="w-5 h-5" />} color="blue" />
        </div>

        {/* Section 2: Assignments */}
        <div className="mb-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Assignments</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          <StatCard title="Total" value={data.assignments.total} icon={<Send className="w-5 h-5" />} color="blue" />
          <StatCard title="Pending" value={data.assignments.pending} icon={<Clock className="w-5 h-5" />} color="yellow" />
          <StatCard title="Viewed" value={data.assignments.viewed} icon={<Eye className="w-5 h-5" />} color="blue" />
          <StatCard title="Quoted" value={data.assignments.quoted} icon={<CheckCircle className="w-5 h-5" />} color="green" />
          <StatCard title="Declined" value={data.assignments.declined} icon={<XCircle className="w-5 h-5" />} color="gray" />
        </div>

        {/* Section 3: Quality */}
        <div className="mb-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quality</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard title="Avg response time" value={data.quality.avgResponseMinutes > 0 ? `${data.quality.avgResponseMinutes} min` : '--'} icon={<Clock className="w-5 h-5" />} color="blue" />
          <StatCard title="Conversion rate" value={`${data.quality.conversionRate}%`} icon={<TrendingUp className="w-5 h-5" />} color="green" />
          <StatCard title="Decline rate" value={`${data.quality.declineRate}%`} icon={<XCircle className="w-5 h-5" />} color="red" />
          <StatCard title="Expiration rate" value={`${data.quality.expiredRate}%`} icon={<Clock className="w-5 h-5" />} color="yellow" />
        </div>

        {/* Section 4: Providers + Events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-8">
          <StatCard title="Total attorneys" value={data.providers.total} icon={<Users className="w-5 h-5" />} color="blue" />
          <StatCard title="Active attorneys" value={data.providers.active} icon={<CheckCircle className="w-5 h-5" />} color="green" />
          <StatCard title="With leads" value={data.providers.withLeads} icon={<Inbox className="w-5 h-5" />} color="blue" />
        </div>

        {/* Section 5: Funnel + Daily trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <FunnelChart steps={data.funnel} title="Conversion funnel" />
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Leads / day (last 14 days)</h3>
            <div className="flex items-end gap-1.5 h-40">
              {data.dailyLeads.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <span className="text-xs font-semibold text-gray-700 tabular-nums">{d.count > 0 ? d.count : ''}</span>
                  <div className="w-full bg-gray-100 rounded-t overflow-hidden" style={{ height: '100%' }}>
                    <div className="w-full bg-blue-500 rounded-t transition-all duration-500" style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: d.count > 0 ? '4px' : '0px', marginTop: 'auto' }} />
                  </div>
                  <span className="text-xs text-gray-400 truncate w-full text-center">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 6: Top services + Top cities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-gray-400" /> Top 10 services
            </h3>
            {data.topServices.length === 0 ? (
              <p className="text-sm text-gray-400">No data</p>
            ) : (
              <div className="space-y-2.5">
                {data.topServices.map((s, i) => (
                  <div key={s.service} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-5 tabular-nums">{i + 1}.</span>
                    <span className="text-sm text-gray-700 flex-1 truncate">{s.service}</span>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">{s.count}</span>
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(s.count / maxService) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" /> Top 10 cities
            </h3>
            {data.topCities.length === 0 ? (
              <p className="text-sm text-gray-400">No data</p>
            ) : (
              <div className="space-y-2.5">
                {data.topCities.map((c, i) => (
                  <div key={c.city} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-5 tabular-nums">{i + 1}.</span>
                    <span className="text-sm text-gray-700 flex-1 truncate">{c.city}</span>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">{c.count}</span>
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(c.count / maxCity) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 7: Event counts + Architecture note */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" /> Events
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-700 tabular-nums">{data.events.total}</p>
                <p className="text-xs text-blue-500 mt-1">Total events</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-700 tabular-nums">{data.events.today}</p>
                <p className="text-xs text-yellow-500 mt-1">Today</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" /> Architecture
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Event store</span>
                <span className="text-green-700 font-medium">Append-only</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Mutations</span>
                <span className="text-green-700 font-medium">None (INSERT only)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">X-Robots-Tag</span>
                <span className="font-mono text-xs text-gray-600">noindex, nofollow</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-gray-500">Public links</span>
                <span className="text-green-700 font-medium">0 (isolated)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
