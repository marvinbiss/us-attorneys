'use client'

import { useState } from 'react'
import {
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
} from 'lucide-react'
import { ReportStatusBadge, StatusBadge } from '@/components/admin/StatusBadge'
import { ErrorBanner } from '@/components/admin/ErrorBanner'
import { useAdminFetch, adminMutate } from '@/hooks/admin/useAdminFetch'

interface Report {
  id: string
  reporter_id: string | null
  reporter_email: string | null
  target_type: 'provider' | 'review' | 'user' | 'message'
  target_id: string
  reason: 'spam' | 'inappropriate' | 'fake' | 'harassment' | 'other'
  description: string | null
  status: 'pending' | 'reviewed' | 'dismissed'
  reviewed_by: string | null
  resolution: string | null
  created_at: string
  reviewed_at: string | null
}

interface ReportsResponse {
  reports: Report[]
  totalPages: number
  total: number
}

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  inappropriate: 'Inappropriate content',
  fake: 'Fake content',
  harassment: 'Harassment',
  other: 'Other',
}

const TARGET_TYPE_LABELS: Record<string, string> = {
  provider: 'Attorney',
  review: 'Review',
  user: 'User',
  message: 'Message',
}

export default function AdminSignalementsPage() {
  const [status, setStatus] = useState<'all' | 'pending' | 'reviewed' | 'dismissed'>('pending')
  const [targetType, setTargetType] = useState<'all' | 'provider' | 'review' | 'user' | 'message'>('all')
  const [page, setPage] = useState(1)
  const [actionError, setActionError] = useState<string | null>(null)

  const [actionModal, setActionModal] = useState<{
    open: boolean
    reportId: string
    action: 'resolve' | 'dismiss'
  }>({
    open: false,
    reportId: '',
    action: 'resolve',
  })
  const [resolutionNotes, setResolutionNotes] = useState('')

  const url = `/api/admin/reports?page=${page}&limit=20&status=${status}&targetType=${targetType}`
  const { data, isLoading, error, mutate } = useAdminFetch<ReportsResponse>(url)

  const reports = data?.reports || []
  const totalPages = data?.totalPages || 1
  const total = data?.total || 0

  const handleAction = async () => {
    try {
      setActionError(null)
      await adminMutate(`/api/admin/reports/${actionModal.reportId}`, {
        method: 'PUT',
        body: {
          action: actionModal.action,
          resolution: resolutionNotes,
        },
      })
      setActionModal({ open: false, reportId: '', action: 'resolve' })
      setResolutionNotes('')
      mutate()
    } catch {
      setActionError('Error processing report')
    }
  }

  const displayError = actionError || (error ? error.message : null)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getReasonBadge = (reason: string) => {
    const variants: Record<string, 'error' | 'warning' | 'default'> = {
      harassment: 'error',
      inappropriate: 'error',
      spam: 'warning',
      fake: 'warning',
      other: 'default',
    }
    return <StatusBadge variant={variants[reason] || 'default'}>{REASON_LABELS[reason] || reason}</StatusBadge>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Report management</h1>
          <p className="text-gray-500 mt-1">{total} reports</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex gap-2 flex-wrap">
              {(['all', 'pending', 'reviewed', 'dismissed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s)
                    setPage(1)
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    status === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s === 'all' ? 'All' :
                   s === 'pending' ? 'Pending' :
                   s === 'reviewed' ? 'Reviewed' : 'Dismissed'}
                </button>
              ))}
            </div>
            <select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value as typeof targetType)
                setPage(1)
              }}
              aria-label="Filter by target type"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All types</option>
              <option value="provider">Attorneys</option>
              <option value="review">Reviews</option>
              <option value="user">Users</option>
              <option value="message">Messages</option>
            </select>
          </div>
        </div>

        {/* Error Banner */}
        {displayError && <ErrorBanner message={displayError} onDismiss={() => setActionError(null)} onRetry={() => mutate()} />}

        {/* Reports List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Flag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No reports found</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {reports.map((report) => (
                  <div key={report.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <AlertTriangle className={`w-5 h-5 ${
                            report.reason === 'harassment' || report.reason === 'inappropriate'
                              ? 'text-red-500'
                              : 'text-amber-500'
                          }`} />
                          {getReasonBadge(report.reason)}
                          <ReportStatusBadge status={report.status} />
                          <StatusBadge variant="default">
                            {TARGET_TYPE_LABELS[report.target_type]}
                          </StatusBadge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          {report.reporter_email && (
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {report.reporter_email}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(report.created_at)}
                          </span>
                        </div>

                        {report.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            {report.description}
                          </p>
                        )}

                        {report.resolution && (
                          <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-600">
                            <strong>Resolution:</strong> {report.resolution}
                          </div>
                        )}
                      </div>

                      {report.status === 'pending' && (
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => setActionModal({
                              open: true,
                              reportId: report.id,
                              action: 'resolve',
                            })}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Resolve"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setActionModal({
                              open: true,
                              reportId: report.id,
                              action: 'dismiss',
                            })}
                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                            title="Dismiss"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setActionModal({ open: false, reportId: '', action: 'resolve' })} />
            <div role="dialog" aria-modal="true" aria-labelledby="action-modal-title" className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 id="action-modal-title" className="text-lg font-semibold text-gray-900 mb-4">
                {actionModal.action === 'resolve' ? 'Resolve report' : 'Dismiss report'}
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Describe the actions taken..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setActionModal({ open: false, reportId: '', action: 'resolve' })
                    setResolutionNotes('')
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  className={`flex-1 px-4 py-2 text-white rounded-lg ${
                    actionModal.action === 'resolve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {actionModal.action === 'resolve' ? 'Resolve' : 'Dismiss'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
