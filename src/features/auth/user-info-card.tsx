"use client"

import {
  CreditCardIcon,
  LogOutIcon,
  SettingsIcon,
  StarIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { usePlausible } from "next-plausible"
import { useState } from "react"
import { useDashboard } from "@/components/dashboard-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSignOut } from "@/features/auth/hooks/use-sign-out"
import { useHasActiveSubscription } from "@/features/subscriptions/hooks/use-subscription"
import { useResendVerificationEmail } from "@/features/user/hooks/use-resend-verification-email"
import type { PlausibleEvents } from "@/lib/analytics"
import { authClient } from "@/lib/auth-client"

export default function UserInfoCard() {
  const router = useRouter()
  const signOut = useSignOut()
  const { user } = useDashboard()
  const t = useTranslations("auth.userInfo")

  const displayName = user.name.split("@")[0]
  const avatarImage = user.image ?? undefined

  return (
    <div className="rounded-lg border bg-linear-to-br from-chart-1/10 to-chart-2/10 p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarImage} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
              {displayName[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-semibold">{displayName}</p>
            <p className="text-xs text-muted-foreground">{t("plan")}</p>
          </div>
        </div>

        <div className="space-y-1">
          <UpgradeToProButton />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-start gap-2 px-2 text-xs font-medium"
            onClick={() => authClient.customer.portal()}
          >
            <CreditCardIcon className="h-4 w-4" />
            {t("billingLabel")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-start gap-2 px-2 text-xs font-medium"
            onClick={() => router.push("/settings")}
          >
            <SettingsIcon className="h-4 w-4" />
            {t("settingsLabel")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-start gap-2 px-2 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={signOut}
          >
            <LogOutIcon className="h-4 w-4" />
            {t("logoutLabel")}
          </Button>
        </div>
      </div>
    </div>
  )
}

function UpgradeToProButton() {
  const { hasActiveSubscription, isLoading } = useHasActiveSubscription()
  const { user } = useDashboard()
  const plausible = usePlausible<PlausibleEvents>()
  const t = useTranslations("auth.userInfo")
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const { mutate: resendVerification, isPending: isResending } =
    useResendVerificationEmail()

  if (isLoading || hasActiveSubscription) {
    return null
  }

  function handleClick() {
    if (!user.emailVerified) {
      setVerifyDialogOpen(true)
      return
    }
    plausible("Upgrade Clicked")
    authClient.checkout({ slug: "pro" })
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-full justify-start gap-2 px-2 text-xs font-medium"
        onClick={handleClick}
      >
        <StarIcon className="h-4 w-4" />
        {t("upgradeLabel")}
      </Button>
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("verifyDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("verifyDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerifyDialogOpen(false)}
            >
              {t("verifyDialog.cancelButton")}
            </Button>
            <Button
              disabled={isResending}
              onClick={() => resendVerification(user.email)}
            >
              {t("verifyDialog.resendButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
