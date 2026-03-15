const CACHE_NAME = 'us-attorneys-v1'
const STATIC_CACHE_NAME = 'us-attorneys-static-v1'
const DYNAMIC_CACHE_NAME = 'us-attorneys-dynamic-v1'

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/offline',
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
          // Network failed, try to return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline')
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
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
      },
      actions: data.actions || [],
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  } catch (error) {
    console.error('[ServiceWorker] Push notification error:', error)
  }
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
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
