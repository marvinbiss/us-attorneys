'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Paperclip, Image, Check, CheckCheck } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import NextImage from 'next/image'
import { chatService, ChatMessage, TypingIndicator } from '@/lib/realtime/chat-service'
import { cn } from '@/lib/utils'

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  currentUserType: 'client' | 'artisan'
  otherUserName: string
  otherUserAvatar?: string
}

export function ChatWindow({
  conversationId,
  currentUserId,
  currentUserType,
  otherUserName,
  otherUserAvatar,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingIndicator>>(new Map())
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Load initial messages
  useEffect(() => {
    let scrollTimer: ReturnType<typeof setTimeout>
    const loadMessages = async () => {
      setIsLoading(true)
      const msgs = await chatService.getMessages(conversationId)
      setMessages(msgs)
      setIsLoading(false)
      scrollTimer = setTimeout(scrollToBottom, 100)
    }
    loadMessages()
    return () => clearTimeout(scrollTimer)
  }, [conversationId, scrollToBottom])

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = chatService.subscribeToConversation(conversationId, {
      onMessage: (message) => {
        setMessages((prev) => [...prev, message])
        scrollToBottom()
        // Mark as read if not from current user
        if (message.sender_id !== currentUserId) {
          chatService.markMessagesAsRead(conversationId, currentUserId)
        }
      },
      onTyping: (indicator) => {
        setTypingUsers((prev) => {
          const next = new Map(prev)
          if (indicator.is_typing) {
            next.set(indicator.user_id, indicator)
          } else {
            next.delete(indicator.user_id)
          }
          return next
        })
      },
      onPresence: (users) => {
        setOnlineUsers(users)
      },
    })

    // Track presence
    chatService.trackPresence(conversationId, currentUserId, currentUserType)

    // Mark existing messages as read
    chatService.markMessagesAsRead(conversationId, currentUserId)

    return () => {
      unsubscribe()
    }
  }, [conversationId, currentUserId, currentUserType, scrollToBottom])

  // Handle sending message
  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    const content = newMessage.trim()
    setNewMessage('')

    await chatService.sendMessage(
      conversationId,
      content,
      currentUserId,
      currentUserType
    )

    setIsSending(false)
    inputRef.current?.focus()
  }

  // Handle typing indicator
  const handleTyping = () => {
    chatService.sendTypingIndicator(
      conversationId,
      currentUserId,
      currentUserType,
      true
    )
  }

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  // Format date separator
  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier'
    }
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  // Check if we need a date separator
  const needsDateSeparator = (index: number) => {
    if (index === 0) return true
    const currentDate = new Date(messages[index].created_at).toDateString()
    const prevDate = new Date(messages[index - 1].created_at).toDateString()
    return currentDate !== prevDate
  }

  // Get typing indicator text
  const getTypingText = () => {
    const typingUsersList = Array.from(typingUsers.values()).filter(
      (t) => t.user_id !== currentUserId
    )
    if (typingUsersList.length === 0) return null
    return `${otherUserName} écrit...`
  }

  const isOtherUserOnline = onlineUsers.some((u) => u !== currentUserId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          {otherUserAvatar ? (
            <NextImage
              src={otherUserAvatar}
              alt={otherUserName}
              width={40}
              height={40}
              sizes="40px"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-300 font-medium">
                {otherUserName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {isOtherUserOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
          )}
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">{otherUserName}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isOtherUserOnline ? 'En ligne' : 'Hors ligne'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isOwn = message.sender_id === currentUserId

          return (
            <div key={message.id}>
              {needsDateSeparator(index) && (
                <div className="flex items-center justify-center my-4">
                  <span className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full">
                    {formatDateSeparator(message.created_at)}
                  </span>
                </div>
              )}
              <div
                className={cn(
                  'flex',
                  isOwn ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-2',
                    isOwn
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div
                    className={cn(
                      'flex items-center gap-1 mt-1',
                      isOwn ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <span
                      className={cn(
                        'text-xs',
                        isOwn ? 'text-blue-200' : 'text-gray-400'
                      )}
                    >
                      {formatTime(message.created_at)}
                    </span>
                    {isOwn && (
                      message.read_at ? (
                        <CheckCheck className="w-3 h-3 text-blue-200" />
                      ) : (
                        <Check className="w-3 h-3 text-blue-200" />
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {getTypingText() && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm">{getTypingText()}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Joindre un fichier"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Envoyer une image"
          >
            <Image className="w-5 h-5" />
          </button>
          <Input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              handleTyping()
            }}
            placeholder="Écrivez votre message..."
            className="flex-1"
            disabled={isSending}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="px-4"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}

export default ChatWindow
