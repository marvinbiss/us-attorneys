'use client'

import { useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar, MessageSquare, DollarSign, AlertTriangle,
  Star, Eye, Briefcase, FileText, CheckCircle, XCircle,
  Bell, Clock, UserCheck, Trash2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType =
  | 'lead_created' | 'lead_dispatched' | 'lead_viewed'
  | 'quote_received' | 'lead_closed' | 'system'
  | 'booking_confirmed' | 'booking_reminder' | 'booking_cancelled' | 'booking_rescheduled'
  | 'new_message' | 'new_lead'
  | 'review_received' | 'review_request'
  | 'payment_success' | 'payment_failed'
  | 'deadline_reminder' | 'profile_view'
  | 'claim_approved' | 'claim_rejected'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  body?: string
  link?: string | null
  read: boolean
  read_at?: string | null
  data?: Record<string, unknown>
  metadata?: Record<string, unknown>
  created_at: string
}

interface NotificationCardProps {
  notification: NotificationItem
  onMarkRead: (id: string) => void
  onDelete?: (id: string) => void
  compact?: boolean
}

// ---------------------------------------------------------------------------
// Type config: icon, colors
// ---------------------------------------------------------------------------

interface TypeConfig {
  icon: React.ElementType
  bgColor: string
  iconColor: string
  borderColor: string
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  // Booking (blue)
  booking_confirmed: { icon: Calendar, bgColor: 'bg-blue-50 dark:bg-blue-950/30', iconColor: 'text-blue-600 dark:text-blue-400', borderColor: 'border-l-blue-500' },
  booking_reminder: { icon: Clock, bgColor: 'bg-blue-50 dark:bg-blue-950/30', iconColor: 'text-blue-600 dark:text-blue-400', borderColor: 'border-l-blue-500' },
  booking_cancelled: { icon: XCircle, bgColor: 'bg-red-50 dark:bg-red-950/30', iconColor: 'text-red-600 dark:text-red-400', borderColor: 'border-l-red-500' },
  booking_rescheduled: { icon: Calendar, bgColor: 'bg-blue-50 dark:bg-blue-950/30', iconColor: 'text-blue-600 dark:text-blue-400', borderColor: 'border-l-blue-500' },

  // Messages (green)
  new_message: { icon: MessageSquare, bgColor: 'bg-green-50 dark:bg-green-950/30', iconColor: 'text-green-600 dark:text-green-400', borderColor: 'border-l-green-500' },

