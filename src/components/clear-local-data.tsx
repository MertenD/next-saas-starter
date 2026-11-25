"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { clearChatSession } from "@/features/demo/ai/model/chat-session"
import { clearPwaPageCache } from "@/lib/pwa"
import { clearPersistedQueryCache } from "@/trpc/client"

/**
 * Wipes everything user-specific that the browser cached (service worker
 * pages, React Query cache and its IndexedDB copy, the AI chat) when it
 * mounts. Rendered by the `(auth)` layout: whoever lands on a sign-in page is
 * signed out, so nothing personal should remain in this browser. This covers
 * the paths that do not go through `useSignOut()`: an expired session, or an
 * account deleted from the confirmation email (a different tab or device).
 */
export function ClearLocalData() {
  const queryClient = useQueryClient()

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    clearPwaPageCache()
    clearChatSession()
    queryClient.clear()
    void clearPersistedQueryCache()
  }, [])

  return null
}
