"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { useTRPC } from "@/trpc/client"

/** The user's active sessions (`trpc.privacy.sessions`). */
export const useSessions = () => {
  const trpc = useTRPC()
  return useQuery(trpc.privacy.sessions.queryOptions())
}

/** Sign-out mutations for other devices; both refresh the sessions list and show a toast. */
export function useRevokeSessions() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const t = useTranslations("settings.privacy.sessions")

  const refresh = () =>
    queryClient.invalidateQueries(trpc.privacy.sessions.pathFilter())

  const onError = () => toast.error(t("error"))

  const revokeOne = useMutation(
    trpc.privacy.revokeSession.mutationOptions({
      onSuccess: () => {
        toast.success(t("revokedToast"))
        return refresh()
      },
      onError,
    }),
  )

  const revokeOthers = useMutation(
    trpc.privacy.revokeOtherSessions.mutationOptions({
      onSuccess: () => {
        toast.success(t("revokedOthersToast"))
        return refresh()
      },
      onError,
    }),
  )

  return { revokeOne, revokeOthers }
}
