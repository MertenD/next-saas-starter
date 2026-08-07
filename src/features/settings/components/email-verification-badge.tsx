"use client"

import { CheckIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useResendVerificationEmail } from "@/features/user/hooks/use-resend-verification-email"

type EmailVerificationBadgeProps = {
  email: string
  verified: boolean
}

export default function EmailVerificationBadge({
  email,
  verified,
}: EmailVerificationBadgeProps) {
  const t = useTranslations("settings.account.verification")
  const { mutate: resendVerification, isPending } = useResendVerificationEmail()

  if (verified) {
    return (
      <Badge variant="secondary">
        <CheckIcon />
        {t("verifiedBadge")}
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline">{t("unverifiedBadge")}</Badge>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => resendVerification(email)}
      >
        {t("resendButton")}
      </Button>
    </div>
  )
}
