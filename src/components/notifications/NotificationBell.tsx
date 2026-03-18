'use client'

import { useState, useEffect } from 'react'
import { Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'

interface Notification {
  id: string
  type: 'lead_created' | 'lead_dispatched' | 'lead_viewed' | 'quote_received' | 'lead_closed' | 'system'
  title: string
  message: string
  read: boolean
  link?: string
  created_at: string
  metadata?: Record<string, unknown>
}

interface NotificationBellProps {
  userId?: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (userId) {
      fetchNotifications()
    }
  }, [userId])

  const fetchNotifications = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error: unknown) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
    } catch (error: unknown) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (error: unknown) {
      console.error('Error marking all as read:', error)
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'lead_created':
        return '📝'
      case 'lead_dispatched':
        return '📤'
      case 'lead_viewed':
        return '👁️'
      case 'quote_received':
        return '📋'
      case 'lead_closed':
        return '✅'
      case 'system':
        return '🔔'
      default:
        return '🔔'
    }
  }

  if (!userId) return null

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Tout marquer lu
                </Button>
              )}
            </div>

            <div className="overflow-y-auto max-h-80">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                      !notification.read
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : ''
                    }`}
                    onClick={() => {
                      markAsRead(notification.id)
                      if (notification.link) {
                        window.location.href = notification.link
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(
                            new Date(notification.created_at),
                            {
                              addSuffix: true,
                              locale: enUS,
                            }
                          )}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => {
                    setIsOpen(false)
                    window.location.href = '/client-dashboard/notifications'
                  }}
                >
                  View all notifications
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationBell
