'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Send,
  Paperclip,
  Shield,
  ShieldCheck,
  Check,
  CheckCheck,
  ArrowLeft,
  Loader2,
  ChevronUp,
  Lock,
} from 'lucide-react'
import Image from 'next/image'
import { Button, Input } from '@/components/ui'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SecureMessage {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'client' | 'attorney' | 'system'
  content: string
  message_type: 'text' | 'image' | 'file' | 'voice'
  file_url?: string | null
  file_name?: string | null
  file_size?: number | null
  is_read: boolean
  read_at?: string | null
  reply_to_id?: string | null
  edited_at?: string | null
  created_at: string
  is_encrypted: boolean
}

interface SecureChatProps {
  conversationId: string
  currentUserId: string
  currentUserType: 'client' | 'attorney'
  otherUserName: string
  otherUserAvatar?: string | null
  encryptionEnabled?: boolean
  onBack?: () => void
  onFileUpload?: (file: File) => Promise<{ url: string; name: string; size: number } | null>
  className?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SecureChat({
  conversationId,
  currentUserId,
  currentUserType,
  otherUserName,
  otherUserAvatar,
  encryptionEnabled = true,
  onBack,
  onFileUpload,
  className,
}: SecureChatProps) {
  const [messages, setMessages] = useState<SecureMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showABANotice, setShowABANotice] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior })
    })
  }, [])

  // Fetch messages
  const fetchMessages = useCallback(async (before?: string) => {
    try {
      const url = before
        ? `/api/messages/${conversationId}?before=${before}&limit=50`
        : `/api/messages/${conversationId}?limit=50`

      const res = await fetch(url)
      const data = await res.json()

      if (data.success) {
        if (before) {
          setMessages(prev => [...data.messages, ...prev])
        } else {
          setMessages(data.messages || [])
        }
        setHasMore(data.hasMore || false)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }, [conversationId])

  // Initial load
  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      await fetchMessages()
      setIsLoading(false)
      setTimeout(() => scrollToBottom('instant'), 100)
    }
    load()
  }, [conversationId, fetchMessages, scrollToBottom])

  // Polling for new messages (every 5s)
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/messages/${conversationId}?limit=50`)
        const data = await res.json()
        if (data.success) {
          setMessages(prev => {
            const newMsgs = data.messages || []
            if (newMsgs.length !== prev.length || (newMsgs.length > 0 && prev.length > 0 && newMsgs[newMsgs.length - 1]?.id !== prev[prev.length - 1]?.id)) {
              return newMsgs
            }
            return prev
          })
        }
      } catch { /* silent */ }
    }, 5000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [conversationId])

  // Mark messages as read
  useEffect(() => {
    const unreadFromOther = messages.filter(
      m => m.sender_id !== currentUserId && !m.is_read
    )
    if (unreadFromOther.length > 0) {
      fetch(`/api/messages/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          message_ids: unreadFromOther.map(m => m.id),
        }),
      }).catch(() => { /* silent */ })
    }
  }, [messages, currentUserId, conversationId])

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return

    const content = newMessage.trim()
    setNewMessage('')
    setIsSending(true)

    // Optimistic update
    const optimisticMsg: SecureMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      sender_type: currentUserType,
      content,
      message_type: 'text',
      is_read: false,
      created_at: new Date().toISOString(),
      is_encrypted: true,
    }
    setMessages(prev => [...prev, optimisticMsg])
    scrollToBottom()

    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      const data = await res.json()
      if (data.success) {
        // Replace optimistic with real
        setMessages(prev =>
          prev.map(m => (m.id === optimisticMsg.id ? { ...optimisticMsg, id: data.message.id, created_at: data.message.created_at } : m))
        )
      } else {
        // Remove optimistic on error
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
        setNewMessage(content) // Restore
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      setNewMessage(content)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  // Load older messages
  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore || messages.length === 0) return
    setIsLoadingMore(true)
    await fetchMessages(messages[0]?.created_at)
    setIsLoadingMore(false)
  }

  // File upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onFileUpload) return

    const result = await onFileUpload(file)
    if (result) {
      const messageType = file.type.startsWith('image/') ? 'image' : 'file'
      try {
        const res = await fetch(`/api/messages/${conversationId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: file.name,
            message_type: messageType,
            file_url: result.url,
            file_name: result.name,
            file_size: result.size,
          }),
        })
        if (res.ok) {
          await fetchMessages()
          scrollToBottom()
        }
      } catch (error) {
        console.error('File upload message failed:', error)
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Typing indicator (simulated)
  const handleTyping = () => {
    setIsTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000)
  }

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  // Date separator
  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const needsDateSeparator = (index: number) => {
    if (index === 0) return true
    const curr = new Date(messages[index].created_at).toDateString()
    const prev = new Date(messages[index - 1].created_at).toDateString()
    return curr !== prev
  }

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-96 bg-white dark:bg-gray-900 rounded-xl', className)}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading secure messages...</p>
        </div>
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={cn(
      'flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden',
      className
    )}>
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 md:hidden"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="relative flex-shrink-0">
            {otherUserAvatar ? (
              <Image
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
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">{otherUserName}</h3>
          </div>
        </div>

        {/* Encryption badge */}
        {encryptionEnabled && (
          <button
            onClick={() => setShowABANotice(!showABANotice)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
            title="Messages are encrypted at rest"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Encrypted</span>
          </button>
        )}
      </div>

      {/* ─── ABA Compliance Notice ──────────────────────────────────────────── */}
      {showABANotice && (
        <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-green-800 dark:text-green-300">
              <p className="font-semibold mb-1">ABA Rule 1.6 - Attorney-Client Privilege</p>
              <p>
                All messages in this conversation are encrypted at rest using AES-256-GCM encryption.
                Communications between attorneys and clients are protected by attorney-client privilege.
                Unauthorized disclosure may violate professional conduct rules.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Messages Area ──────────────────────────────────────────────────── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        role="log"
        aria-label="Message history"
        aria-live="polite"
      >
        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center py-2">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors disabled:opacity-50"
            >
              {isLoadingMore ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ChevronUp className="w-3 h-3" />
              )}
              Load older messages
            </button>
          </div>
        )}

        {/* Messages */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 py-12">
            <Lock className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm text-center">
              Start a secure conversation.<br />
              Messages are encrypted at rest.
            </p>
          </div>
        )}

        {messages.map((message, index) => {
          const isOwn = message.sender_id === currentUserId

          return (
            <div key={message.id}>
              {/* Date separator */}
              {needsDateSeparator(index) && (
                <div className="flex items-center justify-center my-4" role="separator">
                  <span className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full">
                    {formatDateSeparator(message.created_at)}
                  </span>
                </div>
              )}

              {/* Message bubble */}
              <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[80%] sm:max-w-[70%]',
                )}>
                  {/* File/Image attachment */}
                  {message.message_type === 'image' && message.file_url && (
                    <div className={cn(
                      'rounded-2xl overflow-hidden mb-1',
                      isOwn ? 'rounded-br-md' : 'rounded-bl-md',
                    )}>
                      <Image
                        src={message.file_url}
                        alt={message.file_name || 'Image'}
                        width={400}
                        height={300}
                        sizes="(max-width: 768px) 80vw, 400px"
                        className="max-w-full cursor-pointer hover:opacity-90 transition-opacity object-contain"
                        onClick={() => window.open(message.file_url!, '_blank')}
                        loading="lazy"
                        unoptimized
                      />
                    </div>
                  )}

                  {message.message_type === 'file' && message.file_url && (
                    <a
                      href={message.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-sm',
                        isOwn
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                      )}
                    >
                      <Paperclip className="w-4 h-4" />
                      <span className="truncate">{message.file_name || 'Attachment'}</span>
                    </a>
                  )}

                  {/* Text bubble */}
                  <div className={cn(
                    'rounded-2xl px-4 py-2',
                    isOwn
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md',
                  )}>
                    {message.content && message.message_type !== 'image' && (
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    )}

                    {/* Timestamp + read receipt */}
                    <div className={cn(
                      'flex items-center gap-1 mt-1',
                      isOwn ? 'justify-end' : 'justify-start'
                    )}>
                      {message.is_encrypted && (
                        <Lock className={cn(
                          'w-2.5 h-2.5',
                          isOwn ? 'text-blue-200' : 'text-gray-400'
                        )} />
                      )}
                      <span className={cn(
                        'text-xs',
                        isOwn ? 'text-blue-200' : 'text-gray-400'
                      )}>
                        {formatTime(message.created_at)}
                      </span>
                      {isOwn && (
                        message.is_read ? (
                          <CheckCheck className="w-3 h-3 text-blue-200" />
                        ) : (
                          <Check className="w-3 h-3 text-blue-200" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 py-1">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs">{otherUserName} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Input Area ─────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
        />

        <form
          onSubmit={(e) => { e.preventDefault(); handleSend() }}
          className="flex items-center gap-2"
        >
          {/* Attach file */}
          {onFileUpload && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
              title="Attach file"
              aria-label="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          )}

          {/* Message input */}
          <Input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              handleTyping()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type a secure message..."
            disabled={isSending}
            className="flex-1"
            aria-label="Message input"
          />

          {/* Send button */}
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="px-3 sm:px-4"
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>

        {/* Encryption indicator */}
        {encryptionEnabled && (
          <p className="flex items-center gap-1 mt-2 text-xs text-gray-400 dark:text-gray-500">
            <Lock className="w-3 h-3" />
            Messages encrypted with AES-256-GCM. Protected by attorney-client privilege.
          </p>
        )}
      </div>
    </div>
  )
}

export default SecureChat
