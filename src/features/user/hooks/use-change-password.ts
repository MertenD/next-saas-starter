import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
}

/** Changes the signed-in user's password via Better Auth (`authClient.changePassword`), with toast feedback. */
export const useChangePassword = () => {
  const t = useTranslations("settings.account.changePassword")

  return useMutation({
    mutationFn: async (values: ChangePasswordInput) => {
      const { data, error } = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: false,
      })
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      toast.success(t("success"))
    },
    onError: (err) => toast.error(err.message),
  })
}
