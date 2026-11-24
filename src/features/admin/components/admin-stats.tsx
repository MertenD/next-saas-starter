"use client"

import { CreditCardIcon } from "lucide-react"
import Link from "next/link"
import { useFormatter, useTranslations } from "next-intl"
import { ErrorView } from "@/components/entity-components"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/features/admin/components/stat-card"
import { useAdminStats } from "@/features/admin/hooks/use-admin-stats"

/** Number of tiles per section, used to shape the loading skeleton. */
const SKELETON_TILES = 3

/**
 * The admin overview: user counts (from the database) and billing numbers
 * (live from Polar). Billing has its own states inside the section: not
 * configured (empty, with a link), failed (error with retry), or the numbers.
 * Polar reports money in cents (USD).
 */
export function AdminStats() {
  const t = useTranslations("admin.stats")
  const format = useFormatter()
  const { data, isPending, isError, refetch } = useAdminStats()

  if (isPending) {
    return (
      <div className="flex flex-col gap-8">
        {[0, 1].map((section) => (
          <div
            key={`stats-skeleton-${section}`}
            className="flex flex-col gap-4"
          >
            <Skeleton className="h-6 w-40" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: SKELETON_TILES }, (_, i) => i).map((i) => (
                <Skeleton
                  key={`stats-tile-skeleton-${section}-${i}`}
                  className="h-28 rounded-lg"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return <ErrorView onRetry={() => refetch()} />
  }

  const { users, billing } = data
  const money = (cents: number) =>
    format.number(cents / 100, { style: "currency", currency: "USD" })
  const count = (value: number) => format.number(value)

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-display-sm">{t("users.title")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label={t("users.total")} value={count(users.total)} />
          <StatCard
            label={t("users.new")}
            value={count(users.newLast30Days)}
            hint={t("last30Days")}
          />
          <StatCard label={t("users.verified")} value={count(users.verified)} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-display-sm">{t("billing.title")}</h2>
        {billing.status === "disabled" && (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CreditCardIcon />
              </EmptyMedia>
              <EmptyTitle>{t("billing.disabledTitle")}</EmptyTitle>
              <EmptyDescription>
                {t("billing.disabledDescription")}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" asChild>
                <Link href="/settings?tab=subscription">
                  {t("billing.disabledAction")}
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}
        {billing.status === "error" && (
          <ErrorView
            message={t("billing.errorDescription")}
            onRetry={() => refetch()}
          />
        )}
        {billing.status === "ok" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label={t("billing.revenue")}
              value={money(billing.revenue)}
              hint={t("last30Days")}
            />
            <StatCard label={t("billing.mrr")} value={money(billing.mrr)} />
            <StatCard
              label={t("billing.active")}
              value={count(billing.activeSubscriptions)}
            />
            <StatCard
              label={t("billing.new")}
              value={count(billing.newSubscriptions)}
              hint={t("last30Days")}
            />
            <StatCard
              label={t("billing.canceled")}
              value={count(billing.canceledSubscriptions)}
              hint={t("last30Days")}
            />
          </div>
        )}
      </section>
    </div>
  )
}
