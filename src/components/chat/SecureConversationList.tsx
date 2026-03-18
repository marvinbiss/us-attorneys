'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import {
  MessageSquare,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SecureConversation {
  id: string
  client_id: string
  attorney_id: string
  subject: string | null
  status: string
  encryption_enabled: boolean
  last_message_at: string
  created_at: string
  client?: { id: string; full_name: string | null; email?: string | null }
  attorney?: { id: string; name: string | null; slug?: string | null }
  unread_count: number
  last_message_preview: string | null
  last_message_sender_type: string | null
}

interface SecureConversationListProps {
  userType: 'client' | 'attorney'
  selectedId?: string
  onSelect: (conversation: SecureConversation) => void
  className?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SecureConversationList({
  userType,
  selectedId,
  onSelect,
  className,
}: SecureConversationListProps) {
  const [conversations, setConversations] = useState<SecureConversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages')
      const data = await res.json()
      if (data.success) {
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      await fetchConversations()
      setIsLoading(false)
    }
    load()

    // Refresh every 30 seconds
    const interval = setInterval(fetchConversations, 30000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  const getDisplayName = (conv: SecureConversation) => {
    if (userType === 'client') {
      return conv.attorney?.name || 'Attorney'
    }
    return conv.client?.full_name || 'Client'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTime = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: enUS })
  }

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true
    const name = getDisplayName(conv)
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="space-y-4 p-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-gray-900', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Messages
            {totalUnread > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                {totalUnread}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">End-to-end encrypted</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
            aria-label="Search conversations"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto" role="listbox" aria-label="Conversations">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
            <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-center text-sm">
              {searchQuery
                ? 'No conversations found'
                : 'No conversations yet'}
            </p>
            {!searchQuery && userType === 'client' && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                Contact an attorney to start a secure conversation
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredConversations.map((conversation) => {
              const name = getDisplayName(conversation)

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelect(conversation)}
                  role="option"
                  aria-selected={selectedId === conversation.id}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                    selectedId === conversation.id && 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-600'
                  )}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-300 font-medium text-sm">
                        {getInitials(name)}
                      </span>
                    </div>
                    {/* Unread badge */}
                    {conversation.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3
                        className={cn(
                          'text-sm truncate',
                          conversation.unread_count > 0
                            ? 'font-semibold text-gray-900 dark:text-white'
                            : 'font-medium text-gray-700 dark:text-gray-300'
                        )}
                      >
                        {name}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    </div>

                    {/* Last message preview */}
                    <p className={cn(
                      'text-xs truncate',
                      conversation.unread_count > 0
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-500 dark:text-gray-400'
                    )}>
                      {conversation.last_message_sender_type && (
                        <span className="font-medium">
                          {conversation.last_message_sender_type === userType ? 'You: ' : ''}
                        </span>
                      )}
                      {conversation.last_message_preview || conversation.subject || 'Start a conversation'}
                    </p>

                    {/* Subject line if different from preview */}
                    {conversation.subject && !conversation.last_message_preview && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                        {conversation.subject}
                      </p>
                    )}
                  </div>

                  {/* Encryption indicator */}
                  {conversation.encryption_enabled && (
                    <ShieldCheck className="w-3.5 h-3.5 text-green-500 dark:text-green-400 flex-shrink-0 opacity-50" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default SecureConversationList
