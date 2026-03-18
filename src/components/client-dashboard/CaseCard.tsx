'use client'

import Link from 'next/link'
import {
  ChevronRight,
  Clock,
  MapPin,
  Calendar,
  Video,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type CaseStatus = 'pending' | 'active' | 'in_progress' | 'resolved' | 'completed' | 'cancelled'

export interface CaseCardData {
  id: string
  type: 'lead' | 'booking'
  attorney_name: string | null
  attorney_id: string | null
  attorney_slug: string | null
  practice_area: string | null
  status: CaseStatus
  status_label: string
  description: string
  city: string | null
  created_at: string
  last_activity: string
  next_deadline: string | null
  event_count: number
}

interface CaseCardProps {
  caseData: CaseCardData
}

// ─── Status Config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CaseStatus, { color: string; bg: string; progressWidth: string }> = {
  pending: { color: 'text-yellow-700', bg: 'bg-yellow-100', progressWidth: 'w-1/5' },
  active: { color: 'text-blue-700', bg: 'bg-blue-100', progressWidth: 'w-2/5' },
  in_progress: { color: 'text-indigo-700', bg: 'bg-indigo-100', progressWidth: 'w-3/5' },
  resolved: { color: 'text-emerald-700', bg: 'bg-emerald-100', progressWidth: 'w-4/5' },
  completed: { color: 'text-green-700', bg: 'bg-green-100', progressWidth: 'w-full' },
  cancelled: { color: 'text-red-700', bg: 'bg-red-100', progressWidth: 'w-0' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return '1 day ago'
  if (diffD < 7) return `${diffD} days ago`
  if (diffD < 30) return `${Math.floor(diffD / 7)} weeks ago`
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

function daysSinceUpdate(dateStr: string): number {
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CaseCard({ caseData }: CaseCardProps) {
  const statusCfg = STATUS_CONFIG[caseData.status] || STATUS_CONFIG.pending
  const days = daysSinceUpdate(caseData.last_activity)
  const href = caseData.type === 'lead'
    ? `/client-dashboard/cases/${caseData.id}`
    : `/client-dashboard/cases/${caseData.id}?type=booking`

  return (
    <Link
      href={href}
      className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-600 group"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header: Practice area + badges */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {caseData.type === 'booking' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  <Video className="w-3 h-3" />
                  Consultation
                </span>
              )}
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {caseData.practice_area || 'Legal Consultation'}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                {caseData.status_label}
              </span>
            </div>

            {/* Attorney info */}
            {caseData.attorney_name && (
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 dark:text-blue-400 font-bold text-xs">
                    {caseData.attorney_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {caseData.attorney_name}
                </span>
              </div>
            )}

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
              {caseData.description}
            </p>

            {/* Progress bar */}
            {caseData.status !== 'cancelled' && (
              <div className="mb-3">
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full bg-blue-500 rounded-full transition-all ${statusCfg.progressWidth}`} />
                </div>
              </div>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                {formatRelative(caseData.last_activity)}
              </span>
              {caseData.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  {caseData.city}
                </span>
              )}
              {caseData.next_deadline && (
                <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  Deadline: {new Date(caseData.next_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
              {days > 0 && caseData.status !== 'completed' && caseData.status !== 'cancelled' && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  days > 7
                    ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                    : days > 3
                    ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : 'text-gray-400'
                }`}>
                  {days === 1 ? '1 day' : `${days} days`} since update
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 flex-shrink-0 mt-1 transition-colors" />
        </div>
      </div>
    </Link>
  )
}

export default CaseCard
