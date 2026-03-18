'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import NotificationCard, { type NotificationItem } from './NotificationCard'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'all' | 'unread'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NotificationCenter() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('all')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // -------------------------------------------------------------------------
  // Fetch notifications
  // -------------------------------------------------------------------------

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const unreadParam = tab === 'unread' ? '&unread=true' : ''
      const res = await fetch(`/api/notifications?limit=30${unreadParam}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
        setUnreadCount(data.unreadCount ?? 0)
      }
    } catch {
      // Silent fail — notifications are non-critical
    } finally {
      setLoading(false)
    }
  }, [user, tab])

  // Fetch on mount + tab change
  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user, fetchNotifications])

  // -------------------------------------------------------------------------
  // Supabase Realtime subscription
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!user) return

    const supabase = getSupabaseClient()

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as NotificationItem
          setNotifications((prev) => [newNotif, ...prev].slice(0, 30))
          setUnreadCount((prev) => prev + 1)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // -------------------------------------------------------------------------
  // Close on outside click or Escape
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // Silent fail
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, read_at: new Date().toISOString() })))
      setUnreadCount(0)
    } catch {
      // Silent fail
    }
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
      setNotifications((prev) => {
        const removed = prev.find((n) => n.id === id)
        if (removed && !removed.read) {
          setUnreadCount((c) => Math.max(0, c - 1))
        }
        return prev.filter((n) => n.id !== id)
      })
    } catch {
      // Silent fail
    }
  }, [])

  // Don't render for unauthenticated users
  if (!user) return null

  const filtered = tab === 'unread'
    ? notifications.filter((n) => !n.read && !n.read_at)
    : notifications

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          'relative flex items-center justify-center rounded-xl p-2 min-w-[44px] min-h-[44px] transition-all duration-200',
          'text-gray-600 dark:text-gray-300 hover:text-clay-400 hover:bg-gray-50/80 dark:hover:bg-gray-800/80',
          isOpen && 'text-clay-400 bg-gray-50 dark:bg-gray-800',
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 leading-none transition-all duration-200">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)]',
            'bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700',
            'z-50 overflow-hidden',
            'transition-all duration-200',
          )}
          role="dialog"
          aria-label="Notification center"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs font-medium text-clay-500 hover:text-clay-600 dark:text-clay-400 dark:hover:text-clay-300 transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-800">
            {(['all', 'unread'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 py-2 text-xs font-medium text-center transition-colors relative',
                  tab === t
                    ? 'text-clay-500 dark:text-clay-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                )}
              >
                {t === 'all' ? 'All' : `Unread (${unreadCount})`}
                {tab === t && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-clay-400 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto max-h-[400px] divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              filtered.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                  compact
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 dark:border-gray-800 p-2">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center py-2 text-sm font-medium text-clay-500 hover:text-clay-600 dark:text-clay-400 dark:hover:text-clay-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
