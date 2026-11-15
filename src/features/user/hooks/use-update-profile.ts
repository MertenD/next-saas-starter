import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { useErrorMessage } from "@/hooks/use-error-message"
import { authClient } from "@/lib/auth-client"
import { useTRPC } from "@/trpc/client"

type UpdateProfileInput = {
  name: string
  image?: string
}

/**
 * Updates the signed-in user's name/image via Better Auth, then invalidates
 * `trpc.user.me` and refreshes the router so the server-resolved dashboard
 * context (sidebar name and avatar) picks up the change.
 */
export const useUpdateProfile = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()
  const t = useTranslations("settings.account.profile")
  const getErrorMessage = useErrorMessage()

  return useMutation({
    mutationFn: async (values: UpdateProfileInput) => {
      const { data, error } = await authClient.updateUser(values)
      if (error) throw new Error(getErrorMessage(error))
      return data
    },
    onSuccess: () => {
      toast.success(t("updateSuccess"))
      queryClient.invalidateQueries(trpc.user.me.queryOptions())
      router.refresh()
    },
    onError: (err) => toast.error(err.message),
  })
}
