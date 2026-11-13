import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { useErrorMessage } from "@/hooks/use-error-message"
import { authClient } from "@/lib/auth-client"

/** Re-sends the email verification link via Better Auth. Used by `EmailVerificationBanner` and the account settings page. */
export const useResendVerificationEmail = () => {
  const t = useTranslations("settings.account.verification")
  const getErrorMessage = useErrorMessage()

  return useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/settings?tab=account",
      })
      if (error) throw new Error(getErrorMessage(error))
      return data
    },
    onSuccess: () => {
      toast.success(t("resendSuccess"))
    },
    onError: (err) => toast.error(err.message),
  })
}
