"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Tracks whether the page is going away (reload, closing the tab, leaving for
 * another site). When it does, the browser aborts the running fetch, which
 * flips the chat status to "error" or "ready" while the old page's JS still
 * runs. Two things must not happen then, so the chat hook asks this one:
 * - Saving the conversation: it would store the cut-off answer. After the
 *   refresh the resume would add the full answer below it, and a regenerate
 *   would feed the half answer back to the model as a prefix to continue.
 * - Showing the error: the aborted fetch is reported as a "network error",
 *   which would flash the error message with its retry button until the page
 *   is gone.
 *
 * Returns the flag twice: `leavingRef` for effects (always current, no stale
 * closure) and `isLeaving` as state, which re-renders the UI.
 */
export function usePageLeaving() {
  const leavingRef = useRef(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    const leave = () => {
      leavingRef.current = true
      setIsLeaving(true)
    }
    // A page restored from the back/forward cache is alive again.
    const stay = () => {
      leavingRef.current = false
      setIsLeaving(false)
    }
    window.addEventListener("beforeunload", leave)
    window.addEventListener("pagehide", leave)
    window.addEventListener("pageshow", stay)
    return () => {
      window.removeEventListener("beforeunload", leave)
      window.removeEventListener("pagehide", leave)
      window.removeEventListener("pageshow", stay)
    }
  }, [])

  return { leavingRef, isLeaving }
}