  // Payment (amber)
  payment_success: { icon: DollarSign, bgColor: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-600 dark:text-amber-400', borderColor: 'border-l-amber-500' },
  payment_failed: { icon: AlertTriangle, bgColor: 'bg-red-50 dark:bg-red-950/30', iconColor: 'text-red-600 dark:text-red-400', borderColor: 'border-l-red-500' },

  // Reviews (purple)
  review_received: { icon: Star, bgColor: 'bg-purple-50 dark:bg-purple-950/30', iconColor: 'text-purple-600 dark:text-purple-400', borderColor: 'border-l-purple-500' },
  review_request: { icon: Star, bgColor: 'bg-purple-50 dark:bg-purple-950/30', iconColor: 'text-purple-600 dark:text-purple-400', borderColor: 'border-l-purple-500' },

  // Leads (teal)
  new_lead: { icon: Briefcase, bgColor: 'bg-teal-50 dark:bg-teal-950/30', iconColor: 'text-teal-600 dark:text-teal-400', borderColor: 'border-l-teal-500' },
  lead_created: { icon: FileText, bgColor: 'bg-teal-50 dark:bg-teal-950/30', iconColor: 'text-teal-600 dark:text-teal-400', borderColor: 'border-l-teal-500' },
  lead_dispatched: { icon: Briefcase, bgColor: 'bg-teal-50 dark:bg-teal-950/30', iconColor: 'text-teal-600 dark:text-teal-400', borderColor: 'border-l-teal-500' },
  lead_viewed: { icon: Eye, bgColor: 'bg-teal-50 dark:bg-teal-950/30', iconColor: 'text-teal-600 dark:text-teal-400', borderColor: 'border-l-teal-500' },
  quote_received: { icon: FileText, bgColor: 'bg-teal-50 dark:bg-teal-950/30', iconColor: 'text-teal-600 dark:text-teal-400', borderColor: 'border-l-teal-500' },
  lead_closed: { icon: CheckCircle, bgColor: 'bg-teal-50 dark:bg-teal-950/30', iconColor: 'text-teal-600 dark:text-teal-400', borderColor: 'border-l-teal-500' },

  // Profile
  profile_view: { icon: Eye, bgColor: 'bg-indigo-50 dark:bg-indigo-950/30', iconColor: 'text-indigo-600 dark:text-indigo-400', borderColor: 'border-l-indigo-500' },
  deadline_reminder: { icon: AlertTriangle, bgColor: 'bg-orange-50 dark:bg-orange-950/30', iconColor: 'text-orange-600 dark:text-orange-400', borderColor: 'border-l-orange-500' },

  // Claims
  claim_approved: { icon: UserCheck, bgColor: 'bg-green-50 dark:bg-green-950/30', iconColor: 'text-green-600 dark:text-green-400', borderColor: 'border-l-green-500' },
  claim_rejected: { icon: XCircle, bgColor: 'bg-red-50 dark:bg-red-950/30', iconColor: 'text-red-600 dark:text-red-400', borderColor: 'border-l-red-500' },

  // System (gray)
  system: { icon: Bell, bgColor: 'bg-gray-50 dark:bg-gray-800/50', iconColor: 'text-gray-600 dark:text-gray-400', borderColor: 'border-l-gray-400' },
}

function getTypeConfig(type: string): TypeConfig {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.system
}

// ---------------------------------------------------------------------------
// Swipe-to-dismiss helpers
// ---------------------------------------------------------------------------

const SWIPE_THRESHOLD = 100

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
  compact = false,
}: NotificationCardProps) {
  const router = useRouter()
  const config = getTypeConfig(notification.type)
  const Icon = config.icon
  const isUnread = !notification.read && !notification.read_at
  const bodyText = notification.body || notification.message

  // Swipe state (mobile)
  const touchStartX = useRef(0)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [swiping, setSwiping] = useState(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    setSwiping(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping) return
    const diff = touchStartX.current - e.touches[0].clientX
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 150))
    }
  }, [swiping])

  const handleTouchEnd = useCallback(() => {
    setSwiping(false)
    if (swipeOffset > SWIPE_THRESHOLD && onDelete) {
      onDelete(notification.id)
    }
    setSwipeOffset(0)
  }, [swipeOffset, onDelete, notification.id])

  const handleClick = useCallback(() => {
    if (isUnread) {
      onMarkRead(notification.id)
    }
    const link = notification.link ?? notification.data?.link ?? notification.metadata?.link
    if (typeof link === 'string') {
      router.push(link)
    }
  }, [isUnread, onMarkRead, notification, router])

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: enUS,
  })

  return (
    <div
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe delete background */}
      {swipeOffset > 0 && (
        <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-red-500 text-white w-full">
          <Trash2 className="h-5 w-5" />
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}
        className={cn(
          'relative flex items-start gap-3 border-l-4 transition-all duration-200 cursor-pointer',
          'hover:bg-gray-50 dark:hover:bg-gray-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-400 focus-visible:ring-inset',
          config.borderColor,
          isUnread
            ? 'bg-blue-50/50 dark:bg-blue-950/20'
            : 'bg-white dark:bg-gray-900',
          compact ? 'px-3 py-2.5' : 'px-4 py-3.5',
        )}
        style={swipeOffset > 0 ? { transform: `translateX(-${swipeOffset}px)` } : undefined}
        aria-label={`${isUnread ? 'Unread: ' : ''}${notification.title}`}
      >
        {/* Icon */}
        <div className={cn(
          'flex-shrink-0 flex items-center justify-center rounded-full',
          config.bgColor,
          compact ? 'h-8 w-8' : 'h-10 w-10',
        )}>
          <Icon className={cn(config.iconColor, compact ? 'h-4 w-4' : 'h-5 w-5')} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              'text-sm truncate',
              isUnread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300',
            )}>
              {notification.title}
            </p>
            {isUnread && (
              <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-1.5" aria-label="Unread" />
            )}
          </div>
          <p className={cn(
            'text-gray-600 dark:text-gray-400 mt-0.5',
            compact ? 'text-xs line-clamp-1' : 'text-sm line-clamp-2',
          )}>
            {bodyText}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {timeAgo}
          </p>
        </div>

        {/* Delete button (desktop) */}
        {onDelete && !compact && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(notification.id) }}
            className="flex-shrink-0 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-all"
            aria-label="Delete notification"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
