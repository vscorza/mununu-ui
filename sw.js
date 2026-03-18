/**
 * Service Worker for Offline Support
 * Handles caching of API responses and static assets
 */

const CACHE_NAME = 'holiday-v1'
const API_CACHE_NAME = 'holiday-api-v1'
const STATIC_CACHE_NAME = 'holiday-static-v1'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Failed to cache some static assets:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name !== CACHE_NAME &&
              name !== API_CACHE_NAME &&
              name !== STATIC_CACHE_NAME
            )
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  return self.clients.claim()
})

// Fetch event - serve from cache when offline, cache API responses
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request))
})

/**
 * Handle API requests with network-first strategy and caching
 */
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME)

  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      // Clone the response before caching (responses can only be read once)
      const responseClone = networkResponse.clone()
      cache.put(request, responseClone).catch((err) => {
        console.warn('[SW] Failed to cache API response:', err)
      })
    }
    
    return networkResponse
  } catch (error) {
    // Network failed, try cache
    console.log('[SW] Network failed, trying cache for:', request.url)
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // No cache available, return offline response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'No internet connection and no cached data available',
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

/**
 * Handle static asset requests with cache-first strategy
 */
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME)
  
  // Try cache first
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Cache miss, try network
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    // Network failed and no cache, return offline page or error
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
    })
  }
}

// Message handler for cache management from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        )
      })
    )
  }
  
  if (event.data && event.data.type === 'CACHE_API') {
    const { request, response } = event.data
    event.waitUntil(
      caches.open(API_CACHE_NAME).then((cache) => {
        return cache.put(request, response)
      })
    )
  }
})

