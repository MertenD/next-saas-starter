"use client"

import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

/**
 * Starts the account deletion: Better Auth emails a confirmation link, and the
 * account is only deleted once the user opens it (see `user.deleteUser` in
 * `src/lib/auth.ts`). The link sends the user to `/login` afterwards. This
 * hook therefore does not sign anybody out, the session stays until the link
 * is used.
 */
export function useDeleteAccount() {
  const t = useTranslations("settings.privacy.delete")

  return useMutation({
    mutationFn: async () => {
      const { error } = await authClient.deleteUser({ callbackURL: "/login" })
      if (error) throw new Error(error.message || t("error"))
    },
    onSuccess: () => toast.success(t("emailSent")),
    onError: (error) => toast.error(error.message || t("error")),
  })
}
