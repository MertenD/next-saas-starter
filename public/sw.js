/*
 * Minimal hand-written service worker (no build plugin: Next.js 16 builds
 * with Turbopack, which the webpack-based next-pwa plugins don't support).
 * Registered by src/components/pwa-register.tsx in production only.
 *
 * Strategy:
 *  - /_next/static/* and icons: cache-first (files are content-hashed)
 *  - page navigations: network-first, falling back to the last cached copy
 *    so already-visited pages still open offline. On a slow or hanging
 *    network the cached copy is used after NETWORK_TIMEOUT_MS instead of
 *    leaving the user on a blank page.
 *  - /api/* and everything non-GET / cross-origin: never touched
 *
 * Both caches are capped (oldest entries are evicted first), so they cannot
 * grow without bound across deployments.
 *
 * Bump VERSION to invalidate all caches after changing this file.
 */
const VERSION = "v3"
const STATIC_CACHE = `static-${VERSION}`
const PAGES_CACHE = `pages-${VERSION}`

const MAX_STATIC_ENTRIES = 150
const MAX_PAGE_ENTRIES = 30
const NETWORK_TIMEOUT_MS = 4000

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

/** Deletes the oldest entries of a cache until at most `maxEntries` remain (`keys()` is in insertion order). */
async function trimCache(cache, maxEntries) {
  const keys = await cache.keys()
  const excess = keys.length - maxEntries
  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i])
  }
}

/** Rejects after `ms`, to race against a slow network request. */
function timeout(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("network timeout")), ms)
  })
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    await cache.put(request, response.clone())
    await trimCache(cache, MAX_STATIC_ENTRIES)
  }
  return response
}

async function networkFirst(request) {
  const cache = await caches.open(PAGES_CACHE)

  const network = fetch(request).then(async (response) => {
    if (response.ok && !response.redirected) {
      await cache.put(request, response.clone())
      await trimCache(cache, MAX_PAGE_ENTRIES)
    }
    return response
  })
  // Avoid an unhandled rejection when the cached copy won the race below
  network.catch(() => {})

  try {
    return await Promise.race([network, timeout(NETWORK_TIMEOUT_MS)])
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) return cached
    // Nothing cached: keep waiting for the network (or surface its error)
    if (error instanceof Error && error.message === "network timeout") {
      return network
    }
    throw error
  }
}
