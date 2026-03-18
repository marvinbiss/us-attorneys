const CACHE_NAME = 'us-attorneys-v2'
const STATIC_CACHE_NAME = 'us-attorneys-static-v2'
const DYNAMIC_CACHE_NAME = 'us-attorneys-dynamic-v2'
const OFFLINE_URL = '/offline.html'

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  OFFLINE_URL,
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install')
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName.startsWith('us-attorneys-') &&
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME
            )
          })
          .map((cacheName) => {
            console.log('[ServiceWorker] Removing old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip API requests - always go to network
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Skip Supabase and Stripe requests
  if (
    url.hostname.includes('supabase') ||
    url.hostname.includes('stripe')
  ) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response and update cache in background
        event.waitUntil(updateCache(request))
        return cachedResponse
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          // Cache the new response
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // Network failed, serve offline.html for navigation requests
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL)
          }
          return new Response('Offline', { status: 503 })
        })
    })
  )
})

// Update cache in background
async function updateCache(request) {
  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, response)
    }
  } catch (error) {
    console.log('[ServiceWorker] Background update failed:', error)
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()

    const options = {
      body: data.body || '',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      tag: data.tag || undefined,
      renotify: !!data.tag, // Re-alert if same tag replaces an existing notification
      data: {
        url: data.url || '/',
        timestamp: Date.now(),
      },
      actions: data.actions || [],
      requireInteraction: false,
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'US Attorneys', options)
    )
  } catch (error) {
    console.error('[ServiceWorker] Push notification error:', error)
    // Fallback: show a generic notification so the user sees something
    event.waitUntil(
      self.registration.showNotification('US Attorneys', {
        body: 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
      })
    )
  }
})

// Handle notification click (main body or action buttons)
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  // If an action button was clicked, use its action as a URL path if it starts with /
  let targetUrl = event.notification.data?.url || '/'
  if (event.action && event.action.startsWith('/')) {
    targetUrl = event.action
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to find an existing window on the same origin and navigate it
      for (const client of clientList) {
        try {
          const clientUrl = new URL(client.url)
          if (clientUrl.origin === self.location.origin && 'focus' in client) {
            // Navigate the existing window to the target URL
            client.navigate(targetUrl)
            return client.focus()
          }
        } catch (_e) {
          // Ignore URL parsing errors
        }
      }
      // No matching window — open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})

// Handle notification close (analytics tracking)
self.addEventListener('notificationclose', (event) => {
  // Could be used for analytics — track dismissed notifications
  console.log('[ServiceWorker] Notification closed:', event.notification.tag || 'untagged')
})

// Background sync for offline bookings
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings())
  }
})

async function syncBookings() {
  try {
    // Get pending bookings from IndexedDB
    const pendingBookings = await getPendingBookings()

    for (const booking of pendingBookings) {
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking),
        })

        if (response.ok) {
          // Remove from pending
          await removePendingBooking(booking.id)
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync booking:', error)
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error)
  }
}

// Placeholder functions for IndexedDB operations
async function getPendingBookings() {
  // In production, implement with IndexedDB
  return []
}

async function removePendingBooking(id) {
  // In production, implement with IndexedDB
  console.log('[ServiceWorker] Removed pending booking:', id)
}
