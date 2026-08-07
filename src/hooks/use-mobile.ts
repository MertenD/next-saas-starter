import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Tracks whether the viewport is currently below the mobile breakpoint
 * (768px), updating live via a `matchMedia` listener. Returns `false` during
 * the initial server-rendered pass (before the effect runs), so avoid using
 * it to conditionally render content that must match between server and
 * client - prefer CSS breakpoints for that; use this hook for behavior that
 * genuinely needs a JS conditional (e.g. switching a sidebar to a sheet).
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
