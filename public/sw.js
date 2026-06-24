const CACHE_NAME = 'monica-os-v2'

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silently continue if some assets fail to cache
      })
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Skip non-same-origin requests
  if (url.origin !== location.origin) return

  // Skip API routes — never cache these, let them go to network directly
  if (url.pathname.startsWith('/api/')) return

  // Skip Next.js internal routes
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('Network error', { status: 503 })
      })
    )
    return
  }

  // For page routes — network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache successful responses
        if (response && response.status === 200 && response.type !== 'opaque') {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(async () => {
        // Try cache on network failure
        const cached = await caches.match(event.request)
        if (cached) return cached

        // Return offline page for document requests
        if (event.request.destination === 'document') {
          const offlinePage = await caches.match('/offline.html')
          if (offlinePage) return offlinePage
        }

        // Last resort
        return new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        })
      })
  )
})