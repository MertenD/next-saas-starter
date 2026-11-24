"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { useTRPC } from "@/trpc/client"

/**
 * The admin mutations for one user row (change role, ban, unban, delete).
 * Each one refreshes the users list and the overview numbers and shows a
 * toast; dialogs are closed by the caller through `mutate(vars, { onSuccess })`.
 */
export function useAdminUserActions() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const t = useTranslations("admin.users.toasts")

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries(trpc.admin.users.pathFilter()),
      queryClient.invalidateQueries(trpc.admin.stats.pathFilter()),
    ])

  const onError = (error: { message: string }) =>
    toast.error(t("error"), { description: error.message })

  const setRole = useMutation(
    trpc.admin.setRole.mutationOptions({
      onSuccess: () => {
        toast.success(t("roleChanged"))
        return refresh()
      },
      onError,
    }),
  )

  const ban = useMutation(
    trpc.admin.ban.mutationOptions({
      onSuccess: () => {
        toast.success(t("banned"))
        return refresh()
      },
      onError,
    }),
  )

  const unban = useMutation(
    trpc.admin.unban.mutationOptions({
      onSuccess: () => {
        toast.success(t("unbanned"))
        return refresh()
      },
      onError,
    }),
  )

  const remove = useMutation(
    trpc.admin.remove.mutationOptions({
      onSuccess: () => {
        toast.success(t("deleted"))
        return refresh()
      },
      onError,
    }),
  )

  return { setRole, ban, unban, remove }
}
