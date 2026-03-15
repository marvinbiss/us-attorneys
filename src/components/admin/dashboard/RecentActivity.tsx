'use client'

import Link from 'next/link'
import { Calendar, Star, AlertTriangle, Users, Activity, ArrowRight } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'booking' | 'review' | 'report' | 'user'
  action: string
  details: string
  timestamp: string
  status?: string
}

interface RecentActivityProps {
  activity: ActivityItem[]
  loading?: boolean
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`
  return new Date(iso).toLocaleDateString('en-US')
}

const typeConfig: Record<string, { icon: typeof Calendar; bg: string }> = {
  booking: { icon: Calendar, bg: 'bg-green-100 text-green-600' },
  review: { icon: Star, bg: 'bg-amber-100 text-amber-600' },
  report: { icon: AlertTriangle, bg: 'bg-red-100 text-red-600' },
  user: { icon: Users, bg: 'bg-blue-100 text-blue-600' },
}

const statusLabels: Record<string, { label: string; classes: string }> = {
  confirmed: { label: 'Confirmed', classes: 'bg-green-100 text-green-700' },
  pending: { label: 'Pending', classes: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', classes: 'bg-blue-100 text-blue-700' },
  published: { label: 'Published', classes: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', classes: 'bg-red-100 text-red-700' },
  in_progress: { label: 'In progress', classes: 'bg-blue-100 text-blue-700' },
}

function SkeletonRow() {
  return (
    <div className="p-4 flex items-center gap-4 animate-pulse">
      <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="w-32 h-4 bg-gray-200 rounded mb-2" />
        <div className="w-48 h-3 bg-gray-200 rounded" />
      </div>
      <div className="w-16 h-3 bg-gray-200 rounded shrink-0" />
    </div>
  )
}

export function RecentActivity({ activity, loading }: RecentActivityProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100" role="region" aria-label="Recent activity">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Recent activity</h3>
        <Link
          href="/admin/journal"
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="divide-y divide-gray-100">
        {loading ? (
          Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} />)
        ) : activity.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No recent activity</p>
          </div>
        ) : (
          activity.map((item) => {
            const config = typeConfig[item.type] || typeConfig.user
            const Icon = config.icon
            const statusInfo = item.status
              ? statusLabels[item.status] ?? { label: item.status, classes: 'bg-gray-100 text-gray-700' }
              : null
            return (
              <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className={`p-2 rounded-lg shrink-0 ${config.bg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.action}</p>
                  <p className="text-sm text-gray-500 truncate">{item.details}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">{formatRelativeTime(item.timestamp)}</p>
                  {statusInfo && (
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${statusInfo.classes}`}>
                      {statusInfo.label}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
