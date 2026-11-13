"use client"

import { useEffect } from "react"

/**
 * Registers the service worker (`public/sw.js`) so the app is installable
 * and already-visited pages keep working offline. Production only - a
 * service worker in `next dev` caches stale bundles and makes HMR confusing.
 * Mounted once in `src/app/layout.tsx`; renders nothing.
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed:", error)
    })
  }, [])

  return null
}
