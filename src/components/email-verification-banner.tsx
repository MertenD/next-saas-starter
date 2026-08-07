"use client"

import { MailWarningIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useResendVerificationEmail } from "@/features/user/hooks/use-resend-verification-email"
import { authClient } from "@/lib/auth-client"

/**
 * Dismissible-by-verification banner shown above dashboard content while
 * the signed-in user's email is unverified; renders nothing once verified
 * or when there's no session. Mounted once in `AppShell` so it appears on
 * every dashboard page rather than being added per-page.
 */
export default function EmailVerificationBanner() {
  const t = useTranslations("common.emailVerificationBanner")
  const { data: session } = authClient.useSession()
  const { mutate: resendVerification, isPending } = useResendVerificationEmail()

  if (!session || session.user.emailVerified) {
    return null
  }

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-linear-to-br from-chart-1/10 to-chart-2/10">
      <MailWarningIcon />
      <AlertTitle>{t("title")}</AlertTitle>
      <AlertDescription>
        <p>{t("description")}</p>
      </AlertDescription>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="col-start-2 mt-2 w-fit"
        disabled={isPending}
        onClick={() => resendVerification(session.user.email)}
      >
        {t("resendButton")}
      </Button>
    </Alert>
  )
}
