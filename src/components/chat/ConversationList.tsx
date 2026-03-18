'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import {
  MessageSquare,
  Search,
  Plus,
  Shield,
  Filter,
  Archive,
  Mail,
  MailOpen,
} from 'lucide-react'
import { Input } from '@/components/ui'
import Image from 'next/image'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversationListItem {
  id: string
  client_id: string
  attorney_id: string
  subject?: string
  status: 'active' | 'archived' | 'blocked'
  encryption_enabled?: boolean
  last_message_at: string
  created_at: string
  unread_count: number
  last_message_preview?: string | null
  last_message_sender_type?: string | null
  client?: { id?: string; full_name?: string; email?: string }
  attorney?: { id?: string; name?: string; slug?: string }
}

type FilterTab = 'all' | 'unread' | 'archived'

interface ConversationListProps {
  userId: string
  userType: 'client' | 'attorney'
  selectedId?: string
  onSelect: (conversation: ConversationListItem) => void
  onNewConversation?: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConversationList({
  userId: _userId,
  userType,
  selectedId,
  onSelect,
  onNewConversation,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  const fetchConversations = useCallback(async () => {
    try {
      const status = activeFilter === 'archived' ? 'archived' : 'active'
      const res = await fetch(`/api/messages?status=${status}`)
      const data = await res.json()
      if (data.success) {
        setConversations(data.conversations || [])
      }
    } catch {
      // Silently handle errors; will retry on next interval
    } finally {
      setIsLoading(false)
    }
  }, [activeFilter])

  useEffect(() => {
    setIsLoading(true)
    fetchConversations()

    // Refresh every 15 seconds
    const interval = setInterval(fetchConversations, 15000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------

  const filteredConversations = conversations.filter((conv) => {
    // Search filter
    if (searchQuery) {
      const displayName =
        userType === 'client'
          ? conv.attorney?.name
          : conv.client?.full_name
      const subject = conv.subject || ''
      const haystack = `${displayName || ''} ${subject}`.toLowerCase()
      if (!haystack.includes(searchQuery.toLowerCase())) return false
    }

    // Tab filter
    if (activeFilter === 'unread') {
      return conv.unread_count > 0
    }

    return true
  })

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const formatTime = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: enUS,
    })
  }

  const getDisplayName = (conv: ConversationListItem) => {
    if (userType === 'client') {
      return conv.attorney?.name || 'Attorney'
    }
    return conv.client?.full_name || 'Client'
  }

  const getInitial = (conv: ConversationListItem) => {
    const name = getDisplayName(conv)
    return name.charAt(0).toUpperCase()
  }

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)

  // ---------------------------------------------------------------------------
  // Filter tabs
  // ---------------------------------------------------------------------------

  const filterTabs: { key: FilterTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'all', label: 'All', icon: <Mail className="w-4 h-4" /> },
    {
      key: 'unread',
      label: 'Unread',
      icon: <MailOpen className="w-4 h-4" />,
      badge: totalUnread > 0 ? totalUnread : undefined,
    },
    { key: 'archived', label: 'Archived', icon: <Archive className="w-4 h-4" /> },
  ]

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-1 p-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header with search + new conversation */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Messages
          </h2>
          {onNewConversation && (
            <button
              onClick={onNewConversation}
              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              title="New conversation"
              aria-label="Start new conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Search conversations"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1" role="tablist" aria-label="Filter conversations">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeFilter === tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                activeFilter === tab.key
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full min-w-[20px] text-center">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto" role="listbox" aria-label="Conversations">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-6">
            {activeFilter === 'unread' ? (
              <>
                <Filter className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm text-center">No unread conversations</p>
              </>
            ) : activeFilter === 'archived' ? (
              <>
                <Archive className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm text-center">No archived conversations</p>
              </>
            ) : searchQuery ? (
              <>
                <Search className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm text-center">
                  No conversations matching &ldquo;{searchQuery}&rdquo;
                </p>
              </>
            ) : (
              <>
                <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm text-center font-medium mb-1">No conversations yet</p>
                <p className="text-xs text-center">
                  {userType === 'client'
                    ? 'Contact an attorney to start a conversation'
                    : 'Conversations with clients will appear here'}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredConversations.map((conversation) => {
              const name = getDisplayName(conversation)
              const avatar: string | undefined = undefined

              return (
                <button
                  key={conversation.id}
                  role="option"
                  aria-selected={selectedId === conversation.id}
                  onClick={() => onSelect(conversation)}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset',
                    selectedId === conversation.id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {avatar ? (
                      <Image
                        src={avatar}
                        alt={name}
                        width={48}
                        height={48}
                        sizes="48px"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-300 font-medium text-lg">
                          {getInitial(conversation)}
                        </span>
                      </div>
                    )}
                    {/* Unread badge */}
                    {conversation.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {conversation.unread_count > 9
                          ? '9+'
                          : conversation.unread_count}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
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
                        {conversation.encryption_enabled && (
                          <Shield
                            className="w-3.5 h-3.5 text-green-500 flex-shrink-0"
                            aria-label="Encrypted"
                          />
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    </div>

                    {/* Subject */}
                    {conversation.subject && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-0.5">
                        {conversation.subject}
                      </p>
                    )}

                    {/* Last message preview */}
                    <p
                      className={cn(
                        'text-sm truncate',
                        conversation.unread_count > 0
                          ? 'text-gray-700 dark:text-gray-200'
                          : 'text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {conversation.last_message_preview
                        ? conversation.last_message_preview
                        : conversation.status === 'archived'
                        ? 'Archived conversation'
                        : 'No messages yet'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ConversationList
