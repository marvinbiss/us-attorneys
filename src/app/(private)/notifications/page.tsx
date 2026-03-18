'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, Check, Filter, Trash2, Loader2, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import NotificationCard, { type NotificationItem, type NotificationType } from '@/components/notifications/NotificationCard'

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const TYPE_FILTERS: { label: string; value: NotificationType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Bookings', value: 'booking_confirmed' },
  { label: 'Messages', value: 'new_message' },
  { label: 'Leads', value: 'new_lead' },
  { label: 'Reviews', value: 'review_received' },
  { label: 'Payments', value: 'payment_success' },
  { label: 'Deadlines', value: 'deadline_reminder' },
  { label: 'System', value: 'system' },
]

// Group types: when filtering by "Bookings" also include related subtypes
const TYPE_GROUPS: Record<string, NotificationType[]> = {
  booking_confirmed: ['booking_confirmed', 'booking_reminder', 'booking_cancelled', 'booking_rescheduled'],
  new_lead: ['new_lead', 'lead_created', 'lead_dispatched', 'lead_viewed', 'lead_closed', 'quote_received'],
  review_received: ['review_received', 'review_request'],
  payment_success: ['payment_success', 'payment_failed'],
}

// ---------------------------------------------------------------------------
// Date grouping helpers
// ---------------------------------------------------------------------------

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  if (date >= today) return 'Today'
  if (date >= yesterday) return 'Yesterday'
  if (date >= weekAgo) return 'This Week'
  return 'Earlier'
}

function groupNotifications(notifications: NotificationItem[]): { group: string; items: NotificationItem[] }[] {
  const groups: Record<string, NotificationItem[]> = {}
  const order = ['Today', 'Yesterday', 'This Week', 'Earlier']

  for (const n of notifications) {
    const group = getDateGroup(n.created_at)
    if (!groups[group]) groups[group] = []
    groups[group].push(n)
  }

  return order
    .filter((g) => groups[g]?.length)
    .map((g) => ({ group: g, items: groups[g] }))
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  // -------------------------------------------------------------------------
  // Fetch
  // -------------------------------------------------------------------------

  const fetchNotifications = useCallback(async (offset = 0, append = false) => {
    if (!user) return

    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    try {
      const res = await fetch(`/api/notifications?limit=${PAGE_SIZE}&offset=${offset}`)
      if (res.ok) {
        const data = await res.json()
        const fetched: NotificationItem[] = data.notifications ?? []

        if (append) {
          setNotifications((prev) => [...prev, ...fetched])
        } else {
          setNotifications(fetched)
        }

        setHasMore(fetched.length === PAGE_SIZE)
      }
    } catch {
      // Silent
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchNotifications()
  }, [user, fetchNotifications])

  // -------------------------------------------------------------------------
  // Infinite scroll
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!loaderRef.current || !hasMore || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchNotifications(notifications.length, true)
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, notifications.length, fetchNotifications])

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n)),
      )
    } catch { /* Silent */ }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, read_at: new Date().toISOString() })))
    } catch { /* Silent */ }
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch { /* Silent */ }
  }, [])

  const deleteOldRead = useCallback(async () => {
    try {
      await fetch('/api/notifications?deleteOld=true', { method: 'DELETE' })
      setNotifications((prev) => prev.filter((n) => !n.read))
    } catch { /* Silent */ }
  }, [])

  // -------------------------------------------------------------------------
  // Filter
  // -------------------------------------------------------------------------

  const filteredNotifications = typeFilter === 'all'
    ? notifications
    : notifications.filter((n) => {
        const group = TYPE_GROUPS[typeFilter]
        return group ? group.includes(n.type) : n.type === typeFilter
      })

  const grouped = groupNotifications(filteredNotifications)
  const unreadCount = notifications.filter((n) => !n.read && !n.read_at).length

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Sign in to view notifications</h1>
        <p className="text-gray-500 dark:text-gray-400">You need to be logged in to see your notifications.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterMenu((s) => !s)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
                typeFilter !== 'all'
                  ? 'border-clay-300 text-clay-600 bg-clay-50 dark:border-clay-700 dark:text-clay-400 dark:bg-clay-950/20'
                  : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:bg-gray-900 dark:hover:bg-gray-800',
              )}
            >
              <Filter className="h-4 w-4" />
              Filter
              <ChevronDown className="h-3 w-3" />
            </button>

            {showFilterMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)} />
                <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
                  {TYPE_FILTERS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => { setTypeFilter(f.value); setShowFilterMenu(false) }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm transition-colors',
                        typeFilter === f.value
                          ? 'text-clay-600 bg-clay-50 dark:text-clay-400 dark:bg-clay-950/20 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Bulk actions */}
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-clay-500 hover:text-clay-600 dark:text-clay-400 dark:hover:text-clay-300 rounded-lg hover:bg-clay-50 dark:hover:bg-clay-950/20 transition-colors"
            >
              <Check className="h-4 w-4" />
              Mark all read
            </button>
          )}

          {notifications.some((n) => n.read) && (
            <button
              type="button"
              onClick={deleteOldRead}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear read
            </button>
          )}
        </div>
      </div>

      {/* Notification groups */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No notifications</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            {typeFilter !== 'all'
              ? 'No notifications match this filter. Try a different category.'
              : 'You\'re all caught up! Notifications from bookings, messages, and other activity will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ group, items }) => (
            <div key={group}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-1">
                {group}
              </h3>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Infinite scroll loader */}
          <div ref={loaderRef} className="py-4 text-center">
            {loadingMore && (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400 mx-auto" />
            )}
            {!hasMore && notifications.length > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500">No more notifications</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
