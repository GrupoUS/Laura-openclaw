// Minimal PWA Service Worker for Vite SPA
// Goal: installability + safe behavior (no API/SSE interference)

const CACHE_NAME = 'laura-shell-v1'
const SHELL = [
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Never touch API, SSE or websockets endpoints
  if (url.pathname.startsWith('/api/')) return

  // Cache-first for icons/manifest
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest'
  ) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    )
    return
  }

  // Network-first for everything else
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  )
})
