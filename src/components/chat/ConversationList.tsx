'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { MessageSquare, Search } from 'lucide-react'
import { Input } from '@/components/ui'
import Image from 'next/image'
import { chatService, Conversation } from '@/lib/realtime/chat-service'
import { cn } from '@/lib/utils'

/** Extended conversation row with joined provider/client data from getConversations query */
interface ConversationWithJoins extends Conversation {
  provider?: { id?: string; name?: string }
  client?: { id?: string; full_name?: string }
}

interface ConversationListProps {
  userId: string
  userType: 'client' | 'attorney'
  selectedId?: string
  onSelect: (conversation: Conversation) => void
}

export function ConversationList({
  userId,
  userType,
  selectedId,
  onSelect,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true)
      const data = await chatService.getConversations(userId, userType)
      setConversations(data)
      setIsLoading(false)
    }

    loadConversations()

    // Refresh every 30 seconds
    const interval = setInterval(loadConversations, 30000)
    return () => clearInterval(interval)
  }, [userId, userType])

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true
    // The getConversations join includes provider:attorneys(id, name, ...) and client:profiles(id, full_name, ...)
    const convWithJoins = conv as ConversationWithJoins
    const displayName = userType === 'client'
      ? convWithJoins.provider?.name
      : convWithJoins.client?.full_name
    return displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const formatTime = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: enUS })
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
            <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-center">
              {searchQuery
                ? 'No conversations found'
                : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredConversations.map((conversation) => {
              const convWithJoins = conversation as ConversationWithJoins
              const name = userType === 'client'
                ? convWithJoins.provider?.name
                : convWithJoins.client?.full_name
              // avatar_url was dropped from providers; not reliably available
              const avatar: string | undefined = undefined

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelect(conversation)}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                    selectedId === conversation.id && 'bg-blue-50 dark:bg-blue-900/20'
                  )}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {avatar ? (
                      <Image
                        src={avatar}
                        alt={name ?? ''}
                        width={48}
                        height={48}
                        sizes="48px"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-300 font-medium text-lg">
                          {name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* Unread badge */}
                    {conversation.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                        {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={cn(
                          'font-medium truncate',
                          conversation.unread_count > 0
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300'
                        )}
                      >
                        {name || 'User'}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    </div>
                    {/* Last message preview would go here if we had it */}
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {conversation.booking_id
                        ? 'Active booking'
                        : conversation.quote_id
                        ? 'Quote request'
                        : 'Conversation'}
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
