"use client"

import { useTranslations } from "next-intl"
import { ErrorView } from "@/components/entity-components"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import ChangePasswordForm from "@/features/settings/components/change-password-form"
import EmailVerificationBadge from "@/features/settings/components/email-verification-badge"
import ProfileForm from "@/features/settings/components/profile-form"
import { useCurrentUser } from "@/features/user/hooks/use-user"

export default function AccountSettings() {
  const t = useTranslations("settings.account")
  const { data: user, isPending, isError, refetch } = useCurrentUser()

  if (isPending) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-1/3" />
        </CardContent>
      </Card>
    )
  }

  if (isError || !user) {
    return <ErrorView message={t("error.title")} onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProfileForm key={user.id} user={user} />
          <Separator />
          <EmailVerificationBadge
            email={user.email}
            verified={user.emailVerified}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("changePassword.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
