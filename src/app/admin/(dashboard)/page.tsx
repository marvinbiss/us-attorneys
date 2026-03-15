'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Shield, Activity, Star, AlertTriangle, ArrowRight, MessageSquare, Phone } from 'lucide-react'
import { ErrorBanner } from '@/components/admin/ErrorBanner'
import { useAdminFetch } from '@/hooks/admin/useAdminFetch'
import { StatsGrid } from '@/components/admin/dashboard/StatsGrid'
import { RecentActivity } from '@/components/admin/dashboard/RecentActivity'
import { PendingReports } from '@/components/admin/dashboard/PendingReports'

class ChartErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ActivityChart] render error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-center py-12">
            Unable to load chart. Please reload the page.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

// Lazy-load recharts bundle (~150KB) — only fetched when dashboard renders
const ActivityChart = dynamic(
  () => import('@/components/admin/dashboard/ActivityChart').then(m => ({ default: m.ActivityChart })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="w-48 h-5 bg-gray-200 rounded mb-6" />
        <div className="w-full h-[300px] bg-gray-50 rounded" />
      </div>
    ),
  }
)

interface StatsResponse {
  stats: {
    totalUsers: number
    totalArtisans: number
    totalBookings: number
    totalRevenue: number
    pendingReports: number
    averageRating: number
    newUsersToday: number
    newBookingsToday: number
    activeUsers7d: number
    trends: {
      users: number
      bookings: number
      revenue: number
    }
  }
  recentActivity: Array<{
    id: string
    type: 'booking' | 'review' | 'report' | 'user'
    action: string
    details: string
    timestamp: string
    status?: string
  }>
  pendingReports: Array<{
    id: string
    target_type: string
    reason: string
    description: string | null
    status: string
    created_at: string
    reporter_id: string | null
  }>
  chartData: Array<{
    date: string
    bookings: number
    users: number
    reviews: number
  }>
  estimationLeads: {
    total: number
    today: number
    recent: Array<{
      id: string
      nom: string | null
      telephone: string
      metier: string
      ville: string
      source: string
      created_at: string
    }>
  }
}

export default function AdminDashboard() {
  const { data, isLoading, error, mutate } = useAdminFetch<StatsResponse>('/api/admin/stats')

  return (
    <div className="min-h-screen bg-gray-50" aria-label="Admin Dashboard">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">Platform overview</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {data?.stats && data.stats.pendingReports > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  {data.stats.pendingReports} report{data.stats.pendingReports > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error && (
          <ErrorBanner
            message={error.message}
            onDismiss={() => mutate()}
            onRetry={() => mutate()}
          />
        )}

        {/* Stats Grid with trends */}
        <StatsGrid stats={data?.stats ?? null} loading={isLoading} />

        {/* Quick metrics row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Today</h3>
            </div>
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">New Users</span>
                  <span className="font-semibold">{data?.stats?.newUsersToday ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">New Bookings</span>
                  <span className="font-semibold">{data?.stats?.newBookingsToday ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Users (7d)</span>
                  <span className="font-semibold">{data?.stats?.activeUsers7d ?? 0}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quality */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-gray-900">Quality</h3>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-4 animate-pulse">
                <div className="w-16 h-10 bg-gray-200 rounded" />
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-2xl sm:text-4xl font-bold text-gray-900">
                  {data?.stats?.averageRating ?? 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Average Rating</p>
                <div className="flex justify-center mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(data?.stats?.averageRating ?? 0)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Moderation */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-gray-900">Moderation</h3>
            </div>
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-10 bg-gray-200 rounded w-full mt-2" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending Reports</span>
                  <span
                    className={`px-2 py-1 rounded-full text-sm font-medium ${
                      (data?.stats?.pendingReports ?? 0) > 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {data?.stats?.pendingReports ?? 0}
                  </span>
                </div>
                <Link
                  href="/admin/signalements"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  View Reports
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Estimation Leads Widget */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 gap-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">AI Estimation Leads</h3>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {!isLoading && (
                <>
                  <span className="text-sm text-gray-500">
                    Total : <span className="font-semibold text-gray-900">{data?.estimationLeads?.total ?? 0}</span>
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (data?.estimationLeads?.today ?? 0) > 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {data?.estimationLeads?.today ?? 0} today
                  </span>
                </>
              )}
              <Link
                href="/admin/estimation-leads"
                className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                View All
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          {isLoading ? (
            <div className="p-6 space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded" />
              ))}
            </div>
          ) : (data?.estimationLeads?.recent?.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No estimation leads yet
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data?.estimationLeads?.recent?.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-gray-50 transition-colors gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                      lead.source === 'chat' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {lead.source === 'chat' ? 'Chat' : 'Callback'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {lead.nom || lead.telephone} — {lead.metier}
                      </p>
                      <p className="text-xs text-gray-500">{lead.ville}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <a
                      href={`tel:${lead.telephone}`}
                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                      title={`Call ${lead.telephone}`}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <span className="text-xs text-gray-400">
                      {new Date(lead.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Chart */}
        <ChartErrorBoundary>
          <ActivityChart data={data?.chartData ?? []} loading={isLoading} />
        </ChartErrorBoundary>

        {/* Two columns: Recent Activity + Pending Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <RecentActivity activity={data?.recentActivity ?? []} loading={isLoading} />
          </div>
          <div className="lg:col-span-2">
            <PendingReports
              reports={data?.pendingReports ?? []}
              loading={isLoading}
              onMutate={() => mutate()}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
