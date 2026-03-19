'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import {
  Lock,
  Download,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmationModal } from '@/components/admin/ConfirmationModal'

interface GdprRequest {
  id: string
  user_id: string | null
  user_email: string
  request_type: 'export' | 'delete'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  processed_by: string | null
  notes: string | null
  created_at: string
  processed_at: string | null
}

export default function AdminRgpdPage() {
  const [requests, setRequests] = useState<GdprRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'all' | 'pending' | 'processing' | 'completed'>('pending')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [_total, setTotal] = useState(0)

  // Search user for manual action
  const [searchEmail, setSearchEmail] = useState('')
  const [foundUser, setFoundUser] = useState<{ id: string; email: string; full_name: string | null } | null>(null)
  const [searching, setSearching] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modal
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; userId: string; userName: string }>({
    open: false,
    userId: '',
    userName: '',
  })
  const [exportingUser, setExportingUser] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [page, status])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        status,
      })
      const response = await fetch(`/api/admin/gdpr?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
        setTotalPages(data.totalPages || 1)
        setTotal(data.total || 0)
      }
    } catch (error: unknown) {
      logger.error('Failed to fetch GDPR requests', error)
    } finally {
      setLoading(false)
    }
  }

  const searchUser = async () => {
    if (!searchEmail) return
    try {
      setSearching(true)
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(searchEmail)}&limit=1`)
      if (response.ok) {
        const data = await response.json()
        if (data.users && data.users.length > 0) {
          setFoundUser(data.users[0])
        } else {
          setFoundUser(null)
          setToast({ type: 'error', message: 'User not found' })
        }
      }
    } catch (error: unknown) {
      logger.error('Search failed', error)
    } finally {
      setSearching(false)
    }
  }

  const handleExport = async (userId: string) => {
    try {
      setExportingUser(userId)
      const response = await fetch(`/api/admin/gdpr/export/${userId}`, {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        // Download the JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `export_gdpr_${userId}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error: unknown) {
      logger.error('Export failed', error)
    } finally {
      setExportingUser(null)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/gdpr/delete/${deleteModal.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmDelete: 'DELETE' }),
      })
      if (response.ok) {
        setDeleteModal({ open: false, userId: '', userName: '' })
        setFoundUser(null)
        setSearchEmail('')
        fetchRequests()
      }
    } catch (error: unknown) {
      logger.error('Delete failed', error)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'warning' | 'info' | 'success' | 'error'; label: string }> = {
      pending: { variant: 'warning', label: 'Pending' },
      processing: { variant: 'info', label: 'Processing' },
      completed: { variant: 'success', label: 'Completed' },
      failed: { variant: 'error', label: 'Failed' },
    }
    const { variant, label } = config[status] || config.pending
    return <StatusBadge variant={variant}>{label}</StatusBadge>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">GDPR Compliance</h1>
          <p className="text-gray-500 mt-1">Manage data export and deletion requests</p>
        </div>

        {/* Manual Action Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Manual action</h2>

          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="Search for a user by email..."
                aria-label="Search for a user by email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUser()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={searchUser}
              disabled={searching || !searchEmail}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {foundUser && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-full">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{foundUser.full_name || 'No name'}</p>
                    <p className="text-sm text-gray-500">{foundUser.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport(foundUser.id)}
                    disabled={exportingUser === foundUser.id}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    {exportingUser === foundUser.id ? 'Exporting...' : 'Export'}
                  </button>
                  <button
                    onClick={() => setDeleteModal({
                      open: true,
                      userId: foundUser.id,
                      userName: foundUser.full_name || foundUser.email,
                    })}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Warning</p>
            <p className="text-sm text-amber-700">
              Data deletion is irreversible. Make sure you have performed an export before any deletion.
              Data will be anonymized in compliance with GDPR.
            </p>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">GDPR Requests</h2>
              <div className="flex gap-2">
                {(['all', 'pending', 'processing', 'completed'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatus(s)
                      setPage(1)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      status === s
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s === 'all' ? 'All' :
                     s === 'pending' ? 'Pending' :
                     s === 'processing' ? 'Processing' : 'Completed'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Lock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No GDPR requests</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {requests.map((request) => (
                  <div key={request.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          request.request_type === 'export' ? 'bg-blue-100' : 'bg-red-100'
                        }`}>
                          {request.request_type === 'export' ? (
                            <Download className={`w-5 h-5 text-blue-600`} />
                          ) : (
                            <Trash2 className={`w-5 h-5 text-red-600`} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{request.user_email}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {request.request_type === 'export' ? 'Export' : 'Deletion'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(request.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
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

      {toast && (
        <div role="status" aria-live="polite" className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-current opacity-50 hover:opacity-100" aria-label="Close">×</button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, userId: '', userName: '' })}
        onConfirm={handleDelete}
        title="Delete user data"
        message={`Are you sure you want to delete all data for ${deleteModal.userName}? This action is irreversible and the data will be anonymized.`}
        confirmText="Delete permanently"
        variant="danger"
        requireConfirmation="DELETE"
      />
    </div>
  )
}
