// Service Worker for Viralio PWA
const CACHE_NAME = 'viralio-v1';
const STATIC_CACHE_NAME = 'viralio-static-v1';
const RUNTIME_CACHE_NAME = 'viralio-runtime-v1';

// Install event - cache static resources only
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      // Only cache truly static assets
      return cache.addAll([
        '/manifest.json',
        '/viralio-icon-192.png',
        '/viralio-icon-512.png',
      ]).catch((err) => {
        console.log('Cache addAll failed:', err);
        // Don't fail installation if caching fails
      });
    })
  );
  // Force the waiting service worker to become the active service worker immediately
  // This speeds up PWA startup
  self.skipWaiting();
});

// Fetch event - network first for API/dynamic content, cache for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip WebSocket connections (used by Supabase real-time)
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Skip cross-origin requests (API calls, Supabase, etc.)
  if (url.origin !== location.origin) {
    return;
  }

  // Skip API routes, auth routes, dynamic content, and JSON requests
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.includes('/api/') ||
    request.headers.get('accept')?.includes('application/json') ||
    request.headers.get('accept')?.includes('text/event-stream') // SSE
  ) {
    // Always fetch from network for API calls
    return;
  }

  // For static assets, try cache first, then network (stale-while-revalidate)
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Return cached version immediately for faster loading
        const fetchPromise = fetch(request).then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // Clone the response and update cache in background
          const responseToCache = response.clone();
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        });
        // Return cached version immediately, update in background
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // For HTML pages, always fetch from network (don't cache)
  // This ensures users always get the latest version
  return;
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

