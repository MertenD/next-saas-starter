"use client"

import { PlayIcon, ZapIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { RunStatusBadge } from "@/features/demo/inngest/components/run-status-badge"
import type { Run } from "@/features/demo/inngest/model/inngest-demo"

type RunHistoryCardProps = {
  runs: Run[]
  onTrigger: () => void
  isPending: boolean
}

export function RunHistoryCard({
  runs,
  onTrigger,
  isPending,
}: RunHistoryCardProps) {
  const t = useTranslations("demo.inngest")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("triggeredRunsTitle")}</CardTitle>
        <CardDescription>{t("triggeredRunsDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ZapIcon />
              </EmptyMedia>
              <EmptyTitle>{t("noRunsTitle")}</EmptyTitle>
              <EmptyDescription>{t("noRunsDescription")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" onClick={onTrigger} disabled={isPending}>
                <PlayIcon className="mr-2 h-4 w-4" />
                {isPending ? t("triggeringButton") : t("triggerButton")}
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <ul className="space-y-2">
            {runs.map((run) => (
              <li
                key={run.eventId}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {run.eventId}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("triggeredAtLabel", { time: run.triggeredAt })}
                  </p>
                </div>
                <RunStatusBadge eventId={run.eventId} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
