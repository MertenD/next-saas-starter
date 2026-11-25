"use client"

import { MonitorSmartphoneIcon } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { useState } from "react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyView, ErrorView } from "@/components/entity-components"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useRevokeSessions,
  useSessions,
} from "@/features/privacy/hooks/use-sessions"
import { describeUserAgent } from "@/features/privacy/model/user-agent"

/**
 * The user's active sessions (devices) with a "sign out" button per device and
 * one for all other devices. Covers the four states: skeleton while loading,
 * `ErrorView` with retry, an empty state, and the list.
 */
export function SessionsCard() {
  const t = useTranslations("settings.privacy.sessions")
  const format = useFormatter()
  const { data, isPending, isError, refetch } = useSessions()
  const { revokeOne, revokeOthers } = useRevokeSessions()
  const [confirmOthers, setConfirmOthers] = useState(false)

  const hasOthers = data?.some((session) => !session.isCurrent) ?? false

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPending && (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {isError && <ErrorView onRetry={() => refetch()} />}

        {data && data.length === 0 && (
          <EmptyView
            title={t("emptyTitle")}
            message={t("emptyDescription")}
            action={{ label: t("reload"), onClick: () => refetch() }}
          />
        )}

        {data && data.length > 0 && (
          <>
            <ul className="divide-y rounded-md border">
              {data.map((session) => {
                const device = describeUserAgent(session.userAgent)
                const deviceLabel = device
                  ? t("device", { browser: device.browser, os: device.os })
                  : t("unknownDevice")

                return (
                  <li key={session.id} className="flex items-center gap-3 p-4">
                    <MonitorSmartphoneIcon className="size-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-title-sm">
                        {deviceLabel}
                        {session.isCurrent && (
                          <Badge variant="secondary">{t("thisDevice")}</Badge>
                        )}
                      </p>
                      <p className="text-body-sm text-muted-foreground">
                        {t("signedIn", {
                          date: format.dateTime(session.createdAt, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }),
                        })}
                        {session.ipAddress && ` · ${session.ipAddress}`}
                      </p>
                    </div>
                    {!session.isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={t("revokeLabel", { device: deviceLabel })}
                        disabled={revokeOne.isPending}
                        onClick={() =>
                          revokeOne.mutate({ sessionId: session.id })
                        }
                      >
                        {t("revoke")}
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
            {hasOthers && (
              <Button variant="outline" onClick={() => setConfirmOthers(true)}>
                {t("revokeOthers")}
              </Button>
            )}
          </>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmOthers}
        onOpenChange={setConfirmOthers}
        title={t("revokeOthersTitle")}
        description={t("revokeOthersDescription")}
        confirmLabel={t("revokeOthers")}
        isLoading={revokeOthers.isPending}
        onConfirm={() =>
          revokeOthers.mutate(undefined, {
            onSuccess: () => setConfirmOthers(false),
          })
        }
      />
    </Card>
  )
}
