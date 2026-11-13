/**
 * Asks the service worker to drop its cached pages. Call this on sign-out:
 * the cached HTML is user-specific and must not be readable offline by the
 * next person on a shared device. No-op when no service worker is active.
 */
export function clearPwaPageCache() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return
  }
  navigator.serviceWorker.controller?.postMessage("clear-pages-cache")
}
