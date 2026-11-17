"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { clearChatSession } from "@/features/demo/ai/model/chat-session"
import { authClient } from "@/lib/auth-client"
import { clearPwaPageCache } from "@/lib/pwa"
import { clearPersistedQueryCache } from "@/trpc/client"

/**
 * The single sign-out flow. Ends the Better Auth session, then wipes every
 * piece of user-specific client state before redirecting to `/login`: the
 * service worker's page cache, the in-memory React Query cache and the
 * IndexedDB-persisted copy of it. Always use this instead of calling
 * `authClient.signOut` directly, otherwise the next person on a shared device
 * could see the previous user's cached data.
 */
export function useSignOut() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return () =>
    authClient.signOut({
      fetchOptions: {
        onSuccess: async () => {
          clearPwaPageCache()
          clearChatSession()
          queryClient.clear()
          await clearPersistedQueryCache()
          router.push("/login")
        },
      },
    })
}
