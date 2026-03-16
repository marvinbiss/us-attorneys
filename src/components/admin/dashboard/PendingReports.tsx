'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { ConfirmationModal } from '@/components/admin/ConfirmationModal'
import { Toast } from '@/components/admin/Toast'
import { adminMutate } from '@/hooks/admin/useAdminFetch'

interface Report {
  id: string
  target_type: string
  reason: string
  description: string | null
  status: string
  created_at: string
  reporter_id: string | null
}

interface PendingReportsProps {
  reports: Report[]
  loading?: boolean
  onMutate: () => void
}

const reasonLabels: Record<string, string> = {
  spam: 'Spam',
  inappropriate: 'Inappropriate',
  fake: 'Fake content',
  harassment: 'Harassment',
  other: 'Other',
}

const targetLabels: Record<string, string> = {
  review: 'Review',
  user: 'User',
  provider: 'Attorney',
  artisan: 'Attorney',
  message: 'Message',
}

const reasonColors: Record<string, string> = {
  spam: 'bg-amber-100 text-amber-600',
  fake: 'bg-red-100 text-red-600',
  inappropriate: 'bg-orange-100 text-orange-600',
  harassment: 'bg-red-100 text-red-600',
  other: 'bg-gray-100 text-gray-600',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function SkeletonReport() {
  return (
    <div className="p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-gray-200 rounded-lg shrink-0" />
        <div className="flex-1">
          <div className="w-28 h-4 bg-gray-200 rounded mb-2" />
          <div className="w-56 h-3 bg-gray-200 rounded mb-2" />
          <div className="w-20 h-3 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )
}

export function PendingReports({ reports, loading, onMutate }: PendingReportsProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [modal, setModal] = useState<{
    open: boolean
    reportId: string
    action: 'resolve' | 'dismiss'
  }>({ open: false, reportId: '', action: 'resolve' })

  const handleAction = (reportId: string, action: 'resolve' | 'dismiss') => {
    setResolutionNotes('')
    setModal({ open: true, reportId, action })
  }

  const confirmAction = async () => {
    const { reportId, action } = modal
    const notes = resolutionNotes.trim()
    setModal({ open: false, reportId: '', action: 'resolve' })
    setResolutionNotes('')

    try {
      setActionLoading(reportId)
      await adminMutate(`/api/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        body: { action, ...(notes ? { resolution: notes } : {}) },
      })
      setToast({
        message: action === 'resolve' ? 'Report resolved' : 'Report dismissed',
        type: 'success',
      })
      onMutate()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error processing report'
      setToast({ message, type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100" role="region" aria-label="Pending reports">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Reports</h3>
            {reports.length > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                {reports.length}
              </span>
            )}
          </div>
          <Link
            href="/admin/reports"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            Array.from({ length: 3 }, (_, i) => <SkeletonReport key={i} />)
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
              <p className="font-medium">No pending reports</p>
              <p className="text-sm mt-1">All reports have been processed</p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${reasonColors[report.reason] || reasonColors.other}`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">
                          {targetLabels[report.target_type] || report.target_type}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {reasonLabels[report.reason] || report.reason}
                        </span>
                      </div>
                      {report.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{report.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{formatDate(report.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleAction(report.id, 'resolve')}
                      disabled={actionLoading === report.id}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Resolve"
                      aria-label="Resolve this report"
                    >
                      {actionLoading === report.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleAction(report.id, 'dismiss')}
                      disabled={actionLoading === report.id}
                      className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Dismiss"
                      aria-label="Dismiss this report"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={modal.open}
        onClose={() => { setModal({ open: false, reportId: '', action: 'resolve' }); setResolutionNotes('') }}
        onConfirm={confirmAction}
        title={modal.action === 'resolve' ? 'Resolve report' : 'Dismiss report'}
        message={`Are you sure you want to ${modal.action === 'resolve' ? 'resolve' : 'dismiss'} this report?`}
        confirmText={modal.action === 'resolve' ? 'Resolve' : 'Dismiss'}
        variant={modal.action === 'resolve' ? 'success' : 'warning'}
      >
        <div className="mb-4">
          <label htmlFor="resolution-notes" className="block text-sm font-medium text-gray-700 mb-1">
            Resolution notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="resolution-notes"
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Describe the reason for your decision..."
            maxLength={1000}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
      </ConfirmationModal>
    </>
  )
}
