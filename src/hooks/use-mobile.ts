import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

function getSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches
}

function getServerSnapshot() {
  return false
}

/**
 * Tracks whether the viewport is currently below the mobile breakpoint
 * (768px), updating live via a `matchMedia` listener (`useSyncExternalStore`).
 * Returns `false` on the server and during hydration, so avoid using it to
 * conditionally render content that must match between server and client -
 * prefer CSS breakpoints for that; use this hook for behavior that genuinely
 * needs a JS conditional (e.g. switching a sidebar to a sheet).
 */
export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
