# Service Worker

The app ships a small, hand-written service worker (`public/sw.js`). It makes the app installable ("Add to home screen"), keeps already-visited pages opening offline, and speeds up repeat visits by serving the content-hashed Next.js files from a local cache. This page explains how it works, what it caches and why, how updates roll out, and how to debug it. For the surrounding PWA pieces (manifest, icons) see [Integrations](./integrations.md#pwa-installable-app).

## The pieces

| File | Role |
|---|---|
| `public/sw.js` | The service worker itself: plain JavaScript, no build step. |
| `src/components/pwa-register.tsx` | Registers `/sw.js` once, from the root layout. **Production only.** |
| `src/lib/pwa.ts` | `clearPwaPageCache()`: tells the worker to drop its cached pages. |
| `src/features/auth/hooks/use-sign-out.ts` | Calls `clearPwaPageCache()` on sign-out (together with clearing the React Query cache). |
| `src/app/manifest.ts` | Web app manifest, makes the app installable. |

There is no `next-pwa` or Workbox plugin: the webpack-based PWA plugins do not support Turbopack, and the needs here are small. See [Limits](#limits) for what that means.

## What it does, request by request

The worker only looks at requests that are **GET**, **same-origin** and **not under `/api/`**. Everything else (POST requests, tRPC and Better Auth calls, cross-origin requests such as analytics) goes straight to the network and is never touched.

| Request | Strategy | Why |
|---|---|---|
| `/_next/static/*` (JS, CSS, fonts built by Next.js) | **Cache-first** | File names contain a content hash, so a cached file is never stale. Repeat visits load them without the network. |
| Page navigations (`request.mode === "navigate"`) | **Network-first**, with a 4 s timeout and a cache fallback | The newest page is preferred. If the network is down or slow, the last cached copy of that page opens instead. |
| Everything else (images, `manifest.webmanifest`, RSC fetches, ...) | Not intercepted | Left to the browser's normal HTTP cache. |

### Navigation details

1. The worker starts the network request.
2. If it answers within `NETWORK_TIMEOUT_MS` (4000 ms), the response is returned and, if it is a plain `200` that was not a redirect, stored in the page cache for next time.
3. If the network is offline or too slow, the cached copy of that URL is returned instead.
4. If nothing is cached for that URL, the worker keeps waiting for the network (or surfaces its error). There is no custom offline page: a never-visited page offline shows the browser's own error page.

A late network response still updates the cache after the cached copy was shown, so the next visit is fresh.

### Cache limits

Both caches are capped so they cannot grow forever across deployments (every deploy has new hashed file names):

- Static cache: at most `MAX_STATIC_ENTRIES` (150) files.
- Page cache: at most `MAX_PAGE_ENTRIES` (30) pages.

When a cache is full, the oldest entries are evicted first (a cache lists its entries in insertion order).

## Offline: what actually works

The cached **HTML** of a page is only half of what you see. The data comes from React Query, which is persisted to IndexedDB for 7 days (`src/trpc/client.tsx`) and runs queries with `networkMode: "offlineFirst"`. Together:

- A page you visited before opens offline and shows its last-known data.
- Queries cannot refresh while offline, and **mutations fail** (they use `networkMode: "always"` and need the server). There is no offline queue.
- `/api/*` is never cached by the worker, so nothing that depends on a live API response works offline.

## Updates and versions

```js
const VERSION = "v2"
const STATIC_CACHE = `static-${VERSION}`
const PAGES_CACHE = `pages-${VERSION}`
```

1. Browsers re-check `/sw.js` on navigation. When the file changed (byte-for-byte), the new worker installs.
2. `install` calls `skipWaiting()`, so the new worker does not wait for all tabs to close.
3. `activate` deletes every cache whose name is not the current `STATIC_CACHE` / `PAGES_CACHE`, then calls `clients.claim()` so open tabs are controlled by the new worker right away.

**Bump `VERSION` whenever you change what or how the worker caches.** The cache names change with it, so the old caches are removed on activation. Changing the worker's code without bumping `VERSION` keeps old entries around under the old names.

## Privacy: cached pages are user-specific

The page cache holds HTML rendered for a signed-in user. On a shared device the next person must not be able to open it offline, so:

- Sign-out goes through `useSignOut()`, which calls `clearPwaPageCache()`. That posts a `"clear-pages-cache"` message to the worker, which deletes the whole page cache.
- The static cache is not cleared on sign-out: it holds only public, content-hashed build files.
- `clearPwaPageCache()` does nothing when no worker controls the page (for example in development).

**Known gap:** when a session simply expires (no explicit sign-out), the cached pages stay until the next sign-out, a `VERSION` bump, or cache eviction. If this matters for your product, call `clearPwaPageCache()` wherever your app learns that a session ended (for example when an API call returns `401`).

Never cache `/api/*` responses or add authenticated data to the static cache.

## Testing it

The worker is registered only in production builds. A service worker in `next dev` would serve stale bundles and fight with hot reloading.

```bash
bun run build
```

```bash
bun run start
```

Then open the app (`http://localhost:3000` counts as a secure context, so no HTTPS is needed locally) and check in the browser DevTools, under **Application**:

- **Service Workers**: shows the registered worker and its status. "Update on reload" forces a re-check, "Offline" simulates no network, "Unregister" removes it.
- **Cache Storage**: shows `static-v2` and `pages-v2` and their entries.
- Visit a few pages, tick "Offline", reload: visited pages open, others show the browser error page.
- Sign out and look at Cache Storage again: `pages-v2` should be gone.

## Troubleshooting

**Weird errors, reload loops or broken hot reload in `bun run dev` after you ran the production build.** A worker registered on `localhost:3000` stays registered when you switch back to the dev server, because the origin is the same. It then serves `/_next/static/*` cache-first, which can hand the dev server stale or mismatched chunks. Fix: DevTools, Application, Service Workers, **Unregister**, then Storage, **Clear site data** (or use a private window / another port for production tests).

**My change to `sw.js` has no effect.** Check that `VERSION` was bumped, reload twice (the new worker takes over after activation), or use "Update on reload" in DevTools.

**An old page shows after a deploy.** Pages are network-first, so this only happens offline or when the network was slower than 4 s. The next successful load updates the cache.

## Limits

The worker is deliberately minimal. It has **no** precaching of the app shell, no offline page, no background sync, no push notifications and no offline mutation queue. If you need those, look at [Serwist](https://serwist.pages.dev/) and its Turbopack support instead of extending `sw.js` by hand.

## Removing it

If you do not want a PWA, follow the PWA row in [Make It Yours](./make-it-yours.md) (it also lists the manifest, the icon route and `appleWebApp` in the root layout). For the worker that means deleting `public/sw.js`, `src/components/pwa-register.tsx` (and its use in the root layout), and `src/lib/pwa.ts` with its call in `use-sign-out.ts`. Users who already have the worker installed keep it until it is unregistered, so before deleting the file, ship a version of `sw.js` for a while that unregisters itself (`self.registration.unregister()`) and clears its caches.
