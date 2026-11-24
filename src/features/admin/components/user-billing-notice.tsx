"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { Spinner } from "@/components/ui/spinner"
import { useTRPC } from "@/trpc/client"

type UserBillingNoticeProps = {
  userId: string
  /** What the admin is about to do: the consequences for the Polar subscription differ. */
  action: "ban" | "delete"
}

/**
 * Shown inside the ban/delete dialogs: tells the admin what the action does to
 * the user's Polar subscription. Ban leaves it running (still charged, nothing
 * refunded), delete cancels it immediately (also without a refund). Renders
 * only elements that are valid inside a `<p>` (the dialog description).
 * Mounted only while its dialog is open, so the Polar lookup happens on demand.
 */
export function UserBillingNotice({ userId, action }: UserBillingNoticeProps) {
  const t = useTranslations("admin.billing")
  const trpc = useTRPC()
  const { data, isPending, isError } = useQuery(
    trpc.admin.billing.queryOptions({ userId }),
  )

  if (isPending) {
    return (
      <span className="mt-3 flex items-center gap-2 text-body-sm">
        <Spinner />
        {t("checking")}
      </span>
    )
  }

  if (isError) {
    return (
      <span className="mt-3 block rounded-md border border-destructive/40 bg-muted p-3 text-body-sm text-foreground">
        {t("error")}
      </span>
    )
  }

  if (!data.polarEnabled) return null

  if (data.activeSubscriptions === 0) {
    return (
      <span className="mt-3 block rounded-md border bg-muted p-3 text-body-sm text-foreground">
        {t("noSubscription")}
      </span>
    )
  }

  return (
    <span className="mt-3 block rounded-md border border-destructive/40 bg-muted p-3 text-body-sm text-foreground">
      {t(action === "ban" ? "activeBan" : "activeDelete", {
        count: data.activeSubscriptions,
      })}
    </span>
  )
}
