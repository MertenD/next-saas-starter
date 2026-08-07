"use client"

import { CheckCircleIcon, HelpCircleIcon, XCircleIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useJobStatus } from "@/features/demo/inngest/hooks/use-job-status"

export function RunStatusBadge({ eventId }: { eventId: string }) {
  const t = useTranslations("demo.inngest")
  const { latestData, error } = useJobStatus(eventId)

  if (error) {
    return (
      <Badge variant="outline" className="gap-1" title={error.message}>
        <HelpCircleIcon className="size-3" />
        {t("statusUnknown")}
      </Badge>
    )
  }

  const update = latestData?.data

  if (!update || update.status === "running") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Spinner className="size-3" />
        {update?.message ?? t("statusQueued")}
      </Badge>
    )
  }

  if (update.status === "completed") {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircleIcon className="size-3" />
        {t("statusCompleted")}
      </Badge>
    )
  }

  return (
    <Badge variant="destructive" className="gap-1" title={update.message}>
      <XCircleIcon className="size-3" />
      {t("statusFailed")}
    </Badge>
  )
}
