'use client'

import { useState, useRef } from 'react'
import {
  Check,
  CheckCheck,
  MoreVertical,
  Reply,
  Edit2,
  Trash2,
  Copy,
  Smile,
} from 'lucide-react'
import Image from 'next/image'
import { ChatMessage } from '@/lib/realtime/chat-service'
import { cn } from '@/lib/utils'
import MessageReactions from './MessageReactions'

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  currentUserId: string
  onReply?: (message: ChatMessage) => void
  onEdit?: (message: ChatMessage) => void
  onDelete?: (messageId: string) => void
  onReactionAdd?: (messageId: string, emoji: string) => void
  onReactionRemove?: (messageId: string, emoji: string) => void
  showAvatar?: boolean
  replyToMessage?: ChatMessage
}

export function MessageBubble({
  message,
  isOwn,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onReactionAdd,
  onReactionRemove,
  showAvatar: _showAvatar = true,
  replyToMessage,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setShowMenu(false)
  }

  // Group reactions by emoji
  const groupedReactions = (message.reactions || []).reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = { emoji: reaction.emoji, users: [], hasCurrentUser: false }
    }
    acc[reaction.emoji].users.push(reaction.user_id)
    if (reaction.user_id === currentUserId) {
      acc[reaction.emoji].hasCurrentUser = true
    }
    return acc
  }, {} as Record<string, { emoji: string; users: string[]; hasCurrentUser: boolean }>)

  const isDeleted = !!message.deleted_at
  const isEdited = !!message.edited_at

  // Handle deleted messages
  if (isDeleted) {
    return (
      <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
        <div className="max-w-[70%] px-4 py-2 text-gray-400 dark:text-gray-500 italic text-sm">
          This message was deleted
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group relative flex',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Action buttons (hover) */}
      <div
        className={cn(
          'absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isOwn ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'
        )}
      >
        <button
          onClick={() => setShowReactionPicker(!showReactionPicker)}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
          title="Add reaction"
        >
          <Smile className="w-4 h-4" />
        </button>
        <button
          onClick={() => onReply?.(message)}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
          title="Reply"
        >
          <Reply className="w-4 h-4" />
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Context menu */}
          {showMenu && (
            <div
              className={cn(
                'absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[140px]',
                isOwn ? 'right-0' : 'left-0'
              )}
            >
              <button
                onClick={handleCopy}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              {isOwn && (
                <>
                  <button
                    onClick={() => {
                      onEdit?.(message)
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDelete?.(message.id)
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reaction picker */}
      {showReactionPicker && (
        <MessageReactions
          onSelect={(emoji) => {
            onReactionAdd?.(message.id, emoji)
            setShowReactionPicker(false)
          }}
          onClose={() => setShowReactionPicker(false)}
          position={isOwn ? 'left' : 'right'}
        />
      )}

      {/* Message content */}
      <div className="max-w-[70%]">
        {/* Reply preview */}
        {replyToMessage && (
          <div
            className={cn(
              'text-xs px-3 py-1.5 mb-1 rounded-t-lg border-l-2',
              isOwn
                ? 'bg-blue-500/20 border-blue-300 text-blue-100'
                : 'bg-gray-200 dark:bg-gray-700 border-gray-400 text-gray-600 dark:text-gray-300'
            )}
          >
            <span className="font-medium">
              {replyToMessage.sender_type === 'attorney' ? 'Attorney' : 'Client'}
            </span>
            <p className="truncate">{replyToMessage.content}</p>
          </div>
        )}

        {/* Main bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2',
            isOwn
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md',
            replyToMessage && 'rounded-t-none'
          )}
        >
          {/* File/Image preview */}
          {message.message_type === 'image' && message.file_url && (
            <Image
              src={message.file_url}
              alt="Shared image"
              width={400}
              height={300}
              sizes="(max-width: 768px) 100vw, 400px"
              className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 object-contain"
              onClick={() => window.open(message.file_url, '_blank')}
              loading="lazy"
              unoptimized
            />
          )}

          {message.message_type === 'file' && message.file_url && (
            <a
              href={message.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg mb-2',
                isOwn ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
              )}
            >
              <span className="text-sm">Attached file</span>
            </a>
          )}

          {message.message_type === 'voice' && message.file_url && (
            <audio controls className="max-w-full mb-2">
              <source src={message.file_url} type="audio/webm" />
            </audio>
          )}

          {/* Text content */}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {/* Timestamp and status */}
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
            {isOwn && (
              message.read_at ? (
                <CheckCheck className="w-3 h-3 text-blue-200" />
              ) : (
                <Check className="w-3 h-3 text-blue-200" />
              )
            )}
          </div>
        </div>

        {/* Reactions display */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className={cn('flex flex-wrap gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}>
            {Object.values(groupedReactions).map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => {
                  if (reaction.hasCurrentUser) {
                    onReactionRemove?.(message.id, reaction.emoji)
                  } else {
                    onReactionAdd?.(message.id, reaction.emoji)
                  }
                }}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors',
                  reaction.hasCurrentUser
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.users.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble
