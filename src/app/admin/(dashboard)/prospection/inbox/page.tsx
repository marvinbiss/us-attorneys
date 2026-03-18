'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ProspectionNav } from '@/components/admin/prospection/ProspectionNav'
import { ChannelIcon, ContactTypeBadge } from '@/components/admin/prospection/StatsCards'
import { MessageCircle, Bot, User, AlertCircle } from 'lucide-react'
import type { ProspectionConversation } from '@/types/prospection'

const statusLabels: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-green-100 text-green-700' },
  ai_handling: { label: 'AI Handling', color: 'bg-blue-100 text-blue-700' },
  human_required: { label: 'Human Required', color: 'bg-red-100 text-red-700' },
  resolved: { label: 'Resolved', color: 'bg-gray-100 text-gray-700' },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-500' },
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<ProspectionConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchConversations = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      setError(null)
      const params = new URLSearchParams({ status: statusFilter })
      const res = await fetch(`/api/admin/prospection/conversations?${params}`, { signal })
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      const data = await res.json()
      if (data.success) setConversations(data.data)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError('Loading error')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    const controller = new AbortController()
    fetchConversations(controller.signal)
    return () => controller.abort()
  }, [fetchConversations])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Prospection</h1>
        <p className="text-gray-500 mt-1">Inbox - Conversations with contacts</p>
      </div>

      <ProspectionNav />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {['all', 'human_required', 'open', 'ai_handling', 'resolved'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg border ${statusFilter === s ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-gray-50'}`}
          >
            {s === 'all' ? 'All' : statusLabels[s]?.label || s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border divide-y">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No conversations. Replies to your campaigns will appear here.</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const contact = conv.contact as { contact_name?: string; company_name?: string; email?: string; contact_type?: string } | undefined
            const status = statusLabels[conv.status] || { label: conv.status, color: 'bg-gray-100' }
            return (
              <Link
                key={conv.id}
                href={`/admin/prospection/inbox/${conv.id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${conv.status === 'ai_handling' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {conv.status === 'ai_handling' ? <Bot className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4 text-gray-500" />}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">
                        {contact?.contact_name || contact?.company_name || contact?.email || 'Contact'}
                      </span>
                      {contact?.contact_type && <ContactTypeBadge type={contact.contact_type} />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChannelIcon channel={conv.channel} className="w-4 h-4 text-gray-400" />
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                  </div>
                </div>
                <div className="ml-10 text-sm text-gray-500">
                  {conv.ai_replies_count > 0 && <span className="mr-3">{conv.ai_replies_count} AI replies</span>}
                  {conv.last_message_at && (
                    <span>{new Date(conv.last_message_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
