'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, X } from 'lucide-react'

/**
 * PushNotificationPrompt — Client component that prompts users to enable push notifications.
 *
 * Behavior:
 *  - Only shows after the user's 2nd visit (tracked via localStorage counter)
 *  - OR immediately if `forceShow` prop is true (e.g., after booking confirmation)
 *  - Respects "Don't ask again" dismissal (stored in localStorage)
 *  - Handles the full flow: requestPermission -> subscribe -> POST to /api/push/subscribe
 */

const LS_VISIT_COUNT = 'us-attorneys-visit-count'
const LS_PUSH_DISMISSED = 'us-attorneys-push-dismissed'
const LS_PUSH_SUBSCRIBED = 'us-attorneys-push-subscribed'
const MIN_VISITS = 2

interface PushNotificationPromptProps {
  /** Force showing the prompt (e.g., after booking) */
  forceShow?: boolean
}

export default function PushNotificationPrompt({ forceShow = false }: PushNotificationPromptProps) {
  const [visible, setVisible] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  // Determine whether to show the prompt
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return

    // Already granted or denied at OS level
    if (Notification.permission === 'denied') return
    if (Notification.permission === 'granted') {
      // Already subscribed?
      if (localStorage.getItem(LS_PUSH_SUBSCRIBED) === 'true') return
    }

    // User explicitly dismissed
    if (localStorage.getItem(LS_PUSH_DISMISSED) === 'true') return

    if (forceShow) {
      setVisible(true)
      return
    }

    // Increment visit count
    const count = parseInt(localStorage.getItem(LS_VISIT_COUNT) || '0', 10) + 1
    localStorage.setItem(LS_VISIT_COUNT, String(count))

    if (count >= MIN_VISITS) {
      setVisible(true)
    }
  }, [forceShow])

  // Subscribe to push notifications
  const handleSubscribe = useCallback(async () => {
    setSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setVisible(false)
        return
      }

      // Get the service worker registration
      const registration = await navigator.serviceWorker.ready

      // Get VAPID public key from env (injected at build time via NEXT_PUBLIC_ prefix)
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.error('VAPID public key not configured')
        setVisible(false)
        return
      }

      // Convert base64url to Uint8Array for applicationServerKey
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

      // Subscribe via the Push API
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      })

      // Send subscription to our backend
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      if (response.ok) {
        localStorage.setItem(LS_PUSH_SUBSCRIBED, 'true')
        setVisible(false)
      } else {
        console.error('Failed to save push subscription:', await response.text())
      }
    } catch (error) {
      console.error('Push subscription error:', error)
    } finally {
      setSubscribing(false)
    }
  }, [])

  // Dismiss permanently
  const handleDismiss = useCallback(() => {
    localStorage.setItem(LS_PUSH_DISMISSED, 'true')
    setVisible(false)
  }, [])

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Enable push notifications"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-lg sm:left-auto sm:right-6 sm:bottom-6"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        aria-label="Dismiss notification prompt"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#E86B4B]/10">
          <Bell className="h-5 w-5 text-[#E86B4B]" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900">
            Stay updated on your cases
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Get notified about new messages, booking confirmations, and important updates from your attorney.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="rounded-lg bg-[#E86B4B] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#d45a3b] disabled:opacity-50"
            >
              {subscribing ? 'Enabling...' : 'Enable notifications'}
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-700"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a base64url-encoded string to a Uint8Array (for applicationServerKey) */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
