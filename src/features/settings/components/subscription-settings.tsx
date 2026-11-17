"use client"

import { CreditCardIcon, StarIcon } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { toast } from "sonner"
import { useDashboard } from "@/components/dashboard-context"
import { ErrorView } from "@/components/entity-components"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useHasActiveSubscription } from "@/features/subscriptions/hooks/use-subscription"
import { authClient } from "@/lib/auth-client"

/**
 * Settings tab showing the current plan and the matching action: upgrade to
 * Pro (Polar checkout) or open the billing portal. When Polar isn't
 * configured the app runs in mock mode (everyone is premium), so the tab
 * explains that instead of offering buttons that would fail.
 */
export default function SubscriptionSettings() {
  const t = useTranslations("settings.subscription")
  const format = useFormatter()
  const { user, polarEnabled } = useDashboard()
  const { hasActiveSubscription, subscription, isLoading, isError, refetch } =
    useHasActiveSubscription()

  function handleUpgrade() {
    if (!user.emailVerified) {
      toast.error(t("verifyEmailFirst"))
      return
    }
    authClient.checkout({ slug: "pro" })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-10 w-40" />
        </CardContent>
      </Card>
    )
  }

  if (!polarEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("billingDisabled")}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isError) {
    return <ErrorView message={t("error.title")} onRetry={() => refetch()} />
  }

  const renewsAt = subscription?.currentPeriodEnd

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {hasActiveSubscription ? (
          <>
            <div className="flex items-center gap-2">
              <Badge>{t("proBadge")}</Badge>
              <span className="text-muted-foreground text-sm">
                {t("active")}
              </span>
            </div>
            {renewsAt && (
              <p className="text-muted-foreground text-sm">
                {t("renewsOn", {
                  date: format.dateTime(new Date(renewsAt), {
                    dateStyle: "medium",
                  }),
                })}
              </p>
            )}
          </>
        ) : (
          <>
            <Badge variant="secondary">{t("freeBadge")}</Badge>
            <p className="text-muted-foreground text-sm">{t("upgradeHint")}</p>
          </>
        )}
      </CardContent>
      <CardFooter>
        {hasActiveSubscription ? (
          <Button
            variant="outline"
            onClick={() => authClient.customer.portal()}
          >
            <CreditCardIcon />
            {t("manageBilling")}
          </Button>
        ) : (
          <Button onClick={handleUpgrade}>
            <StarIcon />
            {t("upgradeButton")}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
