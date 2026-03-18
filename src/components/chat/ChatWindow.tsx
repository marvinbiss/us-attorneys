'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Check,
  CheckCheck,
  ArrowLeft,
  Shield,
  Loader2,
  X,
  FileText,
  ArrowDown,
} from 'lucide-react'
import { Button, Input } from '@/components/ui'
import NextImage from 'next/image'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessageItem {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'client' | 'attorney' | 'system'
  content: string
  message_type: 'text' | 'image' | 'file' | 'voice' | 'system'
  file_url?: string
  file_name?: string
  file_size?: number
  is_read?: boolean
  read_at?: string | null
  reply_to_id?: string | null
  edited_at?: string | null
  deleted_at?: string | null
  created_at: string
  is_encrypted?: boolean
}

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  currentUserType: 'client' | 'attorney'
  otherUserName: string
  otherUserAvatar?: string
  encryptionEnabled?: boolean
  onBack?: () => void
  className?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatWindow({
  conversationId,
  currentUserId,
  currentUserType: _currentUserType,
  otherUserName,
  otherUserAvatar,
  encryptionEnabled = true,
  onBack,
  className,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [_isTyping, setIsTyping] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [filePreview, setFilePreview] = useState<{ file: File; url: string } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ---------------------------------------------------------------------------
  // Scroll management
  // ---------------------------------------------------------------------------

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    })
  }, [])

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    setShowScrollButton(distanceFromBottom > 200)
  }, [])

  // ---------------------------------------------------------------------------
  // Fetch messages
  // ---------------------------------------------------------------------------

  const fetchMessages = useCallback(
    async (before?: string) => {
      try {
        let url = `/api/messages/${conversationId}?limit=50`
        if (before) url += `&before=${before}`

        const res = await fetch(url)
        const data = await res.json()

        if (data.success) {
          if (before) {
            // Prepend older messages
            setMessages((prev) => [...(data.messages || []), ...prev])
          } else {
            setMessages(data.messages || [])
          }
          setHasMore(data.hasMore || false)
        }
      } catch {
        // Silent error; will retry on next poll
      }
    },
    [conversationId]
  )

  // Initial load
  useEffect(() => {
    setIsLoading(true)
    setMessages([])

    fetchMessages().then(() => {
      setIsLoading(false)
      // Scroll to bottom after first load
      setTimeout(() => scrollToBottom(false), 50)
    })

    // Poll for new messages every 5 seconds
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(() => fetchMessages(), 5000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [conversationId, fetchMessages, scrollToBottom])

  // Auto-scroll when new messages arrive
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight

    // Only auto-scroll if user is near the bottom
    if (distanceFromBottom < 150) {
      scrollToBottom()
    }
  }, [messages.length, scrollToBottom])

  // ---------------------------------------------------------------------------
  // Mark messages as read
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const unreadFromOther = messages.some(
      (m) => m.sender_id !== currentUserId && !m.is_read && !m.read_at
    )

    if (unreadFromOther) {
      fetch(`/api/messages/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read' }),
      }).catch(() => {})
    }
  }, [messages, conversationId, currentUserId])

  // ---------------------------------------------------------------------------
  // Send message
  // ---------------------------------------------------------------------------

  const handleSend = async () => {
    const content = newMessage.trim()
    if (!content && !filePreview) return
    if (isSending) return

    setIsSending(true)
    setNewMessage('')

    try {
      const body: Record<string, unknown> = {
        content: content || (filePreview ? filePreview.file.name : ''),
        message_type: filePreview
          ? filePreview.file.type.startsWith('image/')
            ? 'image'
            : 'file'
          : 'text',
      }

      if (filePreview) {
        body.file_name = filePreview.file.name
        body.file_size = filePreview.file.size
      }

      const res = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setFilePreview(null)
        // Fetch latest messages
        await fetchMessages()
        scrollToBottom()
      }
    } catch {
      // Restore message on error
      setNewMessage(content)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  // ---------------------------------------------------------------------------
  // Typing indicator
  // ---------------------------------------------------------------------------

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)

    // Debounced typing indicator (simulated — shows to the user)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    setIsTyping(false) // We show our own "composing" state but not as indicator
  }

  // Simulate remote typing indicator
  const [remoteTyping, setRemoteTyping] = useState(false)
  useEffect(() => {
    // Clear after 3 seconds of remote typing
    if (remoteTyping) {
      const timeout = setTimeout(() => setRemoteTyping(false), 3000)
      return () => clearTimeout(timeout)
    }
  }, [remoteTyping])

  // ---------------------------------------------------------------------------
  // File attachment
  // ---------------------------------------------------------------------------

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      alert('File size must be under 10MB')
      return
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert('File type not supported. Supported: images, PDF, Word, text files.')
      return
    }

    const url = URL.createObjectURL(file)
    setFilePreview({ file, url })

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const cancelFilePreview = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview.url)
    }
    setFilePreview(null)
  }

  // ---------------------------------------------------------------------------
  // Date separators
  // ---------------------------------------------------------------------------

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  const needsDateSeparator = (index: number) => {
    if (index === 0) return true
    const currentDate = new Date(messages[index].created_at).toDateString()
    const prevDate = new Date(messages[index - 1].created_at).toDateString()
    return currentDate !== prevDate
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-full bg-white dark:bg-gray-900',
          className
        )}
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading messages...
          </p>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {/* ─── Encryption Banner ─────────────────────────────────────────── */}
      {encryptionEnabled && (
        <div
          className="flex items-center justify-center gap-2 py-1.5 px-4 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800"
          role="status"
        >
          <Shield className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
          <span className="text-xs text-green-700 dark:text-green-300 font-medium">
            This conversation is encrypted — ABA Rule 1.6 compliant
          </span>
        </div>
      )}

      {/* ─── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        )}
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
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {otherUserName}
          </h3>
          {remoteTyping && (
            <p className="text-xs text-blue-500 dark:text-blue-400 animate-pulse">
              Typing...
            </p>
          )}
        </div>
      </div>

      {/* ─── Messages ─────────────────────────────────────────────────── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        role="log"
        aria-label="Message history"
        aria-live="polite"
      >
        {/* Load more indicator */}
        {hasMore && (
          <div className="text-center">
            <button
              onClick={() => {
                if (messages.length > 0) {
                  fetchMessages(messages[0].created_at)
                }
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Load older messages
            </button>
          </div>
        )}

        {messages.map((message, index) => {
          const isOwn = message.sender_id === currentUserId
          const isDeleted = !!message.deleted_at
          const isEdited = !!message.edited_at

          return (
            <div key={message.id}>
              {/* Date separator */}
              {needsDateSeparator(index) && (
                <div className="flex items-center justify-center my-4">
                  <span className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full">
                    {formatDateSeparator(message.created_at)}
                  </span>
                </div>
              )}

              {/* System message */}
              {message.sender_type === 'system' && (
                <div className="flex justify-center my-2">
                  <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                    {message.content}
                  </span>
                </div>
              )}

              {/* Deleted message */}
              {isDeleted && message.sender_type !== 'system' && (
                <div
                  className={cn(
                    'flex',
                    isOwn ? 'justify-end' : 'justify-start'
                  )}
                >
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic px-4 py-2">
                    This message was deleted
                  </p>
                </div>
              )}

              {/* Regular message */}
              {!isDeleted && message.sender_type !== 'system' && (
                <div
                  className={cn(
                    'flex',
                    isOwn ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[75%] sm:max-w-[70%] rounded-2xl px-4 py-2',
                      isOwn
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                    )}
                  >
                    {/* File attachment */}
                    {message.message_type === 'image' && message.file_url && (
                      <div className="mb-2">
                        <NextImage
                          src={message.file_url}
                          alt="Shared image"
                          width={400}
                          height={300}
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 object-contain"
                          onClick={() =>
                            window.open(message.file_url, '_blank')
                          }
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
                          'flex items-center gap-2 px-3 py-2 rounded-lg mb-2 text-sm',
                          isOwn
                            ? 'bg-blue-500 hover:bg-blue-400'
                            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                        )}
                      >
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          {message.file_name || 'Attached file'}
                        </span>
                      </a>
                    )}

                    {message.message_type === 'voice' && message.file_url && (
                      <audio
                        controls
                        className="max-w-full mb-2"
                        preload="metadata"
                      >
                        <source src={message.file_url} type="audio/webm" />
                        Your browser does not support audio playback.
                      </audio>
                    )}

                    {/* Text content */}
                    {message.content && (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}

                    {/* Timestamp + read receipt */}
                    <div
                      className={cn(
                        'flex items-center gap-1 mt-1',
                        isOwn ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {isEdited && (
                        <span
                          className={cn(
                            'text-xs',
                            isOwn ? 'text-blue-200' : 'text-gray-400'
                          )}
                        >
                          edited
                        </span>
                      )}
                      <span
                        className={cn(
                          'text-xs',
                          isOwn ? 'text-blue-200' : 'text-gray-400'
                        )}
                      >
                        {formatTime(message.created_at)}
                      </span>
                      {isOwn &&
                        (message.read_at || message.is_read ? (
                          <CheckCheck
                            className="w-3 h-3 text-blue-200"
                            aria-label="Read"
                          />
                        ) : (
                          <Check
                            className="w-3 h-3 text-blue-200"
                            aria-label="Sent"
                          />
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Typing indicator */}
        {remoteTyping && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <div className="flex gap-1">
              <span
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
            <span className="text-xs">{otherUserName} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-28 right-6">
          <button
            onClick={() => scrollToBottom()}
            className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      )}

      {/* ─── File preview ─────────────────────────────────────────────── */}
      {filePreview && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            {filePreview.file.type.startsWith('image/') ? (
              <NextImage
                src={filePreview.url}
                alt="Preview"
                width={48}
                height={48}
                className="w-12 h-12 rounded-lg object-cover"
                unoptimized
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {filePreview.file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(filePreview.file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={cancelFilePreview}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label="Remove attachment"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Input ────────────────────────────────────────────────────── */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-2"
        >
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt"
            aria-hidden="true"
          />
          <input
            ref={imageInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/gif,image/webp"
            aria-hidden="true"
          />

          {/* Attachment button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className={cn(
              'p-2 rounded-full transition-colors',
              isSending
                ? 'text-gray-300 dark:text-gray-600'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            title="Attach file (PDF, Word, text — max 10MB)"
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Image button */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={isSending}
            className={cn(
              'p-2 rounded-full transition-colors',
              isSending
                ? 'text-gray-300 dark:text-gray-600'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            title="Send image (JPEG, PNG, GIF, WebP — max 10MB)"
            aria-label="Attach image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Text input */}
          <Input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={
              isSending ? 'Sending...' : 'Type a message...'
            }
            className="flex-1"
            disabled={isSending}
            aria-label="Message input"
          />

          {/* Send button */}
          <Button
            type="submit"
            disabled={(!newMessage.trim() && !filePreview) || isSending}
            className="px-4"
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default ChatWindow
