/*
 * Minimal hand-written service worker (no build plugin: Next.js 16 builds
 * with Turbopack, which the webpack-based next-pwa plugins don't support).
 * Registered by src/components/pwa-register.tsx in production only.
 *
 * Strategy:
 *  - /_next/static/* and icons: cache-first (files are content-hashed)
 *  - page navigations: network-first, falling back to the last cached copy
 *    so already-visited pages still open offline
 *  - /api/* and everything non-GET / cross-origin: never touched
 *
 * Bump VERSION to invalidate all caches after changing this file.
 */
const VERSION = "v1"
const STATIC_CACHE = `static-${VERSION}`
const PAGES_CACHE = `pages-${VERSION}`

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== PAGES_CACHE)
          .map((key) => caches.delete(key)),
      )
      await self.clients.claim()
    })(),
  )
})

// Sent from src/lib/pwa.ts on sign-out so cached (user-specific) pages
// don't outlive the session on shared devices.
self.addEventListener("message", (event) => {
  if (event.data === "clear-pages-cache") {
    event.waitUntil(caches.delete(PAGES_CACHE))
  }
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith("/api/")) return

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request))
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request))
  }
})

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) cache.put(request, response.clone())
  return response
}

async function networkFirst(request) {
  const cache = await caches.open(PAGES_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok && !response.redirected) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) return cached
    throw error
  }
}
