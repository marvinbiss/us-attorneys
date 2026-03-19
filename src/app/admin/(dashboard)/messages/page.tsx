'use client'

import { useState } from 'react'
import {
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  User,
  Briefcase,
  Clock,
  Archive,
  Ban,
} from 'lucide-react'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ErrorBanner } from '@/components/admin/ErrorBanner'
import { useAdminFetch, adminMutate } from '@/hooks/admin/useAdminFetch'

interface Conversation {
  id: string
  client_id: string
  attorney_id: string
  status: 'active' | 'archived' | 'blocked'
  last_message_at: string | null
  unread_count: number
  created_at: string
  client?: {
    id: string
    email: string
    full_name: string | null
  }
  provider?: {
    id: string
    email: string
    full_name: string | null
    name: string | null
  }
}

interface MessagesResponse {
  conversations: Conversation[]
  totalPages: number
  total: number
}

export default function AdminMessagesPage() {
  const [status, setStatus] = useState<'all' | 'active' | 'archived' | 'blocked'>('all')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams({
    page: String(page),
    limit: '20',
    status,
  })

  const { data, isLoading, error, mutate } = useAdminFetch<MessagesResponse>(
    `/api/admin/messages?${params}`
  )

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const conversations = data?.conversations || []
  const totalPages = data?.totalPages || 1
  const total = data?.total || 0

  const handleStatusChange = async (conversationId: string, newStatus: 'archived' | 'blocked') => {
    try {
      setActionLoading(conversationId)
      await adminMutate(`/api/admin/messages/${conversationId}`, {
        method: 'PATCH',
        body: { status: newStatus },
      })
      mutate()
    } catch {
      // Error will surface via SWR on next revalidation
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'success' | 'default' | 'error'; label: string }> = {
      active: { variant: 'success', label: 'Active' },
      archived: { variant: 'default', label: 'Archived' },
      blocked: { variant: 'error', label: 'Blocked' },
    }
    const { variant, label } = config[status] || config.active
    return <StatusBadge variant={variant}>{label}</StatusBadge>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Message Moderation</h1>
          <p className="mt-1 text-gray-500">{total} conversations</p>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex gap-2">
            {(['all', 'active', 'archived', 'blocked'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s)
                  setPage(1)
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  status === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === 'all'
                  ? 'All'
                  : s === 'active'
                    ? 'Active'
                    : s === 'archived'
                      ? 'Archived'
                      : 'Blocked'}
              </button>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && <ErrorBanner message={error.message} onRetry={() => mutate()} />}

        {/* Conversations List */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p>No conversations found</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {conversations.map((conversation) => (
                  <div key={conversation.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-3 flex items-center gap-3">
                          {getStatusBadge(conversation.status)}
                          {conversation.unread_count > 0 && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {conversation.unread_count} unread
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {/* Client */}
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-gray-100 p-2">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-xs uppercase text-gray-500">Client</p>
                              <p className="font-medium text-gray-900">
                                {conversation.client?.full_name || 'No name'}
                              </p>
                              <p className="text-sm text-gray-500">{conversation.client?.email}</p>
                            </div>
                          </div>

                          {/* Provider */}
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-blue-100 p-2">
                              <Briefcase className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs uppercase text-gray-500">Attorney</p>
                              <p className="font-medium text-gray-900">
                                {conversation.provider?.name ||
                                  conversation.provider?.full_name ||
                                  'No name'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {conversation.provider?.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Last message: {formatDate(conversation.last_message_at)}
                          </span>
                          <span>Created {formatDate(conversation.created_at)}</span>
                        </div>
                      </div>

                      <div className="ml-4 flex items-center gap-2">
                        {conversation.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(conversation.id, 'archived')}
                              disabled={actionLoading === conversation.id}
                              className="rounded-lg p-2 text-gray-400 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50"
                              title="Archive"
                              aria-label="Archive conversation"
                            >
                              <Archive className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(conversation.id, 'blocked')}
                              disabled={actionLoading === conversation.id}
                              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              title="Block"
                              aria-label="Block conversation"
                            >
                              <Ban className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
