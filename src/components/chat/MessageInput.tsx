'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  Paperclip,
  Image,
  Smile,
  Mic,
  X,
  MessageSquare,
  Zap,
} from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { ChatMessage, QuickReplyTemplate } from '@/lib/realtime/chat-service'
import { cn } from '@/lib/utils'
import MessageReactions from './MessageReactions'
import VoiceRecorder from './VoiceRecorder'
import QuickReplies from './QuickReplies'

interface MessageInputProps {
  onSend: (content: string, type?: 'text' | 'image' | 'file' | 'voice', fileUrl?: string) => void
  onTyping?: () => void
  onFileUpload?: (file: File) => Promise<{ url: string } | null>
  replyTo?: ChatMessage | null
  onCancelReply?: () => void
  editingMessage?: ChatMessage | null
  onCancelEdit?: () => void
  onEdit?: (messageId: string, content: string) => void
  quickReplies?: QuickReplyTemplate[]
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({
  onSend,
  onTyping,
  onFileUpload,
  replyTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onEdit,
  quickReplies = [],
  disabled = false,
  placeholder = 'Type a message...',
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Set initial value when editing
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content)
      inputRef.current?.focus()
    }
  }, [editingMessage])

  const handleSend = useCallback(() => {
    if (!message.trim() || disabled) return

    if (editingMessage) {
      onEdit?.(editingMessage.id, message.trim())
      onCancelEdit?.()
    } else {
      onSend(message.trim(), 'text')
    }

    setMessage('')
    inputRef.current?.focus()
  }, [message, disabled, editingMessage, onSend, onEdit, onCancelEdit])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
    onTyping?.()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    const file = e.target.files?.[0]
    if (!file || !onFileUpload) return

    setIsUploading(true)
    try {
      const result = await onFileUpload(file)
      if (result) {
        onSend(file.name, type, result.url)
      }
    } finally {
      setIsUploading(false)
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const handleVoiceRecorded = async (audioBlob: Blob) => {
    if (!onFileUpload) return

    const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
    setIsUploading(true)
    try {
      const result = await onFileUpload(file)
      if (result) {
        onSend('Voice message', 'voice', result.url)
      }
    } finally {
      setIsUploading(false)
      setIsRecording(false)
    }
  }

  const handleQuickReplySelect = (template: QuickReplyTemplate) => {
    setMessage(template.content)
    setShowQuickReplies(false)
    inputRef.current?.focus()
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Reply/Edit banner */}
      {(replyTo || editingMessage) && (
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-blue-600 font-medium">
              {editingMessage ? 'Editing message' : 'Replying to'}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
              {editingMessage?.content || replyTo?.content}
            </p>
          </div>
          <button
            onClick={editingMessage ? onCancelEdit : onCancelReply}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}

      {/* Voice recorder */}
      {isRecording && (
        <VoiceRecorder
          onRecorded={handleVoiceRecorded}
          onCancel={() => setIsRecording(false)}
        />
      )}

      {/* Quick replies panel */}
      {showQuickReplies && quickReplies.length > 0 && (
        <QuickReplies
          templates={quickReplies}
          onSelect={handleQuickReplySelect}
          onClose={() => setShowQuickReplies(false)}
        />
      )}

      {/* Main input area */}
      <div className="p-4">
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
            onChange={(e) => handleFileSelect(e, 'file')}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
          />
          <input
            ref={imageInputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'image')}
            accept="image/*"
          />

          {/* Attachment button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className={cn(
              'p-2 rounded-full transition-colors',
              disabled || isUploading
                ? 'text-gray-300 dark:text-gray-600'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Image button */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled || isUploading}
            className={cn(
              'p-2 rounded-full transition-colors',
              disabled || isUploading
                ? 'text-gray-300 dark:text-gray-600'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            title="Send image"
          >
            <Image className="w-5 h-5" />
          </button>

          {/* Quick replies button */}
          {quickReplies.length > 0 && (
            <button
              type="button"
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              disabled={disabled}
              className={cn(
                'p-2 rounded-full transition-colors',
                showQuickReplies
                  ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
              title="Quick replies"
            >
              <Zap className="w-5 h-5" />
            </button>
          )}

          {/* Emoji button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              className={cn(
                'p-2 rounded-full transition-colors',
                showEmojiPicker
                  ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-full mb-2 left-0">
                <MessageReactions
                  onSelect={handleEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                  position="right"
                />
              </div>
            )}
          </div>

          {/* Text input */}
          <Input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={isUploading ? 'Uploading...' : placeholder}
            disabled={disabled || isUploading || isRecording}
            className="flex-1"
          />

          {/* Voice/Send button */}
          {message.trim() ? (
            <Button
              type="submit"
              disabled={disabled || isUploading}
              className="px-4"
            >
              <Send className="w-5 h-5" />
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => setIsRecording(true)}
              disabled={disabled || isUploading}
              className={cn(
                'p-2 rounded-full transition-colors',
                disabled || isUploading
                  ? 'text-gray-300 dark:text-gray-600'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'
              )}
              title="Record voice message"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

export default MessageInput
